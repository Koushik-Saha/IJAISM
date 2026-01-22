"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'news',
    isFeatured: false,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/editor/announcements');
        return;
      }

      const response = await fetch('/api/editor/announcements', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/editor');
          return;
        }
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingAnnouncement
        ? '/api/editor/announcements'
        : '/api/editor/announcements';
      const method = editingAnnouncement ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingAnnouncement && { id: editingAnnouncement.id }),
          ...formData,
          publishedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save announcement');
      }

      toast.success(editingAnnouncement ? 'Announcement updated!' : 'Announcement created!', {
        description: editingAnnouncement 
          ? 'The announcement has been updated successfully.'
          : 'The announcement has been created successfully.',
        duration: 3000,
      });
      setIsEditing(false);
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'news',
        isFeatured: false,
      });
      fetchAnnouncements();
    } catch (err: any) {
      toast.error('Save failed', {
        description: err.message || 'Failed to save announcement',
        duration: 4000,
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      excerpt: announcement.excerpt || '',
      category: announcement.category || 'news',
      isFeatured: announcement.isFeatured,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/announcements?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Announcement deleted!', {
        description: 'The announcement has been removed successfully.',
        duration: 3000,
      });
      fetchAnnouncements();
    } catch (err: any) {
      toast.error('Delete failed', {
        description: err.message || 'Failed to delete announcement',
        duration: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Manage Announcements</h1>
              <p className="mt-1 text-gray-600">Create and edit announcements</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (isEditing) {
                    setEditingAnnouncement(null);
                    setFormData({
                      title: '',
                      content: '',
                      excerpt: '',
                      category: 'news',
                      isFeatured: false,
                    });
                  }
                }}
                className="btn-primary"
              >
                {isEditing ? 'Cancel' : '+ New Announcement'}
              </button>
              <Link href="/editor" className="btn-secondary">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create/Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Content *</label>
                <textarea
                  required
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Excerpt</label>
                <textarea
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Brief summary (auto-generated if empty)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="news">News</option>
                    <option value="update">Update</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-semibold">Featured Announcement</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingAnnouncement(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                      {announcement.isFeatured && (
                        <span className="px-2 py-1 text-xs font-semibold bg-accent text-white rounded">
                          Featured
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                        {announcement.category || 'news'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">
                      {announcement.excerpt || announcement.content.substring(0, 200)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      Published: {announcement.publishedAt
                        ? new Date(announcement.publishedAt).toLocaleDateString()
                        : 'Not published'}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
