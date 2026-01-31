
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { exchangeOrcidCode } from '@/lib/orcid/client';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify User
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const { code } = await req.json();
        if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

        // 2. Exchange Code
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c5k-platform.vercel.app';
        const redirectUri = `${baseUrl}/api/auth/orcid/callback`;

        const orcidData = await exchangeOrcidCode(code, redirectUri);

        // Expected response: { access_token, refresh_token, expires_in, scope, name, orcid }

        // 3. Update User
        await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                orcid: orcidData.orcid,
                orcidAccessToken: orcidData.access_token,
                orcidRefreshToken: orcidData.refresh_token
            }
        });

        return NextResponse.json({ success: true, orcid: orcidData.orcid });

    } catch (error: any) {
        console.error("ORCID Link Error", error);
        return NextResponse.json({ error: error.message || "Linking failed" }, { status: 500 });
    }
}
