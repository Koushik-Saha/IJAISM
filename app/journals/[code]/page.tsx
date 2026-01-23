import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JournalAboutSection from "@/components/journals/JournalAboutSection";
import JournalInsights from "@/components/journals/JournalInsights";
import JournalSidebar from "@/components/journals/JournalSidebar";
import { notFound } from "next/navigation";

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const journals = await prisma.journal.findMany({
    where: { isActive: true },
    select: { code: true },
  });

  return journals.map((journal) => ({
    code: journal.code.toLowerCase(),
  }));
}

export default async function JournalDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Fetch journal and its articles
  const journal = await prisma.journal.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      articles: {
        where: { status: "published" },
        orderBy: { publicationDate: "desc" },
        take: 5,
        include: {
          author: { select: { name: true } }
        }
      }
    }
  });

  if (!journal) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-8">

        {/* About Section - styled as per screenshot (light blue bg) */}
        <JournalAboutSection
          journalName={journal.fullName}
          description={journal.description || ""}
          aimsAndScope={journal.aimsAndScope}
        />

        {/* Recent Articles */}
        <div className="bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 font-serif text-gray-800 border-b pb-2">Recent Articles</h2>
          {journal.articles.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {journal.articles.map((article) => (
                <div key={article.id} className="py-4">
                  <Link href={`/articles/${article.id}`} className="block group">
                    <h3 className="text-xl font-semibold text-[#006d77] group-hover:underline mb-2">
                      {article.title}
                    </h3>
                  </Link>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-900">{article.author.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span>{article.publicationDate ? new Date(article.publicationDate).toLocaleDateString() : 'Just Accepted'}</span>
                    {article.volume && <span>• Vol {article.volume}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No articles published recently.</p>
          )}
        </div>

        {/* Journal Insights Section */}
        <JournalInsights
          journalCode={journal.code.toLowerCase()}
          aimsAndScope={journal.aimsAndScope}
          issn={journal.issn}
          eIssn={journal.eIssn}
          subjectAreas={journal.subjectAreas}
          articleProcessingCharge={journal.articleProcessingCharge}
          indexing={journal.indexing}
          timeToFirstDecision={journal.timeToFirstDecision}
          reviewTime={journal.reviewTime}
          revisionTime={journal.revisionTime}
          submissionToAcceptance={journal.submissionToAcceptance}
          acceptanceToPublication={journal.acceptanceToPublication}
        />
      </div>

      {/* Sidebar */}
      <JournalSidebar frequency={journal.frequency} indexing={journal.indexing} />
    </div>
  );
}
