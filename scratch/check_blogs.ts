
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check authors of all blogs
  const blogs = await prisma.blog.findMany({
    select: {
      id: true,
      title: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
  
  console.log('--- BLOGS ---')
  console.log(JSON.stringify(blogs, null, 2))

  // Find users with 'Hossain' in their name
  const users = await prisma.user.findMany({
    where: {
      name: { contains: 'Hossain', mode: 'insensitive' }
    },
    select: { id: true, name: true, email: true }
  })
  console.log('--- USERS WITH HOSSAIN ---')
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
