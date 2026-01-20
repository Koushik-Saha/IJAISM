import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// PUT update journal
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Verify authentication
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

        // 2. Parse body
        const body = await req.json();
        const {
            code,
            fullName,
            description,
            coverImageUrl,
            issn,
            impactFactor,
            isActive,
            displayOrder
        } = body;

        // 3. Update journal
        const journal = await prisma.journal.update({
            where: { id },
            data: {
                code,
                fullName,
                description,
                coverImageUrl,
                issn,
                impactFactor: impactFactor !== undefined ? parseFloat(impactFactor) : undefined,
                isActive,
                displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Journal updated successfully',
            journal,
        });
    } catch (error: any) {
        console.error('Error updating journal:', error);
        return NextResponse.json(
            { error: 'Failed to update journal' },
            { status: 500 }
        );
    }
}

// GET single journal
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Verify authentication
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

        // 2. Get journal
        const journal = await prisma.journal.findUnique({
            where: { id },
        });

        if (!journal) {
            return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, journal });
    } catch (error: any) {
        console.error('Error fetching journal:', error);
        return NextResponse.json(
            { error: 'Failed to fetch journal' },
            { status: 500 }
        );
    }
}
