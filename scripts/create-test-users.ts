
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating test users...');

    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
        {
            email: 'author@c5k.com',
            name: 'Test Author',
            university: 'Test University',
            role: 'author',
            affiliation: 'Department of Testing',
        },
        {
            email: 'reviewer@c5k.com',
            name: 'Test Reviewer 1',
            university: 'Review University',
            role: 'reviewer',
            affiliation: 'Department of Reviews',
        },
        {
            email: 'reviewer2@c5k.com',
            name: 'Test Reviewer 2',
            university: 'Review University',
            role: 'reviewer',
            affiliation: 'Department of Reviews',
        },
        {
            email: 'editor@c5k.com',
            name: 'Test Editor',
            university: 'Editorial Board',
            role: 'editor',
            affiliation: 'Editorial Office',
        },
        {
            email: 'superadmin@c5k.com',
            name: 'Test Super Admin',
            university: 'System Administrator',
            role: 'super_admin',
            affiliation: 'IT Department',
        },
    ];

    for (const userData of users) {
        try {
            const user = await prisma.user.upsert({
                where: { email: userData.email },
                update: {
                    name: userData.name,
                    university: userData.university,
                    role: userData.role,
                    passwordHash, // Ensure password is set/reset to known value
                },
                create: {
                    email: userData.email,
                    passwordHash,
                    name: userData.name,
                    university: userData.university,
                    role: userData.role,
                    affiliation: userData.affiliation,
                    isEmailVerified: true,
                    isActive: true,
                },
            });
            console.log(`✓ Created/Updated user: ${userData.email} (${userData.role})`);
        } catch (error) {
            console.error(`✗ Error creating user ${userData.email}:`, error);
        }
    }

    console.log('\nTest users created successfully!');
    console.log('All users have password: password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
