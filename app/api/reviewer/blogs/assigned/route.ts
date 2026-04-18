import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
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

    // Verify reviewer role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'reviewer') {
      return apiError('Forbidden', 403);
    }

    const blogReviews = await prisma.blogReview.findMany({
      where: { reviewerId: userId },
      include: {
        blog: {
          include: {
            author: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return apiSuccess({ blogReviews });
  } catch (error: any) {
    console.error('Error fetching reviewer blog assignments:', error);
    return apiError('Failed to fetch assignments', 500);
  }
}
