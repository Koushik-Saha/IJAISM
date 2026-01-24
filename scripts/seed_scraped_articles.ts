
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting C5K Article Scrape & Seed...');

    const htmlPath = path.join(process.cwd(), 'scripts', 'c5k_full.html');
    if (!fs.existsSync(htmlPath)) {
        console.error('❌ Source file not found:', htmlPath);
        process.exit(1);
    }

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Regex Patterns
    // 1. Capture Journal Sections
    const journalSectionRegex = /<div class="journal-section\s*[^"]*"\s*data-journal="([^"]+)">([\s\S]*?)<!--\s*Journal Section End/g;
    // Note: The HTML might not have a clean "Journal Section End" comment, so we might need to look for closing divs.
    // Alternative: Split by "journal-section" class.

    // Let's rely on the structure: <div class="journal-section ... data-journal="..."> ...content... </div>
    // Since nested divs make regex hard for full sections, we will find all article blocks and look backwards for the journal name, or loosely parse.

    // Simpler approach: Regex for individual articles, but capturing context is hard.
    // Better approach: Regex to find the START of a journal section, then finding articles until the next journal section?

    // Let's try splitting the HTML by 'class="journal-section'
    const sections = html.split('class="journal-section');

    console.log(`Found ${sections.length - 1} potential journal sections.`);

    for (let i = 1; i < sections.length; i++) {
        const sectionHtml = sections[i];

        // Extract Journal Name
        const journalNameMatch = sectionHtml.match(/data-journal="([^"]+)"/);
        if (!journalNameMatch) continue;

        const journalName = journalNameMatch[1].trim();
        const journalCode = journalName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 8); // Simple code gen fallback

        console.log(`\nProcessing Journal: ${journalName} (${journalCode})`);

        // Ensure Journal Exists (or use a default one/create one)
        let journal = await prisma.journal.findFirst({
            where: { fullName: journalName }
        });

        if (!journal) {
            // Try finding by code similarity or create
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

        // Find Articles in this section
        // Pattern: issue-container ... article content ...
        // We can split by 'class="issue-container' inside this section
        const articleBlocks = sectionHtml.split('class="issue-container');

        for (let j = 1; j < articleBlocks.length; j++) {
            const block = articleBlocks[j];

            try {
                // Extract Title
                const titleMatch = block.match(/<h5[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
                const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Unknown Title';

                // Extract Authors
                const authorMatch = block.match(/<strong>Author Name:<\/strong>([\s\S]*?)<\/p>/);
                const authorText = authorMatch ? authorMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : 'Unknown Author';
                // Simple split for first author
                const primaryAuthorName = authorText.split(',')[0].trim();

                // Extract Date
                const dateMatch = block.match(/First published Online:[\s\S]*?<span>(.*?)<\/span>/);
                const publishedDate = dateMatch ? new Date(dateMatch[1].trim()) : new Date();

                // Extract DOI/Link
                const doiMatch = block.match(/doi\.org\/(.*?)\s*</);
                const doi = doiMatch ? doiMatch[1].trim() : null;

                // Extract PDF
                const pdfMatch = block.match(/href="(https:\/\/c5k\.com\/download-pdf[^"]*)"/);
                const pdfUrl = pdfMatch ? pdfMatch[1] : null;

                // Log
                // console.log(`   Found Article: "${title.substring(0, 50)}..." by ${primaryAuthorName}`);

                // Upsert User (Author)
                const slug = primaryAuthorName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
                const email = `${slug}@example.com`; // Pseudo email

                let author = await prisma.user.findFirst({
                    where: { name: primaryAuthorName }
                });

                if (!author) {
                    author = await prisma.user.create({
                        data: {
                            name: primaryAuthorName,
                            email: email,
                            password: 'scraped_placeholder',
                            role: 'author',
                            isActive: true
                        }
                    });
                }

                // Create Article
                // Check if title exists to avoid dupes from re-runs
                const existingArticle = await prisma.article.findFirst({
                    where: { title: title }
                });

                if (!existingArticle) {
                    await prisma.article.create({
                        data: {
                            title: title,
                            abstract: "Abstract not available in list view. View PDF for details.", // Scraper limitation
                            status: 'published',
                            publicationDate: publishedDate,
                            journalId: journal.id,
                            authorId: author.id,
                            pdfUrl: pdfUrl,
                            keywords: [] // No keywords available in list
                        }
                    });
                }

            } catch (e) {
                console.error('Error parsing article block:', e);
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
