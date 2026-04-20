import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting duplicate cleanup...");

    // 1. Get all articles
    const allArticles = await prisma.article.findMany({
        select: {
            id: true,
            title: true,
            createdAt: true,
            pdfUrl: true
        }
    });

    const today = new Date("2026-04-20T00:00:00Z");

    const oldArticles = allArticles.filter(a => a.createdAt < today);
    const newArticles = allArticles.filter(a => a.createdAt >= today);

    console.log(`Found ${oldArticles.length} old articles and ${newArticles.length} new articles.`);

    const duplicatesToRemove: string[] = [];
    const pathsToRemove: string[] = [];

    const oldTitles = new Set(oldArticles.map(a => a.title.toLowerCase().trim()));

    for (const article of newArticles) {
        if (oldTitles.has(article.title.toLowerCase().trim())) {
            console.log(`Duplicate found: "${article.title}" (ID: ${article.id})`);
            duplicatesToRemove.push(article.id);
            
            // Reconstruct folder name convention: 01_title_docx
            // Or just check if the pdfUrl gives a hint
            if (article.pdfUrl && article.pdfUrl.startsWith("/uploads/articles/")) {
                const folder = article.pdfUrl.split("/").slice(0, 4).join("/"); 
                pathsToRemove.push(folder);
            }
        }
    }

    if (duplicatesToRemove.length === 0) {
        console.log("No duplicates found to remove.");
        return;
    }

    console.log(`Removing ${duplicatesToRemove.length} duplicate articles...`);

    // Delete co-authors first
    await prisma.coAuthor.deleteMany({
        where: {
            articleId: { in: duplicatesToRemove }
        }
    });

    // Delete articles
    await prisma.article.deleteMany({
        where: {
            id: { in: duplicatesToRemove }
        }
    });

    // Cleanup folders
    for (const relPath of new Set(pathsToRemove)) {
        const fullPath = path.join(process.cwd(), "public", relPath);
        if (fs.existsSync(fullPath)) {
            console.log(`Deleting folder: ${fullPath}`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    }

    console.log("Cleanup complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
