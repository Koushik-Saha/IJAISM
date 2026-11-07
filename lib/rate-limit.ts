import { LRUCache } from 'lru-cache';
import { NextResponse } from 'next/server';

// Single-instance deployment: a process-local LRU is sufficient. If we ever
// horizontally scale, swap this for a Redis-backed implementation (the
// container is already running on the same Docker network).

type RateLimitOptions = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export default function rateLimit(options?: RateLimitOptions) {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    });

    return {
        check: async (_res: NextResponse, limit: number, token: string) => {
            return new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const isRateLimited = tokenCount[0] >= limit;
                if (isRateLimited) reject();
                else resolve();
            });
        },
        checkLimit: async (token: string, limit: number) => {
            const current = (tokenCache.get(token) as number) || 0;
            const isLimited = current >= limit;

            if (!isLimited) {
                tokenCache.set(token, current + 1);
            }

            return {
                isLimited,
                current: current + 1,
                remaining: Math.max(0, limit - (current + 1)),
            };
        },
    };
}
