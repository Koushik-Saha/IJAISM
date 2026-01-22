"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  reviewerNumber: number;
  status: string;
  dueDate: string | null;
  assignedAt: string;
  article: {
    id: string;
    title: string;
    abstract: string;
    keywords: string[];
    articleType: string;
    submissionDate: string;
    author: {
      name: string;
      university: string;
    };
    journal: {
      fullName: string;
      code: string;
    };
  };
}

interface Stats {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

export default function ReviewerDashboardPage() {
  const router = useRouter();
  const [assignedReviews, setAssignedReviews] = useState<Review[]>([]);
  const [completedReviews, setCompletedReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, inProgress: 0, completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/dashboard/reviews');
          return;
        }

        const response = await fetch('/api/reviews/assigned', {
          cache: 'no-store',
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
          if (response.status === 403) {
            setError('Access denied. This page is only for reviewers.');
            return;
          }
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setAssignedReviews(data.assigned || []);
        setCompletedReviews(data.completed || []);
        setStats(data.stats || { pending: 0, inProgress: 0, completed: 0, total: 0 });
      } catch (err: any) {
        setError(err.message || 'Failed to load reviews');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/dashboard" className="text-primary hover:text-primary/80 font-semibold">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Reviewer Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your assigned peer reviews</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600 mt-2">Pending Reviews</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-gray-600 mt-2">In Progress</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-600 mt-2">Completed</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-gray-600 mt-2">Total Reviews</p>
            </div>
          </div>
        </div>

        {/* Active Reviews */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Reviews</h2>

          {assignedReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No active reviews</h3>
              <p className="mt-2 text-gray-600">You don't have any reviews assigned at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedReviews.map((review) => {
                const daysRemaining = getDaysRemaining(review.dueDate);
                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                const isUrgent = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;

                return (
                  <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{review.article.title}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(review.status)}`}>
                            {review.status === 'in_progress' ? 'In Progress' : review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Journal: <span className="font-medium text-gray-900">{review.article.journal.fullName}</span></p>
                            <p className="text-sm text-gray-600">Type: <span className="font-medium text-gray-900 capitalize">{review.article.articleType}</span></p>
                            <p className="text-sm text-gray-600">Author: <span className="font-medium text-gray-900">{review.article.author.name}</span></p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Assigned: <span className="font-medium text-gray-900">{formatDate(review.assignedAt)}</span></p>
                            <p className="text-sm text-gray-600">Due Date: <span className="font-medium text-gray-900">{formatDate(review.dueDate)}</span></p>
                            {daysRemaining !== null && (
                              <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                {isOverdue
                                  ? `Overdue by ${Math.abs(daysRemaining)} days`
                                  : `${daysRemaining} days remaining`}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-2">{review.article.abstract}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {review.article.keywords.slice(0, 5).map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="ml-4">
                        <Link
                          href={`/dashboard/reviews/${review.id}`}
                          className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors whitespace-nowrap"
                        >
                          Review Article
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Reviews */}
        {completedReviews.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recently Completed</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Article</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Journal</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedReviews.slice(0, 10).map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/reviews/${review.id}`} className="block">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-primary">{review.article.title}</div>
                          <div className="text-sm text-gray-500">{review.article.author.name}</div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <Link href={`/dashboard/reviews/${review.id}`} className="block">
                          {review.article.journal.code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <Link href={`/dashboard/reviews/${review.id}`} className="block">
                          {formatDate(review.assignedAt)}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/reviews/${review.id}`} className="block">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(review.status)}`}>
                            Completed
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
