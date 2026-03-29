import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// A simple but robust CSV parser that handles multiline fields and escaped quotes
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentRow.length > 0 || currentField !== '') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
      // Handle \r\n
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentField += char;
    }
  }

  if (currentRow.length > 0 || currentField !== '') {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

const journalMap: Record<string, string> = {};
const issueMap: Record<string, string> = {};

async function main() {
  console.log('Starting CSV-based Migration...');

  // 1. Load current journals to build name -> ID map
  const journals = await prisma.journal.findMany();
  const journalNameToId: Record<string, string> = {};
  journals.forEach(j => {
    journalNameToId[j.fullName.toLowerCase().trim()] = j.id;
  });

  // 2. Map Legacy Journals
  console.log('Mapping Legacy Journals...');
  const journalsCsv = fs.readFileSync('/tmp/journals.csv', 'utf8');
  const journalRows = parseCSV(journalsCsv);
  const journalHeaders = journalRows[0];
  
  // Header: "id","journal_image","backgroundColor","title","slug",...
  const legacyIdIdx = journalHeaders.indexOf('id');
  const titleIdx = journalHeaders.indexOf('title');

  for (let i = 1; i < journalRows.length; i++) {
    const row = journalRows[i];
    if (row.length < 4) continue;
    const legacyId = row[legacyIdIdx];
    const title = row[titleIdx];
    
    // Exact or close match
    const match = journals.find(j => j.fullName.toLowerCase().trim() === title.toLowerCase().trim());
    if (match) {
      journalMap[legacyId] = match.id;
      console.log(`Mapped Legacy Journal ${legacyId} ("${title}") -> ${match.id}`);
    } else {
      console.warn(`No match for legacy journal ${legacyId}: "${title}"`);
    }
  }

  // 3. Map Legacy Issues (Volumes)
  console.log('Mapping Legacy Issues...');
  const issuesCsv = fs.readFileSync('/tmp/issues.csv', 'utf8');
  const issueRows = parseCSV(issuesCsv);
  const issueHeaders = issueRows[0];
  
  // Header: "id","volume_name","image_path","journal_id","month",...,"issue"
  const issueLegacyIdIdx = issueHeaders.indexOf('id');
  const volNameIdx = issueHeaders.indexOf('volume_name');
  const journIdIdx = issueHeaders.indexOf('journal_id');
  const issueNameIdx = issueHeaders.indexOf('issue');

  for (let i = 1; i < issueRows.length; i++) {
    const row = issueRows[i];
    if (row.length < 8) continue;
    const legacyId = row[issueLegacyIdIdx];
    const volName = row[volNameIdx];
    const legacyJourId = row[journIdIdx];
    const issueName = row[issueNameIdx];

    const currentJournalId = journalMap[legacyJourId];
    if (!currentJournalId) continue;

    // Try to find if it exists
    const volNum = parseInt(volName.replace(/[^0-9]/g, '') || '1');
    const issueNum = parseInt(issueName.replace(/[^0-9]/g, '') || '1');

    let issue = await prisma.journalIssue.findFirst({
      where: {
        journalId: currentJournalId,
        volume: volNum,
        issue: issueNum
      }
    });

    if (!issue) {
      issue = await prisma.journalIssue.create({
        data: {
          journalId: currentJournalId,
          volume: volNum,
          issue: issueNum,
          year: 2024,
          title: `${volName} - ${issueName}`,
          publishedAt: new Date(),
        }
      });
      console.log(`Created new Issue: ${issue.title} for journal ${currentJournalId}`);
    }
    issueMap[legacyId] = issue.id;
  }

  // 4. Migrate Articles (Streaming Mode)
  console.log('Migrating Articles (Streaming)...');
  const articlesPath = '/tmp/articles.csv';
  const fileStream = fs.createReadStream(articlesPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headerRow: string[] | null = null;
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let imported = 0;
  let skipped = 0;

  for await (const lineText of rl) {
    // We add back the newline for multiline fields, except the very first line needs to start the parser
    const line = lineText + '\n';
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentField);
            if (!headerRow) {
                headerRow = currentRow;
            } else {
                await processArticleRow(currentRow, headerRow);
            }
            currentRow = [];
            currentField = '';
        } else {
            if (char !== '\r') currentField += char;
        }
    }
  }

  async function processArticleRow(row: string[], headers: string[]) {
    if (row.length < 10) return;

    const aTitleIdx = headers.indexOf('title');
    const aDoiIdx = headers.indexOf('doi');
    const aJournalIdIdx = headers.indexOf('category_id');
    const aIssueIdIdx = headers.indexOf('volume_id');
    const aAbstractIdx = headers.indexOf('description');
    const aKeywordsIdx = headers.indexOf('keyword');
    const aFileIdx = headers.indexOf('file_path');
    const aAuthorIdx = headers.indexOf('author_name');
    const aPubDateIdx = headers.indexOf('created_at');
    const aIdIdx = headers.indexOf('id');
    const aPaperIdIdx = headers.indexOf('paper_id');

    const legacyId = row[aIdIdx];
    const title = row[aTitleIdx];
    const doi = row[aDoiIdx];
    const legacyJournalId = row[aJournalIdIdx];
    const legacyIssueId = row[aIssueIdIdx];

    if (!title) return;

    // Fast check for duplicates
    const existing = await prisma.article.findFirst({
        where: {
            OR: [
                { title: title },
                ...(doi ? [{ doi: doi }] : [])
            ]
        },
        select: { id: true }
    });

    if (existing) {
        // console.log(`Skipping duplicate: ${title}`);
        skipped++;
        return;
    }

    let targetJournalId = journalMap[legacyJournalId];
    const fallbackJournalId = 'd145da7f-253b-4241-b742-b2369f75e795'; // Progress on Multidisciplinary Scientific Research and Innovation

    if (!targetJournalId) {
        console.warn(`No journal mapping for article ${legacyId} (Legacy Journal ID: ${legacyJournalId}). Using fallback.`);
        targetJournalId = fallbackJournalId;
    }

    const targetIssueId = issueMap[legacyIssueId];
    
    let publicationDate = new Date();
    if (row[aPubDateIdx] && row[aPubDateIdx] !== 'NULL') {
        const d = new Date(row[aPubDateIdx]);
        if (!isNaN(d.getTime())) {
            publicationDate = d;
        }
    }

    try {
        await prisma.article.create({
            data: {
                title: title,
                abstract: row[aAbstractIdx] || 'No abstract provided.',
                journalId: targetJournalId,
                issueId: targetIssueId || null,
                doi: doi || `https://doi.org/10.63471/${row[aPaperIdIdx] || row[aIdIdx]}`,
                keywords: row[aKeywordsIdx] ? row[aKeywordsIdx].split(',').map((k: string) => k.trim()) : [],
                pdfUrl: row[aFileIdx] ? `/uploads/manuscript/${row[aFileIdx]}` : null,
                authorId: '133fd7d5-aedd-4adb-98c2-d6585fb52d3e',
                articleType: 'Research Article',
                status: 'published',
                publicationDate: publicationDate,
                coAuthors: {
                    create: row[aAuthorIdx] ? row[aAuthorIdx].split(',').map((name: string) => ({
                        name: name.trim(),
                        email: '',
                        university: ''
                    })).slice(0, 10) : [] 
                }
            }
        });
        imported++;
        if (imported % 50 === 0) console.log(`Imported ${imported} articles...`);
    } catch (err: any) {
        console.error(`Error importing article ${title}: ${err.message}`);
        skipped++;
    }
  }

  console.log(`Migration complete! Imported: ${imported}, Skipped/Duplicates: ${skipped}`);
}

import readline from 'readline';

main().catch(console.error).finally(() => prisma.$disconnect());
