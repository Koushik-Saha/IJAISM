import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Author@C5K!2026';

function generateSlugEmail(name: string, index: number = 0): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.+$)/g, '');
    if (index === 0) return `${slug}@author.c5k.com`;
    return `${slug}${index}@author.c5k.com`;
}

async function main() {
    console.log("Starting Author Profile Generation Script...");

    // Fetch all CoAuthors that don't have a userId yet
    const coAuthors = await prisma.coAuthor.findMany({
        where: { userId: null },
    });

    console.log(`Found ${coAuthors.length} unlinked co-authors across the database.`);

    if (coAuthors.length === 0) {
        console.log("No authors to migrate. Exiting.");
        return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    let createdCount = 0;
    let linkedCount = 0;

    for (const ca of coAuthors) {
        // 1. Try to find a User by exact name (case-insensitive) or email
        let existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: { equals: ca.name, mode: 'insensitive' } },
                    ...(ca.email ? [{ email: { equals: ca.email, mode: 'insensitive' as const } }] : [])
                ]
            }
        });

        if (existingUser) {
            // Link existing user
            await prisma.coAuthor.update({
                where: { id: ca.id },
                data: { userId: existingUser.id }
            });
            linkedCount++;
            console.log(`[LINKED] Unlinked Co-author '${ca.name}' directly matched to existing User ID: ${existingUser.id}`);
        } else {
            // Need to create a new User
            let emailIndex = 0;
            let email = generateSlugEmail(ca.name, emailIndex);
            
            // Ensure unique email
            while (await prisma.user.findUnique({ where: { email } })) {
                emailIndex++;
                email = generateSlugEmail(ca.name, emailIndex);
            }

            const newUser = await prisma.user.create({
                data: {
                    name: ca.name,
                    email: email,
                    passwordHash: hashedPassword,
                    role: "author",
                    university: ca.university || "Unknown University",
                    affiliation: ca.university || null,
                    isEmailVerified: true, // Auto-verified since it's a structural account
                }
            });

            await prisma.coAuthor.update({
                where: { id: ca.id },
                data: { userId: newUser.id }
            });

            createdCount++;
            console.log(`[CREATED] Generated new User account for '${ca.name}' under email '${email}'`);
        }
    }

    console.log(`\nMigration Complete!`);
    console.log(`- New Author Accounts Created: ${createdCount}`);
    console.log(`- Existing Accounts Linked: ${linkedCount}`);
    console.log(`- Default Password used for new accounts: ${DEFAULT_PASSWORD}`);
}

main()
    .catch((e) => {
        console.error("Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
