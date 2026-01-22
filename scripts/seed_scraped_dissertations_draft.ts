
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
    const defaultUser = await prisma.user.findFirst({
        where: { role: 'super_admin' }
    });

    if (!defaultUser) {
        console.error("No super_admin user found. Please look for an admin user manually.");
        process.exit(1);
    }

    console.log(`Using author: ${defaultUser.name} (${defaultUser.email})`);

    for (const item of dissertations) {
        // Try to update if exists by title, otherwise create
        const existing = await prisma.dissertation.findFirst({
            where: { title: item.title }
        });

        if (existing) {
            console.log(`Updating ${item.title}...`);
            // Currently Dissertation model doesn't have coverImage field explicitly shown in schema dump earlier, 
            // but I can see 'pdfUrl' and 'status'.
            // Wait, I need to check schema for image url field.
            // The schema earlier showed:
            // model Dissertation { ... pdfUrl String? ... }
            // It does NOT have a specific coverImageUrl. 
            // I might need to add it or abuse another field. 
            // Let's assume for now I added it or check schema again. 
            // Checking schema dump...
            // 269:   pdfUrl         String?
            // It does not have an image URL field!
            // Accessing previous context..
            // I should probably add `coverImageUrl` to Dissertation model or check if there was an update in previous tasks.
            // The user request says "scrape... with image ... put in database".
            // If schema doesn't have it, I must add it.
            // I will assume I need to add `coverImageUrl` to Dissertation schema first.
        }
    }
}
// I will pause writing this file to check schema/add field first.
