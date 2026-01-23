"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";

interface Review {
    id: string;
    reviewer: { name: string } | null;
    decision: string;
    commentsToAuthor?: string | null;
}

interface ReviewerFeedbackProps {
    articleId: string;
    originalTitle: string;
    reviews: Review[];
}

export default function ReviewerFeedback({ articleId, originalTitle, reviews }: ReviewerFeedbackProps) {
    if (reviews.length === 0) return null;

    return (
        <Card className="mb-6 bg-orange-50 border-orange-200">
            <h2 className="text-xl font-bold mb-4 text-orange-900">Reviewer Feedback</h2>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-4 rounded border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                                {review.reviewer?.name || "Anonymous Reviewer"}
                            </span>
                            <span
                                className={`text-xs px-2 py-1 rounded font-medium ${review.decision === "accept"
                                        ? "bg-green-100 text-green-700"
                                        : review.decision === "reject"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                    }`}
                            >
                                {review.decision ? review.decision.replace("_", " ").toUpperCase() : "PENDING"}
                            </span>
                        </div>
                        {review.commentsToAuthor && (
                            <div className="text-gray-800 text-sm whitespace-pre-wrap">
                                {review.commentsToAuthor}
                            </div>
                        )}
                    </div>
                ))}
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
