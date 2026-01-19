import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify email configuration on startup (only in development)
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
      console.log('💡 Set SMTP_* environment variables to enable email sending');
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Email not configured. Email would be sent to:', options.to);
      console.log('Subject:', options.subject);
      console.log('Preview URL: Email sending is disabled (no SMTP credentials)');

      // In development without SMTP, log the email content
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📧 EMAIL CONTENT (DEV MODE):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Content:', options.text || 'See HTML version');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      return true; // Return true in dev mode even without SMTP
    }

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'IJAISM Platform'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .alternative-link {
      margin-top: 20px;
      padding: 15px;
      background-color: #f3f4f6;
      border-radius: 6px;
      word-break: break-all;
      font-size: 14px;
      color: #6b7280;
    }
    .warning {
      margin-top: 30px;
      padding: 15px;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IJAISM</div>
    </div>

    <h1 class="title">Reset Your Password</h1>

    <div class="content">
      <p>Hi ${name},</p>
      <p>We received a request to reset your password for your IJAISM account. Click the button below to create a new password:</p>
    </div>

    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <div class="alternative-link">
      <p><strong>Or copy and paste this link into your browser:</strong></p>
      <p>${resetUrl}</p>
    </div>

    <div class="warning">
      <p><strong>⚠️ Important:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>This link will expire in <strong>1 hour</strong></li>
        <li>If you didn't request this reset, please ignore this email</li>
        <li>Your password will not change unless you click the link above</li>
      </ul>
    </div>

    <div class="footer">
      <p>This email was sent by IJAISM Academic Publishing Platform</p>
      <p>If you have questions, contact us at support@ijaism.com</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hi ${name},

We received a request to reset your password for your IJAISM account.

To reset your password, click the following link (or copy and paste it into your browser):
${resetUrl}

⚠️ Important:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will not change unless you click the link above

If you have questions, contact us at support@ijaism.com

Best regards,
IJAISM Team
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - IJAISM',
    html,
    text,
  });
}

/**
 * Send password reset confirmation email
 */
export async function sendPasswordResetConfirmationEmail(
  email: string,
  name: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .success-icon {
      font-size: 48px;
      color: #10b981;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
    }
    .warning {
      margin-top: 30px;
      padding: 15px;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IJAISM</div>
      <div class="success-icon">✓</div>
    </div>

    <h1 class="title">Password Changed Successfully</h1>

    <div class="content">
      <p>Hi ${name},</p>
      <p>Your password has been changed successfully. You can now log in to your IJAISM account with your new password.</p>
      <p>If you didn't make this change, please contact our support team immediately at support@ijaism.com</p>
    </div>

    <div class="footer">
      <p>This email was sent by IJAISM Academic Publishing Platform</p>
      <p>For security reasons, we recommend using a strong, unique password</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hi ${name},

Your password has been changed successfully. You can now log in to your IJAISM account with your new password.

If you didn't make this change, please contact our support team immediately at support@ijaism.com

Best regards,
IJAISM Team
  `;

  return sendEmail({
    to: email,
    subject: 'Password Changed Successfully - IJAISM',
    html,
    text,
  });
}
