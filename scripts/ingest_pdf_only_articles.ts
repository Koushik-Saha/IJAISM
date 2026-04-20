import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

const pdfParse = require("pdf-parse") as (buf: Buffer, opts?: object) => Promise<{ text: string; numpages: number }>;
const prisma = new PrismaClient();
const PUBLIC_DIR = path.join(process.cwd(), "public");
const PASSWORD_HASH_PLAIN = "C5K!Author2025";

// ---------- articles to process ----------
const ARTICLES = [
    {
        doi: "https://doi.org/10.63471/tbfli25001",
        pdfFile: "public/uploads/manuscript/71_Integrating_AI_and_Econometrics_for_Equity_Forecasting_A_Case_Study_on_Apple_and_Microsoft_Stocks.pdf",
        title: "Integrating AI and Econometrics for Equity Forecasting: A Case Study on Apple and Microsoft Stocks",
        primaryAuthor: { name: "Md Abdullah Al Mahmud", email: "md_abdullah_al_mahmud@c5k-author.com" },
        coAuthors: [
            { name: "Md Anikur Rahman", email: "md_anikur_rahman@c5k-author.com", order: 1 },
            { name: "Abdullah Al Masum", email: "abdullah_al_masum@c5k-author.com", order: 2 },
            { name: "Md Kamruzzaman", email: "md_kamruzzaman@c5k-author.com", order: 3 },
        ],
        affiliations: [
            "Department of Business Administration, International American University, Los Angeles, CA 90010, USA",
            "Cybersecurity Expert, Washington University, USA",
            "Department of Information Technology, Westcliff University, Irvine, CA 92614, USA",
            "Department of Computer Science, University of Texas at Dallas, Texas, 75080, USA",
        ],
    },
    {
        doi: "https://doi.org/10.63471/amlid25001",
        pdfFile: "public/uploads/manuscript/72_Big_Data_Analytics_and_Its_Usage_on_Financial_Fraud_Detection_in_the_USA.pdf",
        title: "Big Data Analytics and Its Usage on Financial Fraud Detection in the USA",
        primaryAuthor: { name: "Md Hossain Jamil", email: "md_hossain_jamil@c5k-author.com" },
        coAuthors: [
            { name: "Shafiqul Islam Talukder", email: "shafiqul_islam_talukder@c5k-author.com", order: 1 },
            { name: "Arif Hosen", email: "arif_hosen@c5k-author.com", order: 2 },
            { name: "Yeasin Arafat", email: "yeasin_arafat@c5k-author.com", order: 3 },
            { name: "Hasan Mahmud Sozib", email: "hasan_mahmud_sozib@c5k-author.com", order: 4 },
        ],
        affiliations: [
            "Department of Information Technology, Westcliff University, Irvine, CA 92614, USA",
        ],
    },
    {
        doi: "https://doi.org/10.63471/jitmbh_25002",
        pdfFile: "public/uploads/manuscript/94_Machine_Learning_Applicatio.pdf",
        title: "Machine Learning Applications in U.S. Manufacturing: Predictive Maintenance and Supply Chain Optimization",
        primaryAuthor: { name: "Rakibul Hasan", email: "rakibul_hasan@c5k-author.com" },
        coAuthors: [
            { name: "Jakir Hossain Ridoy", email: "jakir_hossain_ridoy@c5k-author.com", order: 1 },
            { name: "Adib Hossain", email: "adib_hossain@c5k-author.com", order: 2 },
        ],
        affiliations: [
            "Department of Technology & Engineering, Westcliff University, Irvine, CA 92614, USA",
        ],
    },
];

// ---------- helpers ----------

function isAllCaps(s: string) {
    return s === s.toUpperCase() && /[A-Z]/.test(s);
}

function looksLikeHeading(line: string, prev: string, next: string): boolean {
    if (!line || line.length > 100) return false;
    if (!prev && !next && line.length < 80) return true;
    if (/^(abstract|introduction|background|literature\s+review|methodology|methods|results|discussion|conclusion|references|acknowledgem|appendix|funding|keywords?|conflict)/i.test(line)) return true;
    if (isAllCaps(line) && line.length < 80 && line.length > 3) return true;
    if (!prev && /^[A-Z]/.test(line) && line.length < 70 && !/[.!?]$/.test(line)) return true;
    return false;
}

function cleanLine(l: string): string {
    return l.replace(/\u00ad/g, "").replace(/[^\S\n]+/g, " ").trim();
}

function buildHtml(item: typeof ARTICLES[0], bodyHtml: string): string {
    const authorsStr = [item.primaryAuthor.name, ...item.coAuthors.map(c => c.name)].join(", ");
    const affStr = item.affiliations.join("<br>");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Crimson Pro', serif; line-height: 1.7; color: #1a1a1a; max-width: 860px; margin: 40px auto; padding: 0 24px; }
        .journal-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 24px; margin-bottom: 36px; }
        .article-type { text-transform: uppercase; letter-spacing: 2px; font-weight: 600; font-size: 13px; color: #666; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
        h1.article-title { font-size: 26px; line-height: 1.25; margin-bottom: 18px; color: #000; }
        .authors { font-size: 17px; font-weight: 600; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .affiliations { font-size: 13px; color: #555; margin-bottom: 10px; font-style: italic; line-height: 1.5; }
        .doi { font-size: 13px; color: #0056b3; margin-top: 8px; }
        .content h1 { font-size: 22px; margin-top: 36px; margin-bottom: 14px; }
        .content h2 { font-size: 18px; margin-top: 28px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .content p { text-align: justify; margin-bottom: 14px; }
        .content p.reference { font-size: 13px; line-height: 1.5; color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
        th { background: #f0f4f8; font-family: 'Inter', sans-serif; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; }
    </style>
</head>
<body>
    <div class="journal-header">
        <div class="article-type">Research Article</div>
        <h1 class="article-title">${item.title}</h1>
        <div class="authors">${authorsStr}</div>
        <div class="affiliations">${affStr}</div>
        <div class="doi">DOI: <a href="${item.doi}">${item.doi}</a></div>
    </div>
    <div class="content">
        ${bodyHtml}
    </div>
</body>
</html>`;
}

function pdfTextToHtml(raw: string): string {
    const lines = raw.split("\n").map(cleanLine);
    const chunks: { type: "h1" | "h2" | "p" | "ref"; text: string }[] = [];
    let i = 0;
    let inRefs = false;

    while (i < lines.length) {
        const line = lines[i];
        const prev = i > 0 ? lines[i - 1] : "";
        const next = i < lines.length - 1 ? lines[i + 1] : "";

        if (!line) { i++; continue; }

        if (/^references?\s*$/i.test(line)) {
            inRefs = true;
            chunks.push({ type: "h2", text: "References" });
            i++;
            continue;
        }

        if (inRefs) {
            let refBlock = line;
            i++;
            while (i < lines.length) {
                const l2 = lines[i];
                if (!l2) { i++; break; }
                refBlock += " " + l2;
                i++;
            }
            if (refBlock.trim().length > 10) chunks.push({ type: "ref", text: refBlock });
            continue;
        }

        if (looksLikeHeading(line, prev, next)) {
            chunks.push({ type: chunks.length === 0 ? "h1" : "h2", text: line });
            i++;
            continue;
        }

        let para = line;
        i++;
        while (i < lines.length) {
            const next2 = lines[i];
            if (!next2) break;
            if (looksLikeHeading(next2, lines[i - 1], lines[i + 1] || "")) break;
            para += " " + next2;
            i++;
        }
        if (para.trim().length > 20) chunks.push({ type: "p", text: para });
    }

    let html = "";
    for (const chunk of chunks) {
        const esc = chunk.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (chunk.type === "h1") html += `<h1>${esc}</h1>\n`;
        else if (chunk.type === "h2") html += `<h2>${esc}</h2>\n`;
        else if (chunk.type === "ref") html += `<p class="reference">${esc}</p>\n`;
        else html += `<p>${esc}</p>\n`;
    }
    return html;
}

// ---------- main ----------

async function main() {
    const passwordHash = await bcrypt.hash(PASSWORD_HASH_PLAIN, 10);

    for (const item of ARTICLES) {
        console.log(`\nProcessing: ${item.title.substring(0, 65)}`);

        const pdfPath = path.join(process.cwd(), item.pdfFile);
        if (!fs.existsSync(pdfPath)) {
            console.error(`  ✗ PDF not found: ${pdfPath}`);
            continue;
        }

        // 1. Parse PDF → HTML
        const buffer = fs.readFileSync(pdfPath);
        const parsed = await pdfParse(buffer, { max: 0 });
        console.log(`  ✓ Parsed PDF: ${parsed.numpages} pages, ${parsed.text.length} chars`);

        const bodyHtml = pdfTextToHtml(parsed.text);
        const fullHtml = buildHtml(item, bodyHtml);
        console.log(`  ✓ HTML generated: ${fullHtml.length} chars`);

        // 2. Find or create primary author user
        let authorUser = await prisma.user.findUnique({ where: { email: item.primaryAuthor.email } });
        if (!authorUser) {
            authorUser = await prisma.user.create({
                data: {
                    email: item.primaryAuthor.email,
                    name: item.primaryAuthor.name,
                    passwordHash,
                    university: item.affiliations[0] || "Unknown Institution",
                    role: "author",
                    isActive: true,
                    isEmailVerified: true,
                },
            });
            console.log(`  ↳ Created author user: ${item.primaryAuthor.name}`);
        } else {
            console.log(`  ↳ Found author user: ${item.primaryAuthor.name}`);
        }

        // 3. Update article
        const article = await prisma.article.findUnique({ where: { doi: item.doi } });
        if (!article) {
            console.error(`  ✗ Article not found in DB for DOI: ${item.doi}`);
            continue;
        }

        await prisma.article.update({
            where: { doi: item.doi },
            data: {
                authorId: authorUser.id,
                fullText: fullHtml,
                title: item.title,
                status: "published",
            },
        });
        console.log(`  ✓ Updated article fullText and author`);

        // 4. Rebuild co-authors
        await prisma.coAuthor.deleteMany({ where: { articleId: article.id } });

        // Primary author as co-author entry (order 0, isMain true)
        await prisma.coAuthor.create({
            data: {
                articleId: article.id,
                name: item.primaryAuthor.name,
                email: item.primaryAuthor.email,
                university: item.affiliations[0] || "",
                order: 0,
                isMain: true,
                userId: authorUser.id,
            },
        });

        for (const co of item.coAuthors) {
            let coUser = await prisma.user.findUnique({ where: { email: co.email } });
            if (!coUser) {
                coUser = await prisma.user.create({
                    data: {
                        email: co.email,
                        name: co.name,
                        passwordHash,
                        university: item.affiliations[co.order] || item.affiliations[0] || "Unknown Institution",
                        role: "author",
                        isActive: true,
                        isEmailVerified: true,
                    },
                });
                console.log(`    ↳ Created co-author: ${co.name}`);
            }

            await prisma.coAuthor.create({
                data: {
                    articleId: article.id,
                    name: co.name,
                    email: co.email,
                    university: item.affiliations[co.order] || item.affiliations[0] || "",
                    order: co.order,
                    isMain: false,
                    userId: coUser.id,
                },
            });
        }

        console.log(`  ✓ Co-authors set: ${[item.primaryAuthor.name, ...item.coAuthors.map(c => c.name)].join(", ")}`);
    }

    console.log("\n✅ All 3 PDF-only articles processed.");
}

main()
    .catch(err => { console.error(err); process.exit(1); })
    .finally(() => prisma.$disconnect());
