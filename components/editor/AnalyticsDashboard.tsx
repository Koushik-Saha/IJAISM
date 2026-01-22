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
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Articles by Status */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Articles by Status</h3>
                    <div className="h-64">
                        {data.articlesByStatus.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.articlesByStatus}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} tickFormatter={(val) => val.split(' ')[0]} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                        {data.articlesByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No article data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Users by Role */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">User Distribution</h3>
                    <div className="h-64">
                        {data.usersByRole.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.usersByRole}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No user data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Growth */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Growth</h3>
                    <div className="h-64">
                        {data.monthlyGrowth.some(m => m.users > 0 || m.articles > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.monthlyGrowth}>
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
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No growth data available in last 6 months
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue/Memberships */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Membership Distribution</h3>
                    <div className="h-64">
                        {data.revenueByTier.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.revenueByTier} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No membership data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
