'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import ReviewerStatsCard from "@/components/dashboard/ReviewerStatsCard";

interface MembershipStatus {
  tier: string;
  tierName: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  features: string[];
  submissions: {
    limit: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
    canSubmit: boolean;
  };
}

interface ReviewerStats {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
  overdue: number;
  dueSoon: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStats | null>(null);
  const [reviewerStatsLoading, setReviewerStatsLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Fetch membership status
    const fetchMembershipStatus = async () => {
      try {
        const response = await fetch('/api/membership/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMembershipStatus(data.status);
        }
      } catch (error) {
        console.error('Failed to fetch membership status:', error);
      }
    };

    // Fetch reviewer stats if user is a reviewer
    const fetchReviewerStats = async () => {
      if (parsedUser.role !== 'reviewer') return;

      setReviewerStatsLoading(true);
      try {
        const response = await fetch('/api/reviews/assigned', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Calculate overdue and due soon
          let overdue = 0;
          let dueSoon = 0;
          const now = new Date();

          if (data.assigned) {
            data.assigned.forEach((review: any) => {
              if (review.status === 'pending' || review.status === 'in_progress') {
                if (review.dueDate) {
                  const dueDate = new Date(review.dueDate);
                  const diffTime = dueDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays < 0) overdue++;
                  else if (diffDays <= 3) dueSoon++;
                }
              }
            });
          }

          setReviewerStats({
            ...data.stats,
            overdue,
            dueSoon
          });
        }
      } catch (error) {
        console.error('Failed to fetch reviewer stats:', error);
      } finally {
        setReviewerStatsLoading(false);
      }
    };

    Promise.all([fetchMembershipStatus(), fetchReviewerStats()]).finally(() => {
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'institutional':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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

            {/* Reviewer Stats */}
            {user.role === 'reviewer' && reviewerStats && (
              <div className="mt-6">
                <ReviewerStatsCard stats={reviewerStats} isLoading={reviewerStatsLoading} />
              </div>
            )}

            {/* Membership Status */}
            {membershipStatus && (
              <Card className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Membership</h2>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getTierBadgeColor(membershipStatus.tier)}`}>
                    {membershipStatus.tierName}
                  </span>
                </div>

                {/* Submission Limits */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Submissions This Year</span>
                    {membershipStatus.submissions.isUnlimited ? (
                      <span className="text-sm font-bold text-green-600">Unlimited</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-900">
                        {membershipStatus.submissions.used} / {membershipStatus.submissions.limit}
                      </span>
                    )}
                  </div>

                  {!membershipStatus.submissions.isUnlimited && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${membershipStatus.submissions.remaining === 0
                          ? 'bg-red-500'
                          : membershipStatus.submissions.remaining <= 1
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          }`}
                        style={{
                          width: `${(membershipStatus.submissions.used / membershipStatus.submissions.limit) * 100}%`,
                        }}
                      ></div>
                    </div>
                  )}

                  {!membershipStatus.submissions.canSubmit && (
                    <p className="text-xs text-red-600 mt-2">
                      {membershipStatus.tier === 'free'
                        ? 'Upgrade to submit articles'
                        : 'Annual limit reached. Upgrade for unlimited submissions.'}
                    </p>
                  )}
                </div>

                {/* Expiry Date */}
                {membershipStatus.isActive && membershipStatus.endDate && (
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-gray-600">Valid Until:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(membershipStatus.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Upgrade CTA */}
                {(membershipStatus.tier === 'free' || membershipStatus.tier === 'basic') && (
                  <Link
                    href="/membership"
                    className="block w-full text-center bg-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-accent-dark transition-colors"
                  >
                    {membershipStatus.tier === 'free' ? 'Get Membership' : 'Upgrade to Premium'}
                  </Link>
                )}
              </Card>
            )}
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

              <Link href="/dashboard/profile">
                <Card className="hover:border-primary cursor-pointer">
                  <div className="text-center">
                    <div className="text-4xl mb-4">👤</div>
                    <h3 className="text-lg font-bold mb-2">My Profile</h3>
                    <p className="text-sm text-gray-600">
                      Manage your profile and settings
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

              {user.role === 'admin' && (
                <Link href="/admin">
                  <Card className="hover:border-primary cursor-pointer">
                    <div className="text-center">
                      <div className="text-4xl mb-4">⚙️</div>
                      <h3 className="text-lg font-bold mb-2">Admin Panel</h3>
                      <p className="text-sm text-gray-600">
                        Manage platform and users
                      </p>
                    </div>
                  </Card>
                </Link>
              )}
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
      </div >
    </div >
  );
}
