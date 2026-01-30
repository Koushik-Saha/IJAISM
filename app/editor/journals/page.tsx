'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
                const jRes = await fetch('/api/editor/journals', { headers: { Authorization: `Bearer ${token}` } });
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
    }, []);

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
                <Link
                    href={`/editor/journals/${journal.id}`}
                    className="text-primary hover:text-primary/80 font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    Edit
                </Link>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Manage Journals</h1>
                            <p className="mt-1 text-gray-600">
                                {isAdmin ? 'Assign Editors and manage all journals' : 'Your Managed Journals'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/editor" className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Back</Link>
                            {isAdmin && (
                                <Link href="/editor/journals/new" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">+ Create Journal</Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ResponsiveTable
                    columns={columns}
                    data={journals.slice((page - 1) * 10, page * 10)}
                    keyExtractor={(item: any) => item.id}
                    emptyMessage="No journals found."
                />

                {/* Pagination Controls */}
                {journals.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <p className="text-sm text-gray-600">
                            Showing page {page} of {Math.ceil(journals.length / 10)}
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

                            {Array.from({ length: Math.min(5, Math.ceil(journals.length / 10)) }, (_, i) => {
                                const totalPages = Math.ceil(journals.length / 10);
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
                                onClick={() => setPage(p => Math.min(Math.ceil(journals.length / 10), p + 1))}
                                disabled={page === Math.ceil(journals.length / 10)}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 bg-white"
                            >
                                ›
                            </button>
                            <button
                                onClick={() => setPage(Math.ceil(journals.length / 10))}
                                disabled={page === Math.ceil(journals.length / 10)}
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
