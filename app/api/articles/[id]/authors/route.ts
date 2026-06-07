import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized - No token provided', 401, undefined, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return apiError('Unauthorized - Invalid token', 401, undefined, 'INVALID_TOKEN');
    }

    const userId = decoded.userId;
    const userRole = decoded.role;

    // 2. Fetch the article
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        status: true,
        title: true,
        doi: true,
      },
    });

    if (!article) {
      return apiError('Article not found', 404, undefined, 'ARTICLE_NOT_FOUND');
    }

    // 3. Check access permissions
    const isEditor = ['editor', 'super_admin', 'mother_admin'].includes(userRole);
    const isOwner = article.authorId === userId;

    if (!isOwner && !isEditor) {
      return apiError('Forbidden - You do not have access to this article', 403, undefined, 'FORBIDDEN');
    }

    // 4. Validate article status and DOI assignment
    // mother_admin: always allowed
    // super_admin: blocked once any DOI is assigned
    // others (owner): blocked only after published + DOI
    if (userRole === 'super_admin' && article.doi) {
      return apiError('Forbidden - A DOI has been assigned. Only Mother Admin can edit author details at this stage.', 403, undefined, 'EDIT_LOCKED');
    }
    if (!['mother_admin', 'super_admin'].includes(userRole) && article.status === 'published' && article.doi) {
      return apiError('Forbidden - Cannot edit author details of a published article with a DOI assigned', 403, undefined, 'EDIT_LOCKED');
    }

    // 5. Parse and validate body
    const body = await req.json();
    const { authors } = body;

    if (!Array.isArray(authors) || authors.length === 0) {
      return apiError('Invalid authors list - at least one author is required', 400, undefined, 'VALIDATION_ERROR');
    }

    // Validate entries and count corresponding authors
    let correspondingCount = 0;
    let mainCount = 0;
    for (let i = 0; i < authors.length; i++) {
      const author = authors[i];
      if (!author.name || !author.name.trim()) {
        return apiError(`Author name is required for position ${i + 1}`, 400, undefined, 'VALIDATION_ERROR');
      }
      if (!author.university || !author.university.trim()) {
        return apiError(`Author affiliation/university is required for ${author.name}`, 400, undefined, 'VALIDATION_ERROR');
      }
      if (author.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author.email.trim())) {
        return apiError(`Invalid email address for ${author.name}`, 400, undefined, 'VALIDATION_ERROR');
      }
      if (author.isCorresponding) {
        correspondingCount++;
      }
      if (author.isMain) {
        mainCount++;
      }
    }

    if (correspondingCount !== 1) {
      return apiError('Exactly one author must be designated as the Corresponding Author', 400, undefined, 'VALIDATION_ERROR');
    }

    // 6. Delete existing co-authors and insert the new list
    await prisma.$transaction(async (tx) => {
      // Delete existing
      await tx.coAuthor.deleteMany({
        where: { articleId: id },
      });

      // Insert new ones, looking up userId by email if available
      for (let index = 0; index < authors.length; index++) {
        const author = authors[index];
        const email = author.email?.trim() || null;

        let matchedUserId: string | null = null;
        if (email) {
          const userRecord = await tx.user.findUnique({
            where: { email },
            select: { id: true },
          });
          if (userRecord) {
            matchedUserId = userRecord.id;
          }
        }

        await tx.coAuthor.create({
          data: {
            articleId: id,
            name: author.name.trim(),
            email: email,
            university: author.university.trim(),
            order: index + 1,
            isMain: author.isMain || false,
            isCorresponding: author.isCorresponding || false,
            userId: matchedUserId,
          },
        });
      }

      // Record activity
      await tx.activityLog.create({
        data: {
          articleId: id,
          userId: userId,
          action: 'AUTHORS_UPDATED',
          details: `Author list and ordering updated by ${isEditor ? 'Editor' : 'Author'}`,
        },
      });
    });

    logger.info('Article authors updated successfully', { articleId: id, userId });

    return apiSuccess({ message: 'Authors updated successfully' }, 'Authors updated successfully');
  } catch (error: any) {
    logger.error('Error updating article authors', error, {
      path: '/api/articles/[id]/authors',
    });

    return apiError('Internal server error. Please try again later.', 500, process.env.NODE_ENV === 'development' ? { message: error.message } : undefined);
  }
}
