/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        announcement: { findMany: jest.fn() },
        journal: { findMany: jest.fn(), count: jest.fn() },
        article: { findMany: jest.fn(), count: jest.fn() },
        user: { count: jest.fn() },
    },
}));

// Mock Child Components to simplify test
jest.mock('@/components/ui/Card', () => ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>);

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
}));

describe('HomePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with data', async () => {
        // Setup Mocks
        (prisma.announcement.findMany as jest.Mock).mockResolvedValue([
            { id: '1', title: 'Start of Semantic Web', excerpt: 'News', thumbnailUrl: null },
        ]);
        (prisma.journal.findMany as jest.Mock).mockResolvedValue([
            { id: 'j1', code: 'JITMB', fullName: 'Journal of IT', coverImageUrl: null },
        ]);
        (prisma.article.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'a1',
                title: 'New AI Algo',
                abstract: 'Abstract here',
                journal: { code: 'JITMB' },
                author: { name: 'Dr. Smith' },
                publicationDate: new Date('2023-01-01')
            },
        ]);
        (prisma.journal.count as jest.Mock).mockResolvedValue(5);
        (prisma.article.count as jest.Mock).mockResolvedValue(100);
        (prisma.user.count as jest.Mock).mockResolvedValue(50);

        // Call async component
        const jsx = await HomePage();
        render(jsx);

        // Assertions
        expect(screen.getByText('Welcome to IJAISM Academic Publishing Platform')).toBeInTheDocument();

        // Check Data Rendering
        expect(screen.getAllByText('Start of Semantic Web')[0]).toBeInTheDocument();
        expect(screen.getAllByText('JITMB')[0]).toBeInTheDocument();
        expect(screen.getAllByText('New AI Algo')[0]).toBeInTheDocument();

        // Check Stats
        expect(screen.getByText('100+')).toBeInTheDocument(); // Articles count
    });

    it('handles empty data gracefully', async () => {
        (prisma.announcement.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.journal.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.journal.count as jest.Mock).mockResolvedValue(0);
        (prisma.article.count as jest.Mock).mockResolvedValue(0);
        (prisma.user.count as jest.Mock).mockResolvedValue(0);

        const jsx = await HomePage();
        render(jsx);

        expect(screen.getByText('No announcements available at this time.')).toBeInTheDocument();
    });
});
