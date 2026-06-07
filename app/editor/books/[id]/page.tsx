'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import FileUploadButton from "@/components/ui/FileUploadButton";

export default function EditBookPage({ params: routeParams }: { params?: any }) {
    const router = useRouter();
    const clientParams = useParams();

    const [id, setId] = useState<string>('');
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

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
        authors: '',
        coverImageUrl: '',
        pdfUrl: ''
    });

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (routeParams) {
            Promise.resolve(routeParams).then(p => {
                if (p?.id) setId(p.id);
            });
        } else if (clientParams?.id) {
            setId(clientParams.id as string);
        }
    }, [routeParams, clientParams]);

    useEffect(() => {
        if (isAuthorized && id && id !== 'undefined') {
            fetchBook();
        }
    }, [isAuthorized, id]);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (['super_admin', 'mother_admin'].includes(data.user?.role)) {
                setIsAuthorized(true);
            } else {
                router.push('/editor');
            }
        } catch (e) {
            router.push('/login');
        }
    };

    const fetchBook = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/books/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const book = data.data?.book || data.book;

            setFormData({
                title: book.title || '',
                isbn: book.isbn || '',
                publisher: book.publisher || '',
                year: book.year || new Date().getFullYear(),
                pages: book.pages || 0,
                field: book.field || '',
                description: book.description || '',
                language: book.language || 'English',
                edition: book.edition || '1st',
                format: book.format || 'Hardcover',
                price: book.price || '0.00',
                authors: book.authors ? book.authors.join(', ') : '',
                coverImageUrl: book.coverImageUrl || '',
                pdfUrl: book.pdfUrl || ''
            });
        } catch (e: any) {
            toast.error(`Failed to load book details: ${e.message}`);
            router.push('/editor/books');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem('token');
            // Process authors from string to array
            const authorList = formData.authors.split(',').map(a => a.trim()).filter(a => a);

            const body = {
                ...formData,
                authors: authorList,
                fullDescription: formData.description // map description to fullDescription for API consistency
            };

            const res = await fetch(`/api/editor/books/${id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to save');
            }

            toast.success('Book updated successfully');
            router.push('/editor/books');
        } catch (e: any) {
            toast.error(e.message || "Operation failed");
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold">Loading book details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h1 className="text-3xl font-bold text-primary">Edit Book</h1>
                        <Link href="/editor/books" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                            ← Back
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Book Title (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ISBN (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.isbn}
                                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Publisher (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.publisher}
                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year (Required)
                            </label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.field}
                                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pages (Required)
                            </label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={formData.pages}
                                onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Edition (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.edition}
                                onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Language
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.language}
                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Format
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.format}
                                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Authors (comma separated)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.authors}
                                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                placeholder="Author 1, Author 2"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image
                            </label>
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="w-24 h-32 bg-gray-200 rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                                    {formData.coverImageUrl ? (
                                        <img src={formData.coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] text-gray-400 font-bold uppercase px-1 text-center">No Cover</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <FileUploadButton
                                        onUploadSuccess={(url) => setFormData({ ...formData, coverImageUrl: url })}
                                        accept="image/*"
                                        label={formData.coverImageUrl ? "Change Image" : "Upload Image"}
                                        fileType="books"
                                    />
                                    {formData.coverImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                                            className="block text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                                        >
                                            Remove Image
                                        </button>
                                    )}
                                    <p className="text-[10px] text-gray-500">Recommended: Portrait aspect ratio (3:4). Max 10MB.</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PDF URL
                            </label>
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <input
                                    type="text"
                                    className="input-field flex-1"
                                    value={formData.pdfUrl}
                                    onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                                    placeholder="Enter URL or upload PDF below"
                                />
                                <FileUploadButton
                                    onUploadSuccess={(url) => setFormData({ ...formData, pdfUrl: url })}
                                    accept="application/pdf"
                                    label="Upload PDF"
                                    fileType="books"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                required
                                rows={4}
                                className="input-field"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Link href="/editor/books" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
