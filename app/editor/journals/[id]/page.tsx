'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

export default function EditJournalPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState({
        code: '',
        fullName: '',
        description: '',
        coverImageUrl: '',
        issn: '',
        impactFactor: '',
        displayOrder: '0',
        isActive: true
    });

    useEffect(() => {
        if (id) {
            fetchJournal();
        }
    }, [id]);

    const fetchJournal = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to fetch journal');
            const data = await response.json();
            const journal = data.journal;

            setFormData({
                code: journal.code,
                fullName: journal.fullName,
                description: journal.description || '',
                coverImageUrl: journal.coverImageUrl || '',
                issn: journal.issn || '',
                impactFactor: journal.impactFactor || '',
                displayOrder: journal.displayOrder.toString(),
                isActive: journal.isActive,
            });
        } catch (err) {
            toast.error('Error loading journal');
            router.push('/editor/journals');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update journal');
            }

            toast.success('Journal updated successfully');
            router.push('/editor/journals');
        } catch (err: any) {
            toast.error('Failed to update journal', {
                description: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-primary">Edit Journal</h1>
                        <Link href="/editor/journals" className="btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Journal Code (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Display Order
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.displayOrder}
                                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                className="input-field"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ISSN
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.issn}
                                onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Impact Factor
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={formData.impactFactor}
                                onChange={(e) => setFormData({ ...formData, impactFactor: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image URL
                            </label>
                            <input
                                type="url"
                                className="input-field"
                                value={formData.coverImageUrl}
                                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Active (Visible to public)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
