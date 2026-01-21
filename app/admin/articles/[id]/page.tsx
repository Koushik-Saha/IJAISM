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

  useEffect(() => {
    if (id) {
      fetchArticle();
      fetchReviewers();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/articles?id=${id}&t=${Date.now()}`, {
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
      const response = await fetch('/api/admin/reviewers', {
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
      const response = await fetch(`/api/admin/articles/${id}/auto-assign-reviewers`, {
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
      const response = await fetch(`/api/admin/articles/${id}/assign-reviewers`, {
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
          <Link href="/admin/articles" className="text-primary">← Back to Articles</Link>
        </div>
      </div>
    );
  }

  const hasReviewers = article.reviews && article.reviews.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin/articles" className="text-primary hover:text-primary/80 font-semibold mb-4 inline-block">
            ← Back to Articles
          </Link>
          <h1 className="text-3xl font-bold text-primary">{article.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Details */}
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
          </div>

          {/* Reviewer Assignment */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Reviewers</h2>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Assignment Progress</p>
                  <p className="text-sm font-bold text-primary">
                    {article.reviews.length} / 4
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${article.reviews.length === 4 ? 'bg-green-500' :
                      article.reviews.length >= 2 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                    style={{ width: `${(article.reviews.length / 4) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Assigned Reviewers */}
              {hasReviewers && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">Assigned Reviewers</h3>
                  <div className="space-y-3">
                    {article.reviews.map((review) => (
                      <div key={review.id} className="border border-green-200 bg-green-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-800">Reviewer #{review.reviewerNumber}</p>
                          <span className="text-green-600 text-sm">✓ Assigned</span>
                        </div>
                        <p className="text-sm text-gray-700">{review.reviewer.name}</p>
                        <p className="text-xs text-gray-600">{review.reviewer.email}</p>
                        <span className={`mt-2 inline-block px-2 py-1 text-xs rounded ${review.status === 'completed' ? 'bg-green-100 text-green-800' :
                          review.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {review.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Slots */}
              {article.reviews.length < 4 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">Available Slots</h3>
                  <div className="space-y-2">
                    {[...Array(4 - article.reviews.length)].map((_, index) => (
                      <div key={index} className="border border-dashed border-gray-300 rounded-lg p-3 text-center text-gray-500 text-sm">
                        Reviewer #{article.reviews.length + index + 1} - Not Assigned
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign More Reviewers */}
              {article.reviews.length < 4 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">
                    Assign {article.reviews.length === 0 ? 'Reviewers' : 'More Reviewers'}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Select up to {4 - article.reviews.length} more reviewer(s)
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                    {reviewers
                      .filter(reviewer => !article.reviews.some(r => r.reviewer.email === reviewer.email))
                      .map((reviewer) => (
                        <label
                          key={reviewer.id}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedReviewers.includes(reviewer.id) ? 'border-primary bg-primary/5' : ''
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedReviewers.includes(reviewer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const maxAllowed = 4 - article.reviews.length;
                                if (selectedReviewers.length < maxAllowed) {
                                  setSelectedReviewers([...selectedReviewers, reviewer.id]);
                                } else {
                                  toast.warning('Selection limit', {
                                    description: `You can only select ${maxAllowed} more reviewer(s)`,
                                    duration: 3000,
                                  });
                                }
                              } else {
                                setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer.id));
                              }
                            }}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{reviewer.name}</p>
                            <p className="text-xs text-gray-600">{reviewer.email}</p>
                            <p className="text-xs text-gray-500">
                              {reviewer._count.reviews} active reviews
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Selected: {selectedReviewers.length} / {4 - article.reviews.length}
                    </p>
                    <button
                      onClick={handleAssignReviewers}
                      disabled={selectedReviewers.length === 0 || isAssigning}
                      className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAssigning ? 'Assigning...' : `Assign ${selectedReviewers.length} Reviewer(s)`}
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
                          <span className="mr-2">✨</span> Auto-Assign Best Match
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* All Reviewers Assigned */}
              {article.reviews.length === 4 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-semibold">✓ All 4 Reviewers Assigned</p>
                  <p className="text-sm text-green-700 mt-1">This article has the full complement of reviewers.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
