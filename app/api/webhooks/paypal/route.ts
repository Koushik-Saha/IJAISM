
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMembershipActivationEmail, sendPaymentFailedEmail } from '@/lib/email/send';

// PayPal Webhook Verification Helper
// Note: In a production environment, you should use the PayPal SDK to verify the signature.
// However, verifying manually is also possible using the transmission headers.
// For simplicity in this migration, we will focus on processing the event first.
// Ideally, verify the signature using `paypal-rest-sdk` or similar, but the new Checkout SDK
// is primarily for Orders. For webhooks, we might need to manually verify or trust the payload if secret is checked.

// Important: Implement real signature verification for production security!
// Function to verify webhook signature would go here.

export async function POST(req: NextRequest) {
    try {
        // 1. Get the payload
        const body = await req.json();
        const headers = req.headers;

        // TODO: Verify Signature using PAYPAL_WEBHOOK_ID
        // const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        // const transmissionId = headers.get('paypal-transmission-id');
        // const transmissionTime = headers.get('paypal-transmission-time');
        // const certUrl = headers.get('paypal-cert-url');
        // const authAlgo = headers.get('paypal-auth-algo');
        // const transmissionSig = headers.get('paypal-transmission-sig');

        // 2. Handle Event Types
        const eventType = body.event_type;

        console.log(`[PayPal Webhook] Received event: ${eventType}`);

        if (eventType === 'PAYMENT.SALE.COMPLETED') {
            // A subscription payment was successful
            // We need to find the user via the `custom_id` or `billing_agreement_id`
            const resource = body.resource;
            const subscriptionId = resource.billing_agreement_id;

            if (subscriptionId) {
                // Extend membership
                const membership = await prisma.membership.findFirst({
                    where: { paypalSubscriptionId: subscriptionId },
                    include: { user: true }
                });

                if (membership) {
                    // Update end date (add 1 year or 1 month based on plan)
                    const currentEndDate = new Date(membership.endDate);
                    const newEndDate = new Date(currentEndDate);
                    newEndDate.setFullYear(newEndDate.getFullYear() + 1); // Assuming yearly for now

                    await prisma.membership.update({
                        where: { id: membership.id },
                        data: {
                            endDate: newEndDate,
                            status: 'active'
                        }
                    });

                    // Send email
                    try {
                        await sendMembershipActivationEmail(
                            membership.user.email,
                            membership.user.name || 'Member',
                            membership.tier,
                            newEndDate,
                            subscriptionId
                        );
                    } catch (emailError) {
                        console.error('[PayPal Webhook] Failed to send activation email', emailError);
                    }
                    console.log(`[PayPal Webhook] Membership extended for user ${membership.userId}`);
                } else {
                    console.warn(`[PayPal Webhook] No membership found for subscription: ${subscriptionId}`);
                }
            }

        } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
            const resource = body.resource;
            const subscriptionId = resource.id;

            await prisma.membership.updateMany({
                where: { paypalSubscriptionId: subscriptionId },
                data: { autoRenew: false }
            });
            console.log(`[PayPal Webhook] Subscription cancelled: ${subscriptionId}`);

        } else if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
            const resource = body.resource;
            const subscriptionId = resource.id;

            await prisma.membership.updateMany({
                where: { paypalSubscriptionId: subscriptionId },
                data: { status: 'suspended' }
            });
            console.log(`[PayPal Webhook] Subscription suspended: ${subscriptionId}`);
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[PayPal Webhook Error]', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
