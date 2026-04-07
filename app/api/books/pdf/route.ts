import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const chapterId = searchParams.get('chapterId');

  if (!chapterId) {
    return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });
  }

  const chapter = await prisma.bookChapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter || !chapter.pdfUrl) {
    return NextResponse.json({ error: 'Chapter not found or no PDF' }, { status: 404 });
  }

  // pdfUrl is stored as a relative path like /uploads/books/xxx.pdf
  const relativePath = chapter.pdfUrl.startsWith('/') ? chapter.pdfUrl.slice(1) : chapter.pdfUrl;
  const absolutePath = path.join(process.cwd(), 'public', relativePath);

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: 'PDF file not found on disk' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const filename = path.basename(absolutePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
