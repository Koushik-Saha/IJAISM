
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const journals = await prisma.journal.count();
    const articles = await prisma.article.count();
    const announcements = await prisma.announcement.count();
    const heroSlides = await prisma.heroSlide.count();
    const users = await prisma.user.count();

    console.log('--- DB STATUS ---');
    console.log(`Journals: ${journals}`);
    console.log(`Articles: ${articles}`);
    console.log(`Announcements: ${announcements}`);
    console.log(`Hero Slides: ${heroSlides}`);
    console.log(`Users: ${users}`);
    console.log('-----------------');

    // Check Hero Slide Details if exists
    if (heroSlides > 0) {
        const slides = await prisma.heroSlide.findMany();
        console.log('Slides:', JSON.stringify(slides, null, 2));
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
