
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: issueId } = await params;
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Unauthorized', 401, undefined, 'UNAUTHORIZED');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return apiError('Invalid token', 401, undefined, 'INVALID_TOKEN');
        }

        // RBAC: Editor/Admin
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                managedJournals: true
            }
        });

        if (!user || !['super_admin', 'mother_admin', 'editor', 'sub_editor'].includes(user.role)) {
            return apiError('Forbidden', 403, undefined, 'FORBIDDEN');
        }

        const issue = await prisma.journalIssue.findUnique({
            where: { id: issueId },
            include: {
                journal: {
                    select: { id: true, code: true, fullName: true, editorId: true }
                },
                articles: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        author: { select: { name: true, email: true } },
                        pageStart: true,
                        pageEnd: true
                    },
                    orderBy: { pageStart: 'asc' } // or title
                }
            }
        });

        if (!issue) {
            return apiError('Issue not found', 404);
        }

        if (['editor', 'sub_editor'].includes(user.role)) {
            // Enforce ownership
            if (issue.journal.editorId !== user.id && !user.managedJournals.some(j => j.id === issue.journalId)) {
                // Strict check: if the editor is not the main editor of this journal (or in managed list), block.
                // But usually editors can only access journals they manage.
                // If user role is editor, we check if this journal is mine.
                // If issue.journalId is in user.managedJournals
                const isOwner = user.managedJournals.some(j => j.id === issue.journalId);
                if (!isOwner) {
                    return apiError('Forbidden', 403);
                }
            }
        }

        return apiSuccess({ issue });
    } catch (error: any) {
        return apiError('Internal server error', 500, { message: error.message });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: issueId } = await params;
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

        if (!user || !['super_admin', 'mother_admin', 'editor'].includes(user.role)) {
            // Sub-editors might not be allowed to delete issues? Let's restrict to full editor.
            return apiError('Forbidden', 403);
        }

        const issue = await prisma.journalIssue.findUnique({
            where: { id: issueId },
            include: { journal: true, _count: { select: { articles: true } } }
        });

        if (!issue) return apiError('Issue not found', 404);

        // RBAC Owner Check
        if (user.role === 'editor') {
            const isOwner = user.managedJournals.some(j => j.id === issue.journalId);
            if (!isOwner) return apiError('Forbidden: Not your journal', 403);
        }

        // Safety: Don't delete if articles exist
        if (issue._count.articles > 0) {
            return apiError('Cannot delete issue with assigned articles. Please unassign them first.', 400);
        }

        await prisma.journalIssue.delete({
            where: { id: issueId }
        });

        return apiSuccess({ success: true }, 'Issue deleted successfully');

    } catch (err: any) {
        return apiError(err.message, 500);
    }
}
