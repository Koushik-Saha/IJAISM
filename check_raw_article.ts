import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const article = await prisma.article.findFirst({
        select: { id: true, title: true, status: true, deletedAt: true }
    })
    console.log(article)

    const pubCount = await prisma.article.count({ where: { status: 'published', deletedAt: null } })
    console.log('Published & not deleted:', pubCount)
}

main().finally(() => prisma.$disconnect())
