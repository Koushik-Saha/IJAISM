import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetConfirmationEmail } from '@/lib/email/send';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    // Validation
    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Token and new password are required' },
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Password must be at least 8 characters long' },
        },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    // Check if token exists
    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid or expired reset token' },
        },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (resetToken.used) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This reset link has already been used' },
        },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This reset link has expired. Please request a new one.' },
        },
        { status: 400 }
      );
    }

    // Check if user account is active
    if (!resetToken.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This account has been deactivated' },
        },
        { status: 403 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update user's password and mark token as used
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);

    // Send confirmation email
    await sendPasswordResetConfirmationEmail(
      resetToken.user.email,
      resetToken.user.name
    );

    console.log(`✅ Password reset successfully for: ${resetToken.user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Your password has been reset successfully. You can now log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred while resetting your password' },
      },
      { status: 500 }
    );
  }
}
