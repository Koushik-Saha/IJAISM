import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ authenticated: false, tier: 'guest', limit: 0, remaining: 0, canDownload: false });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ authenticated: false, tier: 'guest', limit: 0, remaining: 0, canDownload: false });
        }

        const userId = decoded.userId;

        // Fetch User with Membership
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { membership: true }
        });

        if (!user) {
            return NextResponse.json({ authenticated: false, tier: 'guest', limit: 0, remaining: 0, canDownload: false });
        }

        // Always allow editors/admins
        if (['editor', 'super_admin', 'mother_admin'].includes(user.role)) {
            return NextResponse.json({ authenticated: true, tier: 'admin', limit: Infinity, remaining: Infinity, canDownload: true });
        }

        // Determine Tier and Limit
        let tier = 'free';
        if (user.membership && user.membership.status === 'active' && user.membership.endDate > new Date()) {
            tier = user.membership.tier.toLowerCase();
        }

        let limit = 0;
        if (tier === 'free') limit = 3;
        else if (tier === 'basic') limit = 10;
        else if (tier === 'premium' || tier === 'institutional') limit = Infinity;

        if (limit === Infinity) {
            return NextResponse.json({ authenticated: true, tier, limit: 'unlimited', remaining: 'unlimited', canDownload: true });
        }

        // Count this month's unique article downloads
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Prisma doesn't have a direct count distinct feature easily, we'll fetch distinct resourceIds
        const downloads = await prisma.downloadLog.findMany({
            where: {
                userId: userId,
                resourceType: 'article',
                downloadedAt: {
                    gte: startOfMonth
                }
            },
            select: {
                resourceId: true
            },
            distinct: ['resourceId']
        });

        const downloadedCount = downloads.length;
        const remaining = Math.max(0, limit - downloadedCount);
        const canDownload = remaining > 0;

        return NextResponse.json({
            authenticated: true,
            tier,
            limit,
            remaining,
            canDownload
        });

    } catch (error: any) {
        console.error("Download Status Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
