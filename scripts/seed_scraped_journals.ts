import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const journals = [
    {
        code: 'JITMB',
        fullName: 'Journal of Information Technology Management and Business Horizons',
        issn: '3067-5308',
        eIssn: '3067-5316',
        frequency: 'Every Two Months',
        citeScore: 0.4,
        impactFactor: 0.25,
        coverImageUrl: 'https://c5k.com/public/backend/journal/9.png'
    },
    {
        code: 'DRSDR',
        fullName: 'Demographic Research and Social Development Reviews',
        issn: '3067-5359',
        eIssn: '3067-5391',
        frequency: 'Every Two Months',
        citeScore: 0.5,
        impactFactor: 0.3,
        coverImageUrl: 'https://c5k.com/public/backend/journal/13.png'
    },
    {
        code: 'ILPROM',
        fullName: 'International Law Policy Review Organizational Management',
        issn: '3067-5863',
        eIssn: '3067-5871',
        frequency: 'Every Two Months',
        citeScore: 0.7,
        impactFactor: 0.5,
        coverImageUrl: 'https://c5k.com/public/backend/journal/12.png'
    },
    {
        code: 'TBFLI',
        fullName: 'Transactions on Banking, Finance, and Leadership Informatics',
        issn: '3067-5804',
        eIssn: '3067-5812',
        frequency: 'Every Two Months',
        citeScore: 0.6,
        impactFactor: 0.7,
        coverImageUrl: 'https://c5k.com/public/backend/journal/11.png'
    },
    {
        code: 'PMSRI',
        fullName: 'Progress on Multidisciplinary Scientific Research and Innovation',
        issn: '3067-5758',
        eIssn: '3067-5774',
        frequency: 'Every Two Months',
        citeScore: 0.4,
        impactFactor: 0.6,
        coverImageUrl: 'https://c5k.com/public/backend/journal/10.png'
    },
    {
        code: 'JSAE',
        fullName: 'Journal of Sustainable Agricultural Economics',
        issn: '3067-5618',
        eIssn: '3067-5626',
        frequency: 'Every Two Months',
        citeScore: 0.5,
        impactFactor: 0.8,
        coverImageUrl: 'https://c5k.com/public/backend/journal/6.png'
    },
    {
        code: 'AMLID',
        fullName: 'Advances in Machine Learning, IoT and Data Security',
        issn: '3067-5529',
        eIssn: '3067-5545',
        frequency: 'Every Two Months',
        citeScore: 0.5,
        impactFactor: 0.3,
        coverImageUrl: 'https://c5k.com/public/backend/journal/5.png'
    },
    {
        code: 'OJBEM',
        fullName: 'Open Journal of Business Entrepreneurship and Marketing',
        issn: '3067-5650',
        eIssn: '3067-5669',
        frequency: 'Every Two Months',
        citeScore: 0.3,
        impactFactor: 0.5,
        coverImageUrl: 'https://c5k.com/public/backend/journal/4.png'
    },
    {
        code: 'PRAIHI',
        fullName: 'Periodic Reviews on Artificial Intelligence in Health Informatics',
        issn: '3067-5723',
        eIssn: '3067-5731',
        frequency: 'Every Two Months',
        citeScore: 0.6,
        impactFactor: 0.7,
        coverImageUrl: 'https://c5k.com/public/backend/journal/3.png'
    },
    {
        code: 'JBVADA',
        fullName: 'Journal of Business Venturing, AI and Data Analytics',
        issn: '3067-5987',
        eIssn: '3067-6010',
        frequency: 'Three Times a Year',
        citeScore: 0.5,
        impactFactor: 0.6,
        coverImageUrl: 'https://c5k.com/public/backend/journal/2.png'
    },
    {
        code: 'JAMSAI',
        fullName: 'Journal of Advances in Medical Sciences and Artificial Intelligence',
        issn: '3067-591X',
        eIssn: '3067-5936',
        frequency: 'Three Times a Year',
        citeScore: 0.5,
        impactFactor: 0.8,
        coverImageUrl: 'https://c5k.com/public/backend/journal/14.png'
    },
    {
        code: 'AESI',
        fullName: 'Advances in Engineering and Science Informatics',
        issn: '3067-5421',
        eIssn: '3067-5413',
        frequency: 'Every Two Months',
        citeScore: 0.4,
        impactFactor: 0.7,
        coverImageUrl: 'https://c5k.com/public/backend/journal/15.png'
    }
];

async function main() {
    console.log('Starting migration of C5K journals with images...');

    for (const journal of journals) {
        const existing = await prisma.journal.findUnique({
            where: { code: journal.code }
        });

        if (existing) {
            console.log(`Updating ${journal.code}...`);
            await prisma.journal.update({
                where: { code: journal.code },
                data: {
                    coverImageUrl: journal.coverImageUrl,
                    // Update other fields to keep in sync if needed
                    issn: journal.issn,
                    eIssn: journal.eIssn,
                    citeScore: journal.citeScore,
                    impactFactor: journal.impactFactor,
                    frequency: journal.frequency
                }
            });
        } else {
            console.log(`Creating ${journal.code}...`);
            await prisma.journal.create({
                data: {
                    code: journal.code,
                    fullName: journal.fullName,
                    shortName: journal.code,
                    description: `${journal.fullName} is a peer-reviewed journal publishing high-quality research.`,
                    issn: journal.issn,
                    eIssn: journal.eIssn,
                    frequency: journal.frequency,
                    citeScore: journal.citeScore,
                    impactFactor: journal.impactFactor,
                    coverImageUrl: journal.coverImageUrl,
                    themeColor: "#006d77", // Default brand color
                    isActive: true
                }
            });
        }
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
