import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log('--- DB CLEANUP & VERIFICATION ---');
  
  // 1. Deduplicate BookChapters
  const bcs = await prisma.bookChapter.findMany({ orderBy: { title: 'asc' } });
  const seenBC = new Set();
  let bcDel = 0;
  for (const b of bcs) {
    const key = `${b.bookId}-${b.title}`;
    if (seenBC.has(key)) {
      await prisma.bookChapter.delete({ where: { id: b.id } });
      bcDel++;
    } else {
      seenBC.add(key);
    }
  }
  console.log(`Removed ${bcDel} duplicate BookChapters. Current: ${await prisma.bookChapter.count()}`);

  // 2. Deduplicate DissertationChapters
  const dcs = await prisma.dissertationChapter.findMany();
  const seenDC = new Set();
  let dcDel = 0;
  for (const d of dcs) {
    const key = `${d.dissertationId}-${d.title}`;
    if (seenDC.has(key)) {
      await prisma.dissertationChapter.delete({ where: { id: d.id } });
      dcDel++;
    } else {
      seenDC.add(key);
    }
  }
  console.log(`Removed ${dcDel} duplicate DissertationChapters. Current: ${await prisma.dissertationChapter.count()}`);

  // 3. Verify Journal Metadata
  const j = await prisma.journal.findFirst({ where: { code: { equals: 'jbvada', mode: 'insensitive' } } });
  if (j) {
    console.log('JBVADA Metadata:', {
      impactFactor: j.impactFactor,
      citeScore: j.citeScore,
      issn: j.issn,
      eIssn: j.eIssn
    });
  } else {
    console.log('JBVADA not found!');
  }
}

clean().catch(console.error).finally(() => prisma.$disconnect());
