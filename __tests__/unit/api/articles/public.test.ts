/**
 * @jest-environment node
 */
import { GET } from '@/app/api/articles/public/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        article: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

describe('GET /api/articles/public', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns default list of published articles', async () => {
        const { prisma } = require('@/lib/prisma');
        const mockArticles = [
            {
                id: '1', title: 'Art 1', author: { name: 'Auth 1' }, journal: { code: 'J1', fullName: 'Journal 1' },
                publicationDate: new Date('2023-01-01'), doi: '10.123/1',
                citationCount: 5, downloadCount: 10
            }
        ];
        (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
        (prisma.article.count as jest.Mock).mockResolvedValue(1);

        const req = new NextRequest('http://localhost:3000/api/articles/public');
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.articles).toHaveLength(1);
        expect(data.pagination.total).toBe(1);

        // Check default query args
        expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { status: 'published', deletedAt: null },
            take: 10,
            skip: 0,
            orderBy: { publicationDate: 'desc' }
        }));
    });

    it('filters by journal', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.article.count as jest.Mock).mockResolvedValue(0);

        const req = new NextRequest('http://localhost:3000/api/articles/public?journal=JITMB');
        await GET(req);

        expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                journal: { code: 'JITMB' }
            })
        }));
    });

    it('handles pagination', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.article.count as jest.Mock).mockResolvedValue(0);

        const req = new NextRequest('http://localhost:3000/api/articles/public?page=2&limit=20');
        await GET(req);

        expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
            skip: 20,
            take: 20
        }));
    });

    it('handles sorting', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.article.count as jest.Mock).mockResolvedValue(0);

        const req = new NextRequest('http://localhost:3000/api/articles/public?sortBy=cited');
        await GET(req);

        expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
            orderBy: { citationCount: 'desc' }
        }));
    });

    it('handles database error', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.article.findMany as jest.Mock).mockRejectedValue(new Error('DB Fail'));

        const req = new NextRequest('http://localhost:3000/api/articles/public');
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe('Failed to fetch articles');
    });
});
