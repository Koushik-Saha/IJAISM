import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { apiSuccess, apiError } from '@/lib/api-response';
import { revalidatePath } from 'next/cache';
import * as fs from 'fs';
import mammoth from 'mammoth';

// PDF Text Extraction using pdfjs-dist
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  // Set worker to a stable CDN to avoid local module resolution issues in dev/edge
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  
  return fullText;
}

// PDF-to-HTML helper logic (Internal to this route for self-containment)
function isAllCaps(s: string) {
  return s === s.toUpperCase() && /[A-Z]/.test(s);
}

function looksLikeHeading(line: string, prev: string, next: string): boolean {
  if (!line || line.length > 100) return false;
  if (!prev && !next && line.length < 80) return true;
  if (/^(abstract|introduction|background|literature\s+review|methodology|methods|results|discussion|conclusion|references|acknowledgem|appendix|funding|keywords?|conflict)/i.test(line)) return true;
  if (isAllCaps(line) && line.length < 80 && line.length > 3) return true;
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

    if (/^references?\s*$/i.test(line)) {
      inRefs = true;
      chunks.push({ type: 'h2', text: line });
      i++;
      continue;
    }

    if (inRefs) {
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

    let para = line;
    i++;
    while (i < lines.length) {
      const next2 = lines[i];
      if (!next2) break;
      if (looksLikeHeading(next2, lines[i - 1], lines[i + 1] || '')) break;
      para += ' ' + next2;
      i++;
    }
    chunks.push({ type: 'p', text: para });
  }

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

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Mother Admin Role
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return apiError('Invalid token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'mother_admin') {
      return apiError('Forbidden: Mother Admin access required', 403);
    }

    // 2. Parse Form Data
    const formData = await req.formData();
    const articleId = formData.get('articleId') as string;
    const file = formData.get('file') as File;
    const docxFile = formData.get('docxFile') as File | null;

    if (!articleId || !file) {
      return apiError('Article ID and PDF file are required', 400);
    }

    // 3. Verify Article Existence
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true }
    });

    if (!article) {
      return apiError('Article not found', 404);
    }

    // 4. Save PDF locally
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = join(cwd(), 'public', 'uploads', 'article');
    
    await mkdir(uploadDir, { recursive: true });
    const finalPdfPath = join(uploadDir, fileName);
    await writeFile(finalPdfPath, buffer);
    const pdfUrl = `/uploads/article/${fileName}`;

    // 5. Update Database
    await prisma.article.update({
      where: { id: articleId },
      data: { pdfUrl }
    });

    // 6. Regenerate HTML Content
    try {
      let htmlContent = "";

      if (docxFile) {
        // High-Fidelity Conversion from DOCX
        console.log(`[SYNCHRONIZER] Starting DOCX to HTML conversion for article ${articleId}`);
        const docxBuffer = Buffer.from(await docxFile.arrayBuffer());
        
        let imageCount = 0;
        const result = await mammoth.convertToHtml({ buffer: docxBuffer }, {
          includeDefaultStyleMap: true,
          convertImage: mammoth.images.imgElement(async (image) => {
            imageCount++;
            const imageBuffer = await image.read("base64");
            console.log(`[SYNCHRONIZER] Found image #${imageCount}, type: ${image.contentType}, size: ${imageBuffer.length}`);
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`
            };
          })
        });
        
        htmlContent = result.value;
        console.log(`[SYNCHRONIZER] Conversion complete. Extracted ${imageCount} images.`);
        
        if (result.messages.length > 0) {
          console.warn(`[SYNCHRONIZER] Conversion messages:`, result.messages);
        }
      } else {
        // Fallback to extraction from PDF
        const extractedText = await extractTextFromPdf(buffer);
        htmlContent = textToHtml(extractedText);
      }
      
      const contentDir = join(cwd(), 'data', 'article-content');
      await mkdir(contentDir, { recursive: true });
      const htmlFilePath = join(contentDir, `${articleId}.html`);
      
      await writeFile(htmlFilePath, htmlContent, 'utf-8');
      
      // Update fullText in DB as well to keep it in sync with the script patterns
      await prisma.article.update({
        where: { id: articleId },
        data: { fullText: htmlContent }
      });
    } catch (conversionError: any) {
      console.error('Article conversion failed:', conversionError);
      // We still return success for the upload, but warn about the conversion
      return apiSuccess({ pdfUrl }, 'PDF uploaded successfully, but HTML regeneration failed. Please check server logs.');
    }

    // 7. Revalidate the view route
    revalidatePath(`/articles/${articleId}/html`);

    return apiSuccess({ pdfUrl }, 'Article PDF replaced and HTML content regenerated successfully.');

  } catch (error: any) {
    console.error('Error in direct-pdf-update:', error);
    return apiError(`Update Failed: ${error.message}`, 500);
  }
}
