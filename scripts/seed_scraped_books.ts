
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const books = [
    {
        title: "Artificial Intelligence and Data Analytics for Business Leaders",
        authors: ["Md Samiun", "Barna Biswas", "Anup..."],
        image: "https://c5k.com/public/backend/books/1763017233_691582111cc98.jpg",
        year: 2025,
        month: "November"
    },
    {
        title: "Predictive Models in Autism Spectrum Disorder: A Machine Learning Perspective",
        authors: [], // "none..." listed
        image: "https://c5k.com/public/backend/books/1759158479_68daa0cf83e0c.jpg",
        year: 2025,
        month: "September"
    },
    {
        title: "AI in Medicine: Transforming Diagnosis, Treatment, and Care",
        authors: ["Md Maruful Islam", "Md Nayeem Ha..."],
        image: "https://c5k.com/public/backend/books/1756917600_68b86f6089992.jpg",
        year: 2025,
        month: "February"
    },
    {
        title: "Neurodiverse Futures: How Technology is Transforming Autism Education and Mental Health Support in America",
        authors: ["Afia Fairooz Tasnim", "Rubaiat Ra..."],
        image: "https://c5k.com/public/backend/books/1845856921_6fjfa999c9024.jpg",
        year: 2025,
        month: "August"
    },
    {
        title: "The Rise of AI in Health Care: How Technology is Transforming Health Care",
        authors: ["Hasan Mahmud Sozib", "Mesbah Uddi..."],
        image: "https://c5k.com/public/backend/books/1745856921_680fa999c9024.jpg",
        year: 2024,
        month: "April"
    },
    {
        title: "The Future Revolution of Transforming Business Through Sustainable Innovation",
        authors: ["Istiaque Mahmud", "Mesbah Uddin", "M..."],
        image: "https://c5k.com/public/backend/books/1745856939_680fa9ab699b3.jpg",
        year: 2024,
        month: "April"
    },
    {
        title: "Data-Driven Business Strategies Leveraging Information Technology for a Competitive Edge",
        authors: ["Mia Md Tofayel Gonee Manik", "Rab..."],
        image: "https://c5k.com/public/backend/books/6.png",
        year: 2024,
        month: "November"
    },
    {
        title: "The Role of IT in Sustainable Business Practices",
        authors: ["Sadia Sharmin", "Al Modabbir Zama..."],
        image: "https://c5k.com/public/backend/books/5.png",
        year: 2024,
        month: "November"
    },
    {
        title: "Information Technology for Strategic Business Growth",
        authors: ["Hasan Mahmud Sozib", "Mesbah Uddi..."],
        image: "https://c5k.com/public/backend/books/4.png",
        year: 2024,
        month: "November"
    },
    {
        title: "Digital Transformation in Modern Business: An Executive Guide",
        authors: ["RAKIBUL HASAN..."],
        image: "https://c5k.com/public/backend/books/3.png",
        year: 2024,
        month: "November"
    }
];

async function main() {
    console.log('Starting migration of C5K Books...');

    // Upsert items
    for (const item of books) {
        // Generate a pseudo-ISBN based on title hash or random to avoid conflicts if re-seeding
        // In real world we'd scrape ISBN. Here we make one up.
        const pseudoIsbn = "978-" + Math.abs(item.title.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString().substring(0, 10);

        const existing = await prisma.book.findFirst({
            where: { title: item.title }
        });

        const data = {
            title: item.title,
            authors: item.authors,
            year: item.year,
            isbn: pseudoIsbn,
            pages: 350, // Default
            field: "Technology", // Default
            description: `${item.title} - Published ${item.month} ${item.year}.`,
            fullDescription: "A comprehensive guide illustrating the impacts and methodologies discussed in the title.",
            price: "$99.99",
            publisher: "C5K Publishing",
            language: "English",
            edition: "1st",
            format: "Hardcover",
            coverImageUrl: item.image,
            relatedTopics: ["AI", "Business", "Technology"],
        };

        if (existing) {
            process.stdout.write(`U`); // Updating
            await prisma.book.update({
                where: { id: existing.id },
                data: {
                    coverImageUrl: item.image,
                    authors: item.authors,
                    year: item.year
                }
            });
        } else {
            // Check if ISBN exists to avoid unique constraint error
            const isbnCheck = await prisma.book.findUnique({ where: { isbn: pseudoIsbn } });
            if (isbnCheck) {
                data.isbn = pseudoIsbn + "-" + Math.floor(Math.random() * 1000); // Retry with suffix
            }

            process.stdout.write(`C`); // Creating
            await prisma.book.create({
                data: data
            });
        }
    }
    console.log("\nScraped books processed.");

    // --- Backfill missing images for ANY book in the DB ---
    console.log("Checking for books with missing images...");
    const missingImages = await prisma.book.findMany({
        where: { OR: [{ coverImageUrl: null }, { coverImageUrl: "" }] }
    });

    if (missingImages.length > 0) {
        console.log(`Found ${missingImages.length} books missing images. Backfilling...`);
        const validImages = books.map(d => d.image).filter(Boolean);

        for (const item of missingImages) {
            const randomImage = validImages[Math.floor(Math.random() * validImages.length)];
            await prisma.book.update({
                where: { id: item.id },
                data: { coverImageUrl: randomImage }
            });
            process.stdout.write("."); // Progress indicator
        }
        console.log("\nBackfill complete.");
    } else {
        console.log("No missing images found.");
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
