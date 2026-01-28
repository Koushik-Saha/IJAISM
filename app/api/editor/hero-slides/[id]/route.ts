
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !['mother_admin', 'super_admin'].includes(decoded.role)) {
            return apiError('Forbidden', 403);
        }

        const body = await req.json();

        const slide = await prisma.heroSlide.update({
            where: { id },
            data: {
                title: body.title,
                subtitle: body.subtitle,
                description: body.description,
                imageUrl: body.imageUrl,
                primaryButtonText: body.primaryButtonText,
                primaryButtonLink: body.primaryButtonLink,
                secondaryButtonText: body.secondaryButtonText,
                secondaryButtonLink: body.secondaryButtonLink,
                displayOrder: body.displayOrder,
                isActive: body.isActive,
            }
        });

        return apiSuccess(slide, 'Slide updated successfully');
    } catch (error) {
        return apiError('Failed to update slide', 500);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !['mother_admin', 'super_admin'].includes(decoded.role)) {
            return apiError('Forbidden', 403);
        }

        await prisma.heroSlide.delete({ where: { id } });
        return apiSuccess(null, 'Slide deleted successfully');
    } catch (error) {
        return apiError('Failed to delete slide', 500);
    }
}
