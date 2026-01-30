
import { prisma } from "../lib/prisma";

async function main() {
    const id = "3e53b2a5-74d6-4d4e-91e8-07a231c1ebb5";
    const article = await prisma.article.findUnique({
        where: { id },
        select: { id: true, title: true, status: true, pdfUrl: true }
    });
    console.log(JSON.stringify(article, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
