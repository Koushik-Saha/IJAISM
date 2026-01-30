
import React from 'react';

interface AnalyticsData {
    articlesByStatus: { name: string; value: number }[];
    usersByRole: { name: string; value: number }[];
    monthlyGrowth: { month: string; users: number; articles: number }[];
    revenueByTier: { name: string; value: number }[];
    revenueTotal?: number;
    topJournals?: { name: string; value: number }[];
    engagement?: { views: number; downloads: number };
}

export function SimpleAnalytics({ data }: { data: AnalyticsData }) {
    if (!data) return null;

    // Helpers
    const getMax = (arr: any[], key: string) => Math.max(...arr.map(i => i[key] || 0), 1);

    const maxArticleStatus = getMax(data.articlesByStatus, 'value');
    const maxJournal = data.topJournals ? getMax(data.topJournals, 'value') : 1;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Analytics Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Articles Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        📄 Articles by Status
                    </h3>
                    <div className="space-y-4">
                        {data.articlesByStatus.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No data available</p>
                        ) : (
                            data.articlesByStatus.map((item) => (
                                <div key={item.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 font-medium">{item.name}</span>
                                        <span className="text-gray-900 font-bold">{item.value}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(item.value / maxArticleStatus) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. User Roles */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        👥 User Distribution
                    </h3>
                    <div className="space-y-4">
                        {data.usersByRole.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No data available</p>
                        ) : (
                            data.usersByRole.map((item) => (
                                <div key={item.name} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${(item.name.includes('Admin') || item.name.includes('Super')) ? 'bg-red-400' :
                                            item.name === 'Editor' ? 'bg-purple-400' :
                                                'bg-green-400'
                                            }`}></div>
                                        <span className="text-sm text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Monthly Growth List */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        📈 Recent Growth
                    </h3>
                    {data.monthlyGrowth.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No recent activity</p>
                    ) : (
                        <div className="space-y-0">
                            <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 border-b border-gray-100 pb-2 mb-2">
                                <span>Month</span>
                                <span className="text-center">Users</span>
                                <span className="text-right">Articles</span>
                            </div>
                            {data.monthlyGrowth.map((month) => (
                                <div key={month.month} className="grid grid-cols-3 text-sm py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-600">{month.month}</span>
                                    <div className="text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${month.users > 0 ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}>
                                            +{month.users}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${month.articles > 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>
                                            +{month.articles}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Membership / Revenue */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        💳 Financial Overview
                    </h3>
                    <div className="mb-6 text-center bg-green-50 rounded-lg p-4 border border-green-100">
                        <p className="text-sm text-green-600 font-medium uppercase tracking-wider">Total Recorded Revenue</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">{formatCurrency(data.revenueTotal || 0)}</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase">Active Memberships</p>
                        {data.revenueByTier.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No active memberships</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {data.revenueByTier.map(tier => (
                                    <div key={tier.name} className="bg-gray-50 p-2 rounded text-center">
                                        <p className="text-xs text-gray-500 uppercase font-bold">{tier.name}</p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">{tier.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Top Journals */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        🏆 Top Journals
                    </h3>
                    <div className="space-y-4">
                        {(!data.topJournals || data.topJournals.length === 0) ? (
                            <p className="text-sm text-gray-500 italic">No submissions yet</p>
                        ) : (
                            data.topJournals.map((item) => (
                                <div key={item.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 font-medium">{item.name}</span>
                                        <span className="text-gray-900 font-bold">{item.value} submissions</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full"
                                            style={{ width: `${(item.value / maxJournal) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 6. Engagement Stats */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        👁️ Engagement
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                                📄
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Article Views</p>
                                <p className="text-2xl font-bold text-gray-900">{data.engagement?.views?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                                ⬇️
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Downloads</p>
                                <p className="text-2xl font-bold text-gray-900">{data.engagement?.downloads?.toLocaleString() || 0}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded text-xs text-gray-500 mt-2">
                            Engagement metrics are aggregated across all active journals and articles.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
