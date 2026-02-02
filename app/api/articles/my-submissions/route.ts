import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's articles
    const articles = await prisma.article.findMany({
      where: {
        authorId: decoded.userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        journal: {
          select: {
            id: true,
            code: true,
            fullName: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Format articles with review progress
    const formattedArticles = articles.map((article) => {
      const completedReviews = article.reviews.filter(
        (r) => r.status === 'completed'
      ).length;
      const totalReviews = article.reviews.length;

      return {
        id: article.id,
        title: article.title,
        journal: {
          code: article.journal.code,
          name: article.journal.fullName,
        },
        status: article.status,
        isApcPaid: article.isApcPaid,
        createdAt: article.createdAt.toISOString(),
        submittedAt: article.submissionDate?.toISOString(),
        publishedAt: article.publicationDate?.toISOString(),
        reviewProgress: {
          completed: completedReviews,
          total: totalReviews,
          required: 4,
        },
        reviews: article.reviews.map((r) => ({
          id: r.id,
          reviewerName: r.reviewer.name,
          status: r.status,
          decision: r.decision,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      articles: formattedArticles,
    });
  } catch (error: any) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
