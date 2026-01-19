import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
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

    // 2. Fetch all articles for this user
    const articles = await prisma.article.findMany({
      where: {
        authorId: userId,
      },
      include: {
        journal: {
          select: {
            id: true,
            fullName: true,
            code: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        submissionDate: 'desc', // Most recent first
      },
    });

    // 3. Return articles
    return NextResponse.json(
      {
        success: true,
        count: articles.length,
        articles,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch submissions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
