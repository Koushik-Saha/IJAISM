import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        role: true,
        managedJournals: { select: { id: true } }
      },
    });

    if (!user || !['admin', 'editor', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const journalId = searchParams.get('journalId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // RBAC: Editors can only see articles for their managed journals
    const managedJournalIds = user.managedJournals.map(j => j.id);

    // Build where clause
    const where: any = { deletedAt: null };

    // Apply RBAC Filter
    if (user.role === 'editor') {
      if (managedJournalIds.length === 0) {
        // Editor with no journals sees nothing
        return NextResponse.json({
          success: true,
          articles: [],
          pagination: { page, limit, total: 0, pages: 0 }
        });
      }
      where.journalId = { in: managedJournalIds };
    }

    // If ID is provided, return single article (WITH RBAC CHECK)
    if (id) {
      // If editor, we must ensure the article belongs to one of their journals.
      // We can add journalId: { in: managedJournalIds } to the query or check after.
      // Adding to query is safer.
      const singleArticleWhere: any = { id, deletedAt: null };
      if (user.role === 'editor') {
        singleArticleWhere.journalId = { in: managedJournalIds };
      }

      const article = await prisma.article.findUnique({
        where: singleArticleWhere,
        include: {
          author: {
            select: { id: true, name: true, email: true, university: true },
          },
          journal: {
            select: { id: true, fullName: true, code: true },
          },
          reviews: {
            include: {
              reviewer: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { reviewerNumber: 'asc' },
          },
        },
      });

      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        article,
      });
    }

    if (status) {
      where.status = status;
    }

    if (journalId) {
      where.journalId = journalId;
    }

    // Get articles
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true, university: true },
          },
          journal: {
            select: { id: true, fullName: true, code: true },
          },
          reviews: {
            include: {
              reviewer: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      articles,
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
