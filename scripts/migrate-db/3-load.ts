import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const INPUT_DIR = path.join(process.cwd(), 'migration-data', 'transformed');

function readJSON(filename: string) {
    const filepath = path.join(INPUT_DIR, filename);
    if (!fs.existsSync(filepath)) return [];
    const raw = fs.readFileSync(filepath, 'utf8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`Could not parse ${filename}`);
        return [];
    }
}

async function loadData() {
    console.log("Starting data load into Neon PostgreSQL...");

    // 1. Users
    const users = readJSON('User.json');
    if (users.length > 0) {
        console.log(`Loading ${users.length} Users...`);
        await prisma.user.createMany({ data: users, skipDuplicates: true });
    }
    const dbUsers = await prisma.user.findMany({ select: { id: true } });
    const validUserIds = new Set(dbUsers.map(u => u.id));

    // 2. Journals
    const journals = readJSON('Journal.json');
    if (journals.length > 0) {
        console.log(`Loading ${journals.length} Journals...`);
        await prisma.journal.createMany({ data: journals, skipDuplicates: true });
    }
    const dbJournals = await prisma.journal.findMany({ select: { id: true } });
    const validJournalIds = new Set(dbJournals.map(j => j.id));

    // 3. JournalIssues
    const issues = readJSON('JournalIssue.json');
    const validIssues = issues.filter((i: any) => validJournalIds.has(i.journalId));
    if (validIssues.length > 0) {
        console.log(`Loading ${validIssues.length} JournalIssues...`);
        await prisma.journalIssue.createMany({ data: validIssues, skipDuplicates: true });
    }
    const dbIssues = await prisma.journalIssue.findMany({ select: { id: true } });
    const validIssueIds = new Set(dbIssues.map(i => i.id));

    // 4. Articles
    const articles = readJSON('Article.json');
    const validArticles = articles.filter((a: any) =>
        validJournalIds.has(a.journalId) &&
        validUserIds.has(a.authorId) &&
        (!a.issueId || validIssueIds.has(a.issueId))
    );
    if (validArticles.length > 0) {
        console.log(`Loading ${validArticles.length} Articles...`);
        await prisma.article.createMany({ data: validArticles, skipDuplicates: true });
    }

    // 5. Books
    const books = readJSON('Book.json');
    if (books.length > 0) {
        console.log(`Loading ${books.length} Books...`);
        await prisma.book.createMany({ data: books, skipDuplicates: true });
    }
    const dbBooks = await prisma.book.findMany({ select: { id: true } });
    const validBookIds = new Set(dbBooks.map(b => b.id));

    // 6. BookChapters
    const bookChapters = readJSON('BookChapter.json');
    const validBookChapters = bookChapters.filter((c: any) => validBookIds.has(c.bookId));
    if (validBookChapters.length > 0) {
        console.log(`Loading ${validBookChapters.length} BookChapters...`);
        await prisma.bookChapter.createMany({ data: validBookChapters, skipDuplicates: true });
    }

    // 7. Dissertations
    const dissertations = readJSON('Dissertation.json');
    const validDissertations = dissertations.filter((d: any) => validUserIds.has(d.authorId));
    if (validDissertations.length > 0) {
        console.log(`Loading ${validDissertations.length} Dissertations...`);
        await prisma.dissertation.createMany({ data: validDissertations, skipDuplicates: true });
    }
    const dbDissertations = await prisma.dissertation.findMany({ select: { id: true } });
    const validDissertationIds = new Set(dbDissertations.map(d => d.id));

    // 8. DissertationChapters
    const dissertationChapters = readJSON('DissertationChapter.json');
    const validDissertationChapters = dissertationChapters.filter((c: any) => validDissertationIds.has(c.dissertationId));
    if (validDissertationChapters.length > 0) {
        console.log(`Loading ${validDissertationChapters.length} DissertationChapters...`);
        await prisma.dissertationChapter.createMany({ data: validDissertationChapters, skipDuplicates: true });
    }

    // 9. Newsletter Subscribers
    const subscribers = readJSON('NewsletterSubscriber.json');
    if (subscribers.length > 0) {
        console.log(`Loading ${subscribers.length} Subscribers...`);
        await prisma.newsletterSubscriber.createMany({ data: subscribers, skipDuplicates: true });
    }

    console.log("Data load complete!");
}

loadData()
    .catch(e => {
        console.error("Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
