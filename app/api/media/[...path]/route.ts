import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '@/lib/logger';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'koushik-freedomshippingllc-reports';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join('/');

    if (!key) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
    }

    // Try S3 first
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error('Empty body from S3');
      }

      const bytes = await (response.Body as any).transformToByteArray();

      return new NextResponse(bytes, {
        headers: {
          'Content-Type': response.ContentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (s3Error: any) {
      if (s3Error.name === 'NoSuchKey') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      logger.warn('S3 fetch failed, falling back to local storage', {
        error: s3Error.message,
        key,
      });

      // Fallback: try reading from local public/uploads directory
      const localPath = join(cwd(), 'public', 'uploads', key);
      const fileBuffer = await readFile(localPath);
      const ext = key.split('.').pop()?.toLowerCase() || '';
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf',
      };
      const mimeType = mimeMap[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (error: any) {
    logger.error('Error serving media file', {
      error: error.message,
      path: req.nextUrl.pathname,
    });

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
