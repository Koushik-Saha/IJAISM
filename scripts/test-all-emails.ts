import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendEmail } from '../lib/email/send';
import * as templates from '../lib/email/templates';

const targetEmail = 'eauthentication20@gmail.com';
const dummyName = 'Test User';
const dummyTitle = 'Quantum Computations in Neural Pathways';
const dummyJournal = 'International Journal of Advanced Advanced Studies';
const dummySubId = 'sub-test-999';
const dummyDateStr = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const emailsToSend = [
  {
    name: '1. Welcome Email',
    subject: 'Welcome to C5K!',
    html: templates.welcomeEmail(dummyName, targetEmail)
  },
  {
    name: '2. Article Submission Confirmation',
    subject: `Article Submission Received: ${dummyTitle}`,
    html: templates.articleSubmissionEmail(dummyName, dummyTitle, dummyJournal, dummySubId, dummyDateStr)
  },
  {
    name: '3. Membership Activation Email',
    subject: 'Premium Membership Activated - C5K',
    html: templates.membershipActivationEmail(dummyName, 'Premium', dummyDateStr, 'sub_stripe_12345')
  },
  {
    name: '4. Payment Receipt Email',
    subject: 'Payment Receipt - C5K',
    html: templates.paymentReceiptEmail(dummyName, 'Premium', 14900, dummyDateStr, 'https://example.com/invoice.pdf')
  },
  {
    name: '5. Article Status Update Email',
    subject: `Article Status Update: ${dummyTitle}`,
    html: templates.articleStatusUpdateEmail(dummyName, dummyTitle, 'submitted', 'published', dummySubId, 'Your paper is now officially published.', '10.1234/c5k.2026.999')
  },
  {
    name: '6. Review Submission Confirmation Email',
    subject: `Review Received: ${dummyTitle}`,
    html: templates.reviewSubmissionConfirmationEmail('Dr. Reviewer', dummyTitle, dummyJournal)
  },
  {
    name: '7. Payment Failed Email',
    subject: 'Action Required: Payment Failed - C5K',
    html: templates.paymentFailedEmail(dummyName, 'Premium', 'Card declined due to insufficient funds.')
  },
  {
    name: '8. Email Verification Email',
    subject: 'Verify your email address - C5K',
    html: templates.emailVerificationEmail(dummyName, 'http://localhost:3000/verify-email?token=test-token-123')
  },
  {
    name: '9. Email Verification Confirmation Email',
    subject: 'Email verified successfully - C5K',
    html: templates.emailVerificationConfirmationEmail(dummyName)
  },
  {
    name: '10. Password Reset Email',
    subject: 'Reset Your Password - C5K',
    html: templates.passwordResetEmail(dummyName, 'http://localhost:3000/reset-password?token=test-reset-123')
  },
  {
    name: '11. Password Reset Confirmation Email',
    subject: 'Password Changed Successfully - C5K',
    html: templates.passwordResetConfirmationEmail(dummyName)
  },
  {
    name: '12. Reviewer Assignment Email',
    subject: 'New Review Assignment - C5K',
    html: templates.reviewerAssignmentEmail('Dr. Reviewer', dummyTitle, 'This is a test abstract exploring quantum logic gates in neural synapses.', dummyJournal, dummyDateStr, 'rev-123')
  },
  {
    name: '13. Review Feedback to Author',
    subject: `Review Feedback: ${dummyTitle}`,
    html: templates.reviewFeedbackToAuthor(dummyName, dummyTitle, dummyJournal, 'revision_requested', 'Please expand on section 3 and clarify neural model equations.')
  },
  {
    name: '14. Review Feedback to Editor',
    subject: `New Review from Dr. Reviewer: ${dummyTitle}`,
    html: templates.reviewFeedbackToEditor('Editor Jane', 'Dr. Reviewer', dummyTitle, dummyJournal, 'revision_requested', 'Expanded review comments to author...', 'Confidential note: The math is mostly solid but needs polish.')
  },
  {
    name: '15. Reviewer Invitation Email',
    subject: `Invitation to Review: ${dummyTitle}`,
    html: templates.reviewerInvitationEmail('Dr. Reviewer', dummyTitle, 'Abstract of the quantum paper...', dummyJournal, 'rev-123')
  },
  {
    name: '16. Co-Author Submission Email',
    subject: `Co-Author Notification: ${dummyTitle}`,
    html: templates.coAuthorSubmissionEmail('Dr. CoAuthor', dummyTitle, dummyJournal, dummySubId, 'Dr. LeadAuthor', dummyDateStr)
  },
  {
    name: '17. Co-Author Notification Email',
    subject: `You are listed as a Co-Author: ${dummyTitle}`,
    html: templates.coAuthorNotificationEmail('Dr. CoAuthor', 'Dr. LeadAuthor', dummyTitle, dummyJournal, dummySubId, dummyDateStr)
  },
  {
    name: '18. Reviewer Temporary Password Email',
    subject: `Invitation to Review & Account Credentials: ${dummyTitle}`,
    html: templates.reviewerTempPasswordEmail('Dr. Reviewer', targetEmail, dummyTitle, 'Abstract details...', dummyJournal, 'TempPass123!', 'rev-123')
  },
  {
    name: '19. Reviewer Response Notification (To Editor)',
    subject: `Reviewer ACCEPTED: ${dummyTitle}`,
    html: templates.reviewerResponseNotificationEmail('Editor Jane', 'Dr. Reviewer', dummyTitle, dummyJournal, 'accepted', 'http://localhost:3000/editor/articles/sub-999')
  },
  {
    name: '20. Blog Submission Confirmation',
    subject: `Blog Submission Received: My Journey into Quantum AI`,
    html: templates.blogSubmissionEmail(dummyName, 'My Journey into Quantum AI', 'blog-123', dummyDateStr)
  },
  {
    name: '21. Blog Reviewer Assignment',
    subject: `New Blog Review Assignment: My Journey into Quantum AI`,
    html: templates.blogReviewAssignmentEmail('Dr. Reviewer', 'My Journey into Quantum AI', 'Excerpt: Exploring the intersections of quantum physics and machine learning...', 'blog-rev-123')
  },
  {
    name: '22. Blog Status Update',
    subject: `Status Update: Your blog "My Journey into Quantum AI"`,
    html: templates.blogStatusUpdateEmail(dummyName, 'My Journey into Quantum AI', 'accepted', 'Congratulations, your blog post is accepted!')
  }
];

async function main() {
  console.log(`🚀 Starting execution: Sending all 22 test emails to ${targetEmail}...`);
  console.log(`Using sender: ${process.env.SMTP_FROM_NAME || 'C5K'} <${process.env.SMTP_FROM_EMAIL || 'c5kpublication@gmail.com'}>`);
  
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ Error: BREVO_API_KEY environment variable is not defined.');
    process.exit(1);
  }

  for (const item of emailsToSend) {
    console.log(`Sending: ${item.name} ...`);
    const result = await sendEmail(targetEmail, item.subject, item.html);
    if (result.success) {
      console.log(`   ✅ Sent successfully! MessageId: ${result.messageId}`);
    } else {
      console.error(`   ❌ Failed: ${result.error}`);
    }
    // Sleep 1 second between emails to prevent rate limiting / request spacing issues
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Done sending all emails!');
}

main().catch(err => {
  console.error('Unhandled exception in main:', err);
  process.exit(1);
});
