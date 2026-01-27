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
        const payload = verifyToken(token);
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const userId = payload.userId;

        // Fetch all user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                articles: true,
                reviews: true,
                membership: true,
                notifications: true,
                conferences: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove sensitive fields
        const { passwordHash, ...safeUser } = user;

        const exportData = {
            userData: safeUser,
            exportedAt: new Date().toISOString(),
            note: "This export contains all personal data associated with your account."
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="c5k-data-export-${userId}.json"`
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
