import { EMAIL_CONFIG } from './client';

// Base email layout
function emailLayout(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EMAIL_CONFIG.appName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      color: #374151;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 8px 0 0 0;
      color: #e0e7ff;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .content h2 {
      color: #1e40af;
      margin-top: 0;
      font-size: 24px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #f59e0b;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #1e40af;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box h3 {
      margin: 0 0 10px 0;
      color: #1e40af;
      font-size: 16px;
    }
    .info-row {
      margin: 8px 0;
      font-size: 14px;
    }
    .info-label {
      font-weight: 600;
      color: #4b5563;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #1e40af;
      text-decoration: none;
    }
    .preheader {
      display: none;
      max-height: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>IJAISM</h1>
      <p>International Journal of Advanced Information Systems</p>
    </div>
    ${content}
    <div class="footer">
      <p>
        <strong>${EMAIL_CONFIG.appName}</strong><br>
        Advancing Knowledge and Innovation<br>
        <a href="${EMAIL_CONFIG.appUrl}">Visit Website</a> •
        <a href="${EMAIL_CONFIG.appUrl}/contact">Contact Support</a>
      </p>
      <p style="margin-top: 20px; color: #9ca3af;">
        This email was sent to you as a member of IJAISM.<br>
        If you have any questions, please contact us at ${EMAIL_CONFIG.replyTo}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 1. Welcome Email (New User Registration)
export function welcomeEmail(userName: string, userEmail: string): string {
  const content = `
    <div class="content">
      <h2>Welcome to IJAISM! 🎓</h2>
      <p>Dear ${userName},</p>
      <p>
        Thank you for joining the International Journal of Advanced Information Systems and Management (IJAISM).
        We're thrilled to have you as part of our global community of researchers, academics, and professionals.
      </p>

      <div class="info-box">
        <h3>Get Started with IJAISM</h3>
        <div class="info-row">✓ Submit your research articles for peer review</div>
        <div class="info-row">✓ Access thousands of published papers</div>
        <div class="info-row">✓ Join conferences and academic events</div>
        <div class="info-row">✓ Connect with researchers worldwide</div>
      </div>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/dashboard" class="button">Go to Your Dashboard</a>
      </p>

      <p>
        Ready to submit your first article? Visit our
        <a href="${EMAIL_CONFIG.appUrl}/submit">submission page</a> or check out our
        <a href="${EMAIL_CONFIG.appUrl}/author-guidelines">author guidelines</a> to get started.
      </p>

      <p>
        If you have any questions, our support team is here to help at
        <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a>.
      </p>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Welcome to IJAISM, ${userName}!`);
}

// 2. Article Submission Confirmation
export function articleSubmissionEmail(
  userName: string,
  articleTitle: string,
  journalName: string,
  submissionId: string,
  submissionDate: string
): string {
  const content = `
    <div class="content">
      <h2>Article Submission Received ✅</h2>
      <p>Dear ${userName},</p>
      <p>
        Thank you for submitting your article to <strong>${journalName}</strong>.
        We have successfully received your submission and it is now being processed.
      </p>

      <div class="info-box">
        <h3>Submission Details</h3>
        <div class="info-row">
          <span class="info-label">Article Title:</span> ${articleTitle}
        </div>
        <div class="info-row">
          <span class="info-label">Journal:</span> ${journalName}
        </div>
        <div class="info-row">
          <span class="info-label">Submission ID:</span> ${submissionId}
        </div>
        <div class="info-row">
          <span class="info-label">Submission Date:</span> ${submissionDate}
        </div>
      </div>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/dashboard/submissions/${submissionId}" class="button">View Submission Status</a>
      </p>

      <h3>What Happens Next?</h3>
      <ol>
        <li><strong>Initial Review</strong> - Our editorial team will review your submission (1-2 business days)</li>
        <li><strong>Peer Review</strong> - Your article will be assigned to expert reviewers (2-4 weeks)</li>
        <li><strong>Decision</strong> - You'll receive feedback and a publication decision</li>
      </ol>

      <p>
        You can track your submission status anytime in your
        <a href="${EMAIL_CONFIG.appUrl}/dashboard/submissions">dashboard</a>.
        We'll send you email updates as your article progresses through the review process.
      </p>

      <p>Best regards,<br><strong>The IJAISM Editorial Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Submission received: ${articleTitle}`);
}

// 3. Membership Activation Email
export function membershipActivationEmail(
  userName: string,
  tier: string,
  endDate: string,
  subscriptionId: string
): string {
  const tierBenefits: Record<string, string[]> = {
    basic: [
      'Submit up to 5 papers per year',
      'Priority paper review',
      'Author certification badge',
      'Email notifications',
    ],
    premium: [
      'Unlimited paper submissions',
      'Enhanced author dashboard',
      'Submission analytics & insights',
      'Early access to new features',
      'Priority email support',
      'Featured author profile',
      '20% conference discounts',
    ],
    institutional: [
      'All Premium features',
      'Multiple user accounts (up to 50)',
      'Institutional branding',
      'Dedicated account manager',
      'Custom reporting & analytics',
      'API access',
      'Priority 24/7 support',
    ],
  };

  const benefits = tierBenefits[tier.toLowerCase()] || [];
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

  const content = `
    <div class="content">
      <h2>Membership Activated! 🎉</h2>
      <p>Dear ${userName},</p>
      <p>
        Congratulations! Your <strong>${tierName} Membership</strong> has been successfully activated.
        You now have full access to all IJAISM benefits.
      </p>

      <div class="info-box">
        <h3>Membership Details</h3>
        <div class="info-row">
          <span class="info-label">Plan:</span> ${tierName} Membership
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span> Active
        </div>
        <div class="info-row">
          <span class="info-label">Valid Until:</span> ${endDate}
        </div>
        <div class="info-row">
          <span class="info-label">Subscription ID:</span> ${subscriptionId}
        </div>
      </div>

      <h3>Your ${tierName} Benefits</h3>
      <ul>
        ${benefits.map(benefit => `<li>${benefit}</li>`).join('')}
      </ul>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/dashboard" class="button">Access Your Dashboard</a>
      </p>

      <p>
        Ready to submit your research? Visit your
        <a href="${EMAIL_CONFIG.appUrl}/submit">submission page</a> to get started.
      </p>

      <p>
        To manage your subscription or view billing history, visit your
        <a href="${EMAIL_CONFIG.appUrl}/dashboard">account settings</a>.
      </p>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Your ${tierName} membership is now active!`);
}

// 4. Payment Receipt Email
export function paymentReceiptEmail(
  userName: string,
  tier: string,
  amount: number,
  paymentDate: string,
  invoiceUrl?: string
): string {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;

  const content = `
    <div class="content">
      <h2>Payment Receipt 💳</h2>
      <p>Dear ${userName},</p>
      <p>
        Thank you for your payment. This email confirms that we have successfully processed
        your subscription payment for IJAISM ${tierName} Membership.
      </p>

      <div class="info-box">
        <h3>Payment Details</h3>
        <div class="info-row">
          <span class="info-label">Description:</span> ${tierName} Membership - Annual Subscription
        </div>
        <div class="info-row">
          <span class="info-label">Amount Paid:</span> ${formattedAmount} USD
        </div>
        <div class="info-row">
          <span class="info-label">Payment Date:</span> ${paymentDate}
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span> Card
        </div>
      </div>

      ${invoiceUrl ? `
      <p>
        <a href="${invoiceUrl}" class="button">Download Invoice</a>
      </p>
      ` : ''}

      <p>
        This receipt is for your records. Your membership is now active and will renew automatically
        in one year unless you choose to cancel.
      </p>

      <p>
        If you have any questions about this payment or need assistance, please contact our
        billing support at <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a>.
      </p>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Payment receipt for ${tierName} membership`);
}

// 5. Article Status Update Email
export function articleStatusUpdateEmail(
  userName: string,
  articleTitle: string,
  oldStatus: string,
  newStatus: string,
  submissionId: string,
  message?: string,
  doi?: string
): string {
  const statusMessages: Record<string, { emoji: string; text: string }> = {
    'under review': {
      emoji: '🔍',
      text: 'Your article is now under peer review. Our expert reviewers are carefully evaluating your work.',
    },
    'accepted': {
      emoji: '✅',
      text: 'Congratulations! Your article has been accepted for publication.',
    },
    'rejected': {
      emoji: '❌',
      text: 'After careful review, we regret to inform you that your article was not accepted for publication.',
    },
    'revision_requested': {
      emoji: '📝',
      text: 'The reviewers have requested revisions to your article. Please review their comments and resubmit.',
    },
    'published': {
      emoji: '🎉',
      text: 'Your article has been published and is now available online!',
    },
  };

  // Handle case variance (e.g. revision_requested vs revision requested)
  const normalizedStatus = newStatus.toLowerCase().replace('_', ' ');
  const statusInfo = statusMessages[newStatus.toLowerCase()] || statusMessages[normalizedStatus] || {
    emoji: '📄',
    text: `Your article status has been updated to: ${newStatus}`
  };

  const content = `
    <div class="content">
      <h2>Article Status Update ${statusInfo.emoji}</h2>
      <p>Dear ${userName},</p>
      <p>
        We have an update regarding your submission: <strong>${articleTitle}</strong>
      </p>

      <div class="info-box">
        <h3>Status Change</h3>
        <div class="info-row">
          <span class="info-label">Previous Status:</span> ${oldStatus}
        </div>
        <div class="info-row">
          <span class="info-label">New Status:</span> <strong>${newStatus.replace('_', ' ')}</strong>
        </div>
        ${doi ? `
        <div class="info-row">
          <span class="info-label">DOI:</span> ${doi}
        </div>
        ` : ''}
      </div>

      <p>${statusInfo.text}</p>

      ${message ? `
      <div class="info-box">
        <h3>Additional Information</h3>
        <p>${message}</p>
      </div>
      ` : ''}

      ${doi ? `
      <p>
        <a href="${EMAIL_CONFIG.appUrl}/articles/${submissionId}" class="button">View Published Article</a>
      </p>
      ` : `
      <p>
        <a href="${EMAIL_CONFIG.appUrl}/dashboard/submissions/${submissionId}" class="button">View Submission Details</a>
      </p>
      `}

      <p>Best regards,<br><strong>The IJAISM Editorial Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Status update: ${articleTitle}`);
}

// ... (existing code for paymentFailedEmail, etc.)

// 12. Review Submission Confirmation Email
export function reviewSubmissionConfirmationEmail(
  reviewerName: string,
  articleTitle: string,
  journalName: string
): string {
  const content = `
    <div class="content">
      <h2>Review Submitted Successfully ✅</h2>
      <p>Dear ${reviewerName},</p>
      <p>
        Thank you for submitting your review for the article: <strong>${articleTitle}</strong>.
      </p>
      
      <p>
        We greatly appreciate the time and expertise you have dedicated to evaluating this work. 
        Your contribution helps maintain the high standards of <strong>${journalName}</strong>.
      </p>

      <div class="info-box">
        <h3>What Happens Next?</h3>
        <p>
          The editor will review your comments along with those from other reviewers to make a final decision. 
          You will be notified once a decision has been made on the manuscript.
        </p>
      </div>

      <p>
        You can view your completed reviews in your dashboard at any time.
      </p>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/dashboard/reviews" class="button">Go to Dashboard</a>
      </p>

      <p>Best regards,<br><strong>The IJAISM Editorial Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Review Confirmation: ${articleTitle}`);
}

// 6. Payment Failed Email
export function paymentFailedEmail(
  userName: string,
  tier: string,
  reason?: string
): string {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

  const content = `
    <div class="content">
      <h2>Payment Failed ⚠️</h2>
      <p>Dear ${userName},</p>
      <p>
        We were unable to process your recent payment for your <strong>${tierName} Membership</strong> subscription.
      </p>

      ${reason ? `
      <div class="info-box">
        <h3>Reason</h3>
        <p>${reason}</p>
      </div>
      ` : ''}

      <h3>What You Should Do</h3>
      <ol>
        <li>Check that your payment method has sufficient funds</li>
        <li>Verify your card details are up to date</li>
        <li>Update your payment information in your account settings</li>
      </ol>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/membership" class="button">Update Payment Method</a>
      </p>

      <p>
        Your membership will remain active for a short grace period while you update your payment information.
        Please act quickly to avoid any interruption in service.
      </p>

      <p>
        If you need assistance, please contact our support team at
        <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a>.
      </p>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Action required: Payment failed for ${tierName} membership`);
}

// 7. Email Verification Email
export function emailVerificationEmail(
  userName: string,
  verificationUrl: string
): string {
  const content = `
    <div class="content">
      <h2>Verify Your Email Address 📧</h2>
      <p>Dear ${userName},</p>
      <p>
        Thank you for registering with IJAISM! To complete your registration and ensure
        you receive important updates about your submissions and account, please verify
        your email address.
      </p>

      <p>
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>

      <p>
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #1e40af; word-break: break-all;">${verificationUrl}</a>
      </p>

      <div class="info-box">
        <h3>Why verify your email?</h3>
        <ul>
          <li>Receive important notifications about your article submissions</li>
          <li>Get updates on review status and publication decisions</li>
          <li>Reset your password if needed</li>
          <li>Access all platform features</li>
        </ul>
      </div>

      <p>
        <strong>This verification link will expire in 24 hours.</strong>
        If you didn't create an account with IJAISM, you can safely ignore this email.
      </p>

      <p>
        If the button doesn't work, you can also verify by visiting:
        <a href="${EMAIL_CONFIG.appUrl}/verify-email">${EMAIL_CONFIG.appUrl}/verify-email</a>
        and entering the verification code from this email.
      </p>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Verify your email address to complete registration`);
}

// 8. Email Verification Confirmation Email
export function emailVerificationConfirmationEmail(
  userName: string
): string {
  const content = `
    <div class="content">
      <h2>Email Verified Successfully! ✅</h2>
      <p>Dear ${userName},</p>
      <p>
        Congratulations! Your email address has been successfully verified.
        Your IJAISM account is now fully activated.
      </p>

      <div class="info-box">
        <h3>What's Next?</h3>
        <ul>
          <li>Submit your research articles for peer review</li>
          <li>Access thousands of published papers</li>
          <li>Join conferences and academic events</li>
          <li>Connect with researchers worldwide</li>
        </ul>
      </div>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/dashboard" class="button">Go to Your Dashboard</a>
      </p>

      <p>
        Ready to submit your first article? Visit our
        <a href="${EMAIL_CONFIG.appUrl}/submit">submission page</a> to get started.
      </p>

      <p>
        If you have any questions, our support team is here to help at
        <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a>.
      </p>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Your email has been verified successfully!`);
}

// 9. Password Reset Email
export function passwordResetEmail(
  userName: string,
  resetUrl: string
): string {
  const content = `
    <div class="content">
      <h2>Reset Your Password 🔒</h2>
      <p>Dear ${userName},</p>
      <p>
        We received a request to reset the password for your IJAISM account.
        If you made this request, please click the button below to choose a new password.
      </p>

      <p>
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>

      <p>
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #1e40af; word-break: break-all;">${resetUrl}</a>
      </p>

      <div class="info-box">
        <h3>Security Notice</h3>
        <ul>
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this reset, you can safely ignore this email</li>
          <li>Your password will not change unless you click the link above</li>
        </ul>
      </div>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Reset your password for ${EMAIL_CONFIG.appName}`);
}

// 10. Password Reset Confirmation Email
export function passwordResetConfirmationEmail(
  userName: string
): string {
  const content = `
    <div class="content">
      <h2>Password Changed Successfully ✅</h2>
      <p>Dear ${userName},</p>
      <p>
        Your password has been successfully changed. You can now log in to your IJAISM account with your new password.
      </p>

      <div class="info-box">
        <h3>Account Security</h3>
        <p>
          If you did not make this change, please contact our support team immediately at
          <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a>
        </p>
      </div>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/login" class="button">Log In to Your Account</a>
      </p>

      <p>Best regards,<br><strong>The IJAISM Team</strong></p>
    </div>
  `;

  return emailLayout(content, `Your password has been changed successfully`);
}

// 11. Reviewer Assignment Email
export function reviewerAssignmentEmail(
  reviewerName: string,
  articleTitle: string,
  journalName: string,
  dueDate: string,
  reviewId: string
): string {
  const content = `
    <div class="content">
      <h2>New Review Assignment 📝</h2>
      <p>Dear ${reviewerName},</p>
      <p>
        You have been selected to review a new article submission for <strong>${journalName}</strong>.
        Your expertise would be invaluable in evaluating this work.
      </p>

      <div class="info-box">
        <h3>Assignment Details</h3>
        <div class="info-row">
          <span class="info-label">Article:</span> ${articleTitle}
        </div>
        <div class="info-row">
          <span class="info-label">Journal:</span> ${journalName}
        </div>
        <div class="info-row">
          <span class="info-label">Due Date:</span> ${dueDate}
        </div>
      </div>

      <p>
        Please log in to your dashboard to view the full manuscript and submit your review.
      </p>

      <p>
        <a href="${EMAIL_CONFIG.appUrl}/dashboard/reviews/${reviewId}" class="button">View Assignment</a>
      </p>

      <h3>Review Guidelines</h3>
      <ul>
        <li>Evaluate scientific/academic rigor</li>
        <li>Check for clarity and structure</li>
        <li>Provide constructive feedback</li>
        <li>Maintain confidentiality</li>
      </ul>

      <p>
        If you are unable to accept this assignment, please contact the editor immediately.
      </p>

      <p>Best regards,<br><strong>The IJAISM Editorial Team</strong></p>
    </div>
  `;

  return emailLayout(content, `New Review Assignment: ${articleTitle}`);
}
