import { Resend } from 'resend';

// Initialize Resend client
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Email sending will be disabled.');
    return null;
  }

  return new Resend(apiKey);
}

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'IJAISM <noreply@ijaism.org>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@ijaism.org',
  appName: 'IJAISM',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
