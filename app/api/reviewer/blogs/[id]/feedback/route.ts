import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { blogReviewSchema } from '@/lib/validations/blog';

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

    const userId = decoded.userId;
    const body = await req.json();

    const validation = blogReviewSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const { decision, commentsToAdmin, commentsToAuthor } = validation.data;

    const blogReview = await prisma.blogReview.findFirst({
      where: {
        id: params.id,
        reviewerId: userId,
        status: 'pending'
      }
    });

    if (!blogReview) {
      return apiError('Active review assignment not found', 404);
    }

    await prisma.blogReview.update({
      where: { id: blogReview.id },
      data: {
        decision,
        commentsToAdmin,
        commentsToAuthor,
        status: 'completed',
        submittedAt: new Date()
      }
    });

    // Notify Author and Admins
    const blog = await prisma.blog.findUnique({
      where: { id: blogReview.blogId },
      include: { author: true }
    });

    if (blog) {
      // Internal notification to Author
      await prisma.notification.create({
        data: {
          userId: blog.authorId,
          type: 'blog_update',
          title: 'Review Received',
          message: `A reviewer has submitted feedback on your blog "${blog.title}".`,
          link: `/dashboard/blogs`, 
          isRead: false,
        }
      });
      
      // Optionally notify admins (system notification)
      // Here we assume editors check the dashboard, but we could add email logic here too
    }

    return apiSuccess({}, 'Review feedback submitted successfully');
  } catch (error: any) {
    console.error('Error submitting blog review feedback:', error);
    return apiError('Failed to submit feedback', 500);
  }
}
