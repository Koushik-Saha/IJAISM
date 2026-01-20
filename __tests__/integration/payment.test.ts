/**
 * @jest-environment node
 */
import { POST as PaymentSessionPOST } from '@/app/api/payments/create-checkout-session/route';
import { POST as WebhookPOST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendMembershipActivationEmail } from '@/lib/email/send';

// Mocks
jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        membership: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        notification: { create: jest.fn() },
    },
}));

jest.mock('@/lib/email/send', () => ({
    sendMembershipActivationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendPaymentFailedEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock Stripe
const mockStripe = {
    checkout: {
        sessions: {
            create: jest.fn(),
        },
    },
    webhooks: {
        constructEvent: jest.fn(),
    },
};

jest.mock('stripe', () => {
    return jest.fn(() => mockStripe);
});

// Helper Mock Request
function createMockRequest(body: any, token?: string) {
    return {
        json: async () => body,
        text: async () => JSON.stringify(body),
        headers: {
            get: (key: string) => {
                if (key === 'authorization') return token ? `Bearer ${token}` : null;
                if (key === 'stripe-signature') return 'mock-signature';
                return null;
            },
            getSetCookie: () => [],
        },
    } as unknown as NextRequest;
}

describe('Payment & Webhook Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.STRIPE_SECRET_KEY = 'mock_key';
        process.env.STRIPE_WEBHOOK_SECRET = 'mock_wh_secret';
    });

    describe('Checkout Session API', () => {
        const validToken = 'valid-token';
        const userId = 'user-123';
        const validBody = { tier: 'premium' };

        it('should create session', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: userId, email: 'test@example.com', isActive: true,
            });
            (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);
            mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'sess_1', url: 'http://test.com' });

            const req = createMockRequest(validBody, validToken);
            const res = await PaymentSessionPOST(req);

            expect(res.status).toBe(201);
            expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
        });
    });

    describe('Stripe Webhook Handler', () => {
        it('should handle checkout.session.completed by creating membership', async () => {
            const eventPayload = {
                id: 'evt_123',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'sess_123',
                        subscription: 'sub_123',
                        metadata: { userId: 'user-123', tier: 'premium' },
                    }
                }
            };

            // Mock constructEvent to return our payload
            mockStripe.webhooks.constructEvent.mockReturnValue(eventPayload);

            // Mock DB
            (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null); // No existing membership
            (prisma.membership.create as jest.Mock).mockResolvedValue({ id: 'mem_1', tier: 'premium' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', email: 'test@example.com', name: 'Test' });

            const req = createMockRequest(eventPayload); // Body is passed as text() mock
            const res = await WebhookPOST(req);

            expect(res.status).toBe(200);
            expect(prisma.membership.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'user-123',
                    tier: 'premium',
                    status: 'active',
                    stripeSubscriptionId: 'sub_123'
                })
            }));
            expect(sendMembershipActivationEmail).toHaveBeenCalled();
        });

        it('should handle customer.subscription.deleted', async () => {
            const eventPayload = {
                id: 'evt_cancel',
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: 'sub_123',
                        metadata: { userId: 'user-123' },
                    }
                }
            };
            mockStripe.webhooks.constructEvent.mockReturnValue(eventPayload);

            // Mock DB: must find membership
            (prisma.membership.findFirst as jest.Mock).mockResolvedValue({ id: 'mem_1', tier: 'premium', endDate: new Date() });

            const req = createMockRequest(eventPayload);
            const res = await WebhookPOST(req);

            expect(res.status).toBe(200);
            expect(prisma.membership.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'mem_1' },
                data: expect.objectContaining({ status: 'expired', autoRenew: false })
            }));
        });
    });
});
