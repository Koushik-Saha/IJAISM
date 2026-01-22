import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";
import { TrophyIcon } from "@heroicons/react/24/solid";

export const dynamic = "force-dynamic";

export default async function BestPapersPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // Fetch journal details
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!journal) {
        notFound();
    }

    // Fetch Best Papers
    const articles = await prisma.article.findMany({
        where: {
            journalId: journal.id,
            isBestPaper: true,
            status: "published"
        },
        orderBy: { publicationDate: "desc" },
        include: {
            author: { select: { name: true } }
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-8 shadow-sm border border-gray-200 relative overflow-hidden">
                    {/* Decorative Background Icon */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 text-yellow-50 opacity-50">
                        <TrophyIcon className="w-64 h-64" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-6 font-serif text-gray-900 border-b pb-4 flex items-center gap-3">
                            <TrophyIcon className="w-8 h-8 text-yellow-500" />
                            Best Paper Awards
                        </h2>

                        <p className="text-gray-600 mb-8 max-w-2xl">
                            Each year, we recognize outstanding contributions to the field. These papers have been selected by our editorial board for their exceptional quality, impact, and innovation.
                        </p>

                        <div className="grid grid-cols-1 gap-6">
                            {articles.length > 0 ? (
                                articles.map((article) => (
                                    <div key={article.id} className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow relative">
                                        <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                            Award Winner
                                        </div>
                                        <Link href={`/articles/${article.id}`} className="block group">
                                            <h3 className="text-xl font-bold text-[#006d77] group-hover:underline mb-3 pr-24">
                                                {article.title}
                                            </h3>
                                        </Link>
                                        <div className="text-sm text-gray-800 font-medium mb-1">
                                            {article.author.name}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-4">
                                            Published: {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString() : 'N/A'} • Vol {article.volume || '?'}
                                        </div>

                                        <div className="flex gap-3">
                                            <Link href={`/articles/${article.id}`} className="text-sm font-semibold text-[#c05621] hover:text-[#9c421b]">
                                                Read Abstract &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-500 italic">No awards have been listed yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
