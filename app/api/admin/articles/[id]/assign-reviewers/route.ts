import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { assignReviewers } from '@/lib/review-system';
import {sendArticleStatusUpdateEmail} from "@/lib/email/send";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { reviewerIds, dueInDays } = body;

    // Validate
    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length !== 4) {
      return NextResponse.json(
        { error: 'Exactly 4 reviewer IDs are required' },
        { status: 400 }
      );
    }

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, email: true } },
        reviews: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if reviewers already assigned
    if (article.reviews.length > 0) {
      return NextResponse.json(
        { error: 'Reviewers already assigned to this article' },
        { status: 400 }
      );
    }

    // Verify all reviewers exist and have reviewer role
    const reviewers = await prisma.user.findMany({
      where: {
        id: { in: reviewerIds },
        role: 'reviewer',
      },
    });

    if (reviewers.length !== 4) {
      return NextResponse.json(
        { error: 'All assigned users must have reviewer role' },
        { status: 400 }
      );
    }

    // Assign reviewers
    const reviews = await assignReviewers(id, reviewerIds);

    // Send email notification to author
    try {
      await sendArticleStatusUpdateEmail(
        article.author.email,
        article.author.name || article.author.email.split('@')[0],
        article.title,
        article.status,
        'under_review',
        article.id,
        'Your article has been assigned to 4 reviewers. The review process typically takes 4-6 weeks.'
      );
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the assignment if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Reviewers assigned successfully',
      reviews: reviews.map((r) => ({
        id: r.id,
        reviewerId: r.reviewerId,
        reviewerNumber: r.reviewerNumber,
        status: r.status,
        dueDate: r.dueDate,
      })),
    });
  } catch (error: any) {
    console.error('Error assigning reviewers:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to assign reviewers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
