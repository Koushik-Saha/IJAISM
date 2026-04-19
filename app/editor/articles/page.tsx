"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  status: string;
  submissionDate: string;
  publicationDate?: string;
  doi?: string;
  volume?: number;
  issue?: number;
  articleType?: string;
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
  const searchParams = useSearchParams();
  const journalId = searchParams.get('journalId');

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [noDoiFilter, setNoDoiFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, noDoiFilter, page, journalId]);

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
      if (journalId) {
        url += `&journalId=${journalId}`;
      }
      if (noDoiFilter) {
        url += `&noDoi=true`;
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
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === status.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status.label}
              </button>
            ))}
            <button
              onClick={() => {
                setNoDoiFilter(prev => !prev);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${noDoiFilter
                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                : 'bg-white text-orange-600 border-orange-400 hover:bg-orange-50'
                }`}
            >
              No DOI
            </button>
          </div>

          {journalId && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200">
              <span className="text-sm">Filtered by Journal ID: <span className="font-mono font-bold">{journalId.substring(0, 8)}...</span></span>
              <button
                onClick={() => router.push('/editor/articles')}
                className="text-xs bg-white border border-blue-300 px-2 py-1 rounded hover:bg-blue-100"
              >
                Clear Filter
              </button>
            </div>
          )}
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Article ID / DOI</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Journal</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Vol / Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => {
                  const articleId = article.doi ? article.doi.replace('https://doi.org/10.63471/', '') : null;
                  return (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {article.publicationDate
                          ? new Date(article.publicationDate).toLocaleDateString()
                          : article.submissionDate
                          ? new Date(article.submissionDate).toLocaleDateString()
                          : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {articleId ? (
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                          {articleId}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No DOI</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {article.author?.name || article.author?.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{article.journal?.code?.toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {article.volume && article.issue ? `Vol ${article.volume} · Iss ${article.issue}` : '—'}
                    </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {articles.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-600">
              Showing page {page} of {totalPages}
            </p>

            <div className="flex gap-1 items-center">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
                title="First Page"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
              >
                ‹
              </button>

              {/* Numbered Pages Logic: Show limited window around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to center the window
                let start = Math.max(1, page - 2);
                if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
                const pNum = start + i;
                if (pNum > totalPages) return null;

                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`px-3 py-1 border rounded min-w-[32px] ${page === pNum ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-gray-50'}`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
