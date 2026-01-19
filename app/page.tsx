import Link from "next/link";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getHomepageData() {
  try {
    const [announcements, journals, articles] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          publishedAt: { not: null },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          excerpt: true,
          thumbnailUrl: true,
        },
      }),

      prisma.journal.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        take: 8,
        select: {
          id: true,
          code: true,
          fullName: true,
          coverImageUrl: true,
        },
      }),

      prisma.article.findMany({
        where: { status: "published" },
        orderBy: { publicationDate: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          abstract: true,
          journal: { select: { code: true } },
          author: { select: { name: true } },
          publicationDate: true,
        },
      }),
    ]);

    const [journalsCount, articlesCount, usersCount] = await Promise.all([
      prisma.journal.count({ where: { isActive: true } }),
      prisma.article.count({ where: { status: "published" } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      announcements,
      journals,
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        abstract: a.abstract,
        journal: a.journal.code,
        authors: a.author.name,
      })),
      stats: { journals: journalsCount, articles: articlesCount, users: usersCount },
    };
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return {
      announcements: [],
      journals: [],
      articles: [],
      stats: { journals: 12, articles: 0, users: 0 },
    };
  }
}

export default async function HomePage() {
  const { announcements, journals, articles, stats } = await getHomepageData();
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to IJAISM Academic Publishing Platform
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-100">
            Dedicated to publishing groundbreaking research and promoting innovative ideas
          </p>
          <p className="text-lg mb-8 text-gray-200">
            in the fields of information technology, business management, and related disciplines
          </p>
          <p className="text-base mb-8 text-gray-300 max-w-3xl mx-auto">
            Our goal is to minimize the delay in sharing new ideas and discoveries with the world,
            making high-quality, peer-reviewed journals available online through our fast 4-reviewer approval system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit" className="btn-accent">
              Submit Your Research
            </Link>
            <Link href="/journals" className="btn-secondary bg-white text-primary hover:bg-gray-100">
              Browse Journals
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Announcements */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Latest Announcements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.length > 0 ? (
              announcements.map((announcement: any) => (
                <Card key={announcement.id}>
                  {announcement.thumbnailUrl ? (
                    <img src={announcement.thumbnailUrl} alt={announcement.title} className="h-40 w-full object-cover rounded mb-4" />
                  ) : (
                    <div className="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center">
                      <span className="text-gray-400">Image Placeholder</span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-2">{announcement.title}</h3>
                  <p className="text-gray-600 mb-4">{announcement.excerpt || 'No excerpt available.'}</p>
                  <Link href={`/announcements/${announcement.id}`} className="text-primary hover:text-primary-dark font-semibold">
                    Read More →
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">
                No announcements available at this time.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Academic Journals */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Academic Journals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journals.length > 0 ? (
              journals.map((journal: any) => (
                <Link key={journal.id} href={`/journals/${journal.code.toLowerCase()}`}>
                  <Card className="h-full">
                    {journal.coverImageUrl ? (
                      <img src={journal.coverImageUrl} alt={journal.code} className="h-48 w-full object-cover rounded mb-4" />
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary-light to-primary rounded mb-4 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{journal.code}</span>
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-center">{journal.fullName}</h3>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center text-gray-500">
                No journals available at this time.
              </div>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/journals" className="btn-primary">
              View All Journals
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.length > 0 ? (
              articles.map((article: any) => (
                <Card key={article.id}>
                  <div className="mb-2">
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                      {article.journal}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{article.authors}</p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">{article.abstract || 'No abstract available.'}</p>
                  <Link href={`/articles/${article.id}`} className="text-primary hover:text-primary-dark font-semibold">
                    Read More →
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-4 text-center text-gray-500">
                No published articles available at this time.
              </div>
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/articles" className="btn-primary">
              View All Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to IJAISM for Updates</h2>
          <p className="text-lg mb-8">Stay informed about the latest research, publications, and academic events.</p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-3 rounded text-gray-900 w-full sm:w-96"
            />
            <button type="submit" className="btn-accent">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{stats.journals}</div>
              <div className="text-gray-600">Academic Journals</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{stats.articles}+</div>
              <div className="text-gray-600">Published Articles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{stats.users}+</div>
              <div className="text-gray-600">Active Researchers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
