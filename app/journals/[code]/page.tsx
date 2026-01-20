import Link from "next/link";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden">
              {journal.coverImageUrl ? (
                <img src={journal.coverImageUrl} alt={journal.code} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-2xl font-bold">{journal.code}</span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{journal.fullName}</h1>
              <div className="flex gap-4 text-sm text-gray-100 flex-wrap">
                {journal.issn && <span>ISSN: {journal.issn}</span>}
                {journal.eIssn && <span>e-ISSN: {journal.eIssn}</span>}
                {journal.impactFactor && <span>Impact Factor: {journal.impactFactor}</span>}
                {journal.frequency && <span>{journal.frequency}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About */}
            <Card className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About the Journal</h2>
              <p className="text-gray-700 mb-4">{journal.description || "No description available."}</p>
              <h3 className="text-xl font-bold mb-2">Aims and Scope</h3>
              <p className="text-gray-700">{journal.aimsAndScope || "No aims and scope available."}</p>
            </Card>

            {/* Current Issue / Recent Articles */}
            <Card className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Recent Articles</h2>
              {journal.articles.length > 0 ? (
                <div className="space-y-4">
                  {journal.articles.map((article) => (
                    <div key={article.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <Link href={`/articles/${article.id}`} className="text-lg font-semibold text-primary hover:text-primary-dark">
                        {article.title}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">{article.author.name}</p>
                      <div className="text-sm text-gray-500 mt-1 flex gap-2">
                        {article.volume && <span>Vol {article.volume}</span>}
                        {article.issue && <span>Issue {article.issue}</span>}
                        {article.pageStart && article.pageEnd && <span>pp {article.pageStart}-{article.pageEnd}</span>}
                        <span>| Published: {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No articles published yet.</p>
              )}
            </Card>

            {/* Call to Action */}
            <Card>
              <h2 className="text-2xl font-bold mb-4">Submit to This Journal</h2>
              <p className="text-gray-700 mb-4">
                We welcome submissions of original research articles, review papers, and case studies.
              </p>
              <Link href="/submit" className="btn-primary">
                Submit Your Manuscript
              </Link>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick Info */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-3">Quick Information</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="font-semibold">Frequency:</span> {journal.frequency || "N/A"}
                </li>
                <li>
                  <span className="font-semibold">APC:</span> {journal.articleProcessingCharge ? `$${journal.articleProcessingCharge}` : "N/A"}
                </li>
                <li>
                  <span className="font-semibold">Open Access:</span> Yes
                </li>
                {journal.publisher && (
                  <li>
                    <span className="font-semibold">Publisher:</span> {journal.publisher}
                  </li>
                )}
              </ul>
            </Card>

            {/* Links */}
            <Card>
              <h3 className="text-lg font-bold mb-3">For Authors</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/author-guidelines" className="text-primary hover:text-primary-dark">
                    Author Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/paper-format" className="text-primary hover:text-primary-dark">
                    Paper Format
                  </Link>
                </li>
                <li>
                  <Link href="/submit" className="text-primary hover:text-primary-dark">
                    Submit Article
                  </Link>
                </li>
                <li>
                  <Link href="/review-process" className="text-primary hover:text-primary-dark">
                    Review Process
                  </Link>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
