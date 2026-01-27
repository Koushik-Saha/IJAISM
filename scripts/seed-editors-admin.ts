
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

async function main() {
    console.log('🌱 Seeding Mother Admin and Editors...');

    const password = 'Password123!';
    const hashedPassword = await hashPassword(password);

    // 1. Create Mother Admin
    const motherEmail = 'mother.admin@c5k.com';
    let motherAdmin = await prisma.user.findUnique({ where: { email: motherEmail } });

    if (!motherAdmin) {
        motherAdmin = await prisma.user.create({
            data: {
                name: 'The Mother Admin',
                email: motherEmail,
                passwordHash: hashedPassword,
                role: 'mother_admin',
                university: 'C5K Central',
                isEmailVerified: true
            }
        });
        console.log(`✅ Created Mother Admin: ${motherEmail} / ${password}`);
    } else {
        // Ensure role is correct if existing
        if (motherAdmin.role !== 'mother_admin') {
            await prisma.user.update({ where: { id: motherAdmin.id }, data: { role: 'mother_admin' } });
            console.log(`🔄 Updated existing user to Mother Admin: ${motherEmail}`);
        } else {
            console.log(`ℹ️ Mother Admin already exists: ${motherEmail}`);
        }
    }

    // 2. Assign Editors to Journals
    const journals = await prisma.journal.findMany({ include: { editor: true } });

    console.log(`\n📋 Processing ${journals.length} Journals...`);

    const credentials = [];

    for (const journal of journals) {
        if (journal.editor) {
            console.log(`   - [${journal.code}] Already has editor: ${journal.editor.email}`);
            continue;
        }

        // Create Editor for this Journal
        const editorEmail = `editor.${journal.code.toLowerCase()}@c5k.com`;
        let editor = await prisma.user.findUnique({ where: { email: editorEmail } });

        if (!editor) {
            editor = await prisma.user.create({
                data: {
                    name: `Editor ${journal.code}`,
                    email: editorEmail,
                    passwordHash: hashedPassword,
                    role: 'editor',
                    university: 'C5K Academic Body',
                    isEmailVerified: true,
                    managedById: motherAdmin.id // Managed by Mother Admin
                }
            });
            console.log(`   ✅ Created Editor: ${editorEmail}`);
            credentials.push({ role: 'Editor', journal: journal.code, email: editorEmail, password });
        } else {
            // Update user to editor if not
            if (editor.role !== 'editor') {
                await prisma.user.update({ where: { id: editor.id }, data: { role: 'editor' } });
            }
            console.log(`   ℹ️ Editor user exists: ${editorEmail}`);
        }

        // Assign to Journal
        await prisma.journal.update({
            where: { id: journal.id },
            data: { editorId: editor.id }
        });
        console.log(`   🔗 Assigned ${editorEmail} to ${journal.code}`);
    }

    console.log('\n\n================ CHECKERBOARD ================');
    console.log(`🔑 Mother Admin: ${motherEmail}`);
    console.log(`🔑 Password: ${password}`);
    console.log('----------------------------------------------');
    if (credentials.length > 0) {
        console.log('New Editors Created:');
        credentials.forEach(c => {
            console.log(`User: ${c.email} | Pass: ${c.password} | Journal: ${c.journal}`);
        });
    } else {
        console.log('No new editors created (all journals likely assigned already).');
    }
    console.log('==============================================');

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
