
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_IMAGES: Record<string, string> = {
    "Journal": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=800",
    "Conference": "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=800",
    "Scholarship": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
    "Guidelines": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800",
    "Editorial": "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800",
    "Platform": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
    "Partnership": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800"
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800";

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

        // Strategy 2: If no category match, use a random nature/tech image from unsplash via direct link (less reliable for static ID, but good for variety)
        // Or use picsum for pure randomness:
        // imageUrl = `https://picsum.photos/seed/${ann.id}/800/600`;

        // Let's stick to high quality Unsplash images mapped to topics for generic categories, 
        // and fallback to picsum if we want purely unique ones. 
        // The user said "dynamic", so maybe unique is better?
        // Let's use Picsum with seed for uniqueness if not in our curated list.

        if (!imageUrl) {
            imageUrl = `https://picsum.photos/seed/${ann.id}/800/600`;
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
