/**
 * @jest-environment node
 */
import { POST } from '@/app/api/articles/submit/route';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUserSubmit } from '@/lib/membership';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        journal: { findFirst: jest.fn() },
        user: { findUnique: jest.fn() },
        article: { create: jest.fn() },
        notification: { create: jest.fn() },
        activityLog: { create: jest.fn() },
    },
}));

jest.mock('@/lib/membership', () => ({
    canUserSubmit: jest.fn(),
    getMembershipStatus: jest.fn(),
}));

jest.mock('@/lib/email/send', () => ({
    sendArticleSubmissionEmail: jest.fn().mockResolvedValue(true),
    sendCoAuthorNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/integrity/plagiarism', () => ({
    checkPlagiarism: jest.fn().mockResolvedValue({ score: 0, isClean: true }),
}));

jest.mock('@/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Helper to create mock request
function createMockRequest(body: any, token?: string) {
    return {
        json: async () => body,
        headers: {
            get: (key: string) => {
                if (key === 'authorization') return token ? `Bearer ${token}` : null;
                return null;
            },
            getSetCookie: () => [],
        },
    } as unknown as NextRequest;
}

describe('Article Submission API', () => {
    const validToken = 'valid-token';
    const userId = 'user-123';
    const validBody = {
        title: 'Valid Title Length',
        journal: 'Journal Code',
        abstract: 'This is a valid abstract that needs to be between 150 and 300 words. '.repeat(15),
        keywords: 'one, two, three, four, five',
        submissionType: 'research',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if no token provided', async () => {
        const req = createMockRequest(validBody, undefined);
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('should return 401 if invalid token', async () => {
        (verifyToken as jest.Mock).mockReturnValue(null);
        const req = createMockRequest(validBody, 'invalid-token');
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('should return 400 validation error for short abstract', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId });
        // This value is short, so it should trigger min length error or word count logic
        const shortAbstractBody = { ...validBody, abstract: 'Too short' };

        const req = createMockRequest(shortAbstractBody, validToken);
        const res = await POST(req);

        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toBeDefined();
    });

    it('should return 400 validation error for few keywords', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId });
        const fewKeywordsBody = { ...validBody, keywords: 'one, two' };

        const req = createMockRequest(fewKeywordsBody, validToken);
        const res = await POST(req);

        expect(res.status).toBe(400);
    });

    it('should return 403 if submission limit reached', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId });

        // Fixed: include all fields accessed by the route
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: userId,
            isActive: true,
            email: 'test@edu.com',
            name: 'Test User',
            university: 'Test Uni',
            affiliation: 'Test Affiliation',
            role: 'author'
        });

        (prisma.journal.findFirst as jest.Mock).mockResolvedValue({ id: 'j-1', code: 'JCODE', fullName: 'Journal Name' });

        (canUserSubmit as jest.Mock).mockResolvedValue({ canSubmit: false, reason: 'Limit reached' });

        // We also need to mock this because the route calls it if limit is reached
        // Note: We access getMembershipStatus from the mocked module
        const membershipModule = require('@/lib/membership');
        membershipModule.getMembershipStatus.mockResolvedValue({ tierName: 'Basic' });

        const req = createMockRequest(validBody, validToken);
        const res = await POST(req);

        // Debug 500
        if (res.status === 500) {
            const d = await res.json();
            console.log('500 Error Details:', d);
        }

        expect(res.status).toBe(403);
    });

    it('should create article successfully if all checks pass', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ userId });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: userId, isActive: true, email: 'test@edu.com', name: 'Test User'
        });
        (prisma.journal.findFirst as jest.Mock).mockResolvedValue({ id: 'j-1', code: 'JCODE', fullName: 'Journal Name' });
        (canUserSubmit as jest.Mock).mockResolvedValue({ canSubmit: true });

        (prisma.article.create as jest.Mock).mockResolvedValue({
            id: 'article-123',
            title: validBody.title,
            status: 'submitted',
            submissionDate: new Date(),
            journal: { fullName: 'Journal Name', code: 'JCODE' },
            author: { name: 'Test User', email: 'test@edu.com' }
        });

        const req = createMockRequest(validBody, validToken);
        const res = await POST(req);

        expect(res.status).toBe(201);
        expect(prisma.article.create).toHaveBeenCalled();
    });
});
