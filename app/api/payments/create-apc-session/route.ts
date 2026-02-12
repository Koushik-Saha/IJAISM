
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

        const { articleId } = await req.json();

        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: { journal: true }
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Get Global APC Fee
        const globalSettings = await prisma.globalSettings.findUnique({
            where: { key: 'apc_fee' }
        });
        const apcFee = globalSettings ? parseFloat(globalSettings.value) : 500;
        const amount = apcFee;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Article Processing Charge (APC)`,
                            description: `For article: ${article.title}`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submissions?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submissions?canceled=true`,
            customer_email: decoded.email,
            metadata: {
                userId: decoded.userId,
                articleId: article.id,
                type: 'apc_payment'
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe APC Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
