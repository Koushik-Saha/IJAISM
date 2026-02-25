import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const allowedTitles = [
        "Artificial Intelligence and Data Analytics for Business Leaders",
        "Predictive Models in Autism Spectrum Disorder: A Machine Learning Perspective",
        "AI in Medicine: Transforming Diagnosis, Treatment, and Care",
        "Neurodiverse Futures: How Technology is Transforming Autism Education and Mental Health Support in America",
        "The Rise of AI in Health Care: How Technology is Transforming Health Care",
        "The Future Revolution of Transforming Business Through Sustainable Innovation",
        "Data-Driven Business StrategiesLeveraging Information Technology for a Competitive Edge",
        "The Role of IT in Sustainable Business Practices",
        "Information Technology for Strategic Business Growth",
        "Digital Transformation in Modern Business: An Executive Guide"
    ].map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const books = await prisma.book.findMany({
        select: {
            id: true,
            title: true
        }
    });

    console.log(`Found ${books.length} books in local database. Scanning to prune extra books...`);

    let deletedCount = 0;
    for (const book of books) {
        const normalizedTitle = book.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!allowedTitles.includes(normalizedTitle)) {
            await prisma.book.delete({ where: { id: book.id } });
            console.log(`❌ Deleted: ${book.title}`);
            deletedCount++;
        } else {
            console.log(`✅ Kept: ${book.title}`);
        }
    }

    console.log(`\nFinished. Deleted ${deletedCount} unwanted books.`);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
