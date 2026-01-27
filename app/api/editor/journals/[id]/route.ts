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

        if (!user || !['admin', 'editor', 'super_admin', 'mother_admin'].includes(user.role)) {
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
            displayOrder,
            editorId // NEW: Support assigning an editor
        } = body;

        // 3. Update journal logic handled below based on editorId checks

        // If assigning an editor, ensure they are removed from other journals (Enforce 1 Editor -> 1 Journal Max)
        if (editorId) {
            await prisma.$transaction([
                // 1. Remove this editor from any other journal
                prisma.journal.updateMany({
                    where: {
                        editorId: editorId,
                        id: { not: id }
                    },
                    data: { editorId: null }
                }),
                // 2. Update the target journal
                prisma.journal.update({
                    where: { id },
                    data: { editorId }
                })
            ]);

            // Re-fetch to return fresh data
            const journal = await prisma.journal.findUnique({ where: { id } });
            return NextResponse.json({
                success: true,
                message: 'Journal updated successfully (Editor reassigned)',
                journal,
            });
        }

        // Standard update without editor change or clearing editor logic
        if (editorId === null || editorId === "") { // Explicit removal
            const journal = await prisma.journal.update({
                where: { id },
                data: { editorId: null }
            });
            return NextResponse.json({ success: true, message: 'Editor removed', journal });
        }

        // If editorId is undefined (not passed), just update other fields
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

        if (!user || !['admin', 'editor', 'super_admin', 'mother_admin'].includes(user.role)) {
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
