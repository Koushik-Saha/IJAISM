/**
 * @jest-environment node
 */
import { GET, POST, PATCH } from '@/app/api/reviews/[id]/route';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Mock Dependencies
jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('@/lib/reviews', () => ({
    getReviewById: jest.fn(),
    submitReviewDecision: jest.fn(),
    startReview: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
    },
}));

describe('Review API /api/reviews/[id]', () => {
    const mockUser = { userId: 'user-1' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('returns 403 if user is not a reviewer', async () => {
            (verifyToken as jest.Mock).mockReturnValue(mockUser);
            const { prisma } = require('@/lib/prisma');
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'author' });

            const req = new NextRequest('http://localhost:3000/api/reviews/1', {
                headers: { Authorization: 'Bearer token' }
            });
            const params = Promise.resolve({ id: '1' });
            const res = await GET(req, { params });

            expect(res.status).toBe(403);
        });

        it('returns 200 and review if authorized', async () => {
            (verifyToken as jest.Mock).mockReturnValue(mockUser);
            const { prisma } = require('@/lib/prisma');
            const { getReviewById } = require('@/lib/reviews');

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'reviewer' });
            (getReviewById as jest.Mock).mockResolvedValue({ id: '1', status: 'pending' });

            const req = new NextRequest('http://localhost:3000/api/reviews/1', {
                headers: { Authorization: 'Bearer token' }
            });
            const params = Promise.resolve({ id: '1' });
            const res = await GET(req, { params });
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.review.id).toBe('1');
        });
    });

    describe('POST (Submit Decision)', () => {
        const validBody = {
            decision: 'accept',
            commentsToAuthor: 'Great work!'.padEnd(51, '.'), // >50 chars
            commentsToEditor: 'Looks good'
        };

        it('returns 400 for validation errors', async () => {
            (verifyToken as jest.Mock).mockReturnValue(mockUser);
            const { prisma } = require('@/lib/prisma');
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'reviewer' });

            const req = new NextRequest('http://localhost:3000/api/reviews/1', {
                method: 'POST',
                headers: { Authorization: 'Bearer token' },
                body: JSON.stringify({ decision: 'invalid' })
            });
            const params = Promise.resolve({ id: '1' });
            const res = await POST(req, { params });
            expect(res.status).toBe(400);
        });

        it('submits review successfully', async () => {
            (verifyToken as jest.Mock).mockReturnValue(mockUser);
            const { prisma } = require('@/lib/prisma');
            const { submitReviewDecision } = require('@/lib/reviews');

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'reviewer' });
            (submitReviewDecision as jest.Mock).mockResolvedValue({ id: '1', status: 'completed' });

            const req = new NextRequest('http://localhost:3000/api/reviews/1', {
                method: 'POST',
                headers: { Authorization: 'Bearer token' },
                body: JSON.stringify(validBody)
            });
            const params = Promise.resolve({ id: '1' });
            const res = await POST(req, { params });

            expect(res.status).toBe(200);
            expect(submitReviewDecision).toHaveBeenCalledWith('1', 'user-1', 'accept', expect.any(String), 'Looks good');
        });
    });

    describe('PATCH (Start Review)', () => {
        it('starts review successfully', async () => {
            (verifyToken as jest.Mock).mockReturnValue(mockUser);
            const { startReview } = require('@/lib/reviews');
            (startReview as jest.Mock).mockResolvedValue({ id: '1', status: 'in_progress' });

            const req = new NextRequest('http://localhost:3000/api/reviews/1', {
                method: 'PATCH',
                headers: { Authorization: 'Bearer token' }
            });
            const params = Promise.resolve({ id: '1' });
            const res = await PATCH(req, { params });

            expect(res.status).toBe(200);
            expect(startReview).toHaveBeenCalledWith('1', 'user-1');
        });
    });
});
