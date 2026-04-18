import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Unauthorized', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return apiError('Unauthorized', 401);
        }

        const userId = decoded.userId;

        // Fetch the blog review assignment
        const blogReview = await prisma.blogReview.findUnique({
            where: { id: params.id },
            include: {
                blog: {
                    include: {
                        author: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        });

        if (!blogReview) {
            return apiError('Assignment not found', 404);
        }

        // Security check: Ensure this reviewer is the one assigned
        if (blogReview.reviewerId !== userId) {
            return apiError('Forbidden', 403);
        }

        return apiSuccess({ blogReview });
    } catch (error: any) {
        console.error('Error fetching blog review details:', error);
        return apiError('Failed to fetch details', 500);
    }
}
