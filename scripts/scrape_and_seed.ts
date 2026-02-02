// @ts-nocheck
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE_URL = 'https://c5k.com/home-article';

// Helper to cleanup text
const clean = (text: string) => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// Generating a Code from Name (e.g. "Journal of Info Tech" -> "JIT")
const generateCode = (name: string) => {
    const caps = name.match(/[A-Z]/g);
    if (caps && caps.length >= 2) return caps.join('');
    return name.substring(0, 3).toUpperCase();
};

async function scrape() {
    console.log('Fetching ' + SOURCE_URL);

    const { data } = await axios.get(SOURCE_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });

    const journalSections = data.split('<h4');
    let totalImported = 0;

    // Find default author
    let defaultAuthor = await prisma.user.findFirst({ where: { role: 'super_admin' } });

    if (!defaultAuthor) {
        // Create one if absolutely no admin exists (shouldn't happen)
        defaultAuthor = await prisma.user.create({
            data: {
                email: 'admin@c5k.com',
                passwordHash: 'placeholder', // wont work for login but fine for relationship
                name: 'System Admin',
                university: 'System', // Required
                role: 'super_admin',
                isActive: true,
                isEmailVerified: true
            }
        });
    }

    for (let i = 1; i < journalSections.length; i++) {
        const section = '<h4' + journalSections[i];

        // Extract Journal Name
        // Pattern: <h4 ...> NAME </h4>
        const journalNameMatch = section.match(/<h4.*?>(.*?)<\/h4>/s);
        if (!journalNameMatch) continue;

        const journalNameRaw = clean(journalNameMatch[1]);
        const journalCode = generateCode(journalNameRaw);

        console.log(`Processing Journal: ${journalNameRaw} (${journalCode})`);

        // Upsert Journal
        let journal = await prisma.journal.findFirst({
            where: { fullName: journalNameRaw }
        });

        if (!journal) {
            // Try matching by code just in case
            journal = await prisma.journal.findUnique({ where: { code: journalCode } });
        }

        if (!journal) {
            console.log(`  Creating new journal: ${journalNameRaw}`);
            // @ts-ignore
            journal = await prisma.journal.create({
                data: {
                    fullName: journalNameRaw,
                    code: journalCode,
                    description: `Official journal of ${journalNameRaw}`,
                    isActive: true,
                    displayOrder: i,
                    editorId: defaultAuthor.id,
                }
            });
        }

        // Split by Article (<h5>)
        const articleBlocks = section.split('<h5');

        for (let j = 1; j < articleBlocks.length; j++) {
            const block = articleBlocks[j];

            // Title & Link
            // Match any anchor tag with href
            const titleMatch = block.match(/<a[^>]+href=["'](.*?)["'][^>]*>([\s\S]*?)<\/a>/i);

            if (!titleMatch) {
                // Debug matching if needed
                // console.log('No title match in block snippet:', block.substring(0, 50));
                continue;
            }

            const originalUrl = titleMatch[1];
            let title = clean(titleMatch[2]);

            // Clean title further (remove internal tags if any)
            title = title.replace(/<[^>]*>/g, '');

            // Skip obvious junk
            if (title.length < 5 || title.includes("Learn more") || title.includes("About") || title.includes("Home")) continue;

            // Authors
            const authorMatch = block.match(/Author Name:\s*(.*?)(<br|<\/p)/i);
            const authors = authorMatch ? clean(authorMatch[1]) : 'Unknown Author';

            // PDF
            const pdfMatch = block.match(/href="(.*?download-pdf.*?)"/);
            const pdfUrl = pdfMatch ? (pdfMatch[1].startsWith('http') ? pdfMatch[1] : `https://c5k.com${pdfMatch[1]}`) : null;

            // Date
            const dateMatch = block.match(/First published Online:\s*(.*?)(<br|<\/p)/i);
            const dateStr = dateMatch ? clean(dateMatch[1]) : new Date().toISOString();
            const pubDate = new Date(dateStr);

            // Validation
            // Ensure "Article ID" exists to consider it real
            if (!block.includes('Article ID')) continue;

            console.log(`  Article: ${title.substring(0, 40)}...`);

            const articleData = {
                title,
                abstract: `Published in ${journalNameRaw}. Authors: ${authors}. (Scraped from C5K)`,
                status: 'published',
                publicationDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
                viewCount: Math.floor(Math.random() * 500) + 50,
                pdfUrl: pdfUrl,
                journalId: journal.id,
                articleType: 'Research Article',
            };

            const existing = await prisma.article.findFirst({
                where: {
                    title: title,
                    journalId: journal.id
                }
            });

            if (existing) {
                // Optional: update fields
                // console.log('    Skipping existing article.');
            } else {
                // @ts-ignore
                await prisma.article.create({
                    data: {
                        ...articleData,
                        authorId: defaultAuthor.id,
                    }
                });
                totalImported++;
            }
        }
    }

    console.log(`\nImport Complete. Total new articles: ${totalImported}`);
}

scrape()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
