import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const issueId = '0a5d39e3-8238-4a2f-963e-738fa0afb92a';
  // 1. Find the article
  const article = await prisma.article.findFirst({
    where: { title: { contains: 'Artificial Intelligence Applications' } },
    select: { id: true, title: true, issueId: true, volume: true, issue: true }
  });

  if (!article) {
    console.log('❌ Article not found!');
  } else {
    console.log('✅ Article found:', article.title);
    console.log('   Article ID:', article.id);
    console.log('   Assigned Issue ID:', article.issueId);
    console.log('   Volume/Issue:', article.volume, article.issue);

    if (article.issueId === issueId) {
      console.log('   MATCH: Article is assigned to the target Issue ID.');
    } else {
      console.log('   MISMATCH: Article is assigned to a DIFFERENT Issue ID.');
      if (article.issueId) {
        const actualIssue = await prisma.journalIssue.findUnique({ where: { id: article.issueId } });
        console.log('   Actual Issue details:', actualIssue?.volume, actualIssue?.issue, actualIssue?.title, actualIssue?.id);
      }
    }
  }

  // 2. Check the target issue
  const targetIssue = await prisma.journalIssue.findUnique({
    where: { id: issueId },
    include: { articles: true }
  });
  console.log('\n🔍 Target Issue (URL ID):', issueId);
  if (targetIssue) {
    console.log('   Details:', targetIssue.volume, targetIssue.issue, targetIssue.title);
    console.log('   Articles Count:', targetIssue.articles.length);
  } else {
    console.log('   ❌ Target Issue not found in DB!');
  }

  // 3. Check for duplicates
  const duplicates = await prisma.journalIssue.findMany({
    where: { volume: 1, issue: 4 }
  });
  console.log('\n⚠️ Issues with Vol 1, Issue 4:', duplicates.length);
  duplicates.forEach(d => console.log(`   - ID: ${d.id}, Special: ${d.isSpecial}, Title: ${d.title}, Journal: ${d.journalId}`));

}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
