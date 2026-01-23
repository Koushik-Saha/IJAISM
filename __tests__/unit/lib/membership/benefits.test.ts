
import {
    canUserSubmit,
    getUserTier,
    getMembershipStatus,
    TIER_CONFIG
} from '@/lib/membership/benefits';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        membership: {
            findFirst: jest.fn(),
        },
        article: {
            count: jest.fn(),
        },
    },
}));

describe('Membership Benefits Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserTier', () => {
        it('should return "free" when no active membership is found', async () => {
            (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);

            const tier = await getUserTier('user-1');
            expect(tier).toBe('free');
            expect(prisma.membership.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    userId: 'user-1',
                    status: 'active',
                })
            }));
        });

        it('should return the specific tier when active membership exists', async () => {
            (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
                tier: 'premium',
                endDate: new Date(Date.now() + 100000),
            });

            const tier = await getUserTier('user-1');
            expect(tier).toBe('premium');
        });
    });

    describe('canUserSubmit', () => {
        describe('Free Tier', () => {
            beforeEach(() => {
                (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null); // Defaults to free
            });

            it('should allow submission if under limit', async () => {
                // Limit is 200 for free tier
                (prisma.article.count as jest.Mock).mockResolvedValue(10);

                const result = await canUserSubmit('user-1');

                expect(result.canSubmit).toBe(true);
                expect(result.tier).toBe('free');
                expect(result.limit).toBe(200);
                expect(result.used).toBe(10);
                expect(result.remaining).toBe(190);
            });

            it('should block submission if limit reached', async () => {
                (prisma.article.count as jest.Mock).mockResolvedValue(200);

                const result = await canUserSubmit('user-1');

                expect(result.canSubmit).toBe(false);
                expect(result.reason).toContain('Basic or Premium');
            });
        });

        describe('Basic Tier', () => {
            beforeEach(() => {
                (prisma.membership.findFirst as jest.Mock).mockResolvedValue({ tier: 'basic' });
            });

            it('should allow submission if under limit (5)', async () => {
                (prisma.article.count as jest.Mock).mockResolvedValue(4);

                const result = await canUserSubmit('user-1');

                expect(result.canSubmit).toBe(true);
                expect(result.limit).toBe(5);
                expect(result.remaining).toBe(1);
            });

            it('should block submission if limit reached', async () => {
                (prisma.article.count as jest.Mock).mockResolvedValue(5);

                const result = await canUserSubmit('user-1');

                expect(result.canSubmit).toBe(false);
                expect(result.reason).toContain('upgrade to Premium');
            });
        });

        describe('Premium Tier', () => {
            beforeEach(() => {
                (prisma.membership.findFirst as jest.Mock).mockResolvedValue({ tier: 'premium' });
            });

            it('should always allow submission (unlimited)', async () => {
                (prisma.article.count as jest.Mock).mockResolvedValue(999);

                const result = await canUserSubmit('user-1');

                expect(result.canSubmit).toBe(true);
                expect(result.limit).toBe(-1);
                expect(result.remaining).toBe(-1);
            });
        });
    });

    describe('getMembershipStatus', () => {
        it('should return complete status for a user', async () => {
            const mockDate = new Date();
            (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
                tier: 'basic',
                startDate: mockDate,
                endDate: mockDate,
                autoRenew: true,
            });
            (prisma.article.count as jest.Mock).mockResolvedValue(2);

            const status = await getMembershipStatus('user-1');

            expect(status.tier).toBe('basic');
            expect(status.isActive).toBe(true);
            expect(status.features).toEqual(TIER_CONFIG.basic.features);
            expect(status.submissions.used).toBe(2);
            expect(status.submissions.limit).toBe(5);
        });
    });
});
