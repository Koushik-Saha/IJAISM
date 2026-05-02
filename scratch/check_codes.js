const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const journals = await prisma.journal.findMany({ select: { code: true, fullName: true } });
  console.log(journals);
}
main().catch(console.error).finally(() => prisma.$disconnect());
