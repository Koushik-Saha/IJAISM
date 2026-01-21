import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getReviewById, submitReviewDecision, startReview, ReviewDecision } from '@/lib/reviews';
import { reviewDecisionSchema } from '@/lib/validations/review';
import { prisma } from '@/lib/prisma';

// GET single review
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. Verify user is a reviewer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'reviewer') {
      return NextResponse.json(
        { error: 'Access denied - Reviewer role required' },
        { status: 403 }
      );
    }

    // 3. Get review
    const review = await getReviewById(id, userId);

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found or access denied' },
        { status: 404 }
      );
    }

    // 4. Return review
    return NextResponse.json(
      {
        success: true,
        review,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch review',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST submit review decision
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. Verify user is a reviewer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'reviewer') {
      return NextResponse.json(
        { error: 'Access denied - Reviewer role required' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await req.json();

    // Zod Validation
    const validation = reviewDecisionSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        {
          error: firstError.message,
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { decision, commentsToAuthor, commentsToEditor } = validation.data;

    // 6. Submit review
    const updatedReview = await submitReviewDecision(
      id,
      userId,
      decision,
      commentsToAuthor.trim(),
      commentsToEditor?.trim()
    );

    // 7. Return success
    return NextResponse.json(
      {
        success: true,
        message: 'Review submitted successfully',
        review: updatedReview,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting review:', error);

    if (error.message === 'Review not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message === 'Review already submitted') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: 'Failed to submit review',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// PATCH start review (mark as in progress)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. Start review
    const review = await startReview(id, userId);

    // 3. Return success
    return NextResponse.json(
      {
        success: true,
        message: 'Review started',
        review,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error starting review:', error);

    if (error.message === 'Review not found or already started') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to start review',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
