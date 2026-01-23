import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
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

        if (!user || !['admin', 'editor', 'super_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const blogs = await prisma.blog.findMany({
            where: status ? { status } : undefined,
            include: {
                author: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ blogs });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blog posts' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
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

        if (!user || !['admin', 'editor', 'super_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { title, content, excerpt, featuredImageUrl, status, slug } = body;

        // Basic validation
        if (!title || !content || !slug) {
            return NextResponse.json(
                { error: 'Title, content, and slug are required' },
                { status: 400 }
            );
        }

        // Check slug uniqueness
        const existingBlog = await prisma.blog.findUnique({
            where: { slug },
        });

        if (existingBlog) {
            return NextResponse.json(
                { error: 'A blog post with this slug already exists' },
                { status: 409 }
            );
        }

        const blog = await prisma.blog.create({
            data: {
                title,
                content,
                excerpt,
                featuredImageUrl,
                status: status || 'draft',
                slug,
                publishedAt: status === 'published' ? new Date() : null,
                authorId: decoded.userId,
            },
        });

        return NextResponse.json({ blog }, { status: 201 });
    } catch (error) {
        console.error('Error creating blog:', error);
        return NextResponse.json(
            { error: 'Failed to create blog post' },
            { status: 500 }
        );
    }
}
