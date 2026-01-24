'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ResponsiveTable from "@/components/ui/ResponsiveTable";

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

    const columns = [
        {
            header: "Order",
            accessor: "displayOrder" as keyof Journal,
            className: "text-gray-500"
        },
        {
            header: "Code",
            accessor: "code" as keyof Journal,
            className: "font-semibold text-gray-900"
        },
        {
            header: "Name",
            accessor: "fullName" as keyof Journal,
            className: "text-gray-900"
        },
        {
            header: "ISSN",
            accessor: (journal: Journal) => journal.issn || '-',
            className: "text-gray-500"
        },
        {
            header: "Stats",
            accessor: (journal: Journal) => `${journal._count.articles} articles`,
            className: "text-gray-500"
        },
        {
            header: "Status",
            accessor: "isActive" as keyof Journal,
            render: (journal: Journal) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(journal.id, journal.isActive);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${journal.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                >
                    {journal.isActive ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: "Actions",
            accessor: "id" as keyof Journal,
            className: "text-right",
            render: (journal: Journal) => (
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Manage Journals</h1>
                            <p className="mt-1 text-gray-600">Create and manage academic journals</p>
                        </div>
                        <div className="flex space-x-4 w-full sm:w-auto">
                            <Link href="/editor" className="btn-secondary text-center flex-1 sm:flex-none">
                                ← Back
                            </Link>
                            <Link href="/editor/journals/new" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 text-center flex-1 sm:flex-none">
                                + Create
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ResponsiveTable<Journal>
                    columns={columns}
                    data={journals}
                    keyExtractor={(item) => item.id}
                    emptyMessage="No journals found. Create one to get started."
                />
            </div>
        </div>
    );
}
