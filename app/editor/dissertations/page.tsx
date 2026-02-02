
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function DissertationsPage() {
    const router = useRouter();
    const [dissertations, setDissertations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Auth Check State
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        university: '',
        degreeType: 'masters',
        authorId: '',
        year: new Date().getFullYear(),
        status: 'pending'
    });

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthorized) fetchData();
    }, [page, isAuthorized]);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        try {
            const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (['super_admin', 'mother_admin'].includes(data.user?.role)) {
                setIsAuthorized(true);
            } else {
                router.push('/editor'); // Redirect if not super admin
            }
        } catch (e) {
            router.push('/login');
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/dissertations?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setDissertations(data.dissertations || []);
            setTotalPages(data.pagination?.pages || 1);
        } catch (e) {
            toast.error("Failed to load dissertations");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = '/api/editor/dissertations';
            const method = selectedItem ? 'PATCH' : 'POST';
            const body = selectedItem ? { ...formData, id: selectedItem.id } : formData;

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success(selectedItem ? 'Dissertation updated' : 'Dissertation created');
            setIsModalOpen(false);
            fetchData();
        } catch (e) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/editor/dissertations?id=${selectedItem.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Dissertation deleted");
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    const openEdit = (item: any) => {
        setSelectedItem(item);
        setFormData({
            title: item.title,
            abstract: item.abstract || '',
            university: item.university,
            degreeType: item.degreeType,
            authorId: item.authorId || '',
            year: item.submissionDate ? new Date(item.submissionDate).getFullYear() : new Date().getFullYear(),
            status: item.status
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setSelectedItem(null);
        setFormData({
            title: '',
            abstract: '',
            university: '',
            degreeType: 'masters',
            authorId: '',
            year: new Date().getFullYear(),
            status: 'pending'
        });
        setIsModalOpen(true);
    };

    if (isLoading && !isAuthorized) return <div className="p-8 text-center">Loading...</div>;

    const columns = [
        { header: "Title", accessor: "title", className: "font-medium" },
        { header: "University", accessor: "university" },
        { header: "Type", accessor: "degreeType", render: (item: any) => <span className="uppercase text-xs font-bold bg-gray-100 px-2 py-1 rounded">{item.degreeType}</span> },
        { header: "Status", accessor: "status" },
        {
            header: "Actions",
            accessor: "id",
            className: "text-right",
            render: (item: any) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => { setSelectedItem(item); setIsDeleteModalOpen(true); }} className="text-red-600 hover:underline text-sm">Delete</button>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">Manage Dissertations</h1>
                        <p className="mt-1 text-gray-600">Super Admin Access Only</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openCreate} className="btn-primary">+ New Dissertation</button>
                        <Link href="/editor" className="btn-secondary">Back</Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <ResponsiveTable
                    columns={columns}
                    data={dissertations}
                    keyExtractor={(i) => i.id}
                    emptyMessage="No dissertations found."
                />
                {/* Pagination - Reuse logic from other pages */}
                {/* Simplified for MVP -> Pages handled by useEffect */}
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{selectedItem ? 'Edit' : 'Create'} Dissertation</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Title</label>
                                <input required className="w-full border rounded p-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Abstract</label>
                                <textarea required className="w-full border rounded p-2 h-24" value={formData.abstract} onChange={e => setFormData({ ...formData, abstract: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">University</label>
                                    <input required className="w-full border rounded p-2" value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Year</label>
                                    <input type="number" required className="w-full border rounded p-2" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Author User ID (UUID)</label>
                                <input required className="w-full border rounded p-2" value={formData.authorId} onChange={e => setFormData({ ...formData, authorId: e.target.value })} placeholder="UUID of the existing user" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Degree Type</label>
                                <select className="w-full border rounded p-2" value={formData.degreeType} onChange={e => setFormData({ ...formData, degreeType: e.target.value })}>
                                    <option value="masters">Masters</option>
                                    <option value="phd">PhD</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Dissertation"
                message="Are you sure you want to delete this dissertation?"
                isDestructive={true}
            />
        </div>
    );
}
