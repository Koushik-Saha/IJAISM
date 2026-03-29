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

  const adminId = '133fd7d5-aedd-4adb-98c2-d6585fb52d3e'; // mother@c5k.co
  let currentTable = '';
  let buffer = '';
  let count = 0;

  console.log('Restoring Books and Dissertations from SQL...');

  for await (const line of rl) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('INSERT INTO `book_list`')) {
      currentTable = 'book';
      buffer = trimmedLine;
    } else if (trimmedLine.startsWith('INSERT INTO `thesis_list`')) {
      currentTable = 'thesis';
      buffer = trimmedLine;
    } else if (currentTable) {
      buffer += ' ' + trimmedLine;
    }

    if (currentTable && buffer.includes(');')) {
      // Process buffered SQL statement
      const valuesPart = buffer.match(/VALUES \(([\s\S]*)\);/);
      if (valuesPart) {
        const values = parseSqlValues(valuesPart[1]);
        if (currentTable === 'book') {
          await importBook(values, adminId);
        } else if (currentTable === 'thesis') {
          await importThesis(values, adminId);
        }
        count++;
        if (count % 50 === 0) console.log(`Processed ${count} items...`);
      }
      currentTable = '';
      buffer = '';
    }
  }

  console.log(`Migration complete. Total items processed: ${count}`);
}

function parseSqlValues(str: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      if (nextChar === quoteChar) {
        current += quoteChar;
        i++;
      } else {
        inQuotes = false;
        quoteChar = '';
      }
    } else if (char === ',' && !inQuotes) {
      results.push(current.trim().replace(/^'/, '').replace(/'$/, ''));
      current = '';
    } else {
      current += char;
    }
  }
  results.push(current.trim().replace(/^'/, '').replace(/'$/, ''));
  return results;
}

async function importBook(v: string[], adminId: string) {
  // book_list columns (based on grep): id(0), name(1), category_id(2), description(3), keyfeature(4), price(5), hard_cover(6), paper_book(7), authors(8), online_isbn(9), first_isbn(10), first_publsh(11), timestamp(12), published_date(13), doi(14), type(15), items_weight(16), userId(17), book_img(18), dimention(19), copyright(20), status(21), created_at(22), updated_at(23), des(24), about(25)
  const title = v[1];
  const isbn = v[9] && v[9] !== 'NULL' ? v[9] : (v[10] && v[10] !== 'NULL' ? v[10] : `STUB-${Math.random().toString(36).substr(2, 9)}`);
  
  const existing = await prisma.book.findFirst({ where: { OR: [{ title }, { isbn }] } });
  if (existing) return;

  try {
    await prisma.book.create({
      data: {
        title: title || 'Untitled Book',
        authors: v[8] ? v[8].split(',').map(a => a.trim()) : ['Researcher'],
        year: v[13] ? parseInt(v[13].split('-')[0]) || 2024 : 2024,
        isbn: isbn,
        pages: 0,
        field: v[15] || 'Research',
        description: (v[3] || 'No description').substring(0, 1000),
        fullDescription: (v[25] || v[3] || 'No description'),
        price: v[5] || 'Free',
        publisher: 'C5K Publications',
        language: 'English',
        edition: '1st Edition',
        format: 'Digital',
        coverImageUrl: v[18] && v[18] !== 'NULL' ? `/uploads/books/${v[18]}` : null,
      }
    });
  } catch (err) {}
}

async function importThesis(v: string[], adminId: string) {
  // thesis_list columns: id(0), name(1), category_id(2), description(3), about(4), keyfeature(5), price(6), hard_cover(7), paper_book(8), authors(9), online_isbn(10), first_isbn(11), first_publsh(12), timestamp(13), published_date(14), doi(15), type(16), items_weight(17), userId(18), book_img(19), dimention(20), copyright(21)
  const title = v[1];
  const existing = await prisma.dissertation.findFirst({ where: { title } });
  if (existing) return;

  try {
    await prisma.dissertation.create({
      data: {
        title: title || 'Untitled Dissertation',
        abstract: (v[3] || 'No abstract').substring(0, 5000),
        authorId: adminId,
        authorName: v[9] && v[9] !== 'NULL' ? v[9] : 'C5K Researcher',
        university: 'International American University',
        department: 'Research',
        degreeType: v[16] || 'PhD',
        status: 'published',
        submissionDate: v[14] && v[14] !== 'NULL' ? new Date(v[14]) : new Date(),
      }
    });
  } catch (err) {}
}

main().catch(console.error).finally(() => prisma.$disconnect());
