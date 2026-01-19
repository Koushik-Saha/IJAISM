import { prisma } from '@/lib/prisma';
import {sendArticleStatusUpdateEmail} from "@/lib/email/send";


// Review status types
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'declined';
export type ReviewDecision = 'accept' | 'reject' | 'revision_requested';

// Get reviews assigned to a reviewer
export async function getReviewerAssignments(reviewerId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      reviewerId,
      status: {
        in: ['pending', 'in_progress'],
      },
    },
    include: {
      article: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
            },
          },
          journal: {
            select: {
              id: true,
              fullName: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  return reviews;
}

// Get completed reviews for a reviewer
export async function getCompletedReviews(reviewerId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      reviewerId,
      status: 'completed',
    },
    include: {
      article: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              university: true,
            },
          },
          journal: {
            select: {
              fullName: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
    take: 20, // Limit to recent 20
  });

  return reviews;
}

// Get single review by ID
export async function getReviewById(reviewId: string, reviewerId: string) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      reviewerId, // Security: ensure reviewer owns this review
    },
    include: {
      article: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              affiliation: true,
            },
          },
          journal: {
            select: {
              id: true,
              fullName: true,
              code: true,
              issn: true,
            },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return review;
}

// Submit review decision
export async function submitReviewDecision(
  reviewId: string,
  reviewerId: string,
  decision: ReviewDecision,
  commentsToAuthor: string,
  commentsToEditor?: string
) {
  // Verify reviewer owns this review
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      reviewerId,
    },
    include: {
      article: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!review) {
    throw new Error('Review not found or access denied');
  }

  if (review.status === 'completed') {
    throw new Error('Review already submitted');
  }

  // Update review with decision
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: 'completed',
      decision,
      commentsToAuthor,
      commentsToEditor: commentsToEditor || null,
      submittedAt: new Date(),
    },
  });

  // Check if all reviews are complete and determine article status
  await checkAndUpdateArticleStatus(review.articleId);

  return updatedReview;
}

// Check all reviews for an article and update article status
export async function checkAndUpdateArticleStatus(articleId: string) {
  // Get all reviews for this article
  const reviews = await prisma.review.findMany({
    where: { articleId },
  });

  const totalReviews = reviews.length;
  const completedReviews = reviews.filter((r) => r.status === 'completed');
  const acceptedReviews = completedReviews.filter((r) => r.decision === 'accept');
  const rejectedReviews = completedReviews.filter((r) => r.decision === 'reject');
  const revisionRequests = completedReviews.filter((r) => r.decision === 'revision_requested');

  // Get article with author info
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!article) return;

  let newStatus = article.status;
  let statusMessage = '';

  // Decision logic for 4-reviewer system
  if (totalReviews === 4 && completedReviews.length === 4) {
    // All 4 reviews completed
    if (acceptedReviews.length === 4) {
      // All 4 accepted - AUTO PUBLISH!
      newStatus = 'published';
      statusMessage = 'Congratulations! All reviewers accepted your article. It has been automatically published.';

      // Update publication date
      await prisma.article.update({
        where: { id: articleId },
        data: {
          status: newStatus,
          publicationDate: new Date(),
        },
      });
    } else if (rejectedReviews.length >= 2) {
      // 2 or more rejected - reject article
      newStatus = 'rejected';
      statusMessage = 'Your article has been rejected after peer review. You may revise and resubmit to a different journal.';

      await prisma.article.update({
        where: { id: articleId },
        data: { status: newStatus },
      });
    } else if (revisionRequests.length > 0) {
      // At least one revision requested
      newStatus = 'revision_requested';
      statusMessage = 'Reviewers have requested revisions to your article. Please review their comments and resubmit.';

      await prisma.article.update({
        where: { id: articleId },
        data: { status: newStatus },
      });
    } else if (acceptedReviews.length >= 2 && rejectedReviews.length === 0) {
      // Mixed reviews but more accepts than rejects - request revision
      newStatus = 'revision_requested';
      statusMessage = 'Your article shows promise but requires minor revisions based on reviewer feedback.';

      await prisma.article.update({
        where: { id: articleId },
        data: { status: newStatus },
      });
    }
  } else if (completedReviews.length > 0 && completedReviews.length < 4) {
    // Partial reviews completed - update to "under review"
    if (article.status === 'submitted') {
      newStatus = 'under review';
      statusMessage = `Your article is under review. ${completedReviews.length} of 4 reviewers have completed their assessment.`;

      await prisma.article.update({
        where: { id: articleId },
        data: { status: newStatus },
      });
    }
  }

  // Send email notification if status changed
  if (newStatus !== article.status && statusMessage) {
    await sendArticleStatusUpdateEmail(
      article.author.email,
      article.author.name || article.author.email.split('@')[0],
      article.title,
      article.status,
      newStatus,
      articleId,
      statusMessage
    ).catch((error) => {
      console.error('Failed to send status update email:', error);
    });
  }

  return {
    newStatus,
    totalReviews,
    completedReviews: completedReviews.length,
    accepted: acceptedReviews.length,
    rejected: rejectedReviews.length,
    revisionRequested: revisionRequests.length,
  };
}

// Assign reviewers to an article (admin function)
export async function assignReviewersToArticle(
  articleId: string,
  reviewerIds: string[],
  dueInDays: number = 21 // Default 3 weeks
) {
  if (reviewerIds.length !== 4) {
    throw new Error('Must assign exactly 4 reviewers');
  }

  // Check if reviewers are valid
  const reviewers = await prisma.user.findMany({
    where: {
      id: { in: reviewerIds },
      role: 'reviewer',
    },
  });

  if (reviewers.length !== 4) {
    throw new Error('All assigned users must have reviewer role');
  }

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);

  // Create review assignments
  const reviews = await Promise.all(
    reviewerIds.map((reviewerId, index) =>
      prisma.review.create({
        data: {
          articleId,
          reviewerId,
          reviewerNumber: index + 1,
          status: 'pending',
          dueDate,
        },
      })
    )
  );

  // Update article status to "under review"
  await prisma.article.update({
    where: { id: articleId },
    data: { status: 'under review' },
  });

  return reviews;
}

// Get article review status (for admin)
export async function getArticleReviewStatus(articleId: string) {
  const reviews = await prisma.review.findMany({
    where: { articleId },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      reviewerNumber: 'asc',
    },
  });

  const completed = reviews.filter((r) => r.status === 'completed').length;
  const pending = reviews.filter((r) => r.status === 'pending').length;
  const inProgress = reviews.filter((r) => r.status === 'in_progress').length;

  return {
    reviews,
    summary: {
      total: reviews.length,
      completed,
      pending,
      inProgress,
      allComplete: completed === 4,
    },
  };
}

// Start review (mark as in progress)
export async function startReview(reviewId: string, reviewerId: string) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      reviewerId,
      status: 'pending',
    },
  });

  if (!review) {
    throw new Error('Review not found or already started');
  }

  return await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'in_progress' },
  });
}
