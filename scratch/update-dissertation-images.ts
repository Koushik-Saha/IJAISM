import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const unsplashImages = [
    "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=400&q=80"
];

async function main() {
    const dissertations = await prisma.dissertation.findMany({});

    for (let i = 0; i < dissertations.length; i++) {
        const d = dissertations[i];
        const imageUrl = unsplashImages[i % unsplashImages.length];
        await prisma.dissertation.update({
            where: { id: d.id },
            data: { coverImageUrl: imageUrl }
        });
        console.log(`Updated dissertation: "${d.title}" with cover image.`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
