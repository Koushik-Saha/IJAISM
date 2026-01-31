/**
 * @jest-environment node
 */
import { POST } from '@/app/api/articles/submit/route';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { apiError } from '@/lib/api-response';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));
jest.mock('@/lib/email/send', () => ({
    sendArticleSubmissionEmail: jest.fn().mockResolvedValue(true),
    sendCoAuthorNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/integrity/plagiarism', () => ({
    checkPlagiarism: jest.fn().mockResolvedValue({ score: 0, isClean: true }),
}));
jest.mock('@/lib/membership', () => ({
    canUserSubmit: jest.fn(),
    getMembershipStatus: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        journal: { findFirst: jest.fn() },
        user: { findUnique: jest.fn() },
        article: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
        coAuthor: { deleteMany: jest.fn(), createMany: jest.fn() },
        notification: { create: jest.fn() },
        activityLog: { create: jest.fn() },
    },
}));

describe('POST /api/articles/submit', () => {
    const mockUser = {
        id: 'user-1',
        email: 'test@uni.edu',
        name: 'Dr Test',
        isActive: true,
        role: 'author'
    };
    const mockJournal = { id: 'j-1', code: 'JITMB', fullName: 'Journal of IT' };

    const validPayload = {
        title: 'My Research Paper Title',
        abstract: Array(200).fill('word').join(' '), // 200 words
        journal: 'JITMB',
        keywords: ['AI', 'Tech', 'Research', 'Future'], // 4 keywords
        submissionType: 'research',
        manuscriptUrl: '/url.pdf',
        coAuthors: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if no token provided', async () => {
        const req = new NextRequest('http://localhost:3000/api/articles/submit', {
            method: 'POST',
            body: JSON.stringify(validPayload)
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('returns 401 if token is invalid', async () => {
        (verifyToken as jest.Mock).mockReturnValue(null);

        const req = new NextRequest('http://localhost:3000/api/articles/submit', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer bad-token' },
            body: JSON.stringify(validPayload)
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('returns 400 validation error for missing title', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });

        const req = new NextRequest('http://localhost:3000/api/articles/submit', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token' },
            body: JSON.stringify({ ...validPayload, title: '' }) // Invalid
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 400 if journal not found', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
        const { prisma } = require('@/lib/prisma');
        (prisma.journal.findFirst as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/articles/submit', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token' },
            body: JSON.stringify(validPayload)
        });

        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error.code).toBe('INVALID_JOURNAL');
    });

    it('successfully creates a new submission', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
        const { prisma } = require('@/lib/prisma');
        const { canUserSubmit } = require('@/lib/membership');

        (prisma.journal.findFirst as jest.Mock).mockResolvedValue(mockJournal);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (canUserSubmit as jest.Mock).mockResolvedValue({ canSubmit: true });

        (prisma.article.create as jest.Mock).mockResolvedValue({
            id: 'art-1',
            title: validPayload.title,
            status: 'submitted',
            journal: mockJournal,
            author: mockUser
        });

        const req = new NextRequest('http://localhost:3000/api/articles/submit', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token' },
            body: JSON.stringify(validPayload)
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.article.id).toBe('art-1');
        expect(prisma.notification.create).toHaveBeenCalled(); // Check notification
    });

    it('blocks submission if limit reached', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
        const { prisma } = require('@/lib/prisma');
        const { canUserSubmit, getMembershipStatus } = require('@/lib/membership');

        (prisma.journal.findFirst as jest.Mock).mockResolvedValue(mockJournal);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

        (canUserSubmit as jest.Mock).mockResolvedValue({
            canSubmit: false,
            reason: 'Limit Reached',
            tier: 'free',
            limit: 1,
            used: 1
        });
        (getMembershipStatus as jest.Mock).mockResolvedValue({ tierName: 'Free' });

        const req = new NextRequest('http://localhost:3000/api/articles/submit', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token' },
            body: JSON.stringify(validPayload)
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error.code).toBe('SUBMISSION_LIMIT_REACHED');
    });
});
