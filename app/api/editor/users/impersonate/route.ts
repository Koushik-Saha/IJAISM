import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, ROLES, generateToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return apiError('Unauthorized', 401);
    }

    // Check database to ensure requester is mother_admin
    const requester = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, isActive: true },
    });

    if (!requester || requester.role !== ROLES.MOTHER_ADMIN) {
      return apiError('Forbidden: Only Executive Board Admins can impersonate users.', 403);
    }

    if (!requester.isActive) {
      return apiError('Account deactivated', 403);
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return apiError('userId is required', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        university: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        forcePasswordChange: true,
        deletedAt: true,
      },
    });

    if (!targetUser || targetUser.deletedAt) {
      return apiError('Target user not found', 404);
    }

    if (!targetUser.isActive) {
      return apiError('Target user is deactivated', 400);
    }

    // Generate token for target user
    const accessToken = generateToken({
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      forcePasswordChange: targetUser.forcePasswordChange,
    });

    return apiSuccess(
      {
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          university: targetUser.university,
          role: targetUser.role,
          isEmailVerified: targetUser.isEmailVerified,
        },
        accessToken,
      },
      'Impersonation successful'
    );
  } catch (error: any) {
    console.error('Error in impersonation route:', error);
    return apiError('Failed to impersonate user', 500);
  }
}
