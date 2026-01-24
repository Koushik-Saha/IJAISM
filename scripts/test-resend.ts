
require('dotenv').config();
const { Resend } = require('resend');

async function main() {
    console.log('🚀 Testing Resend Configuration...');

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('❌ RESEND_API_KEY is missing in .env');
        return;
    }

    const resend = new Resend(apiKey);

    try {
        console.log('Sending email via Resend to koushiksahala@gmail.com...');
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'koushiksahala@gmail.com',
            subject: 'Hello from Resend (IJAISM)',
            html: '<p>If you see this, <strong>Resend is working correctly!</strong></p>'
        });

        if (data.error) {
            console.error('❌ Resend Error:', data.error);
        } else {
            console.log('✅ Email sent successfully!');
            console.log('ID:', data.data?.id);
        }

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
    }
}

main();
