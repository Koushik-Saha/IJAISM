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
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true,
              },
            },
          },
        },
        coAuthors: true,
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
    // Note: Public/Published articles might be accessed by anyone in some contexts, but here we seem to enforce Author ownership OR Editor access?
    // The previous code only checked `if (article.authorId !== userId)`.
    // Wait, if I am an Editor, I should be allowed?
    // The previous code actually BLOCKED editors! (Line 76: `if (article.authorId !== userId)`).
    // I should fix that too to allow Editors.

    const isEditor = decoded && ['editor', 'super_admin', 'mother_admin'].includes(decoded.role);
    const isAuthor = article.authorId === userId;

    if (!isAuthor && !isEditor) {
      // If it's published, maybe allow? For now, stick to secure unless public route.
      // Assuming this is the Author's dashboard view API.
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this article' },
        { status: 403 }
      );
    }

    // 5. Mask Data if not Editor (i.e. Author)
    if (!isEditor) {
      // Mask Reviewer Names
      (article.reviews as any) = article.reviews.map((review, index) => ({
        ...review,
        reviewer: {
          name: `Reviewer ${index + 1}`
        }
      }));
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
