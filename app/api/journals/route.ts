import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const journals = await prisma.journal.findMany({
      where: { deletedAt: null },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        fullName: true,
        description: true,
        issn: true,
        impactFactor: true,
        coverImageUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      journals,
    });
  } catch (error: any) {
    console.error('Error fetching journals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journals' },
      { status: 500 }
    );
  }
}
