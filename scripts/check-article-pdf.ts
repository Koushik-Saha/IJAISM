
import { prisma } from '../lib/prisma';

async function main() {
    const id = '23ca92a4-5308-40c4-8349-90dcd36e062b';
    const article = await prisma.article.findUnique({
        where: { id },
        select: { id: true, title: true, pdfUrl: true, status: true }
    });

    console.log('Article Check:', article);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
