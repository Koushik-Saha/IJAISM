import { getResendClient, getNodemailerTransport, EMAIL_CONFIG } from './client';
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
    // 1. Try SMTP (Nodemailer)
    const transporter = getNodemailerTransport();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
          to,
          subject,
          html,
          replyTo: EMAIL_CONFIG.replyTo,
        });

        console.log(`[EMAIL] Sent (SMTP) successfully to ${to}: ${subject} (ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (smtpError: any) {
        console.error('[EMAIL] SMTP Send Error:', smtpError);
        // Fallback to Resend or return error?
        // Let's return error to avoid confused fallback if SMTP was intended but failed credentials
        return { success: false, error: smtpError.message };
      }
    }

    // 2. Try Resend
    const resend = getResendClient();

    if (resend) {
      const result = await resend.emails.send({
        from: EMAIL_CONFIG.from,
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

    // 3. Dev Mode (No provider)
    console.warn(`[EMAIL] Would send to ${to}: ${subject}`);
    console.warn('[EMAIL] No email provider configured (SMTP or Resend). Set SMTP_* or RESEND_API_KEY.');
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

// 11. Send reviewer assignment email
export async function sendReviewerAssignmentEmail(
  reviewerEmail: string,
  reviewerName: string,
  articleTitle: string,
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
  journalName: string,
  tokenOrType: string
): Promise<EmailResult> {
  let inviteLink;

  if (tokenOrType === 'EXISTING_USER_LOGIN') {
    inviteLink = `${EMAIL_CONFIG.appUrl}/login?redirect=/dashboard/reviews`;
  } else {
    inviteLink = `${EMAIL_CONFIG.appUrl}/register?invitation=${tokenOrType}`;
  }

  const html = templates.reviewerInvitationEmail(
    name,
    articleTitle,
    journalName,
    inviteLink
  );

  return sendEmail(
    email,
    `Invitation to Review: ${articleTitle}`,
    html
  );
}
