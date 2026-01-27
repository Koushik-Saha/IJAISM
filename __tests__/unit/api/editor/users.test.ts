
/**
 * @jest-environment node
 */
import { GET, PATCH } from '@/app/api/editor/users/route';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
    ROLES: {
        MOTHER_ADMIN: 'mother_admin',
        SUPER_ADMIN: 'super_admin',
        EDITOR: 'editor',
        SUB_EDITOR: 'sub_editor',
        REVIEWER: 'reviewer',
        AUTHOR: 'author',
    },
    hashPassword: jest.fn(),
}));

describe('Admin Users API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockAdminUser = {
        id: 'admin-1',
        role: 'super_admin',
    };

    const createRequest = (method: string, urlStr: string, body: any = null, token: string = 'valid-token') => {
        return new NextRequest(new URL(urlStr), {
            method,
            headers: {
                authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : null,
        });
    };

    describe('GET', () => {
        it('should return list of users for admin', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'admin-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1', name: 'User 1' }]);
            (prisma.user.count as jest.Mock).mockResolvedValue(1);

            const req = createRequest('GET', 'http://localhost:3000/api/editor/users?role=reviewer');
            const res = await GET(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.users).toHaveLength(1);
            expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ role: 'reviewer' })
            }));
        });
    });

    describe('PATCH', () => {
        it('should update user status', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'admin-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
            (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'u1', isActive: false });

            const req = createRequest('PATCH', 'http://localhost:3000/api/editor/users', {
                userId: 'u1',
                isActive: false
            });
            const res = await PATCH(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.user.isActive).toBe(false);
            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'u1' },
                data: expect.objectContaining({ isActive: false })
            }));
        });

        it('should prevent admin from changing their own role', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'admin-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);

            const req = createRequest('PATCH', 'http://localhost:3000/api/editor/users', {
                userId: 'admin-1',
                role: 'user' // Trying to demote self
            });
            const res = await PATCH(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toContain('Cannot change your own admin role');
        });
    });
});
