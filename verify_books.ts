import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const books = await prisma.book.findMany({
        select: {
            id: true,
            title: true
        }
    });

    console.log(`Currently there are ${books.length} books in the database:`);
    for (const book of books) {
        console.log(`- ${book.title}`);
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
