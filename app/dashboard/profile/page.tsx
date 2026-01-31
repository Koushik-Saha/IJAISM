'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { toast } from 'sonner';

interface UserStatistics {
  totalArticles: number;
  publishedArticles: number;
  totalCitations: number;
  totalViews: number;
  totalDownloads: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  university: string | null;
  affiliation: string | null;
  role: string;
  orcid: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  statistics?: UserStatistics;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    affiliation: '',
    orcid: '',
    bio: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await res.json();
      setProfile(data.user);
      setFormData({
        name: data.user.name || '',
        university: data.user.university || '',
        affiliation: data.user.affiliation || '',
        orcid: data.user.orcid || '',
        bio: data.user.bio || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          university: formData.university || null,
          affiliation: formData.affiliation || null,
          orcid: formData.orcid || null,
          bio: formData.bio || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const data = await res.json();
      setProfile(data.user);
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!', {
        description: 'Your profile information has been saved.',
        duration: 3000,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error('Update failed', {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle ORCID Return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('orcid_code');
    if (code) {
      linkOrcid(code);
    }
  }, []);

  const linkOrcid = async (code: string) => {
    const toastId = toast.loading('Linking ORCID...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/orcid/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("ORCID Connected Successfully!", { id: toastId });
      fetchProfile();
      // Clear query param
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      toast.error("Failed to link ORCID: " + err.message, { id: toastId });
    }
  };

  const connectOrcid = () => {
    // Save return URL state if needed, but for now just redirect
    window.location.href = '/api/auth/orcid';
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errorMessage = 'New passwords do not match';
      setError(errorMessage);
      toast.error('Validation error', {
        description: errorMessage,
        duration: 3000,
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      const errorMessage = 'Password must be at least 8 characters';
      setError(errorMessage);
      toast.error('Validation error', {
        description: errorMessage,
        duration: 3000,
      });
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="text-center">
            <div className="text-red-600 mb-4">Failed to load profile</div>
            <button onClick={fetchProfile} className="btn-primary">
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="text-red-600">{error}</div>
          </Card>
        )}

        {success && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <div className="text-green-600">{success}</div>
          </Card>
        )}

        {/* Statistics Section */}
        {profile.statistics && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-blue-50">
            <h2 className="text-xl font-bold mb-4">Publication Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{profile.statistics.totalArticles}</div>
                <div className="text-sm text-gray-600 mt-1">Total Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{profile.statistics.publishedArticles}</div>
                <div className="text-sm text-gray-600 mt-1">Published</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{profile.statistics.totalCitations}</div>
                <div className="text-sm text-gray-600 mt-1">Citations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{profile.statistics.totalViews.toLocaleString()}</div>
                <div className="text-sm text-gray-600 mt-1">Views</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{profile.statistics.totalDownloads.toLocaleString()}</div>
                <div className="text-sm text-gray-600 mt-1">Downloads</div>
              </div>
            </div>
          </Card>
        )}

        {/* Profile Information */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">University</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your university or institution"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Affiliation</label>
                <input
                  type="text"
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Department, school, or organization"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">ORCID</label>
                <input
                  type="text"
                  value={formData.orcid}
                  onChange={(e) => setFormData({ ...formData, orcid: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0000-0000-0000-0000"
                  pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your ORCID iD (e.g., 0000-0001-2345-6789).{' '}
                  {profile.orcid && (
                    <a
                      href={`https://orcid.org/${profile.orcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View ORCID profile
                    </a>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief biography, research interests, and academic background..."
                  rows={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  A brief biography about yourself, your research interests, and academic background.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 capitalize"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </Card>

        {/* Password Change */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn-secondary"
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setError(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
