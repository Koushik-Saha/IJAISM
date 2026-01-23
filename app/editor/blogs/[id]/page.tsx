'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using safe method - React.use() or await in useEffect is tricky with rules of hooks.
    // In Nextjs 15 client components, we can unwrap with `use()` if available, or just treat as promise.
    // Safest compatible way:
    const resolvedParams = use(params);

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'draft',
        featuredImageUrl: '',
    });

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login?redirect=/editor/blogs');
                    return;
                }

                const response = await fetch(`/api/editor/blogs/${resolvedParams.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (response.ok) {
                    setFormData({
                        title: data.blog.title,
                        slug: data.blog.slug,
                        content: data.blog.content,
                        excerpt: data.blog.excerpt || '',
                        status: data.blog.status,
                        featuredImageUrl: data.blog.featuredImageUrl || '',
                    });
                } else {
                    toast.error('Failed to load blog post');
                    router.push('/editor/blogs');
                }
            } catch (error) {
                toast.error('An error occurred');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchBlog();
    }, [resolvedParams.id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Unauthorized');

            const response = await fetch(`/api/editor/blogs/${resolvedParams.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Blog post updated successfully');
                router.push('/editor/blogs');
            } else {
                toast.error(data.error || 'Failed to update blog post');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center">Loading post...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Post</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary h-10 px-3 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Slug</label>
                        <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary h-10 px-3 border bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                        <textarea
                            rows={3}
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Content (Markdown supported)</label>
                        <textarea
                            rows={15}
                            required
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 border font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Featured Image URL</label>
                        <input
                            type="url"
                            value={formData.featuredImageUrl}
                            onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary h-10 px-3 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary h-10 px-3 border"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                    >
                        {loading ? 'Update Post' : 'Update Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}
