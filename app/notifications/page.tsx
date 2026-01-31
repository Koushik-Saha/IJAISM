'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';

interface Notification {
    id: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Auth Check
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchNotifications(token);
    }, [router]);

    const fetchNotifications = async (token: string) => {
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id?: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'mark_read', notificationId: id })
            });

            // Optimistic update
            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success("All notifications marked as read");
            }

            // Dispatch event to update bell icon count globally
            window.dispatchEvent(new Event('notificationsUpdated'));

        } catch (e) {
            console.error("Failed to mark as read");
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                        {notifications.some(n => !n.isRead) && (
                            <button
                                onClick={() => markAsRead()}
                                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-full hover:bg-primary/5"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔔</span>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h2>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            When you get notifications, they'll show up here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`
                                    group relative bg-white rounded-xl p-5 border shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-200
                                    ${notification.isRead ? 'border-gray-100 opacity-80' : 'border-blue-100 bg-blue-50/10 ring-1 ring-blue-50'}
                                `}
                            >
                                <div className="flex gap-4">
                                    <div className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${notification.isRead ? 'bg-transparent' : 'bg-primary'}`} />

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-base ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'} mb-1.5 leading-relaxed`}>
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-gray-400">
                                                {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            {notification.type && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500">
                                                    {notification.type.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
