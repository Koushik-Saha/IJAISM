import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/auth';
import rateLimit from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-response';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    try {
      await limiter.check(NextResponse.next(), 50, ip);
    } catch {
      return apiError('Too many requests. Please try again later.', 429, undefined, 'RATE_LIMIT_EXCEEDED');
    }

    const body = await req.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        'Validation failed',
        400,
        validation.error.flatten().fieldErrors,
        'VALIDATION_ERROR'
      );
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        university: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      return apiError('Invalid email or password', 401, undefined, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      return apiError('Your account has been deactivated', 403, undefined, 'ACCOUNT_DEACTIVATED');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return apiError('Invalid email or password', 401, undefined, 'INVALID_CREDENTIALS');
    }

    if (!user.isEmailVerified) {
      return apiError(
        'Please verify your email address before logging in.',
        403,
        undefined,
        'EMAIL_NOT_VERIFIED'
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return apiSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          university: user.university,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return apiError('An error occurred during login', 500);
  }
}
