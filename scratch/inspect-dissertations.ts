import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const dissertations = await prisma.dissertation.findMany({
        select: { id: true, title: true, coverImageUrl: true }
    });
    console.log("Dissertations in DB:", JSON.stringify(dissertations.slice(0, 5), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
