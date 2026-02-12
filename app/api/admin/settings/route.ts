
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = verifyToken(token);
        if (!user || (user.role !== 'admin' && user.role !== 'editor')) { // Allowing editor for now, strict admin later
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const manualFee = await prisma.globalSettings.findUnique({
            where: { key: 'apc_fee' }
        });

        return NextResponse.json({
            settings: {
                apc_fee: manualFee ? parseFloat(manualFee.value) : 500
            }
        });
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
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { apc_fee } = await request.json();

        if (apc_fee !== undefined) {
            await prisma.globalSettings.upsert({
                where: { key: 'apc_fee' },
                update: { value: apc_fee.toString() },
                create: { key: 'apc_fee', value: apc_fee.toString() }
            });
        }

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
