
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Identify Super Admin user
  const superAdmin = await prisma.user.findFirst({
    where: { name: 'Super Admin' }
  })

  if (!superAdmin) {
    console.log('Super Admin user not found.')
    return
  }

  console.log(`Found Super Admin with ID: ${superAdmin.id}`)

  // 2. Rename the user
  const updatedUser = await prisma.user.update({
    where: { id: superAdmin.id },
    data: { name: 'Rakib Hossain' }
  })

  console.log(`User renamed to: ${updatedUser.name}`)

  // 3. Update announcements if they use the hardcoded name
  const announcements = await prisma.announcement.updateMany({
    where: { author: 'Super Admin' },
    data: { author: 'Rakib Hossain' }
  })

  console.log(`Updated ${announcements.count} announcements.`)

  // 4. Verify blogs
  const blogs = await prisma.blog.findMany({
    where: { authorId: superAdmin.id },
    include: { author: true }
  })

  console.log(`Verified ${blogs.length} blogs are now authored by: ${blogs[0]?.author.name || 'N/A'}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
