/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';
import { hashPassword, isAcademicEmail } from '@/lib/auth';

// Mock Dependencies
jest.mock('@/lib/auth', () => ({
    hashPassword: jest.fn(),
    isAcademicEmail: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/email/send', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendEmailVerificationEmail: jest.fn().mockResolvedValue(true),
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
            create: jest.fn(),
        },
        emailVerificationToken: {
            create: jest.fn(),
        }
    },
}));

describe('POST /api/auth/register', () => {
    const validPayload = {
        name: 'Test Student',
        email: 'test@uni.edu',
        university: 'Test Uni',
        password: 'password123'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 for validation errors', async () => {
        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({})
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email', async () => {
        (isAcademicEmail as jest.Mock).mockReturnValue(false);
        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(validPayload)
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error.code).toBe('INVALID_EMAIL');
    });

    it('returns 409 if user exists', async () => {
        (isAcademicEmail as jest.Mock).mockReturnValue(true);
        const { prisma } = require('@/lib/prisma');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(validPayload)
        });
        const res = await POST(req);
        expect(res.status).toBe(409);
    });

    it('returns 201 on success', async () => {
        (isAcademicEmail as jest.Mock).mockReturnValue(true);
        (hashPassword as jest.Mock).mockResolvedValue('hashed');

        const { prisma } = require('@/lib/prisma');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({ ...validPayload, id: 'new-user', role: 'author' });

        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(validPayload)
        });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.success).toBe(true);
        expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
        // Check emails
        const { sendWelcomeEmail, sendEmailVerificationEmail } = require('@/lib/email/send');
        expect(sendWelcomeEmail).toHaveBeenCalled();
        expect(sendEmailVerificationEmail).toHaveBeenCalled();
    });
});
