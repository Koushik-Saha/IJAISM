import { prisma } from "../lib/prisma";

async function main() {
    console.log("Cleaning up JournalEditor table...");
    // 1. Delete all current journal editors
    await prisma.journalEditor.deleteMany({});

    // 2. Fetch all journals that have an editorId
    const journals = await prisma.journal.findMany({
        where: {
            editorId: { not: null }
        }
    });

    console.log(`Found ${journals.length} journals with an editorId. Syncing to JournalEditor table as editor_in_chief...`);

    for (const journal of journals) {
        if (journal.editorId) {
            await prisma.journalEditor.create({
                data: {
                    journalId: journal.id,
                    userId: journal.editorId,
                    role: "editor_in_chief"
                }
            });
            console.log(`Synced EIC for journal ${journal.code}`);
        }
    }

    console.log("Sync completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
