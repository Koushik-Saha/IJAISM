import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

// require('dotenv').config() is usually needed for standalone scripts if run with ts-node
import * as dotenv from 'dotenv';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'koushik-freedomshippingllc-reports';

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function migratePdfs() {
    console.log("Starting PDF migration to AWS S3...");

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error("Missing AWS S3 credentials in .env");
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

            // 2. Upload to AWS S3
            const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${filename}`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: filename,
                Body: Buffer.from(buffer),
                ContentType: 'application/pdf',
            });
            await s3Client.send(command);

            // 3. Update database
            await prisma.article.update({
                where: { id: article.id },
                data: { pdfUrl: s3Url }
            });

            console.log(`   ✅ Success -> ${s3Url}`);
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
