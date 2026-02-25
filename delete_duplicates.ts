import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const books = await prisma.book.findMany({
        select: { id: true, title: true, _count: { select: { chapters: true } } },
        orderBy: { createdAt: 'asc' }
    });

    const seenTitles = new Map<string, typeof books[0]>();
    let deletedCount = 0;

    for (const book of books) {
        const normalizedTitle = book.title.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (seenTitles.has(normalizedTitle)) {
            const existing = seenTitles.get(normalizedTitle)!;
            // We will keep the one with more chapters, or the first one we saw
            let toDelete = book.id;
            let toKeep = existing.id;

            if (book._count.chapters > existing._count.chapters) {
                toDelete = existing.id;
                toKeep = book.id;
                seenTitles.set(normalizedTitle, book); // Update kept reference
            }

            console.log(`Duplicate found for "${book.title}". Deleting duplicate (${toDelete}).`);
            try {
                await prisma.book.delete({ where: { id: toDelete } });
                deletedCount++;
            } catch (err: any) {
                console.error(`Failed to delete ${toDelete}:`, err.message);
            }
        } else {
            seenTitles.set(normalizedTitle, book);
        }
    }

    console.log(`\nFinished deleting ${deletedCount} duplicate books. Remaining count: ${seenTitles.size}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
