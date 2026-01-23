import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";
import { UserGroupIcon } from "@heroicons/react/24/solid";

interface EditorialMember {
    name: string;
    role: string;
    affiliation: string;
    image: string | null;
}

export const dynamic = "force-dynamic";

export default async function EditorialBoardPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // Fetch journal details
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!journal) {
        notFound();
    }

    const editorialBoard = (journal.editorialBoard as unknown as EditorialMember[]) || [];

    // Group by role for better display if needed, but simple list for now
    // Or prioritize EIC

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-8 shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-bold mb-6 font-serif text-gray-900 border-b pb-4 flex items-center gap-3">
                        <UserGroupIcon className="w-8 h-8 text-[#006d77]" />
                        Editorial Board
                    </h2>

                    {journal.editorialBoardDescription && (
                        <p className="text-gray-700 mb-8 italic border-l-4 border-gray-200 pl-4 py-1">
                            {journal.editorialBoardDescription}
                        </p>
                    )}

                    <div className="space-y-8">
                        {editorialBoard.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                {editorialBoard.map((member, index) => (
                                    <div key={index} className="flex gap-4 items-start">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden">
                                            {member.image ? (
                                                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{member.name}</h3>
                                            <div className="text-[#006d77] font-medium text-sm mb-1">{member.role}</div>
                                            <div className="text-sm text-gray-600 leading-tight">{member.affiliation}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No editorial board members listed.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
