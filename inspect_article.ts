import { prisma } from './lib/prisma';

async function main() {
    const id = '52709d4d-02bd-41dd-83ff-23cf969dbd8e';
    const article = await prisma.article.findUnique({
        where: { id },
        select: { id: true, title: true, pdfUrl: true, status: true }
    });

    console.log('Article Details:', article);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
