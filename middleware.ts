import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // CORS Configuration
    const allowedOrigins = [
        'http://localhost:3000',
        'https://c5k-platform.vercel.app', // Production URL
        'https://c5k-platform-staging.vercel.app', // Staging URL
        'https://ijaism-platform.vercel.app',
        'https://ijaism-platform-staging.vercel.app'
    ];

    const origin = request.headers.get('origin');

    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }

    // Allow common methods
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // Allow common headers
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Handle Preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: response.headers,
        });
    }

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
