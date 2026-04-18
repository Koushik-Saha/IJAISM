'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface BlogReview {
    id: string;
    reviewerNumber: number;
    status: string;
    decision?: string;
    commentsToAuthor?: string;
    commentsToEditor?: string;
    reviewer: {
        name: string;
        email: string;
    };
}

interface Blog {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    status: string;
    featuredImageUrl: string | null;
    createdAt: string;
    publishedAt: string | null;
    slug: string;
    author: {
        name: string;
        email: string;
    };
    category?: string;
    reviews: BlogReview[];
}

export default function BlogReviewPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Assignment state
    const [reviewers, setReviewers] = useState<any[]>([]);
    const [selectedReviewer, setSelectedReviewer] = useState('');
    const [assigning, setAssigning] = useState(false);
    
    // Decision state
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [decisionType, setDecisionType] = useState('');
    const [decisionComments, setDecisionComments] = useState('');

    useEffect(() => {
        if (id) {
            fetchBlog();
            fetchAvailableReviewers();
        }
    }, [id]);

    const fetchBlog = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/blogs/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.blog) {
                setBlog(data.blog);
            }
        } catch (error) {
            toast.error('Failed to fetch blog details');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableReviewers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/editor/reviewers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.reviewers) {
                setReviewers(data.reviewers);
            }
        } catch (error) {
            console.error('Failed to fetch reviewers');
        }
    };

    const handleAssign = async () => {
        if (!selectedReviewer) return;
        setAssigning(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/blogs/${id}/assign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reviewerId: selectedReviewer })
            });

            if (response.ok) {
                toast.success('Reviewer assigned successfully');
                setSelectedReviewer('');
                fetchBlog();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to assign reviewer');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setAssigning(false);
        }
    };

    const handleDecision = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/blogs/${id}/decision`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    decision: decisionType,
                    comments: decisionComments
                })
            });

            if (response.ok) {
                toast.success(`Blog status updated to ${decisionType}`);
                setShowDecisionModal(false);
                fetchBlog();
            } else {
                toast.error('Failed to record decision');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePublish = async () => {
        if (!confirm('Are you sure you want to publish this blog post?')) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/blogs/${id}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Blog post published successfully!');
                fetchBlog();
            } else {
                toast.error('Failed to publish blog');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold">Loading blog review panel...</p>
                </div>
            </div>
        );
    }

    if (!blog) return <div>Blog not found.</div>;

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            under_review: 'bg-blue-100 text-blue-800 border-blue-200',
            accepted: 'bg-green-100 text-green-800 border-green-200',
            published: 'bg-green-500 text-white border-green-600',
            rejected: 'bg-red-100 text-red-800 border-red-200',
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/editor/blogs" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{blog.title}</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusBadge(blog.status)}`}>
                                        {blog.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-gray-400">ID: {blog.id}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {blog.status !== 'published' && (
                                <>
                                    <button
                                        onClick={() => { setDecisionType('accepted'); setShowDecisionModal(true); }}
                                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => { setDecisionType('rejected'); setShowDecisionModal(true); }}
                                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                                    >
                                        Reject
                                    </button>
                                    {blog.status === 'accepted' && (
                                        <button
                                            onClick={handlePublish}
                                            className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                                        >
                                            Publish Now
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Blog Preview Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {blog.featuredImageUrl && (
                                <div className="h-64 w-full relative">
                                    <img src={blog.featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{blog.title}</h2>
                                        <p className="text-gray-500 font-medium italic">{blog.excerpt}</p>
                                    </div>
                                    <Link href={`/blogs/${blog.slug}`} target="_blank" className="text-primary font-bold text-sm hover:underline">View Public Link ↗</Link>
                                </div>

                                <div className="prose prose-lg max-w-none prose-slate prose-headings:text-primary prose-a:text-primary" dangerouslySetInnerHTML={{ __html: blog.content }}></div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h9m-6.75-12a1.5 1.5 0 0 0-1.5 1.5v15l2.25-2.25h13.5a1.5 1.5 0 0 0 1.5-1.5V3a1.5 1.5 0 0 0-1.5-1.5H7.75Z" />
                                </svg>
                                Reviewer Feedback
                            </h3>
                            
                            {blog.reviews.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium">No reviews have been assigned or submitted yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {blog.reviews.map((review) => (
                                        <div key={review.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">R{review.reviewerNumber}</div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{review.reviewer.name}</h4>
                                                        <p className="text-xs text-gray-400">{review.reviewer.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                                                    review.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                }`}>
                                                    {review.status}
                                                </span>
                                            </div>

                                            {review.status === 'completed' ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Recommendation</p>
                                                        <p className={`font-bold ${review.decision === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {review.decision?.toUpperCase() || 'NO DECISION'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Comments to Author</p>
                                                        <p className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-xl shadow-sm border border-gray-100">{review.commentsToAuthor || 'No comments provided.'}</p>
                                                    </div>
                                                    {review.commentsToEditor && (
                                                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Confidential to Editor</p>
                                                            <p className="text-sm text-primary/80 leading-relaxed italic">{review.commentsToEditor}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Waiting for reviewer response...</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Author Info */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Author Information</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-gray-900 truncate">{blog.author.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{blog.author.email}</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">Submitted on</span>
                                <span className="text-sm font-bold text-gray-700">{new Date(blog.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Assignment Panel */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                </svg>
                                Assign Reviewer
                            </h3>
                            <div className="space-y-4">
                                <select
                                    value={selectedReviewer}
                                    onChange={(e) => setSelectedReviewer(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white text-sm"
                                >
                                    <option value="">Select a reviewer...</option>
                                    {reviewers.map((rev) => (
                                        <option key={rev.id} value={rev.id}>{rev.name} ({rev.email})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAssign}
                                    disabled={!selectedReviewer || assigning}
                                    className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {assigning ? 'Assigning...' : 'Assign Reviewer'}
                                </button>
                                <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold pt-2">Only users with 'reviewer' role appear here</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decision Modal */}
            {showDecisionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Record Decision</h3>
                            <p className="text-gray-500 mb-6">Set the review decision for this blog post. This will notify the author.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Selected Decision</label>
                                    <div className={`px-4 py-3 rounded-xl border text-sm font-black uppercase tracking-widest w-fit ${
                                        decisionType === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                    }`}>
                                        {decisionType}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Internal / External Feedback</label>
                                    <textarea
                                        value={decisionComments}
                                        onChange={(e) => setDecisionComments(e.target.value)}
                                        rows={4}
                                        placeholder="Add any comments or instructions for the author..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm"
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowDecisionModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDecision}
                                        disabled={isSubmitting}
                                        className={`flex-1 px-6 py-3 text-white font-bold rounded-xl shadow-lg transition-all ${
                                            decisionType === 'accepted' ? 'bg-green-600 shadow-green-200 hover:bg-green-700' : 'bg-red-600 shadow-red-200 hover:bg-red-700'
                                        }`}
                                    >
                                        {isSubmitting ? 'Recording...' : 'Record Decision'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
