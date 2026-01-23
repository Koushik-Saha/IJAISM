import { render, screen, fireEvent } from '@testing-library/react';
import SecureDownloadButton from '@/components/ui/SecureDownloadButton';
import { useRouter } from 'next/navigation';

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('SecureDownloadButton', () => {
    const mockPdfUrl = '/uploads/test.pdf';
    const mockPush = jest.fn();
    const mockWindowOpen = jest.fn();

    beforeAll(() => {
        window.open = mockWindowOpen;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        Storage.prototype.getItem = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
    });

    it('renders button with label', () => {
        render(<SecureDownloadButton pdfUrl={mockPdfUrl} label="Get PDF" />);
        expect(screen.getByRole('button', { name: 'Get PDF' })).toBeInTheDocument();
    });

    it('renders as link when variant is link', () => {
        render(<SecureDownloadButton pdfUrl={mockPdfUrl} variant="link" label="Download Link" />);
        const link = screen.getByRole('link', { name: 'Download Link' });
        expect(link).toBeInTheDocument();
    });

    it('redirects to login if no token found', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null);

        render(<SecureDownloadButton pdfUrl={mockPdfUrl} />);
        fireEvent.click(screen.getByRole('button'));

        // Check if router.push was called with correct URL
        // Note: window.location.pathname in JSDOM is usually '/' by default
        const expectedCallback = encodeURIComponent('/');
        expect(mockPush).toHaveBeenCalledWith(`/login?callbackUrl=${expectedCallback}`);
        expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('opens download link if token exists', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue('valid-token');

        render(<SecureDownloadButton pdfUrl={mockPdfUrl} />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockWindowOpen).toHaveBeenCalledWith(
            '/api/files/download/test.pdf?token=valid-token',
            '_blank'
        );
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('strips /uploads/ prefix correctly', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue('valid-token');

        render(<SecureDownloadButton pdfUrl="/uploads/folder/file.pdf" />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockWindowOpen).toHaveBeenCalledWith(
            '/api/files/download/folder/file.pdf?token=valid-token',
            '_blank'
        );
    });
});
