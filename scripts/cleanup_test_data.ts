
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting cleanup...');

        // 1. Identify Test Journals
        const testJournals = await prisma.journal.findMany({
            where: {
                OR: [
                    { code: { startsWith: 'TEST', mode: 'insensitive' } },
                    { fullName: { contains: 'Test', mode: 'insensitive' } },
                    { fullName: { contains: 'Demo', mode: 'insensitive' } }
                ]
            },
            include: {
                articles: true,
                issues: true
            }
        });

        console.log(`Found ${testJournals.length} test journals.`);

        for (const journal of testJournals) {
            console.log(`Deleting Journal: ${journal.fullName} (${journal.code})`);

            // Delete Articles associated with this journal
            const articleCount = await prisma.article.deleteMany({
                where: { journalId: journal.id }
            });
            console.log(`  - Deleted ${articleCount.count} articles.`);

            // Delete Issues associated with this journal
            const issueCount = await prisma.journalIssue.deleteMany({
                where: { journalId: journal.id }
            });
            console.log(`  - Deleted ${issueCount.count} issues.`);

            // Delete the Journal itself
            await prisma.journal.delete({
                where: { id: journal.id }
            });
            console.log(`  - Journal deleted.`);
        }

        // 2. Loose Articles (Test Articles not in Test Journals)
        const testArticles = await prisma.article.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'Test Article', mode: 'insensitive' } },
                    { title: { startsWith: 'Test', mode: 'insensitive' } }
                ]
            }
        });
        console.log(`Deleted ${testArticles.count} loose test articles.`);

        // 3. Test Users (Be careful here, only very obvious ones)
        // Deleting users might cascade to many things, so let's stick to strict patterns if needed.
        // The user said "delete all test jurnal and also delete any kind of test thing"
        // I'll check for specific test emails.
        const testUsers = await prisma.user.deleteMany({
            where: {
                email: {
                    in: ['test@test.com', 'admin@test.com', 'user@test.com', 'author@test.com']
                }
            }
        });
        console.log(`Deleted ${testUsers.count} obvious test users.`);

        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
