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
      },
    });

    if (!user || !['admin', 'editor', 'super_admin', 'mother_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const journalId = searchParams.get('journalId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch EIC journals if editor
    let eicJournalIds: string[] = [];
    if (user.role === 'editor') {
      const eicJournals = await prisma.journalEditor.findMany({
        where: {
          userId: decoded.userId,
          role: "editor_in_chief"
        },
        select: { journalId: true }
      });
      eicJournalIds = eicJournals.map(j => j.journalId);
    }

    // Build where clause
    const where: any = { deletedAt: null };

    // Apply RBAC Filter
    if (user.role === 'editor') {
      const accessConditions = {
        OR: [
          { journalId: { in: eicJournalIds } },
          { editors: { some: { userId: decoded.userId } } }
        ]
      };
      
      if (search) {
        where.AND = [
          accessConditions,
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { doi: { contains: search, mode: 'insensitive' } },
              { author: { name: { contains: search, mode: 'insensitive' } } },
            ]
          }
        ];
      } else {
        where.AND = [accessConditions];
      }
    } else {
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { doi: { contains: search, mode: 'insensitive' } },
          { author: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
    }

    // If ID is provided, return single article (WITH RBAC CHECK)
    if (id) {
      const singleArticleWhere: any = { id, deletedAt: null };
      if (user.role === 'editor') {
        singleArticleWhere.AND = [
          {
            OR: [
              { journalId: { in: eicJournalIds } },
              { editors: { some: { userId: decoded.userId } } }
            ]
          }
        ];
      }

      const article = await prisma.article.findFirst({
        where: singleArticleWhere,
        include: {
          author: {
            select: { id: true, name: true, email: true, university: true },
          },
          journal: {
            select: { id: true, fullName: true, code: true },
          },
          coAuthors: {
            orderBy: { order: 'asc' },
          },
          editors: {
            include: {
              user: {
                select: { id: true, name: true, email: true, university: true }
              }
            }
          },
          reviews: {
            include: {
              reviewer: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { reviewerNumber: 'asc' },
          },
          activityLogs: {
            include: {
              user: {
                select: { name: true, role: true },
              },
            },
            orderBy: { createdAt: 'desc' },
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

    const noDoi = searchParams.get('noDoi');
    if (noDoi === 'true') {
      where.doi = null;
    }

    // Get articles
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        omit: { fullText: true },
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
          editors: {
            include: {
              user: {
                select: { id: true, name: true, email: true, university: true }
              }
            }
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
