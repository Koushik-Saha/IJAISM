'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface BlogReview {
    id: string;
    status: string;
    createdAt: string;
    blog: {
        id: string;
        title: string;
        excerpt: string;
        author: {
            name: string;
        };
    };
}

export default function ReviewerBlogsPage() {
    const router = useRouter();
    const [reviews, setReviews] = useState<BlogReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login?redirect=/dashboard/reviews/blogs');
                return;
            }

            const response = await fetch('/api/reviewer/blogs/assigned', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.blogReviews) {
                setReviews(data.blogReviews);
            }
        } catch (error) {
            toast.error('Failed to fetch blog assignments');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/reviews" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Blog Reviews</h1>
                            <p className="text-gray-500">Manage and provide feedback on community blog submissions.</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500 font-bold">Loading your assignments...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-20 text-center">
                        <div className="text-6xl mb-6">📝</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No blogs assigned for review</h2>
                        <p className="text-gray-500 max-w-md mx-auto">You'll see blog posts here once an administrator assigns them to you for feedback.</p>
                        <Link href="/dashboard/reviews" className="mt-8 inline-block text-primary font-bold hover:underline">
                            ← Return to Article Reviews
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusBadge(review.status)}`}>
                                            {review.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            Assigned {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">{review.blog.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-3 mb-4">{review.blog.excerpt}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-gray-600">By {review.blog.author.name}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 border-t border-gray-100 italic">
                                    <Link 
                                        href={`/dashboard/reviews/blogs/${review.id}`}
                                        className="w-full bg-white text-gray-900 py-2.5 rounded-xl font-bold border border-gray-200 text-center block hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                    >
                                        {review.status === 'completed' ? 'View Feedback' : 'Start Review'}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
