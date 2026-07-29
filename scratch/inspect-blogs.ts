import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const blogs = await prisma.blog.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true, featuredImageUrl: true }
    });
    console.log("Blogs in DB:", JSON.stringify(blogs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
