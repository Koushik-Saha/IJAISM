import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin/editor access
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

    if (!user || !['admin', 'editor', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only allow certifying completed reviews
    if (review.status !== 'completed') {
      return NextResponse.json({ error: 'You can only grant certificates to completed reviews' }, { status: 400 });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { isCertified: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate granted successfully',
      review: updatedReview
    });
  } catch (error: any) {
    console.error('Error certifying review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grant certificate' },
      { status: 500 }
    );
  }
}
