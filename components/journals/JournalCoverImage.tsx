'use client';

import { useState } from "react";

interface JournalCoverImageProps {
    code: string;
    coverImageUrl: string | null;
}

export default function JournalCoverImage({ code, coverImageUrl }: JournalCoverImageProps) {
    const [error, setError] = useState(false);

    // Fallback placeholder UI
    const Placeholder = () => (
        <div className="w-full h-48 md:h-full min-h-[12rem] bg-gradient-to-br from-primary-light to-primary rounded-md flex items-center justify-center">
            <span className="text-white text-4xl font-bold">{code}</span>
        </div>
    );

    if (!coverImageUrl || error) {
        return <Placeholder />;
    }

    // Handle URL logic
    const src = coverImageUrl.startsWith('http')
        ? coverImageUrl
        : `https://c5k.com/${coverImageUrl.replace(/^\//, '')}`;

    return (
        <img
            src={src}
            alt={code}
            className="w-full h-48 md:h-full object-cover rounded-md"
            onError={() => setError(true)}
        />
    );
}
