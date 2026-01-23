"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

interface Review {
  id: string;
  reviewerNumber: number;
  status: string;
  dueDate: string | null;
  assignedAt: string;
  decision: string | null;
  commentsToAuthor: string | null;
  commentsToEditor: string | null;
  article: {
    id: string;
    title: string;
    abstract: string;
    keywords: string[];
    articleType: string;
    submissionDate: string;
    pdfUrl: string | null;
    author: {
      name: string;
      email: string;
      university: string;
      affiliation: string | null;
    };
    journal: {
      fullName: string;
      code: string;
      issn: string | null;
    };
  };
}

export default function ReviewSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    decision: '',
    commentsToAuthor: '',
    commentsToEditor: '',
  });

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/dashboard/reviews');
          return;
        }

        const response = await fetch(`/api/reviews/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/login?redirect=/dashboard/reviews');
            return;
          }
          if (response.status === 404) {
            setError('Review not found or access denied');
            return;
          }
          throw new Error('Failed to fetch review');
        }

        const data = await response.json();
        setReview(data.review);

        // If already completed, populate form with previous data
        if (data.review.status === 'completed') {
          setFormData({
            decision: data.review.decision || '',
            commentsToAuthor: data.review.commentsToAuthor || '',
            commentsToEditor: data.review.commentsToEditor || '',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load review');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReview();
    }
  }, [id, router]);

  const handleStartReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReview((prev) => prev ? { ...prev, status: 'in_progress' } : null);
      }
    } catch (err) {
      console.error('Failed to start review:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.decision) {
      alert('Please select a decision');
      return;
    }

    // Validation based on decision
    if (formData.decision === 'revision_requested') {
      if (formData.commentsToAuthor.trim().length < 50) {
        alert('For revision requests, detailed comments to the author are required (min 50 chars).');
        return;
      }
      if (formData.commentsToEditor.trim().length === 0) {
        alert('For revision requests, please provide a summary/reason to the editor.');
        return;
      }
    } else if (['accept', 'reject'].includes(formData.decision)) {
      // Comments are optional for Accept/Reject, but if provided, should likely still be reasonable length?
      // User said "user did not have to comment it is optional".
      // So we skip the length check if empty, but maybe enforce it if not empty? 
      // For simplicity and user request compliance: totally optional.
    } else {
      // Fallback for strictness? User said "reviser must have to...". 
      // Let's stick to the prompt: optional for accept/reject.
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      router.push('/dashboard/reviews');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-sm text-red-700">{error || 'Review not found'}</p>
          </div>
          <div className="mt-6">
            <Link href="/dashboard/reviews" className="text-primary hover:text-primary/80 font-semibold">
              ← Back to Reviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = review.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard/reviews" className="text-primary hover:text-primary/80 font-semibold flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reviews
          </Link>
        </div>

        {/* Article Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary mb-2">{review.article.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Review #{review.reviewerNumber}</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  review.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                  {review.status === 'in_progress' ? 'In Progress' : review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Journal: <span className="font-medium text-gray-900">{review.article.journal.fullName}</span></p>
              <p className="text-sm text-gray-600">Type: <span className="font-medium text-gray-900 capitalize">{review.article.articleType}</span></p>
              <p className="text-sm text-gray-600">Author: <span className="font-medium text-gray-900">{review.article.author.name}</span></p>
              <p className="text-sm text-gray-600">Institution: <span className="font-medium text-gray-900">{review.article.author.university}</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted: <span className="font-medium text-gray-900">
                {new Date(review.article.submissionDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span></p>
              <p className="text-sm text-gray-600">Due Date: <span className="font-medium text-gray-900">
                {review.dueDate ? new Date(review.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'N/A'}
              </span></p>
            </div>
          </div>

          {review.status === 'pending' && (
            <button
              onClick={handleStartReview}
              className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              Start Review
            </button>
          )}
        </div>

        {/* Abstract */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Abstract</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.article.abstract}</p>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {review.article.keywords.map((keyword, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Manuscript */}
        {review.article.pdfUrl && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-primary mb-4">Manuscript</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="ml-4">
                  <p className="text-sm font-bold text-gray-900">Full Manuscript PDF</p>
                  <p className="text-xs text-gray-600">Click to download or view</p>
                </div>
              </div>
              <a
                href={review.article.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                View PDF
              </a>
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            {isCompleted ? 'Your Review' : 'Submit Review'}
          </h2>

          {isCompleted && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-sm text-green-700 font-semibold">
                ✓ Review completed and submitted
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Decision */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Decision *</label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="accept"
                    checked={formData.decision === 'accept'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-green-700">Accept</p>
                    <p className="text-sm text-gray-600">Article meets all criteria for publication</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="revision_requested"
                    checked={formData.decision === 'revision_requested'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-yellow-700">Request Revision</p>
                    <p className="text-sm text-gray-600">Article has potential but requires changes</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="reject"
                    checked={formData.decision === 'reject'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-red-700">Reject</p>
                    <p className="text-sm text-gray-600">Article does not meet publication standards</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Comments to Author */}
            <div>
              <label htmlFor="commentsToAuthor" className="block text-sm font-bold text-gray-700 mb-2">
                Comments to Author {formData.decision === 'revision_requested' ? '* (Minimum 50 characters)' : '(Optional)'}
              </label>
              <textarea
                id="commentsToAuthor"
                rows={8}
                value={formData.commentsToAuthor}
                onChange={(e) => setFormData({ ...formData, commentsToAuthor: e.target.value })}
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder="Provide detailed feedback for the author on the strengths and weaknesses of the manuscript..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.commentsToAuthor.length} characters
                {formData.commentsToAuthor.length < 50 && ` (${50 - formData.commentsToAuthor.length} more required)`}
              </p>
            </div>

            {/* Comments to Editor (Optional) */}
            <div>
              <label htmlFor="commentsToEditor" className="block text-sm font-bold text-gray-700 mb-2">
                Confidential Comments to Editor {formData.decision === 'revision_requested' ? '*' : '(Optional)'}
              </label>
              <textarea
                id="commentsToEditor"
                rows={4}
                value={formData.commentsToEditor}
                onChange={(e) => setFormData({ ...formData, commentsToEditor: e.target.value })}
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder="Add any confidential comments for the editor (not shared with the author)..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            {!isCompleted && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
