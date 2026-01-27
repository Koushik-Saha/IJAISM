import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    notFound();
  }

  // Fetch related announcements (simple logic: same category or latest, excluding current)
  // Logic: Fetch up to 2 announcements with same category, excluding current id.
  // If no category, or not enough, just fetch latest 2 excluding current.
  let relatedAnnouncements: any[] = [];

  if (announcement.category) {
    relatedAnnouncements = await prisma.announcement.findMany({
      where: {
        category: announcement.category,
        id: { not: id },
        publishedAt: { lte: new Date() }
      },
      orderBy: { publishedAt: 'desc' },
      take: 2
    });
  }

  // If not enough related, fill with any recent
  if (relatedAnnouncements.length < 2) {
    const more = await prisma.announcement.findMany({
      where: {
        id: { notIn: [id, ...relatedAnnouncements.map(a => a.id)] },
        publishedAt: { lte: new Date() }
      },
      orderBy: { publishedAt: 'desc' },
      take: 2 - relatedAnnouncements.length
    });
    relatedAnnouncements = [...relatedAnnouncements, ...more];
  }

  // Cast to any to avoid TS errors until VS Code refreshes Prisma types
  const ann = announcement as any;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/announcements" className="hover:text-primary">
              Announcements
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate max-w-[200px]">
              {ann.title}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-md p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {ann.priority >= 2 && (
                <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                  Important
                </span>
              )}
              {ann.category && (
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {ann.category}
                </span>
              )}
              <span className="text-sm text-gray-600">
                {new Date(ann.publishedAt || ann.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 leading-tight">
              {ann.title}
            </h1>

            <div className="flex items-center text-gray-600">
              <span className="font-medium">Posted by {ann.author || "C5K Admin"}</span>
            </div>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: ann.content }}
          />

          {/* Actions */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/submit"
                className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Submit Your Paper
              </Link>
              <Link
                href="/author-guidelines"
                className="border border-primary text-primary hover:bg-primary/10 px-8 py-3 rounded-lg font-bold transition-colors"
              >
                View Author Guidelines
              </Link>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <Link
              href="/announcements"
              className="inline-flex items-center text-primary hover:text-accent font-semibold"
            >
              ← Back to All Announcements
            </Link>
          </div>
        </article>

        {/* Related Announcements */}
        {relatedAnnouncements.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-primary mb-6">Related Announcements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedAnnouncements.map((related) => (
                <Link key={related.id} href={`/announcements/${related.id}`} className="block h-full">
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-accent h-full flex flex-col">
                    <div className="mb-auto">
                      {related.category && (
                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                          {related.category}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-primary mb-2 hover:text-accent transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(related.publishedAt || related.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
