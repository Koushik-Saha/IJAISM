
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetEmail = 'editor.amlid@c5k.com';
    console.log(`🕵️‍♀️ Simulating API for: ${targetEmail}`);

    // 1. Fetch User like API does
    const user = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: { managedJournals: true }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`User Role: ${user.role}`);
    console.log(`Managed Journals: ${user.managedJournals.length}`);
    user.managedJournals.forEach(j => console.log(` - ${j.fullName} (${j.code}) ID: ${j.id}`));

    if (user.managedJournals.length === 0) {
        console.log('User manages no journals. API returns []');
        return;
    }

    // 2. Build Query
    const journalIds = user.managedJournals.map(j => j.id);
    const whereClause = {
        journalId: { in: journalIds }
    };

    console.log('Querying Issues with:', JSON.stringify(whereClause, null, 2));

    // 3. Execute Query
    const issues = await prisma.journalIssue.findMany({
        where: whereClause,
        include: {
            journal: { select: { code: true } }
        }
    });

    console.log(`Found ${issues.length} issues.`);
    issues.forEach(i => console.log(` - Vol ${i.volume} Issue ${i.issue} (Journal: ${i.journal.code})`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
