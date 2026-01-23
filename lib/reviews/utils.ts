import { prisma } from '@/lib/prisma';
import { sendArticleStatusUpdateEmail, sendReviewerAssignmentEmail } from "@/lib/email/send";


// Review status types
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'declined';
export type ReviewDecision = 'accept' | 'reject' | 'revision_requested';

// Get reviews assigned to a reviewer
export async function getReviewerAssignments(reviewerId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      reviewerId,
      status: {
        in: ['pending', 'in_progress', 'invited', 'accepted'],
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

  // Send confirmation email to reviewer
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { name: true, email: true }
  });

  if (reviewer?.email) {
    const articleDetails = await prisma.article.findUnique({
      where: { id: review.articleId },
      include: {
        journal: true,
        author: { select: { email: true, name: true } }
      }
    });

    if (articleDetails && articleDetails.journal) {
      // 1. Notify Reviewer (Confirmation)
      await import('@/lib/email/send').then(mod =>
        mod.sendReviewSubmissionConfirmationEmail(
          reviewer.email,
          reviewer.name,
          articleDetails.title,
          articleDetails.journal.fullName
        )
      ).catch(err => console.error('Failed to send review confirmation email:', err));

      // 2. Notify Author
      if (articleDetails.author && articleDetails.author.email) {
        await import('@/lib/email/send').then(mod =>
          mod.sendReviewFeedbackToAuthor(
            articleDetails.author.email,
            articleDetails.author.name || 'Author',
            articleDetails.title,
            articleDetails.journal.fullName,
            decision,
            commentsToAuthor
          )
        ).catch(err => console.error('Failed to send feedback to author:', err));
      }

      // 3. Notify Editors (Fetch all editors)
      try {
        const editors = await prisma.user.findMany({
          where: { role: { in: ['editor', 'admin', 'super_admin'] } },
          select: { email: true, name: true }
        });

        await Promise.all(editors.map(editor =>
          import('@/lib/email/send').then(mod =>
            mod.sendReviewFeedbackToEditor(
              editor.email,
              editor.name || 'Editor',
              reviewer.name || 'Reviewer',
              articleDetails.title,
              articleDetails.journal.fullName,
              decision,
              commentsToAuthor,
              commentsToEditor || ''
            )
          )
        ));
      } catch (err) {
        console.error('Failed to notify editors:', err);
      }
    }
  }

  return updatedReview;
}

// Assign reviewers to an article (editor function)
export async function assignReviewersToArticle(
  articleId: string,
  reviewerIds: string[],
  dueInDays: number = 21 // Default 3 weeks
) {
  if (reviewerIds.length === 0) {
    throw new Error('At least one reviewer must be assigned');
  }

  // Check if reviewers are valid
  const reviewers = await prisma.user.findMany({
    where: {
      id: { in: reviewerIds },
      role: 'reviewer',
    },
  });

  if (reviewers.length !== reviewerIds.length) {
    throw new Error('All assigned users must have reviewer role');
  }

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);

  // Get current reviewer count for correct numbering
  const currentReviewCount = await prisma.review.count({
    where: { articleId }
  });

  // Create review assignments
  const reviews = await Promise.all(
    reviewerIds.map((reviewerId, index) =>
      prisma.review.create({
        data: {
          articleId,
          reviewerId,
          reviewerNumber: currentReviewCount + index + 1,
          status: 'invited', // Changed from pending to invited
          dueDate,
        },
      })
    )
  );

  // Update article status to "under review"
  await prisma.article.update({
    where: { id: articleId },
    data: { status: 'under_review' }, // Ensure snake_case matches enum
  });

  // Send notification emails to reviewers
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { journal: true }
  });

  if (article && article.journal) {
    // Send emails in background (don't await to avoid blocking response)
    Promise.all(reviews.map(async (review) => {
      const reviewer = reviewers.find(r => r.id === review.reviewerId);
      if (reviewer && reviewer.email) {
        try {
          await sendReviewerAssignmentEmail(
            reviewer.email,
            reviewer.name,
            article.title,
            article.journal.fullName,
            dueDate,
            review.id
          );
        } catch (err) {
          console.error(`Failed to send email to reviewer ${reviewer.email}:`, err);
        }
      }
    })).catch(err => console.error('Error sending reviewer emails:', err));
  }

  return reviews;
}

// Check all reviews for an article and update article status
export async function checkAndUpdateArticleStatus(articleId: string) {
  // Get all reviews for this article
  const reviews = await prisma.review.findMany({
    where: { articleId },
  });

  const totalReviews = reviews.length;
  // Count active reviews (excluding declined)
  const activeReviews = reviews.filter(r => r.status !== 'declined');
  const completedReviews = reviews.filter((r) => r.status === 'completed');

  // Get article
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) return;

  // If all active reviews are completed, move to waiting_for_editor
  if (activeReviews.length > 0 && completedReviews.length === activeReviews.length) {
    if (article.status !== 'waiting_for_editor' && article.status !== 'published' && article.status !== 'rejected') {
      await prisma.article.update({
        where: { id: articleId },
        data: { status: 'waiting_for_editor' }
      });

      // Notify editor? (Optional, could add Notification creation here)
    }
  }
}

// Get article review status (for editor)
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
  const pending = reviews.filter((r) => ['pending', 'invited', 'accepted', 'in_progress'].includes(r.status)).length;

  return {
    reviews,
    summary: {
      total: reviews.length,
      completed,
      pending,
      allComplete: completed === reviews.length && reviews.length > 0,
    },
  };
}

// Start review (mark as in progress)
export async function startReview(reviewId: string, reviewerId: string) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      reviewerId,
      status: 'pending', // Allow starting from pending
    },
  });

  if (!review) {
    // Check if it's invited or accepted
    const reviewCheck = await prisma.review.findFirst({
      where: {
        id: reviewId,
        reviewerId,
      },
    });
    if (reviewCheck && ['invited', 'accepted'].includes(reviewCheck.status)) {
      return await prisma.review.update({
        where: { id: reviewId },
        data: { status: 'in_progress' },
      });
    }

    throw new Error('Review not found or already started');
  }

  return await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'in_progress' },
  });
}

// Auto-assign reviewers based on keywords and workload
export async function autoAssignReviewers(articleId: string, count: number = 3) {
  // 1. Fetch article details
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: {
        select: {
          id: true,
          university: true,
        },
      },
      reviews: true,
    },
  });

  if (!article) {
    throw new Error('Article not found');
  }

  // 2. Fetch all potential reviewers
  const allReviewers = await prisma.user.findMany({
    where: {
      role: 'reviewer',
      isActive: true, // Only active users
      id: { not: article.author.id }, // Exclude author
    },
    include: {
      reviews: {
        where: {
          status: { in: ['pending', 'in_progress', 'invited', 'accepted'] },
        },
      },
    },
  });

  // 3. Filter and Score Reviewers
  const eligibleReviewers = allReviewers.filter((reviewer) => {
    // Conflict of Interest: Same University
    if (
      reviewer.university &&
      article.author.university &&
      reviewer.university.trim().toLowerCase() === article.author.university.trim().toLowerCase()
    ) {
      return false;
    }

    // Workload Check: Max 5 active reviews (configurable?)
    if (reviewer.reviews.length >= 5) {
      return false;
    }

    // Exclude already assigned reviewers
    if (article.reviews.some((r) => r.reviewerId === reviewer.id)) {
      return false;
    }

    return true;
  });

  if (eligibleReviewers.length === 0) {
    throw new Error('No eligible reviewers found');
  }

  // Calculate Scores (Keyword matching)
  const scoredReviewers = eligibleReviewers.map((reviewer) => {
    let score = 0;
    const bio = (reviewer.bio || '').toLowerCase();

    // Keyword matching
    article.keywords.forEach((keyword) => {
      if (bio.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });

    // Bonus for lower workload (balance load)
    const workloadScore = (5 - reviewer.reviews.length) * 0.5;

    return {
      reviewer,
      score: score + workloadScore,
      keywordMatch: score,
    };
  });

  // Sort by score (descending)
  scoredReviewers.sort((a, b) => b.score - a.score);

  // Select top N needed
  const selectedReviewers = scoredReviewers.slice(0, count);

  if (selectedReviewers.length === 0) {
    throw new Error('Could not find suitable reviewers');
  }

  // 4. Assign Reviewers
  const reviewerIds = selectedReviewers.map((s) => s.reviewer.id);
  const assignments = await assignReviewersToArticle(articleId, reviewerIds);

  return {
    assignments,
    details: selectedReviewers.map(s => ({
      name: s.reviewer.name,
      score: s.score,
      workload: s.reviewer.reviews.length
    }))
  };
}
