
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'koushiksahala@gmail.com';
    console.log(`🔍 Looking up verification token for: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            emailVerificationTokens: {
                where: { used: false },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!user) {
        console.error('❌ User not found.');
        return;
    }

    if (!user.emailVerificationTokens || user.emailVerificationTokens.length === 0) {
        console.error('❌ No active verification token found.');
        return;
    }

    const token = user.emailVerificationTokens[0].token;
    console.log('\n✅ Verification Link (Click this):');
    console.log(`http://localhost:3000/verify-email?token=${token}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
