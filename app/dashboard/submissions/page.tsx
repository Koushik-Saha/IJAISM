'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

interface Article {
  id: string;
  title: string;
  journal: {
    code: string;
    name: string;
  };
  status: string;
  createdAt: string;
  submittedAt?: string;
  publishedAt?: string;
  reviewProgress: {
    completed: number;
    total: number;
    required: number;
  };
  reviews: Array<{
    id: string;
    reviewerName: string;
    status: string;
    decision?: string;
  }>;
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/articles/my-submissions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch submissions');
      }

      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-500' },
      submitted: { label: 'Submitted', className: 'bg-blue-500' },
      under_review: { label: 'Under Review', className: 'bg-yellow-500' },
      published: { label: 'Published', className: 'bg-green-500' },
      rejected: { label: 'Rejected', className: 'bg-red-500' },
      revision_requested: { label: 'Revision Requested', className: 'bg-orange-500' },
      waiting_for_editor: { label: 'Waiting For Editor', className: 'bg-purple-500' },
      accepted: { label: 'Accepted', className: 'bg-green-500' },
    };

    const config = statusConfig[status] || {
      label: status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      className: 'bg-gray-500'
    };
    return (
      <span className={`text-white text-sm px-2 py-1 rounded whitespace-nowrap ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading your submissions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button onClick={fetchSubmissions} className="btn-primary">
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Submissions</h1>
          <p className="text-gray-600">
            Track the status of your submitted articles and review progress
          </p>
        </div>

        {articles.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h2 className="text-xl font-bold mb-2">No Submissions Yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't submitted any articles yet.
              </p>
              <Link href="/submit" className="btn-primary">
                Submit Your First Article
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <Card key={article.id}>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link href={`/articles/${article.id}`}>
                          <h2 className="text-xl font-bold text-primary hover:text-primary-dark mb-2">
                            {article.title}
                          </h2>
                        </Link>
                        <p className="text-sm text-gray-600 mb-2">
                          {article.journal.name} ({article.journal.code})
                        </p>
                      </div>
                      {getStatusBadge(article.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Submitted:</span>
                        <div className="font-semibold">
                          {formatDate(article.submittedAt || article.createdAt)}
                        </div>
                      </div>
                      {article.publishedAt && (
                        <div>
                          <span className="text-gray-500">Published:</span>
                          <div className="font-semibold">
                            {formatDate(article.publishedAt)}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Reviews Completed:</span>
                        <div className="font-semibold">
                          {article.reviewProgress.completed}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Assigned:</span>
                        <div className="font-semibold">
                          {article.reviewProgress.total}
                        </div>
                      </div>
                    </div>

                    {/* Review Progress Bar */}
                    {article.status === 'under_review' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Review Progress</span>
                          <span>
                            {article.reviewProgress.completed} completed
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${(article.reviewProgress.completed / (article.reviewProgress.required || 4)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Reviewers List - Only visible if Revision Requested */}
                    {article.status === 'revision_requested' && article.reviews.length > 0 && (
                      <div className="mt-4 bg-orange-50 border border-orange-100 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-orange-900 mb-3">Reviewer Feedback:</h3>
                        <div className="space-y-3">
                          {article.reviews.map((review) => (
                            <div
                              key={review.id}
                              className="bg-white p-3 rounded border border-orange-100 shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-gray-900">{review.reviewerName}</span>
                                <span className={`text-xs px-2 py-1 rounded font-medium ${review.decision === 'accept' ? 'bg-green-100 text-green-700' :
                                    review.decision === 'reject' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {review.decision ? review.decision.replace('_', ' ').toUpperCase() : 'PENDING'}
                                </span>
                              </div>
                              {/* Note: Comments would be displayed here if available in the API response */}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-orange-200">
                          <p className="text-sm text-orange-800 mb-2">
                            Please address the feedback above and resubmit your article.
                          </p>
                          <Link
                            href={`/submit?resubmit=${article.id}`}
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resubmit Article
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/articles/${article.id}`}
                      className="btn-primary text-sm px-4 py-2 whitespace-nowrap text-center"
                    >
                      View Details
                    </Link>
                    {article.status === 'published' && (
                      <button className="btn-secondary text-sm px-4 py-2 whitespace-nowrap">
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
