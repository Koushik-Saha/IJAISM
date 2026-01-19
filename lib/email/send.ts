import { getResendClient, EMAIL_CONFIG } from './client';
import * as templates from './templates';

// Email sending result type
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Base email sending function
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    const resend = getResendClient();

    // If Resend is not configured, log warning and return success (dev mode)
    if (!resend) {
      console.warn(`[EMAIL] Would send to ${to}: ${subject}`);
      console.warn('[EMAIL] Set RESEND_API_KEY to enable email sending');
      return { success: true, messageId: 'dev-mode-no-send' };
    }

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      replyTo: EMAIL_CONFIG.replyTo,
    });

    if (result.error) {
      console.error('[EMAIL] Failed to send email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[EMAIL] Sent successfully to ${to}: ${subject} (ID: ${result.data?.id})`);
    return { success: true, messageId: result.data?.id };

  } catch (error: any) {
    console.error('[EMAIL] Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// 1. Send welcome email
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<EmailResult> {
  const html = templates.welcomeEmail(userName, userEmail);
  return sendEmail(
    userEmail,
    `Welcome to ${EMAIL_CONFIG.appName}!`,
    html
  );
}

// 2. Send article submission confirmation
export async function sendArticleSubmissionEmail(
  userEmail: string,
  userName: string,
  articleTitle: string,
  journalName: string,
  submissionId: string,
  submissionDate: Date
): Promise<EmailResult> {
  const formattedDate = submissionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = templates.articleSubmissionEmail(
    userName,
    articleTitle,
    journalName,
    submissionId,
    formattedDate
  );

  return sendEmail(
    userEmail,
    `Article Submission Received: ${articleTitle}`,
    html
  );
}

// 3. Send membership activation email
export async function sendMembershipActivationEmail(
  userEmail: string,
  userName: string,
  tier: string,
  endDate: Date,
  subscriptionId: string
): Promise<EmailResult> {
  const formattedEndDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

  const html = templates.membershipActivationEmail(
    userName,
    tier,
    formattedEndDate,
    subscriptionId
  );

  return sendEmail(
    userEmail,
    `${tierName} Membership Activated - ${EMAIL_CONFIG.appName}`,
    html
  );
}

// 4. Send payment receipt
export async function sendPaymentReceiptEmail(
  userEmail: string,
  userName: string,
  tier: string,
  amount: number,
  paymentDate: Date,
  invoiceUrl?: string
): Promise<EmailResult> {
  const formattedDate = paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = templates.paymentReceiptEmail(
    userName,
    tier,
    amount,
    formattedDate,
    invoiceUrl
  );

  return sendEmail(
    userEmail,
    `Payment Receipt - ${EMAIL_CONFIG.appName}`,
    html
  );
}

// 5. Send article status update
export async function sendArticleStatusUpdateEmail(
  userEmail: string,
  userName: string,
  articleTitle: string,
  oldStatus: string,
  newStatus: string,
  submissionId: string,
  message?: string
): Promise<EmailResult> {
  const html = templates.articleStatusUpdateEmail(
    userName,
    articleTitle,
    oldStatus,
    newStatus,
    submissionId,
    message
  );

  return sendEmail(
    userEmail,
    `Article Status Update: ${articleTitle}`,
    html
  );
}

// 6. Send payment failed notification
export async function sendPaymentFailedEmail(
  userEmail: string,
  userName: string,
  tier: string,
  reason?: string
): Promise<EmailResult> {
  const html = templates.paymentFailedEmail(userName, tier, reason);

  return sendEmail(
    userEmail,
    `Action Required: Payment Failed - ${EMAIL_CONFIG.appName}`,
    html
  );
}

// Export all email functions
export const emailService = {
  sendWelcomeEmail,
  sendArticleSubmissionEmail,
  sendMembershipActivationEmail,
  sendPaymentReceiptEmail,
  sendArticleStatusUpdateEmail,
  sendPaymentFailedEmail,
};
