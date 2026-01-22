import React from "react";

interface JournalSidebarProps {
    frequency: string | null;
    indexing: string | null;
}

export default function JournalSidebar({ frequency, indexing }: JournalSidebarProps) {
    // Parse indexing string if it's stored as text, or just use static list for now if simpler
    // The page.tsx hardcoded the list, but the schema has an `indexing` field.
    // We'll use the passed list if we parse it, but for now let's stick to the visual provided in page.tsx
    // mixed with dynamic data if available.

    const indexingList = indexing
        ? indexing.split(',').map(s => s.trim())
        : ['Google Scholar', 'DOAJ', 'Scopus (Pending)', 'EBSCO'];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 shadow-sm border-t-4 border-[#c05621]">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Journal Metrics</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex justify-between border-b pb-2">
                        <span>Refereed:</span> <span className="font-semibold">Yes</span>
                    </li>
                    <li className="flex justify-between border-b pb-2">
                        <span>Review Speed:</span> <span className="font-semibold">4-6 Weeks</span>
                    </li>
                    <li className="flex justify-between border-b pb-2">
                        <span>Acceptance Rate:</span> <span className="font-semibold">35%</span>
                    </li>
                    <li className="flex justify-between">
                        <span>Frequency:</span> <span className="font-semibold">{frequency || 'Bi-Monthly'}</span>
                    </li>
                </ul>
            </div>

            <div className="bg-[#f8fafc] p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Indexing</h3>
                <div className="flex flex-wrap gap-2">
                    {indexingList.map((idx, i) => (
                        <span key={i} className="bg-white px-3 py-1 border rounded text-xs text-gray-600">
                            {idx}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
