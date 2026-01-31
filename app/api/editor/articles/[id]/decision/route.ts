import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendArticleStatusUpdateEmail } from '@/lib/email/send';
import { registerDoi } from '@/lib/doi/crossref';
import { pushToOrcid } from '@/lib/orcid/client';

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
        if (!['publish', 'reject', 'revise', 'accept'].includes(decision)) {
            return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
        }

        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        orcid: true,
                        orcidAccessToken: true
                    }
                },
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

        if (decision === 'accept') {
            // New "Accept" stage (Pre-Publish)
            newStatus = 'accepted';
            statusMessage = `Your article has been accepted for publication in ${article.journal.fullName}. Please log in to your dashboard to complete the APC payment.`;

            updateData = {
                status: 'accepted',
                acceptanceDate: now,
                editorComments: comments
            };

        } else if (decision === 'publish') {
            // Check APC Payment
            const isMotherAdmin = user.role === 'mother_admin';
            if (!article.isApcPaid && !isMotherAdmin) {
                return NextResponse.json({
                    error: 'Cannot publish. APC Fee has not been paid by the author.',
                    code: 'APC_NOT_PAID'
                }, { status: 403 });
            }

            newStatus = 'published';
            statusMessage = `Congratulations! Your article has been officially published in ${article.journal.fullName}.`;

            // Generate DOI logic
            const currentYear = now.getFullYear();
            const vol = Math.max(1, currentYear - 2023);
            const issue = now.getMonth() + 1;
            doi = `10.5555/c5k.${currentYear}.${vol}.${issue}.${id.substring(0, 8)}`; // Simplified logic

            updateData = {
                status: 'published',
                publicationDate: now,
                // acceptanceDate: now, // Already set during accept usually, but safe to update? Maybe keep original if exists.
                doi,
                volume: vol,
                issue: issue,
                editorComments: comments
            };

            // Trigger DOI Registration
            /*
             * Note: In a real async system, this should be a background job.
             * For MVP, we await it or let it run but catch errors so we don't block the UI response.
             */
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c5k.com';
                await registerDoi({
                    id: article.id,
                    doi: doi || '',
                    url: `${appUrl}/articles/${article.id}`,
                    title: article.title,
                    journalTitle: article.journal.fullName,
                    journalIssn: article.journal.issn,
                    publicationDate: now,
                    volume: vol,
                    issue: issue,
                    authors: [{ name: article.author.name || 'Unknown' }]
                });
            } catch (doiError) {
                console.error("DOI Auto-Registration failed:", doiError);
                // We do NOT block publication for this, but ideally we'd log this to a 'failed_jobs' table
            }

            // Trigger ORCID Push
            if (article.author.orcid && article.author.orcidAccessToken) {
                try {
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c5k.com';
                    await pushToOrcid(
                        article.author.orcid,
                        article.author.orcidAccessToken,
                        {
                            title: article.title,
                            type: 'journal-article',
                            publicationDate: now,
                            journalName: article.journal.fullName,
                            doi,
                            url: `${appUrl}/articles/${article.id}`,
                            abstract: article.abstract
                        }
                    );
                } catch (orcidError) {
                    console.error("ORCID Push failed:", orcidError);
                }
            }

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

        // Create Notification for Author
        try {
            let notifType = 'info';
            if (['accepted', 'published'].includes(newStatus)) notifType = 'success';
            if (newStatus === 'rejected') notifType = 'error';
            if (newStatus === 'revision_requested') notifType = 'warning';

            await prisma.notification.create({
                data: {
                    userId: article.authorId,
                    title: `Article ${newStatus.replace('_', ' ')}`,
                    message: statusMessage,
                    type: notifType,
                    link: `/dashboard/submissions/${id}`
                }
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

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
