"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function JournalSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [query, setQuery] = useState(initialQuery);

    // Sync state with URL params
    useEffect(() => {
        setQuery(searchParams.get("q") || "");
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());

        if (query.trim()) {
            params.set("q", query.trim());
        } else {
            params.delete("q");
        }

        router.push(`/journals?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mt-8">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by journal name, code, or description..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder-gray-400 bg-white/95 backdrop-blur-sm"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </div>
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                    Search
                </button>
            </div>
        </form>
    );
}
