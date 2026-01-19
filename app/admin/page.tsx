"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminStats {
  users: {
    total: number;
    recent: any[];
  };
  articles: {
    total: number;
    pending: number;
    underReview: number;
    published: number;
    rejected: number;
    recent: any[];
  };
  reviews: {
    pending: number;
  };
  memberships: {
    active: number;
  };
  announcements: {
    total: number;
    featured: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/admin');
          return;
        }

        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/login?redirect=/admin');
            return;
          }
          if (response.status === 403) {
            setError('Access denied. Admin role required.');
            return;
          }
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
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

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
              <p className="mt-1 text-gray-600">Manage your platform</p>
            </div>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-primary">{stats.users.total}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Articles</p>
                <p className="text-3xl font-bold text-primary">{stats.articles.total}</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.reviews.pending}</p>
              </div>
              <div className="text-4xl">✍️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Members</p>
                <p className="text-3xl font-bold text-green-600">{stats.memberships.active}</p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </div>
        </div>

        {/* Article Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.articles.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">{stats.articles.underReview}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Published</p>
            <p className="text-2xl font-bold text-green-600">{stats.articles.published}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.articles.rejected}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/articles"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">📄 Manage Articles</h3>
              <p className="text-sm text-gray-600">View and manage all submissions</p>
            </Link>
            <Link
              href="/admin/users"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">👥 Manage Users</h3>
              <p className="text-sm text-gray-600">User roles and permissions</p>
            </Link>
            <Link
              href="/admin/announcements"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">📢 Manage Announcements</h3>
              <p className="text-sm text-gray-600">Create and edit announcements</p>
            </Link>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Articles</h2>
            <Link href="/admin/articles" className="text-primary hover:text-primary/80 font-semibold text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.articles.recent.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No articles yet</p>
            ) : (
              stats.articles.recent.map((article: any) => (
                <div key={article.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="font-semibold text-gray-900 hover:text-primary"
                      >
                        {article.title}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        by {article.author?.name || article.author?.email} • {article.journal?.code}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' :
                      article.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      article.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {article.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-primary hover:text-primary/80 font-semibold text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.users.recent.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users yet</p>
            ) : (
              stats.users.recent.map((user: any) => (
                <div key={user.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{user.name || user.email}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'reviewer' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
