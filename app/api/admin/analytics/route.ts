
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Auth Check
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check for super_admin or mother_admin (as per request)
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true }
        });

        if (!user || (user.role !== 'super_admin' && user.role !== 'mother_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Aggregation: Downloads by Country
        // @ts-ignore
        const downloadsByCountry = await prisma.downloadLog.groupBy({
            by: ['country'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        }) as unknown as Array<{ country: string | null, _count: { id: number } }>;

        const formattedCountryStats = downloadsByCountry.map(item => ({
            country: item.country || 'Unknown',
            downloads: item._count.id
        }));

        // System Stats (Real Data)
        const [userCount, articleCount, downloadCount, activeJournalCount] = await Promise.all([
            prisma.user.count(),
            prisma.article.count(),
            prisma.downloadLog.count(),
            prisma.journal.count({ where: { isActive: true } })
        ]);

        const systemStats = {
            users: userCount,
            articles: articleCount,
            downloads: downloadCount,
            journals: activeJournalCount
        };

        return NextResponse.json({
            geolocation: formattedCountryStats,
            system: systemStats
        });

    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
