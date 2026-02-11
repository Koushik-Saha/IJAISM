
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) return apiError('Invalid token', 401);

        const wishlist = await prisma.wishlist.findMany({
            where: {
                userId: decoded.userId
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        authors: true,
                        price: true,
                        coverImageUrl: true,
                        format: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return apiSuccess({ wishlist });

    } catch (error) {
        console.error('Wishlist fetch error:', error);
        return apiError('Failed to fetch wishlist', 500);
    }
}
