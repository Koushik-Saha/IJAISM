
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function ConferencesPage() {
    const router = useRouter();
    const [conferences, setConferences] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        acronym: '',
        startDate: '',
        endDate: '',
        venue: '',
        city: '',
        country: '',
        description: '',
        status: 'upcoming',
        brochureUrl: '',
        callForPapersUrl: ''
    });

    useEffect(() => { checkAuth(); }, []);
    useEffect(() => { if (isAuthorized) fetchData(); }, [page, isAuthorized]);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        try {
            const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (['super_admin', 'mother_admin'].includes(data.user?.role)) setIsAuthorized(true);
            else router.push('/editor');
        } catch (e) { router.push('/login'); }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/conferences?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setConferences(data.conferences || []);
            setTotalPages(data.pagination?.pages || 1);
        } catch (e) { toast.error("Failed to load conferences"); }
        finally { setIsLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = selectedItem
                ? `/api/editor/conferences/${selectedItem.id}`
                : '/api/editor/conferences';
            const method = selectedItem ? 'PATCH' : 'POST';
            // For PATCH, we don't need to send the ID in the body as it's in the URL
            const body = formData;

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to save');
            toast.success(selectedItem ? 'Conference updated' : 'Conference created');
            setIsModalOpen(false);
            fetchData();
        } catch (e) { toast.error("Operation failed"); }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/editor/conferences/${selectedItem.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            toast.success("Conference deleted");
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (e) { toast.error("Delete failed"); }
    };

    const openEdit = (item: any) => {
        setSelectedItem(item);
        setFormData({
            title: item.title,
            acronym: item.acronym || '',
            startDate: item.startDate ? item.startDate.split('T')[0] : '',
            endDate: item.endDate ? item.endDate.split('T')[0] : '',
            venue: item.venue || '',
            city: item.city || '',
            country: item.country || '',
            description: item.description || '',
            status: item.status,
            brochureUrl: item.brochureUrl || '',
            callForPapersUrl: item.callForPapersUrl || ''
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setSelectedItem(null);
        setFormData({
            title: '',
            acronym: '',
            startDate: '',
            endDate: '',
            venue: '',
            city: '',
            country: '',
            description: '',
            status: 'upcoming',
            brochureUrl: '',
            callForPapersUrl: ''
        });
        setIsModalOpen(true);
    };

    if (isLoading && !isAuthorized) return <div className="p-8 text-center">Loading...</div>;

    const columns = [
        { header: "Title", accessor: "title", className: "font-medium" },
        {
            header: "Dates",
            accessor: "startDate",
            render: (item: any) => (
                <span className="text-sm">
                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                </span>
            )
        },
        { header: "Venue", accessor: "venue", render: (item: any) => <span className="text-sm">{item.venue}, {item.city}</span> },
        { header: "Status", accessor: "status", render: (item: any) => <span className="uppercase text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">{item.status}</span> },
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
                        <h1 className="text-3xl font-bold text-primary">Manage Conferences</h1>
                        <p className="mt-1 text-gray-600">Super Admin Access Only</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openCreate} className="btn-primary">+ New Conference</button>
                        <Link href="/editor" className="btn-secondary">Back</Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <ResponsiveTable
                    columns={columns}
                    data={conferences}
                    keyExtractor={(i) => i.id}
                    emptyMessage="No conferences found."
                />
                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{selectedItem ? 'Edit' : 'Create'} Conference</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm font-bold mb-1">Title</label><input required className="w-full border rounded p-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold mb-1">Start Date</label><input type="date" required className="w-full border rounded p-2" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} /></div>
                                <div><label className="block text-sm font-bold mb-1">End Date</label><input type="date" required className="w-full border rounded p-2" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div>
                            </div>

                            <div><label className="block text-sm font-bold mb-1">Venue</label><input required className="w-full border rounded p-2" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} /></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold mb-1">City</label><input required className="w-full border rounded p-2" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
                                <div><label className="block text-sm font-bold mb-1">Country</label><input required className="w-full border rounded p-2" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} /></div>
                            </div>

                            <div><label className="block text-sm font-bold mb-1">Brochure URL</label><input className="w-full border rounded p-2" value={formData.brochureUrl} onChange={e => setFormData({ ...formData, brochureUrl: e.target.value })} placeholder="https://..." /></div>
                            <div><label className="block text-sm font-bold mb-1">Call for Papers URL</label><input className="w-full border rounded p-2" value={formData.callForPapersUrl} onChange={e => setFormData({ ...formData, callForPapersUrl: e.target.value })} placeholder="https://..." /></div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Status</label>
                                <select className="w-full border rounded p-2" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
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
                title="Delete Conference"
                message="Are you sure you want to delete this conference?"
                isDestructive={true}
            />
        </div>
    );
}
