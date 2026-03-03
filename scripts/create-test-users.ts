import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
    console.log('Seeding test users...');

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const testUsers = [];

    // 1. Mother Admin
    testUsers.push({
        email: 'mother@c5k.co',
        name: 'Mother Admin',
        role: 'mother_admin',
        university: 'Platform Administration',
        passwordHash,
        isEmailVerified: true
    });

    // 2. Super Admin
    testUsers.push({
        email: 'super@c5k.co',
        name: 'Super Admin',
        role: 'super_admin',
        university: 'Global Administration',
        passwordHash,
        isEmailVerified: true
    });

    // 3. Authors (3)
    for (let i = 1; i <= 3; i++) {
        testUsers.push({
            email: `author${i}@c5k.co`,
            name: `Test Author ${i}`,
            role: 'author',
            university: `University of Authors ${i}`,
            passwordHash,
            isEmailVerified: true
        });
    }

    // 4. Reviewers (3)
    for (let i = 1; i <= 3; i++) {
        testUsers.push({
            email: `reviewer${i}@c5k.co`,
            name: `Test Reviewer ${i}`,
            role: 'reviewer',
            university: `Reviewer Institute ${i}`,
            passwordHash,
            isEmailVerified: true
        });
    }

    // 5. Editors (3)
    for (let i = 1; i <= 3; i++) {
        testUsers.push({
            email: `editor${i}@c5k.co`,
            name: `Test Editor ${i}`,
            role: 'editor',
            university: `Editorial Board ${i}`,
            passwordHash,
            isEmailVerified: true
        });
    }

    // Clear existing test users to prevent unique constraint errors
    const testEmails = testUsers.map(u => u.email);
    await prisma.user.deleteMany({
        where: { email: { in: testEmails } }
    });

    // Create all users
    const createdUsers = [];
    for (const userData of testUsers) {
        const user = await prisma.user.create({
            data: userData
        });
        createdUsers.push(user);
        console.log(`Created: ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    // Assign Journals to Editors
    const editors = createdUsers.filter(u => u.role === 'editor');
    const journals = await prisma.journal.findMany({ take: 3 });

    for (let i = 0; i < editors.length; i++) {
        const editor = editors[i];
        const journal = journals[i]; // May be undefined if fewer than 3 journals

        if (journal) {
            await prisma.journal.update({
                where: { id: journal.id },
                data: { editorId: editor.id }
            });
            console.log(`Assigned Editor ${editor.name} to Journal: ${journal.fullName}`);
        } else {
            console.log(`No journal available to assign to Editor ${editor.name}`);
        }
    }

    console.log('Seeding complete!');
}

seedUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
