
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

async function main() {
    const email = 'editor.amlid@c5k.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error('User not found');
        return;
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log('TOKEN:', token);
}

main()
    .finally(() => prisma.$disconnect());
