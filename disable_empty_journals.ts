import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const result = await prisma.journal.updateMany({
        where: {
            articles: { none: {} }
        },
        data: {
            isActive: false
        }
    })
    console.log(`Successfully disabled ${result.count} ghost journals with 0 articles.`);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
