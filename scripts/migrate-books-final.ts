import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), 'migration-data');

async function main() {
    console.log('🚀 Starting Final Book Migration Cleanup (Deduplicated)...');

    // 1. Cleanup
    await prisma.bookChapter.deleteMany({});
    await prisma.book.deleteMany({});
    console.log('🗑️  Cleaned up existing book records.');

    // 2. Load Book List
    const bookListPath = path.join(dataDir, 'book_list.json');
    if (!fs.existsSync(bookListPath)) throw new Error('book_list.json not found!');
    const booksData = JSON.parse(fs.readFileSync(bookListPath, 'utf8'));

    // 3. Migrate Books (Deduplicated by ISBN)
    let bCount = 0;
    const isbnToNewIdMap: Record<string, string> = {};
    const legacyIdToIsbnMap: Record<number, string> = {};

    for (const b of booksData) {
        try {
            // Determine ISBN (first_isbn or online_isbn)
            let isbn = b.first_isbn || b.online_isbn || `N/A-${b.id}`;
            if (isbn === 'n/a') isbn = `N/A-${b.id}`;
            
            legacyIdToIsbnMap[b.id] = isbn;

            if (isbnToNewIdMap[isbn]) {
                console.log(`⏩ Skipping duplicate ISBN: ${isbn} (Legacy ID: ${b.id})`);
                continue;
            }

            // Extract Year from published_date
            const year = b.published_date ? new Date(b.published_date).getFullYear() : 2024;

            // Handle Cover Image (store filename only)
            const coverImage = b.book_img ? b.book_img.split('/').pop() : null;

            const newItem = await prisma.book.create({
                data: {
                    title: b.name || 'Untitled Book',
                    authors: b.authors ? b.authors.split(',').map((s: string) => s.trim()) : ['Legacy Author'],
                    year: isNaN(year) ? 2024 : year,
                    isbn: isbn,
                    pages: 250,
                    field: 'Information Technology',
                    description: b.description || 'No description available.',
                    fullDescription: b.about || b.des || b.description || 'No detailed description available.',
                    price: b.price ? `$${b.price}` : '$10.99',
                    publisher: 'C5K Publications',
                    language: 'English',
                    edition: '1st Edition',
                    format: b.type || 'Hardcover',
                    coverImageUrl: coverImage,
                }
            });
            isbnToNewIdMap[isbn] = newItem.id;
            bCount++;
        } catch (e: any) {
            console.error(`❌ Failed to migrate book ID ${b.id}: ${e.message}`);
        }
    }
    console.log(`✅ Created ${bCount} unique Books.`);

    // 4. Migrate Chapters
    const chaptersPath = path.join(dataDir, 'chapters.json');
    if (fs.existsSync(chaptersPath)) {
        const chaptersData = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
        let cCount = 0;
        for (const c of chaptersData) {
            const isbn = legacyIdToIsbnMap[c.book_id];
            const newBookId = isbn ? isbnToNewIdMap[isbn] : null;

            if (newBookId) {
                try {
                    await prisma.bookChapter.create({
                        data: {
                            bookId: newBookId,
                            title: c.title || 'Untitled Chapter',
                            summary: c.summary || 'Content provided in the full book.',
                            pageRange: c.page_range || null,
                            pdfUrl: c.pdf_url || null,
                        }
                    });
                    cCount++;
                } catch (e: any) {
                    console.error(`❌ Failed to migrate chapter ID ${c.id}: ${e.message}`);
                }
            } else {
                console.warn(`⚠️  Skipping chapter ID ${c.id} - Legacy Book ID ${c.book_id} not found.`);
            }
        }
        console.log(`✅ Created ${cCount} Book Chapters.`);
    }

    console.log('🎉 Book migration completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
