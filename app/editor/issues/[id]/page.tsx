"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function IssueDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [issue, setIssue] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) fetchIssue();
    }, [id]);

    const fetchIssue = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/issues/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setIssue(data.issue);
            } else {
                toast.error(data.error || "Failed to load issue");
                router.push('/editor/issues');
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load issue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this issue?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/issues/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                toast.success("Issue deleted");
                router.push('/editor/issues');
            } else {
                toast.error(data.error || "Failed to delete");
            }
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (!issue) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <Link href="/editor/issues" className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">
                        ← Back to Issues
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Vol {issue.volume}, Issue {issue.issue} ({issue.year})</h1>
                            <p className="text-gray-600 mt-1">{issue.journal.fullName}</p>
                            {issue.title && <p className="text-sm text-gray-500 italic mt-1">{issue.title}</p>}
                            {issue.isSpecial && (
                                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-2 font-bold">
                                    Special Issue
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleDelete}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 border border-red-200 text-sm font-semibold"
                        >
                            Delete Issue
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-xl font-bold mb-4">Assigned Articles ({issue.articles.length})</h2>

                {issue.articles.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <span className="text-2xl">📄</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Articles Assigned</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            This issue is currently empty. To add content, go to the Articles list and assign accepted articles to this issue.
                        </p>
                        <Link
                            href="/editor/articles"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Browse Articles to Assign
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pages</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {issue.articles.map((article: any) => (
                                    <tr key={article.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <Link href={`/editor/articles/${article.id}`} className="text-sm font-medium text-primary hover:underline block truncate max-w-md">
                                                {article.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {article.author.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' :
                                                'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {formatStatus(article.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {article.pageStart ? `${article.pageStart} - ${article.pageEnd}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
