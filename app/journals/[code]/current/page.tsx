import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CurrentIssuePage({
    params,
    searchParams
}: {
    params: Promise<{ code: string }>,
    searchParams: Promise<{ issueId?: string }>
}) {
    const { code } = await params;
    const { issueId } = await searchParams;

    // Fetch journal details for sidebar
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!journal) {
        notFound();
    }

    // Fetch Issue (Specific ID or Current)
    const currentIssue = await prisma.journalIssue.findFirst({
        where: issueId
            ? { id: issueId, journalId: journal.id }
            : { journalId: journal.id, isCurrent: true },
        include: {
            articles: {
                orderBy: { pageStart: "asc" },
                include: {
                    author: { select: { name: true } }
                }
            }
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-8 shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-bold mb-6 font-serif text-gray-900 border-b pb-4">Current Issue</h2>

                    {currentIssue ? (
                        <div>
                            <div className="flex flex-col md:flex-row gap-8 mb-8">
                                {currentIssue.coverUrl && (
                                    <div className="w-48 flex-shrink-0 shadow-lg border">
                                        <img src={currentIssue.coverUrl} alt={`Cover for Vol ${currentIssue.volume}`} className="w-full" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        Volume {currentIssue.volume}, Issue {currentIssue.issue} ({currentIssue.year})
                                    </h3>
                                    {currentIssue.title && <p className="text-lg text-gray-600 mb-2">{currentIssue.title}</p>}
                                    {currentIssue.description && (
                                        <p className="text-gray-600 text-sm leading-relaxed">{currentIssue.description}</p>
                                    )}
                                    <div className="mt-4 text-sm text-gray-500">
                                        Published: {new Date(currentIssue.publishedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider">Table of Contents</h3>
                            <div className="divide-y divide-gray-100">
                                {currentIssue.articles.length > 0 ? (
                                    currentIssue.articles.map((article) => (
                                        <div key={article.id} className="py-4">
                                            <Link href={`/articles/${article.id}`} className="block group">
                                                <h4 className="text-lg font-semibold text-[#006d77] group-hover:underline mb-1">
                                                    {article.title}
                                                </h4>
                                            </Link>
                                            <div className="text-sm text-gray-700 mb-1">
                                                <span className="font-medium">{article.author.name}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Pages {article.pageStart}-{article.pageEnd} • {article.articleType}
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                <Link href={`/articles/${article.id}`} className="text-xs text-[#c05621] hover:underline font-semibold uppercase">
                                                    Abstract
                                                </Link>
                                                {article.pdfUrl && (
                                                    <a href={article.pdfUrl} className="text-xs text-[#006d77] hover:underline font-semibold uppercase">
                                                        PDF
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No articles in this issue yet.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-500 font-serif italic">No current issue has been assigned yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
