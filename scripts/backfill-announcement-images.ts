
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_IMAGES: Record<string, string> = {
    "Journal": "/images/announcements/editorial_board.png",
    "Conference": "/images/announcements/icaiml_conference.png",
    "Scholarship": "/images/announcements/scholarship.png",
    "Guidelines": "/images/announcements/guidelines.png",
    "Editorial": "/images/announcements/editorial_board.png",
    "Platform": "/images/announcements/guidelines.png",
    "Partnership": "/images/announcements/guidelines.png"
};

const DEFAULT_IMAGE = "/images/announcements/guidelines.png";

async function main() {
    console.log('Checking announcements for missing images...');

    const announcements = await prisma.announcement.findMany({
        where: {
            thumbnailUrl: null
        }
    });

    if (announcements.length === 0) {
        console.log('No announcements found with missing images.');
        return;
    }

    console.log(`Found ${announcements.length} announcements without images. Updating...`);

    for (const ann of announcements) {
        // Strategy 1: Use specific image based on category
        let imageUrl = ann.category ? CATEGORY_IMAGES[ann.category] : DEFAULT_IMAGE;

        if (!imageUrl) {
            imageUrl = DEFAULT_IMAGE;
        }

        await prisma.announcement.update({
            where: { id: ann.id },
            data: { thumbnailUrl: imageUrl }
        });

        console.log(`Updated announcement "${ann.title}" with image: ${imageUrl}`);
    }

    console.log('Backfill complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
