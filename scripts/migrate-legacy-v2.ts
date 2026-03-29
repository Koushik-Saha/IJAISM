import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper to parse SQL INSERT values (handles escaped strings and NULLs)
function parseSqlValues(line: string): any[] {
    const values: any[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === "'" && (i === 0 || line[i - 1] !== "\\")) {
            if (inQuotes && quoteChar === "'") {
                inQuotes = false;
            } else if (!inQuotes) {
                inQuotes = true;
                quoteChar = "'";
            } else {
                current += char;
            }
        } else if (char === "," && !inQuotes) {
            values.push(current.trim() === 'NULL' ? null : current.trim().replace(/^'|'$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim() === 'NULL' ? null : current.trim().replace(/^'|'$/g, ''));
    return values;
}

// Map of Legacy Journal ID -> Current Journal UUID
const journalMap: Record<string, string> = {};
// Map of Legacy Issue ID -> Current Issue UUID
const issueMap: Record<string, string> = {};

async function migrate() {
    console.log("Starting Legacy Migration V2 (State Machine Mode)...");

    // 1. Load current journals
    const currentJournals = await prisma.journal.findMany();
    
    // 2. Parse legacy journals
    const legacyJournalsData = fs.readFileSync('/tmp/legacy_journals_data.sql', 'utf8').split('\n');
    for (const line of legacyJournalsData) {
        if (!line.trim() || !line.trim().startsWith('(')) continue;
        const vals = parseSqlValues(line.trim().replace(/^\(|\),?$/g, ''));
        if (vals.length < 4) continue;
        const legacyId = vals[0];
        const legacyTitle = vals[3];
        const match = currentJournals.find(j => j.fullName.toLowerCase().trim() === legacyTitle?.toLowerCase().trim());
        if (match) journalMap[legacyId] = match.id;
    }

    // 3. Parse legacy volumes
    const legacyVolumesData = fs.readFileSync('/tmp/legacy_volumes_data.sql', 'utf8').split('\n');
    for (const line of legacyVolumesData) {
        if (!line.trim() || !line.trim().startsWith('(')) continue;
        const vals = parseSqlValues(line.trim().replace(/^\(|\),?$/g, ''));
        if (vals.length < 8) continue;
        const legacyVolId = vals[0];
        const volName = vals[1]; 
        const legacyJournId = vals[3];
        const issueName = vals[7]; 

        const currentJournalId = journalMap[legacyJournId];
        if (!currentJournalId) continue;

        let issue = await prisma.journalIssue.findFirst({
            where: { journalId: currentJournalId, issue: parseInt(issueName?.replace(/[^0-9]/g, '') || '1'), volume: parseInt(volName?.replace(/[^0-9]/g, '') || '1') }
        });

        if (!issue) {
            issue = await prisma.journalIssue.create({
                data: { journalId: currentJournalId, issue: parseInt(issueName?.replace(/[^0-9]/g, '') || '1'), volume: parseInt(volName?.replace(/[^0-9]/g, '') || '1'), year: 2024, title: `${volName} - ${issueName}`, publishedAt: new Date() }
            });
        }
        issueMap[legacyVolId] = issue.id;
    }

    // 4. State machine parsing for articles (handles massive lines)
    const sqlPath = "/Users/koushiksaha/Desktop/FixItUp/c5k Database/u260153612_c5k_v2.sql";
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    const articleBlocks = sqlContent.split(/INSERT INTO `articles` .*? VALUES/g).slice(1);
    console.log(`Found ${articleBlocks.length} Article Blocks.`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const block of articleBlocks) {
        const endOfBlock = block.indexOf(';');
        const content = endOfBlock !== -1 ? block.substring(0, endOfBlock) : block;
        
        let currentPos = 0;
        while (currentPos < content.length) {
            const start = content.indexOf('(', currentPos);
            if (start === -1) break;

            let end = -1;
            let inString = false;
            for (let i = start + 1; i < content.length; i++) {
                const char = content[i];
                if (char === "'" && (i === 0 || content[i - 1] !== "\\")) {
                    inString = !inString;
                }
                if (!inString && char === ")") {
                    const next = content[i + 1];
                    if (!next || next === "," || next === "\n" || next === "\r" || next === " " || next === ";") {
                        end = i;
                        break;
                    }
                }
            }

            if (end !== -1) {
                const row = content.substring(start, end + 1);
                await processRow(row);
                currentPos = end + 1;
            } else {
                break;
            }
        }
    }

    async function processRow(row: string) {
        if (!row.startsWith('(')) return;
        const vals = parseSqlValues(row.replace(/^\(|\)$/g, ''));
        if (vals.length < 17) return;

        const legacyId = vals[0];
        const journalLegacyId = vals[1];
        const paperId = vals[2];
        const title = vals[5];
        if (!title) return;

        const abstract = vals[6];
        const legacyVolId = vals[7];
        const filePath = vals[9];
        const doi = vals[11];
        const keywordsRaw = vals[12];
        const authorNameFinal = vals[16];
        const pubDateStr = vals[24];
        const publicationDate = pubDateStr && pubDateStr !== 'NULL' ? new Date(pubDateStr) : new Date();

        const currentJournalId = journalMap[journalLegacyId];
        const currentIssueId = issueMap[legacyVolId];

        if (!currentJournalId) {
            skippedCount++;
            return;
        }

        const existing = await prisma.article.findFirst({
            where: { OR: [{ title: title }, { doi: doi || 'non-existent-doi' }] },
            select: { id: true }
        });

        if (existing) {
            skippedCount++;
            return;
        }

        try {
            await prisma.article.create({
                data: {
                    title: title,
                    abstract: abstract || "No abstract provided.",
                    doi: doi || `https://doi.org/10.63471/${paperId || legacyId}`,
                    keywords: keywordsRaw ? keywordsRaw.split(',').map((k: string) => k.trim()) : [],
                    pdfUrl: filePath ? `/uploads/manuscript/${filePath}` : null,
                    status: 'published',
                    articleType: 'Research Article',
                    publicationDate: publicationDate,
                    journalId: currentJournalId,
                    issueId: currentIssueId || null,
                    authorId: '133fd7d5-aedd-4adb-98c2-d6585fb52d3e', // mother@c5k.co
                    coAuthors: { create: authorNameFinal ? [{ name: authorNameFinal.trim(), email: '', university: '' }] : [] }
                }
            });
            importedCount++;
            if (importedCount % 50 === 0) console.log(`Imported ${importedCount} articles...`);
        } catch (err: any) {
            console.error(`Error importing ${title}: ${err.message}`);
            skippedCount++;
        }
    }

    console.log(`\nMigration Complete:`);
    console.log(`- Imported: ${importedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Total processed: ${importedCount + skippedCount}`);
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
