import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

function parseCSV(content: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

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
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentRow.length > 0 || currentField !== '') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
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

async function main() {
  console.log('Starting Books & Dissertations Migration...');
  const adminId = '133fd7d5-aedd-4adb-98c2-d6585fb52d3e'; // mother@c5k.co

  // 1. Migrate Books
  console.log('Migrating Books...');
  const booksCsv = fs.readFileSync('/tmp/books.csv', 'utf8');
  const bookRows = parseCSV(booksCsv);
  console.log(`Found ${bookRows.length} potential Book rows.`);
  const bHeaders = bookRows[0];
  console.log('Book Headers:', bHeaders);
  const bTitleIdx = bHeaders.indexOf('name');
  const bAuthIdx = bHeaders.indexOf('authors');
  const bIsbnIdx = bHeaders.indexOf('online_isbn');
  const bPriceIdx = bHeaders.indexOf('price');
  const bDescIdx = bHeaders.indexOf('description');
  const bPubDateIdx = bHeaders.indexOf('published_date');

  let bImported = 0;
  for (let i = 1; i < bookRows.length; i++) {
    const row = bookRows[i];
    const title = row[bTitleIdx];
    if (!title || title === 'name') continue;

    const isbn = row[bIsbnIdx] || `STUB-${Math.random().toString(36).substr(2, 9)}`;
    const existing = await prisma.book.findFirst({ where: { OR: [{ title }, { isbn }] } });
    if (existing) continue;

    try {
        await prisma.book.create({
            data: {
                title: title.trim(),
                authors: row[bAuthIdx] ? row[bAuthIdx].split(',').map((a: string) => a.trim().replace(/^"/, '').replace(/"$/, '')) : ['C5K Author'],
                year: row[bPubDateIdx] ? parseInt(row[bPubDateIdx].split('-')[0]) || 2024 : 2024,
                isbn: isbn.trim(),
                pages: 0,
                field: 'Research',
                description: (row[bDescIdx] || 'No description').substring(0, 1000),
                fullDescription: (row[bDescIdx] || 'No description'),
                price: row[bPriceIdx] || 'Contact for Price',
                publisher: 'C5K Publications',
                language: 'English',
                edition: '1st Edition',
                format: 'Digital',
                coverImageUrl: null,
            }
        });
        bImported++;
    } catch (err) {}
  }
  console.log(`Imported ${bImported} Books.`);

  // 2. Migrate Dissertations
  console.log('Migrating Dissertations...');
  const dissCsv = fs.readFileSync('/tmp/dissertations.csv', 'utf8');
  const dissRows = parseCSV(dissCsv);
  const dHeaders = dissRows[0];
  const dTitleIdx = dHeaders.indexOf('name');
  const dAuthIdx = dHeaders.indexOf('authors');
  const dDescIdx = dHeaders.indexOf('description');

  let dImported = 0;
  for (let i = 1; i < dissRows.length; i++) {
    const row = dissRows[i];
    const title = row[dTitleIdx];
    if (!title || title === 'name') continue;

    const existing = await prisma.dissertation.findFirst({ where: { title } });
    if (existing) continue;

    try {
        await prisma.dissertation.create({
            data: {
                title: title.trim(),
                abstract: (row[dDescIdx] || 'No abstract').substring(0, 5000),
                authorId: adminId,
                authorName: row[dAuthIdx] || 'C5K Researcher',
                university: 'International American University',
                department: 'Research',
                degreeType: 'PhD',
                status: 'published',
            }
        });
        dImported++;
    } catch (err) {}
  }
  console.log(`Imported ${dImported} Dissertations.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
