
import {
    startReview,
    submitReviewDecision,
    assignReviewersToArticle,
    getReviewById
} from '@/lib/reviews/utils';
import { prisma } from '@/lib/prisma';
import {
    sendReviewSubmissionConfirmationEmail,
    sendReviewFeedbackToAuthor,
    sendReviewFeedbackToEditor
} from '@/lib/email/send';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        review: {
            findFirst: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        article: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

jest.mock('@/lib/email/send', () => ({
    sendReviewerAssignmentEmail: jest.fn().mockResolvedValue(true),
    sendReviewSubmissionConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendReviewFeedbackToAuthor: jest.fn().mockResolvedValue(true),
    sendReviewFeedbackToEditor: jest.fn().mockResolvedValue(true),
    sendArticleStatusUpdateEmail: jest.fn().mockResolvedValue(true),
}));

describe('Review Utilities Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('startReview', () => {
        it('should update status to in_progress if review is pending', async () => {
            (prisma.review.findFirst as jest.Mock).mockResolvedValue({
                id: 'review-1',
                status: 'pending',
            });
            (prisma.review.update as jest.Mock).mockResolvedValue({
                id: 'review-1',
                status: 'in_progress',
            });

            const result = await startReview('review-1', 'reviewer-1');

            expect(prisma.review.update).toHaveBeenCalledWith({
                where: { id: 'review-1' },
                data: { status: 'in_progress' },
            });
            expect(result.status).toBe('in_progress');
        });

        it('should update status to in_progress if review is invited', async () => {
            // First findFirst fails (pending check)
            (prisma.review.findFirst as jest.Mock)
                .mockResolvedValueOnce(null)
                // Second findFirst succeeds (invited check)
                .mockResolvedValueOnce({
                    id: 'review-1',
                    status: 'invited',
                });

            (prisma.review.update as jest.Mock).mockResolvedValue({
                id: 'review-1',
                status: 'in_progress',
            });

            const result = await startReview('review-1', 'reviewer-1');

            expect(prisma.review.update).toHaveBeenCalled();
        });

        it('should throw error if review not found or already started (and not invited)', async () => {
            (prisma.review.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(startReview('review-1', 'reviewer-1'))
                .rejects.toThrow('Review not found or already started');
        });
    });

    describe('submitReviewDecision', () => {
        const mockReviewData = {
            id: 'review-1',
            articleId: 'article-1',
            reviewerId: 'reviewer-1',
            status: 'in_progress',
        };

        const mockArticleData = {
            id: 'article-1',
            title: 'Test Article',
            journal: { fullName: 'Test Journal' },
            author: { email: 'author@test.com', name: 'Author Name' },
        };

        const mockReviewerData = {
            id: 'reviewer-1',
            name: 'Reviewer Name',
            email: 'reviewer@test.com',
        };

        beforeEach(() => {
            (prisma.review.findFirst as jest.Mock).mockResolvedValue(mockReviewData);
            (prisma.review.update as jest.Mock).mockResolvedValue({ ...mockReviewData, status: 'completed' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockReviewerData);
            (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticleData);
            // Editors
            (prisma.user.findMany as jest.Mock).mockResolvedValue([{ email: 'editor@test.com', name: 'Editor' }]);
            // Review siblings for status check
            (prisma.review.findMany as jest.Mock).mockResolvedValue([]);
        });

        it('should submit decision and send emails', async () => {
            await submitReviewDecision(
                'review-1',
                'reviewer-1',
                'accept',
                'Good work',
                'No issues'
            );

            // 1. Update DB
            expect(prisma.review.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'review-1' },
                data: expect.objectContaining({
                    decision: 'accept',
                    status: 'completed',
                }),
            }));

            // 2. Email Reviewer
            expect(sendReviewSubmissionConfirmationEmail).toHaveBeenCalledWith(
                'reviewer@test.com',
                'Reviewer Name',
                'Test Article',
                'Test Journal'
            );

            // 3. Email Author
            expect(sendReviewFeedbackToAuthor).toHaveBeenCalledWith(
                'author@test.com',
                'Author Name',
                'Test Article',
                'Test Journal',
                'accept',
                'Good work'
            );
        });

        it('should throw error if review is already completed', async () => {
            (prisma.review.findFirst as jest.Mock).mockResolvedValue({
                ...mockReviewData,
                status: 'completed',
            });

            await expect(submitReviewDecision('review-1', 'reviewer-1', 'reject', ''))
                .rejects.toThrow('Review already submitted');
        });
    });
});
