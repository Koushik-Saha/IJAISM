"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";

interface Review {
    id: string;
    reviewer: { name: string } | null;
    decision: string;
    status: string;
    commentsToAuthor?: string | null;
    isSharedWithAuthor?: boolean;
    sharedFiles?: string[];
    reviewerFiles?: string[];
}

interface ReviewerFeedbackProps {
    articleId: string;
    originalTitle: string;
    reviews: Review[];
}

export default function ReviewerFeedback({ articleId, originalTitle, reviews }: ReviewerFeedbackProps) {
    // Filter to only completed reviews that have shared content
    const visibleReviews = reviews.filter(review => {
        if (review.status !== 'completed') return false;
        
        const hasSharedComments = review.isSharedWithAuthor && review.commentsToAuthor;
        const hasSharedFiles = review.sharedFiles && review.sharedFiles.length > 0;
        
        // Fallback for older reviews before phase 15
        if (!hasSharedComments && !hasSharedFiles) {
             if (!review.commentsToAuthor && (!review.reviewerFiles || review.reviewerFiles.length === 0)) return false;
             return false;
        }
        
        return true;
    });

    if (visibleReviews.length === 0) return null;

    return (
        <Card className="mb-6 bg-orange-50 border-orange-200">
            <h2 className="text-xl font-bold mb-4 text-orange-900">Editor Feedback</h2>
            <div className="space-y-4">
                {visibleReviews.map((review, index) => {
                    const hasSharedComments = review.isSharedWithAuthor && review.commentsToAuthor;
                    const hasSharedFiles = review.sharedFiles && review.sharedFiles.length > 0;

                    return (
                        <div key={review.id} className="bg-white p-4 rounded border border-orange-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2 border-b pb-2">
                                <span className="font-semibold text-gray-900">
                                    Reviewer {index + 1}
                                </span>
                            </div>
                            
                            {hasSharedComments && (
                                <div className="text-gray-800 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                    {review.commentsToAuthor}
                                </div>
                            )}

                            {hasSharedFiles && (
                                <div className="mt-3 p-3 rounded-lg border border-indigo-100 flex flex-col gap-2">
                                    <p className="text-xs font-semibold text-gray-700">Attachments for Author:</p>
                                    {review.sharedFiles!.map((fileUrl: string, fIdx: number) => {
                                        const fileName = fileUrl.split('/').pop() || `File ${fIdx + 1}`;
                                        return (
                                            <div key={fIdx} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded shadow-sm">
                                                <span className="text-xs text-gray-700 font-medium truncate max-w-[70%]">
                                                    {fileName.length > 30 ? fileName.substring(0, 15) + '...' + fileName.substring(fileName.length - 10) : fileName}
                                                </span>
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors">
                                                    View
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-orange-200">
                <p className="text-sm text-orange-800 mb-3">
                    Please address the feedback above and resubmit your article.
                </p>
                <Link
                    href={`/submit?resubmit=${articleId}`}
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Resubmit Article
                </Link>
            </div>
        </Card>
    );
}
