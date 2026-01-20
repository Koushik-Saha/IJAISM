import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET all journals (admin view includes inactive)
export async function GET(req: NextRequest) {
    try {
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

        // 2. Fetch all journals
        const journals = await prisma.journal.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        });

        return NextResponse.json({ success: true, journals });
    } catch (error: any) {
        console.error('Error fetching journals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch journals' },
            { status: 500 }
        );
    }
}

// POST create new journal
export async function POST(req: NextRequest) {
    try {
        // 1. Verify authentication (Admin only)
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

        // 3. Validate required fields
        if (!code || !fullName) {
            return NextResponse.json(
                { error: 'Code and Full Name are required' },
                { status: 400 }
            );
        }

        // 4. Check for duplicate code
        const existing = await prisma.journal.findUnique({
            where: { code },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Journal with this code already exists' },
                { status: 409 }
            );
        }

        // 5. Create journal
        const journal = await prisma.journal.create({
            data: {
                code,
                fullName,
                description,
                coverImageUrl,
                issn,
                impactFactor: impactFactor ? parseFloat(impactFactor) : null,
                isActive: isActive !== undefined ? isActive : true,
                displayOrder: displayOrder ? parseInt(displayOrder) : 0,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Journal created successfully',
            journal,
        });
    } catch (error: any) {
        console.error('Error creating journal:', error);
        return NextResponse.json(
            { error: 'Failed to create journal' },
            { status: 500 }
        );
    }
}
