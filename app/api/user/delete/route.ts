import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const userId = payload.userId;

        // Soft delete / Anonymize
        // We append timestamp to email to free it up (if we wanted to allow reuse) or just to ensure uniqueness if we keep it.
        // GDPR Recommendation: Anonymize if possible.
        const timestamp = Date.now();

        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletedAt: new Date(),
                name: 'Deleted User',
                email: `deleted_${timestamp}_${userId}@example.com`, // Anonymize email
                orcid: null, // Remove unique identifiers
                bio: null,
                profileImageUrl: null,
                // Keep affiliations/university maybe strictly for historical record of article? 
                // Better to scrub personal info.
                affiliation: null,
                university: 'Unknown'
            }
        });

        return NextResponse.json({ success: true, message: 'Account deleted successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
