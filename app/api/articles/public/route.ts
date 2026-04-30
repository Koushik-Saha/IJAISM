import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const journal = searchParams.get('journal');
    const year = searchParams.get('year');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const search = searchParams.get('search') || '';
    const articleType = searchParams.get('articleType') || '';
    const openAccess = searchParams.get('openAccess') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = { status: 'published', deletedAt: null };

    if (journal) {
      where.journal = { code: { equals: journal, mode: 'insensitive' } };
    }

    if (year) {
      where.publicationDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { keywords: { has: search } },
      ];
    }

    if (articleType) {
      where.articleType = { equals: articleType, mode: 'insensitive' };
    }

    if (openAccess === 'true') {
      where.isOpenAccess = true;
    }

    let orderBy: any = { publicationDate: 'desc' };
    if (sortBy === 'cited') orderBy = { citationCount: 'desc' };
    else if (sortBy === 'downloaded') orderBy = { downloadCount: 'desc' };
    else if (sortBy === 'oldest') orderBy = { publicationDate: 'asc' };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        omit: { fullText: true },
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, name: true } },
          coAuthors: { select: { name: true }, orderBy: { order: 'asc' } },
          journal: { select: { id: true, code: true, fullName: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    const formattedArticles = articles.map((article) => {
      const ADMIN_NAMES = ['C5K Executive Administrator', 'The Mother Admin'];
      const allAuthors = [article.author.name, ...article.coAuthors.map(c => c.name)]
        .filter(name => !ADMIN_NAMES.includes(name));
      return {
        id: article.id,
        title: article.title,
        authors: allAuthors,
        journal: { code: article.journal.code, name: article.journal.fullName },
        publicationDate: article.publicationDate?.toISOString().split('T')[0] || '',
        doi: article.doi || '',
        abstract: article.abstract || '',
        keywords: article.keywords || [],
        citations: article.citationCount || 0,
        downloads: article.downloadCount || 0,
        articleType: article.articleType || 'Research Article',
        isOpenAccess: article.isOpenAccess ?? true,
        pdfUrl: article.pdfUrl || null,
      };
    });

    return NextResponse.json({
      success: true,
      articles: formattedArticles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
