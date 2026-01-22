import React from "react";
import { prisma } from "@/lib/prisma";
import JournalNav from "@/components/journals/JournalNav";
import { notFound } from "next/navigation";

export default async function JournalLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ code: string }>;
}) {
    const { code } = await params;

    // Fetch journal details needed for the header and navigation
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
        select: {
            id: true,
            code: true,
            fullName: true,
            themeColor: true,
            coverImageUrl: true,
            citeScore: true,
            impactFactor: true,
        },
    });

    if (!journal) {
        notFound();
    }

    // Use DB theme color or default teal if missing
    const headerColor = journal.themeColor || "#006d77";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Dynamic Colored Header */}
            <div style={{ backgroundColor: headerColor }} className="text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Journal Cover */}
                        <div className="w-48 h-64 bg-white rounded-sm shadow-xl flex-shrink-0 overflow-hidden relative border-4 border-white/20">
                            {journal.coverImageUrl ? (
                                <img
                                    src={journal.coverImageUrl}
                                    alt={journal.code}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-xl">
                                    {journal.code}
                                </div>
                            )}
                        </div>

                        {/* Journal Info */}
                        <div className="flex-1 text-center md:text-left pt-2">
                            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight font-serif tracking-wide">
                                {journal.fullName}
                            </h1>

                            <div className="mb-8">
                                <span className="inline-block text-sm font-semibold border border-white/40 px-3 py-1 rounded hover:bg-white/10 transition-colors cursor-default">
                                    Open Access
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-12 gap-y-4 text-lg font-medium opacity-90">
                                {journal.citeScore !== null && (
                                    <div className="flex items-center">
                                        <span className="mr-2">Cite Score:</span>
                                        <span className="font-bold">{journal.citeScore}</span>
                                    </div>
                                )}
                                {journal.impactFactor !== null && (
                                    <div className="flex items-center">
                                        <span className="mr-2">Impact Factor:</span>
                                        <span className="font-bold">{journal.impactFactor}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Bar */}
            <JournalNav journalCode={journal.code.toLowerCase()} />

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {children}
            </div>
        </div>
    );
}
