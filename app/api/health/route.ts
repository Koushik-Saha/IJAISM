import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Basic DB check
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected'
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
                error: error.message
            },
            { status: 503 }
        );
    }
}
