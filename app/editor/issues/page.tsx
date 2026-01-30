"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function IssuesPage() {
    const router = useRouter();
    const [issues, setIssues] = useState<any[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        journalId: '',
        volume: '',
        issue: '',
        year: new Date().getFullYear(),
        title: '',
        isSpecial: false,
        description: ''
    });

    // List State
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [filters, setFilters] = useState({ search: '', journalId: '', year: '' });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        fetchData();
    }, [pagination.page, debouncedSearch, filters.journalId, filters.year]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            // Build query
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: debouncedSearch,
                ...(filters.journalId && { journalId: filters.journalId }),
                ...(filters.year && { year: filters.year })
            });

            // Fetch Issues
            const issuesRes = await fetch(`/api/editor/issues?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            const issuesData = await issuesRes.json();

            if (issuesRes.ok) {
                setIssues(issuesData.data?.issues || []);
                if (issuesData.data?.pagination) {
                    setPagination(prev => ({ ...prev, ...issuesData.data.pagination }));
                }
            } else {
                toast.error(issuesData.error || 'Failed to load issues');
            }

            // Fetch Journals (only once)
            if (journals.length === 0) {
                const journalsRes = await fetch('/api/editor/journals', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const journalsData = await journalsRes.json();
                const availableJournals = journalsData.journals || journalsData.data?.journals || [];
                setJournals(availableJournals);

                // Pre-select first journal only for CREATE form, not for filter
                if (availableJournals.length > 0 && !formData.journalId) {
                    setFormData(prev => ({ ...prev, journalId: availableJournals[0].id }));
                }
            }

        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load issues');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/editor/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    volume: parseInt(formData.volume as string),
                    issue: parseInt(formData.issue as string),
                    year: parseInt(formData.year as any)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create issue');
            }

            toast.success('Issue created successfully');
            setShowCreateModal(false);
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading && issues.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="md:flex justify-between items-center mb-4 md:mb-0">
                        <div>
                            <Link href="/editor" className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-primary">Manage Issues</h1>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 md:mt-0 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-sm text-sm"
                        >
                            + Create New Issue
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <input
                                type="text"
                                placeholder="Search by title, journal..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <div>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
                                value={filters.journalId}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, journalId: e.target.value }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            >
                                <option value="">All Journals</option>
                                {journals.map(j => (
                                    <option key={j.id} value={j.id}>{j.code}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <input
                                type="number"
                                placeholder="Year (e.g. 2025)"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                value={filters.year}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, year: e.target.value }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {issues.length === 0 && !isLoading ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="text-4xl mb-3">🔍</div>
                        <h3 className="text-lg font-medium text-gray-900">No issues found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadowoverflow-hidden border border-gray-200">
                        {isLoading && (
                            <div className="p-4 bg-yellow-50 text-yellow-800 text-sm text-center">
                                Refreshing results...
                            </div>
                        )}
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume / Issue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Articles</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {issues.map((issue) => (
                                    <tr
                                        key={issue.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/editor/issues/${issue.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{issue.journal.code}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{issue.journal.fullName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-bold">Vol {issue.volume}, Issue {issue.issue}</div>
                                            {issue.title && <div className="text-xs text-gray-500 italic">{issue.title}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {issue.year}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {issue._count.articles} articles
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {issue.isSpecial ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    Special Issue
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Regular
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {issues.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-200 gap-4">
                                <p className="text-sm text-gray-600">
                                    Showing page {pagination.page} of {pagination.pages}
                                </p>

                                <div className="flex gap-1 items-center">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white text-gray-700"
                                        title="First Page"
                                    >
                                        «
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white text-gray-700"
                                    >
                                        ‹
                                    </button>

                                    {/* Numbered Pages Logic */}
                                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                        // Logic to center the window
                                        let start = Math.max(1, pagination.page - 2);
                                        if (start + 4 > pagination.pages) start = Math.max(1, pagination.pages - 4);
                                        const pNum = start + i;
                                        if (pNum > pagination.pages) return null;

                                        return (
                                            <button
                                                key={pNum}
                                                onClick={() => setPagination(prev => ({ ...prev, page: pNum }))}
                                                className={`px-3 py-1 border rounded min-w-[32px] font-medium transition-colors ${pagination.page === pNum
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                                    }`}
                                            >
                                                {pNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white text-gray-700"
                                    >
                                        ›
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white text-gray-700"
                                        title="Last Page"
                                    >
                                        »
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Create New Issue</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
                                <select
                                    required
                                    className="w-full border rounded p-2"
                                    value={formData.journalId}
                                    onChange={(e) => setFormData({ ...formData, journalId: e.target.value })}
                                >
                                    <option value="">Select Journal</option>
                                    {journals.map(j => (
                                        <option key={j.id} value={j.id}>{j.fullName} ({j.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full border rounded p-2"
                                        value={formData.volume}
                                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full border rounded p-2"
                                        value={formData.issue}
                                        onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        min="2000"
                                        required
                                        className="w-full border rounded p-2"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Special Issue on AI"
                                    className="w-full border rounded p-2"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isSpecial"
                                    className="h-4 w-4 text-primary rounded"
                                    checked={formData.isSpecial}
                                    onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                                />
                                <label htmlFor="isSpecial" className="ml-2 text-sm text-gray-700">This is a Special Issue</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Create Issue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
