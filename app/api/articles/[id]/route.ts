import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // 2. Fetch the article
    const article = await prisma.article.findUnique({
      where: {
        id,
      },
      include: {
        journal: {
          select: {
            id: true,
            fullName: true,
            code: true,
            issn: true,
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
    });

    // 3. Check if article exists
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // 4. Verify user owns this article (security check)
    if (article.authorId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this article' },
        { status: 403 }
      );
    }

    // 5. Return article
    return NextResponse.json(
      {
        success: true,
        article,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch article',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
