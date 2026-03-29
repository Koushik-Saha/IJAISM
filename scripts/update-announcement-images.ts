const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  { title: 'AI Ethics and Governance', url: '/images/announcements/ai_ethics.png' },
  { title: 'ICAIML', url: '/images/announcements/icaiml_conference.png' },
  { title: 'Scholarship', url: '/images/announcements/scholarship.png' },
  { title: 'Author Guidelines', url: '/images/announcements/guidelines.png' },
  { title: 'Editorial Board', url: '/images/announcements/editorial_board.png' },
  { title: 'Business Analytics', url: '/images/announcements/business_analytics.png' }
];

async function main() {
    console.log("Updating announcement images...");
    const announcements = await prisma.announcement.findMany();
    for (const update of updates) {
        const target = announcements.find((a: any) => a.title.includes(update.title));
        if (target) {
            await prisma.announcement.update({
                where: { id: target.id },
                data: { thumbnailUrl: update.url }
            });
            console.log('✅ Updated: ' + target.title);
        } else {
            console.log('❌ Could not find: ' + update.title);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
