
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { articleSubmissionSchema } from '@/lib/validations/article';
import { sendArticleSubmissionEmail, sendCoAuthorNotification } from '@/lib/email/send';
import { canUserSubmit, getMembershipStatus } from '@/lib/membership';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized - No token provided', 401, undefined, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Submission attempt with invalid token');
      return apiError('Unauthorized - Invalid token', 401, undefined, 'INVALID_TOKEN');
    }

    const userId = decoded.userId;

    const body = await req.json();

    const validation = articleSubmissionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return apiError(
        firstError.message,
        400,
        validation.error.flatten().fieldErrors,
        'VALIDATION_ERROR'
      );
    }

    const {
      submissionType,
      journal,
      title,
      abstract,
      keywords,
      manuscriptUrl,
      coverLetterUrl,
      resubmissionId,
    } = validation.data;

    const keywordArray = keywords;

    const journalRecord = await prisma.journal.findFirst({
      where: {
        OR: [
          { fullName: journal },
          { code: journal },
        ]
      },
    });

    if (!journalRecord) {
      return apiError(`Invalid journal: "${journal}". Please select a valid journal from the list.`, 400, undefined, 'INVALID_JOURNAL');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        university: true,
        affiliation: true,
        role: true,
      }
    });

    if (!user) {
      return apiError('User not found', 404, undefined, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted submission', { userId, email: user.email });
      return apiError('Account is not active. Please contact support.', 403, undefined, 'ACCOUNT_INACTIVE');
    }

    let article: any;

    if (resubmissionId) {
      const existingArticle = await prisma.article.findUnique({
        where: { id: resubmissionId },
      });

      if (!existingArticle) {
        return apiError('Article not found', 404, undefined, 'ARTICLE_NOT_FOUND');
      }

      if (existingArticle.authorId !== userId) {
        return apiError('Unauthorized to edit this article', 403, undefined, 'UNAUTHORIZED_ACCESS');
      }

      // Restrict Editing: Only allow editing if Draft or Revision Requested
      const allowedStatuses = ['draft', 'revision_requested', 'resubmitted'];

      // CRITICAL: Block editing if the article is actively under review or finalized
      if (!allowedStatuses.includes(existingArticle.status)) {
        logger.warn('Attempt to edit locked article blocked', { articleId: existingArticle.id, status: existingArticle.status });
        return apiError(
          `You cannot edit this article because it is currently "${existingArticle.status}". You can only update it if revisions are requested.`,
          403,
          undefined,
          'EDIT_LOCKED'
        );
      }

      article = await prisma.article.update({
        where: { id: resubmissionId },
        data: {
          title: title.trim(),
          abstract: abstract.trim(),
          keywords: keywordArray,
          articleType: submissionType || 'research',
          status: 'resubmitted',
          journalId: journalRecord.id,
          ...(manuscriptUrl && { pdfUrl: manuscriptUrl }),
          submissionDate: new Date(),
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
          journal: { select: { fullName: true, code: true } }
        }
      });

      if (validation.data.coAuthors) {
        await prisma.coAuthor.deleteMany({ where: { articleId: article.id } });
        if (validation.data.coAuthors.length > 0) {
          await prisma.coAuthor.createMany({
            data: validation.data.coAuthors.map((author: any, index: number) => ({
              articleId: article.id,
              name: author.name,
              email: author.email || null,
              university: author.university,
              order: index + 1,
              isMain: false,
            }))
          });
        }
      }

      logger.info('Article resubmitted/updated', { articleId: article.id, userId });

    } else {
      const submissionCheck = await canUserSubmit(userId);

      if (!submissionCheck.canSubmit) {
        const membershipStatus = await getMembershipStatus(userId);

        logger.info('Submission rejected due to limit', {
          userId,
          tier: submissionCheck.tier,
          limit: submissionCheck.limit,
          used: submissionCheck.used
        });

        return apiError(
          submissionCheck.reason || 'Submission limit reached',
          403,
          {
            tier: submissionCheck.tier,
            limit: submissionCheck.limit,
            used: submissionCheck.used,
            remaining: submissionCheck.remaining,
            upgradeRequired: true,
            currentTier: membershipStatus.tierName,
            upgradeUrl: '/membership',
          },
          'SUBMISSION_LIMIT_REACHED'
        );
      }

      article = await prisma.article.create({
        data: {
          title: title.trim(),
          abstract: abstract.trim(),
          keywords: keywordArray,
          articleType: submissionType || 'research',
          status: 'submitted',
          authorId: userId,
          journalId: journalRecord.id,
          pdfUrl: manuscriptUrl || null,
          submissionDate: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              affiliation: true,
            }
          },
          journal: {
            select: {
              id: true,
              fullName: true,
              code: true,
              issn: true,
            }
          },
          coAuthors: true
        }
      });

      if (validation.data.coAuthors && validation.data.coAuthors.length > 0) {
        await prisma.coAuthor.createMany({
          data: validation.data.coAuthors.map((author: any, index: number) => ({
            articleId: article.id,
            name: author.name,
            email: author.email || null,
            university: author.university,
            order: index + 1,
            isMain: false,
            // Assuming affiliation is stored in university for simplicity or check schema
          }))
        });
      }

      logger.info('Article submitted successfully', {
        articleId: article.id,
        userId,
        journalCode: journalRecord.code,
        title: article.title
      });
    }

    await prisma.notification.create({
      data: {
        userId,
        type: 'submission_update',
        title: resubmissionId ? 'Article Updated' : 'Article Submitted Successfully',
        message: `Your article "${title}" has been successfully ${resubmissionId ? 'updated' : 'submitted'} to ${journalRecord.fullName}.`,
        link: `/dashboard/submissions/${article.id}`,
        isRead: false,
      }
    });

    sendArticleSubmissionEmail(
      user.email,
      user.name || user.email.split('@')[0],
      article.title,
      journalRecord.fullName,
      article.id,
      article.submissionDate || new Date()
    ).catch(error => {
      logger.error('Failed to send submission confirmation email', error, {
        userId,
        articleId: article.id,
        email: user.email
      });
    });

    // Send emails to Co-Authors
    if (validation.data.coAuthors && validation.data.coAuthors.length > 0) {
      const coAuthors = validation.data.coAuthors;
      for (const coAuthor of coAuthors) {
        if (coAuthor.email) {
          sendCoAuthorNotification(
            coAuthor.email,
            coAuthor.name,
            user.name,
            article.title,
            journalRecord.fullName,
            article.id,
            article.submissionDate || new Date()
          ).catch(error => {
            logger.error('Failed to send co-author email', error, {
              coAuthorEmail: coAuthor.email
            });
          });
        }
      }
    }

    return apiSuccess({
      message: resubmissionId ? 'Article updated successfully' : 'Article submitted successfully',
      article: {
        id: article.id,
        title: article.title,
        status: article.status,
        submissionDate: article.submissionDate,
        journal: {
          name: article.journal.fullName,
          code: article.journal.code,
        },
        author: {
          name: article.author.name,
          email: article.author.email,
        }
      }
    }, resubmissionId ? 'Article updated successfully' : 'Article submitted successfully', 201);

  } catch (error: any) {
    logger.error('Article submission error', error, {
      path: '/api/articles/submit'
    });

    if (error.code === 'P2002') {
      return apiError('An article with this title already exists', 409, undefined, 'DUPLICATE_TITLE');
    }

    return apiError('Internal server error. Please try again later.', 500, process.env.NODE_ENV === 'development' ? { message: error.message } : undefined);
  }
}
