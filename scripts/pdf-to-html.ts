/**
 * Extract text from all article PDFs and convert to formatted HTML.
 * Stores result in article.fullText so the read page can display it inline.
 *
 * Run: npx ts-node --project tsconfig.json scripts/pdf-to-html.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse') as (buf: Buffer, opts?: object) => Promise<{ text: string; numpages: number }>;

const prisma = new PrismaClient();
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// ---------- helpers ----------

function isAllCaps(s: string) {
  return s === s.toUpperCase() && /[A-Z]/.test(s);
}

function looksLikeHeading(line: string, prev: string, next: string): boolean {
  if (!line || line.length > 100) return false;
  // Very short centred-style line flanked by blanks
  if (!prev && !next && line.length < 80) return true;
  // Common academic section labels
  if (/^(abstract|introduction|background|literature\s+review|methodology|methods|results|discussion|conclusion|references|acknowledgem|appendix|funding|keywords?|conflict)/i.test(line)) return true;
  // ALL CAPS short line
  if (isAllCaps(line) && line.length < 80 && line.length > 3) return true;
  // Title-cased and short, preceded by a blank
  if (!prev && /^[A-Z]/.test(line) && line.length < 70 && !/[.!?]$/.test(line)) return true;
  return false;
}

function cleanLine(l: string): string {
  return l
    .replace(/\u00ad/g, '')          // soft hyphens
    .replace(/[^\S\n]+/g, ' ')       // collapse spaces
    .trim();
}

function textToHtml(raw: string): string {
  const rawLines = raw.split('\n');
  const lines: string[] = rawLines.map(cleanLine);

  const chunks: { type: 'h1' | 'h2' | 'p' | 'ref'; text: string }[] = [];
  let i = 0;
  let inRefs = false;

  while (i < lines.length) {
    const line = lines[i];
    const prev = i > 0 ? lines[i - 1] : '';
    const next = i < lines.length - 1 ? lines[i + 1] : '';

    if (!line) { i++; continue; }

    // Detect references section start
    if (/^references?\s*$/i.test(line)) {
      inRefs = true;
      chunks.push({ type: 'h2', text: line });
      i++;
      continue;
    }

    if (inRefs) {
      // Accumulate reference lines as one block
      let refBlock = line;
      i++;
      while (i < lines.length) {
        const l2 = lines[i];
        if (!l2) { i++; break; }
        refBlock += ' ' + l2;
        i++;
      }
      chunks.push({ type: 'ref', text: refBlock });
      continue;
    }

    if (looksLikeHeading(line, prev, next)) {
      chunks.push({ type: chunks.length === 0 ? 'h1' : 'h2', text: line });
      i++;
      continue;
    }

    // Accumulate paragraph lines
    let para = line;
    i++;
    while (i < lines.length) {
      const next2 = lines[i];
      if (!next2) break;
      // Stop accumulating if the next line looks like a heading
      if (looksLikeHeading(next2, lines[i - 1], lines[i + 1] || '')) break;
      para += ' ' + next2;
      i++;
    }
    chunks.push({ type: 'p', text: para });
  }

  // Build HTML
  let html = '<article class="pdf-article">\n';
  for (const chunk of chunks) {
    const escaped = chunk.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (chunk.type === 'h1') {
      html += `<h1>${escaped}</h1>\n`;
    } else if (chunk.type === 'h2') {
      html += `<h2>${escaped}</h2>\n`;
    } else if (chunk.type === 'ref') {
      html += `<p class="reference">${escaped}</p>\n`;
    } else {
      if (chunk.text.length > 20) {
        html += `<p>${escaped}</p>\n`;
      }
    }
  }
  html += '</article>';
  return html;
}

// ---------- main ----------

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
      pdfUrl: { not: null },
      // Uncomment to re-process all:
      // fullText: null,
    },
    select: { id: true, title: true, pdfUrl: true, fullText: true },
  });

  console.log(`Found ${articles.length} published articles with PDFs\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of articles) {
    if (article.fullText) {
      console.log(`  SKIP (already has fullText): ${article.title.substring(0, 60)}`);
      skipped++;
      continue;
    }

    const pdfUrl = article.pdfUrl!;
    if (!pdfUrl.startsWith('/uploads/')) {
      console.log(`  SKIP (external URL): ${pdfUrl}`);
      skipped++;
      continue;
    }

    const filePath = path.join(PUBLIC_DIR, pdfUrl);
    if (!fs.existsSync(filePath)) {
      console.log(`  MISSING: ${filePath}`);
      failed++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer, { max: 0 }); // 0 = all pages
      const html = textToHtml(data.text);

      await prisma.article.update({
        where: { id: article.id },
        data: { fullText: html },
      });

      console.log(`  ✓ ${article.title.substring(0, 60)} (${data.numpages}p, ${html.length} chars)`);
      updated++;
    } catch (err: any) {
      console.error(`  ERROR: ${article.title.substring(0, 50)}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Updated: ${updated}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
