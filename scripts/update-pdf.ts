
import { prisma } from '../lib/prisma';

async function main() {
    const id = '23ca92a4-5308-40c4-8349-90dcd36e062b';
    await prisma.article.update({
        where: { id },
        data: {
            pdfUrl: '/uploads/dummy.pdf',
            status: 'published', // Setting to published to be safe and consistent
            publicationDate: new Date()
        }
    });

    console.log('Article updated with dummy PDF URL');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
