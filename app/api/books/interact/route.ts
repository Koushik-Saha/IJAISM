
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const bookId = searchParams.get('bookId');

        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !bookId) {
            return apiError('Invalid request', 400);
        }

        const [wishlist, purchase] = await Promise.all([
            prisma.wishlist.findUnique({
                where: {
                    userId_bookId: {
                        userId: decoded.userId,
                        bookId: bookId
                    }
                }
            }),
            prisma.purchasedBook.findUnique({
                where: {
                    userId_bookId: {
                        userId: decoded.userId,
                        bookId: bookId
                    }
                }
            })
        ]);

        return apiSuccess({
            isWishlisted: !!wishlist,
            isPurchased: !!purchase
        });

    } catch (error) {
        return apiError('Failed to fetch status', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return apiError('Unauthorized', 401);

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) return apiError('Unauthorized', 401);

        // DEBUG: Check available models on prisma instance
        console.log("Prisma keys:", Object.keys(prisma));

        const body = await req.json();
        console.log("Wishlist API Request:", { userId: decoded.userId, body });
        const { action, bookId, price } = body; // action: 'wishlist' | 'purchase'

        if (action === 'wishlist') {
            const existing = await prisma.wishlist.findUnique({
                where: {
                    userId_bookId: {
                        userId: decoded.userId,
                        bookId: bookId
                    }
                }
            });

            if (existing) {
                await prisma.wishlist.delete({
                    where: { id: existing.id }
                });
                return apiSuccess({ isWishlisted: false, message: 'Removed from wishlist' });
            } else {
                await prisma.wishlist.create({
                    data: {
                        userId: decoded.userId,
                        bookId: bookId
                    }
                });
                return apiSuccess({ isWishlisted: true, message: 'Added to wishlist' });
            }
        }

        if (action === 'purchase') {
            const existing = await prisma.purchasedBook.findUnique({
                where: {
                    userId_bookId: {
                        userId: decoded.userId,
                        bookId: bookId
                    }
                }
            });

            if (existing) {
                return apiSuccess({ isPurchased: true, message: 'Already purchased' });
            }

            await prisma.purchasedBook.create({
                data: {
                    userId: decoded.userId,
                    bookId: bookId,
                    price: price || '0.00'
                }
            });

            return apiSuccess({ isPurchased: true, message: 'Purchase successful!' });
        }

        return apiError('Invalid action', 400);

    } catch (error: any) {
        console.error("Wishlist API Error:", error);
        return apiError(error.message || 'Operation failed', 500);
    }
}
