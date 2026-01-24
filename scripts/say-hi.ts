
require('dotenv').config();
const { getNodemailerTransport, EMAIL_CONFIG } = require('../lib/email/client');

async function main() {
    console.log('👋 Sending "Hi" email...');

    const transporter = getNodemailerTransport();

    if (!transporter) {
        console.error('❌ Could not create transporter. Check SMTP config.');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
            to: "koushiksahala@gmail.com",
            subject: "Hi from C5K Platform",
            text: "Hi! This email confirms your new App Password is working correctly.",
            html: "<h1>Hi!</h1><p>This email confirms your new App Password is working correctly.</p>"
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

main();
