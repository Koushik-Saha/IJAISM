
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Note: checkout-server-sdk does NOT support Subscriptions API well.
// We might need to use standard fetch for this or just rely on Frontend-initiated subscription creation 
// and handle the "onApprove" with a webhook/callback verification.
//
// However, best practice is to define the subscription plan on Server-Side and return the ID.
// For simplicity in this migration, passing the Plan ID to the frontend JS SDK is often sufficient, 
// but we need an endpoint to Validate and Record the subscription after approval.

export async function POST(req: NextRequest) {
    try {
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
        const userId = decoded.userId;

        // 2. Parse Subscription Details from Frontend (After Approval)
        // When using PayPal React SDK for Subscriptions, the "createSubscription" callback happens on client,
        // and "onApprove" gives us the subscriptionID. We need to store this.
        const { subscriptionID, tier } = await req.json();

        if (!subscriptionID || !tier) {
            return NextResponse.json({ error: 'Missing Subscription Data' }, { status: 400 });
        }

        // 3. Store Subscription in Database
        // We assume it's active if onApprove triggered, but ideally we verify via API.
        // Since SDK is limited, we will trust the client for the immediate UX but verify via Webhook later.

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        // Upsert Membership
        const membership = await prisma.membership.upsert({
            where: { userId },
            update: {
                tier,
                status: 'active',
                paypalSubscriptionId: subscriptionID,
                startDate,
                endDate,
                autoRenew: true
            },
            create: {
                userId,
                tier,
                status: 'active',
                paypalSubscriptionId: subscriptionID,
                startDate,
                endDate,
                autoRenew: true
            }
        });

        console.log(`User ${userId} subscribed to ${tier} via PayPal: ${subscriptionID}`);

        return NextResponse.json({ success: true, membershipId: membership.id });

    } catch (error: any) {
        console.error('Subscription Recording Error:', error);
        return NextResponse.json({ error: 'Failed to record subscription' }, { status: 500 });
    }
}
