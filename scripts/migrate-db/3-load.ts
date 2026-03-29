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
    const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const validUserIds = new Set(dbUsers.map(u => u.id));

    // Create a mapping from JSON User ID -> Real DB User ID (by email)
    const transformToRealUserId: Record<string, string> = {};
    for (const jsonUser of users) {
        const real = dbUsers.find(u => u.email === jsonUser.email);
        if (real) {
            transformToRealUserId[jsonUser.id] = real.id;
        }
    }

    // 2. Journals
    const journals = readJSON('Journal.json');
    if (journals.length > 0) {
        console.log(`Loading ${journals.length} Journals...`);
        await prisma.journal.createMany({ data: journals, skipDuplicates: true });
    }
    const dbJournals = await prisma.journal.findMany({ select: { id: true, code: true } });
    const validJournalIds = new Set(dbJournals.map(j => j.id));

    // Create a mapping from the transformed JSON's journalId -> Real DB Journal ID
    const transformToRealJournalId: Record<string, string> = {};
    for (const jsonJournal of journals) {
        const real = dbJournals.find(j => j.code === jsonJournal.code);
        if (real) {
            transformToRealJournalId[jsonJournal.id] = real.id;
        }
    }

    // 3. JournalIssues
    let issues = readJSON('JournalIssue.json');
    issues = issues.map((i: any) => ({
        ...i,
        journalId: transformToRealJournalId[i.journalId] || i.journalId
    }));

    const validIssues = issues.filter((i: any) => validJournalIds.has(i.journalId));
    if (validIssues.length > 0) {
        console.log(`Loading ${validIssues.length} JournalIssues...`);
        await prisma.journalIssue.createMany({ data: validIssues, skipDuplicates: true });
    }
    const dbIssues = await prisma.journalIssue.findMany({ select: { id: true } });
    const validIssueIds = new Set(dbIssues.map(i => i.id));

    // 4. Articles
    let articles = readJSON('Article.json');
    articles = articles.map((a: any) => ({
        ...a,
        journalId: transformToRealJournalId[a.journalId] || a.journalId,
        authorId: transformToRealUserId[a.authorId] || a.authorId
    }));

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
    // Map authors for books
    books.forEach((b: any) => {
        if (b.authorId && transformToRealUserId[b.authorId]) {
            b.authorId = transformToRealUserId[b.authorId];
        }
    });
    // For books, we just check if author exists (if authorId is present)
    const validBooks = books.filter((b: any) => !b.authorId || validUserIds.has(b.authorId));
    if (validBooks.length > 0) {
        console.log(`Loading ${validBooks.length} Books...`);
        await prisma.book.createMany({ data: validBooks, skipDuplicates: true });
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
    dissertations.forEach((d: any) => {
        if (d.authorId && transformToRealUserId[d.authorId]) {
            d.authorId = transformToRealUserId[d.authorId];
        }
    });
    const validDissertations = dissertations.filter((d: any) => validUserIds.has(d.authorId));
    if (validDissertations.length > 0) {
        console.log(`Loading ${validDissertations.length} Dissertations...`);
        await prisma.dissertation.createMany({ data: validDissertations, skipDuplicates: true });
    }
    const dbDissertations = await prisma.dissertation.findMany({ select: { id: true } });
    const validDissertationIds = new Set(dbDissertations.map(d => d.id));

    // 8. DissertationChapters
    const dissChapters = readJSON('DissertationChapter.json');
    const validDissChapters = dissChapters.filter((c: any) => validDissertationIds.has(c.dissertationId));
    if (validDissChapters.length > 0) {
        console.log(`Loading ${validDissChapters.length} DissertationChapters...`);
        await prisma.dissertationChapter.createMany({ data: validDissChapters, skipDuplicates: true });
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
