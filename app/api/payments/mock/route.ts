import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (process.env.NEXT_PUBLIC_MOCK_PAYMENT !== 'true') {
            return NextResponse.json({ error: 'Mock payments are disabled' }, { status: 403 });
        }

        const { articleId } = await req.json();

        // Update Article to paid
        const article = await prisma.article.update({
            where: { id: articleId },
            data: { isApcPaid: true }
        });

        // Add to activity log to track the mock payment
        await prisma.activityLog.create({
            data: {
                action: 'Mock APC Payment',
                details: `Mock payment processed for article ${article.title}`,
                userId: decoded.userId,
                articleId: article.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Mock Payment Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
