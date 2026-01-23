import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";
import { StarIcon } from "@heroicons/react/24/solid";

export const dynamic = "force-dynamic";

export default async function SpecialIssuesPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // Fetch journal details
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!journal) {
        notFound();
    }

    // Fetch Special Issues
    const specialIssues = await prisma.journalIssue.findMany({
        where: {
            journalId: journal.id,
            isSpecial: true,
        },
        orderBy: [
            { year: "desc" },
            { publishedAt: "desc" }
        ],
        include: {
            _count: {
                select: { articles: true }
            }
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-8 shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-bold mb-6 font-serif text-gray-900 border-b pb-4 flex items-center gap-3">
                        <StarIcon className="w-8 h-8 text-yellow-500" />
                        Special Issues
                    </h2>

                    <p className="text-gray-600 mb-8">
                        Special issues are focused collections of papers primarily on a specific topic or theme,
                        often curated by guest editors.
                    </p>

                    <div className="space-y-8">
                        {specialIssues.length > 0 ? (
                            specialIssues.map((issue) => (
                                <div key={issue.id} className="flex flex-col md:flex-row gap-6 border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                                    {/* Visual Thumb */}
                                    <div className="w-full md:w-48 flex-shrink-0 bg-gray-100 aspect-[3/4] flex items-center justify-center border text-gray-400 font-bold relative overflow-hidden shadow-sm">
                                        {issue.coverUrl ? (
                                            <img src={issue.coverUrl} alt={issue.title || "Special Issue"} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <span className="block text-2xl mb-1">SI</span>
                                                <span className="text-xs uppercase">Special Issue</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <Link href={`/journals/${code}/current?issueId=${issue.id}`} className="block group">
                                            <h3 className="text-2xl font-bold text-[#006d77] group-hover:underline mb-2">
                                                {issue.title || `Special Issue: Vol ${issue.volume}, Issue ${issue.issue}`}
                                            </h3>
                                        </Link>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-100">
                                                {issue.year}
                                            </span>
                                            <span>Volume {issue.volume}, Issue {issue.issue}</span>
                                            <span>{issue._count.articles} Articles</span>
                                        </div>

                                        {issue.description && (
                                            <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                                                {issue.description}
                                            </p>
                                        )}

                                        <Link href={`/journals/${code}/current?issueId=${issue.id}`} className="text-[#c05621] font-semibold hover:underline inline-flex items-center text-sm">
                                            View Articles &rarr;
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded border border-dashed text-gray-500 italic">
                                No special issues found for this journal.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
