import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPdfUrls() {
    const articles = await prisma.article.findMany({
        where: {
            pdfUrl: {
                contains: 'c5k.com'
            }
        },
        select: {
            id: true,
            pdfUrl: true
        },
        take: 5
    });

    const totalLegacyPdfs = await prisma.article.count({
        where: {
            pdfUrl: {
                contains: 'c5k.com'
            }
        }
    });

    console.log(`Total legacy PDFs to migrate: ${totalLegacyPdfs}`);
    console.log('Sample URLs:', articles);
}

checkPdfUrls()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
