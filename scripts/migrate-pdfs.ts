import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

// Polyfill node fetch if using older node (Node 18+ has native fetch)
// require('dotenv').config() is usually needed for standalone scripts if run with ts-node
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function migratePdfs() {
    console.log("Starting PDF migration to Vercel Blob...");

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error("Missing BLOB_READ_WRITE_TOKEN in .env");
        process.exit(1);
    }

    const articles = await prisma.article.findMany({
        where: {
            pdfUrl: {
                contains: 'c5k.com'
            }
        },
        select: {
            id: true,
            title: true,
            pdfUrl: true
        }
    });

    console.log(`Found ${articles.length} articles with legacy PDFs to migrate.`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(`[${i + 1}/${articles.length}] Migrating: ${article.pdfUrl}`);

        try {
            // 1. Download from old server
            const response = await fetch(article.pdfUrl!);
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();

            // Ensure a clean filename
            const urlParts = article.pdfUrl!.split('/');
            const originalFilename = urlParts[urlParts.length - 1];
            const filename = `articles/${article.id}/${originalFilename}`;

            // 2. Upload to Vercel Blob
            const blob = await put(filename, buffer, {
                access: 'public', // PDFs are public on the blob edge, but gated by our API
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN
            });

            // 3. Update database
            await prisma.article.update({
                where: { id: article.id },
                data: { pdfUrl: blob.url }
            });

            console.log(`   ✅ Success -> ${blob.url}`);
            successCount++;
        } catch (error: any) {
            console.error(`   ❌ Error migrating article ${article.id}:`, error.message);
            errorCount++;
        }

        // Add a small delay to avoid rate limiting
        await delay(1000);
    }

    console.log("Migration complete!");
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed migrations: ${errorCount}`);
}

migratePdfs()
    .catch(e => {
        console.error("Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
