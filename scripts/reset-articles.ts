
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Starting reset...');

    // 1. Delete Download Logs (Reset limits)
    const deletedLogs = await prisma.downloadLog.deleteMany({});
    console.log(`Deleted ${deletedLogs.count} download logs.`);

    // 2. Delete Articles (Cascades to Reviews, CoAuthors)
    const deletedArticles = await prisma.article.deleteMany({});
    console.log(`Deleted ${deletedArticles.count} articles.`);

    console.log('Reset complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
