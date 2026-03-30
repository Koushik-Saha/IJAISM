import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), 'migration-data');

async function main() {
    console.log('🚀 Starting Final Dissertation Migration Cleanup...');

    // 1. Cleanup
    await prisma.dissertationChapter.deleteMany({});
    await prisma.dissertation.deleteMany({});
    console.log('🗑️  Cleaned up existing dissertation records.');

    // 2. Identify/Create Admin User for Attribution
    const admin = await prisma.user.findFirst({ where: { role: 'super_admin' } }) || 
                  await prisma.user.findFirst({ where: { email: 'admin@ijaism.org' } }) ||
                  await prisma.user.findFirst();
    
    if (!admin) {
        throw new Error('No admin user found to attribute dissertations to.');
    }
    console.log(`👤 Using user: ${admin.email} (ID: ${admin.id}) for attribution.`);

    // 3. Load Dissertation List
    const thesisListPath = path.join(dataDir, 'thesis_list.json');
    if (!fs.existsSync(thesisListPath)) throw new Error('thesis_list.json not found!');
    const dissertationsData = JSON.parse(fs.readFileSync(thesisListPath, 'utf8'));

    // 4. Migrate Dissertations
    let dCount = 0;
    const legacyToNewIdMap: Record<number, string> = {};

    for (const d of dissertationsData) {
        try {
            const newItem = await prisma.dissertation.create({
                data: {
                    title: d.name || 'Untitled Dissertation',
                    abstract: d.description || d.about || 'No abstract available.',
                    authorId: admin.id,
                    authorName: d.authors || 'Legacy Author',
                    university: 'Legacy University', // Default if unknown
                    degreeType: d.category_id === 1 ? 'Master' : 'PhD',
                    status: 'published', // Set to published for immediate visibility
                    defenseDate: d.published_date ? new Date(d.published_date) : null,
                    coverImageUrl: d.book_img ? `/public/backend/thesis/${d.book_img}` : null,
                    createdAt: d.timestamp ? new Date(d.timestamp) : new Date(),
                    updatedAt: new Date(),
                }
            });
            legacyToNewIdMap[d.id] = newItem.id;
            dCount++;
        } catch (e: any) {
            console.error(`❌ Failed to migrate dissertation ID ${d.id}: ${e.message}`);
        }
    }
    console.log(`✅ Created ${dCount} unique Dissertations.`);

    // 5. Migrate Chapters
    const chaptersPath = path.join(dataDir, 'thesis_chpater.json');
    if (fs.existsSync(chaptersPath)) {
        const chaptersData = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
        let cCount = 0;
        for (const c of chaptersData) {
            const newDissId = legacyToNewIdMap[c.thesis_id];
            if (newDissId) {
                try {
                    await prisma.dissertationChapter.create({
                        data: {
                            dissertationId: newDissId,
                            title: c.title || 'Untitled Chapter',
                            pageRange: c.page_range || null,
                            pdfUrl: c.pdf_url || null,
                        }
                    });
                    cCount++;
                } catch (e: any) {
                    console.error(`❌ Failed to migrate chapter ID ${c.id}: ${e.message}`);
                }
            }
        }
        console.log(`✅ Created ${cCount} Chapters from thesis_chpater.json.`);
    }

    // 6. Migrate Front Matter
    const frontMatterPath = path.join(dataDir, 'thesis_front_matter.json');
    if (fs.existsSync(frontMatterPath)) {
        const fmData = JSON.parse(fs.readFileSync(frontMatterPath, 'utf8'));
        let fmCount = 0;
        for (const fm of fmData) {
            const newDissId = legacyToNewIdMap[fm.thesis_id];
            if (newDissId) {
                try {
                    await prisma.dissertationChapter.create({
                        data: {
                            dissertationId: newDissId,
                            title: fm.name || 'Front Matter',
                            pageRange: fm.pages_range || null,
                            pdfUrl: fm.pdf_url || null, // This might be the actual full PDF in some cases
                        }
                    });
                    fmCount++;
                } catch (e: any) {
                    console.error(`❌ Failed to migrate front matter ID ${fm.id}: ${e.message}`);
                }
            }
        }
        console.log(`✅ Created ${fmCount} Front Matter entries.`);
    }

    console.log('🎉 Dissertation migration completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
