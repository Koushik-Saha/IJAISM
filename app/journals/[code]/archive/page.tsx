import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArchivePage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // Fetch journal details
    const journal = await prisma.journal.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!journal) {
        notFound();
    }

    // Fetch all issues ordered by year desc, then volume/issue desc
    const issues = await prisma.journalIssue.findMany({
        where: { journalId: journal.id },
        orderBy: [
            { year: "desc" },
            { volume: "desc" },
            { issue: "desc" }
        ],
        include: {
            _count: {
                select: { articles: true } // Can't easily filter count by status here without raw query or separate handling, but let's assume issues only have published articles mostly.
            }
        }
    });

    // Group by year
    const issuesByYear: Record<number, typeof issues> = {};
    issues.forEach(issue => {
        if (!issuesByYear[issue.year]) issuesByYear[issue.year] = [];
        issuesByYear[issue.year].push(issue);
    });

    const years = Object.keys(issuesByYear).map(Number).sort((a, b) => b - a);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-8 shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-bold mb-8 font-serif text-gray-900 border-b pb-4">All Issues</h2>

                    {years.length > 0 ? (
                        <div className="space-y-10">
                            {years.map(year => (
                                <div key={year}>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                        <span className="bg-gray-100 px-3 py-1 rounded text-gray-600 mr-3">{year}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {issuesByYear[year].map(issue => (
                                            <div key={issue.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 flex gap-4">
                                                {/* Tiny Thumb */}
                                                <div className="w-16 h-20 bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 font-bold border">
                                                    {issue.coverUrl ? (
                                                        <img src={issue.coverUrl} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span>VOL {issue.volume}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <Link href={`/journals/${code}/current?issueId=${issue.id}`} className="text-lg font-bold text-[#006d77] hover:underline">
                                                        Volume {issue.volume}, Issue {issue.issue}
                                                    </Link>
                                                    {issue.title && <div className="text-sm font-medium text-gray-600 mt-1">{issue.title}</div>}
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        {issue._count.articles} Articles • {new Date(issue.publishedAt).toLocaleDateString(undefined, { month: 'long' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 italic">
                            No issues found in the archive.
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
        </div>
    );
}
