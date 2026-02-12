
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

async function handleMembershipSubscription(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;
    const subscriptionId = session.subscription as string;

    if (!userId || !tier) return;

    // Check if user has membership
    const existing = await prisma.membership.findUnique({ where: { userId } });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Default 1 year

    if (existing) {
        await prisma.membership.update({
            where: { userId },
            data: {
                tier,
                status: 'active',
                stripeSubscriptionId: subscriptionId,
                endDate, // Extend
                autoRenew: true
            }
        });
    } else {
        await prisma.membership.create({
            data: {
                userId,
                tier,
                status: 'active',
                stripeSubscriptionId: subscriptionId,
                startDate,
                endDate,
                autoRenew: true
            }
        });
    }
}

async function handleApcPayment(session: Stripe.Checkout.Session) {
    const articleId = session.metadata?.articleId;
    const userId = session.metadata?.userId;
    const paymentId = session.payment_intent as string || session.id;

    if (!articleId) return;

    await prisma.article.update({
        where: { id: articleId },
        data: {
            isApcPaid: true,
            apcAmount: session.amount_total ? session.amount_total / 100 : 0,
            stripePaymentId: paymentId
        }
    });
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === 'subscription') {
                    await handleMembershipSubscription(session);
                } else if (session.mode === 'payment' && session.metadata?.type === 'apc_payment') {
                    await handleApcPayment(session);
                }
                break;
            case 'customer.subscription.updated':
                // logic to update subscription status/end date
                break;
            case 'invoice.payment_succeeded':
                // logic to extend subscription on recurring payment
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
