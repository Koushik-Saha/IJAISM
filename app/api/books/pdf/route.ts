import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  const relativePath = chapter.pdfUrl.startsWith('/') ? chapter.pdfUrl : `/${chapter.pdfUrl}`;
  return NextResponse.redirect(new URL(relativePath, req.url));
}
