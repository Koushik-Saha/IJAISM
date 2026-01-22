import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !['admin', 'editor', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // --- Statistics Gathering ---

    // 1. Articles by Status
    const articlesByStatusRaw = await prisma.article.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const articlesByStatus = articlesByStatusRaw.map(item => ({
      name: item.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: item._count.status,
    }));

    // 2. Users by Role
    const usersByRoleRaw = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });
    const usersByRole = usersByRoleRaw.map(item => ({
      name: item.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: item._count.role,
    }));

    // 3. Memberships by Tier
    const membershipsByTierRaw = await prisma.membership.groupBy({
      by: ['tier'],
      _count: { tier: true },
    });
    const revenueByTier = membershipsByTierRaw.map(item => ({
      name: item.tier.charAt(0).toUpperCase() + item.tier.slice(1),
      value: item._count.tier,
    }));

    // 4. Monthly Growth (Simplistic - Last 6 months)
    // Grouping by date in Prisma usually involves raw query or post-processing.
    // Post-processing for simplicity and DB compatibility.
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });
    const recentArticles = await prisma.article.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    // Bucket by Month
    const monthlyDataMap = new Map<string, { users: number; articles: number }>();

    // Initialize buckets
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' }); // Jan 25
      monthlyDataMap.set(key, { users: 0, articles: 0 });
    }

    const processItem = (date: Date, type: 'users' | 'articles') => {
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyDataMap.has(key)) {
        const entry = monthlyDataMap.get(key)!;
        entry[type]++;
      }
    };

    recentUsers.forEach(u => processItem(u.createdAt, 'users'));
    recentArticles.forEach(a => processItem(a.createdAt, 'articles'));

    const monthlyGrowth = Array.from(monthlyDataMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .reverse(); // Chronological order

    // Standard Stats (for cards)
    const totalUsers = await prisma.user.count();
    const totalArticles = await prisma.article.count();
    const pendingReviews = await prisma.review.count({ where: { status: 'pending' } });
    const activeMembers = await prisma.membership.count({ where: { status: 'active' } });

    // Recent items for lists
    const recentUsersList = await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    const recentArticlesList = await prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, email: true } }, journal: { select: { code: true } } }
    });

    return NextResponse.json({
      stats: {
        users: { total: totalUsers, recent: recentUsersList },
        articles: {
          total: totalArticles,
          pending: articlesByStatus.find(s => s.name === 'Submitted')?.value || 0,
          underReview: articlesByStatus.find(s => s.name === 'Under Review')?.value || 0,
          published: articlesByStatus.find(s => s.name === 'Published')?.value || 0,
          rejected: articlesByStatus.find(s => s.name === 'Rejected')?.value || 0,
          recent: recentArticlesList
        },
        reviews: { pending: pendingReviews },
        memberships: { active: activeMembers },
        announcements: { total: 0, featured: 0 }, // Placeholder
      },
      charts: {
        articlesByStatus,
        usersByRole,
        monthlyGrowth,
        revenueByTier
      }
    });

  } catch (error: any) {
    console.error('Stats Error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
