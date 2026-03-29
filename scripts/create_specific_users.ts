import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

async function main() {
    console.log('🌱 Trimming down and seeding specific users requested by the user...');

    const password = 'Password123!';
    const hashedPassword = await hashPassword(password);

    // 1. Mother Admin
    await prisma.user.upsert({
        where: { email: 'mother@c5k.co' },
        update: { role: 'mother_admin' },
        create: {
            name: 'Mother Admin',
            email: 'mother@c5k.co',
            passwordHash: hashedPassword,
            role: 'mother_admin',
            university: 'C5K Central',
            isEmailVerified: true
        }
    });
    console.log('✅ Created Mother Admin: mother@c5k.co');

    // 2. Super Admin
    await prisma.user.upsert({
        where: { email: 'super@c5k.co' },
        update: { role: 'super_admin' },
        create: {
            name: 'Super Admin',
            email: 'super@c5k.co',
            passwordHash: hashedPassword,
            role: 'super_admin',
            university: 'C5K Management',
            isEmailVerified: true
        }
    });
    console.log('✅ Created Super Admin: super@c5k.co');

    // 3. Editors
    const editorsToCreate = [
        { email: 'editor1@c5k.co', name: 'Editor 1', journalKeyword: 'Machine Learning' },
        { email: 'editor2@c5k.co', name: 'Editor 2', journalKeyword: 'Progress on Multidisciplinary' },
        { email: 'editor3@c5k.co', name: 'Editor 3', journalKeyword: 'Business Venturing' }
    ];

    for (const ed of editorsToCreate) {
        const user = await prisma.user.upsert({
            where: { email: ed.email },
            update: { role: 'editor' },
            create: {
                name: ed.name,
                email: ed.email,
                passwordHash: hashedPassword,
                role: 'editor',
                university: 'C5K Editorial Board',
                isEmailVerified: true
            }
        });
        console.log(`✅ Created Editor: ${ed.email}`);

        // Find journal by keyword and assign editor
        const journals = await prisma.journal.findMany();
        const targetJournal = journals.find(j => j.fullName.includes(ed.journalKeyword));
        
        if (targetJournal) {
            await prisma.journal.update({
                where: { id: targetJournal.id },
                data: { editorId: user.id }
            });
            console.log(`   🔗 Assigned ${ed.email} to ${targetJournal.fullName}`);
        } else {
            console.warn(`   ⚠️ Could not find journal matching "${ed.journalKeyword}"!`);
        }
    }

    // 4. Reviewers
    for (let i = 1; i <= 3; i++) {
        const email = `reviewer${i}@c5k.co`;
        await prisma.user.upsert({
            where: { email },
            update: { role: 'reviewer' },
            create: {
                name: `Reviewer ${i}`,
                email,
                passwordHash: hashedPassword,
                role: 'reviewer',
                university: `University of Reviewer ${i}`,
                isEmailVerified: true
            }
        });
        console.log(`✅ Created Reviewer: ${email}`);
    }

    // 5. Authors
    for (let i = 1; i <= 3; i++) {
        const email = `author${i}@c5k.co`;
        await prisma.user.upsert({
            where: { email },
            update: { role: 'author' },
            create: {
                name: `Author ${i}`,
                email,
                passwordHash: hashedPassword,
                role: 'author',
                university: `University of Author ${i}`,
                isEmailVerified: true
            }
        });
        console.log(`✅ Created Author: ${email}`);
    }

    console.log('==============================================');
    console.log('All exact users requested have been created!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
