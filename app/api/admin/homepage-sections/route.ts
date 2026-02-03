
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const sections = await prisma.homePageSection.findMany({
            orderBy: { displayOrder: 'asc' },
        });

        // Seed if empty
        if (sections.length === 0) {
            const defaultSections = [
                { type: 'hero_carousel', title: 'Hero Carousel', displayOrder: 0, isActive: true },
                { type: 'announcements', title: 'Latest Announcements', displayOrder: 1, isActive: true },
                { type: 'journals', title: 'Academic Journals', displayOrder: 2, isActive: true },
                { type: 'latest_articles', title: 'Latest Articles', displayOrder: 3, isActive: true },
                { type: 'most_viewed', title: 'Most Viewed Articles', displayOrder: 4, isActive: true },
                { type: 'newsletter', title: 'Newsletter Subscription', displayOrder: 5, isActive: true },
                { type: 'stats', title: 'Platform Statistics', displayOrder: 6, isActive: true },
            ];

            // Create defaults
            await Promise.all(defaultSections.map(s => prisma.homePageSection.create({ data: s })));

            // Fetch again
            const seededSections = await prisma.homePageSection.findMany({
                orderBy: { displayOrder: 'asc' },
            });
            return apiSuccess(seededSections);
        }

        return apiSuccess(sections);
    } catch (error) {
        return apiError('Failed to fetch sections', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !['mother_admin', 'super_admin'].includes(decoded.role)) {
            return apiError('Forbidden', 403);
        }

        const body = await req.json();

        // Get max order
        const lastSection = await prisma.homePageSection.findFirst({
            orderBy: { displayOrder: 'desc' },
        });
        const newOrder = (lastSection?.displayOrder ?? -1) + 1;

        const section = await prisma.homePageSection.create({
            data: {
                type: body.type, // 'html', 'text', or standard types
                title: body.title,
                content: body.content,
                displayOrder: newOrder,
                isActive: true,
            },
        });

        return apiSuccess(section, 'Section created successfully');
    } catch (error) {
        return apiError('Failed to create section', 500);
    }
}

export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !['mother_admin', 'super_admin'].includes(decoded.role)) {
            return apiError('Forbidden', 403);
        }

        const body = await req.json();
        const { sections } = body; // Array of { id, displayOrder }

        if (!Array.isArray(sections)) {
            return apiError('Invalid data', 400);
        }

        // Transactional update for ordering
        await prisma.$transaction(
            sections.map((s: any) =>
                prisma.homePageSection.update({
                    where: { id: s.id },
                    data: { displayOrder: s.displayOrder }
                })
            )
        );

        return apiSuccess(null, 'Order updated successfully');
    } catch (error) {
        return apiError('Failed to update order', 500);
    }
}
