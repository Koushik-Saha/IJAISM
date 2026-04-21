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
import JSZip from 'jszip';

// ── DOCX Chart Extraction Engine ─────────────────────────────────────────────
// mammoth.js cannot handle DrawingML Chart objects (Word charts stored as XML).
// This engine reads the chart XML from the DOCX, extracts data, and renders SVG.

interface ChartSeries {
  labels: string[];
  values: number[];
}

interface ChartInfo {
  type: string; // 'pieChart', 'barChart', etc.
  title: string;
  series: ChartSeries;
}

function generatePieSvg(chart: ChartInfo): string {
  const { labels, values } = chart.series;
  const total = values.reduce((a, b) => a + b, 0);
  const colors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'];
  
  const cx = 200, cy = 200, r = 130;
  let currentAngle = -Math.PI / 2; // start at top
  
  const slices: string[] = [];
  const labelElems: string[] = [];
  
  labels.forEach((label, i) => {
    const pct = values[i] / total;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(currentAngle);
    const y1 = cy + r * Math.sin(currentAngle);
    const x2 = cx + r * Math.cos(currentAngle + angle);
    const y2 = cy + r * Math.sin(currentAngle + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const color = colors[i % colors.length];
    
    slices.push(
      `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${color}" stroke="white" stroke-width="2"/>`
    );
    
    // Label position (midpoint of arc, slightly outside)
    const midAngle = currentAngle + angle / 2;
    const lx = cx + (r * 0.65) * Math.cos(midAngle);
    const ly = cy + (r * 0.65) * Math.sin(midAngle);
    const pctStr = Math.round(pct * 100) + '%';
    
    // Wrap label text
    const words = label.split(' ');
    const lineHeight = 14;
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > 14) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = (currentLine + ' ' + word).trim();
      }
    }
    if (currentLine) lines.push(currentLine);
    lines.push(pctStr);
    
    const textY = ly - ((lines.length - 1) * lineHeight) / 2;
    const textLines = lines.map((l, li) => 
      `<tspan x="${lx.toFixed(1)}" dy="${li === 0 ? 0 : lineHeight}">${l}</tspan>`
    ).join('');
    labelElems.push(
      `<text x="${lx.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="middle" font-family="serif" font-size="11" fill="white" font-weight="bold">${textLines}</text>`
    );
    
    currentAngle += angle;
  });
  
  const svgWidth = 400, svgHeight = 400;
  return `<figure style="text-align:center;margin:16px auto;max-width:420px;break-inside:avoid;">
  <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #ccc;border-radius:4px;background:#fafafa;max-width:100%;">
    ${slices.join('\n    ')}
    ${labelElems.join('\n    ')}
  </svg>
</figure>`;
}

async function extractChartsFromDocx(docxBuffer: Buffer): Promise<Map<string, string>> {
  const chartSvgMap = new Map<string, string>(); // rId -> SVG string
  
  try {
    const zip = await JSZip.loadAsync(docxBuffer);
    
    // Read document relationships
    const docRelsFile = zip.file('word/_rels/document.xml.rels');
    if (!docRelsFile) return chartSvgMap;
    
    const docRels = await docRelsFile.async('text');
    
    // Find all chart relationships
    const chartRels = [...docRels.matchAll(/Id="([^"]+)"[^>]*Type="[^"]*\/chart"[^>]*Target="([^"]+)"/g)];
    
    for (const [, rId, chartTarget] of chartRels) {
      const chartPath = `word/${chartTarget}`;
      const chartFile = zip.file(chartPath);
      if (!chartFile) continue;
      
      const chartXml = await chartFile.async('text');
      
      // Detect chart type
      const typeMatch = chartXml.match(/<c:(\w+Chart)\b/);
      const chartType = typeMatch ? typeMatch[1] : 'unknown';
      
      // Extract title
      const titleMatch = chartXml.match(/<c:title>.*?<a:t>([^<]+)<\/a:t>/s);
      const title = titleMatch ? titleMatch[1] : 'Chart';
      
      // Extract string labels
      const strPts = [...chartXml.matchAll(/<c:strRef>.*?<\/c:strRef>/gs)];
      const labels: string[] = [];
      for (const [block] of strPts) {
        const pts = [...block.matchAll(/<c:pt idx="\d+"><c:v>([^<]+)<\/c:v>/g)];
        pts.forEach(([, val]) => labels.push(val));
        if (labels.length > 0) break;
      }
      
      // Extract numeric values
      const numPts = [...chartXml.matchAll(/<c:numRef>.*?<\/c:numRef>/gs)];
      const values: number[] = [];
      for (const [block] of numPts) {
        const pts = [...block.matchAll(/<c:pt idx="\d+"><c:v>([^<]+)<\/c:v>/g)];
        pts.forEach(([, val]) => values.push(parseFloat(val)));
        if (values.length > 0) break;
      }
      
      if (labels.length > 0 && values.length > 0) {
        const chart: ChartInfo = { type: chartType, title, series: { labels, values } };
        
        let svgHtml = '';
        if (chartType === 'pieChart' || chartType === 'doughnutChart') {
          svgHtml = generatePieSvg(chart);
        } else {
          // Fallback: simple text representation for unsupported chart types
          const rows = labels.map((l, i) => `<tr><td>${l}</td><td>${values[i]}</td></tr>`).join('');
          svgHtml = `<div style="border:1px solid #ccc;padding:8px;margin:8px 0;font-size:9pt;"><strong>${title}</strong><table>${rows}</table></div>`;
        }
        
        chartSvgMap.set(rId, svgHtml);
        console.log(`[CHART-ENGINE] Extracted chart rId=${rId}, type=${chartType}, ${labels.length} slices`);
      }
    }
  } catch (e: any) {
    console.error('[CHART-ENGINE] Error extracting charts:', e.message);
  }
  
  return chartSvgMap;
}

async function injectChartsIntoHtml(html: string, docxBuffer: Buffer): Promise<string> {
  // Read the DOCX to find where chart drawing elements appear in the document XML
  // and inject the SVG at the right place in the mammoth-generated HTML.
  // 
  // Strategy: mammoth produces text like "Fig. N." immediately after
  // where the chart block was. We find those and inject before them.
  
  const chartSvgs = await extractChartsFromDocx(docxBuffer);
  if (chartSvgs.size === 0) return html;
  
  // Also read the document XML to understand chart ordering relative to text
  try {
    const zip = await JSZip.loadAsync(docxBuffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) return html;
    
    const docXml = await docXmlFile.async('text');
    const docRelsFile = zip.file('word/_rels/document.xml.rels');
    if (!docRelsFile) return html;
    const docRels = await docRelsFile.async('text');
    
    // Build rId -> SVG map
    const svgList: string[] = [];
    
    // Find chart elements in order of appearance in document.xml
    const chartRefPattern = /r:id="([^"]+)"[^>]*\/>/g;
    const drawingPattern = /<w:drawing>.*?<\/w:drawing>/gs;
    
    for (const [drawingBlock] of [...docXml.matchAll(drawingPattern)]) {
      const rIdMatch = drawingBlock.match(/r:embed="([^"]+)"|r:id="([^"]+)"/);
      if (!rIdMatch) continue;
      
      const rId = rIdMatch[1] || rIdMatch[2];
      
      // Is this rId a chart?
      const isChart = docRels.includes(`Id="${rId}"`) && 
                      docRels.includes(`/chart"`);
      
      if (isChart && chartSvgs.has(rId)) {
        svgList.push(chartSvgs.get(rId)!);
      }
    }
    
    if (svgList.length === 0) {
      // Fallback: just inject all charts at Fig. N positions
      let svgIdx = 0;
      for (const [, svg] of chartSvgs) {
        // Find "Fig. N" strong element in HTML and inject before it
        const figPattern = /<p><strong>Fig\.\s*\d+\./;
        const match = figPattern.exec(html.slice(html.indexOf(svg) + 1 || 0));
        svgList.push(svg);
      }
    }
    
    // Now inject each chart SVG before its corresponding "Fig. N." strong tag
    let svgIdx = 0;
    html = html.replace(/<p><strong>Fig\.\s*(\d+)\./g, (match) => {
      if (svgIdx < svgList.length) {
        const svg = svgList[svgIdx++];
        return svg + match;
      }
      return match;
    });
    
  } catch (e: any) {
    console.error('[CHART-ENGINE] Error injecting charts:', e.message);
  }
  
  return html;
}

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
        
        // Inject DrawingML charts (mammoth cannot extract these — they're XML-based)
        htmlContent = await injectChartsIntoHtml(htmlContent, docxBuffer);
        
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
