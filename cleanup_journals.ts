import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const emptyJournals = await prisma.journal.findMany({
        where: {
            articles: { none: {} }
        },
        select: {
            id: true,
            code: true,
            fullName: true
        }
    })

    if (emptyJournals.length > 0) {
        console.log(`Found ${emptyJournals.length} journals with 0 articles. Deleting them...`);
        for (const j of emptyJournals) {
            await prisma.journal.delete({ where: { id: j.id } })
            console.log(`Deleted: ${j.code} - ${j.fullName}`)
        }
    } else {
        console.log('No empty journals found.');
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
