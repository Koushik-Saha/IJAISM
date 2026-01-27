import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@example.com',
  fromName: process.env.SMTP_FROM_NAME || 'C5K Platform',
  replyTo: process.env.EMAIL_REPLY_TO || process.env.SMTP_FROM_EMAIL,
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'C5K',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
};

// Initialize Resend client
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

// Initialize Nodemailer transporter
export function getNodemailerTransport() {
  if (!EMAIL_CONFIG.smtp.host || !EMAIL_CONFIG.smtp.user || !EMAIL_CONFIG.smtp.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_CONFIG.smtp.host,
    port: EMAIL_CONFIG.smtp.port,
    secure: EMAIL_CONFIG.smtp.secure, // true for 465, false for other ports
    auth: {
      user: EMAIL_CONFIG.smtp.user,
      pass: EMAIL_CONFIG.smtp.pass,
    },
  });
}
