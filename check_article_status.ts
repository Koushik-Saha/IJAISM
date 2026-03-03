import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const articles = await prisma.article.groupBy({
    by: ['status'],
    _count: { id: true }
  })
  console.log(articles)
}
main().finally(() => prisma.$disconnect())
