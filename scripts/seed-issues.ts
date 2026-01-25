
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Journal Issues...');

    const journals = await prisma.journal.findMany();

    for (const journal of journals) {
        const existingIssues = await prisma.journalIssue.count({ where: { journalId: journal.id } });

        if (existingIssues === 0) {
            console.log(`Creating issues for [${journal.code}]...`);

            // Create Volume 1, Issues 1-4
            for (let i = 1; i <= 4; i++) {
                await prisma.journalIssue.create({
                    data: {
                        journalId: journal.id,
                        volume: 1,
                        issue: i,
                        year: 2025,
                        title: i === 4 ? `Special Issue: Advances in ${journal.code}` : undefined,
                        isSpecial: i === 4,
                        isCurrent: i === 3, // Make issue 3 current
                        publishedAt: new Date(`2025-0${2 + i}-15`) // Spread dates
                    }
                });
            }
        } else {
            console.log(`Skipping [${journal.code}] (already has ${existingIssues} issues)`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
