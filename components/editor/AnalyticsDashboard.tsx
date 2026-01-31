'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';

interface AnalyticsData {
    articlesByStatus: { name: string; value: number }[];
    usersByRole: { name: string; value: number }[];
    monthlyGrowth: { month: string; users: number; articles: number }[];
    revenueByTier: { name: string; value: number }[];
}

interface AnalyticsDashboardProps {
    data: AnalyticsData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
    // Safety check
    if (!data) return <div className="p-4 text-center text-gray-500">Loading analytics...</div>;

    const hasArticles = data.articlesByStatus && data.articlesByStatus.length > 0;
    const hasUsers = data.usersByRole && data.usersByRole.length > 0;
    const hasGrowth = data.monthlyGrowth && data.monthlyGrowth.some(m => m.users > 0 || m.articles > 0);
    const hasRevenue = data.revenueByTier && data.revenueByTier.length > 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Articles by Status */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Articles by Status</h3>
                    <div className="h-[300px] w-full">
                        {hasArticles ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.articlesByStatus} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} tickFormatter={(val) => (val ? val.split(' ')[0] : '')} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8">
                                        {data.articlesByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <span className="text-4xl mb-2">📊</span>
                                <p>No articles found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Users by Role */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">User Distribution</h3>
                    <div className="h-[300px] w-full">
                        {hasUsers ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.usersByRole}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {data.usersByRole.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <span className="text-4xl mb-2">👥</span>
                                <p>No users found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Growth */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Growth</h3>
                    <div className="h-[300px] w-full">
                        {hasGrowth ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.monthlyGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" name="Users" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                                    <Line type="monotone" name="Articles" dataKey="articles" stroke="#82ca9d" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <span className="text-4xl mb-2">📈</span>
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue/Memberships */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Membership Distribution</h3>
                    <div className="h-[300px] w-full">
                        {hasRevenue ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.revenueByTier} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <span className="text-4xl mb-2">💳</span>
                                <p>No memberships active</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
