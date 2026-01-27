/**
 * @jest-environment node
 */
import { GET } from '@/app/api/articles/[id]/route';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        article: {
            findUnique: jest.fn(),
        },
    },
}));

describe('GET /api/articles/[id]', () => {
    const mockUser = { userId: 'user-1' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if not authenticated', async () => {
        const req = new NextRequest('http://localhost:3000/api/articles/123');
        const params = Promise.resolve({ id: '123' });
        const res = await GET(req, { params });
        expect(res.status).toBe(401);
    });

    it('returns 401 if token invalid', async () => {
        (verifyToken as jest.Mock).mockReturnValue(null);
        const req = new NextRequest('http://localhost:3000/api/articles/123', {
            headers: { Authorization: 'Bearer bad' }
        });
        const params = Promise.resolve({ id: '123' });
        const res = await GET(req, { params });
        expect(res.status).toBe(401);
    });

    it('returns 404 if article not found', async () => {
        (verifyToken as jest.Mock).mockReturnValue(mockUser);
        const { prisma } = require('@/lib/prisma');
        (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/articles/123', {
            headers: { Authorization: 'Bearer token' }
        });
        const params = Promise.resolve({ id: '123' });
        const res = await GET(req, { params });
        expect(res.status).toBe(404);
    });

    it('returns 403 if user is not author', async () => {
        (verifyToken as jest.Mock).mockReturnValue(mockUser);
        const { prisma } = require('@/lib/prisma');
        (prisma.article.findUnique as jest.Mock).mockResolvedValue({
            id: '123',
            authorId: 'other-user', // Different user
        });

        const req = new NextRequest('http://localhost:3000/api/articles/123', {
            headers: { Authorization: 'Bearer token' }
        });
        const params = Promise.resolve({ id: '123' });
        const res = await GET(req, { params });
        expect(res.status).toBe(403);
    });

    it('returns 200 and article if authorized', async () => {
        (verifyToken as jest.Mock).mockReturnValue(mockUser);
        const article = { id: '123', authorId: 'user-1', title: 'My Article', reviews: [] };

        const { prisma } = require('@/lib/prisma');
        (prisma.article.findUnique as jest.Mock).mockResolvedValue(article);

        const req = new NextRequest('http://localhost:3000/api/articles/123', {
            headers: { Authorization: 'Bearer token' }
        });
        const params = Promise.resolve({ id: '123' });
        const res = await GET(req, { params });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.article).toEqual(article);
    });
});
