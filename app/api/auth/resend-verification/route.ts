import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailVerificationEmail } from '@/lib/email/send';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Email is required' },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Please provide a valid email address' },
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists and is not verified
    if (user && user.isActive) {
      // Check if already verified
      if (user.isEmailVerified) {
        return NextResponse.json(
          {
            success: true,
            message: 'This email is already verified',
          },
          { status: 200 }
        );
      }

      // Generate new secure random token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Invalidate any existing unused tokens for this user
      await prisma.emailVerificationToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      // Create new email verification token
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt,
        },
      });

      // Send verification email
      const emailSent = await sendEmailVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );

      if (!emailSent.success) {
        console.error('Failed to send verification email to:', user.email);
        // Don't fail the request - security best practice
      }

      console.log(`✅ Verification email resent to: ${user.email}`);
    } else {
      // Log for admin purposes, but don't reveal to user
      console.log(`⚠️  Verification email requested for non-existent/inactive email: ${email}`);
    }

    // Always return success message (security best practice)
    return NextResponse.json(
      {
        success: true,
        message:
          'If an account exists with that email and is not verified, you will receive a verification link shortly.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred while processing your request' },
      },
      { status: 500 }
    );
  }
}
