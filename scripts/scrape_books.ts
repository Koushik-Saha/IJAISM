import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const BASE_URL = 'https://c5k.com';

const DOWNLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'books');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function truncatePdf(url: string, bookId: string, chapterTitle: string): Promise<string | null> {
    try {
        console.log(`Downloading PDF from ${url}...`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const arrayBuffer = await res.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        const totalPages = pdfDoc.getPageCount();
        const pagesToKeep = Math.min(10, totalPages);
        
        const newPdfDoc = await PDFDocument.create();
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, Array.from({length: pagesToKeep}, (_, i) => i));
        
        copiedPages.forEach((page) => {
            newPdfDoc.addPage(page);
        });

        const pdfBytes = await newPdfDoc.save();
        
        // Generate a safe filename
        const safeTitle = chapterTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        const filename = `book_${bookId}_chapter_${safeTitle}_sample.pdf`;
        const filepath = path.join(DOWNLOAD_DIR, filename);
        
        fs.writeFileSync(filepath, pdfBytes);
        console.log(`Saved truncated PDF to ${filename}`);
        
        return `/uploads/books/${filename}`;
    } catch (e) {
        console.error(`Failed to truncate PDF from ${url}:`, e);
        return null; // Gracefully fail if PDF is broken on their side
    }
}

async function scrapeBookDetails(url: string) {
    try {
        console.log(`\nFetching ${url}...`);
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Core fields
        const title = $('h2').first().text().trim();
        if (!title || title.includes("Stay Up To Date")) {
            console.log("No valid title found, skipping...");
            return;
        }
        
        // Find text elements around
        const rawContent = $('div, p, span, h5, h4').text();
        
        // We will use rigorous target selectors instead of string matches for data integrity
        
        // Authors Node
        let authors: string[] = [];
        const authorParentText = $('span.font-semibold:contains("Authors:")').parent().text();
        if (authorParentText) {
            authors = authorParentText.replace('Authors:', '').split(',').map(s => s.trim()).filter(Boolean);
        }

        // ISBN Node
        let isbn = `UNKNOWN-${Math.floor(Math.random() * 1000000)}`;
        const isbnParentText = $('span.font-semibold:contains("ISBN:")').parent().text();
        if (isbnParentText) {
            const parsed = isbnParentText.replace('Print ISBN:', '').replace('ISBN:', '').trim();
            if (parsed) isbn = parsed;
        }

        // Year Node
        let year = new Date().getFullYear();
        const publishText = $('span.font-semibold:contains("Publish:")').parent().text();
        if (publishText) {
            const pubYearMatch = publishText.match(/([0-9]{4})/);
            if (pubYearMatch && pubYearMatch[1]) year = parseInt(pubYearMatch[1]);
        }
        if (!year) {
            const altPublishText = $('strong:contains("First Published:")').parent().text();
            if (altPublishText) {
                const pubYearMatch = altPublishText.match(/([0-9]{4})/);
                if (pubYearMatch && pubYearMatch[1]) year = parseInt(pubYearMatch[1]);
            }
        }

        // DOI Node
        let doi = "";
        const doiText = $('strong:contains("DOI:"), span.font-semibold:contains("DOI:")').parent().find('a').attr('href');
        if (doiText) {
            doi = doiText.trim();
        }

        // Dimensions
        let dimensions = "";
        const dimsText = $('span.font-semibold:contains("Dimensions:")').parent().text();
        if (dimsText) dimensions = dimsText.replace('Dimensions:', '').trim();
        
        // Weight
        let weight = "";
        const weightText = $('span.font-semibold:contains("Item Weight:")').parent().text();
        if (weightText) weight = weightText.replace('Item Weight:', '').trim();

        // Cover Image
        let coverImageUrl = "";
        const bookImgSrc = $('img[src*="/backend/books/"]').first().attr('src');
        if (bookImgSrc && !bookImgSrc.endsWith('file.png')) {
             coverImageUrl = bookImgSrc.startsWith('http') ? bookImgSrc : `${BASE_URL}${bookImgSrc}`;
        }
        
        // Tabbed DOM content extractors
        let fullDescription = $('#description').text().trim();
        if (!fullDescription) {
            fullDescription = $('#about').text().trim() || "A comprehensive academic deep dive into advanced analytical methodologies imported manually.";
        }
        const description = fullDescription.length > 200 ? fullDescription.substring(0, 197) + "..." : fullDescription;

        
        // Hardcoded generic values for missing
        const price = "9.99";
        const publisher = "C5K Research Publication";
        const hardCoverPrice = "49.99";
        const field = "Science & Engineering";

        console.log(`=> Found Book: ${title}`);
        console.log(`=> ISBN: ${isbn}`);
        
        // UPSERT LOGIC
        const book = await prisma.book.upsert({
            where: { isbn: isbn },
            update: {
                title,
                authors,
                year,
                doi,
                dimensions,
                weight,
                coverImageUrl,
                description,
                fullDescription
            },
            create: {
                title,
                authors,
                year,
                isbn,
                doi,
                dimensions,
                weight,
                coverImageUrl,
                pages: 350,
                field,
                description,
                fullDescription,
                price,
                publisher,
                language: "en",
                edition: "1",
                format: "PDF/Print",
                hardCoverPrice
            }
        });

        console.log(`[DB] Upserted Book Record ID: ${book.id}`);

        // TABLE OF CONTENTS EXTRACTOR
        // Looking for explicit PDF urls inside the document
        // c5k.com/public/admin/books/xxx.pdf
        const pdfLinks: {title: string, url: string}[] = [];
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('.pdf') && href.includes('/public/admin/')) {
                // Find nearest preceding text which might be the chapter title
                let chapterTitle = $(el).prevAll('strong, b, h4, span').first().text().trim();
                // Or looking at parent 
                if (!chapterTitle) {
                    chapterTitle = $(el).parent().text().replace('PDF', '').replace('Summary', '').trim();
                }
                if (!chapterTitle) chapterTitle = `Chapter ${pdfLinks.length + 1}`;
                
                // Form absolute URL
                const absoluteUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                
                pdfLinks.push({ title: chapterTitle, url: absoluteUrl });
            }
        });
        
        console.log(`=> Found ${pdfLinks.length} Free PDF Links for chapters.`);

        for (const link of pdfLinks) {
            // Check if we already have it
            const existingChapter = await prisma.bookChapter.findFirst({
                where: { bookId: book.id, title: link.title }
            });

            let localPdfPath = existingChapter?.pdfUrl;
            
            if (!localPdfPath) {
                 localPdfPath = await truncatePdf(link.url, book.id, link.title);
            }

            if (!existingChapter && localPdfPath) {
                await prisma.bookChapter.create({
                    data: {
                        bookId: book.id,
                        title: link.title,
                        pdfUrl: localPdfPath,
                        summary: "Sample Chapter dynamically extracted."
                    }
                });
                console.log(`[DB] Created/Updated Chapter: ${link.title}`);
            }
        }

    } catch (e) {
        console.error(`Error scraping book at ${url}:`, e);
    }
}

async function start() {
    console.log("Fetching Books Index...");
    try {
        const response = await fetch(`${BASE_URL}/books`);
        const html = await response.text();
        const $ = cheerio.load(html);

        const bookLinks = new Set<string>();
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.match(/\/books\/[0-9]+/)) {
                bookLinks.add(href);
            }
        });

        console.log(`Found ${bookLinks.size} unique book URLs to scrape.`);
        
        for (const link of bookLinks) {
            const fullUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
            await scrapeBookDetails(fullUrl);
        }

        console.log("✅ Scraping Migration Finished.");

    } catch (e) {
        console.error("Index scraping failed:", e);
    }
}

start();
