import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const INPUT_DIR = path.join(process.cwd(), 'migration-data');
const OUTPUT_DIR = path.join(process.cwd(), 'migration-data', 'transformed');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Memory mapping to maintain relations
const idMap = {
    users: {} as Record<string, string>,
    journals: {} as Record<string, string>,
    issues: {} as Record<string, string>,
    articles: {} as Record<string, string>,
    books: {} as Record<string, string>,
    dissertations: {} as Record<string, string>,
};

// Safe date parser
function parseDate(val: any): string | null {
    if (!val || typeof val !== 'string') return null;
    if (val.includes('0000-00-00')) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
}

// Helper to read JSON
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

// Helper to save JSON
function saveJSON(filename: string, data: any) {
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved transformed data to ${filename} (${data.length} records)`);
}

function processUsers() {
    const oldUsers = readJSON('users.json');
    const newUsers = [];

    for (const user of oldUsers) {
        const newId = crypto.randomUUID();
        idMap.users[user.id.toString()] = newId;

        let role = 'author';
        if (user.user_type === 'A') role = 'author';
        if (user.user_type === 'W') role = 'author'; // Treat writer as author or standard user
        if (user.user_type === 'R') role = 'reviewer';
        // Admin was likely determined by email or another flag, for now map basic roles

        newUsers.push({
            id: newId,
            name: user.name || 'Unknown',
            email: user.email,
            passwordHash: user.password,
            role: role,
            university: user.address ? (user.address.substring(0, 100) || 'Not Provided') : 'Not Provided',
            affiliation: user.address,
            bio: user.profile,
            profileImageUrl: user.image_path,
            isEmailVerified: user.email_verified_at ? true : false,
            isActive: user.status === 1,
            createdAt: parseDate(user.created_at) || new Date().toISOString(),
            updatedAt: parseDate(user.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('User.json', newUsers);
}

function processJournals() {
    const oldJournals = readJSON('journal_articals.json');
    const newJournals = [];

    for (const journal of oldJournals) {
        const newId = crypto.randomUUID();
        idMap.journals[journal.id.toString()] = newId;

        newJournals.push({
            id: newId,
            fullName: journal.title || 'Untitled Journal',
            code: journal.slug || `JNL-${journal.id}`,
            aimsAndScope: journal.aim_scope,
            issn: journal.issn_print,
            eIssn: journal.issn_online,
            impactFactor: parseFloat(journal.impact_factor) || null,
            frequency: journal.publication_frequency,
            coverImageUrl: journal.journal_image !== '0' ? journal.journal_image : null,
            themeColor: journal.backgroundColor !== '0' ? journal.backgroundColor : '#006d77',
            citeScore: parseFloat(journal.cite_score) || null,
            isActive: true, // Assuming active if in DB
            createdAt: parseDate(journal.created_at) || new Date().toISOString(),
            updatedAt: parseDate(journal.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('Journal.json', newJournals);
}

function processIssues() {
    const oldVolumes = readJSON('volume.json');
    const newIssues = [];

    for (const vol of oldVolumes) {
        const newId = crypto.randomUUID();
        idMap.issues[vol.id.toString()] = newId;

        const journalId = idMap.journals[vol.journal_id?.toString()];
        if (!journalId) continue; // Orphan volume

        // The old db had 'volume_name' mapped via an ID, but let's extract digits or use default
        newIssues.push({
            id: newId,
            journalId: journalId,
            title: vol.issue || 'Standard Issue',
            volume: 1, // Default, would need manual cleanup if text was used
            issue: 1,
            year: parseInt(parseDate(vol.created_at)?.substring(0, 4) || new Date().getFullYear().toString()),
            coverUrl: vol.image_path,
            isCurrent: false,
            createdAt: parseDate(vol.created_at) || new Date().toISOString(),
            updatedAt: parseDate(vol.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('JournalIssue.json', newIssues);
}

function processArticles() {
    const oldArticles = readJSON('articles.json');
    const newArticles = [];

    // We need a fallback default user for missing authors to satisfy foreign key constraints
    const fallbackUserId = Object.values(idMap.users)[0] || crypto.randomUUID();

    for (const article of oldArticles) {
        const newId = crypto.randomUUID();
        idMap.articles[article.id.toString()] = newId;

        // Map Journal/Issue
        const issueId = idMap.issues[article.volume_id?.toString()] || null;
        // Map Author
        const authorId = idMap.users[article.writer_id?.toString()] || fallbackUserId;
        // We assume the first mapped journal is the default if missing from issue resolution,
        // Alternatively, if we know issueId, we use its parent journalId in load script,
        // but schema requires journalId explicitly.
        // For now, let's pick the first Journal for orphaned articles or try to lookup issue

        // Status mapping
        let status = 'draft';
        if (article.status === 2 || article.status === 3) status = 'published';
        if (article.status === 0) status = 'draft';
        if (article.status === 1) status = 'in_review';

        newArticles.push({
            id: newId,
            journalId: Object.values(idMap.journals)[0], // Hack: requires true lookup in load script if volume_id doesn't map cleanly
            title: article.title || 'Untitled',
            abstract: article.description || 'No abstract provided.',
            fullText: article.article_html,
            keywords: article.keyword ? [article.keyword] : [],
            articleType: 'Research Article', // Default
            doi: article.doi,
            status: status,
            pdfUrl: article.file_path,
            submissionDate: parseDate(article.submited_date),
            acceptanceDate: parseDate(article.accepted_date),
            publicationDate: parseDate(article.online_first),
            authorId: authorId,
            issueId: issueId,
            createdAt: parseDate(article.created_at) || new Date().toISOString(),
            updatedAt: parseDate(article.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('Article.json', newArticles);
}


function processBooks() {
    const oldBooks = readJSON('book_list.json');
    const newBooks = [];

    for (const book of oldBooks) {
        const newId = crypto.randomUUID();
        idMap.books[book.id.toString()] = newId;

        newBooks.push({
            id: newId,
            title: book.name || 'Untitled Book',
            authors: book.authors ? book.authors.split(',') : ['Unknown Author'],
            year: parseInt(parseDate(book.published_date)?.substring(0, 4) || '2024'),
            isbn: book.online_isbn || book.first_isbn || `ISBN-${book.id}`,
            pages: parseInt(book.dimention) || 0, // Dimention was sometimes used for pages in old weird schemas
            field: book.type || 'General',
            description: book.about || 'No description',
            fullDescription: book.des || book.description || 'No full description',
            price: book.price ? book.price.toString() : '0.00',
            publisher: book.copyright || 'Self Published',
            language: 'en', // Default
            edition: '1st',
            format: book.hard_cover ? 'Hardcover' : 'Paperback',
            coverImageUrl: book.book_img,
            createdAt: parseDate(book.timestamp) || new Date().toISOString(),
            updatedAt: parseDate(book.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('Book.json', newBooks);
}

function processBookChapters() {
    const oldChapters = readJSON('chapters.json');
    const newChapters = [];

    for (const chap of oldChapters) {
        const bookId = idMap.books[chap.book_id?.toString()];
        if (!bookId) continue;

        newChapters.push({
            id: crypto.randomUUID(),
            bookId: bookId,
            title: chap.title || 'Untitled Chapter',
            pageRange: chap.page_range,
            pdfUrl: chap.pdf_url,
            summary: chap.summary,
            createdAt: parseDate(chap.created_at) || new Date().toISOString(),
            updatedAt: parseDate(chap.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('BookChapter.json', newChapters);
}

function processDissertations() {
    const oldTheses = readJSON('thesis_list.json');
    const newDissertations = [];

    const fallbackUserId = Object.values(idMap.users)[0] || crypto.randomUUID();

    for (const thesis of oldTheses) {
        const newId = crypto.randomUUID();
        idMap.dissertations[thesis.id.toString()] = newId;

        newDissertations.push({
            id: newId,
            title: thesis.name || 'Untitled Dissertation',
            abstract: thesis.description || thesis.about || 'No abstract',
            authorId: fallbackUserId, // thesis_list has an implicit author, we map to existing if possible or fallback
            university: 'Unknown University',
            department: 'General',
            degreeType: thesis.type || 'Ph.D.',
            keywords: [],
            authorName: thesis.authors || 'Unknown Author',
            coverImageUrl: thesis.book_img,
            status: 'published',
            createdAt: parseDate(thesis.timestamp) || new Date().toISOString(),
            updatedAt: parseDate(thesis.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('Dissertation.json', newDissertations);
}

function processDissertationChapters() {
    const oldChapters = readJSON('thesis_chpater.json');
    const newChapters = [];

    for (const chap of oldChapters) {
        const dissertationId = idMap.dissertations[chap.thesis_id?.toString()];
        if (!dissertationId) continue;

        newChapters.push({
            id: crypto.randomUUID(),
            dissertationId: dissertationId,
            title: chap.title || 'Untitled Chapter',
            pageRange: chap.page_range,
            pdfUrl: chap.pdf_url,
            createdAt: parseDate(chap.created_at) || new Date().toISOString(),
            updatedAt: parseDate(chap.updated_at) || new Date().toISOString(),
        });
    }

    saveJSON('DissertationChapter.json', newChapters);
}

function processMisc() {
    // Subscribers
    const oldSubscribers = readJSON('subscribers.json');
    const newSubscribers = [];
    for (const sub of oldSubscribers) {
        if (sub.email) {
            newSubscribers.push({
                id: crypto.randomUUID(),
                email: sub.email,
                isActive: sub.status === 1,
                createdAt: parseDate(sub.created_at) || new Date().toISOString(),
            });
        }
    }
    saveJSON('NewsletterSubscriber.json', newSubscribers);

    // Blogs & News map similarly
}

export function transform() {
    console.log("Starting data transformation...");
    processUsers();
    processJournals();
    processIssues();
    processArticles();
    processBooks();
    processBookChapters();
    processDissertations();
    processDissertationChapters();
    processMisc();
    console.log("Transformation Complete.");
}

transform();
