import { render, screen, waitFor } from '@testing-library/react';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter } from 'next/navigation';

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('RoleGuard', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        // Clear localStorage mock
        Storage.prototype.getItem = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('redirects to login if no token found', async () => {
        render(
            <RoleGuard allowedRoles={['admin']}>
                <div>Protected Content</div>
            </RoleGuard>
        );

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to dashboard if user has wrong role', async () => {
        const user = { role: 'author' };
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify(user);
            return null;
        });

        render(
            <RoleGuard allowedRoles={['admin']}>
                <div>Protected Content</div>
            </RoleGuard>
        );

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('renders children if user has allowed role', async () => {
        const user = { role: 'admin' };
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify(user);
            return null;
        });

        render(
            <RoleGuard allowedRoles={['admin']}>
                <div>Protected Content</div>
            </RoleGuard>
        );

        expect(await screen.findByText('Protected Content')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
    });
});
