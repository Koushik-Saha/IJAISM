/**
 * @jest-environment node
 */
import { GET } from '@/app/api/files/download/[...path]/route';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import path from 'path';

// Mocks
jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('@/lib/membership', () => ({
    getMembershipStatus: jest.fn(),
}));

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    statSync: jest.fn(),
    createReadStream: jest.fn(),
}));

// Mock stream to be an async iterable (NodeReadable style)
const mockStream = {
    [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('test-data');
    }
};

jest.mock('path', () => ({
    ...jest.requireActual('path'),
    join: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        $queryRaw: jest.fn(),
        $executeRaw: jest.fn(),
    },
}));

describe('GET /api/files/download', () => {
    const mockUser = { userId: 'user-1' };

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup path join to return safe-looking paths
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    });

    it('returns 307 redirect if no token available', async () => {
        const req = new NextRequest('http://localhost:3000/api/files/download/a.pdf');
        const params = Promise.resolve({ path: ['a.pdf'] });
        const res = await GET(req, { params });
        expect(res.status).toBe(307); // Redirect status
        expect(res.headers.get('Location')).toContain('/login');
    });

    it('returns 401 if token is invalid', async () => {
        (verifyToken as jest.Mock).mockReturnValue(null);
        const req = new NextRequest('http://localhost:3000/api/files/download/a.pdf?token=bad');
        const params = Promise.resolve({ path: ['a.pdf'] });
        const res = await GET(req, { params });
        expect(res.status).toBe(401);
    });

    it('returns 403 if free tier limit exceeded', async () => {
        (verifyToken as jest.Mock).mockReturnValue(mockUser);
        const { getMembershipStatus } = require('@/lib/membership');
        (getMembershipStatus as jest.Mock).mockResolvedValue({ tier: 'free' });

        // Mock Prisma raw query result for count
        const { prisma } = require('@/lib/prisma');
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 60 }]); // > 50

        const req = new NextRequest('http://localhost:3000/api/files/download/a.pdf', {
            headers: { Authorization: 'Bearer token' }
        });
        const params = Promise.resolve({ path: ['a.pdf'] });
        const res = await GET(req, { params });
        expect(res.status).toBe(403);
    });

    it('returns 200 and file if authorized and unlimited', async () => {
        (verifyToken as jest.Mock).mockReturnValue(mockUser);
        const { getMembershipStatus } = require('@/lib/membership');
        (getMembershipStatus as jest.Mock).mockResolvedValue({ tier: 'premium' }); // Unlimited

        const fs = require('fs');
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.statSync as jest.Mock).mockReturnValue({ size: 100 });
        (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

        // Ensure path check passes
        (path.join as jest.Mock).mockImplementation((...args) => {
            // If absolute path provided as first arg, treated as base
            // Join by '/'
            return args.join('/');
        });

        // Mock process.cwd to align with path.join mock
        jest.spyOn(process, 'cwd').mockReturnValue('/ROOT');

        const req = new NextRequest('http://localhost:3000/api/files/download/a.pdf', {
            headers: { Authorization: 'Bearer token' }
        });
        const params = Promise.resolve({ path: ['a.pdf'] });

        const res = await GET(req, { params });
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('returns 404 if file missing locally', async () => {
        (verifyToken as jest.Mock).mockReturnValue(mockUser);
        const { getMembershipStatus } = require('@/lib/membership');
        (getMembershipStatus as jest.Mock).mockResolvedValue({ tier: 'premium' });

        const fs = require('fs');
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        // Mock safely path
        (path.join as jest.Mock).mockReturnValue('/ROOT/public/uploads/missing.pdf');
        jest.spyOn(process, 'cwd').mockReturnValue('/ROOT');

        const req = new NextRequest('http://localhost:3000/api/files/download/missing.pdf', {
            headers: { Authorization: 'Bearer token' }
        });
        const params = Promise.resolve({ path: ['missing.pdf'] });
        const res = await GET(req, { params });
        expect(res.status).toBe(404);
    });
});
