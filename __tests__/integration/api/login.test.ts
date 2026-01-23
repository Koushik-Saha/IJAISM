/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@/lib/auth', () => ({
    comparePassword: jest.fn(),
    generateToken: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => {
    return jest.fn().mockImplementation(() => ({
        check: jest.fn().mockResolvedValue(true),
    }));
});

describe('POST /api/auth/login', () => {
    const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        university: 'Test Uni',
        role: 'author',
        isActive: true,
        isEmailVerified: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 and token for valid credentials', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (comparePassword as jest.Mock).mockResolvedValue(true);
        (generateToken as jest.Mock).mockReturnValue('fake-jwt-token');

        const req = new NextRequest('http://localhost:3000/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.accessToken).toBe('fake-jwt-token');
    });

    it('returns 401 for invalid password', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (comparePassword as jest.Mock).mockResolvedValue(false);

        const req = new NextRequest('http://localhost:3000/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'wrongpassword',
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
    });
});
