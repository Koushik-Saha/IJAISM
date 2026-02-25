import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const books = await prisma.book.findMany({
        select: { id: true, title: true, coverImageUrl: true }
    });

    console.log(`Checking ${books.length} remaining books:`);
    for (const book of books) {
        console.log(`- ${book.title} (Cover: ${book.coverImageUrl})`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
