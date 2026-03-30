import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), 'migration-data');

async function migrateBooks() {
    const filePath = path.join(dataDir, 'book_list.json');
    if (!fs.existsSync(filePath)) return console.log('books skipped');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let count = 0;
    for (const b of data) {
        try {
            await prisma.book.upsert({
                where: { isbn: b.first_isbn || `isbn-fallback-${b.id}` },
                update: {},
                create: {
                    title: b.name || 'Untitled Book',
                    authors: b.authors ? b.authors.split(',').map((a: string) => a.trim()) : [],
                    year: b.published_date ? new Date(b.published_date).getFullYear() : 2024,
                    isbn: b.first_isbn || `isbn-fallback-${b.id}`,
                    pages: parseInt(b.total_pages) || 0,
                    field: b.category_id ? `Category ${b.category_id}` : 'General',
                    description: b.des || 'No description',
                    fullDescription: b.about || 'No full description',
                    price: b.price?.toString() || '0',
                    publisher: 'C5K Publications',
                    language: 'English',
                    edition: '1st Edition',
                    format: 'Digital',
                    createdAt: new Date(b.timestamp || Date.now()),
                }
            });
            count++;
        } catch (e: any) {
            console.error(`Failed to migrate book ${b.name}: ${e.message}`);
        }
    }
    console.log(`✅ Migrated ${count} Books`);
}

async function migrateDissertations() {
    const filePath = path.join(dataDir, 'thesis_list.json');
    if (!fs.existsSync(filePath)) return console.log('dissertations skipped');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const admin = await prisma.user.findFirst({ where: { role: 'super_admin' } }) || await prisma.user.findFirst();
    let count = 0;
    for (const t of data) {
        if (!admin) break;
        try {
            const existing = await prisma.dissertation.findFirst({ where: { title: t.name || 'Untitled' }});
            if (!existing) {
                await prisma.dissertation.create({
                    data: {
                        title: t.name || 'Untitled',
                        abstract: t.description || 'No abstract',
                        authorId: admin.id,
                        authorName: t.authors || 'Unknown',
                        university: 'Unknown University',
                        degreeType: t.category_id === 1 ? 'Master' : 'PhD',
                        defenseDate: t.published_date ? new Date(t.published_date) : new Date(),
                        status: 'approved',
                        createdAt: new Date(t.timestamp || Date.now())
                    }
                });
                count++;
            }
        } catch (e: any) {
            console.error(`Failed to migrate dissertation ${t.title}: ${e.message}`);
        }
    }
    console.log(`✅ Migrated ${count} Dissertations`);
}

async function migrateNews() {
    const filePath = path.join(dataDir, 'news.json');
    if (!fs.existsSync(filePath)) return console.log('news skipped');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let count = 0;
    for (const n of data) {
        try {
            const existing = await prisma.announcement.findFirst({ where: { title: n.title || 'Untitled News' }});
            if (!existing) {
                await prisma.announcement.create({
                    data: {
                        title: n.title || 'Untitled News',
                        content: n.details || '',
                        excerpt: n.details ? n.details.substring(0, 150) + '...' : null,
                        isFeatured: true,
                        publishedAt: new Date(n.created_at || Date.now()),
                        createdAt: new Date(n.created_at || Date.now()),
                        author: 'Admin'
                    }
                });
                count++;
            }
        } catch(e: any) {
            console.error(`Failed news: ${n.title}`);
        }
    }
    console.log(`✅ Migrated ${count} News Announcements`);
}

async function migrateBlogs() {
    const filePath = path.join(dataDir, 'blogs.json');
    if (!fs.existsSync(filePath)) return console.log('blogs skipped');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const admin = await prisma.user.findFirst({ where: { role: 'super_admin' } }) || await prisma.user.findFirst();
    let count = 0;
    for (const b of data) {
        if (!admin) break;
        try {
            const title = b.title || 'Untitled Blog';
            const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const slug = `${slugBase}-${Math.floor(Math.random() * 10000)}`;
            
            await prisma.blog.upsert({
                where: { slug: slug },
                update: {},
                create: {
                    title: title,
                    slug: slug,
                    content: b.details || '',
                    excerpt: b.details ? b.details.substring(0, 150) + '...' : null,
                    authorId: admin.id,
                    status: 'published',
                    publishedAt: new Date(b.created_at || Date.now()),
                    createdAt: new Date(b.created_at || Date.now())
                }
            });
            count++;
        } catch(e: any) {
            console.error(`Failed blog ${b.title}`);
        }
    }
    console.log(`✅ Migrated ${count} Blogs`);
}

async function run() {
    console.log('--- Database Migration ---');
    await migrateBooks();
    await migrateDissertations();
    await migrateNews();
    await migrateBlogs();
    console.log('--- Migration Finished ---');
}

run().catch(console.error).finally(() => prisma.$disconnect());
