import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const imageMapping: Record<string, string> = {
    "Quantum Computing: Breaking the RSA Encryption Barrier": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
    "Solid-State Batteries: The End of Lithium-Ion?": "https://images.unsplash.com/photo-1548345680-f5475ea5df84?auto=format&fit=crop&w=800&q=80",
    "Digital Twins in Industrial Manufacturing": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    "Blockchain for IoT Device Authentication": "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800&q=80",
    "Photonic Processors: Computing with Light": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "Autonomous Swarm Drones in Agriculture": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80",
    "CRISPR-Cas9 in Bioinformatics: Data-Driven Gene Editing": "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80",
    "The Evolution of 6G Networks: Terahertz Frequencies": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "Neuromorphic Engineering: Mimicking the Human Brain": "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
    "Edge AI vs. Cloud AI: Architectural Trade-offs": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"
};

async function main() {
    const blogs = await prisma.blog.findMany({
        where: { deletedAt: null }
    });

    for (const blog of blogs) {
        const url = imageMapping[blog.title];
        if (url) {
            await prisma.blog.update({
                where: { id: blog.id },
                data: { featuredImageUrl: url }
            });
            console.log(`Updated blog: "${blog.title}" with image.`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
