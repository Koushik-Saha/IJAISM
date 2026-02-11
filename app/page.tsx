import Link from "next/link";
import Card from "@/components/ui/Card";
import AuthProtectedLink from "@/components/ui/AuthProtectedLink";
import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/marketing/HeroCarousel";
import NewsletterSection from "@/components/marketing/NewsletterSection";

export const dynamic = "force-dynamic";

async function getHomepageData() {
  try {
    const [announcements, journals, articles, mostViewedArticles, heroSlides] = await Promise.all([
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

      prisma.article.findMany({
        where: { status: "published" },
        orderBy: { viewCount: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          abstract: true,
          journal: { select: { code: true } },
          author: { select: { name: true } },
          viewCount: true,
        },
      }),

      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
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
      mostViewedArticles,
      heroSlides,
      stats: { journals: journalsCount, articles: articlesCount, users: usersCount },

    };
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return {
      announcements: [],
      journals: [],
      articles: [],
      heroSlides: [],
      stats: { journals: 12, articles: 0, users: 0 },
    };
  }
}


// Helper for dynamic sections
async function getHomepageSections() {
  try {
    const sections = await prisma.homePageSection.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Fallback if no sections found (first run before seed or API call)
    if (sections.length === 0) {
      // Trigger the seeding by calling the API internally or just return defaults
      // For SSR, we might just return the defaults structure so it works even if DB is empty
      return [
        { type: 'hero_carousel', id: 'default-hero' },
        { type: 'announcements', id: 'default-announcements' },
        { type: 'journals', id: 'default-journals' },
        { type: 'latest_articles', id: 'default-articles' },
        { type: 'most_viewed', id: 'default-viewed' },
        { type: 'newsletter', id: 'default-newsletter' },
        { type: 'stats', id: 'default-stats' },
      ];
    }
    return sections;
  } catch (error) {
    console.error("Error loading sections:", error);
    // Fallback on error to ensure homepage never breaks
    return [
      { type: 'hero_carousel', id: 'default-hero' },
      { type: 'announcements', id: 'default-announcements' },
      { type: 'journals', id: 'default-journals' },
      { type: 'latest_articles', id: 'default-articles' },
      { type: 'most_viewed', id: 'default-viewed' },
      { type: 'newsletter', id: 'default-newsletter' },
      { type: 'stats', id: 'default-stats' },
    ];
  }
}

export default async function HomePage() {
  const { announcements, journals, articles, mostViewedArticles, heroSlides, stats } = await getHomepageData();
  const sections = await getHomepageSections();

  const renderSection = (section: { id: string; type: string; title?: string | null; content?: any }) => {
    switch (section.type) {
      case 'hero_carousel':
        return <HeroCarousel key={section.id} slides={heroSlides} />;

      case 'announcements':
        return (
          <section key={section.id} className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-center">{section.title || 'Latest Announcements'}</h2>
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
        );

      case 'journals':
        return (
          <section key={section.id} className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-center">{section.title || 'Academic Journals'}</h2>
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
        );

      case 'latest_articles':
        return (
          <section key={section.id} className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-center">{section.title || 'Latest Articles'}</h2>
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
        );

      case 'most_viewed':
        return (
          <section key={section.id} className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-center">{section.title || 'Most Viewed Articles'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mostViewedArticles && mostViewedArticles.length > 0 ? (
                  mostViewedArticles.map((article: any) => (
                    <Card key={article.id}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-semibold">
                          {article.journal.code}
                        </span>
                        <span className="text-xs text-gray-500">
                          👁️ {article.viewCount} views
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 line-clamp-2">
                        <Link href={`/articles/${article.id}`} className="hover:text-primary">
                          {article.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">By {article.author.name}</p>
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{article.abstract || 'No abstract available.'}</p>
                      <Link href={`/articles/${article.id}`} className="text-primary hover:text-primary-dark font-semibold">
                        Read More →
                      </Link>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center text-gray-500">
                    No articles to display.
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'newsletter':
        return (
          <NewsletterSection
            key={section.id}
            title={section.title}
            content={section.content}
          />
        );

      case 'stats':
        return (
          <section key={section.id} className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-center">{section.title || 'Our Impact'}</h2>
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
        );

      case 'html':
      case 'text':
        return (
          <section key={section.id} className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.title && <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>}
              <div dangerouslySetInnerHTML={{ __html: section.content?.html || '' }} />
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {sections.map(section => renderSection(section))}
    </div>
  );
}
