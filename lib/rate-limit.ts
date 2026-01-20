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

    return {
        check: (res: NextResponse, limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= limit;

                // Use Headers from the passed NextResponse just to set X-RateLimit
                // In App Router we can't easily manipulate the *final* response headers here 
                // if we are just checking logic, but we can return data to set them later.
                // However, standard Next.js rate limit examples often throw or reject.

                // For simple usage, we just track counts.

                if (isRateLimited) {
                    reject();
                } else {
                    resolve();
                }
            }),
        /**
         * Checks if a token (IP) has exceeded the limit.
         * Returns true if limited, false otherwise.
         * Also returns headers to set.
         */
        checkLimit: (token: string, limit: number) => {
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
