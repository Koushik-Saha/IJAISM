import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    // Validation
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Token is required' },
        },
        { status: 400 }
      );
    }

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        expiresAt: true,
        used: true,
        user: {
          select: {
            email: true,
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
          valid: false,
          error: { message: 'Invalid reset token' },
        },
        { status: 200 } // Return 200 with valid: false instead of 400
      );
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: { message: 'This reset link has already been used' },
        },
        { status: 200 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: { message: 'This reset link has expired' },
        },
        { status: 200 }
      );
    }

    // Check if user account is active
    if (!resetToken.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: { message: 'This account has been deactivated' },
        },
        { status: 200 }
      );
    }

    // Token is valid
    return NextResponse.json(
      {
        success: true,
        valid: true,
        data: {
          email: resetToken.user.email,
          expiresAt: resetToken.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: { message: 'An error occurred while verifying the token' },
      },
      { status: 500 }
    );
  }
}
