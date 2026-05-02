'use client';

import { useState } from "react";

interface CoverImageProps {
    src: string | null;
    alt: string;
    fallbackText?: string;
    className?: string;
    basePath?: string;
}

export default function CoverImage({ src, alt, fallbackText, className, basePath }: CoverImageProps) {
    const [error, setError] = useState(false);

    // Helper to fix URLs
    const getFixedUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('//') || url.startsWith('/')) return url;
        // Fix relative paths from backend
        // Note: Old site used 'public/backend/books' for most book/thesis covers
        const path = basePath || 'https://c5k.com/public/backend/books/';
        return `${path}${url.replace(/^\//, '')}`;
    };

    const finalSrc = src ? getFixedUrl(src) : '';

    // Fallback UI
    const Fallback = () => (
        <div className={`bg-gradient-to-br from-primary-light to-primary flex items-center justify-center ${className}`}>
            <span className="text-white font-bold text-center px-2 text-sm">
                {fallbackText || alt}
            </span>
        </div>
    );

    if (!finalSrc || error) {
        return <Fallback />;
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <img
                src={finalSrc}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => setError(true)}
            />
            {/* Hidden fallback to preserve layout if img is absolute/etc, usually irrelevant for object-cover but good practice to have fallback ready */}
        </div>
    );
}
