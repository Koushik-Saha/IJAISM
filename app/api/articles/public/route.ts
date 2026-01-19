import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const journal = searchParams.get('journal');
    const year = searchParams.get('year');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'published',
      deletedAt: null,
    };

    if (journal) {
      where.journal = {
        code: journal,
      };
    }

    if (year) {
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31`);
      where.publicationDate = {
        gte: yearStart,
        lte: yearEnd,
      };
    }

    // Build orderBy
    let orderBy: any = { publicationDate: 'desc' };
    if (sortBy === 'cited') {
      orderBy = { citationCount: 'desc' };
    } else if (sortBy === 'downloaded') {
      orderBy = { downloadCount: 'desc' };
    }

    // Fetch articles
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          journal: {
            select: {
              id: true,
              code: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    // Format articles
    const formattedArticles = articles.map((article) => ({
      id: article.id,
      title: article.title,
      authors: [article.author.name],
      journal: {
        code: article.journal.code,
        name: article.journal.fullName,
      },
      publicationDate: article.publicationDate?.toISOString().split('T')[0] || '',
      doi: article.doi || '',
      abstract: article.abstract || '',
      keywords: article.keywords || [],
      citations: article.citationCount || 0,
      downloads: article.downloadCount || 0,
    }));

    return NextResponse.json({
      success: true,
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
