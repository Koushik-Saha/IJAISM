const mammoth = require("mammoth");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const metadata = require("../data/extracted_metadata.json");

const BROWSER_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UPLOAD_BASE = path.join(process.cwd(), "public/uploads/articles");

if (!fs.existsSync(UPLOAD_BASE)) {
    fs.mkdirSync(UPLOAD_BASE, { recursive: true });
}

const template = (title, authors, affiliations, abstract, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Crimson Pro', serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .journal-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 40px; }
        .article-type { text-transform: uppercase; letter-spacing: 2px; font-weight: 600; font-size: 14px; color: #666; margin-bottom: 10px; font-family: 'Inter', sans-serif; }
        h1 { font-size: 32px; line-height: 1.2; margin-bottom: 20px; color: #000; }
        .authors { font-size: 18px; font-weight: 600; margin-bottom: 5px; font-family: 'Inter', sans-serif; }
        .affiliations { font-size: 14px; color: #555; margin-bottom: 20px; font-style: italic; }
        .abstract-container { background: #f9f9f9; padding: 20px; border-left: 4px solid #0056b3; margin: 30px 0; }
        .abstract-title { font-weight: bold; text-transform: uppercase; font-size: 12px; margin-bottom: 10px; font-family: 'Inter', sans-serif; display: block; }
        .content { text-align: justify; }
        img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    </style>
</head>
<body>
    <div class="journal-header">
        <div class="article-type">Research Article</div>
        <h1>${title}</h1>
        <div class="authors">${authors.join(", ")}</div>
        <div class="affiliations">${affiliations.join("<br>")}</div>
    </div>
    
    ${abstract ? `
    <div class="abstract-container">
        <span class="abstract-title">Abstract</span>
        <div class="abstract-text">${abstract}</div>
    </div>
    ` : ""}

    <div class="content">
        ${content}
    </div>
</body>
</html>
`;

async function buildArticle(browser, item) {
    console.log(`Processing: ${item.filename}`);
    
    // Create specific upload folder
    const safeName = item.filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const articleFolder = path.join(UPLOAD_BASE, safeName);
    if (!fs.existsSync(articleFolder)) fs.mkdirSync(articleFolder, { recursive: true });

    const htmlPath = path.join(articleFolder, "index.html");
    const pdfPath = path.join(articleFolder, "manuscript.pdf");

    // 1. Convert Word to HTML
    try {
        const result = await mammoth.convertToHtml({ path: item.file_path });
        const htmlContent = result.value;
        const fullHtml = template(item.title, item.authors, item.affiliations, item.abstract, htmlContent);
        fs.writeFileSync(htmlPath, fullHtml);

        // 2. Generate PDF using Puppeteer
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'load', timeout: 60000 });
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
            printBackground: true
        });
        await page.close();

        return {
            ...item,
            localHtml: htmlPath,
            localPdf: pdfPath,
            serveHtml: `/uploads/articles/${safeName}/index.html`,
            servePdf: `/uploads/articles/${safeName}/manuscript.pdf`
        };
    } catch (err) {
        console.error(`Failed to process ${item.filename}:`, err);
        return null;
    }
}

async function main() {
    const results = [];
    const browser = await puppeteer.launch({ executablePath: BROWSER_PATH });
    
    for (const item of metadata) {
        const processed = await buildArticle(browser, item);
        if (processed) results.push(processed);
    }
    
    await browser.close();
    fs.writeFileSync("data/processed_articles.json", JSON.stringify(results, null, 2));
    console.log(`Successfully processed ${results.length} articles.`);
}

main().catch(console.error);
