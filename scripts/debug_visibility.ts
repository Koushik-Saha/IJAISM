
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging Issue Visibility...');

    // 1. List Users
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, managedJournals: { select: { id: true, code: true } } }
    });
    console.log('\n👥 Users:');
    users.forEach(u => {
        console.log(`- ${u.email} (${u.role}) ID: ${u.id}`);
        if (u.managedJournals.length > 0) {
            console.log(`  Managed Journals: ${u.managedJournals.map(j => j.code).join(', ')}`);
        } else {
            console.log(`  Managed Journals: None`);
        }
    });

    // 2. List Journals
    const journals = await prisma.journal.findMany({
        select: { id: true, code: true, editorId: true }
    });
    console.log('\n📚 Journals:');
    journals.forEach(j => {
        console.log(`- ${j.code} (ID: ${j.id}) EditorID: ${j.editorId}`);
    });

    // 3. List Issues
    const issues = await prisma.journalIssue.findMany({
        include: { journal: { select: { code: true } } }
    });
    console.log('\n🔢 Issues:');
    issues.forEach(i => {
        console.log(`- Vol ${i.volume}, Issue ${i.issue} (Journal: ${i.journal.code})`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
