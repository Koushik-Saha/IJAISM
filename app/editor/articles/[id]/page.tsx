"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  status: string;
  author: {
    name: string;
    email: string;
    university: string;
  };
  journal: {
    fullName: string;
    code: string;
  };
  reviews: Array<{
    id: string;
    reviewerNumber: number;
    status: string;
    reviewer: {
      name: string;
      email: string;
    };
    decision?: string;
    commentsToAuthor?: string;
    commentsToEditor?: string;
  }>;
}

export default function AdminArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'publish' | 'reject' | 'revise' | null>(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
      fetchReviewers();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles?id=${id}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      if (!response.ok) throw new Error('Failed to fetch article');
      const data = await response.json();
      setArticle(data.article);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/editor/reviewers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch reviewers');
      const data = await response.json();
      setReviewers(data.reviewers || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/auto-assign-reviewers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to auto-assign reviewers');
      }

      toast.success('Auto-assignment successful!', {
        description: data.message,
        duration: 4000,
      });
      fetchArticle(); // Refresh article data
    } catch (err: any) {
      toast.error('Auto-assignment failed', {
        description: err.message || 'Failed to auto-assign reviewers',
        duration: 4000,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignReviewers = async () => {
    const currentReviewerCount = article?.reviews?.length || 0;
    const totalAfterAssignment = currentReviewerCount + selectedReviewers.length;

    if (selectedReviewers.length === 0) {
      toast.error('Invalid selection', {
        description: 'Please select at least 1 reviewer',
        duration: 3000,
      });
      return;
    }

    if (totalAfterAssignment > 4) {
      toast.error('Too many reviewers', {
        description: `You can only assign ${4 - currentReviewerCount} more reviewer(s)`,
        duration: 3000,
      });
      return;
    }

    setIsAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/assign-reviewers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewerIds: selectedReviewers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign reviewers');
      }

      const assignedCount = selectedReviewers.length;
      toast.success('Reviewers assigned successfully!', {
        description: `${assignedCount} reviewer(s) have been assigned to this article.`,
        duration: 4000,
      });
      fetchArticle(); // Refresh article data
      setSelectedReviewers([]);
    } catch (err: any) {
      toast.error('Assignment failed', {
        description: err.message || 'Failed to assign reviewers',
        duration: 4000,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const openDecisionModal = (type: 'publish' | 'reject' | 'revise') => {
    setDecisionType(type);
    setDecisionComments('');
    setShowDecisionModal(true);
  };

  const submitDecision = async () => {
    if (!decisionType) return;

    setIsSubmittingDecision(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: decisionType,
          comments: decisionComments
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit decision');
      }

      toast.success(`Decision submitted: ${decisionType}`, {
        description: data.message,
        duration: 4000,
      });

      setShowDecisionModal(false);
      fetchArticle(); // Refresh

    } catch (error: any) {
      toast.error('Decision failed', {
        description: error.message,
        duration: 4000
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-red-600">Article not found</p>
          <Link href="/editor/articles" className="text-primary">← Back to Articles</Link>
        </div>
      </div>
    );
  }

  const hasReviewers = article.reviews && article.reviews.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/editor/articles" className="text-primary hover:text-primary/80 font-semibold mb-4 inline-block">
            ← Back to Articles
          </Link>
          <h1 className="text-3xl font-bold text-primary">{article.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Details & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Article Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Journal</p>
                  <p className="font-semibold">{article.journal.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Author</p>
                  <p className="font-semibold">{article.author.name}</p>
                  <p className="text-sm text-gray-600">{article.author.email}</p>
                  <p className="text-sm text-gray-600">{article.author.university}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' :
                    article.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      article.status === 'resubmitted' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {article.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Abstract</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{article.abstract}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviewers List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              {article.reviews.length > 0 ? (
                <div className="space-y-4">
                  {article.reviews.map((review) => (
                    <div key={review.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-800 text-lg">Reviewer #{review.reviewerNumber}</p>
                          <span className={`text-sm px-3 py-1 rounded-full ${review.status === 'completed' ? 'bg-green-200 text-green-800 font-bold' :
                            review.status === 'declined' ? 'bg-red-200 text-red-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                            {review.status === 'completed' ? (review.decision ? review.decision.replace('_', ' ').toUpperCase() : 'COMPLETED') : review.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-base text-gray-700 font-medium">{review.reviewer.name}</p>
                        <p className="text-sm text-gray-600">{review.reviewer.email}</p>
                      </div>

                      {review.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-green-200 space-y-4">
                          {review.commentsToAuthor && (
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                              <p className="text-sm font-bold text-gray-700 uppercase mb-2">Comments to Author</p>
                              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{review.commentsToAuthor}</div>
                            </div>
                          )}
                          {review.commentsToEditor && (
                            <div className="bg-red-50 p-4 rounded border border-red-100 shadow-sm">
                              <p className="text-sm font-bold text-red-700 uppercase mb-2 flex items-center gap-2">
                                <span>🔒</span> Confidential to Editor
                              </p>
                              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{review.commentsToEditor}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No reviews submitting yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Assign Reviewers */}
            {article.status === 'resubmitted' ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Resubmitted Article</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This article has been resubmitted by the author. Reviewer assignment is disabled for this stage.
                        Please rely on existing reviewers or proceed to decision.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Assign Reviewers</h3>

                <div className="space-y-2 max-h-64 overflow-y-auto mb-4 border rounded p-2">
                  {reviewers
                    .filter(reviewer => !article.reviews.some(r => r.reviewer.email === reviewer.email))
                    .map((reviewer) => (
                      <label
                        key={reviewer.id}
                        className={`flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer transition ${selectedReviewers.includes(reviewer.id) ? 'bg-blue-50 border-blue-100' : 'border border-transparent'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedReviewers.includes(reviewer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReviewers([...selectedReviewers, reviewer.id]);
                            } else {
                              setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer.id));
                            }
                          }}
                          className="mr-3 h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{reviewer.name}</p>
                          <p className="text-xs text-gray-600">{reviewer.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {reviewer._count?.reviews || 0} active reviews
                          </p>
                        </div>
                      </label>
                    ))}
                  {reviewers.filter(reviewer => !article.reviews.some(r => r.reviewer.email === reviewer.email)).length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">No available reviewers found.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Selected:</span> {selectedReviewers.length}
                  </p>
                  <button
                    onClick={handleAssignReviewers}
                    disabled={selectedReviewers.length === 0 || isAssigning}
                    className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                  >
                    {isAssigning ? 'Inviting...' : `Invite ${selectedReviewers.length} Reviewer(s)`}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>

                  <button
                    onClick={handleAutoAssign}
                    disabled={isAssigning}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isAssigning ? (
                      'Auto-Assigning...'
                    ) : (
                      <>
                        <span className="mr-2">✨</span> Auto-Assign
                      </>
                    )}
                  </button>
                </div>
              </div>

            )}
            {/* Editor Decision */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Make Decision</h2>
              <div className="space-y-3">
                <button
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-700 transition"
                  onClick={() => openDecisionModal('publish')}
                >
                  ✅ Accept & Publish
                </button>
                <button
                  className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-yellow-600 transition"
                  onClick={() => openDecisionModal('revise')}
                >
                  📝 Request Revision
                </button>
                <button
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-red-700 transition"
                  onClick={() => openDecisionModal('reject')}
                >
                  ❌ Reject Article
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {
        showDecisionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4 capitalize">
                {decisionType === 'publish' ? 'Accept & Publish' :
                  decisionType === 'revise' ? 'Request Revision' : 'Reject Article'}
              </h3>

              <p className="text-gray-600 mb-4">
                {decisionType === 'publish' ? 'Are you sure you want to publish this article? This action cannot be undone.' :
                  decisionType === 'revise' ? 'Please provide instructions for the author regarding required revisions.' :
                    'Please provide a reason for rejection.'}
              </p>

              {(decisionType === 'revise' || decisionType === 'reject') && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Comments / Reason</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={4}
                    value={decisionComments}
                    onChange={(e) => setDecisionComments(e.target.value)}
                    placeholder={decisionType === 'revise' ? "Enter revision details..." : "Enter rejection reason..."}
                  ></textarea>
                </div>
              )}

              {decisionType === 'publish' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Editor Comments (Optional)</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={2}
                    value={decisionComments}
                    onChange={(e) => setDecisionComments(e.target.value)}
                    placeholder="Optional comments..."
                  ></textarea>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDecisionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  disabled={isSubmittingDecision}
                >
                  Cancel
                </button>
                <button
                  onClick={submitDecision}
                  disabled={isSubmittingDecision || ((decisionType === 'revise' || decisionType === 'reject') && !decisionComments.trim())}
                  className={`px-4 py-2 text-white rounded-lg font-bold ${decisionType === 'publish' ? 'bg-green-600 hover:bg-green-700' :
                    decisionType === 'revise' ? 'bg-yellow-500 hover:bg-yellow-600' :
                      'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmittingDecision ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
