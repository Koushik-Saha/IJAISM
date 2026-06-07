
import {
    sendWelcomeEmail,
    sendArticleSubmissionEmail
} from '@/lib/email/send';
import { getBrevoClient, EMAIL_CONFIG } from '@/lib/email/client';

// Mock dependencies
jest.mock('@/lib/email/client', () => ({
    getBrevoClient: jest.fn(),
    EMAIL_CONFIG: {
        from: 'test@example.com',
        fromName: 'Test App',
        replyTo: 'support@example.com',
        appName: 'Test App',
        appUrl: 'http://localhost:3000',
    }
}));

jest.mock('@/lib/email/templates', () => ({
    welcomeEmail: jest.fn().mockReturnValue('<html>Welcome</html>'),
    articleSubmissionEmail: jest.fn().mockReturnValue('<html>Submission Received</html>'),
}));

describe('Email Service', () => {
    const mockSendTransacEmail = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Transport Selection', () => {
        it('should use Brevo if client is available', async () => {
            (getBrevoClient as jest.Mock).mockReturnValue({
                transactionalEmails: { sendTransacEmail: mockSendTransacEmail }
            });
            mockSendTransacEmail.mockResolvedValue({ messageId: 'brevo-123' });

            const result = await sendWelcomeEmail('user@test.com', 'User');

            expect(getBrevoClient).toHaveBeenCalled();
            expect(mockSendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: [{ email: 'user@test.com' }],
            }));
            expect(result.success).toBe(true);
        });

        it('should fallback to dev mode if Brevo unavailable', async () => {
            (getBrevoClient as jest.Mock).mockReturnValue(null);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = await sendWelcomeEmail('user@test.com', 'User');

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('dev-mode-no-send');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No email provider configured'));
            consoleSpy.mockRestore();
        });
    });

    describe('Function Wrappers', () => {
        it('sendArticleSubmissionEmail passes correct data', async () => {
            (getBrevoClient as jest.Mock).mockReturnValue(null);

            const result = await sendArticleSubmissionEmail(
                'author@test.com',
                'Author',
                'My Paper',
                'Journal of Tests',
                'sub-123',
                new Date()
            );

            expect(result.success).toBe(true);
        });
    });
});
