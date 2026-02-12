
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

        const { tier, interval } = await req.json();

        let priceId;
        switch (tier) { // Basic, Premium, Institutional
            case 'Basic':
                priceId = process.env.STRIPE_PRICE_BASIC;
                break;
            case 'Premium':
                priceId = process.env.STRIPE_PRICE_PREMIUM;
                break;
            case 'Institutional':
                priceId = process.env.STRIPE_PRICE_INSTITUTIONAL;
                break;
            default:
                return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership/cancel`,
            customer_email: decoded.email,
            metadata: {
                userId: decoded.userId,
                tier: tier,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
