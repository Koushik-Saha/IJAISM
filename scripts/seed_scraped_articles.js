
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting C5K Article Scrape & Seed (JS Mode)...');

    const htmlPath = path.join(process.cwd(), 'scripts', 'c5k_full.html');
    if (!fs.existsSync(htmlPath)) {
        console.error('❌ Source file not found:', htmlPath);
        process.exit(1);
    }

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Split by 'class="journal-section'
    const sections = html.split('class="journal-section');

    console.log(`Found ${sections.length - 1} potential journal sections.`);

    for (let i = 1; i < sections.length; i++) {
        const sectionHtml = sections[i];

        // Extract Journal Name
        const journalNameMatch = sectionHtml.match(/data-journal="([^"]+)"/);
        if (!journalNameMatch) continue;

        const journalName = journalNameMatch[1].trim();
        // Simple code: first letters of words, max 8 chars
        let journalCode = journalName.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).map(w => w[0]).join('').toUpperCase();
        if (journalCode.length > 8) journalCode = journalCode.substring(0, 8);
        if (journalCode.length < 3) journalCode = (journalCode + "XXX").substring(0, 3); // Padding

        console.log(`\nProcessing Journal: ${journalName} (${journalCode})`);

        // Ensure Journal Exists
        let journal = await prisma.journal.findFirst({
            where: { fullName: journalName }
        });

        if (!journal) {
            // Try finding by code to avoid unique constraint error
            const existingCode = await prisma.journal.findUnique({ where: { code: journalCode } });
            if (existingCode) {
                journalCode = journalCode + Math.floor(Math.random() * 10); // Dedup strategy
            }

            journal = await prisma.journal.upsert({
                where: { code: journalCode },
                update: {},
                create: {
                    code: journalCode,
                    fullName: journalName,
                    description: "Scraped from C5K",
                    issn: "Pending",
                    isActive: true
                }
            });
            console.log(`Created new journal: ${journalCode}`);
        }

        // Find Articles
        const articleBlocks = sectionHtml.split('class="issue-container');

        for (let j = 1; j < articleBlocks.length; j++) {
            const block = articleBlocks[j];

            try {
                // Title
                const titleMatch = block.match(/<h5[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
                const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Unknown Title';

                // Author
                const authorMatch = block.match(/<strong>Author Name:<\/strong>([\s\S]*?)<\/p>/);
                const authorText = authorMatch ? authorMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : 'Unknown Author';
                const primaryAuthorName = authorText.split(',')[0].trim();

                if (!primaryAuthorName) continue;

                // Date
                const dateMatch = block.match(/First published Online:[\s\S]*?<span>(.*?)<\/span>/);
                const publishedDate = dateMatch ? new Date(dateMatch[1].trim()) : new Date();
                if (isNaN(publishedDate.getTime())) {
                    // Fallback date if parse failed
                }

                // PDF
                const pdfMatch = block.match(/href="(https:\/\/c5k\.com\/download-pdf[^"]*)"/);
                const pdfUrl = pdfMatch ? pdfMatch[1] : null;

                // Author Upsert
                const slug = primaryAuthorName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
                const email = `${slug}@example.com`;

                let author = await prisma.user.findFirst({
                    where: { name: primaryAuthorName }
                });

                if (!author) {
                    author = await prisma.user.create({
                        data: {
                            name: primaryAuthorName,
                            email: email,
                            passwordHash: '$2b$10$EpIx.fV/pZ...placeholder...hash',
                            role: 'author',
                            isActive: true,
                            university: 'C5K Affiliated'
                        }
                    });
                }

                // Article Upsert
                const existingArticle = await prisma.article.findFirst({
                    where: { title: title }
                });

                if (!existingArticle) {
                    await prisma.article.create({
                        data: {
                            title: title,
                            abstract: "Abstract not available in list view. View PDF for details.",
                            status: 'published',
                            publicationDate: publishedDate,
                            journalId: journal.id,
                            authorId: author.id,
                            pdfUrl: pdfUrl,
                            keywords: [],
                            articleType: 'Research Article'
                        }
                    });
                    // console.log(`   + Created: ${title.substring(0, 30)}...`);
                } else {
                    // console.log(`   . Skipped (Exists): ${title.substring(0, 30)}...`);
                }

            } catch (e) {
                console.error('Error parsing article block:', e.message);
            }
        }
        console.log(`   Processed ${articleBlocks.length - 1} articles.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
