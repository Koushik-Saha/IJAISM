'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import RichTextEditor from '@/components/ui/RichTextEditor';
import FileUploadButton from '@/components/ui/FileUploadButton';

export default function NewBlogPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'draft',
        featuredImageUrl: '',
    });

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData((prev) => ({
            ...prev,
            title,
            slug: generateSlug(title),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Unauthorized');
            }

            const response = await fetch('/api/editor/blogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Blog post created successfully');
                router.push('/editor/blogs');
            } else {
                toast.error(data.error || 'Failed to create blog post');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
                <Link href="/editor/blogs" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                    ← Back
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={handleTitleChange}
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
                        <label className="block text-sm font-medium text-gray-700">Content</label>
                        <RichTextEditor 
                            value={formData.content}
                            onChange={(value) => setFormData({ ...formData, content: value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <div className="w-32 h-20 bg-gray-200 rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                                {formData.featuredImageUrl ? (
                                    <img src={formData.featuredImageUrl} alt="Featured Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] text-gray-400 font-bold uppercase px-1 text-center">No Image</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <FileUploadButton
                                    onUploadSuccess={(url) => setFormData({ ...formData, featuredImageUrl: url })}
                                    accept="image/*"
                                    label={formData.featuredImageUrl ? "Change Image" : "Upload Image"}
                                    fileType="blog"
                                />
                                {formData.featuredImageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, featuredImageUrl: '' })}
                                        className="block text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        Remove Image
                                    </button>
                                )}
                                <p className="text-[10px] text-gray-500">Recommended: Landscape aspect ratio (e.g. 16:9). Max 10MB.</p>
                            </div>
                        </div>
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
                        {loading ? 'Creating...' : 'Create Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}
