import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const journals = await prisma.journal.findMany({
        select: {
            id: true,
            code: true,
            fullName: true,
            coverImageUrl: true,
            _count: {
                select: { articles: true }
            }
        }
    })

    // Group by fullName
    const grouped = journals.reduce((acc, j) => {
        if (!acc[j.fullName]) acc[j.fullName] = [];
        acc[j.fullName].push(j);
        return acc;
    }, {} as any)

    // Only print duplicates
    for (const name in grouped) {
        if (grouped[name].length > 1) {
            console.log(`\n\n=== ${name} ===`)
            console.table(grouped[name])
        }
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
