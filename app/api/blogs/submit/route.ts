import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { blogSubmissionSchema } from '@/lib/validations/blog';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';
import { sendBlogSubmissionEmail } from '@/lib/email/send';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized - No token provided', 401, undefined, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return apiError('Unauthorized - Invalid token', 401, undefined, 'INVALID_TOKEN');
    }

    const userId = decoded.userId;
    const body = await req.json();

    const validation = blogSubmissionSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0].message,
        400,
        validation.error.flatten().fieldErrors,
        'VALIDATION_ERROR'
      );
    }

    const { title, content, excerpt, featuredImageUrl, category } = validation.data;

    // Basic slug generation
    let slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    // Check for slug collision
    const existingSlug = await prisma.blog.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const blog = await prisma.blog.create({
      data: {
        title: title.trim(),
        content,
        excerpt: excerpt?.trim() || content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
        featuredImageUrl,
        category,
        slug,
        authorId: userId,
        status: 'submitted', // initial status for public submission
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Create Notification for Admins (in a real app, you'd fetch admins here)
    // For now, let's just log and create a notification for the submitting user as confirmation
    await prisma.notification.create({
      data: {
        userId,
        type: 'blog_update',
        title: 'Blog Submitted',
        message: `Your blog "${title}" has been submitted for review.`,
        link: `/blogs/${slug}`, // Link to preview if needed, or dashboard
        isRead: false,
      }
    });

    // Notify Author via Email
    await sendBlogSubmissionEmail(
      blog.author.email,
      blog.author.name,
      blog.title,
      blog.id,
      blog.createdAt
    );

    logger.info('Blog submitted successfully', { blogId: blog.id, userId });

    return apiSuccess({
      message: 'Blog submitted successfully and is now under review.',
      blog: {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        status: blog.status,
      }
    }, 'Blog submitted successfully', 201);

  } catch (error: any) {
    logger.error('Blog submission error', error);
    return apiError('Internal server error', 500);
  }
}
