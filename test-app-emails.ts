require('dotenv').config();
import { sendArticleSubmissionEmail, sendPasswordResetEmail, sendReviewerInvitationEmail } from './lib/email/send';

async function run() {
    console.log("Testing application email functions...");
    const email = "koushik.saha666@gmail.com";

    const res1 = await sendArticleSubmissionEmail(email, "Koushik Saha", "Test Article Integration", "IJAISM", "SUB-123", new Date());
    console.log("Submission Email:", res1);

    const res2 = await sendPasswordResetEmail(email, "Koushik Saha", "token-123");
    console.log("Reset Email:", res2);

    const res3 = await sendReviewerInvitationEmail(email, "Koushik Saha", "Test Article Integration", "This is a dummy test abstract injection for the invitation workflow compiler validation.", "IJAISM", "INV-123");
    console.log("Reviewer Email:", res3);
}

run();
