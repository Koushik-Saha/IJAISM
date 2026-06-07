// Quick Brevo email test — run with: npx ts-node --skip-project test-brevo.ts
import { BrevoClient } from '@getbrevo/brevo';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.BREVO_API_KEY!;
const fromEmail = process.env.SMTP_FROM_EMAIL!;
const fromName = process.env.SMTP_FROM_NAME!;

console.log('🔑 API Key:', apiKey ? `${apiKey.slice(0, 20)}...` : 'NOT FOUND');
console.log('📧 From:', `"${fromName}" <${fromEmail}>`);

async function main() {
  const brevo = new BrevoClient({ apiKey });

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: fromEmail, name: 'C5K Test' }],
      replyTo: { email: fromEmail },
      subject: '✅ Brevo Email Test — C5K Platform',
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#2563eb;">C5K Email System — Test Successful</h2>
          <p>This is a test email sent from <strong>${fromEmail}</strong> via Brevo.</p>
          <p style="color:#6b7280;font-size:14px;">Sent at: ${new Date().toISOString()}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
          <p style="font-size:12px;color:#9ca3af;">C5K Publication Platform</p>
        </div>
      `,
    });

    console.log('\n✅ Email sent successfully!');
    console.log('   Message ID:', (result as any)?.messageId || (result as any)?.body?.messageId || 'ok');
    console.log(`\n📬 Check your inbox at: ${fromEmail}`);
  } catch (err: any) {
    console.error('\n❌ Failed to send email:');
    console.error('   Status:', err?.statusCode || err?.status);
    console.error('   Body:', JSON.stringify(err?.body || err?.message, null, 2));
  }
}

main();
