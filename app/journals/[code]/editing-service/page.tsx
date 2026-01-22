import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditingServicePage({ params }: { params: Promise<{ code: string }> }) {
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
                        <PencilSquareIcon className="w-8 h-8 text-[#006d77]" />
                        Editing Services
                    </h2>

                    <div
                        className="prose max-w-none text-gray-700 mb-8"
                        dangerouslySetInnerHTML={{ __html: journal.editingService || "<p>No editing service information available at this time.</p>" }}
                    />

                    <div className="bg-gray-50 p-6 rounded-lg text-center border box-border">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to submit?</h3>
                        <p className="text-gray-600 mb-6">Create an account or login to start your submission.</p>
                        <div className="flex justify-center gap-4">
                            <Link href="/auth/login" className="bg-[#006d77] text-white px-6 py-2 rounded font-semibold hover:bg-[#00565e] transition-colors">
                                Login to Submit
                            </Link>
                            <Link href="/contact" className="bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded font-semibold hover:bg-gray-50 transition-colors">
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
