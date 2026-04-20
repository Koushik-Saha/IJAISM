import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const publicKeys = [
            'site_name', 'site_logo_url', 'site_location', 
            'site_contact_email', 'site_contact_phone',
            'site_mission', 'site_vision'
        ];

        const settings = await prisma.globalSettings.findMany({
            where: { key: { in: publicKeys } }
        });

        const settingsResult: Record<string, string> = {
            site_name: 'C5K',
            site_logo_url: '/logo.png',
            site_location: '761 State Highway 100, Port Isabel, TX 78578, USA',
            site_contact_email: 'contact@c5k.com'
        };

        settings.forEach(s => {
            settingsResult[s.key] = s.value;
        });

        return NextResponse.json({ settings: settingsResult });
    } catch (error) {
        console.error('Public settings fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
