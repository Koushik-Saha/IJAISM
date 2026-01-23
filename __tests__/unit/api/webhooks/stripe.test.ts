
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/webhooks/stripe/route';
import { prisma } from '@/lib/prisma';
import { sendMembershipActivationEmail, sendPaymentFailedEmail } from '@/lib/email/send';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        membership: {
            findFirst: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        notification: {
            create: jest.fn(),
        },
    },
}));

jest.mock('@/lib/email/send', () => ({
    sendMembershipActivationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendPaymentFailedEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

// Mock Stripe
const mockConstructEvent = jest.fn();
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        webhooks: {
            constructEvent: mockConstructEvent,
        },
    }));
});

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';

describe('Stripe Webhook API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createRequest = (bodyStr: string, signature: string | null = 'valid-sig') => {
        return new NextRequest(new URL('http://localhost:3000/api/webhooks/stripe'), {
            method: 'POST',
            headers: {
                'stripe-signature': signature || '',
                'content-type': 'application/json',
            },
            body: bodyStr,
        });
    };

    describe('Validation', () => {
        it('should return 400 if signature is missing', async () => {
            const req = createRequest('{}', null);
            const res = await POST(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBe('No signature provided');
        });

        it('should return 400 if signature verification fails', async () => {
            mockConstructEvent.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const req = createRequest('{}');
            const res = await POST(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toContain('Webhook Error');
        });
    });

    describe('Event Types', () => {
        it('should handle checkout.session.completed for new membership', async () => {
            mockConstructEvent.mockReturnValue({
                type: 'checkout.session.completed',
                id: 'evt_123',
                data: {
                    object: {
                        id: 'cs_123',
                        subscription: 'sub_123',
                        metadata: { userId: 'user-1', tier: 'premium' },
                    },
                },
            });

            (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null); // No existing
            (prisma.membership.create as jest.Mock).mockResolvedValue({ id: 'mem-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'test@test.com', name: 'Test' });

            const req = createRequest('{}');
            const res = await POST(req);

            expect(res.status).toBe(200);

            // Verify DB creation
            expect(prisma.membership.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'user-1',
                    tier: 'premium',
                    stripeSubscriptionId: 'sub_123',
                    status: 'active',
                }),
            }));

            // Verify Email sent
            expect(sendMembershipActivationEmail).toHaveBeenCalledWith(
                'test@test.com',
                'Test',
                'premium',
                expect.any(Date),
                'sub_123'
            );
        });

        it('should handle checkout.session.completed for existing membership (update)', async () => {
            mockConstructEvent.mockReturnValue({
                type: 'checkout.session.completed',
                id: 'evt_123',
                data: {
                    object: {
                        id: 'cs_123',
                        subscription: 'sub_new',
                        metadata: { userId: 'user-1', tier: 'premium' },
                    },
                },
            });

            (prisma.membership.findFirst as jest.Mock).mockResolvedValue({ id: 'mem-1' });
            (prisma.membership.update as jest.Mock).mockResolvedValue({ id: 'mem-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'test@test.com' });

            const req = createRequest('{}');
            await POST(req);

            expect(prisma.membership.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'mem-1' },
                data: expect.objectContaining({
                    stripeSubscriptionId: 'sub_new',
                })
            }));
        });

        it('should handle invoice.payment_failed', async () => {
            mockConstructEvent.mockReturnValue({
                type: 'invoice.payment_failed',
                id: 'evt_fail',
                data: {
                    object: {
                        id: 'in_123',
                        subscription: 'sub_123',
                    },
                },
            });

            (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
                userId: 'user-1',
                tier: 'basic',
                stripeSubscriptionId: 'sub_123'
            });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'test@test.com' });

            const req = createRequest('{}');
            await POST(req);

            expect(sendPaymentFailedEmail).toHaveBeenCalled();
            expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    title: 'Payment Failed',
                })
            }));
        });
    });
});
