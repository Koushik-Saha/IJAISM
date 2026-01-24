"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  status: string;
  submissionDate: string;
  author: {
    name: string;
    email: string;
  };
  journal: {
    fullName: string;
    code: string;
  };
  reviews: any[];
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, page]);

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/editor/articles');
        return;
      }

      let url = `/api/editor/articles?page=${page}&limit=${limit}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/editor');
          return;
        }
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.articles || []);
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
      }
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      revision_requested: 'bg-orange-100 text-orange-800',
      waiting_for_editor: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'waiting_for_editor', label: 'Waiting for Editor' },
    { value: 'revision_requested', label: 'Revision Requested' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'published', label: 'Published' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Manage Articles</h1>
              <p className="mt-1 text-gray-600">View and manage all article submissions</p>
            </div>
            <Link href="/editor" className="btn-secondary">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => {
                  setStatusFilter(status.value);
                  setPage(1); // Reset to page 1 on filter change
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === status.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No articles found matching this filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Journal</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{article.title}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(article.submissionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {article.author?.name || article.author?.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{article.journal?.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(article.status)}`}>
                        {formatStatus(article.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {article.reviews?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/editor/articles/${article.id}`}
                        className="text-primary hover:text-primary/80 font-semibold"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {articles.length > 0 && (
          <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
