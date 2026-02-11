
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api-response';
import { z } from 'zod';

const subscribeSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = subscribeSchema.safeParse(body);

        if (!result.success) {
            return apiError(result.error.issues[0].message, 400);
        }

        const { email } = result.data;

        // Check if already subscribed
        const existing = await prisma.newsletterSubscriber.findUnique({
            where: { email },
        });

        if (existing) {
            if (!existing.isActive) {
                // Reactivate if previously unsubscribed (if logic existed) or just return success
                await prisma.newsletterSubscriber.update({
                    where: { email },
                    data: { isActive: true },
                });
            }
            return apiSuccess(null, 'Successfully subscribed!');
        }

        await prisma.newsletterSubscriber.create({
            data: { email },
        });

        return apiSuccess(null, 'Successfully subscribed!');
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return apiError('Failed to subscribe. Please try again later.', 500);
    }
}
