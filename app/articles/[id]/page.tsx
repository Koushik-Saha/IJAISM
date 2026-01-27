import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import ArticleActions from "@/components/articles/ArticleActions";
import ReviewerFeedback from "@/components/articles/ReviewerFeedback";
import { Metadata } from "next";

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "published" },
      select: { id: true },
    });

    return articles.map((article) => ({
      id: article.id,
    }));
  } catch (error) {
    console.warn("Database connection failed during build, skipping static generation for articles:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    select: { title: true, abstract: true },
  });

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.abstract?.substring(0, 160) || "Read this academic article on C5K.",
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch Article Data directly from DB
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      journal: true,
      author: {
        select: {
          name: true,
          university: true,
          affiliation: true,
        },
      },
      coAuthors: true,
      reviews: {
        include: {
          reviewer: {
            select: { name: true },
          },
        },
      },
    },
  });

  // 2. Handle Not Found or Access Control
  // Note: For SSG, we typically only build 'published' articles.
  // If a user tries to access a non-published article via a direct link (SSR), we should probably allow it if they are the author,
  // but since this is a Server Component, we don't have easy access to the user's token (localStorage).
  // For now, we will enforce that the article must exist.
  // Real authentication for draft articles in Server Components usually requires Cookies.
  // Assuming 'public' access for now as per the original "public API" logic, but restricting non-published might be safer.
  // However, the original code had a fallback to "protected API".
  // Since we are moving to SSR, we primarily target PUBLIC/Published articles.
  // If an article is NOT published, we might just show 404 for now to keep it simple and secure,
  // unless we implement cookie-based auth.

  if (!article) {
    notFound();
  }

  // Allow viewing if published OR if we want to support drafts via some other mechanism (omitted for strictly SSG scope)
  // Logic: If status != 'published', we could either 404 or show it. 
  // Given this is for SEO, we focus on published. 
  // If the user needs to edit a draft, they usually go via Dashboard -> Preview.

  // Combine author + coAuthors for display
  const allAuthors = [
    { name: article.author.name || "Unknown", affiliation: article.author.affiliation || article.author.university },
    ...article.coAuthors.map((ca) => ({ name: ca.name, affiliation: ca.university })),
  ];

  const publicationDate = article.publicationDate
    ? new Date(article.publicationDate).toISOString().split("T")[0]
    : "Not yet published";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            {" / "}
            <Link href="/articles" className="hover:text-primary">
              Articles
            </Link>
            {" / "}
            <span className="text-gray-900 line-clamp-1">{article.title}</span>
          </nav>
          <div className="mb-4">
            <span className="text-xs bg-primary text-white px-2 py-1 rounded">
              {article.journal.code}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            <span>Published: {publicationDate}</span>
            {/* Extended schema doesn't seem to have DOI/Volume/Issue yet based on previous file view, using what's available or safe fallbacks */}
            {/* If they exist in schema, we render them. Using 'any' cast if strict type checks fail on missing schema fields from my current knowledge view */}
            {(article as any).doi && <span>DOI: {(article as any).doi}</span>}
            {(article as any).volume && <span>Volume {(article as any).volume}</span>}
            {(article as any).issue && <span>Issue {(article as any).issue}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Authors */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Authors</h2>
              {allAuthors.map((author, index) => (
                <div key={index} className="mb-3">
                  <p className="font-semibold">{author.name}</p>
                  {author.affiliation && (
                    <p className="text-sm text-gray-600">{author.affiliation}</p>
                  )}
                </div>
              ))}
            </Card>

            {/* Abstract */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Abstract</h2>
              <p className="text-gray-700 leading-relaxed">{article.abstract}</p>
            </Card>

            {/* Reviewer Feedback (Only if revision requested) */}
            {article.status === "revision_requested" && (
              <ReviewerFeedback
                articleId={article.id}
                originalTitle={article.title}
                reviews={article.reviews.map(r => ({
                  ...r,
                  decision: r.decision || 'PENDING'
                }))}
              />
            )}

            {/* Keywords */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {/* Keywords is stored as Json or String[] in Prisma depending on schema, usually string[] based on previous code */}
                {Array.isArray(article.keywords) ? article.keywords.map((keyword: string) => (
                  <span
                    key={keyword}
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded"
                  >
                    {keyword}
                  </span>
                )) : (
                  // Fallback if stored as comma string
                  (article.keywords as unknown as string || '').split(',').map((k, i) => (
                    <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded">{k.trim()}</span>
                  ))
                )}
              </div>
            </Card>

            {/* Full Text Display (if available and no PDF) */}
            {!article.pdfUrl && (article as any).fullText && (
              <Card className="mb-6">
                <h2 className="text-xl font-bold mb-4">Full Text</h2>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                  {(article as any).fullText}
                </div>
              </Card>
            )}

            {/* Status Timeline */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Submission Status</h2>
              <div className="relative">
                {/* Connector Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" style={{ height: 'calc(100% - 20px)' }}></div>

                {/* Steps */}
                <div className="space-y-6">
                  {/* Step 1: Submission */}
                  <div className="relative flex items-start pl-10">
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${new Date(article.createdAt) <= new Date() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <h3 className="font-bold text-gray-900">Submitted</h3>
                      <p className="text-xs text-gray-500">{new Date(article.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Manuscript received by editorial office.</p>
                    </div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="relative flex items-start pl-10">
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${['under_review', 'revision_requested', 'resubmitted', 'waiting_for_final_decision', 'accepted', 'published', 'rejected'].includes(article.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <h3 className="font-bold text-gray-900">Under Review</h3>
                      {article.status === 'under_review' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">Current Stage</span>}
                      <p className="text-sm text-gray-600">
                        {['under_review', 'revision_requested', 'resubmitted'].includes(article.status)
                          ? "Reviewers are assessing the manuscript."
                          : "Review process initiated."}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Decision */}
                  <div className="relative flex items-start pl-10">
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${['accepted', 'published', 'rejected'].includes(article.status) ? (article.status === 'rejected' ? 'bg-red-500' : 'bg-green-500') :
                        (article.status === 'revision_requested' ? 'bg-orange-500' : 'bg-gray-300')}`}></div>
                    <div>
                      <h3 className="font-bold text-gray-900">Editorial Decision</h3>
                      {article.status === 'revision_requested' && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded ml-2 text-wrap">Revision Requested</span>}
                      {article.status === 'rejected' && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded ml-2">Rejected</span>}
                      {article.status === 'accepted' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">Accepted</span>}
                      <p className="text-sm text-gray-600">
                        {article.status === 'revision_requested' ? "Revisions required based on feedback." :
                          article.status === 'rejected' ? "Manuscript was not accepted." :
                            article.status === 'accepted' ? "Manuscript accepted for publication." :
                              "Pending final decision."}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Publication */}
                  <div className="relative flex items-start pl-10">
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${article.status === 'published' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <h3 className="font-bold text-gray-900">Published</h3>
                      {article.status === 'published' && <p className="text-xs text-gray-500">{publicationDate}</p>}
                      <p className="text-sm text-gray-600">
                        {article.status === 'published'
                          ? "Available online."
                          : "Final production and release."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawn State Special Handler */}
              {article.status === 'withdrawn' && (
                <div className="mt-6 p-4 bg-gray-100 rounded border border-gray-300">
                  <h3 className="font-bold text-gray-700">Article Withdrawn</h3>
                  <p className="text-sm text-gray-600">This article was withdrawn by the author.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <ArticleActions
              articleId={article.id}
              title={article.title}
              pdfUrl={article.pdfUrl}
              fullText={(article as any).fullText}
              authors={allAuthors}
              journalName={article.journal.fullName}
              publicationDate={publicationDate}
              downloads={(article as any).downloads || 0}
              citations={(article as any).citations || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
