import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Initialize Stripe (lazy initialization to avoid build errors)
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

// Webhook secret from Stripe Dashboard
function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return secret;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      const webhookSecret = getWebhookSecret();
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`✅ Received Stripe event: ${event.type}`);

    // 3. Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription created: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // 4. Return success response
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;

    if (!userId || !tier) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    console.log(`Processing checkout for user ${userId}, tier: ${tier}`);

    // Get subscription ID
    const subscriptionId = session.subscription as string;

    // Calculate membership dates (1 year from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Create or update membership
    const existingMembership = await prisma.membership.findFirst({
      where: { userId },
    });

    let membership;

    if (existingMembership) {
      // Update existing membership
      membership = await prisma.membership.update({
        where: { id: existingMembership.id },
        data: {
          tier,
          status: 'active',
          startDate,
          endDate,
          stripeSubscriptionId: subscriptionId,
          autoRenew: true,
        },
      });
      console.log(`Updated existing membership: ${membership.id}`);
    } else {
      // Create new membership
      membership = await prisma.membership.create({
        data: {
          userId,
          tier,
          status: 'active',
          startDate,
          endDate,
          stripeSubscriptionId: subscriptionId,
          autoRenew: true,
        },
      });
      console.log(`Created new membership: ${membership.id}`);
    }

    // Get user details for notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'membership',
        title: 'Membership Activated!',
        message: `Congratulations! Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} membership has been successfully activated. You now have full access to all IJAISM benefits.`,
        link: '/dashboard',
        isRead: false,
      },
    });

    console.log(`✅ Membership activated for user ${userId}: ${tier}`);

    // TODO: Send confirmation email (Task 1.3)

  } catch (error) {
    console.error('Error handling checkout complete:', error);
    throw error;
  }
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    // Update membership status based on subscription status
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        stripeSubscriptionId: subscription.id,
      },
    });

    if (!membership) {
      console.error(`No membership found for subscription ${subscription.id}`);
      return;
    }

    // Update status based on Stripe subscription status
    let status = 'active';
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      status = 'expired';
    } else if (subscription.status === 'past_due') {
      status = 'active'; // Keep active but notify user
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: { status },
    });

    console.log(`Updated membership ${membership.id} status to: ${status}`);

  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    // Find and update membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        stripeSubscriptionId: subscription.id,
      },
    });

    if (!membership) {
      console.error(`No membership found for subscription ${subscription.id}`);
      return;
    }

    // Update membership to expired
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'expired',
        autoRenew: false,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'membership',
        title: 'Membership Cancelled',
        message: `Your ${membership.tier} membership has been cancelled. You will have access until ${membership.endDate?.toLocaleDateString()}.`,
        link: '/membership',
        isRead: false,
      },
    });

    console.log(`✅ Membership cancelled for user ${userId}`);

  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

// Handle failed payments
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    // Get subscription ID from invoice (can be string or expanded object)
    const subscriptionId = (invoice as any).subscription
      ? typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id
      : null;

    if (!subscriptionId) {
      console.error('No subscription ID in invoice');
      return;
    }

    // Find membership by subscription ID
    const membership = await prisma.membership.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!membership) {
      console.error(`No membership found for subscription ${subscriptionId}`);
      return;
    }

    // Create notification for payment failure
    await prisma.notification.create({
      data: {
        userId: membership.userId,
        type: 'membership',
        title: 'Payment Failed',
        message: `Your recent payment failed. Please update your payment method to continue your ${membership.tier} membership.`,
        link: '/membership',
        isRead: false,
      },
    });

    console.log(`⚠️ Payment failed notification sent to user ${membership.userId}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}
