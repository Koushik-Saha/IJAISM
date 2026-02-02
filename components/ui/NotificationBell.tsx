'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
    id: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Add timestamp to prevent caching
            const res = await fetch(`/api/notifications?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    // Polling Effect - reduced to 15s for better responsiveness
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    // Listen for updates from the notifications page
    useEffect(() => {
        const handleUpdate = () => {
            // Small delay to ensure server processing is complete
            setTimeout(fetchNotifications, 100);
        };

        window.addEventListener('notificationsUpdated', handleUpdate);

        // Also fetch when route changes (e.g. user navigates away from notifications page)
        window.addEventListener('popstate', handleUpdate);

        return () => {
            window.removeEventListener('notificationsUpdated', handleUpdate);
            window.removeEventListener('popstate', handleUpdate);
        };
    }, []);

    return (
        <Link
            href="/notifications"
            className="relative p-2 text-gray-600 hover:text-primary transition-colors focus:outline-none"
            aria-label="Notifications"
        >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
