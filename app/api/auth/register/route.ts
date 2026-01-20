import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, isAcademicEmail } from '@/lib/auth';
import { registerSchema } from '@/lib/validations/auth';
import { sendWelcomeEmail, sendEmailVerificationEmail } from '@/lib/email/send';
import rateLimit from '@/lib/rate-limit';
import crypto from 'crypto';

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    try {
      await limiter.check(NextResponse.next(), 5, ip); // 5 registration attempts per hour per IP
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Too many registration attempts. Please try again later.' },
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Zod Validation
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            details: validation.error.flatten().fieldErrors
          },
        },
        { status: 400 }
      );
    }

    const { name, email, university, password } = validation.data;

    // Validate academic email
    if (!isAcademicEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Please use an academic or work email address' },
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'An account with this email already exists' },
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

    // Create email verification token
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(error => {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if email fails
    });

    // Send email verification email (non-blocking)
    sendEmailVerificationEmail(user.email, user.name, verificationToken).catch(error => {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    });

    return NextResponse.json(
      {
        success: true,
        data: { user },
        message: 'Registration successful. Please check your email to verify your account.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred during registration' },
      },
      { status: 500 }
    );
  }
}
