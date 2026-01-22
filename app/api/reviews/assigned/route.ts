import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getReviewerAssignments, getCompletedReviews } from '@/lib/reviews';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
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

    // 3. Get assigned and completed reviews
    const [assignedReviews, completedReviews] = await Promise.all([
      getReviewerAssignments(userId),
      getCompletedReviews(userId),
    ]);

    // 4. Calculate statistics
    const stats = {
      pending: assignedReviews.filter((r) => ['pending', 'invited'].includes(r.status)).length,
      inProgress: assignedReviews.filter((r) => ['in_progress', 'accepted'].includes(r.status)).length,
      completed: completedReviews.length,
      total: assignedReviews.length + completedReviews.length,
    };

    // 5. Return data
    return NextResponse.json(
      {
        success: true,
        assigned: assignedReviews,
        completed: completedReviews,
        stats,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching assigned reviews:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch reviews',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
