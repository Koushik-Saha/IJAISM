import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getMembershipStatus } from '@/lib/membership';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. Get comprehensive membership status
    const status = await getMembershipStatus(userId);

    // 3. Return status
    return NextResponse.json(
      {
        success: true,
        status,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching membership status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch membership status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
