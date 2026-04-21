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
      announcements: [],
      blogs: [],
      thesis: [],
      books: [],
      conferences: [],
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
      const whereClause: any = {
        status: 'published',
        deletedAt: null,
      };

      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { abstract: { contains: q, mode: 'insensitive' } },
          { keywords: { has: q } },
          { doi: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (author) {
        whereClause.author = { name: { contains: author, mode: 'insensitive' } };
      }

      if (journal) {
        whereClause.journal = {
          OR: [{ id: journal }, { code: { equals: journal, mode: 'insensitive' } }]
        };
      }

      if (articleType) whereClause.articleType = articleType;
      if (Object.keys(dateFilter).length > 0) whereClause.publicationDate = dateFilter;

      const totalArticles = await prisma.article.count({ where: whereClause });
      const articles = await prisma.article.findMany({
        where: whereClause,
        take: scope === 'all' ? 10 : limit,
        skip: scope === 'all' ? 0 : skip,
        orderBy: { publicationDate: 'desc' },
        include: {
          author: { select: { id: true, name: true, university: true } },
          journal: { select: { id: true, code: true, fullName: true } },
        },
      });

      results.articles = articles.map((a: any) => ({
        id: a.id,
        title: a.title,
        abstract: a.abstract?.substring(0, 250) || '',
        author: a.author.name,
        journal: a.journal.fullName,
        journalCode: a.journal.code,
        publishedAt: a.publicationDate,
        doi: a.doi,
      }));

      if (scope === 'articles') {
        results.pagination = { page, limit, total: totalArticles, totalPages: Math.ceil(totalArticles / limit) };
      }
    }

    // Search journals
    if (scope === 'all' || scope === 'journals') {
      const whereClause: any = { deletedAt: null, isActive: true };
      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { code: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      const journals = await prisma.journal.findMany({
        where: whereClause,
        take: scope === 'all' ? 5 : limit,
        skip: scope === 'all' ? 0 : skip,
        orderBy: { fullName: 'asc' },
      });
      results.journals = journals;
    }

    // Search Blogs
    if (scope === 'all' || scope === 'blogs') {
      const whereClause: any = { status: 'published', deletedAt: null };
      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
        ];
      }

      const blogs = await prisma.blog.findMany({
        where: whereClause,
        take: scope === 'all' ? 5 : limit,
        skip: scope === 'all' ? 0 : skip,
        orderBy: { publishedAt: 'desc' },
        include: { author: { select: { name: true } } }
      });
      results.blogs = blogs.map((b: any) => ({
        id: b.id,
        title: b.title,
        excerpt: b.excerpt || b.content.substring(0, 150) + '...',
        author: b.author.name,
        publishedAt: b.publishedAt,
        slug: b.slug,
        featuredImageUrl: b.featuredImageUrl
      }));
    }

    // Search Thesis (Dissertations)
    if (scope === 'all' || scope === 'thesis' || scope === 'dissertations') {
      const whereClause: any = { status: 'published', deletedAt: null };
      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { abstract: { contains: q, mode: 'insensitive' } },
          { authorName: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
        ];
      }

      const thesis = await prisma.dissertation.findMany({
        where: whereClause,
        take: scope === 'all' ? 5 : limit,
        skip: scope === 'all' ? 0 : skip,
        orderBy: { submissionDate: 'desc' },
      });
      results.thesis = thesis.map((t: any) => ({
        id: t.id,
        title: t.title,
        author: t.authorName,
        university: t.university,
        degreeType: t.degreeType,
        publishedAt: t.submissionDate,
        abstract: t.abstract.substring(0, 200) + '...'
      }));
    }

    // Search Books
    if (scope === 'all' || scope === 'books') {
      const whereClause: any = {};
      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { authors: { hasSome: [q] } }, // Rough match for array
          { description: { contains: q, mode: 'insensitive' } },
          { isbn: { contains: q, mode: 'insensitive' } },
        ];
        // Special case for authors since hasSome needs exact array overlap usually
        // We'll use title/desc primarily, or refine authors search if needed.
      }

      const books = await prisma.book.findMany({
        where: whereClause,
        take: scope === 'all' ? 5 : limit,
        skip: scope === 'all' ? 0 : skip,
        orderBy: { year: 'desc' },
      });
      results.books = books.map((b: any) => ({
        id: b.id,
        title: b.title,
        authors: b.authors,
        price: b.price,
        isbn: b.isbn,
        coverImageUrl: b.coverImageUrl,
        year: b.year
      }));
    }

    // Search Announcements
    if (scope === 'all' || scope === 'announcements') {
      const whereClause: any = { deletedAt: null };
      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
        ];
      }

      const announcements = await prisma.announcement.findMany({
        where: whereClause,
        take: scope === 'all' ? 5 : limit,
        skip: scope === 'all' ? 0 : skip,
        orderBy: { publishedAt: 'desc' },
      });
      results.announcements = announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt || a.content.substring(0, 150) + '...',
        publishedAt: a.publishedAt,
        thumbnailUrl: a.thumbnailUrl,
        category: a.category
      }));
    }

    // Search Conferences
    if (scope === 'all' || scope === 'conferences') {
      const whereClause: any = { deletedAt: null };
      if (q && q.trim().length > 0) {
        whereClause.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { venue: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { acronym: { contains: q, mode: 'insensitive' } },
        ];
      }

      const conferences = await prisma.conference.findMany({
        where: whereClause,
        take: scope === 'all' ? 5 : limit,
        skip: scope === 'all' ? 0 : skip,
        orderBy: { startDate: 'desc' },
      });
      results.conferences = conferences.map((c: any) => ({
        id: c.id,
        title: c.title,
        startDate: c.startDate,
        endDate: c.endDate,
        venue: c.venue,
        city: c.city,
        acronym: c.acronym,
        bannerImageUrl: c.bannerImageUrl
      }));
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
