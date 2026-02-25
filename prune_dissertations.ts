import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const allowedTitleSubstrings = [
        "Evaluation-of-Credit-Performance-of-Nati",
        "Level of Employee", // job satisfaction
        "Multi-Storey Steel Office",
        "Financial position Analysis of Bank Asia",
        "Rahingya Persecution in Myanmar",
        "The Local Government of Bangladesh",
        "Technological Innovations to Overcome",
        "The Economic and Environmental Dynamics",
        "Explore Specific Applications of Quantum",
        "Benefits And Challenges of Edge"
    ].map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const items = await prisma.dissertation.findMany({
        select: { id: true, title: true }
    });

    console.log(`Found ${items.length} dissertations/theses in local database. Scanning to prune extra records...`);

    let deletedCount = 0;
    for (const item of items) {
        const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Check if it matches any of the allowed substrings
        const isAllowed = allowedTitleSubstrings.some(sub => normalizedTitle.includes(sub));

        if (!isAllowed) {
            try {
                await prisma.dissertation.delete({ where: { id: item.id } });
                console.log(`❌ Deleted: ${item.title}`);
                deletedCount++;
            } catch (err: any) {
                console.error(`Failed to delete "${item.title}":`, err.message);
            }
        } else {
            console.log(`✅ Kept: ${item.title}`);
        }
    }

    console.log(`\nFinished. Deleted ${deletedCount} unwanted dissertations.`);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
