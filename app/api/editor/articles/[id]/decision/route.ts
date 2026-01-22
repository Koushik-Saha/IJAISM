import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendArticleStatusUpdateEmail } from '@/lib/email/send';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Verify editor/admin access
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true },
        });

        if (!user || !['editor', 'super_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { decision, comments } = body;

        // Validate decision
        if (!['publish', 'reject', 'revise'].includes(decision)) {
            return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
        }

        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                author: { select: { name: true, email: true } },
                journal: true
            }
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        let newStatus = '';
        let statusMessage = '';
        let updateData: any = {};
        let doi = undefined;

        const now = new Date();

        if (decision === 'publish') {
            newStatus = 'published';
            statusMessage = `Congratulations! Your article has been accepted for publication in ${article.journal.fullName}.`;

            // Generate DOI logic
            const currentYear = now.getFullYear();
            const vol = Math.max(1, currentYear - 2023);
            const issue = now.getMonth() + 1;
            doi = `10.5555/ijaism.${currentYear}.${vol}.${issue}.${id.substring(0, 8)}`; // Simplified logic

            updateData = {
                status: 'published',
                publicationDate: now,
                acceptanceDate: now,
                doi,
                volume: vol,
                issue: issue,
                editorComments: comments
            };

        } else if (decision === 'reject') {
            newStatus = 'rejected';
            statusMessage = 'Your article has been declined for publication.';
            updateData = {
                status: 'rejected',
                rejectionReason: comments,
                editorComments: comments
            };

        } else if (decision === 'revise') {
            newStatus = 'revision_requested';
            statusMessage = 'Revisions have been requested for your article.';
            updateData = {
                status: 'revision_requested',
                editorComments: comments
            };
        }

        // Update Article
        const updatedArticle = await prisma.article.update({
            where: { id },
            data: updateData
        });

        // Send Email
        try {
            await sendArticleStatusUpdateEmail(
                article.author.email,
                article.author.name || article.author.email.split('@')[0],
                article.title,
                article.status, // old status
                newStatus,      // new status
                article.id,
                statusMessage + (comments ? `\n\nEditor Comments: ${comments}` : ''),
                doi
            );
        } catch (emailError) {
            console.error('Failed to send status email:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: `Article ${newStatus.replace('_', ' ')} successfully`,
            article: updatedArticle
        });

    } catch (error: any) {
        console.error('Decision error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process decision' },
            { status: 500 }
        );
    }
}
