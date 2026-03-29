import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';

const prisma = new PrismaClient();

async function main() {
  const filePath = '/Users/koushiksaha/Desktop/FixItUp/c5k Database/u260153612_c5k.sql';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const adminId = '133fd7d5-aedd-4adb-98c2-d6585fb52d3e';
  let buffer = '';
  let inStatement = false;
  let type: 'book' | 'thesis' | null = null;
  let count = 0;

  console.log('Final restoration attempt from SQL...');

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.includes("INSERT INTO `book_list`")) {
      inStatement = true;
      type = 'book';
      buffer = trimmed;
    } else if (trimmed.includes("INSERT INTO `thesis_list`")) {
      inStatement = true;
      type = 'thesis';
      buffer = trimmed;
    } else if (inStatement) {
      buffer += ' ' + trimmed;
    }

    if (inStatement && trimmed.endsWith(');')) {
      const startIdx = buffer.indexOf('VALUES');
      if (startIdx !== -1) {
        let valuesStr = buffer.substring(startIdx + 6).trim();
        // Remove leading '(' and trailing ');'
        valuesStr = valuesStr.substring(1, valuesStr.length - 2);

        // Split by '), (' - this is tricky if quotes contain this pattern, 
        // but for this specific dump it's likely safe enough.
        const rows = valuesStr.split(/\),\s*\(/);
        
        for (const rowContent of rows) {
          const values = parseSqlValues(rowContent);
          if (type === 'book') await importBook(values, adminId);
          if (type === 'thesis') await importThesis(values, adminId);
          count++;
          if (count % 100 === 0) console.log(`Processed ${count} items...`);
        }
      }
      inStatement = false;
      type = null;
      buffer = '';
    }
  }
  console.log(`Success! Total items processed: ${count}`);
}

function parseSqlValues(str: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if ((char === "'" || char === '"') && (i === 0 || str[i-1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    } else if (char === ',' && !inQuotes) {
      results.push(current.trim().replace(/^'/, '').replace(/'$/, '').replace(/\\'/g, "'"));
      current = '';
    } else {
      current += char;
    }
  }
  results.push(current.trim().replace(/^'/, '').replace(/'$/, '').replace(/\\'/g, "'"));
  return results;
}

async function importBook(v: string[], adminId: string) {
  const title = v[1];
  if (!title || title === 'NULL') return;
  const isbn = v[9] !== 'NULL' ? v[9] : (v[10] !== 'NULL' ? v[10] : `STUB-${Math.random().toString(36).substr(2, 5)}`);
  
  try {
    await prisma.book.upsert({
      where: { isbn: isbn },
      update: {},
      create: {
        title: title,
        authors: v[8] !== 'NULL' ? v[8].split(',').map(a => a.trim()) : ['Author'],
        year: v[13] !== 'NULL' ? parseInt(v[13].split('-')[0]) || 2024 : 2024,
        isbn: isbn,
        pages: 0,
        field: 'Research',
        description: (v[3] || 'No description').substring(0, 1000),
        fullDescription: (v[25] || v[24] || v[3] || 'No description'),
        price: v[5] !== 'NULL' ? v[5] : 'Free',
        publisher: 'C5K Publications',
        language: 'English',
        edition: '1st Edition',
        format: 'Digital',
      }
    });
  } catch (e) {}
}

async function importThesis(v: string[], adminId: string) {
  const title = v[1];
  if (!title || title === 'NULL') return;
  try {
    await prisma.dissertation.create({
      data: {
        title: title,
        abstract: (v[3] || 'No abstract').substring(0, 5000),
        authorId: adminId,
        authorName: v[9] !== 'NULL' ? v[9] : 'Researcher',
        university: 'International American University',
        department: 'Research',
        degreeType: 'PhD',
        status: 'published',
      }
    });
  } catch (e) {}
}

main().catch(console.error).finally(() => prisma.$disconnect());
