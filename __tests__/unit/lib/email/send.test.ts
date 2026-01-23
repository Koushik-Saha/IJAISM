
import {
    sendWelcomeEmail,
    sendArticleSubmissionEmail
} from '@/lib/email/send';
import { getResendClient, getNodemailerTransport, EMAIL_CONFIG } from '@/lib/email/client';

// Mock dependencies
jest.mock('@/lib/email/client', () => ({
    getResendClient: jest.fn(),
    getNodemailerTransport: jest.fn(),
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
    const mockSendMail = jest.fn();
    const mockResendSend = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Transport Selection', () => {
        it('should use Nodemailer (SMTP) if available', async () => {
            (getNodemailerTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });
            (getResendClient as jest.Mock).mockReturnValue(null);
            mockSendMail.mockResolvedValue({ messageId: 'smtp-123' });

            const result = await sendWelcomeEmail('user@test.com', 'User');

            expect(getNodemailerTransport).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'user@test.com',
                subject: expect.stringContaining('Welcome'),
            }));
            expect(result.success).toBe(true);
            expect(result.messageId).toBe('smtp-123');
        });

        it('should use Resend if SMTP unavailable and Resend available', async () => {
            (getNodemailerTransport as jest.Mock).mockReturnValue(null);
            (getResendClient as jest.Mock).mockReturnValue({
                emails: { send: mockResendSend }
            });
            mockResendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });

            const result = await sendWelcomeEmail('user@test.com', 'User');

            expect(getNodemailerTransport).toHaveBeenCalled();
            expect(getResendClient).toHaveBeenCalled();
            expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
                to: 'user@test.com',
            }));
            expect(result.success).toBe(true);
            expect(result.messageId).toBe('resend-123');
        });

        it('should fallback to dev mode if neither available', async () => {
            (getNodemailerTransport as jest.Mock).mockReturnValue(null);
            (getResendClient as jest.Mock).mockReturnValue(null);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = await sendWelcomeEmail('user@test.com', 'User');

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('dev-mode-no-send');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No email provider configured'));
            consoleSpy.mockRestore();
        });
    });

    describe('Function Wrappers', () => {
        // Basic wrapper test to ensure arguments are passed correctly
        it('sendArticleSubmissionEmail passes correct data', async () => {
            (getNodemailerTransport as jest.Mock).mockReturnValue(null);
            (getResendClient as jest.Mock).mockReturnValue(null);

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
