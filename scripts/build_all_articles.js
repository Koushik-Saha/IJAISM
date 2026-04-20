const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const puppeteer = require("puppeteer-core");

const metadata = require("../data/extracted_metadata.json");
const UPLOAD_BASE = path.join(process.cwd(), "public/uploads/articles");
const BROWSER_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function safeFolderName(filename) {
    return filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

const htmlTemplate = (title, articleType, authors, affiliations, abstract, keywords, doi, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Crimson Pro', serif; line-height: 1.7; color: #1a1a1a; max-width: 860px; margin: 40px auto; padding: 0 24px; }
        .journal-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 24px; margin-bottom: 36px; }
        .article-type { text-transform: uppercase; letter-spacing: 2px; font-weight: 600; font-size: 13px; color: #666; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
        h1.article-title { font-size: 28px; line-height: 1.25; margin-bottom: 18px; color: #000; }
        .authors { font-size: 17px; font-weight: 600; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .affiliations { font-size: 13px; color: #555; margin-bottom: 10px; font-style: italic; line-height: 1.5; }
        .doi { font-size: 13px; color: #0056b3; margin-top: 8px; }
        .abstract-container { background: #f7f9fc; padding: 20px 24px; border-left: 4px solid #0056b3; margin: 28px 0; border-radius: 0 4px 4px 0; }
        .abstract-label { font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; margin-bottom: 8px; font-family: 'Inter', sans-serif; color: #333; display: block; }
        .keywords-container { margin: 16px 0 28px; font-size: 14px; }
        .keywords-label { font-weight: 700; font-family: 'Inter', sans-serif; }
        .content { text-align: justify; }
        .content h2 { font-size: 20px; margin-top: 32px; margin-bottom: 12px; }
        .content h3 { font-size: 17px; margin-top: 24px; margin-bottom: 8px; }
        .content p { margin-bottom: 14px; }
        img { max-width: 100%; height: auto; display: block; margin: 24px auto; border: 1px solid #eee; }
        figure { margin: 24px 0; text-align: center; }
        figcaption { font-size: 13px; color: #555; font-style: italic; margin-top: 8px; }
        table { border-collapse: collapse; width: 100%; margin: 24px 0; font-size: 14px; }
        th { background: #f0f4f8; font-family: 'Inter', sans-serif; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 9px 12px; text-align: left; vertical-align: top; }
        tr:nth-child(even) td { background: #fafafa; }
        blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 20px; color: #555; font-style: italic; }
        .references { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
        .references p { font-size: 13px; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="journal-header">
        <div class="article-type">${articleType || "Research Article"}</div>
        <h1 class="article-title">${title}</h1>
        <div class="authors">${authors.join(", ")}</div>
        <div class="affiliations">${affiliations.filter(a => !a.match(/^\d+\.\s/)).join("<br>")}</div>
        ${doi ? `<div class="doi">DOI: <a href="${doi}">${doi}</a></div>` : ""}
    </div>

    ${abstract ? `
    <div class="abstract-container">
        <span class="abstract-label">Abstract</span>
        <div>${abstract}</div>
    </div>` : ""}

    ${keywords && keywords.length ? `
    <div class="keywords-container">
        <span class="keywords-label">Keywords: </span>${keywords.join("; ")}
    </div>` : ""}

    <div class="content">
        ${content}
    </div>
</body>
</html>`;

async function buildArticle(browser, item) {
    const safeName = safeFolderName(item.filename);
    const articleFolder = path.join(UPLOAD_BASE, safeName);

    if (!fs.existsSync(articleFolder)) {
        fs.mkdirSync(articleFolder, { recursive: true });
    }

    const htmlPath = path.join(articleFolder, "index.html");
    const pdfPath = path.join(articleFolder, "manuscript.pdf");

    try {
        // Always regenerate HTML from docx for full fidelity (figures, tables, etc.)
        const result = await mammoth.convertToHtml({ path: item.file_path }, {
            convertImage: mammoth.images.imgElement(image => {
                return image.read("base64").then(imageBuffer => ({
                    src: `data:${image.contentType};base64,${imageBuffer}`
                }));
            })
        });

        const bodyContent = result.value;
        const fullHtml = htmlTemplate(
            item.title,
            item.article_type,
            item.authors,
            item.affiliations,
            item.abstract,
            item.keywords,
            item.doi,
            bodyContent
        );
        fs.writeFileSync(htmlPath, fullHtml);
        console.log(`  ✓ HTML written: ${safeName}`);

        // Generate PDF
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: "load", timeout: 90000 });
        await page.pdf({
            path: pdfPath,
            format: "A4",
            printBackground: true,
            margin: { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" }
        });
        await page.close();
        console.log(`  ✓ PDF written: ${safeName}`);

    } catch (err) {
        console.error(`  ✗ Error for ${item.filename}: ${err.message}`);
    }

    const serveBase = `/uploads/articles/${safeName}`;
    return {
        ...item,
        localHtml: htmlPath,
        localPdf: pdfPath,
        serveHtml: `${serveBase}/index.html`,
        servePdf: `${serveBase}/manuscript.pdf`
    };
}

async function main() {
    console.log(`Building ${metadata.length} articles...`);

    const browser = await puppeteer.launch({
        executablePath: BROWSER_PATH,
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const processed = [];
    for (const item of metadata) {
        console.log(`\nProcessing: ${item.title.substring(0, 70)}`);
        const result = await buildArticle(browser, item);
        processed.push(result);
    }

    await browser.close();

    fs.writeFileSync("data/processed_articles.json", JSON.stringify(processed, null, 2));
    console.log(`\nDone! processed_articles.json written with ${processed.length} articles.`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
