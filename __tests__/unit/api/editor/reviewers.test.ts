
/**
 * @jest-environment node
 */
import { GET } from '@/app/api/editor/reviewers/route';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

describe('Editor Reviewers API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockEditor = {
        id: 'editor-1',
        role: 'editor',
    };

    const createRequest = (token: string = 'valid-token') => {
        return new NextRequest(new URL('http://localhost:3000/api/editor/reviewers'), {
            method: 'GET',
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
    };

    it('should return 401 if unauthorized', async () => {
        const req = new NextRequest(new URL('http://localhost:3000/api/editor/reviewers'));
        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it('should return 403 if not editor/admin', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'user' });

        const req = createRequest();
        const res = await GET(req);
        expect(res.status).toBe(403);
    });

    it('should return list of reviewers', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId: 'editor-1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockEditor);

        (prisma.user.findMany as jest.Mock).mockResolvedValue([
            { id: 'r1', name: 'Reviewer', _count: { reviews: 2 } }
        ]);

        const req = createRequest();
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.reviewers).toHaveLength(1);
        expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ role: 'reviewer' })
        }));
    });
});
