import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const journal = await prisma.journal.findFirst({
            where: {
                OR: [
                    { code: 'JITMB' },
                    { fullName: "Journal of Information Technology Management and Business Horizons" }
                ]
            }
        });

        if (!journal) {
            console.error("JITMB journal not found");
            return;
        }

        console.log(`Seeding data for ${journal.fullName}...`);

        // 1. Create Issues
        // Issue 1
        const issue1 = await prisma.journalIssue.create({
            data: {
                journalId: journal.id,
                volume: 1,
                issue: 1,
                year: 2024,
                isCurrent: false,
                title: "Volume 1, Issue 1",
                coverUrl: "https://c5k.com/images/cover/cover-1.jpg"
            }
        });

        // Issue 2 (Current)
        const issue2 = await prisma.journalIssue.create({
            data: {
                journalId: journal.id,
                volume: 1,
                issue: 2,
                year: 2024,
                isCurrent: true,
                title: "Volume 1, Issue 2",
            }
        });

        // Special Issue
        const specialIssue = await prisma.journalIssue.create({
            data: {
                journalId: journal.id,
                volume: 1,
                issue: 3,
                year: 2024,
                isSpecial: true,
                title: "Special Issue on Digital Transformation",
                description: "Focusing on the impact of digital technologies on modern business practices."
            }
        });

        // 2. Create Articles

        // Articles for Issue 1
        await prisma.article.create({
            data: {
                journal: { connect: { id: journal.id } },
                journalIssue: { connect: { id: issue1.id } },
                title: "Strategic IT Alignment in Modern Enterprises",
                abstract: "This paper explores...",
                keywords: ["IT Alignment", "Strategy"],
                articleType: "Research Article",
                status: "published",
                author: {
                    create: {
                        name: "John Doe",
                        email: "john.doe.seed@example.com",
                        passwordHash: "password123", // Correct field
                        university: "Tech University", // Required field
                        role: "author"
                    }
                },
                publicationDate: new Date("2024-01-15"),
                volume: 1, issue: 1, pageStart: 1, pageEnd: 15,
                isBestPaper: true
            }
        });

        // Articles for Issue 2 (Current)
        await prisma.article.create({
            data: {
                journal: { connect: { id: journal.id } },
                journalIssue: { connect: { id: issue2.id } },
                title: "The Role of AI in Decision Support Systems",
                abstract: "An analysis of AI-driven DSS...",
                keywords: ["AI", "DSS"],
                articleType: "Research Article",
                status: "published",
                author: {
                    create: {
                        name: "Jane Smith",
                        email: "jane.smith.seed@example.com",
                        passwordHash: "password123",
                        university: "AI Institute",
                        role: "author"
                    }
                },
                publicationDate: new Date("2024-04-20"),
                volume: 1, issue: 2, pageStart: 16, pageEnd: 30
            }
        });

        // Articles for Special Issue
        await prisma.article.create({
            data: {
                journal: { connect: { id: journal.id } },
                journalIssue: { connect: { id: specialIssue.id } },
                title: "Healthcare 4.0: Digital Health Ecosystems",
                abstract: "A comprehensive review...",
                keywords: ["Healthcare", "Digital"],
                articleType: "Review Article",
                status: "published",
                author: {
                    create: {
                        name: "Emily White",
                        email: "emily.white.seed@example.com",
                        passwordHash: "password123",
                        university: "Medical School",
                        role: "author"
                    }
                },
                publicationDate: new Date("2024-06-01"),
                volume: 1, issue: 3
            }
        });

        // Articles in Press (Accepted but no issue)
        await prisma.article.create({
            data: {
                journal: { connect: { id: journal.id } },
                title: "Generative AI in Marketing: Opportunities and Risks",
                abstract: "A look at GenAI...",
                keywords: ["GenAI", "Marketing"],
                articleType: "Research Article",
                status: "accepted",
                author: {
                    create: {
                        name: "Michael Green",
                        email: "michael.green.seed@example.com",
                        passwordHash: "password123",
                        university: "Business School",
                        role: "author"
                    }
                },
                acceptanceDate: new Date("2024-07-01"),
            }
        });

        console.log("Seeding complete.");

    } catch (error) {
        if ((error as any).code === 'P2002') {
            console.log("Data already exists (Unique constraint), skipping...");
        } else {
            console.error("Error seeding issues:", error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
