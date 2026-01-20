import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const scope = searchParams.get('scope') || 'all'; // all, articles, journals (renamed from type to avoid confusion)
    const author = searchParams.get('author') || '';
    const journal = searchParams.get('journal'); // journal code or id
    const articleType = searchParams.get('type'); // research, review, etc.
    const year = searchParams.get('year');
    const yearFrom = searchParams.get('yearFrom');
    const yearTo = searchParams.get('yearTo');
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, date, citations
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const results: any = {
      articles: [],
      journals: [],
    };

    // Build date filter
    const dateFilter: any = {};
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      dateFilter.gte = start;
      dateFilter.lte = end;
    } else {
      if (yearFrom) {
        dateFilter.gte = new Date(`${yearFrom}-01-01`);
      }
      if (yearTo) {
        dateFilter.lte = new Date(`${yearTo}-12-31`);
      }
    }

    // Search articles
    if (scope === 'all' || scope === 'articles') {
      // Build where clause
      const whereClause: any = {
        status: 'published',
        deletedAt: null,
      };

      // Query Filter - Only if query is provided (allow browsing without query if filters exist)
      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { abstract: { contains: q, mode: 'insensitive' } },
          { keywords: { has: q } },
          { doi: { contains: q, mode: 'insensitive' } },
        ];
      }

      // Add author filter
      if (author) {
        whereClause.author = {
          name: { contains: author, mode: 'insensitive' },
        };
      }

      // Add Journal Filter
      if (journal) {
        // Check if it's a UUID or Code? For now assume exact match on ID or partial on Code/Name if needed.
        // But usually filter is specific. Let's try to match ID or Code.
        whereClause.journal = {
          OR: [
            { id: journal },
            { code: { equals: journal, mode: 'insensitive' } }
          ]
        };
      }

      // Add Article Type Filter
      if (articleType) {
        whereClause.articleType = articleType;
      }

      // Add date filter
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
        // Default / Relevance base sort (date as tie breaker if strict relevance isn't computed in DB)
        orderBy = { publicationDate: 'desc' };
      }

      // Get Total Count for Pagination
      const totalArticles = await prisma.article.count({ where: whereClause });

      const articles = await prisma.article.findMany({
        where: whereClause,
        take: limit,
        skip: skip,
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
              id: true,
              code: true,
              fullName: true,
            },
          },
        },
      });

      // Calculate relevance score and sort in-memory if 'relevance' is selected and query exists
      let sortedArticles = articles;
      if (sortBy === 'relevance' && q) {
        sortedArticles = articles.map((article) => {
          let score = 0;
          const queryLower = q.toLowerCase();
          const titleLower = article.title.toLowerCase();
          const abstractLower = (article.abstract || '').toLowerCase();

          // Title match (highest weight)
          if (titleLower.includes(queryLower)) {
            score += 100;
            if (titleLower === queryLower) score += 50;
          }

          // Abstract match
          if (abstractLower.includes(queryLower)) {
            score += 30;
          }

          // Keyword match
          if (article.keywords.some(k => k.toLowerCase().includes(queryLower))) {
            score += 25;
          }

          // Citation boost
          score += Math.min(article.citationCount / 10, 20);

          return { ...article, _relevanceScore: score };
        }).sort((a: any, b: any) => (b._relevanceScore || 0) - (a._relevanceScore || 0));

        // Note: Pagination with in-memory sorting is tricky because we only fetched 'limit' items.
        // For true relevance pagination, we'd need full text search engine or fetch all keys.
        // For now, we sort the *page* returned by DB (which was sorted by date). 
        // Best effort: If sorting by relevance, usually better to fetch specific relevance matches if possible without full scan.
        // Given constraints, we'll keep the DB sort as date for stability, and re-sort this specific page.
        // OR better: if no DB "relevance" is possible, verify if we can rely on date.
        // Let's stick to the current implementation but acknowledge the limitation.
      }

      results.articles = sortedArticles.map((article: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          journalId: articleData.journal.id,
          journalName: articleData.journal.fullName,
          publishedAt: articleData.publicationDate?.toISOString(),
          doi: articleData.doi,
          citations: articleData.citationCount || 0,
          views: articleData.viewCount || 0,
          downloads: articleData.downloadCount || 0,
          keywords: articleData.keywords,
          articleType: articleData.articleType,
        };
      });

      results.pagination = {
        page,
        limit,
        total: totalArticles,
        totalPages: Math.ceil(totalArticles / limit),
      };
    }

    // Search journals
    if (scope === 'all' || scope === 'journals') {
      // Only search journals if no specific article filters (like articleType) are set that wouldn't make sense for journals
      if (!articleType) {
        const whereClause: any = {
          deletedAt: null,
          isActive: true
        };

        if (q && q.trim().length > 0) {
          whereClause.OR = [
            { code: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ];
        }

        const journals = await prisma.journal.findMany({
          where: whereClause,
          take: 5, // Limit journals in mixed search
          orderBy: { fullName: 'asc' },
          select: {
            id: true,
            code: true,
            fullName: true,
            description: true,
          },
        });
        results.journals = journals;
      }
    }

    return NextResponse.json({
      success: true,
      query: q,
      results,
      filters: {
        scope,
        journal,
        type: articleType,
        year,
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
