import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { sendBlogStatusUpdateEmail } from '@/lib/email/send';

export async function POST(
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

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        if (!user || !['admin', 'editor', 'super_admin', 'mother_admin'].includes(user.role)) {
            return apiError('Forbidden', 403);
        }

        const { decision, comments } = await req.json();

        if (!['accepted', 'rejected', 'revision_requested'].includes(decision)) {
            return apiError('Invalid decision type', 400);
        }

        const blog = await prisma.blog.findUnique({
            where: { id: params.id },
            include: { author: true }
        });

        if (!blog) {
            return apiError('Blog post not found', 404);
        }

        const updatedBlog = await prisma.blog.update({
            where: { id: params.id },
            data: { status: decision },
        });

        // Map status to user-friendly term for notification
        const statusMap: Record<string, string> = {
            accepted: 'accepted',
            rejected: 'rejected',
            revision_requested: 'sent back for revision'
        };

    // Notify Author via email
    await sendBlogStatusUpdateEmail(
      blog.author.email,
      blog.author.name,
      blog.title,
      decision,
      comments
    );

    return apiSuccess({ blog: updatedBlog }, `Blog post ${decision} successfully`);
    } catch (error: any) {
        console.error('Error recording blog decision:', error);
        return apiError('Failed to record decision', 500);
    }
}
