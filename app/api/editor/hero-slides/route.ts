
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const slides = await prisma.heroSlide.findMany({
            orderBy: { displayOrder: 'asc' },
        });
        return apiSuccess(slides);
    } catch (error) {
        return apiError('Failed to fetch slides', 500);
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
        const slide = await prisma.heroSlide.create({
            data: {
                title: body.title,
                subtitle: body.subtitle,
                description: body.description,
                imageUrl: body.imageUrl,
                primaryButtonText: body.primaryButtonText,
                primaryButtonLink: body.primaryButtonLink,
                secondaryButtonText: body.secondaryButtonText,
                secondaryButtonLink: body.secondaryButtonLink,
                displayOrder: body.displayOrder || 0,
                isActive: body.isActive !== undefined ? body.isActive : true,
            },
        });

        return apiSuccess(slide, 'Slide created successfully');
    } catch (error) {
        return apiError('Failed to create slide', 500);
    }
}

export async function PUT(req: NextRequest) {
    // Basic update logic (omitted id in URL for simplicity, expecting body to contain id)
    // Ideally should be /api/editor/hero/[id], but for quick implementation we can do it here or update separate file.
    // Let's stick to standard practice: this file handles collection.
    return apiError('Method not allowed', 405);
}
