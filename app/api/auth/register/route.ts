import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, isAcademicEmail } from '@/lib/auth';
import { registerSchema } from '@/lib/validations/auth';
import { sendWelcomeEmail, sendEmailVerificationEmail } from '@/lib/email/send';
import rateLimit from '@/lib/rate-limit';
import crypto from 'crypto';
import { apiSuccess, apiError } from '@/lib/api-response';

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    try {
      await limiter.check(NextResponse.next(), 50, ip); // Adjusted limit
    } catch {
      return apiError('Too many registration attempts. Please try again later.', 429, undefined, 'RATE_LIMIT_EXCEEDED');
    }

    const body = await req.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        'Validation failed',
        400,
        validation.error.flatten().fieldErrors,
        'VALIDATION_ERROR'
      );
    }

    const { name, email, university, password } = validation.data;

    if (!isAcademicEmail(email)) {
      return apiError('Please enter a valid email address', 400, undefined, 'INVALID_EMAIL');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // SECURITY: Generic message to prevent Email Enumeration
      return apiSuccess(
        null,
        'Registration successful. If an account with this email exists, a verification link has been sent.',
        201
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        university,
        passwordHash,
        role: 'author',
        isEmailVerified: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        role: true,
        createdAt: true,
      },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    sendWelcomeEmail(user.email, user.name).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    sendEmailVerificationEmail(user.email, user.name, verificationToken).catch(error => {
      console.error('Failed to send verification email:', error);
    });

    // Process Pending Reviewer Invitations
    try {
      const invitations = await prisma.reviewerInvitation.findMany({
        where: { email: user.email, status: 'pending' }
      });

      for (const inv of invitations) {
        const exists = await prisma.review.findFirst({
          where: { articleId: inv.articleId, reviewerId: user.id }
        });

        if (!exists) {
          const nextReviewerNumber = await prisma.review.count({ where: { articleId: inv.articleId } }) + 1;
          await prisma.review.create({
            data: {
              articleId: inv.articleId,
              reviewerId: user.id,
              reviewerNumber: nextReviewerNumber,
              status: 'invited',
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            }
          });

          await prisma.reviewerInvitation.update({
            where: { id: inv.id },
            data: { status: 'accepted' }
          });

          if (user.role !== 'reviewer' && user.role !== 'editor' && user.role !== 'super_admin') {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'reviewer' }
            });
          }
        }
      }
    } catch (invError) {
      console.error("Error processing reviewer invitations:", invError);
    }

    return apiSuccess(
      { user }, // SECURITY: verificationToken removed from response
      'Registration successful. Please check your email to verify your account.',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return apiError('An error occurred during registration', 500);
  }
}
