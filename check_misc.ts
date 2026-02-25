import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const misc = await prisma.journal.findUnique({
    where: { code: 'MISC' },
    include: { _count: { select: { articles: true } } }
  })
  console.log('MISC journal:', misc)
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
