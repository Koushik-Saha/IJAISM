import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email/send';
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
      await limiter.check(NextResponse.next(), 3, ip); // 3 password reset attempts per hour per IP
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Too many password reset attempts. Please try again later.' },
        },
        { status: 429 }
      );
    }

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
        isActive: true,
      },
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user && user.isActive) {
      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Invalidate any existing unused tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      // Create new password reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken
      );

      if (!emailSent) {
        console.error('Failed to send password reset email to:', user.email);
        // Don't fail the request - security best practice
      }

      console.log(`✅ Password reset requested for: ${user.email}`);
    } else {
      // Log for admin purposes, but don't reveal to user
      console.log(`⚠️  Password reset requested for non-existent/inactive email: ${email}`);
    }

    // Always return success message (security best practice)
    return NextResponse.json(
      {
        success: true,
        message:
          'If an account exists with that email, you will receive a password reset link shortly.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred while processing your request' },
      },
      { status: 500 }
    );
  }
}
