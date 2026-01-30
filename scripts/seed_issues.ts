
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Issues...');

    // Get the first active journal
    const journal = await prisma.journal.findFirst({
        where: { isActive: true }
    });

    if (!journal) {
        console.error('❌ No active journal found. Please seed journals first.');
        return;
    }

    console.log(`Using Journal: ${journal.fullName} (${journal.code})`);

    // Create 10 issues
    const currentYear = new Date().getFullYear();

    for (let i = 1; i <= 10; i++) {
        const volume = 1;
        const issueNum = i;

        // Check if exists
        const exists = await prisma.journalIssue.findFirst({
            where: { journalId: journal.id, volume, issue: issueNum }
        });

        if (!exists) {
            await prisma.journalIssue.create({
                data: {
                    journalId: journal.id,
                    volume,
                    issue: issueNum,
                    year: currentYear,
                    title: i % 4 === 0 ? `Special Issue on Topic ${i}` : undefined,
                    isSpecial: i % 4 === 0,
                    description: `Generated issue ${i} for testing.`
                }
            });
            console.log(`✅ Created Vol ${volume}, Issue ${issueNum}`);
        } else {
            console.log(`⚠️ Vol ${volume}, Issue ${issueNum} already exists.`);
        }
    }

    console.log('✨ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
