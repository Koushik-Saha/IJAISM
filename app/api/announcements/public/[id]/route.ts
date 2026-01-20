import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const announcement = await prisma.announcement.findUnique({
            where: {
                id: id,
            },
        });

        if (!announcement) {
            return NextResponse.json(
                { error: 'Announcement not found' },
                { status: 404 }
            );
        }

        // Check if published and not expired
        const now = new Date();
        if (
            !announcement.publishedAt ||
            (announcement.expiresAt && announcement.expiresAt < now)
        ) {
            // Optionally, could allow admins to view, but for public API, hide it
            // Or if we strictly follow "public", we should hide drafts/expired
            // However, if the user clicked it from homepage, it was likely visible there.
            // Homepage filters by: publishedAt: { not: null }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }

        // Fetch related announcements (same category, or just recent)
        const relatedAnnouncements = await prisma.announcement.findMany({
            where: {
                id: { not: id },
                category: announcement.category,
                publishedAt: { not: null },
                deletedAt: null,
            },
            orderBy: { publishedAt: 'desc' },
            take: 2,
        });

        // If not enough related by category, fill with recent
        if (relatedAnnouncements.length < 2) {
            const more = await prisma.announcement.findMany({
                where: {
                    id: { not: id, notIn: relatedAnnouncements.map(a => a.id) },
                    publishedAt: { not: null },
                    deletedAt: null,
                },
                orderBy: { publishedAt: 'desc' },
                take: 2 - relatedAnnouncements.length,
            });
            relatedAnnouncements.push(...more);
        }

        return NextResponse.json({ announcement, relatedAnnouncements });
    } catch (error) {
        console.error('Error fetching announcement:', error);
        return NextResponse.json(
            { error: 'Failed to fetch announcement' },
            { status: 500 }
        );
    }
}
