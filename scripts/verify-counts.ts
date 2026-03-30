import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function v() {
  console.log('--- DB STATE ---');
  const counts = {
    Journals: await prisma.journal.count(),
    Articles: await prisma.article.count(),
    Books: await prisma.book.count(),
    BookChapters: await prisma.bookChapter.count(),
    Dissertations: await prisma.dissertation.count(),
    DissertationChapters: await prisma.dissertationChapter.count(),
    Announcements: await prisma.announcement.count(),
    Blogs: await prisma.blog.count(),
    Conferences: await prisma.conference.count(),
  };
  console.table(counts);
  
  const sampleJ = await prisma.journal.findFirst({ where: { code: 'jbvada' } });
  console.log('Sample Journal (jbvada) Metadata:', !!sampleJ?.impactFactor ? 'Metadata Present' : 'Metadata Missing');
  console.log('Sample Book Chapter Count:', await prisma.bookChapter.count());
}
v().catch(console.error).finally(() => prisma.$disconnect());
