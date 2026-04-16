"use client";

import { useState } from "react";

interface SafeJournalCoverProps {
    code: string;
    coverImageUrl: string | null;
    themeColor?: string;
    className?: string;
    fallbackClassName?: string;
}

export default function SafeJournalCover({
    code,
    coverImageUrl,
    themeColor = "#007398",
    className = "w-[72px] h-[96px] object-cover border border-[#cfd8dc] shadow hover:opacity-90 transition",
    fallbackClassName = "w-[72px] h-[96px] flex items-center justify-center text-center p-1.5 border border-[#cfd8dc] shadow text-[9px] font-bold text-white rounded-sm leading-tight"
}: SafeJournalCoverProps) {
    const [error, setError] = useState(false);

    const Fallback = () => (
        <div className={fallbackClassName} style={{ background: themeColor }}>
            {code.toUpperCase()}
        </div>
    );

    if (!coverImageUrl || error) {
        return <Fallback />;
    }

    const src = coverImageUrl.startsWith('http')
        ? coverImageUrl
        : `https://c5k.com/public/backend/journal/${coverImageUrl.replace(/^\//, '')}`;

    return (
        <img
            src={src}
            alt={code}
            className={className}
            onError={() => setError(true)}
        />
    );
}
