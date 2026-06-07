'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search } from "lucide-react";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FileUploadButton from "@/components/ui/FileUploadButton";

export default function DissertationsPage() {
    const router = useRouter();
    const [dissertations, setDissertations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Auth Check State
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"submissions" | "published">("submissions");

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        university: '',
        degreeType: 'masters',
        authorId: '',
        year: new Date().getFullYear(),
        status: 'pending',
        coverImageUrl: '',
        pdfUrl: ''
    });

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthorized) fetchData();
    }, [page, isAuthorized, appliedSearch, activeTab]);

    useEffect(() => {
        setPage(1);
    }, [appliedSearch, activeTab]);

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
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                type: activeTab
            });
            if (appliedSearch) queryParams.append('search', appliedSearch);

            const res = await fetch(`/api/editor/dissertations?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setDissertations(data.data?.dissertations || []);
            setTotalPages(data.data?.pagination?.pages || 1);
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
            status: item.status,
            coverImageUrl: item.coverImageUrl || '',
            pdfUrl: item.pdfUrl || ''
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
            status: 'pending',
            coverImageUrl: '',
            pdfUrl: ''
        });
        setIsModalOpen(true);
    };

    if (isLoading && !isAuthorized) return <div className="p-8 text-center">Loading...</div>;

    const columns = activeTab === "submissions" ? [
        {
            header: "Title",
            accessor: "title",
            className: "font-medium"
        },
        {
            header: "Author",
            accessor: "author",
            render: (item: any) => item.author?.name || item.author?.email || 'N/A'
        },
        {
            header: "Status",
            accessor: "status",
            render: (item: any) => {
                const badges: Record<string, string> = {
                    submitted: 'bg-yellow-100 text-yellow-800',
                    under_review: 'bg-blue-100 text-blue-800',
                    published: 'bg-green-100 text-green-800',
                    rejected: 'bg-red-100 text-red-800',
                    revision_requested: 'bg-orange-100 text-orange-800',
                    waiting_for_editor: 'bg-purple-100 text-purple-800',
                    accepted: 'bg-green-100 text-green-800',
                };
                const badgeClass = badges[item.status] || 'bg-gray-100 text-gray-800';
                const label = item.status?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown';
                return <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${badgeClass}`}>{label}</span>;
            }
        },
        {
            header: "Date Submitted",
            accessor: "createdAt",
            render: (item: any) => new Date(item.createdAt).toLocaleDateString()
        },
        {
            header: "Actions",
            accessor: "id",
            className: "text-right",
            render: (item: any) => (
                <div className="flex justify-end gap-2">
                    <Link href={`/editor/articles/${item.id}`} className="text-blue-600 hover:underline text-sm font-bold">Review</Link>
                </div>
            )
        }
    ] : [
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">Manage Dissertations</h1>
                        <p className="mt-1 text-gray-600">Super Admin Access Only</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/editor" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                            ← Back
                        </Link>
                        <Link href="/submit?type=dissertation" className="btn-primary font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 text-sm inline-block text-center">+ New Dissertation</Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Section */}
                <div className="mb-6 relative max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search dissertations by title, university, or author..."
                        className="block w-full pl-10 pr-32 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium shadow-sm"
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
                            className="px-6 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all active:scale-95"
                        >
                            Find
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab("submissions")}
                        className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
                            activeTab === "submissions"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Submissions Pipeline
                    </button>
                    <button
                        onClick={() => setActiveTab("published")}
                        className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
                            activeTab === "published"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Published Directory
                    </button>
                </div>

                <ResponsiveTable
                    columns={columns}
                    data={dissertations}
                    keyExtractor={(i) => i.id}
                    emptyMessage={activeTab === "submissions" ? "No dissertation submissions found." : "No published dissertations found."}
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 my-8">
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
                            <div>
                                <label className="block text-sm font-bold mb-1">Cover Image</label>
                                <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <div className="w-16 h-20 bg-gray-200 rounded border flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {formData.coverImageUrl ? (
                                            <img src={formData.coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] text-gray-400 font-bold uppercase px-1 text-center">No Cover</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <FileUploadButton onUploadSuccess={(url) => setFormData({ ...formData, coverImageUrl: url })} accept="image/*" label={formData.coverImageUrl ? "Change Image" : "Upload Image"} fileType="thesis" />
                                        {formData.coverImageUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                                                className="block text-[10px] text-red-600 hover:text-red-700 font-bold"
                                            >
                                                Remove Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">PDF URL</label>
                                <div className="flex gap-2">
                                    <input className="w-full border rounded p-2 flex-1" value={formData.pdfUrl} onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })} />
                                    <FileUploadButton onUploadSuccess={(url) => setFormData({ ...formData, pdfUrl: url })} accept="application/pdf" label="Upload PDF" fileType="thesis" />
                                </div>
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
