import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch featured announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        isFeatured: true,
        deletedAt: null,
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        excerpt: true,
        thumbnailUrl: true,
        publishedAt: true,
      },
    });

    // Fetch all journals
    const journals = await prisma.journal.findMany({
      where: { deletedAt: null },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        fullName: true,
        coverImageUrl: true,
      },
    });

    // Fetch latest published articles
    const articles = await prisma.article.findMany({
      where: {
        status: 'published',
        deletedAt: null,
      },
      take: 4,
      orderBy: { publicationDate: 'desc' },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        journal: {
          select: {
            code: true,
            fullName: true,
          },
        },
      },
    });

    // Format articles for display
    const formattedArticles = articles.map((article) => ({
      id: article.id,
      title: article.title,
      authors: article.author.name,
      abstract: article.abstract?.substring(0, 200) || '',
      journal: article.journal.code,
      journalName: article.journal.fullName,
    }));

    // Get statistics
    const stats = {
      journals: await prisma.journal.count({ where: { deletedAt: null } }),
      articles: await prisma.article.count({ where: { status: 'published', deletedAt: null } }),
      users: await prisma.user.count({ where: { deletedAt: null } }),
    };

    return NextResponse.json({
      success: true,
      announcements,
      journals,
      articles: formattedArticles,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching homepage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}
