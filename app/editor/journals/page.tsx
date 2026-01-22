'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Journal {
    id: string;
    code: string;
    fullName: string;
    issn: string | null;
    isActive: boolean;
    displayOrder: number;
    _count: {
        articles: number;
    };
}

export default function AdminJournalsPage() {
    const router = useRouter();
    const [journals, setJournals] = useState<Journal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchJournals();
    }, []);

    const fetchJournals = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login?redirect=/editor/journals');
                return;
            }

            const response = await fetch('/api/editor/journals', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to fetch journals');
            const data = await response.json();
            setJournals(data.journals || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                fetchJournals(); // Refresh list
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Manage Journals</h1>
                            <p className="mt-1 text-gray-600">Create and manage academic journals</p>
                        </div>
                        <div className="space-x-4">
                            <Link href="/editor" className="btn-secondary">
                                ← Back to Dashboard
                            </Link>
                            <Link href="/editor/journals/new" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90">
                                + Create Journal
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">ISSN</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Stats</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {journals.map((journal) => (
                                <tr key={journal.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{journal.displayOrder}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{journal.code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{journal.fullName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{journal.issn || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{journal._count.articles} articles</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(journal.id, journal.isActive)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${journal.isActive
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                        >
                                            {journal.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <Link
                                            href={`/editor/journals/${journal.id}`}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {journals.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No journals found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
