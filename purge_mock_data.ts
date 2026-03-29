import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- Phase 1: Safe Mock Data Purge ---')

    // 1. Identify Users to Keep
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@c5k.com' } });

    const dissertations = await prisma.dissertation.findMany({ select: { authorId: true } });
    const blogs = await prisma.blog.findMany({ select: { authorId: true } });

    const usersToKeep = new Set<string>();
    if (adminUser) usersToKeep.add(adminUser.id);
    dissertations.forEach(d => usersToKeep.add(d.authorId));
    blogs.forEach(b => usersToKeep.add(b.authorId));

    console.log(`Protecting ${usersToKeep.size} essential users (Admin, Dissertation Authors, Blog Authors)...`);

    // 2. Delete All Articles (Since we are migrating the complete set from the old DB)
    const deletedArticles = await prisma.article.deleteMany({});
    console.log(`Deleted ${deletedArticles.count} mock Articles.`);

    // 3. Delete All Journal Issues (Since we are migrating the complete set)
    const deletedIssues = await prisma.journalIssue.deleteMany({});
    console.log(`Deleted ${deletedIssues.count} mock Journal Issues.`);

    // 4. Clean up any Reviews or other dependent data before deleting users
    await prisma.review.deleteMany({});
    console.log('Deleted all old Reviews to prevent foreign key blocks on User deletions.');

    await prisma.downloadLog.deleteMany({});
    await prisma.conferenceRegistration.deleteMany({});

    // 5. Delete Users NOT in the 'keep' set
    const deletedUsers = await prisma.user.deleteMany({
        where: {
            id: { notIn: Array.from(usersToKeep) }
        }
    });
    console.log(`Deleted ${deletedUsers.count} mock Users.`);

    console.log('--- Phase 1 Complete ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
