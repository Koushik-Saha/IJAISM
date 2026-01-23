import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c5k-platform.vercel.app';

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/about',
        '/contact',
        '/submit',
        '/journals',
        '/books',
        '/conferences',
        '/dissertations',
        '/announcements',
        '/scholarship',
        '/careers',
        '/terms',
        '/privacy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        // 2. Journals (Dynamic)
        const journals = await prisma.journal.findMany({
            where: { isActive: true },
            select: { code: true, updatedAt: true },
        });

        const journalRoutes = journals.map((journal) => ({
            url: `${baseUrl}/journals/${journal.code}`,
            lastModified: journal.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        }));

        // 3. Articles (Dynamic - Published only)
        const articles = await prisma.article.findMany({
            where: { status: 'published' },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 5000,
        });

        const articleRoutes = articles.map((article) => ({
            url: `${baseUrl}/articles/${article.id}`,
            lastModified: article.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        }));

        // 4. Books (Dynamic)
        const books = await prisma.book.findMany({
            select: { id: true, updatedAt: true },
            take: 1000,
            orderBy: { updatedAt: 'desc' },
        });

        const bookRoutes = books.map((book) => ({
            url: `${baseUrl}/books/${book.id}`,
            lastModified: book.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));

        // 5. Conferences (Dynamic)
        const conferences = await prisma.conference.findMany({
            where: { status: { not: 'cancelled' } },
            select: { id: true, updatedAt: true },
            take: 100,
        });

        const conferenceRoutes = conferences.map((conf) => ({
            url: `${baseUrl}/conferences/${conf.id}`,
            lastModified: conf.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

        // 6. Dissertations (Dynamic)
        const dissertations = await prisma.dissertation.findMany({
            where: { status: 'published' },
            select: { id: true, updatedAt: true },
            take: 1000,
        });

        const dissertationRoutes = dissertations.map((diss) => ({
            url: `${baseUrl}/dissertations/${diss.id}`,
            lastModified: diss.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));

        // 7. Announcements (Dynamic)
        const announcements = await prisma.announcement.findMany({
            select: { id: true, updatedAt: true },
            take: 1000,
            orderBy: { createdAt: 'desc' }
        });

        const announcementRoutes = announcements.map((announcement) => ({
            url: `${baseUrl}/announcements/${announcement.id}`,
            lastModified: announcement.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        }));

        return [...staticRoutes, ...journalRoutes, ...articleRoutes, ...bookRoutes, ...conferenceRoutes, ...dissertationRoutes, ...announcementRoutes];

    } catch (error) {
        console.warn("Database connection failed during sitemap generation, returning only static routes:", error);
        return staticRoutes;
    }
}
