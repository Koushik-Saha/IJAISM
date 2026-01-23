/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ArticleDetailPage from '@/app/articles/[id]/page';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        article: { findUnique: jest.fn() },
    },
}));

// Mock notFound
jest.mock('next/navigation', () => ({
    notFound: jest.fn(),
    useRouter: jest.fn(),
}));

// Mock Child Components
jest.mock('@/components/ui/Card', () => ({ children }: any) => <div data-testid="card">{children}</div>);
jest.mock('@/components/articles/ArticleActions', () => () => <div data-testid="article-actions" />);
jest.mock('@/components/articles/ReviewerFeedback', () => () => <div data-testid="reviewer-feedback" />);

describe('ArticleDetailPage', () => {
    const mockArticle = {
        id: '123',
        title: 'Test Article Title',
        abstract: 'This is a test abstract.',
        journal: { code: 'JITMB', fullName: 'Journal of IT' },
        author: { name: 'Author One', university: 'Uni A', affiliation: 'Dep 1' },
        coAuthors: [],
        reviews: [],
        status: 'published',
        publicationDate: new Date('2023-01-01'),
        keywords: ['AI', 'Tech'],
        createdAt: new Date(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders article details correctly', async () => {
        (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

        // Params is a Promise in Next 15+
        const params = Promise.resolve({ id: '123' });
        const jsx = await ArticleDetailPage({ params });
        render(jsx);

        expect(screen.getByRole('heading', { name: 'Test Article Title', level: 1 })).toBeInTheDocument();
        expect(screen.getByText('Author One')).toBeInTheDocument();
        expect(screen.getByText('This is a test abstract.')).toBeInTheDocument();
        expect(screen.getByTestId('article-actions')).toBeInTheDocument();
    });

    it('calls notFound when article does not exist', async () => {
        (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

        const params = Promise.resolve({ id: '999' });

        try {
            await ArticleDetailPage({ params });
        } catch (e) { }

        expect(notFound).toHaveBeenCalled();
    });
});
