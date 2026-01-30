
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createIssueSchema = z.object({
    journalId: z.string().min(1, 'Journal is required'),
    volume: z.number().min(1, 'Volume must be at least 1'),
    issue: z.number().min(1, 'Issue must be at least 1'),
    year: z.number().min(2000, 'Year must be a valid year'),
    title: z.string().optional(),
    description: z.string().optional(),
    isSpecial: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Unauthorized', 401, undefined, 'UNAUTHORIZED');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return apiError('Invalid token', 401, undefined, 'INVALID_TOKEN');
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { managedJournals: true }
        });

        if (!user || !['super_admin', 'mother_admin', 'editor', 'sub_editor'].includes(user.role)) {
            return apiError('Forbidden', 403, undefined, 'FORBIDDEN');
        }

        // Query Params
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const journalId = searchParams.get('journalId');
        const year = searchParams.get('year');

        const skip = (page - 1) * limit;

        let whereClause: any = {};

        // Editors only see their own journals
        if (['editor', 'sub_editor'].includes(user.role)) {
            if (user.managedJournals.length === 0) {
                return apiSuccess({ issues: [], pagination: { total: 0, pages: 0, current: 1 } });
            }
            // Base RBAC filter
            whereClause.journalId = { in: user.managedJournals.map(j => j.id) };
        }

        // Apply filters
        if (journalId) {
            // If editor, ensure they have access to this journalId
            if (['editor', 'sub_editor'].includes(user.role)) {
                if (!user.managedJournals.some(j => j.id === journalId)) {
                    // Trying to access unmanaged journal, return empty
                    return apiSuccess({ issues: [], pagination: { total: 0, pages: 0, current: 1 } });
                }
            }
            whereClause.journalId = journalId;
        }

        if (year) {
            whereClause.year = parseInt(year);
        }

        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { journal: { fullName: { contains: search, mode: 'insensitive' } } },
                { journal: { code: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [total, issues] = await Promise.all([
            prisma.journalIssue.count({ where: whereClause }),
            prisma.journalIssue.findMany({
                where: whereClause,
                include: {
                    journal: {
                        select: { fullName: true, code: true }
                    },
                    _count: {
                        select: { articles: true }
                    }
                },
                orderBy: [
                    { year: 'desc' },
                    { volume: 'desc' },
                    { issue: 'desc' }
                ],
                skip,
                take: limit
            })
        ]);

        return apiSuccess({
            issues,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page,
                limit
            }
        });

    } catch (error: any) {
        return apiError('Internal server error', 500, { message: error.message });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Unauthorized', 401, undefined, 'UNAUTHORIZED');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return apiError('Invalid token', 401, undefined, 'INVALID_TOKEN');
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { managedJournals: true }
        });

        if (!user || !['super_admin', 'mother_admin', 'editor', 'sub_editor'].includes(user.role)) {
            return apiError('Forbidden', 403, undefined, 'FORBIDDEN');
        }

        const body = await req.json();
        const validation = createIssueSchema.safeParse(body);

        if (!validation.success) {
            return apiError('Validation error', 400, validation.error.flatten().fieldErrors);
        }

        const { journalId, volume, issue, year, title, description, isSpecial } = validation.data;

        // RBAC Check: Ensure editor owns this journal
        if (['editor', 'sub_editor'].includes(user.role)) {
            const ownsJournal = user.managedJournals.some(j => j.id === journalId);
            if (!ownsJournal) {
                return apiError('You are not authorized to create issues for this journal', 403);
            }
        }

        // Check duplicate
        const existingInterest = await prisma.journalIssue.findFirst({
            where: {
                journalId,
                volume,
                issue,
                isSpecial // Should we allow same Vol/Issue if one is special? Maybe. But usually not.
            }
        });

        if (existingInterest) {
            // Just warning logic, usually uniqueness is Vol/Issue per Journal
            return apiError('This Volume/Issue already exists for this journal', 409);
        }

        const newIssue = await prisma.journalIssue.create({
            data: {
                journalId,
                volume,
                issue,
                year,
                title, // e.g. "Special Issue on AI"
                description,
                isSpecial,
            }
        });

        return apiSuccess({ issue: newIssue }, 'Issue created successfully', 201);

    } catch (error: any) {
        return apiError('Internal server error', 500, { message: error.message });
    }
}
