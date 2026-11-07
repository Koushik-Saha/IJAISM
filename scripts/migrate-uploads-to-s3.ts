/**
 * migrate-uploads-to-s3.ts
 *
 * One-time migration tool: uploads the local `public/uploads/` tree to S3 so
 * the files can be served from object storage instead of the app bundle.
 *
 * Why this exists (C5K cost investigation, Nov 2026):
 *   - `public/uploads/` holds ~306 files / ~222 MB committed to git, which
 *     bloats the repo, every clone, and every deployment.
 *   - The app already serves S3 objects via `/api/media/[...]` (pre-signed
 *     redirect) and the gated route `/api/files/download/[...]` (S3-first
 *     since the Leak-1 fix). This script moves the remaining local files so
 *     those code paths cover everything.
 *
 * Behavior:
 *   - Walks `public/uploads/` recursively; the S3 key is the path relative
 *     to `public/uploads/` with forward slashes (e.g. `books/<file>.pdf`),
 *     matching the key layout the upload route and media route already use.
 *   - Skips objects that already exist in S3 with the same byte size.
 *   - Sets Content-Type by extension; PDFs and images get
 *     `Content-Disposition: inline` so browsers display them.
 *   - Prints a summary and every failure. It does NOT delete local files and
 *     does NOT touch the database — DB paths like `/uploads/<...>` keep
 *     working because the download/media routes resolve them to S3 keys.
 *
 * Usage:
 *   npx tsx scripts/migrate-uploads-to-s3.ts [--dry-run]
 *
 * Env (same names/defaults as lib/s3.ts):
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, sep } from 'path';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const UPLOADS_ROOT = join(process.cwd(), 'public', 'uploads');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'koushik-freedomshippingllc-reports';

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const INLINE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('Missing AWS credentials in env (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).');
    process.exit(1);
  }

  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Source: ${UPLOADS_ROOT}`);
  console.log(DRY_RUN ? 'Mode: DRY RUN (nothing will be uploaded)\n' : 'Mode: UPLOAD\n');

  const files = await walk(UPLOADS_ROOT);
  console.log(`Found ${files.length} local files.\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;
  const failures: string[] = [];

  for (const filePath of files) {
    const key = relative(UPLOADS_ROOT, filePath).split(sep).join('/');
    const ext = key.split('.').pop()?.toLowerCase() || '';
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    try {
      const { size } = await stat(filePath);

      // Skip if the same object (by size) is already in S3.
      let existsSameSize = false;
      try {
        const head = await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        existsSameSize = head.ContentLength === size;
      } catch {
        existsSameSize = false; // Not there (or unreadable) — proceed to upload.
      }
      if (existsSameSize) {
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[dry-run] would upload ${key} (${size} bytes, ${contentType})`);
        uploaded++;
        bytes += size;
        continue;
      }

      const body = await readFile(filePath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: contentType,
          ...(INLINE_TYPES.has(contentType) ? { ContentDisposition: 'inline' } : {}),
        })
      );
      uploaded++;
      bytes += size;
    } catch (err: any) {
      failed++;
      failures.push(`${key}: ${err?.message || String(err)}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Uploaded: ${uploaded} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`Skipped (already in S3, same size): ${skipped}`);
  console.log(`Failed: ${failed}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
