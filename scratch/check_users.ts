
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Admin', mode: 'insensitive' } },
        { name: { contains: 'Rakib', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, email: true, role: true }
  })
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
