import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, articles, journals
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
      success: true,
      results: [],
      message: 'Search query must be at least 2 characters',
    });
    }

    const results: any = {
      articles: [],
      journals: [],
    };

    // Search articles
    if (type === 'all' || type === 'articles') {
      const articles = await prisma.article.findMany({
        where: {
          status: 'published',
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { abstract: { contains: q, mode: 'insensitive' } },
            { keywords: { has: q } },
          ],
        },
        take: limit,
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          journal: {
            select: {
              code: true,
              fullName: true,
            },
          },
        },
      });

      results.articles = articles.map((article) => ({
        id: article.id,
        title: article.title,
        abstract: article.abstract?.substring(0, 200) || '',
        author: article.author.name,
        journal: article.journal.code,
        journalName: article.journal.fullName,
        publishedAt: article.publicationDate?.toISOString(),
      }));
    }

    // Search journals
    if (type === 'all' || type === 'journals') {
      const journals = await prisma.journal.findMany({
        where: {
          deletedAt: null,
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: {
          id: true,
          code: true,
          fullName: true,
          description: true,
        },
      });

      results.journals = journals;
    }

    return NextResponse.json({
      success: true,
      query: q,
      results,
      total: results.articles.length + results.journals.length,
    });
  } catch (error: any) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
