import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), 'migration-data');
const legacyDbDir = '/Users/koushiksaha/Desktop/FixItUp/c5k Database';

function parseCSV(text: string): string[][] {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [(l = '')]; i = 0;
        } else row[i] += l;
        p = l;
    }
    const cleanRet = ret.map(row => row.map(cell => cell.replace(/^"|"$/g, '').trim()));
    if (cleanRet.length > 0 && cleanRet[cleanRet.length - 1].length === 1 && cleanRet[cleanRet.length - 1][0] === '') {
        cleanRet.pop();
    }
    return cleanRet;
}

function safeDate(val: string | null): Date {
    if (!val || val === 'NULL' || val === '0000-00-00 00:00:00') return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
}

const bookCategoryMap: Record<string, string> = {
    "1": "Business Information Management",
    "2": "Artificial Intelligence",
    "3": "Finance and Accounting",
    "4": "Sociology and Humanities",
    "5": "Science & Engineering",
    "6": "Medical Science",
    "7": "Chemistry and Nanocomposites",
    "8": "Energy & Environmental",
    "9": "Food & Agricultural",
    "10": "Education & Law",
    "11": "Material Engineering & Nanoscience",
    "12": "Multidisciplinary",
    "13": "Sustainability",
    "14": "Data Analytics",
    "15": "Health Informatics",
    "16": "Culture, History and Society",
    "17": "Mathematics and Computation",
    "18": "Particle and Nuclear Physics"
};

const bookIdMap: Record<string, string> = {};
const thesisIdMap: Record<string, string> = {};

async function migrateBooks() {
    console.log('Migrating Books...');
    const filePath = path.join(dataDir, 'book_list.json');
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const b of data) {
        try {
            let bookIsbn = b.first_isbn || `isbn-fallback-${b.id}`;
            const existingBook = await prisma.book.findFirst({ where: { isbn: bookIsbn } });
            if (existingBook && existingBook.title !== b.name) {
                // Same ISBN but different title -> append ID to make it unique for this legacy data
                bookIsbn = `${bookIsbn}-${b.id}`;
            }

            const book = await prisma.book.upsert({
                where: { isbn: bookIsbn },
                update: {},
                create: {
                    title: b.name || 'Untitled Book',
                    authors: b.authors ? b.authors.split(',').map((a: string) => a.trim()) : [],
                    year: b.published_date ? new Date(b.published_date).getFullYear() : 2024,
                    isbn: bookIsbn,
                    pages: parseInt(b.total_pages) || 0,
                    field: bookCategoryMap[b.category_id] || 'General',
                    description: b.des || 'No description',
                    fullDescription: b.about || 'No full description',
                    price: b.price?.toString() || '0',
                    publisher: 'C5K Publications',
                    language: 'English',
                    edition: '1st Edition',
                    format: 'Digital',
                    createdAt: safeDate(b.timestamp),
                }
            });
            bookIdMap[b.id.toString()] = book.id;
        } catch (e: any) {
            console.error(`Failed book ${b.name}: ${e.message}`);
        }
    }
    console.log(`✅ Books processed: ${Object.keys(bookIdMap).length}`);
}

async function migrateBookChapters() {
    console.log('Migrating Book Chapters...');
    const csvPath = path.join(legacyDbDir, 'chapters.csv');
    if (!fs.existsSync(csvPath)) return;
    const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
    const headers = rows[0];
    
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const data: any = {};
        headers.forEach((h, idx) => data[h] = row[idx]);

        const newBookId = bookIdMap[data.book_id];
        if (!newBookId) continue;

        try {
            await prisma.bookChapter.create({
                data: {
                    bookId: newBookId,
                    title: data.title || 'Untitled Chapter',
                    pageRange: data.page_range,
                    pdfUrl: data.pdf_url ? `/uploads/books/chapters/${data.pdf_url}` : null,
                    summary: data.summary && data.summary !== 'NULL' ? data.summary : null,
                    createdAt: safeDate(data.created_at)
                }
            });
            count++;
        } catch(e: any) {
            console.error(`Failed chapter ${data.title}: ${e.message}`);
        }
    }
    console.log(`✅ Book Chapters migrated: ${count}`);
}

async function migrateDissertations() {
    console.log('Migrating Dissertations...');
    const filePath = path.join(dataDir, 'thesis_list.json');
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const admin = await prisma.user.findFirst({ where: { role: 'super_admin' } }) || await prisma.user.findFirst();
    if (!admin) return;

    for (const t of data) {
        try {
            let dissertation = await prisma.dissertation.findFirst({
                where: { title: t.name || 'Untitled' }
            });

            if (!dissertation) {
                dissertation = await prisma.dissertation.create({
                    data: {
                        title: t.name || 'Untitled',
                        abstract: t.description || 'No abstract',
                        authorId: admin.id,
                        authorName: t.authors || 'Unknown',
                        university: 'Unknown University',
                        degreeType: t.category_id === 1 ? 'Master' : 'PhD',
                        defenseDate: safeDate(t.published_date),
                        status: 'approved',
                        createdAt: safeDate(t.timestamp)
                    }
                });
            }
            thesisIdMap[t.id.toString()] = dissertation.id;
        } catch (e: any) {
            console.error(`Failed dissertation ${t.name}: ${e.message}`);
        }
    }
    console.log(`✅ Dissertations processed: ${Object.keys(thesisIdMap).length}`);
}

async function migrateDissertationChapters() {
    console.log('Migrating Dissertation Chapters...');
    const csvPath = path.join(legacyDbDir, 'thesis_chpater.csv');
    if (!fs.existsSync(csvPath)) return;
    const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
    const headers = rows[0];

    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const data: any = {};
        headers.forEach((h, idx) => data[h] = row[idx]);

        const newThesisId = thesisIdMap[data.thesis_id];
        if (!newThesisId) continue;

        try {
            await prisma.dissertationChapter.create({
                data: {
                    dissertationId: newThesisId,
                    title: data.title || 'Untitled Chapter',
                    pageRange: data.page_range,
                    pdfUrl: data.pdf_url ? `/uploads/dissertations/chapters/${data.pdf_url}` : null,
                    createdAt: safeDate(data.created_at)
                }
            });
            count++;
        } catch(e: any) {
            console.error(`Failed thesis chapter ${data.title}: ${e.message}`);
        }
    }
    console.log(`✅ Dissertation Chapters migrated: ${count}`);
}

async function updateJournalMetadata() {
    console.log('Updating Journal Metadata...');
    const csvPath = path.join(legacyDbDir, 'journal_articals.csv');
    if (!fs.existsSync(csvPath)) return;
    const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
    const headers = rows[0];

    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const data: any = {};
        headers.forEach((h, idx) => data[h] = row[idx]);

        const slug = data.slug?.toLowerCase().trim();
        if (!slug) continue;

        try {
            const journal = await prisma.journal.findFirst({
                where: { code: { equals: slug, mode: 'insensitive' } }
            });

            if (journal) {
                await prisma.journal.update({
                    where: { id: journal.id },
                    data: {
                        themeColor: data.backgroundColor,
                        citeScore: parseFloat(data.cite_score) || 0,
                        impactFactor: parseFloat(data.impact_factor) || 0,
                        frequency: data.publication_frequency,
                        aimsAndScope: data.aim_scope,
                        issn: data.issn_print,
                        eIssn: data.issn_online,
                        subjectAreas: data.subject_area,
                        articleProcessingCharge: parseFloat(data.article_charge) || 0,
                        editorialBoardDescription: data.aim_scope // Fallback
                    }
                });
                count++;
            }
        } catch(e: any) {
            console.error(`Failed to update journal ${slug}: ${e.message}`);
        }
    }
    console.log(`✅ Journals updated: ${count}`);
}

async function migrateConferences() {
    console.log('Migrating Conferences...');
    try {
        const existing = await prisma.conference.findFirst({
            where: { title: 'C5K Global Research & Innovation Summit 2025' }
        });

        if (!existing) {
            await prisma.conference.create({
                data: {
                    title: 'C5K Global Research & Innovation Summit 2025',
                    description: 'Shaping the Future: AI, Technology, and Business Innovation',
                    startDate: new Date('2025-12-01'),
                    endDate: new Date('2025-12-02'),
                    venue: '761 State Highway 100 Port Isabel, TX 78578, USA',
                    status: 'upcoming',
                    fullDescription: 'AI & Business Analytics in Decision-Making Sustainable Innovation & Green Technology Evolving Trends in Digital Marketing & E-Business Cybersecurity & IT Infrastructure in the AI Era Publishing & Research Panel: From Paper to Publication',
                    websiteUrl: 'https://c5k.com/conferences',
                    topics: ['AI', 'Sustainability', 'Technology', 'Business']
                }
            });
            console.log('✅ Migrated 1 Conference');
        }
    } catch(e: any) {
        console.error(`Failed conference migration: ${e.message}`);
    }
}

async function run() {
    console.log('--- STARTING FINAL DATA TIE-INS ---');
    await migrateBooks();
    await migrateBookChapters();
    await migrateDissertations();
    await migrateDissertationChapters();
    await updateJournalMetadata();
    await migrateConferences();
    console.log('--- FINAL MIGRATION COMPLETE ---');
}

run().catch(console.error).finally(() => prisma.$disconnect());
