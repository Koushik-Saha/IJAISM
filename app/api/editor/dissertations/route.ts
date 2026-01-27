
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Helper for RBAC
const checkAdminRole = async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
    });

    if (!user || !['super_admin', 'mother_admin'].includes(user.role)) return null;
    return user;
};

export async function GET(req: NextRequest) {
    const admin = await checkAdminRole(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [dissertations, total] = await prisma.$transaction([
        prisma.dissertation.findMany({
            where: { deletedAt: null },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true, email: true } } }
        }),
        prisma.dissertation.count({ where: { deletedAt: null } })
    ]);

    return NextResponse.json({
        dissertations,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}

export async function POST(req: NextRequest) {
    const admin = await checkAdminRole(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const body = await req.json();
        // Basic validation
        if (!body.title || !body.university || !body.degreeType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const dissertation = await prisma.dissertation.create({
            data: {
                title: body.title,
                abstract: body.abstract || '',
                university: body.university,
                department: body.department,
                degreeType: body.degreeType,
                supervisorName: body.supervisorName,
                authorName: body.authorName,
                // If authorId provided use it, else default to creating admin (not ideal but safe for MVP)
                authorId: body.authorId || admin.id,
                status: body.status || 'pending',

                // Schema has submissionDate, defenseDate.
                submissionDate: body.submissionDate ? new Date(body.submissionDate) : undefined,
                defenseDate: body.defenseDate ? new Date(body.defenseDate) : undefined,
            }
        });

        return NextResponse.json({ success: true, dissertation });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const admin = await checkAdminRole(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const dissertation = await prisma.dissertation.update({
            where: { id: body.id },
            data: {
                title: body.title,
                abstract: body.abstract,
                university: body.university,
                department: body.department,
                degreeType: body.degreeType,
                supervisorName: body.supervisorName,
                authorName: body.authorName,
                status: body.status,
                submissionDate: body.submissionDate ? new Date(body.submissionDate) : undefined,
                defenseDate: body.defenseDate ? new Date(body.defenseDate) : undefined,
            }
        });

        return NextResponse.json({ success: true, dissertation });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const admin = await checkAdminRole(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        // Hard delete or soft delete? Schema has deletedAt?
        // Checking schema line 291: deletedAt DateTime?
        // I will use Soft Delete
        await prisma.dissertation.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        // Or if user wants hard delete? Usually safer to soft.
        // Actually for "Management" deleting usually implies removing it. 
        // But let's check the GET. GET does not automatically filter deletedAt unless I tell it to.
        // I should update GET to filter `deletedAt: null`.

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
