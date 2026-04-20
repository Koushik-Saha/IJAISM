import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function normalize(str: string) {
    let normalized = str.replace(/[\u00a0\s]+/g, " ").trim().toLowerCase();
    // Manual mapping for disk folder names that differ from DB names
    const manualMap: Record<string, string> = {
        "journal of information technology": "journal of information technology management and business horizons"
    };
    return manualMap[normalized] || normalized;
}

async function main() {
    const data = JSON.parse(fs.readFileSync("data/processed_articles.json", "utf8"));
    const journals = await prisma.journal.findMany();
    
    const journalMap: Record<string, string> = {};
    journals.forEach(j => {
        journalMap[normalize(j.fullName)] = j.id;
    });

    const PASSWORD_HASH = await bcrypt.hash("C5K!Author2025", 10);

    for (const item of data) {
        console.log(`Ingesting into DB: ${item.title}`);
        
        // 1. Find Journal
        const journalId = journalMap[normalize(item.journal_folder)];
        if (!journalId) {
            console.error(`Could not find journal for folder: ${item.journal_folder}`);
            continue;
        }

        // 2. Find/Create Issue (Defaulting to V1-I1 for this batch)
        let issue = await prisma.journalIssue.findFirst({
            where: { journalId, volume: 1, issue: 1 }
        });
        
        if (!issue) {
            issue = await prisma.journalIssue.create({
                data: {
                    journalId,
                    volume: 1,
                    issue: 1,
                    year: 2024,
                    title: "Volume 1 Issue 1",
                    publishedAt: new Date("2024-01-01")
                }
            });
        }

        // 3. Find/Create Primary Author
        const primaryAuthorName = item.authors[0] || "Unknown Author";
        const primaryEmail = item.emails[0] || `author_${safe(primaryAuthorName)}@c5k-platform.com`;
        
        let author = await prisma.user.findUnique({ where: { email: primaryEmail } });
        if (!author) {
            author = await prisma.user.create({
                data: {
                    email: primaryEmail,
                    name: primaryAuthorName,
                    passwordHash: PASSWORD_HASH,
                    university: item.affiliations[0] || "Unknown",
                    role: "author",
                    isActive: true,
                    isEmailVerified: true
                }
            });
        }

        // 4. Create Article
        const htmlContent = fs.readFileSync(item.localHtml, "utf8");
        
        await prisma.article.upsert({
            where: { doi: item.doi || `DOI-${item.filename}` },
            update: {
                fullText: htmlContent,
                pdfUrl: item.servePdf,
                status: "published",
                abstract: item.abstract || item.title,
                keywords: item.keywords
            },
            create: {
                journalId,
                issueId: issue.id,
                authorId: author.id,
                title: item.title,
                abstract: item.abstract || item.title,
                keywords: item.keywords,
                articleType: item.article_type,
                fullText: htmlContent,
                pdfUrl: item.servePdf,
                status: "published",
                publicationDate: new Date(),
                doi: item.doi || `DOI-${item.filename}`
            }
        });

        // 5. Handle Co-authors
        if (item.authors.length > 1) {
            // Find article again to get the ID for co-authors
            const createdArticle = await prisma.article.findUnique({ 
                where: { doi: item.doi || `DOI-${item.filename}` } 
            });
            if (createdArticle) {
                // Clear existing co-authors to avoid duplicates on rerun
                await prisma.coAuthor.deleteMany({
                    where: { articleId: createdArticle.id }
                });

                for (let i = 1; i < item.authors.length; i++) {
                    const coAuthorName = item.authors[i];
                    if (!coAuthorName) continue;
                    
                    await prisma.coAuthor.create({
                        data: {
                            articleId: createdArticle.id,
                            name: coAuthorName,
                            order: i,
                            university: item.affiliations[i] || item.affiliations[0] || ""
                        }
                    });
                }
            }
        }
    }
}

function safe(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
