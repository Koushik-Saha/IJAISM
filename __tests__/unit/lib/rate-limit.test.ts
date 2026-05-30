import rateLimit from '@/lib/rate-limit';

describe('lib/rate-limit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Memory Strategy (Default)', () => {
        it('should allow requests within limit', async () => {
            const limiter = rateLimit({ uniqueTokenPerInterval: 10, interval: 60000 });
            const token = 'test-ip-1';

            const result = await limiter.checkLimit(token, 5);
            expect(result.isLimited).toBe(false);
            expect(result.current).toBe(1);
        });

        it('should block requests exceeding limit', async () => {
            const limiter = rateLimit({ uniqueTokenPerInterval: 10, interval: 60000 });
            const token = 'test-ip-2';
            const limit = 2;

            await limiter.checkLimit(token, limit); // 1
            await limiter.checkLimit(token, limit); // 2
            const result = await limiter.checkLimit(token, limit); // 3 (Limited)

            expect(result.isLimited).toBe(true);
            expect(result.current).toBe(3);
        });
    });

});
