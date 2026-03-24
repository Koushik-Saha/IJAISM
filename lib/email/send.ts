import { getResendClient, EMAIL_CONFIG } from './client';
import * as templates from './templates';

// Email sending result type
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Base email sending function
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    // 1. Try Resend
    const resend = getResendClient();

    if (resend) {
      const result = await resend.emails.send({
        from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
        to,
        subject,
        html,
        replyTo: EMAIL_CONFIG.replyTo,
      });

      if (result.error) {
        console.error('[EMAIL] Failed to send email (Resend):', result.error);
        return { success: false, error: result.error.message };
      }

      console.log(`[EMAIL] Sent (Resend) successfully to ${to}: ${subject} (ID: ${result.data?.id})`);
      return { success: true, messageId: result.data?.id };
    }

    // 2. Dev Mode (No provider)
    console.warn(`[EMAIL] Would send to ${to}: ${subject}`);
    console.warn('[EMAIL] No email provider configured. Set RESEND_API_KEY.');
    return { success: true, messageId: 'dev-mode-no-send' };

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
  message?: string,
  doi?: string
): Promise<EmailResult> {
  const html = templates.articleStatusUpdateEmail(
    userName,
    articleTitle,
    oldStatus,
    newStatus,
    submissionId,
    message,
    doi
  );

  return sendEmail(
    userEmail,
    `Article Status Update: ${articleTitle}`,
    html
  );
}

// ... (existing code)

// 12. Send review submission confirmation
export async function sendReviewSubmissionConfirmationEmail(
  reviewerEmail: string,
  reviewerName: string,
  articleTitle: string,
  journalName: string
): Promise<EmailResult> {
  const html = templates.reviewSubmissionConfirmationEmail(
    reviewerName,
    articleTitle,
    journalName
  );

  return sendEmail(
    reviewerEmail,
    `Review Received: ${articleTitle}`,
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

// 7. Send password reset email (forgot password)
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `${EMAIL_CONFIG.appUrl}/reset-password?token=${resetToken}`;
  const html = templates.passwordResetEmail(userName, resetUrl);

  return sendEmail(
    userEmail,
    `Reset Your Password - ${EMAIL_CONFIG.appName}`,
    html
  );
}

// 8. Send password reset confirmation email (after reset success)
export async function sendPasswordResetConfirmationEmail(
  userEmail: string,
  userName: string
): Promise<EmailResult> {
  const html = templates.passwordResetConfirmationEmail(userName);

  return sendEmail(
    userEmail,
    `Password Changed Successfully - ${EMAIL_CONFIG.appName}`,
    html
  );
}

// 9. Send email verification email
export async function sendEmailVerificationEmail(
  userEmail: string,
  userName: string,
  verificationToken: string
): Promise<EmailResult> {
  const verificationUrl = `${EMAIL_CONFIG.appUrl}/verify-email?token=${verificationToken}`;
  const html = templates.emailVerificationEmail(userName, verificationUrl);

  return sendEmail(
    userEmail,
    `Verify your email address - ${EMAIL_CONFIG.appName}`,
    html
  );
}

// 10. Send email verification confirmation email
export async function sendEmailVerificationConfirmationEmail(
  userEmail: string,
  userName: string
): Promise<EmailResult> {
  const html = templates.emailVerificationConfirmationEmail(userName);

  return sendEmail(
    userEmail,
    `Email verified successfully - ${EMAIL_CONFIG.appName}`,
    html
  );
}

export async function sendReviewerAssignmentEmail(
  reviewerEmail: string,
  reviewerName: string,
  articleTitle: string,
  articleAbstract: string,
  journalName: string,
  dueDate: Date,
  reviewId: string
): Promise<EmailResult> {
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = templates.reviewerAssignmentEmail(
    reviewerName,
    articleTitle,
    articleAbstract,
    journalName,
    formattedDueDate,
    reviewId
  );

  return sendEmail(
    reviewerEmail,
    `New Review Assignment - ${EMAIL_CONFIG.appName}`,
    html
  );
}

// 13. Send Review Feedback to Author
export async function sendReviewFeedbackToAuthor(
  authorEmail: string,
  authorName: string,
  articleTitle: string,
  journalName: string,
  decision: string,
  comments: string
): Promise<EmailResult> {
  const html = templates.reviewFeedbackToAuthor(
    authorName,
    articleTitle,
    journalName,
    decision,
    comments
  );

  return sendEmail(
    authorEmail,
    `Review Feedback: ${articleTitle}`,
    html
  );
}

// 14. Send Review Feedback to Editor
export async function sendReviewFeedbackToEditor(
  editorEmail: string,
  editorName: string,
  reviewerName: string,
  articleTitle: string,
  journalName: string,
  decision: string,
  commentsToAuthor: string,
  commentsToEditor: string
): Promise<EmailResult> {
  const html = templates.reviewFeedbackToEditor(
    editorName,
    reviewerName,
    articleTitle,
    journalName,
    decision,
    commentsToAuthor,
    commentsToEditor
  );

  return sendEmail(
    editorEmail,
    `New Review from ${reviewerName}: ${articleTitle}`,
    html
  );
}

// 15. Send Reviewer Invitation Email
export async function sendReviewerInvitationEmail(
  email: string,
  name: string,
  articleTitle: string,
  articleAbstract: string,
  journalName: string,
  reviewId: string
): Promise<EmailResult> {
  const html = templates.reviewerInvitationEmail(
    name,
    articleTitle,
    articleAbstract,
    journalName,
    reviewId
  );

  return sendEmail(
    email,
    `Invitation to Review: ${articleTitle}`,
    html
  );
}
// 16. Send Co-Author Notification
export async function sendCoAuthorNotification(
  coAuthorEmail: string,
  coAuthorName: string,
  primaryAuthorName: string,
  articleTitle: string,
  journalName: string,
  submissionId: string,
  submissionDate: Date
): Promise<EmailResult> {
  const formattedDate = submissionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = templates.coAuthorNotificationEmail(
    coAuthorName,
    primaryAuthorName,
    articleTitle,
    journalName,
    submissionId,
    formattedDate
  );

  return sendEmail(
    coAuthorEmail,
    `You are listed as a Co-Author: ${articleTitle}`,
    html
  );
}

// 17. Send General Payment Success Email
export async function sendPaymentSuccessEmail(
  to: string,
  subject: string,
  description: string,
  amount: string | number
): Promise<EmailResult> {
  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Payment Successful</h1>
        <p>Thank you for your purchase.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Item:</strong> ${description}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount}</p>
        </div>
        <p>Your access has been granted immediately. You can view your purchase in your dashboard.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
        <p style="color: #6B7280; font-size: 12px;">${EMAIL_CONFIG.appName}</p>
      </div>
    `;
  return sendEmail(to, subject, html);
}

// 18. Send Reviewer Temporary Password Email
export async function sendReviewerTempPasswordEmail(
  email: string,
  name: string,
  articleTitle: string,
  articleAbstract: string,
  journalName: string,
  tempPassword: string,
  reviewId: string
): Promise<EmailResult> {
  const html = templates.reviewerTempPasswordEmail(
    name,
    email,
    articleTitle,
    articleAbstract,
    journalName,
    tempPassword,
    reviewId
  );

  return sendEmail(
    email,
    `Invitation to Review & Account Credentials: ${articleTitle}`,
    html
  );
}

// 19. Send Reviewer Response Notification to Editor
export async function sendReviewerResponseNotification(
  editorEmail: string,
  editorName: string,
  reviewerName: string,
  articleTitle: string,
  journalName: string,
  decision: 'accepted' | 'declined',
  articleId: string
): Promise<EmailResult> {
  const articleLink = `${EMAIL_CONFIG.appUrl}/editor/articles/${articleId}`;

  const html = templates.reviewerResponseNotificationEmail(
    editorName,
    reviewerName,
    articleTitle,
    journalName,
    decision,
    articleLink
  );

  return sendEmail(
    editorEmail,
    `Reviewer ${decision.toUpperCase()}: ${articleTitle}`,
    html
  );
}
