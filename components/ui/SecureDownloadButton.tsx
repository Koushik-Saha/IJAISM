
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface SecureDownloadButtonProps {
    pdfUrl: string;
    label?: string;
    className?: string;
    variant?: 'button' | 'link';
}

export default function SecureDownloadButton({
    pdfUrl,
    label = "Download PDF",
    className = "",
    variant = 'button'
}: SecureDownloadButtonProps) {

    const router = useRouter();

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();

        const token = localStorage.getItem('token');

        if (!token) {
            // Redirect to login with callback
            const callbackUrl = encodeURIComponent(window.location.pathname);
            router.push(`/login?callbackUrl=${callbackUrl}`);
            return;
        }

        // Strip upload prefix if present to get clean path
        const path = pdfUrl.replace(/^\/uploads\//, '');

        // Open in new tab
        window.open(`/api/files/download/${path}?token=${token}`, '_blank');
    };

    if (variant === 'link') {
        return (
            <a
                href="#"
                onClick={handleDownload}
                className={className}
            >
                {label}
            </a>
        );
    }

    return (
        <button
            onClick={handleDownload}
            className={className}
        >
            {label}
        </button>
    );
}
