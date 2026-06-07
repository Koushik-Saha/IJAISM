// Comprehensive Brevo email test
// Run: npx ts-node --skip-project --compiler-options '{"module":"commonjs","esModuleInterop":true}' test-brevo-full.ts

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendWelcomeEmail, sendEmailVerificationEmail, sendEmailVerificationConfirmationEmail, sendPasswordResetEmail } from './lib/email/send';
import { EMAIL_CONFIG } from './lib/email/client';

// Use the user's requested test recipient email
const TEST_EMAIL = 'eauthentication20@gmail.com';
const FAKE_TOKEN = 'test-token-abc123xyz';

async function runTests() {
  console.log('\n========================================');
  console.log('     BREVO EMAIL TEST SUITE — C5K');
  console.log('========================================');
  console.log(`📧 From: "${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`);
  console.log(`📬 Sending all tests to: ${TEST_EMAIL}`);
  console.log('========================================\n');

  const tests = [
    {
      name: '1. Welcome Email',
      fn: () => sendWelcomeEmail(TEST_EMAIL, 'Koushik (Test User)'),
    },
    {
      name: '2. Email Verification Email',
      fn: () => sendEmailVerificationEmail(TEST_EMAIL, 'Koushik (Test User)', FAKE_TOKEN),
    },
    {
      name: '3. Email Verified Confirmation',
      fn: () => sendEmailVerificationConfirmationEmail(TEST_EMAIL, 'Koushik (Test User)'),
    },
    {
      name: '4. Password Reset Email',
      fn: () => sendPasswordResetEmail(TEST_EMAIL, 'Koushik (Test User)', FAKE_TOKEN),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`Running: ${test.name}... `);
    try {
      const result = await test.fn();
      if (result.success) {
        console.log(`✅ SENT  (ID: ${result.messageId?.slice(0, 40)}...)`);
        passed++;
      } else {
        console.log(`❌ FAILED — ${result.error}`);
        failed++;
      }
    } catch (err: any) {
      console.log(`❌ ERROR — ${err?.message}`);
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n========================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');
  console.log(`\n📬 Check ${TEST_EMAIL} inbox for all 4 emails.`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
