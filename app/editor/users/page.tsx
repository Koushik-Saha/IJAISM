"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    articles: number;
    reviews: number;
  };
}

import CreateUserModal from "@/components/editor/CreateUserModal";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true); // Renamed from isLoading for consistency if needed, but keeping logic same
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    // Fetch current user for RBAC
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setCurrentUser(data.user || null))
        .catch(err => console.error(err));
    }
  }, []);

  useEffect(() => {
    setPage(1); // Reset to page 1 on filter/search change
    fetchUsers();
  }, [roleFilter, appliedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/editor/users');
        return;
      }

      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (roleFilter !== 'all') queryParams.append('role', roleFilter);
      if (appliedSearch) queryParams.append('search', appliedSearch);

      const response = await fetch(`/api/editor/users?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/editor');
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/editor/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ...updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      toast.success('User updated successfully!', {
        description: 'User information has been updated.',
        duration: 3000,
      });
      fetchUsers();
    } catch (err: any) {
      toast.error('Update failed', {
        description: err.message || 'Failed to update user',
        duration: 4000,
      });
    }
  };

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      super_admin: 'bg-red-100 text-red-800',
      mother_admin: 'bg-purple-100 text-purple-800',
      editor: 'bg-orange-100 text-orange-800',
      sub_editor: 'bg-yellow-100 text-yellow-800',
      reviewer: 'bg-blue-100 text-blue-800',
      author: 'bg-gray-100 text-gray-800',
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  // Helper to check permissions
  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false;
    // Prevent editing self in this view (edit profile instead) to avoid lockouts
    if (targetUser.id === currentUser.id) return false;

    if (currentUser.role === 'mother_admin') return true;

    if (currentUser.role === 'super_admin') {
      // Cannot touch Mother Admin or Super Admin
      if (['mother_admin', 'super_admin'].includes(targetUser.role)) return false;
      return true;
    }

    if (currentUser.role === 'editor') {
      // Can only touch Sub Editor
      return targetUser.role === 'sub_editor';
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Manage Users</h1>
              <p className="mt-1 text-gray-600">User roles and permissions</p>
            </div>
            <div className="flex gap-3">
              <Link href="/editor" className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Back</Link>
              {currentUser && ['mother_admin', 'super_admin', 'editor', 'reviewer'].includes(currentUser.role) && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary"
                >
                  + Create User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name or email..."
              className="flex-1 border rounded px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
            />
            <button
              onClick={() => setAppliedSearch(search)}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Search
            </button>
            {appliedSearch && (
              <button
                onClick={() => { setSearch(""); setAppliedSearch(""); }}
                className="px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded ${roleFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('author')}
              className={`px-4 py-2 rounded ${roleFilter === 'author' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Authors
            </button>
            <button
              onClick={() => setRoleFilter('reviewer')}
              className={`px-4 py-2 rounded ${roleFilter === 'reviewer' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Reviewers
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-4 py-2 rounded ${roleFilter === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter('super_admin')}
              className={`px-4 py-2 rounded ${roleFilter === 'super_admin' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Super Admins
            </button>
            <button
              onClick={() => setRoleFilter('editor')}
              className={`px-4 py-2 rounded ${roleFilter === 'editor' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Editors
            </button>
            <button
              onClick={() => setRoleFilter('sub_editor')}
              className={`px-4 py-2 rounded ${roleFilter === 'sub_editor' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Sub Editors
            </button>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Articles</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.name || user.email}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user._count.articles}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user._count.reviews}</td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                        className="text-sm border rounded px-2 py-1 mr-2 disabled:opacity-50 disabled:bg-gray-100"
                        disabled={!canManageUser(user)}
                      >
                        <option value="author">Author</option>
                        <option value="reviewer">Reviewer</option>
                        {/* Dynamic Roles */}
                        {currentUser?.role === 'mother_admin' && (
                          <>
                            <option value="super_admin">Super Admin</option>
                            <option value="editor">Editor</option>
                            <option value="sub_editor">Sub Editor</option>
                            <option value="admin">Admin</option>
                          </>
                        )}
                        {currentUser?.role === 'super_admin' && (
                          <>
                            <option value="editor">Editor</option>
                            <option value="sub_editor">Sub Editor</option>
                            <option value="admin">Admin</option>
                          </>
                        )}
                        {currentUser?.role === 'editor' && (
                          <option value="sub_editor">Sub Editor</option>
                        )}
                      </select>
                      <button
                        onClick={() => handleUpdateUser(user.id, { isActive: !user.isActive })}
                        disabled={!canManageUser(user)}
                        className={`text-sm px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${user.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        {!isLoading && users.length > 0 && (
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

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchUsers}
        currentUserRole={currentUser?.role || ''}
      />
    </div>
  );
}
