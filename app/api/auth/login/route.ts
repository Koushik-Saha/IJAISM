import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Email and password are required' },
        },
        { status: 400 }
      );
    }

    // Find user
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
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid email or password' },
        },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Your account has been deactivated' },
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid email or password' },
        },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data and token
    return NextResponse.json(
      {
        success: true,
        data: {
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
        message: user.isEmailVerified
          ? 'Login successful'
          : 'Login successful. Please verify your email address to access all features.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred during login' },
      },
      { status: 500 }
    );
  }
}
