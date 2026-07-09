import { BrevoClient } from '@getbrevo/brevo';

// Lazy getters so env vars are always read at call time, never frozen at module load
export const EMAIL_CONFIG = {
  get from() { return process.env.SMTP_FROM_EMAIL || 'c5kpublication@gmail.com'; },
  get fromName() { return process.env.SMTP_FROM_NAME || 'C5K'; },
  get replyTo() { return process.env.SMTP_FROM_EMAIL || 'c5kpublication@gmail.com'; },
  get appName() { return process.env.NEXT_PUBLIC_APP_NAME || 'C5K Publications'; },
  get appUrl() { 
    return getAppUrl();
  },
};

export function getAppUrl(): string {
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) {
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl;
    }
    return `https://${process.env.VERCEL_URL}`;
  }
  return envUrl || 'http://localhost:3000';
}

// Initialize Brevo client (new SDK style)
export function getBrevoClient(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  return new BrevoClient({ apiKey });
}
