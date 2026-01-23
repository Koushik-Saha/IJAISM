import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting E2E Seed...');

    // 1. Clear Database (Reverse dependency order to avoid FK errors)
    try {
        // Level 1: Leaf nodes (depend on others)
        await prisma.coAuthor.deleteMany();
        await prisma.review.deleteMany();
        await prisma.downloadLog.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.emailVerificationToken.deleteMany();
        await prisma.passwordResetToken.deleteMany();
        await prisma.membership.deleteMany();
        await prisma.conferenceRegistration.deleteMany();

        // Level 2: Content
        await prisma.article.deleteMany();
        await prisma.blog.deleteMany();
        await prisma.dissertation.deleteMany();

        // Level 3: Parents
        await prisma.journalIssue.deleteMany();
        await prisma.journal.deleteMany();
        await prisma.conference.deleteMany();
        await prisma.user.deleteMany();
    } catch (e) {
        console.warn('Cleanup warning:', e);
        // We don't exit here because partial cleanup might be enough if tables were empty
    }

    console.log('🧹 Database cleared');

    // 2. Create Users
    const passwordHash = await hashPassword('password123');

    const author = await prisma.user.create({
        data: {
            email: 'author@c5k.com',
            name: 'Test Author',
            university: 'E2E University',
            passwordHash,
            role: 'author',
            isActive: true,
            isEmailVerified: true,
        }
    });

    const reviewer = await prisma.user.create({
        data: {
            email: 'reviewer@c5k.com',
            name: 'Test Reviewer',
            university: 'E2E Tech',
            passwordHash,
            role: 'reviewer',
            isActive: true,
            isEmailVerified: true,
        }
    });

    const editor = await prisma.user.create({
        data: {
            email: 'editor@c5k.com',
            name: 'Test Editor',
            university: 'E2E Admin',
            passwordHash,
            role: 'editor',
            isActive: true,
            isEmailVerified: true,
        }
    });

    console.log('👥 Users created: author, reviewer, editor');

    // 3. Create Journals
    const journal = await prisma.journal.create({
        data: {
            code: 'JITMB',
            fullName: 'Journal of Information Technology',
            shortName: 'JITMB',
            description: 'E2E Test Journal',
            issn: '1234-5678',
            eIssn: '8765-4321',
            isActive: true,
            impactFactor: 1.5,
            citeScore: 2.0,
            frequency: 'Monthly',
            themeColor: '#006d77',
            coverImageUrl: 'https://placehold.co/400x600/006d77/ffffff?text=JITMB'
        }
    });

    console.log('📚 Journal created: JITMB');

    // 4. Create Sample Articles
    // Published Article
    await prisma.article.create({
        data: {
            title: 'Published AI Research',
            abstract: 'This is a published article about AI for E2E testing public views.',
            keywords: ['AI', 'Testing', 'Public'],
            status: 'published',
            articleType: 'research',
            submissionDate: new Date('2023-01-01'),
            authorId: author.id,
            journalId: journal.id,
            publicationDate: new Date('2023-02-01'),
            downloadCount: 100,
            citationCount: 5
        }
    });

    // Submitted Article (for Reviewer)
    const submittedArticle = await prisma.article.create({
        data: {
            title: 'Submitted Manuscript',
            abstract: 'This manuscript is waiting for review.',
            keywords: ['Draft', 'Pending'],
            status: 'submitted',
            articleType: 'research',
            submissionDate: new Date(),
            authorId: author.id,
            journalId: journal.id,
        }
    });

    // Assigned Article (for Reviewer to see)
    await prisma.review.create({
        data: {
            articleId: submittedArticle.id,
            reviewerId: reviewer.id,
            status: 'pending',
            assignedAt: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
            reviewerNumber: 1
        }
    });

    console.log('📄 Articles created: Published & Submitted');
    console.log('✅ E2E Seed Complete');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
