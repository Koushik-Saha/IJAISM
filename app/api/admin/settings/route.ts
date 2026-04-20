import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const settingsKeys = [
            'apc_fee', 'site_name', 'site_logo_url', 'site_location', 
            'site_contact_email', 'site_contact_phone', 
            'site_mission', 'site_vision', 
            'privacy_policy', 'terms_conditions'
        ];

        const settingsResult: Record<string, any> = {};
        const settings = await prisma.globalSettings.findMany({
            where: { key: { in: settingsKeys } }
        });

        settings.forEach(s => {
            if (s.key === 'apc_fee') settingsResult[s.key] = parseFloat(s.value);
            else settingsResult[s.key] = s.value;
        });

        // Set defaults if missing
        if (!settingsResult.site_name) settingsResult.site_name = 'C5K';

        return NextResponse.json({ settings: settingsResult });
    } catch (error) {
        console.error('Settings fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = verifyToken(token);
        if (!user || !['admin', 'mother_admin', 'super_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        const updates = Object.entries(body).map(([key, value]) => {
            if (value === undefined || value === null) return null;
            return prisma.globalSettings.upsert({
                where: { key },
                update: { value: value.toString() },
                create: { key, value: value.toString() }
            });
        }).filter(Boolean);

        await Promise.all(updates);

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
