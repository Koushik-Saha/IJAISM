import { PrismaClient } from "@prisma/client";
import fs from "fs";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function normalize(str: string) {
    return str.replace(/[\u00a0\s]+/g, " ").trim().toLowerCase();
}

// Map folder names to known DB journal full names
const JOURNAL_FOLDER_MAP: Record<string, string> = {
    "journal of information technology": "journal of information technology management and business horizons",
    "advances in engineering and science informatics": "advances in engineering and science informatics",
    "advances in machine learning, iot and data security": "advances in machine learning, iot and data security",
    "demographic research and social development reviews": "demographic research and social development reviews",
    "international law policy review organizational management": "international law policy review organizational management",
    "journal of advances in medical sciences and artificial intelligence": "journal of advances in medical sciences and artificial intelligence",
    "journal of business venturing, ai and data analytics": "journal of business venturing, ai and data analytics",
    "journal of sustainable agricultural economics": "journal of sustainable agricultural economics",
    "open journal of business entrepreneurship and marketing": "open journal of business entrepreneurship and marketing",
    "periodic reviews on artificial intelligence in health informatics": "periodic reviews on artificial intelligence in health informatics",
    "progress on multidisciplinary scientific research and innovation": "progress on multidisciplinary scientific research and innovation",
    "transactions on banking, finance, and leadership informatics": "transactions on banking, finance, and leadership informatics",
};

function safe(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

async function main() {
    const data = JSON.parse(fs.readFileSync("data/processed_articles.json", "utf8"));
    const journals = await prisma.journal.findMany();

    const journalMap: Record<string, string> = {};
    journals.forEach(j => {
        journalMap[normalize(j.fullName)] = j.id;
    });

    const PASSWORD_HASH = await bcrypt.hash("C5K!Author2025", 10);

    let created = 0, updated = 0, skipped = 0;

    for (const item of data) {
        if (!item.doi) {
            console.log(`⚠ Skipping (no DOI): ${item.title}`);
            skipped++;
            continue;
        }

        // Find journal
        const folderKey = normalize(item.journal_folder);
        const mappedKey = JOURNAL_FOLDER_MAP[folderKey] || folderKey;
        const journalId = journalMap[mappedKey];

        if (!journalId) {
            console.error(`✗ No journal found for: "${item.journal_folder}"`);
            skipped++;
            continue;
        }

        // Find V1-I1 issue for this journal (year 2024, vol 1, iss 1)
        let issue = await prisma.journalIssue.findFirst({
            where: { journalId, volume: 1, issue: 1, year: 2024 }
        });
        if (!issue) {
            // Fall back to any V1-I1
            issue = await prisma.journalIssue.findFirst({
                where: { journalId, volume: 1, issue: 1 }
            });
        }
        if (!issue) {
            issue = await prisma.journalIssue.create({
                data: {
                    journalId,
                    volume: 1,
                    issue: 1,
                    year: 2024,
                    title: "Volume 1 Issue 1",
                    publishedAt: new Date("2024-12-01")
                }
            });
            console.log(`  ↳ Created new issue V1-I1 for: ${item.journal_folder}`);
        }

        // Find or create primary author user
        const primaryName = item.authors[0] || "Unknown Author";
        const primaryEmail = item.emails[0] || `${safe(primaryName)}@c5k-author.com`;

        let authorUser = await prisma.user.findUnique({ where: { email: primaryEmail } });
        if (!authorUser) {
            authorUser = await prisma.user.create({
                data: {
                    email: primaryEmail,
                    name: primaryName,
                    passwordHash: PASSWORD_HASH,
                    university: item.affiliations[0]?.replace(/^\d+/, "").trim() || "Unknown Institution",
                    role: "author",
                    isActive: true,
                    isEmailVerified: true,
                }
            });
            console.log(`  ↳ Created user: ${primaryName} <${primaryEmail}>`);
        }

        // Read fresh HTML with figures/tables from mammoth-converted file
        let htmlContent = "";
        try {
            htmlContent = fs.readFileSync(item.localHtml, "utf8");
        } catch {
            console.error(`  ✗ Cannot read HTML: ${item.localHtml}`);
            skipped++;
            continue;
        }

        // Upsert article by DOI
        const existing = await prisma.article.findUnique({ where: { doi: item.doi } });

        const articleData = {
            journalId,
            issueId: issue.id,
            authorId: authorUser.id,
            title: item.title,
            abstract: item.abstract || item.title,
            keywords: item.keywords || [],
            articleType: item.article_type || "Research Article",
            fullText: htmlContent,
            pdfUrl: item.servePdf,
            status: "published",
            publicationDate: issue.publishedAt || new Date("2024-12-01"),
            doi: item.doi,
            isOpenAccess: true,
        };

        if (existing) {
            await prisma.article.update({
                where: { doi: item.doi },
                data: articleData
            });
            updated++;
            console.log(`  ✓ Updated: ${item.title.substring(0, 65)}`);
        } else {
            await prisma.article.create({ data: articleData });
            created++;
            console.log(`  + Created: ${item.title.substring(0, 65)}`);
        }

        // Handle co-authors
        const article = await prisma.article.findUnique({ where: { doi: item.doi } });
        if (article && item.authors.length > 1) {
            await prisma.coAuthor.deleteMany({ where: { articleId: article.id } });

            for (let i = 0; i < item.authors.length; i++) {
                const coName = item.authors[i];
                if (!coName) continue;

                // Try to find a user for this co-author
                const coEmail = i === 0 ? primaryEmail : `${safe(coName)}@c5k-author.com`;
                let coUser = await prisma.user.findUnique({ where: { email: coEmail } });
                if (!coUser && i > 0) {
                    coUser = await prisma.user.create({
                        data: {
                            email: coEmail,
                            name: coName,
                            passwordHash: PASSWORD_HASH,
                            university: item.affiliations[i]?.replace(/^\d+/, "").trim() || item.affiliations[0]?.replace(/^\d+/, "").trim() || "Unknown Institution",
                            role: "author",
                            isActive: true,
                            isEmailVerified: true,
                        }
                    });
                    console.log(`    ↳ Created co-author user: ${coName} <${coEmail}>`);
                }

                await prisma.coAuthor.create({
                    data: {
                        articleId: article.id,
                        name: coName,
                        email: coEmail,
                        university: item.affiliations[i]?.replace(/^\d+/, "").trim() || "",
                        order: i,
                        isMain: i === 0,
                        userId: coUser?.id,
                    }
                });
            }
        }
    }

    // Clean up duplicate broken entries (DOI-filename format)
    console.log("\nCleaning up broken duplicate entries...");
    const broken = await prisma.article.findMany({
        where: { doi: { startsWith: "DOI-" } }
    });
    console.log(`  Found ${broken.length} broken entries to remove`);
    for (const b of broken) {
        await prisma.coAuthor.deleteMany({ where: { articleId: b.id } });
        await prisma.article.delete({ where: { id: b.id } });
        console.log(`  ✗ Deleted broken: "${b.title.substring(0, 60)}" (${b.doi})`);
    }

    // Clean up null-DOI duplicates
    const nullDoi = await prisma.article.findMany({
        where: { doi: null }
    });
    console.log(`  Found ${nullDoi.length} null-DOI entries to remove`);
    for (const n of nullDoi) {
        await prisma.coAuthor.deleteMany({ where: { articleId: n.id } });
        await prisma.article.delete({ where: { id: n.id } });
        console.log(`  ✗ Deleted null-DOI: "${n.title.substring(0, 60)}"`);
    }

    console.log(`\n✅ Done!`);
    console.log(`   Created: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
    console.log(`   Broken duplicates removed: ${broken.length + nullDoi.length}`);
}

main()
    .catch(err => { console.error(err); process.exit(1); })
    .finally(() => prisma.$disconnect());
