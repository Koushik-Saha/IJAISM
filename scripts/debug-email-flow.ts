
// We need to load env vars manually because we are running a standalone script, 
// and Next.js automatically loads .env only in 'next dev' or 'next start'.
require('dotenv').config();

const { sendEmailVerificationEmail } = require('../lib/email/send');
const { EMAIL_CONFIG } = require('../lib/email/client');

async function main() {
    console.log('🚀 Debugging Application Email Flow...');

    // 1. Inspect loaded config
    console.log('configuration loaded from .env:');
    console.log({
        host: EMAIL_CONFIG.smtp.host,
        port: EMAIL_CONFIG.smtp.port,
        user: EMAIL_CONFIG.smtp.user,
        secure: EMAIL_CONFIG.smtp.secure,
        from: EMAIL_CONFIG.from
    });

    if (!EMAIL_CONFIG.smtp.host || !EMAIL_CONFIG.smtp.user) {
        console.error('❌ Critical: SMTP credentials missing in process.env');
        return;
    }

    // 2. Attempt send
    console.log('Sending verification email to koushiksahala@gmail.com...');

    try {
        const result = await sendEmailVerificationEmail(
            'koushiksahala@gmail.com',
            'Koushik Debug',
            'debug-token-12345'
        );

        console.log('Result:', result);

        if (result.success) {
            console.log('✅ Email successfully sent via Application Code!');
        } else {
            console.error('❌ Email failed via Application Code:', result.error);
        }
    } catch (e) {
        console.error('❌ Exception during sending:', e);
    }
}

main();
