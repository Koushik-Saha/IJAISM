import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("\n--- New Database (Neon PostgreSQL) Table Counts ---");

    const tables = [
        { name: 'Users', count: await prisma.user.count() },
        { name: 'Journals', count: await prisma.journal.count() },
        { name: 'JournalIssues', count: await prisma.journalIssue.count() },
        { name: 'Articles', count: await prisma.article.count() },
        { name: 'Books', count: await prisma.book.count() },
        { name: 'BookChapters', count: await prisma.bookChapter.count() },
        { name: 'Dissertations', count: await prisma.dissertation.count() },
        { name: 'DissertationChapters', count: await prisma.dissertationChapter.count() },
        { name: 'Blogs', count: await prisma.blog.count() },
        { name: 'Announcements (News)', count: await prisma.announcement.count() },
        { name: 'NewsletterSubscribers', count: await prisma.newsletterSubscriber.count() },
        { name: 'DownloadLogs', count: await prisma.downloadLog.count() },
        { name: 'Conferences', count: await prisma.conference.count() },
        { name: 'ActivityLogs', count: await prisma.activityLog.count() },
    ];

    for (const table of tables) {
        console.log(`${table.name.padEnd(25)} : ${table.count} records`);
    }
    console.log("---------------------------------------------------");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
