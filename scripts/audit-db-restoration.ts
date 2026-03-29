const ps = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing legacy articles from CSV...");
    
    // Simple CSV parser for the top section (comma separated, quoted values)
    const content = fs.readFileSync('/tmp/legacy_articles.csv', 'utf8');
    const lines = content.split('\n');
    const header = lines[0].split(',').map((h: string) => h.replace(/\"/g, ''));
    
    const legacyArticles: any[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim() || line.startsWith('"id"')) continue; // Skip multiple headers
        
        // Very basic quote-aware split
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches) continue;
        
        const row: any = {};
        header.forEach((h: string, idx: number) => {
            row[h] = matches[idx] ? matches[idx].replace(/^"|"$/g, '') : null;
        });
        
        if (row.title) {
            legacyArticles.push(row);
        }
    }
    
    console.log(`Found ${legacyArticles.length} articles in legacy CSV.`);
    const legacyWithPdf = legacyArticles.filter(a => a.file_path && a.file_path !== 'NULL');
    console.log(`Articles with PDF in CSV: ${legacyWithPdf.length}`);
    
    const dbArticles = await prisma.article.findMany({
        select: { title: true, pdfUrl: true }
    });
    console.log(`Current Articles in DB: ${dbArticles.length}`);
    
    const missingArticles = legacyArticles.filter(la => 
        !dbArticles.some((da: any) => 
            da.title.toLowerCase().trim() === la.title.toLowerCase().trim() ||
            da.title.toLowerCase().includes(la.title.toLowerCase().substring(0, 30))
        )
    );
    console.log(`Articles Missing from DB: ${missingArticles.length}`);
    
    if (missingArticles.length > 0) {
        console.log("\nSample Missing Articles (first 10):");
        missingArticles.slice(0, 10).forEach(a => console.log(`- ${a.title} (PDF: ${a.file_path})`));
    }

    // Check PDF status
    const articlesWithNullPdf = await prisma.article.count({ where: { pdfUrl: null } });
    console.log(`\nDB Articles without PDF URL: ${articlesWithNullPdf}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
