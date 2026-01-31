"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";

interface GeoStat {
    country: string;
    downloads: number;
}

interface SystemStat {
    users: number;
    articles: number;
    downloads: number;
    journals: number;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [geoStats, setGeoStats] = useState<GeoStat[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStat | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login?redirect=/admin/analytics');
                return;
            }

            const response = await fetch('/api/admin/analytics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setError("Access Denied: Super Admin or Mother Admin only.");
                    return;
                }
                throw new Error("Failed to fetch analytics");
            }

            const data = await response.json();
            setGeoStats(data.geolocation);
            setSystemStats(data.system);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-md text-center border border-red-200">
                    <h1 className="text-xl font-bold mb-2">Error</h1>
                    <p>{error}</p>
                    <Link href="/editor" className="mt-4 inline-block text-sm text-red-600 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate generic total for percentage
    const totalDownloads = geoStats.reduce((acc, curr) => acc + curr.downloads, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analytics & Metrics</h1>
                        <p className="text-sm text-gray-500 mt-1">Platform performance insights for Admin</p>
                    </div>
                    <Link href="/editor" className="btn-secondary text-sm">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Platform Overview Section */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📊</span> Platform Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 border-l-4 border-l-blue-500">
                            <p className="text-sm text-gray-500 uppercase font-semibold">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{systemStats?.users || 0}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-green-500">
                            <p className="text-sm text-gray-500 uppercase font-semibold">Total Submissions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{systemStats?.articles || 0}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-purple-500">
                            <p className="text-sm text-gray-500 uppercase font-semibold">Total Downloads</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{systemStats?.downloads || 0}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-orange-500">
                            <p className="text-sm text-gray-500 uppercase font-semibold">Active Journals</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{systemStats?.journals || 0}</p>
                        </Card>
                    </div>
                </section>

                {/* Geolocation Section */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>🌍</span> Download Source Geography
                    </h2>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">

                            {/* Table View */}
                            <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
                                <h3 className="text-lg font-semibold mb-3">Top Countries</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Country</th>
                                                <th className="px-4 py-2 text-right">Downloads</th>
                                                <th className="px-4 py-2 text-right">% of Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {geoStats.map((stat, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.country}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{stat.downloads}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 text-right">
                                                        {((stat.downloads / totalDownloads) * 100).toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Visual Bar View (Simple CSS) */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-3">Participation Map (Visual)</h3>
                                <div className="space-y-4">
                                    {geoStats.slice(0, 5).map((stat, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700">{stat.country}</span>
                                                <span className="text-gray-500">{stat.downloads}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                                <div
                                                    className="bg-primary h-2.5 rounded-full"
                                                    style={{ width: `${(stat.downloads / totalDownloads) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                    {geoStats.length > 5 && (
                                        <div className="text-center pt-4 text-sm text-gray-400">
                                            + {geoStats.length - 5} other region(s)
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
