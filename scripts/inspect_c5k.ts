
import { chromium } from 'playwright';
import fs from 'fs';

async function inspect() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log('Navigating to https://c5k.com/home-article...');
    await page.goto('https://c5k.com/home-article');

    // Wait a bit for content to load
    await page.waitForTimeout(5000);

    console.log('Fetching content...');
    const content = await page.content();

    fs.writeFileSync('c5k_dump.html', content);
    console.log('Saved to c5k_dump.html');

    // Also try to find article-like elements and log classes
    const articles = await page.evaluate(() => {
        // Basic heuristic: look for elements with text that looks like a title or common card classes
        const potentialCards = Array.from(document.querySelectorAll('div, article, li')).filter(el => {
            const text = el.innerText;
            return text && text.length > 50 && (el.className.includes('card') || el.className.includes('article') || el.className.includes('item'));
        });

        return potentialCards.slice(0, 5).map(el => ({
            tag: el.tagName,
            class: el.className,
            textPreview: el.innerText.substring(0, 50)
        }));
    });

    console.log('Potential article elements:', articles);

    await browser.close();
}

inspect().catch(console.error);
