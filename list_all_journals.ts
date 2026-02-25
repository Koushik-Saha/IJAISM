import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const journals = await prisma.journal.findMany({
        select: {
            id: true,
            code: true,
            fullName: true,
            coverImageUrl: true,
            isActive: true,
        }
    })
    console.log(JSON.stringify(journals, null, 2))
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
