
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dissertations = [
    {
        title: "Evaluation of Credit Performance of Nationalized Commercial Banks in Bangladesh",
        author: "Unknown Author",
        image: "https://c5k.com/public/backend/thesis/Evaluation-of-Credit.jpg",
        date: "January 1970"
    },
    {
        title: "Level of Employee’s Job Satifaction of Insurance Company in Bangladesh",
        author: "Unknown Author",
        image: "https://c5k.com/public/backend/thesis/LevelofEmployee.jpg",
        date: "January 1970"
    },
    {
        title: "Multi-Storey Steel Office & Teaching Building",
        author: "Saleh Mohammad Abu...",
        image: "https://c5k.com/public/backend/thesis/10.png",
        date: "June 2024"
    },
    {
        title: "Financial position Analysis of Bank Asia Limited",
        author: "Sadia Sharmin...",
        image: "https://c5k.com/public/backend/thesis/9.png",
        date: "March 2024"
    },
    {
        title: "Rahingya Persecution in Myanmar and whether it amounts to Genocide",
        author: "Syeda Farjana Farabi...",
        image: "https://c5k.com/public/backend/thesis/8.png",
        date: "May 2024"
    },
    {
        title: "The Local Government of Bangladesh and its Challenges",
        author: "Syeda Farjana Farabi...",
        image: "https://c5k.com/public/backend/thesis/7.png",
        date: "November 2024"
    },
    {
        title: "Technological Innovations to Overcome Crisis in E-Commerce Industry in Bangladesh",
        author: "Md Wali Ullah, Jahanara Akter,......",
        image: "https://c5k.com/public/backend/thesis/6.jpg",
        date: "January 2024"
    },
    {
        title: "The Economic and Environmental Dynamics of Ship Breaking Industry in Bangladesh: A Critical Analysis",
        author: "Sadia Islam Nilima, Md Azad Ho......",
        image: "https://c5k.com/public/backend/thesis/5.jpg",
        date: "January 2024"
    },
    {
        title: "Explore Specific Applications of Quantum Computing in Cryptography",
        author: "Rukshanda Rahman, Barna Biswas......",
        image: "https://c5k.com/public/backend/thesis/4.jpg",
        date: "January 2024"
    },
    {
        title: "Benefits And Challenges of Edge Computing in IoT",
        author: "Unknown Author",
        image: "https://c5k.com/public/backend/thesis/3.jpg",
        date: "January 2024"
    }
];

async function main() {
    console.log('Starting migration of C5K dissertations...');

    // Find a default user to assign as author
    let defaultUser = await prisma.user.findFirst({
        where: { role: { in: ['super_admin', 'editor'] } }
    });

    if (!defaultUser) {
        defaultUser = await prisma.user.findFirst();
    }

    if (!defaultUser) {
        console.error("No users found.");
        process.exit(1);
    }

    console.log(`Using user ID for relation: ${defaultUser.id}`);

    // Update/Create scraped items
    for (const item of dissertations) {
        const existing = await prisma.dissertation.findFirst({
            where: { title: item.title }
        });

        const data = {
            title: item.title,
            abstract: `${item.title} - A comprehensive study.`,
            authorId: defaultUser.id,
            authorName: item.author,
            university: "C5K Research Institute",
            degreeType: "masters",
            coverImageUrl: item.image,
            status: "published",
            department: "General Research",
            submissionDate: new Date(),
        };

        if (existing) {
            process.stdout.write(`U`); // Updating
            await prisma.dissertation.update({
                where: { id: existing.id },
                data: {
                    coverImageUrl: item.image,
                    authorName: item.author
                }
            });
        } else {
            process.stdout.write(`C`); // Creating
            await prisma.dissertation.create({
                data: data
            });
        }
    }
    console.log("\nScraped items processed.");

    // --- Backfill missing images for ANY dissertation in the DB ---
    console.log("Checking for dissertations with missing images...");
    const missingImages = await prisma.dissertation.findMany({
        where: { OR: [{ coverImageUrl: null }, { coverImageUrl: "" }] }
    });

    if (missingImages.length > 0) {
        console.log(`Found ${missingImages.length} dissertations missing images. Backfilling...`);
        const validImages = dissertations.map(d => d.image).filter(Boolean);

        for (const item of missingImages) {
            const randomImage = validImages[Math.floor(Math.random() * validImages.length)];
            await prisma.dissertation.update({
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
