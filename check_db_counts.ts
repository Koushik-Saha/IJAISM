import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.count();
  const articles = await prisma.article.count();
  const issues = await prisma.journalIssue.count();
  
  console.log(`Users: ${users}`);
  console.log(`Articles: ${articles}`);
  console.log(`Issues: ${issues}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
