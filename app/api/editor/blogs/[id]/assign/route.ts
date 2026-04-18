import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { sendBlogReviewAssignmentEmail } from '@/lib/email/send';

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

    // Only Mother Admin or Super Admin can assign reviewers for blogs
    if (!user || !['super_admin', 'mother_admin'].includes(user.role)) {
      return apiError('Forbidden', 403);
    }

    const { reviewerId } = await req.json();

    if (!reviewerId) {
      return apiError('Reviewer ID is required', 400);
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { role: true, name: true, email: true }
    });

    if (!reviewer || reviewer.role !== 'reviewer') {
      return apiError('Invalid reviewer selected', 400);
    }

    const blog = await prisma.blog.findUnique({
      where: { id: params.id },
      select: { title: true, excerpt: true }
    });

    if (!blog) {
      return apiError('Blog post not found', 404);
    }

    // Get current reviewer count for this blog
    const reviewCount = await prisma.blogReview.count({
      where: { blogId: params.id }
    });

    const blogReview = await prisma.blogReview.create({
      data: {
        blogId: params.id,
        reviewerId,
        reviewerNumber: reviewCount + 1,
        status: 'pending'
      }
    });

    // Update blog status
    await prisma.blog.update({
      where: { id: params.id },
      data: { status: 'under_review' }
    });

    // Notify Reviewer via Notification
    await prisma.notification.create({
      data: {
        userId: reviewerId,
        type: 'blog_review_assigned',
        title: 'New Blog Review Assigned',
        message: `You have been assigned to review a blog post: "${blog.title}".`,
        link: `/dashboard/reviews/blogs/${blogReview.id}`,
        isRead: false,
      }
    });

    // Notify Reviewer via Email
    await sendBlogReviewAssignmentEmail(
      reviewer.email,
      reviewer.name,
      blog.title,
      blog.excerpt || '',
      blogReview.id
    );

    return apiSuccess({ blogReview }, 'Reviewer assigned successfully');
  } catch (error: any) {
    console.error('Error assigning blog reviewer:', error);
    return apiError('Failed to assign reviewer', 500);
  }
}
