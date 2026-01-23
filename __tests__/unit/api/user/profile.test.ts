
/**
 * @jest-environment node
 */
import { GET, PATCH } from '@/app/api/user/profile/route';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        article: {
            aggregate: jest.fn(),
            count: jest.fn(),
        },
    },
}));

jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

describe('User Profile API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'author',
    };

    const mockStats = [
        { _sum: { citationCount: 5, viewCount: 10, downloadCount: 2 }, _count: { id: 1 } }, // aggregate result
        3, // published count
    ];

    const createRequest = (method: string, body: any = null, token: string = 'valid-token') => {
        return new NextRequest(new URL('http://localhost:3000/api/user/profile'), {
            method,
            headers: {
                authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : null,
        });
    };

    describe('GET', () => {
        it('should return 401 if unauthorized', async () => {
            const req = new NextRequest(new URL('http://localhost:3000/api/user/profile'));
            const res = await GET(req);
            expect(res.status).toBe(401);
        });

        it('should return profile with stats', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.article.aggregate as jest.Mock).mockResolvedValue(mockStats[0]);
            (prisma.article.count as jest.Mock).mockResolvedValue(mockStats[1]);

            const req = createRequest('GET');
            const res = await GET(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.user.id).toBe('user-1');
            expect(data.user.statistics.totalCitations).toBe(5);
            expect(data.user.statistics.publishedArticles).toBe(3);
        });

        it('should return 404 if user not found', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const req = createRequest('GET');
            const res = await GET(req);
            expect(res.status).toBe(404);
        });
    });

    describe('PATCH', () => {
        it('should update profile fields', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
            (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, bio: 'New Bio' });
            // Stats checks for response (reuse mockStats)
            (prisma.article.aggregate as jest.Mock).mockResolvedValue(mockStats[0]);
            (prisma.article.count as jest.Mock).mockResolvedValue(mockStats[1]);

            const req = createRequest('PATCH', { bio: 'New Bio' });
            const res = await PATCH(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.user.bio).toBe('New Bio');
            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'user-1' },
                data: expect.objectContaining({ bio: 'New Bio' })
            }));
        });
    });
});
