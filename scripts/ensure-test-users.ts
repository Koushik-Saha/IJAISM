
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
    const commonPassword = 'password123';
    const strongPassword = 'Password123!';
    const commonHash = await hashPassword(commonPassword);
    const strongHash = await hashPassword(strongPassword);

    const users = [
        { email: 'mother.admin@c5k.com', role: 'mother_admin', name: 'Mother Admin', pass: strongPassword, hash: strongHash },
        { email: 'editor@c5k.com', role: 'editor', name: 'Test Editor', pass: commonPassword, hash: commonHash },
        { email: 'author@c5k.com', role: 'author', name: 'Test Author', pass: commonPassword, hash: commonHash },
        { email: 'reviewer@c5k.com', role: 'reviewer', name: 'Test Reviewer', pass: commonPassword, hash: commonHash }
    ];

    console.log('--- USER CREDENTIALS ---');

    for (const u of users) {
        let user = await prisma.user.findUnique({ where: { email: u.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: u.email,
                    name: u.name,
                    role: u.role,
                    passwordHash: u.hash,
                    isEmailVerified: true,
                    isActive: true,
                    university: 'C5K Test'
                }
            });
            console.log(`[CREATED] ${u.role.toUpperCase()}: ${u.email} / ${u.pass}`);
        } else {
            // Reset password to ensure we know it
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: u.hash, role: u.role }
            });
            console.log(`[RESET] ${u.role.toUpperCase()}: ${u.email} / ${u.pass}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
