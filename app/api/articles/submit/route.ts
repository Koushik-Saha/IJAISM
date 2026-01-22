import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { articleSubmissionSchema } from '@/lib/validations/article';
import { sendArticleSubmissionEmail } from '@/lib/email/send';
import { canUserSubmit, getMembershipStatus } from '@/lib/membership';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Submission attempt with invalid token');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. Parse request body
    const body = await req.json();

    // Zod Validation
    const validation = articleSubmissionSchema.safeParse(body);

    if (!validation.success) {
      // Create a nice error message from the first Zod error
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        {
          error: firstError.message,
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const {
      submissionType,
      journal,
      title,
      abstract,
      keywords, // This is now an array from the schema transform
      manuscriptUrl,
      coverLetterUrl,
      resubmissionId,
    } = validation.data;

    // Using filtered keywords directly array from Zod
    const keywordArray = keywords;

    // 6. Find journal by fullName or code
    const journalRecord = await prisma.journal.findFirst({
      where: {
        OR: [
          { fullName: journal },
          { code: journal },
        ]
      },
    });

    if (!journalRecord) {
      return NextResponse.json(
        { error: `Invalid journal: "${journal}". Please select a valid journal from the list.` },
        { status: 400 }
      );
    }

    // 7. Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        university: true,
        affiliation: true,
        role: true, // Added role for logging context
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted submission', { userId, email: user.email });
      return NextResponse.json(
        { error: 'Account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    let article: any;

    // HANDLE RESUBMISSION / UPDATE
    if (resubmissionId) {
      // Check if article exists and belongs to user
      const existingArticle = await prisma.article.findUnique({
        where: { id: resubmissionId },
      });

      if (!existingArticle) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      if (existingArticle.authorId !== userId) {
        return NextResponse.json({ error: 'Unauthorized to edit this article' }, { status: 403 });
      }

      // Update Article
      article = await prisma.article.update({
        where: { id: resubmissionId },
        data: {
          title: title.trim(),
          abstract: abstract.trim(),
          keywords: keywordArray,
          articleType: submissionType || 'research',
          status: 'resubmitted', // Reset status to resubmitted
          journalId: journalRecord.id,
          ...(manuscriptUrl && { pdfUrl: manuscriptUrl }), // Only update PDF if new one uploaded
          submissionDate: new Date(), // Update submission date? Or keep original? Let's update to show "recent" activity.
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
          journal: { select: { fullName: true, code: true } }
        }
      });

      // Replace Co-Authors
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
      // 8. Check membership and submission limits (ONLY FOR NEW SUBMISSIONS)
      const submissionCheck = await canUserSubmit(userId);

      if (!submissionCheck.canSubmit) {
        const membershipStatus = await getMembershipStatus(userId);

        logger.info('Submission rejected due to limit', {
          userId,
          tier: submissionCheck.tier,
          limit: submissionCheck.limit,
          used: submissionCheck.used
        });

        return NextResponse.json(
          {
            error: submissionCheck.reason || 'Submission limit reached',
            tier: submissionCheck.tier,
            limit: submissionCheck.limit,
            used: submissionCheck.used,
            remaining: submissionCheck.remaining,
            upgradeRequired: true,
            currentTier: membershipStatus.tierName,
            upgradeUrl: '/membership',
          },
          { status: 403 }
        );
      }

      // 9. Create article in database
      article = await prisma.article.create({
        data: {
          title: title.trim(),
          abstract: abstract.trim(),
          keywords: keywordArray,
          articleType: submissionType || 'research',
          status: 'submitted',
          authorId: userId,
          journalId: journalRecord.id,
          pdfUrl: manuscriptUrl || null, // Store manuscript URL in pdfUrl field
          submissionDate: new Date(),
          // Metrics are set to 0 by default in schema
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

      // Create co-authors if provided
      if (validation.data.coAuthors && validation.data.coAuthors.length > 0) {
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

      logger.info('Article submitted successfully', {
        articleId: article.id,
        userId,
        journalCode: journalRecord.code,
        title: article.title
      });
    }

    // 10. Create notification for author
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

    // 11. Send confirmation email (non-blocking)
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
      // Don't fail the submission if email fails
    });

    // 12. Return success response
    return NextResponse.json({
      success: true,
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
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Article submission error', error, {
      path: '/api/articles/submit'
    });

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An article with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
