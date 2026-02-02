
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetEmail = 'editor.amlid@c5k.com';
    console.log(`🔍 Checking user: ${targetEmail}`);

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: { managedJournals: true }
    });

    if (!user) {
        console.error(`❌ User ${targetEmail} NOT FOUND.`);
        // Listing all editors to see if there's a typo or if we need to create
        const editors = await prisma.user.findMany({ where: { role: 'editor' } });
        console.log('Available Editors:', editors.map(e => e.email));
        return;
    }

    console.log(`✅ Found User: ${user.id} (${user.role})`);
    console.log(`   Managed Journals: ${user.managedJournals.map(j => j.code).join(', ') || 'None'}`);

    // 2. Find the Journal with issues (TBFLI)
    const journalCode = 'TBFLI';
    const journal = await prisma.journal.findUnique({
        where: { code: journalCode },
        include: { editor: true }
    });

    if (!journal) {
        console.error(`❌ Journal ${journalCode} not found.`);
        return;
    }

    console.log(`📚 Journal ${journalCode} is currently managed by: ${journal.editor?.email || 'Nobody'}`);

    // 3. Re-assign
    console.log(`🔄 Re-assigning ${journalCode} to ${targetEmail}...`);
    await prisma.journal.update({
        where: { id: journal.id },
        data: { editorId: user.id }
    });

    console.log(`✨ DONE. ${targetEmail} is now the editor of ${journalCode}.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
