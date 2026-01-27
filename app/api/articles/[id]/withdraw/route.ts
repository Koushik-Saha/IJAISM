
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Verify Authentication
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Fetch Article with Reviews
        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                reviews: true,
            },
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // 3. Check Ownership
        if (article.authorId !== decoded.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 4. Check Withdrawal Eligibility
        // "author can withdrow any articles as many time as before editor assign reviewer"
        if (article.reviews.length > 0) {
            return NextResponse.json(
                { error: 'Cannot withdraw artice: Reviewers have already been assigned.' },
                { status: 403 }
            );
        }

        if (article.status === 'published') {
            return NextResponse.json(
                { error: 'Cannot withdraw published article.' },
                { status: 403 }
            );
        }

        // 5. Update Status
        const updatedArticle = await prisma.article.update({
            where: { id },
            data: {
                status: 'withdrawn',
            },
        });

        return NextResponse.json({ success: true, article: updatedArticle });

    } catch (error: any) {
        console.error('Withdraw error:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
