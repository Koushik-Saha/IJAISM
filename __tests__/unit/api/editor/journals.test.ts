
/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/editor/journals/route';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        journal: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

describe('Admin Journals API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockAdminUser = {
        id: 'admin-1',
        role: 'admin',
    };

    const mockRegularUser = {
        id: 'user-1',
        role: 'user',
    };

    const createRequest = (method: string, body: any = null, token: string = 'valid-token') => {
        return new NextRequest(new URL('http://localhost:3000/api/editor/journals'), {
            method,
            headers: {
                authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : null,
        });
    };

    describe('GET', () => {
        it('should return 401 if unauthorized', async () => {
            const req = new NextRequest(new URL('http://localhost:3000/api/editor/journals'));
            const res = await GET(req);
            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not admin/editor', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser);

            const req = createRequest('GET');
            const res = await GET(req);

            expect(res.status).toBe(403);
        });

        it('should return journals if authorized', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'admin-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
            (prisma.journal.findMany as jest.Mock).mockResolvedValue([{ id: 'j-1', code: 'JTest' }]);

            const req = createRequest('GET');
            const res = await GET(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.journals).toHaveLength(1);
        });
    });

    describe('POST', () => {
        const validBody = {
            code: 'NEWJ',
            fullName: 'New Journal',
            description: 'Desc',
        };

        it('should return 403 if user is not admin/editor', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser);

            const req = createRequest('POST', validBody);
            const res = await POST(req);

            expect(res.status).toBe(403);
        });

        it('should create journal if data is valid', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'admin-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
            (prisma.journal.findUnique as jest.Mock).mockResolvedValue(null); // No duplicate
            (prisma.journal.create as jest.Mock).mockResolvedValue({ id: 'new-j', ...validBody });

            const req = createRequest('POST', validBody);
            const res = await POST(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.journal.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ code: 'NEWJ' })
            }));
        });

        it('should return 409 if journal code already exists', async () => {
            (verifyToken as jest.Mock).mockReturnValue({ userId: 'admin-1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
            (prisma.journal.findUnique as jest.Mock).mockResolvedValue({ id: 'exists' });

            const req = createRequest('POST', validBody);
            const res = await POST(req);

            expect(res.status).toBe(409);
        });
    });
});
