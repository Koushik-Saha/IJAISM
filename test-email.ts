import { Resend } from 'resend';

// Initialize with the provided API key
const resend = new Resend('re_GZd3ra6n_NKxAJFWQ8dCSUVihUKq3jPe7');

async function testEmail() {
    console.log('Sending test email via Resend to koushik.saha666@gmail.com...');

    try {
        const response = await resend.emails.send({
            from: 'C5K Platform <noreply@c5k.co>',
            to: ['koushik.saha666@gmail.com'],
            subject: 'Resend Integration Successful!',
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #4F46E5;">Email Integration Configured</h2>
          <p>Hello Koushik,</p>
          <p>This is a test email confirming that the Resend API integration for <strong>c5k.co</strong> is working perfectly!</p>
          <p>The system will now use this service for sending automated emails like welcome messages, reviewer assignments, and submission confirmations.</p>
          <br>
          <p>Best regards,<br>The C5K Platform System</p>
        </div>
      `
        });

        if (response.error) {
            console.error('Failed to send email:', response.error);
        } else {
            console.log('Success! Email sent. ID:', response.data?.id);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testEmail();
