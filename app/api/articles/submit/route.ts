import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
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
    const {
      submissionType,
      journal,
      title,
      abstract,
      keywords,
      manuscriptUrl,
      coverLetterUrl,
    } = body;

    // 3. Validate required fields
    if (!journal || !title || !abstract || !keywords) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: {
            journal: !journal ? 'Journal is required' : null,
            title: !title ? 'Title is required' : null,
            abstract: !abstract ? 'Abstract is required' : null,
            keywords: !keywords ? 'Keywords are required' : null,
          }
        },
        { status: 400 }
      );
    }

    // 4. Validate abstract length (150-300 words)
    const wordCount = abstract.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 150 || wordCount > 300) {
      return NextResponse.json(
        {
          error: `Abstract must be between 150-300 words. Current: ${wordCount} words`,
        },
        { status: 400 }
      );
    }

    // 5. Validate keywords (4-7 keywords)
    const keywordArray = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    if (keywordArray.length < 4 || keywordArray.length > 7) {
      return NextResponse.json(
        {
          error: `Keywords must be between 4-7. Current: ${keywordArray.length} keywords`,
        },
        { status: 400 }
      );
    }

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

    // 8. Check membership and submission limits
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
    const article = await prisma.article.create({
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
        }
      }
    });

    logger.info('Article submitted successfully', {
      articleId: article.id,
      userId,
      journalCode: journalRecord.code,
      title: article.title
    });

    // 10. Create notification for author
    await prisma.notification.create({
      data: {
        userId,
        type: 'submission_update',
        title: 'Article Submitted Successfully',
        message: `Your article "${title}" has been successfully submitted to ${journalRecord.fullName}. You will receive a confirmation email shortly.`,
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
      message: 'Article submitted successfully',
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
