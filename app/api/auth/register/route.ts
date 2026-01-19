import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, isAcademicEmail } from '@/lib/auth';
import { sendWelcomeEmail, sendEmailVerificationEmail } from '@/lib/email/send';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, university, password } = body;

    // Validation
    if (!name || !email || !university || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'All fields are required' },
        },
        { status: 400 }
      );
    }

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
