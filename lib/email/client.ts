import { Resend } from 'resend';

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM_EMAIL || 'noreply@c5k.co',
  fromName: process.env.SMTP_FROM_NAME || 'C5K Platform',
  replyTo: process.env.SMTP_FROM_EMAIL || 'noreply@c5k.co',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'C5K',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Initialize Resend client
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}
