import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

export const dynamic = "force-dynamic";

export default async function OverviewPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // Fetch journal details
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!journal) {
        notFound();
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-8 shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-bold mb-6 font-serif text-gray-900 border-b pb-4 flex items-center gap-3">
                        <InformationCircleIcon className="w-8 h-8 text-[#006d77]" />
                        Journal Overview
                    </h2>

                    <div className="prose max-w-none text-gray-700">
                        {journal.description && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">About the Journal</h3>
                                <p className="leading-relaxed">{journal.description}</p>
                            </div>
                        )}

                        {journal.aimsAndScope && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Aims and Scope</h3>
                                <p className="leading-relaxed whitespace-pre-wrap">{journal.aimsAndScope}</p>
                            </div>
                        )}

                        {!journal.description && !journal.aimsAndScope && (
                            <p className="italic text-gray-500">Overview content is not available for this journal.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
