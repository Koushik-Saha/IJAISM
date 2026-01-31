import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { profileUpdateSchema } from '@/lib/validations/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
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
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        affiliation: true,
        role: true,
        orcid: true,
        bio: true,
        profileImageUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user statistics
    const [articleStats, publishedArticles] = await Promise.all([
      prisma.article.aggregate({
        where: {
          authorId: decoded.userId,
          deletedAt: null,
        },
        _sum: {
          citationCount: true,
          viewCount: true,
          downloadCount: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.article.count({
        where: {
          authorId: decoded.userId,
          status: 'published',
          deletedAt: null,
        },
      }),
    ]);

    const statistics = {
      totalArticles: articleStats._count.id,
      publishedArticles,
      totalCitations: articleStats._sum.citationCount || 0,
      totalViews: articleStats._sum.viewCount || 0,
      totalDownloads: articleStats._sum.downloadCount || 0,
    };

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        statistics,
      },
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Strict Validation (prevents Mass Assignment)
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        'Validation failed',
        400,
        validation.error.flatten().fieldErrors,
        'VALIDATION_ERROR'
      );
    }

    // Whitelisted fields only
    const data = validation.data;

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        affiliation: true,
        role: true,
        orcid: true,
        bio: true,
        profileImageUrl: true,
      },
    });

    // Get updated statistics
    const [articleStats, publishedArticles] = await Promise.all([
      prisma.article.aggregate({
        where: {
          authorId: decoded.userId,
          deletedAt: null,
        },
        _sum: {
          citationCount: true,
          viewCount: true,
          downloadCount: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.article.count({
        where: {
          authorId: decoded.userId,
          status: 'published',
          deletedAt: null,
        },
      }),
    ]);

    const statistics = {
      totalArticles: articleStats._count.id,
      publishedArticles,
      totalCitations: articleStats._sum.citationCount || 0,
      totalViews: articleStats._sum.viewCount || 0,
      totalDownloads: articleStats._sum.downloadCount || 0,
    };

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        statistics,
      },
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
