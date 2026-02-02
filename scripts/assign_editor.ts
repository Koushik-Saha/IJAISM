
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing Journal Assignment...');

    // 1. Find the Editor User
    // Try to find the user who is likely logged in. 
    // We'll search for 'editor' role.
    const editor = await prisma.user.findFirst({
        where: { role: 'editor' }
    });

    if (!editor) {
        console.error('❌ No editor found.');
        return;
    }
    console.log(`👤 Found Editor: ${editor.email} (${editor.id})`);

    // 2. Find the Journal with issues (TBFLI)
    const journalCode = 'TBFLI';
    const journal = await prisma.journal.findUnique({
        where: { code: journalCode }
    });

    if (!journal) {
        console.error(`❌ Journal ${journalCode} not found.`);
        return;
    }
    console.log(`📚 Found Journal: ${journal.fullName}`);

    // 3. Assign
    await prisma.journal.update({
        where: { id: journal.id },
        data: { editorId: editor.id }
    });

    console.log(`✅ Assigned ${journalCode} to ${editor.email}`);

    // verify managed journals
    const updatedUser = await prisma.user.findUnique({
        where: { id: editor.id },
        include: { managedJournals: true }
    });
    console.log('Managed Journals:', updatedUser?.managedJournals.map(j => j.code));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
