import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, ROLES, hashPassword } from '@/lib/auth';

// Helper: Check if Creator can create Target Role
function canCreateRole(creatorRole: string, targetRole: string): boolean {
  if (creatorRole === ROLES.MOTHER_ADMIN) return true; // Can create anything
  if (creatorRole === ROLES.SUPER_ADMIN) return targetRole !== ROLES.MOTHER_ADMIN && targetRole !== ROLES.SUPER_ADMIN; // Can't create peers/bosses
  if (creatorRole === ROLES.EDITOR) return targetRole === ROLES.SUB_EDITOR; // Can only create Sub-Editors
  if (creatorRole === ROLES.REVIEWER) return targetRole === ROLES.AUTHOR; // Reviewer can only create Authors
  return false;
}

export async function GET(req: NextRequest) {
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

    // Identify requester
    const requester = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, id: true },
    });

    if (!requester || ![ROLES.MOTHER_ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR].includes(requester.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get params
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build Scope (Who can see whom)
    const where: any = { deletedAt: null };

    // EDITOR restrict: Can only see their own Sub-Editors
    if (requester.role === ROLES.EDITOR) {
      where.managedById = requester.id;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute Query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          managedBy: { select: { name: true, email: true } }, // Show manager
          _count: { select: { articles: true, reviews: true } }
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// Create New User (Super Admin / Sub Editor)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(authHeader.split(' ')[1]);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const requester = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Reviewers can now create users (e.g. inviting authors?)
    if (![ROLES.MOTHER_ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR, ROLES.REVIEWER].includes(requester.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, university } = body;

    // Validate Permission
    if (!canCreateRole(requester.role, role)) {
      return NextResponse.json(
        { error: `Permission Denied: ${requester.role} cannot create ${role}` },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Create user with isEmailVerified: false
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        university: university || 'N/A',
        isActive: true,
        isEmailVerified: false, // Require verification
        managedById: requester.id, // Track who created them
      }
    });

    // Generate Verification Token
    const crypto = await import('crypto'); // Dynamic import or top-level. I'll use top level in next step if this fails, but usually fine here. Actually better to use require or import at top. I will add imports at top first.
    const verificationToken = crypto.default.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        userId: newUser.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send Verification Email
    const { sendEmailVerificationEmail } = await import('@/lib/email/send');
    sendEmailVerificationEmail(newUser.email, newUser.name, verificationToken).catch(error => {
      console.error('Failed to send verification email:', error);
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: "User created. Verification email sent."
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(authHeader.split(' ')[1]);

    // Using loose type check for requester access
    const requester = await prisma.user.findUnique({ where: { id: decoded?.userId } });
    if (!requester || ![ROLES.MOTHER_ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR].includes(requester.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, isActive } = body;

    // Target User Check
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Hierarchy Check for Modification
    if (requester.role === ROLES.EDITOR) {
      // Editor can only modify their own sub-editors
      if (targetUser.managedById !== requester.id) {
        return NextResponse.json({ error: 'You can only modify your own sub-editors' }, { status: 403 });
      }
    }

    if (requester.role === ROLES.SUPER_ADMIN) {
      // Super Admin cannot modify Mother Admin
      if (targetUser.role === ROLES.MOTHER_ADMIN) {
        return NextResponse.json({ error: 'Cannot modify Mother Admin' }, { status: 403 });
      }
      // NEW: Super Admin cannot modify other Super Admins
      if (targetUser.role === ROLES.SUPER_ADMIN && targetUser.id !== requester.id) {
        return NextResponse.json({ error: 'Cannot modify other Super Admins' }, { status: 403 });
      }
    }

    // NEW: Prevent changing own role (Self-Demotion/Promotion Protection)
    if (targetUser.id === requester.id && role !== undefined && role !== requester.role) {
      return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 });
    }

    const updateData: any = {};
    if (role !== undefined) {
      // Prevent escalation
      if (!canCreateRole(requester.role, role)) {
        return NextResponse.json({ error: 'Cannot promote to this role' }, { status: 403 });
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
