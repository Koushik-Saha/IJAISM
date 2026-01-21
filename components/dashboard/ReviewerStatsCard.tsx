import Link from 'next/link';
import Card from '@/components/ui/Card';

interface ReviewerStatsProps {
    stats: {
        pending: number;
        inProgress: number;
        completed: number;
        total: number;
        overdue: number;
        dueSoon: number;
    };
    isLoading: boolean;
}

export default function ReviewerStatsCard({ stats, isLoading }: ReviewerStatsProps) {
    if (isLoading) {
        return (
            <Card className="h-full">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full border-l-4 border-l-purple-600">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Reviewer Assignments</h2>
                    <p className="text-sm text-gray-600">Your peer review overview</p>
                </div>
                <Link
                    href="/dashboard/reviews"
                    className="text-sm font-semibold text-purple-600 hover:text-purple-800"
                >
                    View All &rarr;
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-700">{stats.pending}</p>
                    <p className="text-xs text-purple-800 font-medium uppercase tracking-wide">Pending</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                    <p className="text-xs text-blue-800 font-medium uppercase tracking-wide">In Progress</p>
                </div>
            </div>

            {(stats.dueSoon > 0 || stats.overdue > 0) && (
                <div className="mt-4 space-y-2">
                    {stats.overdue > 0 && (
                        <div className="flex items-center text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded">
                            <span className="mr-2">⚠️</span>
                            {stats.overdue} review{stats.overdue !== 1 ? 's' : ''} overdue
                        </div>
                    )}
                    {stats.dueSoon > 0 && (
                        <div className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded">
                            <span className="mr-2">⏰</span>
                            {stats.dueSoon} due in 3 days
                        </div>
                    )}
                </div>
            )}

            {stats.pending === 0 && stats.inProgress === 0 && (
                <div className="mt-4 text-center text-sm text-gray-500 italic">
                    No active reviews at the moment.
                </div>
            )}
        </Card>
    );
}
