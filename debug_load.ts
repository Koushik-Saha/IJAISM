import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const INPUT_DIR = path.join(process.cwd(), 'migration-data', 'transformed')

function readJSON(filename: string) {
    const filepath = path.join(INPUT_DIR, filename);
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

async function debugFilter() {
    const dbJournals = await prisma.journal.findMany({ select: { id: true, code: true } });
    const validJournalIds = new Set(dbJournals.map(j => j.id));

    const dbUsers = await prisma.user.findMany({ select: { id: true } });
    const validUserIds = new Set(dbUsers.map(u => u.id));

    const dbIssues = await prisma.journalIssue.findMany({ select: { id: true } });
    const validIssueIds = new Set(dbIssues.map(i => i.id));

    const journals = readJSON('Journal.json');
    const transformToRealJournalId: Record<string, string> = {};
    for (const jsonJournal of journals) {
        const real = dbJournals.find(j => j.code === jsonJournal.code);
        if (real) {
            transformToRealJournalId[jsonJournal.id] = real.id;
        }
    }

    let articles = readJSON('Article.json');
    articles = articles.map((a: any) => ({
        ...a,
        journalId: transformToRealJournalId[a.journalId] || a.journalId
    }));

    let failJournal = 0;
    let failUser = 0;
    let failIssue = 0;

    for (const a of articles) {
        if (!validJournalIds.has(a.journalId)) failJournal++;
        if (!validUserIds.has(a.authorId)) failUser++;
        if (a.issueId && !validIssueIds.has(a.issueId)) failIssue++;
    }

    console.log(`Total Articles in JSON: ${articles.length}`);
    console.log(`Failed Journal Check: ${failJournal}`);
    console.log(`Failed User Check: ${failUser}`);
    console.log(`Failed Issue Check: ${failIssue}`);
}

debugFilter()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
