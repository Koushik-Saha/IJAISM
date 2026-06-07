
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Database-wide IJAISM -> C5K Rebrand...');

  // 1. Update Announcements
  const announcements = await prisma.announcement.findMany({});
  console.log(`Found ${announcements.length} announcements.`);
  for (const ann of announcements) {
    const newTitle = ann.title.replace(/IJAISM/g, 'C5K');
    const newContent = ann.content.replace(/IJAISM/g, 'C5K');
    const newExcerpt = ann.excerpt ? ann.excerpt.replace(/IJAISM/g, 'C5K') : null;
    const newAuthor = ann.author ? ann.author.replace(/IJAISM/g, 'C5K') : null;

    if (newTitle !== ann.title || newContent !== ann.content || newExcerpt !== ann.excerpt || newAuthor !== ann.author) {
      await prisma.announcement.update({
        where: { id: ann.id },
        data: {
          title: newTitle,
          content: newContent,
          excerpt: newExcerpt,
          author: newAuthor
        }
      });
      console.log(`  Updated announcement: "${newTitle}"`);
    }
  }

  // 2. Update Journals
  const journals = await prisma.journal.findMany({});
  console.log(`Found ${journals.length} journals.`);
  for (const j of journals) {
    const newFullName = j.fullName.replace(/IJAISM/g, 'C5K');
    const newShortName = j.shortName ? j.shortName.replace(/IJAISM/g, 'C5K') : null;
    const newDesc = j.description ? j.description.replace(/IJAISM/g, 'C5K') : null;
    const newAims = j.aimsAndScope ? j.aimsAndScope.replace(/IJAISM/g, 'C5K') : null;
    const newPublisher = j.publisher ? j.publisher.replace(/IJAISM/g, 'C5K') : null;

    if (newFullName !== j.fullName || newShortName !== j.shortName || newDesc !== j.description || newAims !== j.aimsAndScope || newPublisher !== j.publisher) {
      await prisma.journal.update({
        where: { id: j.id },
        data: {
          fullName: newFullName,
          shortName: newShortName,
          description: newDesc,
          aimsAndScope: newAims,
          publisher: newPublisher
        }
      });
      console.log(`  Updated journal: "${newFullName}"`);
    }
  }

  // 3. Update Users
  const users = await prisma.user.findMany({});
  console.log(`Found ${users.length} users.`);
  for (const u of users) {
    const newName = u.name.replace(/IJAISM/g, 'C5K');
    const newEmail = u.email.replace(/ijaism\.org/g, 'c5k.com').replace(/ijaism\.com/g, 'c5k.com');
    const newUni = u.university.replace(/IJAISM/g, 'C5K');
    const newAff = u.affiliation ? u.affiliation.replace(/IJAISM/g, 'C5K') : null;
    const newBio = u.bio ? u.bio.replace(/IJAISM/g, 'C5K') : null;

    if (newName !== u.name || newEmail !== u.email || newUni !== u.university || newAff !== u.affiliation || newBio !== u.bio) {
      // Check if updating the email causes a conflict
      if (newEmail !== u.email) {
        const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
        if (conflict) {
          console.warn(`  ⚠️ Skip email update for ${u.email} -> ${newEmail} (already exists).`);
          continue;
        }
      }

      await prisma.user.update({
        where: { id: u.id },
        data: {
          name: newName,
          email: newEmail,
          university: newUni,
          affiliation: newAff,
          bio: newBio
        }
      });
      console.log(`  Updated user: ${u.email} -> ${newEmail}`);
    }
  }

  // 4. Update Articles
  const articles = await prisma.article.findMany({});
  console.log(`Found ${articles.length} articles.`);
  for (const art of articles) {
    const newTitle = art.title.replace(/IJAISM/g, 'C5K');
    const newAbstract = art.abstract.replace(/IJAISM/g, 'C5K');
    const newDoi = art.doi ? art.doi.replace(/ijaism/gi, 'c5k') : null;
    const newKeywords = art.keywords.map(k => k.replace(/IJAISM/g, 'C5K'));

    let hasKeywordChange = false;
    for (let i = 0; i < art.keywords.length; i++) {
      if (art.keywords[i] !== newKeywords[i]) hasKeywordChange = true;
    }

    if (newTitle !== art.title || newAbstract !== art.abstract || newDoi !== art.doi || hasKeywordChange) {
      if (newDoi && newDoi !== art.doi) {
        const conflict = await prisma.article.findUnique({ where: { doi: newDoi } });
        if (conflict) {
          console.warn(`  ⚠️ Skip DOI update for ${art.doi} -> ${newDoi} (already exists).`);
          continue;
        }
      }

      await prisma.article.update({
        where: { id: art.id },
        data: {
          title: newTitle,
          abstract: newAbstract,
          doi: newDoi,
          keywords: newKeywords
        }
      });
      console.log(`  Updated article ID ${art.id.slice(0, 8)}...: "${newTitle.slice(0, 40)}"`);
    }
  }

  // 5. Update Blogs
  const blogs = await prisma.blog.findMany({});
  console.log(`Found ${blogs.length} blogs.`);
  for (const b of blogs) {
    const newTitle = b.title.replace(/IJAISM/g, 'C5K');
    const newContent = b.content.replace(/IJAISM/g, 'C5K');
    const newExcerpt = b.excerpt ? b.excerpt.replace(/IJAISM/g, 'C5K') : null;

    if (newTitle !== b.title || newContent !== b.content || newExcerpt !== b.excerpt) {
      await prisma.blog.update({
        where: { id: b.id },
        data: {
          title: newTitle,
          content: newContent,
          excerpt: newExcerpt
        }
      });
      console.log(`  Updated blog: "${newTitle}"`);
    }
  }

  // 6. Update Dissertations
  const dissertations = await prisma.dissertation.findMany({});
  console.log(`Found ${dissertations.length} dissertations.`);
  for (const d of dissertations) {
    const newTitle = d.title.replace(/IJAISM/g, 'C5K');
    const newAbstract = d.abstract.replace(/IJAISM/g, 'C5K');

    if (newTitle !== d.title || newAbstract !== d.abstract) {
      await prisma.dissertation.update({
        where: { id: d.id },
        data: {
          title: newTitle,
          abstract: newAbstract
        }
      });
      console.log(`  Updated dissertation: "${newTitle}"`);
    }
  }

  console.log('🎉 Database Rebrand Completed Successfully!');
}

main()
  .catch(err => {
    console.error('Fatal error during DB rebrand:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
