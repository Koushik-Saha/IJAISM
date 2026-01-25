
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Journals and Issues...');

    const journals = await prisma.journal.findMany({
        include: {
            _count: {
                select: { issues: true }
            }
        }
    });

    if (journals.length === 0) {
        console.log('❌ No journals found in the database.');
        return;
    }

    console.log(`✅ Found ${journals.length} journals:`);
    for (const journal of journals) {
        console.log(`- [${journal.code}] ${journal.fullName}: ${journal._count.issues} issues`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
