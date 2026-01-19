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

  useEffect(() => {
    fetchArticles();
  }, [statusFilter]);

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/admin/articles');
        return;
      }

      const url = statusFilter === 'all' 
        ? '/api/admin/articles'
        : `/api/admin/articles?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Manage Articles</h1>
              <p className="mt-1 text-gray-600">View and manage all article submissions</p>
            </div>
            <Link href="/admin" className="btn-secondary">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-4 py-2 rounded ${statusFilter === 'submitted' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('under_review')}
              className={`px-4 py-2 rounded ${statusFilter === 'under_review' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Under Review
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-4 py-2 rounded ${statusFilter === 'published' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Published
            </button>
          </div>
        </div>

        {/* Articles Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No articles found</p>
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
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(article.status)}`}>
                        {article.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {article.reviews?.length || 0} / 4
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/articles/${article.id}`}
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
      </div>
    </div>
  );
}
