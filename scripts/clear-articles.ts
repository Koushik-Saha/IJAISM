
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup...');

    try {
        // Delete all download logs first (optional but good for clean slate)
        const deletedLogs = await prisma.downloadLog.deleteMany({});
        console.log(`Deleted ${deletedLogs.count} download logs.`);

        // Delete all articles (Cascades to Reviews and CoAuthors)
        const deletedArticles = await prisma.article.deleteMany({});
        console.log(`Deleted ${deletedArticles.count} articles.`);

        console.log('Cleanup completed successfully.');
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
