import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'editor.amlid@c5k.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { managedJournals: true }
  });

  if (!user) {
    console.log('User not found:', email);
    return;
  }

  console.log('User:', user.name, user.role);
  console.log('Managed Journals:', user.managedJournals.length);
  user.managedJournals.forEach(j => console.log(' - ', j.code, j.fullName));
}

main().catch(console.error);
