import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailVerificationConfirmationEmail } from '@/lib/email/send';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    // Validation
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Verification token is required' },
        },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isEmailVerified: true,
            isActive: true,
          },
        },
      },
    });

    // Check if token exists
    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid verification token' },
        },
        { status: 400 }
      );
    }

    // Check if token has been used
    if (verificationToken.used) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This verification link has already been used' },
        },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This verification link has expired. Please request a new one.' },
        },
        { status: 400 }
      );
    }

    // Check if user account is active
    if (!verificationToken.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This account has been deactivated' },
        },
        { status: 403 }
      );
    }

    // Check if email is already verified
    if (verificationToken.user.isEmailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email is already verified',
          data: {
            verified: true,
            email: verificationToken.user.email,
          },
        },
        { status: 200 }
      );
    }

    // Mark token as used
    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Update user email verification status
    await prisma.user.update({
      where: { id: verificationToken.user.id },
      data: { isEmailVerified: true },
    });

    // Invalidate any other unused verification tokens for this user
    await prisma.emailVerificationToken.updateMany({
      where: {
        userId: verificationToken.user.id,
        used: false,
        id: { not: verificationToken.id },
      },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Send verification confirmation email (non-blocking)
    sendEmailVerificationConfirmationEmail(
      verificationToken.user.email,
      verificationToken.user.name
    ).catch(error => {
      console.error('Failed to send verification confirmation email:', error);
    });

    console.log(`✅ Email verified for user: ${verificationToken.user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        data: {
          verified: true,
          email: verificationToken.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred during email verification' },
      },
      { status: 500 }
    );
  }
}
