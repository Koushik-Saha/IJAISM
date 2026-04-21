'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface Blog {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    publishedAt: string | null;
    author: {
        name: string;
        email: string;
    };
    viewCount: number;
    category?: string;
}

export default function BlogsPage() {
    const router = useRouter();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    useEffect(() => {
        fetchBlogs();
    }, [filter, appliedSearch]);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login?redirect=/editor/blogs');
                return;
            }

            const queryParams = new URLSearchParams();
            if (filter !== 'all') queryParams.append('status', filter);
            if (appliedSearch) queryParams.append('search', appliedSearch);

            const url = `/api/editor/blogs?${queryParams.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.blogs) {
                setBlogs(data.blogs);
            }
        } catch (error) {
            toast.error('Failed to fetch blog posts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/editor/blogs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Blog post deleted successfully');
                fetchBlogs();
            } else {
                toast.error('Failed to delete blog post');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            under_review: 'bg-blue-100 text-blue-800 border-blue-200',
            accepted: 'bg-green-100 text-green-800 border-green-200',
            published: 'bg-green-500 text-white border-green-600',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            revision_requested: 'bg-orange-100 text-orange-800 border-orange-200',
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-md-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Blog Management</h1>
                            <p className="text-gray-500 mt-1">Review, assign, and publish community insights.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/editor/blogs/new"
                                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span>Create Post</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search & Filter Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                    <div className="lg:col-span-7 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by title, excerpt, or author..."
                            className="block w-full pl-11 pr-32 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
                        />
                        <div className="absolute inset-y-1 right-1 flex gap-1">
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

                    <div className="lg:col-span-5">
                        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-full overflow-x-auto whitespace-nowrap">
                            {['all', 'submitted', 'under_review', 'accepted', 'published', 'rejected'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        filter === s
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {formatStatus(s)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Blog Post</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Author</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Metrics</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Submitted</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-gray-500 font-medium">Loading submissions...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : blogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="text-4xl">📄</div>
                                                <h3 className="text-lg font-bold text-gray-900">No blog posts found</h3>
                                                <p className="text-gray-500">There are no submissions matching the current filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    blogs.map((blog) => (
                                        <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 line-clamp-1">{blog.title}</span>
                                                    <span className="text-xs text-gray-400 mt-0.5">{blog.category || 'General'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusBadge(blog.status)}`}>
                                                    {formatStatus(blog.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-700">{blog.author.name}</span>
                                                    <span className="text-xs text-gray-400">{blog.author.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.391 9.851 5.513 8.125 8.17 8.125s4.778 1.726 6.136 3.553a1.125 1.125 0 010 1.123C12.949 14.502 10.827 16.273 8.17 16.273s-4.778-1.727-6.136-3.553z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="text-xs font-bold">{blog.viewCount} views</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-500 font-medium">
                                                {new Date(blog.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/editor/blogs/${blog.id}`}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                                                    >
                                                        Review
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(blog.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Post"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.177H8.072a2.25 2.25 0 0 1-2.244-2.177L6.32 5.79m14.505 0a67.361 67.361 0 0 0-3.142-.191m-4.722-.192-1.294-1.815A2.25 2.25 0 0 0 7.375 2.5h2.25c-.2 0-.397.04-.58.114l-.382.114m.933-.114h1.022c.288 0 .546.134.712.333l1.294 1.815a67.362 67.362 0 0 1 3.142.191l-1.04 14.286A.75.75 0 0 1 14.5 19.5h-5a.75.75 0 0 1-.74-.833l1.04-14.286c.036-.502.433-.913.931-.974Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
