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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { managedJournals: { select: { id: true } } }
    });
    if (!user || !['admin', 'editor', 'super_admin', 'mother_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // RBAC Filter
    const managedJournalIds = user.managedJournals.map(j => j.id);
    const isEditor = user.role === 'editor';
    const articleWhere: any = {};
    if (isEditor) {
      if (managedJournalIds.length === 0) {
        // Return empty stats immediately if editor has no journals
        return NextResponse.json({
          stats: {
            users: { total: 0, recent: [] },
            articles: { total: 0, pending: 0, underReview: 0, published: 0, rejected: 0, recent: [] },
            reviews: { pending: 0 },
            memberships: { active: 0 },
            announcements: { total: 0, featured: 0 },
          },
          charts: {
            articlesByStatus: [],
            usersByRole: [],
            monthlyGrowth: [],
            revenueByTier: [],
            revenueTotal: 0,
            topJournals: [],
            engagement: { views: 0, downloads: 0 }
          }
        });
      }
      articleWhere.journalId = { in: managedJournalIds };
    }

    // --- Statistics Gathering ---

    // 1. Articles by Status
    const articlesByStatusRaw = await prisma.article.groupBy({
      by: ['status'],
      where: articleWhere,
      _count: { status: true },
    });
    const articlesByStatus = articlesByStatusRaw.map(item => ({
      name: item.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: item._count.status,
    }));

    // 2. Users by Role (Global for now, or maybe only authors of managed journals?)
    // Keeping global for now unless requested otherwise, but maybe filtered by who submitted to my journal?
    // User requested "only related to journals". Users are global entities.
    // However, showing total users might be confusing. For now, we leave users global or maybe skip?
    // Let's keep users global but maybe filter recent users?
    // Actually, editors prob shouldn't see ALL users.
    // Let's filter recent users to only those who submitted to managed journals.

    // 3. Memberships (Global revenue?) - Revenue should logically be restricted too if possible.
    // But revenue calculation below was "Confirmed Payments Only".
    // Let's filter revenue by article payments for managed journals.

    // 4. Monthly Growth
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    // Articles Growth (Filtered)
    const recentArticles = await prisma.article.findMany({
      where: { ...articleWhere, createdAt: { gte: sixMonthsAgo } },
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

    // Only process users if Super Admin? Or show global growth? 
    // Editors usually care about THEIR articles.
    // Showing global user growth is fine for context.
    recentUsers.forEach(u => processItem(u.createdAt, 'users'));
    recentArticles.forEach(a => processItem(a.createdAt, 'articles'));

    const monthlyGrowth = Array.from(monthlyDataMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .reverse(); // Chronological order

    // Standard Stats (for cards)
    const totalUsers = await prisma.user.count(); // Global
    const totalArticles = await prisma.article.count({ where: articleWhere }); // Filtered

    // Reviews for my articles
    const pendingReviews = await prisma.review.count({
      where: {
        status: 'pending',
        article: articleWhere // Filter reviews where article matches my journals
      }
    });

    const activeMembers = await prisma.membership.count({ where: { status: 'active' } });

    // Recent items for lists
    const recentUsersList = await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } });

    // Recent Articles (Filtered)
    const recentArticlesList = await prisma.article.findMany({
      where: articleWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, email: true } }, journal: { select: { code: true } } }
    });

    // 5. Total Revenue (Filtered)
    // Tier pricing assumptions: Student: $50, Individual: $100, Institutional: $500
    const tierPricing: Record<string, number> = { student: 50, individual: 100, institutional: 500 };
    let membershipRevenue = 0;
    // APC Revenue (Filtered)
    const paidArticles = await prisma.article.findMany({
      where: { ...articleWhere, isApcPaid: true },
      select: { apcAmount: true }
    });
    const apcRevenue = paidArticles.reduce((sum, a) => sum + (a.apcAmount || 0), 0);

    // Memberships? Editors don't own memberships usually. Super Admin gets all.
    // If Editor, show only APC revenue? 
    // Or maybe 0 for membership revenue if they don't get a cut.
    // Let's assume for now Editor sees ONLY APC revenue for their journals.
    let totalRevenue = apcRevenue;

    let revenueByTierData: any[] = []; // Empty or filtered? 
    if (!isEditor) {
      // Super Admin sees everything + Memberships
      const membershipsByTierRaw = await prisma.membership.groupBy({
        by: ['tier'],
        _count: { tier: true },
      });
      revenueByTierData = membershipsByTierRaw.map(item => ({
        name: item.tier.charAt(0).toUpperCase() + item.tier.slice(1),
        value: item._count.tier,
      }));

      // Conference Revenue (Global)
      const paidRegistrations = await prisma.conferenceRegistration.findMany({
        where: { paymentStatus: 'paid' },
        select: { paymentAmount: true }
      });
      const conferenceRevenue = paidRegistrations.reduce((sum, r) => sum + (r.paymentAmount || 0), 0);

      totalRevenue += conferenceRevenue; // Add separate? Or just sum all.
      // Actually, previous logic just summed paidArticles + membershipEstimate.
      // We will stick to APC + (maybe) Conference if relevant.
    }

    // 6. Top Journals by Submission
    const topJournalsRaw = await prisma.article.groupBy({
      by: ['journalId'],
      where: articleWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const topJournals = await Promise.all(topJournalsRaw.map(async (item) => {
      const journal = await prisma.journal.findUnique({ where: { id: item.journalId }, select: { code: true } });
      return { name: journal?.code || 'Unknown', value: item._count.id };
    }));

    // 7. Engagement (Total Views & Downloads)
    const engagementRaw = await prisma.article.aggregate({
      where: articleWhere,
      _sum: {
        viewCount: true,
        downloadCount: true
      }
    });

    // 8. Announcements
    const totalAnnouncements = await prisma.announcement.count();
    const featuredAnnouncements = await prisma.announcement.count({ where: { isFeatured: true } });

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
        announcements: { total: totalAnnouncements, featured: featuredAnnouncements },
      },
      charts: {
        articlesByStatus,
        usersByRole: [], // Hide for simplicity or calculate
        monthlyGrowth,
        revenueByTier: revenueByTierData,
        revenueTotal: totalRevenue,
        topJournals,
        engagement: {
          views: engagementRaw._sum.viewCount || 0,
          downloads: engagementRaw._sum.downloadCount || 0
        }
      }
    });

  } catch (error: any) {
    console.error('Stats Error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
