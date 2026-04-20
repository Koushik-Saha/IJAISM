"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ExternalLink, 
  MoreVertical, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ChevronDown,
  Search,
  Users as UsersIcon,
  Filter,
  Pencil
} from "lucide-react";
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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
import EditUserModal from "@/components/editor/EditUserModal";
import ManagePasswordModal from "@/components/editor/ManagePasswordModal";
import { Key } from "lucide-react";

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
    if (role === 'mother_admin') return 'Executive Board Admin';
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string; dot: string }> = {
      admin: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      super_admin: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
      mother_admin: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
      editor: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      sub_editor: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
      reviewer: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      author: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
    };
    return badges[role] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
  };

  // Helper to check permissions
  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false;
    // Prevent editing self in this view (edit profile instead) to avoid lockouts
    if (targetUser.id === currentUser.id) return false;

    if (currentUser.role === 'mother_admin') return true;

    if (currentUser.role === 'super_admin') {
      // Cannot touch Executive Board Admin
      if (targetUser.role === 'mother_admin') return false;
      return true;
    }

    if (currentUser.role === 'editor') {
      // Can only touch Sub Editor
      return targetUser.role === 'sub_editor';
    }

    return false;
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/5 rounded-2xl">
                 <UsersIcon className="w-8 h-8 text-primary" />
               </div>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Users</h1>
                  <p className="text-sm text-gray-500 font-medium">Manage institutional roles and access levels</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/editor" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95">
                Dashboard
              </Link>
              {currentUser && ['mother_admin', 'super_admin', 'editor', 'reviewer'].includes(currentUser.role) && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <UserPlus size={18} />
                  New User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search & Filter Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filter by name, email or institution..."
              className="block w-full pl-11 pr-32 py-3.5 bg-white border-none rounded-2xl shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
            />
            <div className="absolute inset-y-1.5 right-1.5 flex gap-1">
              {search && (
                <button
                  onClick={() => { setSearch(""); setAppliedSearch(""); }}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setAppliedSearch(search)}
                className="px-6 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
              >
                Find
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              onChange={(e) => setRoleFilter(e.target.value)}
              value={roleFilter}
              className="block w-full pl-10 pr-10 py-3.5 bg-white border-none rounded-2xl shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-primary appearance-none transition-all text-sm font-bold text-gray-700 cursor-pointer"
            >
              <option value="all">All Access Levels</option>
              <option value="author">Authors</option>
              <option value="reviewer">Reviewers</option>
              <option value="editor">Editors</option>
              <option value="sub_editor">Sub Editors</option>
              <option value="admin">Administrators</option>
              <option value="super_admin">Head Administrators</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900">Fetching user records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 text-center">
             <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-4">
                <UsersIcon className="w-10 h-10 text-gray-300" />
             </div>
            <h3 className="text-lg font-bold text-gray-900">No users matched your request</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">Try adjusting your filters or search keywords to find what you're looking for.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">User Detail</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">Access Role</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">Status</th>
                    <th className="px-2 py-4 text-center text-[10px] font-black tracking-widest text-gray-500 uppercase">Articles</th>
                    <th className="px-2 py-4 text-center text-[10px] font-black tracking-widest text-gray-500 uppercase">Reviews</th>
                    <th className="px-4 py-4 text-right text-[10px] font-black tracking-widest text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user) => {
                    const badge = getRoleBadge(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                               {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-bold text-gray-900">{user.name || "Unnamed User"}</div>
                              <div className="text-xs text-gray-500 font-medium">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg border shadow-sm ${badge.bg} ${badge.text} border-current/10`}>
                             <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                             {formatRole(user.role)}
                          </span>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border shadow-sm transition-all ${
                            user.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {user.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-2 py-5 whitespace-nowrap text-center">
                           <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-md">{user._count.articles}</span>
                        </td>
                        <td className="px-2 py-5 whitespace-nowrap text-center">
                           <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-md">{user._count.reviews}</span>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Edit Details */}
                            <button
                              onClick={() => handleEditClick(user)}
                              disabled={!canManageUser(user)}
                              title="Edit User"
                              className="p-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-30"
                            >
                              <Pencil size={14} />
                            </button>

                            {/* 2. Role Assignment */}
                            <div className="relative group">
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                                className="block w-28 pl-2 pr-6 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-700 focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-white transition-colors"
                                disabled={!canManageUser(user)}
                              >
                                <option value="author">Author</option>
                                <option value="reviewer">Reviewer</option>
                                {currentUser?.role === 'mother_admin' && (
                                  <>
                                    <option value="super_admin">Head Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="sub_editor">Sub Editor</option>
                                    <option value="admin">System Admin</option>
                                  </>
                                )}
                                {currentUser?.role === 'super_admin' && (
                                  <>
                                    <option value="editor">Editor</option>
                                    <option value="sub_editor">Sub Editor</option>
                                    <option value="admin">System Admin</option>
                                  </>
                                )}
                                {currentUser?.role === 'editor' && (
                                  <option value="sub_editor">Sub Editor</option>
                                )}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
                            </div>

                            {/* 3. Password Management (Mother Admin Only) */}
                            {currentUser?.role === 'mother_admin' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsPasswordModalOpen(true);
                                }}
                                title="Manage Password"
                                className="p-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-600 hover:text-white transition-all active:scale-95"
                              >
                                <Key size={14} />
                              </button>
                            )}

                            {/* 4. Public Profile */}
                            <Link
                              href={`/author/${user.id}`}
                              target="_blank"
                              title="Public Profile"
                              className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                            >
                              <ExternalLink size={14} />
                            </Link>

                            {/* 5. Status Toggle */}
                            <button
                              onClick={() => handleUpdateUser(user.id, { isActive: !user.isActive })}
                              disabled={!canManageUser(user)}
                              title={user.isActive ? 'Deactivate User' : 'Reactivate User'}
                              className={`p-1.5 border rounded-lg transition-all active:scale-95 disabled:opacity-30 ${
                                user.isActive 
                                  ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                              }`}
                            >
                              {user.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {!isLoading && users.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-10 px-2 gap-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{users.length}</span> records on page <span className="text-gray-900">{page}</span> of <span className="text-gray-900">{totalPages}</span>
            </p>

            <div className="flex gap-2 items-center bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"
                title="First Page"
              >
                <span className="sr-only">First Page</span>
                <UsersIcon className="w-4 h-4" /> {/* Or just use ChevronDoubleLeft if imported */}
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl disabled:opacity-20 transition-all active:scale-95"
              >
                Prev
              </button>

              <div className="flex items-center gap-1 px-2 border-x border-gray-100">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let start = Math.max(1, page - 2);
                  if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
                  const pNum = start + i;
                  if (pNum > totalPages) return null;

                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-9 h-9 flex items-center justify-center text-sm font-bold rounded-xl transition-all active:scale-90 ${
                        page === pNum 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl disabled:opacity-20 transition-all active:scale-95"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"
                title="Last Page"
              >
                 <span className="sr-only">Last Page</span>
                 <UsersIcon className="w-4 h-4 rotate-180" />
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

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        user={selectedUser}
        currentUserRole={currentUser?.role || ''}
      />
      <ManagePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
}
