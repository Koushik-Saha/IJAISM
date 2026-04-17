import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { blogId, name, email, website, content, rating, saveInfo } = json;

    if (!blogId || !name || !email || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert comment with 'pending' status by default to prevent spam injection
    const comment = await prisma.comment.create({
      data: {
        blogId,
        name,
        email,
        website,
        content,
        rating: rating || null,
        saveInfo: saveInfo || false,
        status: 'pending', 
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to submit comment' },
      { status: 500 }
    );
  }
}
