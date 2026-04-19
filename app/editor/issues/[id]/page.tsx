"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function IssueDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [issue, setIssue] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        volume: '',
        issue: '',
        year: '',
        isSpecial: false,
        isCurrent: false,
        coverUrl: ''
    });

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
                const iss = data.data?.issue;
                if (!iss) {
                    toast.error("Issue not found");
                    router.push('/editor/issues');
                    return;
                }
                setIssue(iss);
                setFormData({
                    title: iss.title || '',
                    volume: String(iss.volume),
                    issue: String(iss.issue),
                    year: String(iss.year),
                    isSpecial: iss.isSpecial || false,
                    isCurrent: iss.isCurrent || false,
                    coverUrl: iss.coverUrl || ''
                });
            } else {
                toast.error(data.error?.message || "Failed to load issue");
                router.push('/editor/issues');
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load issue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const fd = new FormData();
            fd.append('file', file);
            fd.append('fileType', 'issue-covers');

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });

            const data = await res.json();
            if (res.ok && data.data?.url) {
                setFormData(prev => ({ ...prev, coverUrl: data.data.url }));
                toast.success('Cover image uploaded');
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/issues/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Issue updated successfully');
                setIssue(data.data?.issue || issue);
            } else {
                toast.error(data.error?.message || 'Failed to update');
            }
        } catch (err) {
            toast.error('Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this issue? This cannot be undone.")) return;

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
        return status.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
    if (!issue) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <Link href="/editor/issues" className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">
                        ← Back to Issues
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">
                                Vol {issue.volume}, Issue {issue.issue} ({issue.year})
                            </h1>
                            <p className="text-gray-600 mt-1">{issue.journal?.fullName}</p>
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

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Edit Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-5">Edit Issue Details</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Special Issue on AI"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                                        value={formData.volume}
                                        onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                                        value={formData.issue}
                                        onChange={(e) => setFormData(prev => ({ ...prev, issue: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        min="2000"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                                        value={formData.year}
                                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                {formData.coverUrl && (
                                    <div className="mb-3 relative w-24 h-32 border rounded overflow-hidden">
                                        <img
                                            src={formData.coverUrl}
                                            alt="Issue cover"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, coverUrl: '' }))}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : formData.coverUrl ? 'Replace Cover Image' : 'Upload Cover Image'}
                                </button>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP, max 10MB</p>
                            </div>

                            <div className="space-y-2 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-primary rounded"
                                        checked={formData.isSpecial}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isSpecial: e.target.checked }))}
                                    />
                                    <span className="text-sm text-gray-700">Special Issue</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-primary rounded"
                                        checked={formData.isCurrent}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isCurrent: e.target.checked }))}
                                    />
                                    <span className="text-sm text-gray-700">Mark as Current Issue</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving || isUploading}
                                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Assigned Articles */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">
                                Assigned Articles ({issue.articles?.length || 0})
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                To assign articles, go to the{' '}
                                <Link href="/editor/articles" className="text-primary hover:underline font-medium">
                                    Articles list
                                </Link>{' '}
                                and use the "Assign to Issue" panel.
                            </p>
                        </div>

                        {!issue.articles || issue.articles.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <span className="text-2xl">📄</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Articles Assigned</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    This issue is currently empty. Assign accepted articles from the Articles list.
                                </p>
                            </div>
                        ) : (
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
                                                <Link href={`/editor/articles/${article.id}`} className="text-sm font-medium text-primary hover:underline block truncate max-w-xs">
                                                    {article.title}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {article.author?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    article.status === 'published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {formatStatus(article.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {article.pageStart ? `${article.pageStart}–${article.pageEnd}` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
