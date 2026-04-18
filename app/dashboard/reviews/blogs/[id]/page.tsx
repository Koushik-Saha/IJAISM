'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface BlogReview {
    id: string;
    status: string;
    decision?: string;
    commentsToAuthor?: string;
    commentsToAdmin?: string;
    blog: {
        id: string;
        title: string;
        content: string;
        excerpt: string;
        featuredImageUrl: string | null;
        author: {
            name: string;
            email: string;
        };
    };
}

export default function BlogFeedbackPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [review, setReview] = useState<BlogReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [decision, setDecision] = useState('');
    const [commentsToAuthor, setCommentsToAuthor] = useState('');
    const [commentsToAdmin, setCommentsToAdmin] = useState('');

    useEffect(() => {
        if (id) {
            fetchAssignment();
        }
    }, [id]);

    const fetchAssignment = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/reviewer/blogs/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.blogReview) {
                setReview(data.blogReview);
                // Pre-fill if already completed (though usually won't be editable)
                if (data.blogReview.status === 'completed') {
                    setDecision(data.blogReview.decision || '');
                    setCommentsToAuthor(data.blogReview.commentsToAuthor || '');
                    setCommentsToAdmin(data.blogReview.commentsToAdmin || '');
                }
            } else {
                toast.error('Review assignment not found');
            }
        } catch (error) {
            toast.error('Failed to fetch review details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!decision) {
            toast.error('Please select a decision');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/reviewer/blogs/${id}/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    decision,
                    commentsToAuthor,
                    commentsToAdmin
                })
            });

            if (response.ok) {
                toast.success('Review submitted successfully!');
                router.push('/dashboard/reviews/blogs');
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to submit feedback');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Submission Content...</p>
                </div>
            </div>
        );
    }

    if (!review) return <div className="p-20 text-center">Review assignment not found or access denied.</div>;

    const isCompleted = review.status === 'completed';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/reviews/blogs" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{review.blog.title}</h1>
                                <p className="text-xs text-gray-400">Section: Community Blog Review</p>
                            </div>
                        </div>
                        {isCompleted && (
                            <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-green-200">
                                Review Completed
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Content Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {review.blog.featuredImageUrl && (
                                <div className="h-48 w-full relative">
                                    <img src={review.blog.featuredImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{review.blog.title}</h2>
                                <p className="text-gray-500 italic mb-8 border-l-4 border-primary/20 pl-4">{review.blog.excerpt}</p>
                                
                                <div className="prose prose-lg max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: review.blog.content }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Review Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Provide Feedback
                            </h3>

                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">Your Recommendation</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            disabled={isCompleted}
                                            onClick={() => setDecision('accepted')}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                                                decision === 'accepted' 
                                                ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                                            }`}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isCompleted}
                                            onClick={() => setDecision('rejected')}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                                                decision === 'rejected' 
                                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                                            }`}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Comments to Author</label>
                                    <textarea
                                        readOnly={isCompleted}
                                        value={commentsToAuthor}
                                        onChange={(e) => setCommentsToAuthor(e.target.value)}
                                        rows={4}
                                        placeholder="Detailed feedback for the blog author..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Confidential to Editor</label>
                                    <textarea
                                        readOnly={isCompleted}
                                        value={commentsToAdmin}
                                        onChange={(e) => setCommentsToAdmin(e.target.value)}
                                        rows={3}
                                        placeholder="Private notes seen only by administrators..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm italic disabled:bg-gray-50 disabled:text-gray-500"
                                    ></textarea>
                                </div>

                                {!isCompleted && (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 mt-4"
                                    >
                                        {isSubmitting ? 'Submitting Review...' : 'Submit Feedback'}
                                    </button>
                                )}
                            </form>
                            
                            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Author</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{review.blog.author.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
