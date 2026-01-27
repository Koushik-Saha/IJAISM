
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Card from "@/components/ui/Card";

interface JournalIssue {
    id: string;
    title: string | null;
    volume: number;
    issue: number;
    year: number;
    isCurrent: boolean;
    isSpecial: boolean;
    coverUrl: string | null;
}

export default function ManageIssuesPage() {
    const params = useParams();
    const router = useRouter();
    const journalId = params?.id as string;

    const [issues, setIssues] = useState<JournalIssue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentIssueId, setCurrentIssueId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        volume: '',
        issue: '',
        year: new Date().getFullYear().toString(),
        title: '',
        isSpecial: false,
        isCurrent: false,
        coverUrl: ''
    });

    useEffect(() => {
        if (journalId) fetchIssues();
    }, [journalId]);

    const fetchIssues = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/journals/${journalId}/issues`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to load issues");
            const data = await res.json();
            setIssues(data.issues || []);
        } catch (err) {
            toast.error("Error loading issues");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setModalMode('create');
        setFormData({
            volume: '',
            issue: '',
            year: new Date().getFullYear().toString(),
            title: '',
            isSpecial: false,
            isCurrent: false,
            coverUrl: ''
        });
        setShowModal(true);
    };

    const handleEdit = (issue: JournalIssue) => {
        setModalMode('edit');
        setCurrentIssueId(issue.id);
        setFormData({
            volume: issue.volume.toString(),
            issue: issue.issue.toString(),
            year: issue.year.toString(),
            title: issue.title || '',
            isSpecial: issue.isSpecial,
            isCurrent: issue.isCurrent,
            coverUrl: issue.coverUrl || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this issue?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/journals/${journalId}/issues/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Issue deleted");
            fetchIssues();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem('token');
            const url = modalMode === 'create'
                ? `/api/editor/journals/${journalId}/issues`
                : `/api/editor/journals/${journalId}/issues/${currentIssueId}`;

            const method = modalMode === 'create' ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save");
            }

            toast.success(`Issue ${modalMode === 'create' ? 'created' : 'updated'}`);
            setShowModal(false);
            fetchIssues();

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <nav className="text-sm text-gray-500 mb-1">
                                <Link href="/editor/journals" className="hover:text-primary">Journals</Link>
                                {" / "}
                                <Link href={`/editor/journals/${journalId}`} className="hover:text-primary">Edit Journal</Link>
                            </nav>
                            <h1 className="text-2xl font-bold text-gray-900">Manage Issues</h1>
                        </div>
                        <button onClick={handleCreate} className="btn-primary">
                            + Add New Issue
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume/Issue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {issues.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                            No issues found. Create one above.
                                        </td>
                                    </tr>
                                ) : (
                                    issues.map((issue) => (
                                        <tr key={issue.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    Vol {issue.volume}, Issue {issue.issue}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {issue.year}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {issue.title || '-'}
                                                {issue.isSpecial && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Special</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {issue.isCurrent && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                                                        Current Issue
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(issue)}
                                                    className="text-primary hover:text-primary-dark mr-4"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(issue.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {modalMode === 'create' ? 'Add New Issue' : 'Edit Issue'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Volume</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-field mt-1"
                                        value={formData.volume}
                                        onChange={e => setFormData({ ...formData, volume: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Issue</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-field mt-1"
                                        value={formData.issue}
                                        onChange={e => setFormData({ ...formData, issue: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="number"
                                    required
                                    className="input-field mt-1"
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field mt-1"
                                    placeholder="e.g. Special Issue on AI"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={formData.isSpecial}
                                        onChange={e => setFormData({ ...formData, isSpecial: e.target.checked })}
                                    />
                                    <span className="text-sm text-gray-700">Special Issue</span>
                                </label>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={formData.isCurrent}
                                        onChange={e => setFormData({ ...formData, isCurrent: e.target.checked })}
                                    />
                                    <span className="text-sm text-gray-700">Set as Current Issue</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
