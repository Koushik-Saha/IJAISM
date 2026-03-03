import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const result = await prisma.article.updateMany({
    data: { status: 'published' }
  })
  console.log(`Updated ${result.count} articles to 'published'`)
}
main().finally(() => prisma.$disconnect())
