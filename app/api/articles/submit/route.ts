
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { articleSubmissionSchema } from '@/lib/validations/article';
import { sendArticleSubmissionEmail, sendCoAuthorNotification } from '@/lib/email/send';
import { canUserSubmit, getMembershipStatus } from '@/lib/membership';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';
import { checkPlagiarism } from '@/lib/integrity/plagiarism';

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
      supplementaryFiles,
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

    const isSystemAdmin = ['mother_admin', 'super_admin'].includes(user.role);
    let processedCoAuthors = validation.data.coAuthors ? [...validation.data.coAuthors] : [];

    if (!isSystemAdmin) {
      const hasSelf = processedCoAuthors.some(
        (ca: any) => ca.email && ca.email.trim().toLowerCase() === user.email.toLowerCase()
      );

      if (!hasSelf) {
        const hasCorresponding = processedCoAuthors.some((ca: any) => ca.isCorresponding);
        processedCoAuthors.push({
          name: user.name || '',
          email: user.email,
          university: user.university || user.affiliation || '',
          isMain: processedCoAuthors.length === 0,
          isCorresponding: !hasCorresponding,
        });
      }
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
          ...(coverLetterUrl && { coverLetterUrl: coverLetterUrl }),
          supplementaryFiles: supplementaryFiles || [],
          submissionDate: new Date(),
          // Re-run plagiarism check on resubmission
          ...(await checkPlagiarism(title + '\n\n' + abstract).then(res => ({
            similarityScore: res.score,
            plagiarismReportUrl: res.reportUrl
          }))),
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
          journal: { select: { fullName: true, code: true } }
        }
      });

      if (validation.data.coAuthors) {
        await prisma.coAuthor.deleteMany({ where: { articleId: article.id } });
        if (processedCoAuthors.length > 0) {
          const coAuthorData = await Promise.all(
            processedCoAuthors.map(async (author: any, index: number) => {
              const matchedUserId = await getOrCreateCoAuthorUserId(
                author,
                title.trim(),
                journalRecord.fullName,
                user.email,
                userId
              );
              return {
                articleId: article.id,
                name: author.name.trim(),
                email: author.email?.trim() || null,
                university: author.university.trim(),
                order: author.order !== undefined ? author.order : index + 1,
                isMain: author.isMain || false,
                isCorresponding: author.isCorresponding || false,
                userId: matchedUserId,
              };
            })
          );
          await prisma.coAuthor.createMany({
            data: coAuthorData
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
          coverLetterUrl: coverLetterUrl || null,
          supplementaryFiles: supplementaryFiles || [],
          submissionDate: new Date(),
          // Run initial plagiarism check
          ...(await checkPlagiarism(title + '\n\n' + abstract).then(res => ({
            similarityScore: res.score,
            plagiarismReportUrl: res.reportUrl
          }))),
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

      if (processedCoAuthors.length > 0) {
        const coAuthorData = await Promise.all(
          processedCoAuthors.map(async (author: any, index: number) => {
            const matchedUserId = await getOrCreateCoAuthorUserId(
              author,
              title.trim(),
              journalRecord.fullName,
              user.email,
              userId
            );
            return {
              articleId: article.id,
              name: author.name.trim(),
              email: author.email?.trim() || null,
              university: author.university.trim(),
              order: author.order !== undefined ? author.order : index + 1,
              isMain: author.isMain || false,
              isCorresponding: author.isCorresponding || false,
              userId: matchedUserId,
            };
          })
        );
        await prisma.coAuthor.createMany({
          data: coAuthorData
        });
      }

      logger.info('Article submitted successfully', {
        articleId: article.id,
        userId,
        journalCode: journalRecord.code,
        title: article.title
      });
    }

    await prisma.activityLog.create({
      data: {
        articleId: article.id,
        userId: userId,
        action: resubmissionId ? 'UPDATED' : 'SUBMITTED',
        details: resubmissionId ? 'Article resubmitted by author' : 'First version submitted',
      }
    });

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
        if (coAuthor.email && coAuthor.email.trim().toLowerCase() !== user.email.toLowerCase()) {
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

async function getOrCreateCoAuthorUserId(
  author: any,
  articleTitle: string,
  journalName: string,
  submittingUserEmail: string,
  submittingUserId: string
): Promise<string | null> {
  const email = author.email?.trim() || null;
  if (!email) return null;

  if (email.toLowerCase() === submittingUserEmail.toLowerCase()) {
    return submittingUserId;
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    return existingUser.id;
  }

  // Create new user account automatically
  const tempPassword = `Temp-${Math.random().toString(36).substring(2, 10).toUpperCase()}1!`;
  const { hashPassword } = await import('@/lib/auth');
  const passwordHash = await hashPassword(tempPassword);

  const newUser = await prisma.user.create({
    data: {
      email,
      name: author.name.trim(),
      passwordHash,
      university: author.university.trim() || 'N/A',
      role: 'author',
      isActive: true,
      isEmailVerified: true,
    }
  });

  // Send credentials email
  try {
    const subject = `Welcome to C5K Journals - Account Created as Co-Author`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #4F46E5;">Listed as Co-Author</h2>
        <p>Dear ${author.name.trim()},</p>
        <p>You have been listed as a co-author on the paper titled <strong>"${articleTitle}"</strong> submitted to the journal <strong>"${journalName}"</strong>.</p>
        <p>An account has been automatically created for you to access the system and track the progress of the submission.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Dashboard Link:</strong> <a href="${appUrl}/login" style="color: #4F46E5;">Login Here</a></p>
          <p style="margin: 5px 0;"><strong>Username / Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #E5E7EB; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${tempPassword}</code></p>
        </div>
        <p style="color: #EF4444; font-size: 13px;"><em>Please change your password after logging in for security.</em></p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="color: #6B7280; font-size: 12px;">This is an automated message from C5K Platform.</p>
      </div>
    `;
    const { sendEmail } = await import('@/lib/email/send');
    await sendEmail(email, subject, html);
  } catch (err) {
    console.error("Failed to send co-author welcome email:", err);
  }

  return newUser.id;
}
