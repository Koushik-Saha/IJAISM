
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const section = await prisma.homePageSection.update({
            where: { id },
            data: {
                title: body.title,
                content: body.content,
                isActive: body.isActive,
                // type usually doesn't change
            },
        });

        return apiSuccess(section, 'Section updated');
    } catch (error) {
        return apiError('Failed to update section', 500);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !['mother_admin', 'super_admin'].includes(decoded.role)) {
            return apiError('Forbidden', 403);
        }

        await prisma.homePageSection.delete({
            where: { id },
        });

        return apiSuccess(null, 'Section deleted');
    } catch (error) {
        return apiError('Failed to delete section', 500);
    }
}
