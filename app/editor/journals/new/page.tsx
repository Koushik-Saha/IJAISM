'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewJournalPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/editor/journals', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create journal');
            }

            toast.success('Journal created successfully');
            router.push('/editor/journals');
        } catch (err: any) {
            toast.error('Failed to create journal', {
                description: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-primary">Create New Journal</h1>
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
                                placeholder="e.g. C5K"
                                className="input-field"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Unique identifier/acronym</p>
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
                            {isLoading ? 'Creating...' : 'Create Journal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
