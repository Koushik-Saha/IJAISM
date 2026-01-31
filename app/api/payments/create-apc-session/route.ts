
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const { articleId } = await req.json();
        if (!articleId) return NextResponse.json({ error: 'Article ID required' }, { status: 400 });

        // 2. Fetch Article
        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: {
                author: true,
                journal: true
            }
        });

        if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

        // 3. Ownership Check
        if (article.authorId !== decoded.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 4. Status Check
        if (article.status !== 'accepted') {
            return NextResponse.json({ error: 'Article is not accepted yet' }, { status: 400 });
        }

        if (article.isApcPaid) {
            return NextResponse.json({ error: 'APC already paid' }, { status: 400 });
        }

        // 5. Calculate Amount
        // Default 500 USD if not specified by Journal
        const amount = article.journal.articleProcessingCharge || 500;

        // 6. Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Article Processing Charge (APC)`,
                            description: `APC for article: ${article.title}`,
                        },
                        unit_amount: Math.round(amount * 100), // cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/articles/${articleId}?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/articles/${articleId}?payment=cancelled`,
            metadata: {
                type: 'apc_payment',
                articleId: article.id,
                userId: decoded.userId,
            },
            customer_email: article.author.email,
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Stripe Session Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
