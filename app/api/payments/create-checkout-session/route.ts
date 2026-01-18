import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
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

export async function POST(req: NextRequest) {
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

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const { tier } = await req.json();

    // 4. Validate tier
    const validTiers = ['basic', 'premium', 'institutional'];
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Check if user already has active membership
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          error: `You already have an active ${existingMembership.tier} membership`,
          existingTier: existingMembership.tier,
        },
        { status: 409 }
      );
    }

    // 6. Define pricing based on tier
    // NOTE: Replace these with your actual Stripe Price IDs after creating them in Stripe Dashboard
    const priceMapping: Record<string, { priceId: string; amount: number; description: string }> = {
      basic: {
        priceId: process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder',
        amount: 9900, // $99.00 per year
        description: 'Basic Membership - Annual',
      },
      premium: {
        priceId: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_placeholder',
        amount: 19900, // $199.00 per year
        description: 'Premium Membership - Annual',
      },
      institutional: {
        priceId: process.env.STRIPE_PRICE_INSTITUTIONAL || 'price_institutional_placeholder',
        amount: 49900, // $499.00 per year
        description: 'Institutional Membership - Annual',
      },
    };

    const selectedPrice = priceMapping[tier];

    // 7. Create Stripe Checkout Session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPrice.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership?payment=cancelled`,
      metadata: {
        userId: user.id,
        tier,
        userName: user.name,
        userEmail: user.email,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
        },
      },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    });

    // 8. Return session ID
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      tier,
      amount: selectedPrice.amount,
      description: selectedPrice.description,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment configuration. Please contact support.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create checkout session. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
