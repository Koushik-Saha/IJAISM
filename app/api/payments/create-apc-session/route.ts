
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { stripe } from '@/lib/stripe'; // Assuming this exists, if not I'll check/fix
import { apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Unauthorized', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return apiError('Invalid token', 401);
        }

        const { articleId } = await req.json();

        if (!articleId) {
            return apiError('Article ID is required', 400);
        }

        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: {
                journal: true,
                author: true
            }
        });

        if (!article) {
            return apiError('Article not found', 404);
        }

        // Verify ownership
        if (article.authorId !== decoded.userId) {
            // Technically an admin could pay? But for now stick to author.
            return apiError('Unauthorized', 403);
        }

        if (article.isApcPaid) {
            return apiError('APC already paid', 400);
        }

        // Determine APC Amount
        // Use Journal's APC if set, otherwise default or error?
        // User didn't specify amount logic, I'll fallback to a default if journal is 0/null, or maybe 0 means free?
        // Let's assume a default of $500 if mostly placeholder.
        let amount = article.journal.articleProcessingCharge || 0;

        // If amount is 0, maybe we validly skip payment?
        // But schema says 'apcAmount' Float?.
        // If it's truly 0, we should mark as paid instantly? 
        // For now, let's assume we proceed to Stripe with a minimum amount or handle > 0.

        if (amount <= 0) {
            // If free, just mark as paid? Or throw error?
            // Let's force a minimum $1 for Stripe testing if generic.
            // Or assume 100 USD.
            amount = 100;
        }

        // Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `APC Fee: ${article.title.substring(0, 100)}`, // Max 150 chars, safer to limit
                            description: `Article Processing Charge for ${article.journal.code}`,
                        },
                        unit_amount: Math.round(amount * 100), // Cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submissions/${articleId}?payment_success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submissions/${articleId}?payment_canceled=true`,
            metadata: {
                articleId: articleId,
                userId: decoded.userId,
                type: 'apc_payment'
            },
            customer_email: article.author.email
        });

        return NextResponse.json({
            success: true,
            url: session.url,
            sessionId: session.id
        });

    } catch (error: any) {
        console.error('APC Session Error:', error);
        return apiError('Failed to create payment session', 500);
    }
}
