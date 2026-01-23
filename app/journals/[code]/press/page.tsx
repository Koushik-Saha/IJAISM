import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArticlesInPressPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // Fetch journal details for sidebar
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!journal) {
        notFound();
    }

    // Fetch Articles in Press (accepted status)
    const articles = await prisma.article.findMany({
        where: {
            journalId: journal.id,
            status: "accepted", // Assuming 'accepted' means In Press before assigned to an issue/published
        },
        orderBy: { acceptanceDate: "desc" },
        include: {
            author: { select: { name: true } }
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-8 shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-bold mb-6 font-serif text-gray-900 border-b pb-4">Articles in Press</h2>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                        <p className="text-sm text-blue-700">
                            Did you know? "Articles in Press" are peer-reviewed, accepted articles to be published in a future issue.
                            They are fully citable using their DOI.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {articles.length > 0 ? (
                            articles.map((article) => (
                                <div key={article.id} className="py-6">
                                    <Link href={`/articles/${article.id}`} className="block group">
                                        <h3 className="text-xl font-semibold text-[#006d77] group-hover:underline mb-2">
                                            {article.title}
                                        </h3>
                                    </Link>
                                    <div className="text-sm text-gray-700 mb-2">
                                        <span className="font-medium">{article.author.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-3">
                                        <span>Accepted: {article.acceptanceDate ? new Date(article.acceptanceDate).toLocaleDateString() : 'N/A'}</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                            In Press
                                        </span>
                                    </div>
                                    <div className="mt-3 flex gap-4">
                                        {article.doi && (
                                            <span className="text-xs text-gray-500">DOI: {article.doi}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic py-8 text-center">There are currently no articles in press for this journal.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
