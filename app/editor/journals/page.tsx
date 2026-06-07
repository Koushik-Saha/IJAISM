'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Filter, ChevronDown } from "lucide-react";

import ResponsiveTable from "@/components/ui/ResponsiveTable";

interface Journal {
    id: string;
    code: string;
    fullName: string;
    issn: string | null;
    isActive: boolean;
    displayOrder: number;
    editorId?: string | null; // Added field
    _count: {
        articles: number;
    };
}

import ConfirmModal from "@/components/ui/ConfirmModal";

export default function AdminJournalsPage() {
    const router = useRouter();
    const [journals, setJournals] = useState<Journal[]>([]);
    const [editors, setEditors] = useState<any[]>([]); // List of available editors
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        journalId: string;
        editorId: string;
        message: string;
    }>({ isOpen: false, journalId: '', editorId: '', message: '' });

    useEffect(() => {
        const init = async () => {
            // 1. Get Me
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            try {
                const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                const meData = await meRes.json();
                setCurrentUser(meData.user);

                // 2. Fetch Journals
                let url = '/api/editor/journals';
                if (appliedSearch) {
                    url += `?search=${encodeURIComponent(appliedSearch)}`;
                }
                const jRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                const jData = await jRes.json();
                setJournals(jData.journals || []);

                // 3. Fetch Editors (only if admin)
                if (['super_admin', 'mother_admin'].includes(meData.user.role)) {
                    const eRes = await fetch('/api/editor/users?role=editor', { headers: { Authorization: `Bearer ${token}` } });
                    const eData = await eRes.json();
                    setEditors(eData.users || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [appliedSearch]);

    useEffect(() => {
        setPage(1);
    }, [appliedSearch, statusFilter]);

    const executeAssignment = async (journalId: string, editorId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/journals/${journalId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ editorId })
            });

            if (res.ok) {
                // Optimistic Update: Update current journal AND clear previous journal for this editor
                setJournals(prev => prev.map(j => {
                    if (j.id === journalId) return { ...j, editorId }; // Set new
                    if (j.id !== journalId && j.editorId === editorId) return { ...j, editorId: null }; // Clear old
                    return j;
                }));
                toast.success(editorId ? "Editor assigned successfully" : "Editor unassigned");
            } else {
                toast.error("Failed to assign editor");
            }
        } catch (e) {
            console.error("Assignment failed", e);
            toast.error("Assignment failed");
        }
    };

    const handleAssignEditor = (journalId: string, editorId: string) => {
        // Validation: Check if editor is already assigned to another journal
        if (editorId) {
            const existingAssignment = journals.find(j => j.editorId === editorId && j.id !== journalId);
            if (existingAssignment) {
                setConfirmModal({
                    isOpen: true,
                    journalId,
                    editorId,
                    message: `This editor is already assigned to "${existingAssignment.fullName}". Do you want to reassign them to this journal?`
                });
                return;
            }
        }
        // No conflict, proceed
        executeAssignment(journalId, editorId);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/editor/journals/${id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            setJournals(prev => prev.map(j => j.id === id ? { ...j, isActive: !currentStatus } : j));
        } catch (err) { console.error(err); }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isAdmin = currentUser && ['super_admin', 'mother_admin'].includes(currentUser.role);

    const filteredJournals = journals.filter(j => {
        if (statusFilter === 'active') return j.isActive === true;
        if (statusFilter === 'inactive') return j.isActive === false;
        return true;
    });

    const columns: any[] = [
        {
            header: "Code",
            accessor: "code",
            className: "font-semibold text-gray-900 w-20"
        },
        {
            header: "Name",
            accessor: "fullName",
            className: "text-gray-900"
        },
        {
            header: "Stats",
            accessor: (j: any) => (
                <Link
                    href={`/editor/articles?journalId=${j.id}`}
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {j._count?.articles || 0} articles
                </Link>
            ),
            className: "text-gray-500 w-32"
        },
        // NEW: Editor Assignment Column (Admin Only)
        ...(isAdmin ? [{
            header: "Assigned Editor",
            accessor: "editorId",
            render: (journal: any) => (
                <div className="flex items-center gap-2">
                    <select
                        className={`border rounded p-1 text-sm bg-white max-w-[200px] truncate ${!journal.editorId ? 'text-gray-500' : 'text-gray-900 font-medium'}`}
                        value={journal.editorId || ""}
                        onChange={(e) => handleAssignEditor(journal.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">-- Unassigned --</option>
                        {editors.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                        ))}
                    </select>
                    {journal.editorId && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAssignEditor(journal.id, ""); // Quick unassign
                            }}
                            className="text-gray-400 hover:text-red-500 px-1"
                            title="Unassign Editor"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )
        }] : []),
        {
            header: "Status",
            accessor: "isActive",
            render: (journal: any) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(journal.id, journal.isActive); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${journal.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                    {journal.isActive ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: "Actions",
            accessor: "id",
            className: "text-right",
            render: (journal: any) => (
                <div className="flex justify-end gap-3">
                    <Link
                        href={`/editor/articles?journalId=${journal.id}`}
                        className="text-gray-600 hover:text-primary font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        View
                    </Link>
                    <Link
                        href={`/editor/journals/${journal.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Edit
                    </Link>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Manage Journals</h1>
                            <p className="mt-1 text-gray-600">
                                {isAdmin ? 'Assign Editors and manage all journals' : 'Your Managed Journals'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/editor" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                                ← Back
                            </Link>
                            {isAdmin && (
                                <Link href="/editor/journals/new" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">+ Create Journal</Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search & Filter Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                    <div className="lg:col-span-8 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search journals by code or name..."
                            className="block w-full pl-11 pr-32 py-3.5 bg-white border-none rounded-2xl shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
                        />
                        <div className="absolute inset-y-1.5 right-1.5 flex gap-1">
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

                    <div className="lg:col-span-4 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            value={statusFilter}
                            className="block w-full pl-10 pr-10 py-3.5 bg-white border-none rounded-2xl shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-primary appearance-none transition-all text-sm font-bold text-gray-700 cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </div>

                <ResponsiveTable
                    columns={columns}
                    data={filteredJournals.slice((page - 1) * 10, page * 10)}
                    keyExtractor={(item: any) => item.id}
                    emptyMessage="No journals found."
                />

                {/* Pagination Controls */}
                {filteredJournals.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <p className="text-sm text-gray-600">
                            Showing page {page} of {Math.ceil(filteredJournals.length / 10)}
                        </p>

                        <div className="flex gap-1 items-center">
                            <button
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
                            >
                                «
                            </button>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
                            >
                                ‹
                            </button>

                            {Array.from({ length: Math.min(5, Math.ceil(filteredJournals.length / 10)) }, (_, i) => {
                                const totalPages = Math.ceil(filteredJournals.length / 10);
                                let start = Math.max(1, page - 2);
                                if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
                                const pNum = start + i;
                                if (pNum > totalPages) return null;

                                return (
                                    <button
                                        key={pNum}
                                        onClick={() => setPage(pNum)}
                                        className={`px-3 py-1 border rounded min-w-[32px] ${page === pNum ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        {pNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setPage(p => Math.min(Math.ceil(filteredJournals.length / 10), p + 1))}
                                disabled={page === Math.ceil(filteredJournals.length / 10)}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
                            >
                                ›
                            </button>
                            <button
                                onClick={() => setPage(Math.ceil(filteredJournals.length / 10))}
                                disabled={page === Math.ceil(filteredJournals.length / 10)}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
                            >
                                »
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    executeAssignment(confirmModal.journalId, confirmModal.editorId);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                title="Reassign Editor?"
                message={confirmModal.message}
                confirmLabel="Yes, Reassign"
            />
        </div>
    );
}
