import { prisma } from './prisma';

/**
 * IJAISM 4-Reviewer Auto-Publish System
 *
 * When a paper is submitted:
 * 1. It's assigned to 4 reviewers
 * 2. Each reviewer provides accept/reject decision
 * 3. If all 4 reviewers accept, the paper is automatically published
 * 4. If any reviewer rejects, the paper is rejected
 */

export async function checkAndAutoPublish(articleId: string) {
  try {
    // Get all reviews for this article
    const reviews = await prisma.review.findMany({
      where: {
        articleId,
        status: 'completed',
      },
    });

    // Check if we have exactly 4 completed reviews
    if (reviews.length !== 4) {
      console.log(`Article ${articleId}: Only ${reviews.length}/4 reviews completed`);
      return { published: false, reason: 'Not all reviews completed' };
    }

    // Check if all 4 reviewers accepted
    const acceptedCount = reviews.filter((r: any) => r.decision === 'accept').length;
    const rejectedCount = reviews.filter((r: any) => r.decision === 'reject').length;

    if (acceptedCount === 4) {
      // All 4 reviewers accepted - AUTO-PUBLISH!
      const article = await prisma.article.update({
        where: { id: articleId },
        data: {
          status: 'published',
          acceptanceDate: new Date(),
          publicationDate: new Date(),
        },
        include: {
          author: true,
          journal: true,
        },
      });

      // Create notification for author
      await prisma.notification.create({
        data: {
          userId: article.authorId,
          type: 'article_published',
          title: 'Your Article Has Been Published!',
          message: `Congratulations! Your article "${article.title}" has been accepted by all 4 reviewers and is now published.`,
          link: `/articles/${article.id}`,
        },
      });

      console.log(`✅ AUTO-PUBLISHED: Article ${articleId} - All 4 reviewers accepted`);

      return {
        published: true,
        reason: 'All 4 reviewers accepted',
        article,
      };
    } else if (rejectedCount > 0) {
      // At least one reviewer rejected - REJECT ARTICLE
      const article = await prisma.article.update({
        where: { id: articleId },
        data: {
          status: 'rejected',
        },
        include: {
          author: true,
        },
      });

      // Create notification for author
      await prisma.notification.create({
        data: {
          userId: article.authorId,
          type: 'article_rejected',
          title: 'Article Review Decision',
          message: `Your article "${article.title}" was not accepted. ${rejectedCount} reviewer(s) recommended rejection.`,
          link: `/dashboard/submissions/${article.id}`,
        },
      });

      console.log(`❌ REJECTED: Article ${articleId} - ${rejectedCount} reviewer(s) rejected`);

      return {
        published: false,
        reason: `${rejectedCount} reviewer(s) rejected`,
        article,
      };
    }

    return {
      published: false,
      reason: 'Mixed reviews - awaiting decision',
    };
  } catch (error) {
    console.error('Error in auto-publish system:', error);
    throw error;
  }
}

export async function assignReviewers(articleId: string, reviewerIds: string[]) {
  if (reviewerIds.length !== 4) {
    throw new Error('Exactly 4 reviewers must be assigned');
  }

  try {
    // Create review assignments for all 4 reviewers
    const reviews = await Promise.all(
      reviewerIds.map((reviewerId, index) =>
        prisma.review.create({
          data: {
            articleId,
            reviewerId,
            reviewerNumber: index + 1, // 1, 2, 3, 4
            status: 'pending',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          },
        })
      )
    );

    // Update article status
    await prisma.article.update({
      where: { id: articleId },
      data: { status: 'under_review' },
    });

    console.log(`Assigned 4 reviewers to article ${articleId}`);

    return reviews;
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    throw error;
  }
}

export async function submitReviewDecision(
  reviewId: string,
  decision: 'accept' | 'reject',
  commentsToAuthor?: string,
  commentsToEditor?: string
) {
  try {
    // Update the review with the decision
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        decision,
        status: 'completed',
        commentsToAuthor,
        commentsToEditor,
        submittedAt: new Date(),
      },
      include: {
        article: true,
      },
    });

    console.log(`Review ${reviewId} submitted: ${decision}`);

    // Check if this triggers auto-publish
    const result = await checkAndAutoPublish(review.articleId);

    return {
      review,
      autoPublishResult: result,
    };
  } catch (error) {
    console.error('Error submitting review decision:', error);
    throw error;
  }
}
