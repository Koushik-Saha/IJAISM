import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(text: string): string[][] {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [(l = '')]; i = 0;
        } else row[i] += l;
        p = l;
    }
    const cleanRet = ret.map(row => row.map(cell => cell.replace(/^"|"$/g, '')));
    
    // Remove the last empty row if it exists
    if (cleanRet.length > 0 && cleanRet[cleanRet.length - 1].length === 1 && cleanRet[cleanRet.length - 1][0] === '') {
        cleanRet.pop();
    }
    return cleanRet;
}

async function run() {
    console.log("Starting Article and PDF Migration...");
    
    // Check files and directories
    const csvPath = '/Users/koushiksaha/Desktop/FixItUp/c5k Database/articles.csv';
    const pdfSourceDir1 = '/Users/koushiksaha/Desktop/FixItUp/Scapt/pythonProject/pdfs';
    const pdfSourceDir2 = '/Users/koushiksaha/Desktop/FixItUp/Scapt/pythonProject';
    const pdfTargetDir = path.join(process.cwd(), 'public', 'uploads', 'manuscript');
    
    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found:", csvPath);
        process.exit(1);
    }
    
    if (!fs.existsSync(pdfTargetDir)) {
        fs.mkdirSync(pdfTargetDir, { recursive: true });
    }

    const admin = await prisma.user.findFirst({ where: { role: 'super_admin' } }) || await prisma.user.findFirst();
    if (!admin) {
        console.error("No valid user found to assign as article author.");
        process.exit(1);
    }

    const journals = await prisma.journal.findMany();
    const journalMap: Record<string, string> = {};
    for (const j of journals) {
        journalMap[j.code.toLowerCase().trim()] = j.id;
    }
    console.log("Journal MAP Keys:", Object.keys(journalMap));

    const csvData = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csvData);
    
    if (rows.length < 2) {
        console.error("CSV has no data rows.");
        process.exit(1);
    }
    
    const headers = rows[0].map(h => h.trim());
    console.log(`Found headers: ${headers.join(', ')}`);
    
    let inserted = 0;
    let skipped = 0;
    let pdfsCopied = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length) continue;
        
        const data: Record<string, string> = {};
        headers.forEach((h, idx) => data[h] = row[idx]);

        const title = data['title'];
        const paper_id = data['paper_id'];
        const description = data['description'];
        const file_path = data['file_path'];
        const doi = data['doi'];
        const keyword = data['keyword'];
        const author_name = data['author_name'];
        const online_first = data['online_first'];
        
        if (!title || !paper_id) {
            skipped++;
            continue;
        }

        // Determine journal from paper_id (e.g., praihi24001 -> praihi)
        const codeMatch = paper_id.match(/^[A-Za-z\-]+/);
        let journalId = null;
        if (codeMatch && codeMatch[0]) {
            let code = codeMatch[0].toLowerCase().trim();
            if (code === 'amlids') code = 'amlid';
            if (code === 'jitmbh') code = 'jitmb';
            journalId = journalMap[code];
        }

        if (!journalId) {
            // Find placeholder or fallback
            // Try to deduce from category_id or just pick first
            console.log(`Warning: Journal not mapped for code ${codeMatch ? codeMatch[0] : paper_id}. Skipping.`);
            skipped++;
            continue;
        }

        // Handle PDF copy
        let finalPdfUrl: string | null = null;
        if (file_path && file_path !== 'NULL') {
            let fileName = file_path.replace(/\\r|\\n/g, '').trim();
            const sourcePath1 = path.join(pdfSourceDir1, fileName);
            const sourcePath2 = path.join(pdfSourceDir2, fileName);
            
            let foundPath = null;
            if (fs.existsSync(sourcePath1)) {
                foundPath = sourcePath1;
            } else if (fs.existsSync(sourcePath2)) {
                foundPath = sourcePath2;
            } else {
                // Fuzzy match prefix
                const prefixId = paper_id.replace(/[^0-9]/g, '').slice(-2) || data['id'];
                const files = fs.readdirSync(pdfSourceDir1);
                const match = files.find(f => f.startsWith(`${data['id']}_`) || f.startsWith(`${prefixId}_`));
                if (match) {
                    foundPath = path.join(pdfSourceDir1, match);
                    fileName = match;
                }
            }
            
            if (foundPath) {
                const destPath = path.join(pdfTargetDir, fileName);
                fs.copyFileSync(foundPath, destPath);
                finalPdfUrl = `/uploads/manuscript/${fileName}`;
                pdfsCopied++;
            } else {
                console.log(`Warning: PDF missing for ${title} (${fileName})`);
            }
        }

        const keywords = keyword && keyword !== 'NULL' ? keyword.split(',').map(k => k.trim()).filter(Boolean) : [];
        const publicationDate = online_first && online_first !== 'NULL' ? new Date(online_first) : new Date();
        const authorsList = author_name && author_name !== 'NULL' ? author_name.split(',').map(a => a.trim()).filter(Boolean) : [];

        // Check if already exists to avoid duplicates
        const existing = await prisma.article.findFirst({
            where: { 
                OR: [
                    { title: title.trim() },
                    { doi: doi && doi !== 'NULL' ? doi : 'non-existent' }
                ]
            }
        });

        if (existing) {
            skipped++;
            continue;
        }

        // Insert logic
        try {
            await prisma.article.create({
                data: {
                    title: title.trim(),
                    abstract: description && description !== 'NULL' ? description.trim() : 'No abstract provided.',
                    articleType: 'Research Article',
                    status: 'published',
                    doi: doi && doi !== 'NULL' ? doi.trim() : null,
                    pdfUrl: finalPdfUrl,
                    publicationDate: publicationDate,
                    keywords: keywords,
                    authorId: admin.id,
                    journalId: journalId,
                    coAuthors: {
                        create: authorsList.map(name => ({
                            name: name,
                            email: '',
                            university: ''
                        }))
                    }
                }
            });
            inserted++;
        } catch(err: any) {
            console.error(`Failed to insert article ${title}:`, err.message);
            skipped++;
        }
    }
    
    console.log(`\n================================`);
    console.log(`MIGRATION COMPLETE`);
    console.log(`================================`);
    console.log(`Total Articles Successfully Inserted: ${inserted}`);
    console.log(`Total Articles Skipped (Duplicates/Errors): ${skipped}`);
    console.log(`Total PDF Files Found & Copied: ${pdfsCopied}`);
    console.log(`================================\n`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
