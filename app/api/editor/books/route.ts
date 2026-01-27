
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    const [books, total] = await prisma.$transaction([
        prisma.book.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.book.count()
    ]);

    return NextResponse.json({
        books,
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
        const book = await prisma.book.create({
            data: {
                title: body.title,
                authors: Array.isArray(body.authors) ? body.authors : [body.authors], // Ensure array
                year: parseInt(body.year),
                isbn: body.isbn,
                pages: parseInt(body.pages),
                field: body.field,
                description: body.description,
                fullDescription: body.fullDescription || body.description,
                price: body.price,
                publisher: body.publisher,
                language: body.language,
                edition: body.edition,
                format: body.format,
                coverImageUrl: body.coverImageUrl,
                relatedTopics: body.relatedTopics || [],
            }
        });
        return NextResponse.json({ success: true, book });
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

        const book = await prisma.book.update({
            where: { id: body.id },
            data: {
                title: body.title,
                authors: body.authors,
                year: body.year ? parseInt(body.year) : undefined,
                isbn: body.isbn,
                pages: body.pages ? parseInt(body.pages) : undefined,
                field: body.field,
                description: body.description,
                fullDescription: body.fullDescription,
                price: body.price,
                publisher: body.publisher,
                language: body.language,
                edition: body.edition,
                format: body.format,
                coverImageUrl: body.coverImageUrl,
                relatedTopics: body.relatedTopics,
            }
        });
        return NextResponse.json({ success: true, book });
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
        await prisma.book.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
