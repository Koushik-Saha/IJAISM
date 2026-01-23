import { render, screen } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card', () => {
    it('renders children correctly', () => {
        render(<Card>Test Content</Card>);
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<Card className="custom-class">Content</Card>);
        // Card component wraps children in a div with "card" class
        expect(container.firstChild).toHaveClass('custom-class');
        expect(container.firstChild).toHaveClass('card');
    });

    it('applies hover effect by default', () => {
        const { container } = render(<Card>Content</Card>);
        expect(container.firstChild).toHaveClass('hover:scale-[1.02]');
    });

    it('disables hover effect when prop is false', () => {
        const { container } = render(<Card hover={false}>Content</Card>);
        expect(container.firstChild).not.toHaveClass('hover:scale-[1.02]');
    });
});
