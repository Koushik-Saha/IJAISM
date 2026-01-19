import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, articles, journals
    const author = searchParams.get('author') || '';
    const yearFrom = searchParams.get('yearFrom');
    const yearTo = searchParams.get('yearTo');
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, date, citations
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: { articles: [], journals: [] },
        total: 0,
        message: 'Search query must be at least 2 characters',
      });
    }

    const results: any = {
      articles: [],
      journals: [],
    };

    // Build date filter
    const dateFilter: any = {};
    if (yearFrom) {
      dateFilter.gte = new Date(`${yearFrom}-01-01`);
    }
    if (yearTo) {
      dateFilter.lte = new Date(`${yearTo}-12-31`);
    }

    // Search articles
    if (type === 'all' || type === 'articles') {
      // Build where clause
      const whereClause: any = {
        status: 'published',
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { abstract: { contains: q, mode: 'insensitive' } },
          { keywords: { has: q } },
          { doi: { contains: q, mode: 'insensitive' } },
        ],
      };

      // Add author filter if provided
      if (author) {
        whereClause.author = {
          name: { contains: author, mode: 'insensitive' },
        };
      }

      // Add date filter if provided
      if (Object.keys(dateFilter).length > 0) {
        whereClause.publicationDate = dateFilter;
      }

      // Build orderBy clause
      let orderBy: any = {};
      if (sortBy === 'date') {
        orderBy = { publicationDate: 'desc' };
      } else if (sortBy === 'citations') {
        orderBy = { citationCount: 'desc' };
      } else {
        // Relevance: prioritize title matches, then abstract, then citations
        orderBy = [
          { citationCount: 'desc' },
          { publicationDate: 'desc' },
        ];
      }

      const articles = await prisma.article.findMany({
        where: whereClause,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              orcid: true,
              university: true,
              affiliation: true,
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

      // Calculate relevance score and sort by relevance if needed
      let sortedArticles = articles;
      if (sortBy === 'relevance') {
        sortedArticles = articles.map((article) => {
          let score = 0;
          const queryLower = q.toLowerCase();
          const titleLower = article.title.toLowerCase();
          const abstractLower = (article.abstract || '').toLowerCase();

          // Title match (highest weight)
          if (titleLower.includes(queryLower)) {
            score += 100;
            // Exact title match bonus
            if (titleLower === queryLower) score += 50;
          }

          // Abstract match (medium weight)
          if (abstractLower.includes(queryLower)) {
            score += 30;
          }

          // Keyword match (medium weight)
          if (article.keywords.some(k => k.toLowerCase().includes(queryLower))) {
            score += 25;
          }

          // DOI match (low weight)
          if (article.doi?.toLowerCase().includes(queryLower)) {
            score += 10;
          }

          // Add citation boost
          score += Math.min(article.citationCount / 10, 20);

          return { ...article, _relevanceScore: score };
        }).sort((a: any, b: any) => (b._relevanceScore || 0) - (a._relevanceScore || 0));
      }

      results.articles = sortedArticles.map((article: any) => {
        const { _relevanceScore, ...articleData } = article;
        return {
          id: articleData.id,
          title: articleData.title,
          abstract: articleData.abstract?.substring(0, 250) || '',
          author: articleData.author.name,
          authorId: articleData.author.id,
          authorOrcid: articleData.author.orcid,
          authorUniversity: articleData.author.university,
          authorAffiliation: articleData.author.affiliation,
          journal: articleData.journal.code,
          journalName: articleData.journal.fullName,
          publishedAt: articleData.publicationDate?.toISOString(),
          doi: articleData.doi,
          citations: articleData.citationCount || 0,
          views: articleData.viewCount || 0,
          downloads: articleData.downloadCount || 0,
          keywords: articleData.keywords,
        };
      });
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
            { aimsAndScope: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: {
          id: true,
          code: true,
          fullName: true,
          description: true,
          issn: true,
          eIssn: true,
          impactFactor: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      });

      results.journals = journals;
    }

    // Search authors if author query is provided
    if (author && type === 'all') {
      const authors = await prisma.user.findMany({
        where: {
          name: { contains: author, mode: 'insensitive' },
          role: { in: ['author', 'reviewer'] },
          deletedAt: null,
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          university: true,
          affiliation: true,
          orcid: true,
        },
      });

      // Add authors to results (if we want to show them separately)
      results.authors = authors;
    }

    return NextResponse.json({
      success: true,
      query: q,
      results,
      total: results.articles.length + results.journals.length,
      filters: {
        type,
        author: author || null,
        yearFrom: yearFrom || null,
        yearTo: yearTo || null,
        sortBy,
      },
    });
  } catch (error: any) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
