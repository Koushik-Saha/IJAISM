/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import { comparePassword, generateToken } from '@/lib/auth';

// Mock Dependencies
jest.mock('@/lib/auth', () => ({
    comparePassword: jest.fn(),
    generateToken: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => {
    return jest.fn().mockImplementation(() => ({
        check: jest.fn().mockResolvedValue(true)
    }));
});

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('POST /api/auth/login', () => {
    const mockUser = {
        id: 'user-1',
        email: 'test@uni.edu',
        passwordHash: 'hashed',
        name: 'Test',
        isActive: true,
        isEmailVerified: true,
        role: 'author'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 for missing fields', async () => {
        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@uni.edu' }) // missing password
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 401 for invalid credentials (user not found)', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@uni.edu', password: '123' })
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('returns 401 for invalid credentials (password mismatch)', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (comparePassword as jest.Mock).mockResolvedValue(false);

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@uni.edu', password: 'wrong' })
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('returns 403 if account is inactive', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@uni.edu', password: '123' })
        });
        const res = await POST(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error.code).toBe('ACCOUNT_DEACTIVATED');
    });

    it('returns 403 if email not verified', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, isEmailVerified: false });
        (comparePassword as jest.Mock).mockResolvedValue(true);

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@uni.edu', password: '123' })
        });
        const res = await POST(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('returns 200 and token on success', async () => {
        const { prisma } = require('@/lib/prisma');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (comparePassword as jest.Mock).mockResolvedValue(true);
        (generateToken as jest.Mock).mockReturnValue('fake-token');

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@uni.edu', password: '123' })
        });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.data.accessToken).toBe('fake-token');
        expect(prisma.user.update).toHaveBeenCalled(); // Last login update
    });
});
