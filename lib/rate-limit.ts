import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

type RateLimitOptions = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export default function rateLimit(options?: RateLimitOptions) {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    });

    // Check if Redis is configured (Production)
    const isRedisConfigured = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

    return {
        check: async (res: NextResponse, limit: number, token: string) => {
            // In Production with Redis
            if (isRedisConfigured) {
                try {
                    // Lazy load to avoid build time errors if package missing
                    const { kv } = await import('@vercel/kv');

                    const count = await kv.incr(token);
                    if (count === 1) {
                        await kv.expire(token, (options?.interval || 60000) / 1000);
                    }

                    if (count > limit) throw new Error('Rate limit exceeded');
                    return;
                } catch (e) {
                    // Fallback to memory if Redis fails
                    console.error('Redis Rate Limit Error, falling back to memory:', e);
                }
            }

            // Local Memory Fallback
            return new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= limit;

                if (isRateLimited) {
                    reject();
                } else {
                    resolve();
                }
            });
        },
        /**
         * Checks if a token (IP) has exceeded the limit.
         * Returns true if limited, false otherwise.
         * Also returns headers to set.
         */
        checkLimit: async (token: string, limit: number) => {
            if (isRedisConfigured) {
                try {
                    const { kv } = await import('@vercel/kv');
                    const current = await kv.get<number>(token) || 0;
                    const isLimited = current >= limit;
                    if (!isLimited) {
                        await kv.incr(token);
                        if (current === 0) await kv.expire(token, (options?.interval || 60000) / 1000);
                    }
                    return { isLimited, current: current + 1, remaining: Math.max(0, limit - (current + 1)) };
                } catch (e) {
                    console.error('Redis Check Limit Error:', e);
                }
            }

            // Memory Fallback
            const current = (tokenCache.get(token) as number) || 0;
            const isLimited = current >= limit;

            if (!isLimited) {
                tokenCache.set(token, current + 1);
            }

            return {
                isLimited,
                current: current + 1,
                remaining: Math.max(0, limit - (current + 1))
            };
        }
    };
}
