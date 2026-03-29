import { sendArticleSubmissionEmail } from '../lib/email/send';
import { logger } from '../lib/logger';
import dotenv from 'dotenv';
dotenv.config();

async function testMail() {
    try {
        console.log("Checking Resend API Key:", process.env.RESEND_API_KEY ? "EXISTS" : "MISSING");
        await sendArticleSubmissionEmail('koushik@c5k.co', 'Koushik Saha', 'Test Mail from Resend', 'Test Journal', '123', new Date());
        console.log("Mail sent successfully.");
    } catch (e) {
        console.error("Mail failed:", e);
    }
}
testMail();
