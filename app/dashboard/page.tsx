"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading...</div>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-xl font-bold mb-4">Your Profile</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-semibold text-gray-600">Name:</span>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Email:</span>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">University:</span>
                  <p className="text-gray-900">{user.university}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Role:</span>
                  <p className="text-gray-900 capitalize">{user.role}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/dashboard/profile" className="btn-primary w-full text-center">
                  Edit Profile
                </Link>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/submit">
                <Card className="hover:border-primary cursor-pointer">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-bold mb-2">Submit Article</h3>
                    <p className="text-sm text-gray-600">
                      Submit your research for peer review
                    </p>
                  </div>
                </Card>
              </Link>

              <Link href="/dashboard/submissions">
                <Card className="hover:border-primary cursor-pointer">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-bold mb-2">My Submissions</h3>
                    <p className="text-sm text-gray-600">
                      View your submitted articles
                    </p>
                  </div>
                </Card>
              </Link>

              {user.role === 'reviewer' && (
                <Link href="/dashboard/reviews">
                  <Card className="hover:border-primary cursor-pointer">
                    <div className="text-center">
                      <div className="text-4xl mb-4">✍️</div>
                      <h3 className="text-lg font-bold mb-2">Review Requests</h3>
                      <p className="text-sm text-gray-600">
                        View articles assigned to you
                      </p>
                    </div>
                  </Card>
                </Link>
              )}

              <Link href="/articles">
                <Card className="hover:border-primary cursor-pointer">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-bold mb-2">Browse Articles</h3>
                    <p className="text-sm text-gray-600">
                      Explore published research
                    </p>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Info Box */}
            <Card className="mt-8 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-bold mb-3 text-blue-900">
                🚀 Fast 4-Reviewer Publication System
              </h3>
              <p className="text-blue-800 mb-2">
                At IJAISM, we minimize the delay in sharing your research! Here's how it works:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Submit your article through our platform</li>
                <li>Your paper is assigned to 4 expert reviewers</li>
                <li>Each reviewer provides accept/reject decision</li>
                <li><strong>If all 4 reviewers accept, your paper is automatically published!</strong></li>
              </ol>
              <p className="text-blue-800 mt-3 font-semibold">
                No delays. No waiting. Just fast, quality peer review.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
