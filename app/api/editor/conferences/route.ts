
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

    const [conferences, total] = await prisma.$transaction([
        prisma.conference.findMany({
            where: { deletedAt: null },
            skip,
            take: limit,
            orderBy: { startDate: 'desc' },
        }),
        prisma.conference.count({ where: { deletedAt: null } })
    ]);

    return NextResponse.json({
        conferences,
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
        const conference = await prisma.conference.create({
            data: {
                title: body.title,
                acronym: body.acronym,
                description: body.description,
                fullDescription: body.fullDescription,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                venue: body.venue,
                city: body.city,
                country: body.country,
                location: body.location, // e.g. "San Francisco, USA"
                websiteUrl: body.websiteUrl,
                registrationUrl: body.registrationUrl,
                submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : undefined,
                notificationDate: body.notificationDate ? new Date(body.notificationDate) : undefined,
                conferenceType: body.conferenceType,
                status: body.status || 'upcoming',
                bannerImageUrl: body.bannerImageUrl,
                topics: body.topics || [], // Array of strings
                // Omit complex Json fields for MVP basic CRUD unless requested
            }
        });
        return NextResponse.json({ success: true, conference });
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

        const conference = await prisma.conference.update({
            where: { id: body.id },
            data: {
                title: body.title,
                acronym: body.acronym,
                description: body.description,
                fullDescription: body.fullDescription,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                venue: body.venue,
                city: body.city,
                country: body.country,
                location: body.location,
                websiteUrl: body.websiteUrl,
                registrationUrl: body.registrationUrl,
                submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : undefined,
                notificationDate: body.notificationDate ? new Date(body.notificationDate) : undefined,
                conferenceType: body.conferenceType,
                status: body.status,
                bannerImageUrl: body.bannerImageUrl,
                topics: body.topics,
            }
        });
        return NextResponse.json({ success: true, conference });
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
        await prisma.conference.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
