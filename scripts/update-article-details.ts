import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const metadataPath = path.join(process.cwd(), 'migration-data', 'extracted_metadata.json');

async function updateDetails() {
    if (!fs.existsSync(metadataPath)) {
        console.error('Metadata file not found');
        return;
    }

    const metadataList = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`Loaded ${metadataList.length} metadata entries`);

    let updatedCount = 0;
    let fallbackCount = 0;

    for (const meta of metadataList) {
        try {
            // Find article by matching pdfUrl with filename
            const article = await prisma.article.findFirst({
                where: {
                    pdfUrl: {
                        contains: meta.filename
                    }
                }
            });

            if (article) {
                await prisma.article.update({
                    where: { id: article.id },
                    data: {
                        abstract: meta.abstract && meta.abstract.length > 50 ? meta.abstract : article.abstract,
                        keywords: meta.keywords && meta.keywords.length > 0 ? meta.keywords : article.keywords,
                        fullText: meta.full_text_preview || null
                    }
                });
                updatedCount++;
            } else {
                fallbackCount++;
            }
        } catch (e: any) {
            console.error(`Error updating for ${meta.filename}: ${e.message}`);
        }
    }

    console.log(`✅ Articles updated: ${updatedCount}`);
    console.log(`⚠️ Metadata unmatched: ${fallbackCount}`);
}

updateDetails()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
