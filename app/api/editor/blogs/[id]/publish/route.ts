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

        // Check if user is an admin or editor
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        if (!user || !['admin', 'editor', 'super_admin', 'mother_admin'].includes(user.role)) {
            return apiError('Forbidden', 403);
        }

        const blog = await prisma.blog.findUnique({
            where: { id: params.id },
            include: { author: true }
        });

        if (!blog) {
            return apiError('Blog post not found', 404);
        }

        // Update blog status to published
        const updatedBlog = await prisma.blog.update({
            where: { id: params.id },
            data: {
                status: 'published',
                publishedAt: blog.publishedAt || new Date(),
            },
        });

        // Notify Author via email
        await sendBlogStatusUpdateEmail(
          blog.author.email,
          blog.author.name,
          blog.title,
          'published'
        );

        return apiSuccess({ blog: updatedBlog }, 'Blog post published successfully');
    } catch (error: any) {
        console.error('Error publishing blog:', error);
        return apiError('Failed to publish blog post', 500);
    }
}
