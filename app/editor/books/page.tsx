
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function BooksPage() {
    const router = useRouter();
    const [books, setBooks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Form State (Simplified for MVP)
    const [formData, setFormData] = useState({
        title: '',
        isbn: '',
        publisher: '',
        year: new Date().getFullYear(),
        pages: 0,
        field: '',
        description: '',
        language: 'English',
        edition: '1st',
        format: 'Hardcover',
        price: '0.00',
        authors: ''
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
            const res = await fetch(`/api/editor/books?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setBooks(data.books || []);
            setTotalPages(data.pagination?.pages || 1);
        } catch (e) { toast.error("Failed to load books"); }
        finally { setIsLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = '/api/editor/books';
            const method = selectedItem ? 'PATCH' : 'POST';

            // Process authors from string to array
            const authorList = formData.authors.split(',').map(a => a.trim()).filter(a => a);

            const body = selectedItem ? { ...formData, authors: authorList, id: selectedItem.id } :
                { ...formData, authors: authorList, fullDescription: formData.description }; // Reuse description for fullDescription

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to save');
            toast.success(selectedItem ? 'Book updated' : 'Book created');
            setIsModalOpen(false);
            fetchData();
        } catch (e) { toast.error("Operation failed"); }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/editor/books?id=${selectedItem.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            toast.success("Book deleted");
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (e) { toast.error("Delete failed"); }
    };

    const openEdit = (item: any) => {
        setSelectedItem(item);
        setFormData({
            title: item.title,
            isbn: item.isbn,
            publisher: item.publisher,
            year: item.year,
            pages: item.pages,
            field: item.field,
            description: item.description,
            language: item.language,
            edition: item.edition,
            format: item.format,
            price: item.price,
            authors: item.authors ? item.authors.join(', ') : ''
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setSelectedItem(null);
        setFormData({
            title: '',
            isbn: '',
            publisher: '',
            year: new Date().getFullYear(),
            pages: 0,
            field: '',
            description: '',
            language: 'English',
            edition: '1st',
            format: 'Hardcover',
            price: '0.00',
            authors: ''
        });
        setIsModalOpen(true);
    };

    if (isLoading && !isAuthorized) return <div className="p-8 text-center">Loading...</div>;

    const columns = [
        { header: "Title", accessor: "title", className: "font-medium" },
        { header: "ISBN", accessor: "isbn" },
        { header: "Publisher", accessor: "publisher" },
        { header: "Year", accessor: "year", className: "w-20" },
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
                        <h1 className="text-3xl font-bold text-primary">Manage Books</h1>
                        <p className="mt-1 text-gray-600">Super Admin Access Only</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openCreate} className="btn-primary">+ New Book</button>
                        <Link href="/editor" className="btn-secondary">Back</Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <ResponsiveTable
                    columns={columns}
                    data={books}
                    keyExtractor={(i) => i.id}
                    emptyMessage="No books found."
                />
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
                        <h2 className="text-xl font-bold mb-4">{selectedItem ? 'Edit' : 'Create'} Book</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold mb-1">Title</label><input required className="w-full border rounded p-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                                <div><label className="block text-sm font-bold mb-1">ISBN</label><input required className="w-full border rounded p-2" value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} /></div>

                                <div><label className="block text-sm font-bold mb-1">Publisher</label><input required className="w-full border rounded p-2" value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} /></div>
                                <div><label className="block text-sm font-bold mb-1">Year</label><input type="number" required className="w-full border rounded p-2" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} /></div>

                                <div><label className="block text-sm font-bold mb-1">Field</label><input required className="w-full border rounded p-2" value={formData.field} onChange={e => setFormData({ ...formData, field: e.target.value })} /></div>
                                <div><label className="block text-sm font-bold mb-1">Price</label><input required className="w-full border rounded p-2" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} /></div>

                                <div><label className="block text-sm font-bold mb-1">Pages</label><input type="number" required className="w-full border rounded p-2" value={formData.pages} onChange={e => setFormData({ ...formData, pages: parseInt(e.target.value) })} /></div>
                                <div><label className="block text-sm font-bold mb-1">Edition</label><input required className="w-full border rounded p-2" value={formData.edition} onChange={e => setFormData({ ...formData, edition: e.target.value })} /></div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-bold mb-1">Authors (comma separated)</label>
                                    <input required className="w-full border rounded p-2" value={formData.authors} onChange={e => setFormData({ ...formData, authors: e.target.value })} placeholder="Author 1, Author 2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Description</label>
                                <textarea required className="w-full border rounded p-2" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
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
                title="Delete Book"
                message="Are you sure you want to delete this book?"
                isDestructive={true}
            />
        </div>
    );
}
