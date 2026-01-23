
/**
 * @jest-environment node
 */
import { GET } from '@/app/api/search/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        article: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        journal: {
            findMany: jest.fn(),
        },
    },
}));

describe('Search API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createRequest = (urlStr: string) => {
        return new NextRequest(new URL(urlStr), { method: 'GET' });
    };

    const mockArticle = {
        id: 'a1',
        title: 'Test Article',
        abstract: 'Abstract content',
        keywords: ['test'],
        citationCount: 10,
        viewCount: 5,
        downloadCount: 2,
        articleType: 'research',
        publicationDate: new Date('2023-01-01'),
        author: {
            id: 'u1', name: 'Author Name', university: 'Test Univ',
        },
        journal: {
            id: 'j1', code: 'JTEST', fullName: 'Journal of Testing',
        },
    };

    describe('GET', () => {
        it('should return recent filtered articles when no query', async () => {
            (prisma.article.count as jest.Mock).mockResolvedValue(1);
            (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);

            const req = createRequest('http://localhost:3000/api/search');
            const res = await GET(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.results.articles).toHaveLength(1);
            expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'published' })
            }));
        });

        it('should search with query string', async () => {
            (prisma.article.count as jest.Mock).mockResolvedValue(1);
            (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);

            const req = createRequest('http://localhost:3000/api/search?q=test');
            await GET(req);

            expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([{ title: expect.anything() }])
                })
            }));
        });

        it('should filter by journal and year', async () => {
            (prisma.article.count as jest.Mock).mockResolvedValue(0);
            (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

            const req = createRequest('http://localhost:3000/api/search?journal=j1&year=2023');
            await GET(req);

            expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    journal: expect.anything(),
                    publicationDate: expect.anything(),
                })
            }));
        });

        it('should search journals when scope is journals', async () => {
            (prisma.journal.findMany as jest.Mock).mockResolvedValue([{ id: 'j1', fullName: 'JTest' }]);

            const req = createRequest('http://localhost:3000/api/search?scope=journals&q=jtest');
            const res = await GET(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.results.journals).toHaveLength(1);
            expect(prisma.journal.findMany).toHaveBeenCalled();
        });
    });
});
