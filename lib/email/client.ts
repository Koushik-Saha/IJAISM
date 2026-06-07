import { Resend } from 'resend';

// Lazy getters so env vars are always read at call time, never frozen at module load
export const EMAIL_CONFIG = {
  get from() { return process.env.SMTP_FROM_EMAIL || 'noreply@c5k.com'; },
  get fromName() { return process.env.SMTP_FROM_NAME || 'C5K Platform'; },
  get replyTo() { return process.env.SMTP_FROM_EMAIL || 'noreply@c5k.com'; },
  get appName() { return process.env.NEXT_PUBLIC_APP_NAME || 'C5K'; },
  get appUrl() { return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; },
};

// Initialize Resend client
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}
