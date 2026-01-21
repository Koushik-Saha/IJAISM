import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { autoAssignReviewers } from '@/lib/reviews/utils'; // Direct import from utils to avoid circular dep issues in index if any

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin access
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Run auto-assignment
        const result = await autoAssignReviewers(id);

        return NextResponse.json({
            success: true,
            message: `Successfully assigned ${result.assignments.length} reviewers`,
            details: result.details,
            assignments: result.assignments
        });

    } catch (error: any) {
        console.error('Error auto-assigning reviewers:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to auto-assign reviewers',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
