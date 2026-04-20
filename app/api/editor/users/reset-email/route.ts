import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, ROLES } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email/send';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Only Mother Admin can trigger resets for others
    const requester = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, id: true }
    });

    if (!requester || requester.role !== ROLES.MOTHER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Only Executive Board Admins can trigger password resets.' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, isActive: true }
    });

    if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    if (!targetUser.isActive) return NextResponse.json({ error: 'Cannot reset password for deactivated users' }, { status: 400 });

    // Generate token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: targetUser.id, used: false },
      data: { used: true, usedAt: new Date() }
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        userId: targetUser.id,
        token: resetToken,
        expiresAt
      }
    });

    // Send email
    await sendPasswordResetEmail(targetUser.email, targetUser.name, resetToken);

    return NextResponse.json({ 
      success: true, 
      message: `Password reset instructions sent to ${targetUser.email}` 
    });

  } catch (error: any) {
    console.error('Admin password reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
