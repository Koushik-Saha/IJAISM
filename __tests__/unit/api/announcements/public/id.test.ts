/**
 * @jest-environment node
 */
import { GET } from '@/app/api/announcements/public/[id]/route';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        announcement: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe('GET /api/announcements/public/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 and announcement with related items', async () => {
        const mockAnnouncement = {
            id: '1',
            title: 'Test Announcement',
            category: 'news',
            publishedAt: new Date(),
            expiresAt: null
        };

        const mockRelated = [
            { id: '2', title: 'Related 1' },
            { id: '3', title: 'Related 2' }
        ];

        const { prisma } = require('@/lib/prisma');
        (prisma.announcement.findUnique as jest.Mock).mockResolvedValue(mockAnnouncement);
        (prisma.announcement.findMany as jest.Mock).mockResolvedValue(mockRelated);

        const req = new NextRequest('http://localhost:3000/api/announcements/public/1');
        const params = Promise.resolve({ id: '1' });

        const res = await GET(req, { params });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.announcement).toEqual({
            ...mockAnnouncement,
            publishedAt: mockAnnouncement.publishedAt.toISOString(),
        });
        expect(data.relatedAnnouncements).toHaveLength(2);
    });

    it('returns 404 if announcement not found', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.announcement.findUnique as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/announcements/public/999');
        const params = Promise.resolve({ id: '999' });

        const res = await GET(req, { params });
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.error).toBe('Announcement not found');
    });

    it('handles database errors gracefully', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.announcement.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const req = new NextRequest('http://localhost:3000/api/announcements/public/1');
        const params = Promise.resolve({ id: '1' });

        const res = await GET(req, { params });
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe('Failed to fetch announcement');
    });
});
