import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 3. Get statistics
    const [
      totalUsers,
      totalArticles,
      pendingArticles,
      underReviewArticles,
      publishedArticles,
      rejectedArticles,
      pendingReviews,
      activeMembers,
      totalAnnouncements,
      featuredAnnouncements,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.article.count({ where: { deletedAt: null } }),
      prisma.article.count({ where: { status: 'submitted', deletedAt: null } }),
      prisma.article.count({ where: { status: 'under_review', deletedAt: null } }),
      prisma.article.count({ where: { status: 'published', deletedAt: null } }),
      prisma.article.count({ where: { status: 'rejected', deletedAt: null } }),
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.membership.count({ where: { status: 'active' } }),
      prisma.announcement.count({ where: { deletedAt: null } }),
      prisma.announcement.count({ where: { isFeatured: true, deletedAt: null } }),
    ]);

    // 4. Get recent activity
    const recentArticles = await prisma.article.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true, email: true } },
        journal: { select: { fullName: true, code: true } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          recent: recentUsers,
        },
        articles: {
          total: totalArticles,
          pending: pendingArticles,
          underReview: underReviewArticles,
          published: publishedArticles,
          rejected: rejectedArticles,
          recent: recentArticles,
        },
        reviews: {
          pending: pendingReviews,
        },
        memberships: {
          active: activeMembers,
        },
        announcements: {
          total: totalAnnouncements,
          featured: featuredAnnouncements,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
