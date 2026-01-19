# 📧 Email Notification System - Setup & Testing Guide

**Status**: ✅ **FULLY IMPLEMENTED**
**Date**: January 18, 2026

This guide will help you set up and test the email notification system for IJAISM.

---

## 🎯 What Was Implemented

### Email Service Integration
- **Provider**: Resend (modern, developer-friendly email API)
- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Delivery**: High deliverability, SPF/DKIM configured automatically

### Email Templates (6 types)

1. **Welcome Email** 🎓
   - Sent when users register
   - Introduces IJAISM features
   - Links to dashboard and submission page

2. **Article Submission Confirmation** ✅
   - Sent when article is submitted
   - Includes submission details and tracking link
   - Explains review process timeline

3. **Membership Activation** 🎉
   - Sent when payment succeeds
   - Lists tier benefits
   - Includes membership details and expiry date

4. **Payment Receipt** 💳
   - Sent after successful payment
   - Includes payment amount and date
   - Links to invoice (if available)

5. **Article Status Update** 📄
   - Sent when submission status changes
   - Includes status-specific messaging
   - Links to submission details

6. **Payment Failed** ⚠️
   - Sent when subscription payment fails
   - Explains failure reason
   - Prompts to update payment method

### Integration Points

All emails are sent automatically:
- ✅ **Registration** → Welcome email
- ✅ **Article submission** → Confirmation email
- ✅ **Payment success** → Membership activation email
- ✅ **Payment failure** → Payment failed email
- ✅ **Subscription cancelled** → Notification (in-app only)

---

## 📋 Prerequisites

Before you can send emails, you need:

1. **Resend Account** (free)
2. **Resend API Key**
3. **Verified Domain** (for production) or use test mode
4. **Environment variables** configured

---

## 🔧 Setup Instructions

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Click "**Sign Up**" (or "Sign in" if you have an account)
3. Complete registration with your email
4. Verify your email address

---

### Step 2: Get API Key

1. In Resend Dashboard, go to **API Keys**
2. Click "**Create API Key**"
3. Give it a name (e.g., "IJAISM Development")
4. Select permissions: **Sending access**
5. Click "**Create**"
6. **Copy the API key** (starts with `re_`)

⚠️ **Important**: Save this key immediately - you won't be able to see it again!

---

### Step 3: Configure Domain (Optional but Recommended)

#### For Development/Testing:
You can use Resend's test domain: `onboarding@resend.dev`
- No configuration needed
- Emails will work immediately
- Limited to 1 email per day to same recipient

#### For Production:
1. In Resend Dashboard, go to **Domains**
2. Click "**Add Domain**"
3. Enter your domain (e.g., `ijaism.org`)
4. Add the DNS records Resend provides to your domain registrar:
   - **MX records** (for receiving)
   - **TXT records** (for SPF/DKIM authentication)
5. Click "**Verify Records**"
6. Wait for verification (usually instant, max 72 hours)

---

### Step 4: Update Environment Variables

Add to your `.env` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY="re_your_actual_api_key_here"
EMAIL_FROM="IJAISM <noreply@ijaism.org>"
EMAIL_REPLY_TO="support@ijaism.org"

# If using test domain for development:
# EMAIL_FROM="IJAISM <onboarding@resend.dev>"
```

**Important Notes**:
- Replace `re_your_actual_api_key_here` with your actual API key from Step 2
- For development, you can use `onboarding@resend.dev` as the sender
- For production, use your verified domain

---

### Step 5: Restart Development Server

```bash
npm run dev
```

The email service will automatically initialize when the app starts.

---

## 🧪 Testing Email Functionality

### Test 1: Welcome Email (New User Registration)

**Steps**:
1. Go to http://localhost:3000/register
2. Fill in the registration form with a **real email address** (your own)
3. Click "Create Account"
4. Check your inbox for the welcome email

**Expected Result**:
- ✅ Registration succeeds
- ✅ Welcome email arrives within seconds
- ✅ Email has IJAISM branding
- ✅ All links work correctly

**Console Output**:
```
[EMAIL] Sent successfully to your@email.com: Welcome to IJAISM! (ID: abc123)
```

---

### Test 2: Article Submission Email

**Steps**:
1. Login to your account
2. Go to http://localhost:3000/submit
3. Fill out the article submission form:
   - Select a journal
   - Enter title and abstract (150-300 words)
   - Add 4-7 keywords
4. Submit the article
5. Check your inbox

**Expected Result**:
- ✅ Article submitted successfully
- ✅ Confirmation email arrives
- ✅ Email includes submission ID and tracking link
- ✅ "View Submission Status" button works

---

### Test 3: Membership Activation Email

**Prerequisites**: Stripe setup completed (see STRIPE-PAYMENT-SETUP.md)

**Steps**:
1. Go to http://localhost:3000/membership
2. Click "Get Basic" or "Get Premium"
3. Complete Stripe checkout with test card: `4242 4242 4242 4242`
4. Wait for redirect to dashboard
5. Check your inbox

**Expected Result**:
- ✅ Payment succeeds
- ✅ Membership activation email arrives
- ✅ Email lists tier benefits
- ✅ Shows correct expiry date (1 year from now)

---

### Test 4: Payment Failed Email

**Steps** (requires Stripe CLI):
1. Use declined test card: `4000 0000 0000 0002`
2. Or use Stripe Dashboard to simulate failed payment
3. Check your inbox

**Expected Result**:
- ✅ Payment failed notification appears in dashboard
- ✅ Payment failed email arrives
- ✅ Email explains the issue
- ✅ "Update Payment Method" button works

---

## 🔍 Verifying Email Delivery

### Check Resend Dashboard

1. Go to https://resend.com/emails
2. You'll see all sent emails with:
   - **Status**: Delivered, Bounced, Complained, etc.
   - **Recipient**: Who received it
   - **Subject**: Email subject line
   - **Sent**: Timestamp
3. Click any email to see full details and preview

### Check Server Logs

When emails are sent, you'll see console output:

```bash
[EMAIL] Sent successfully to user@example.com: Article Submission Received (ID: abc123)
```

If Resend is not configured:
```bash
[EMAIL] Would send to user@example.com: Welcome to IJAISM!
[EMAIL] Set RESEND_API_KEY to enable email sending
```

---

## 📊 Email Templates Preview

All emails include:
- **Branded header** with IJAISM logo and gradient
- **Clean, professional layout**
- **Mobile-responsive design**
- **Clear call-to-action buttons**
- **Footer with contact info**
- **Unsubscribe options** (when applicable)

### Design Features:
- Primary color: Blue (#1e40af)
- Accent color: Orange (#f59e0b)
- Typography: System fonts for best compatibility
- Layout: Max-width 600px, centered
- Buttons: Large, accessible, hover states

---

## 🐛 Troubleshooting

### Error: "RESEND_API_KEY is not set"

**Solution**:
1. Add `RESEND_API_KEY` to your `.env` file
2. Restart the dev server: `npm run dev`

### Error: "Domain not verified"

**Solution**:
1. Use test domain for development: `onboarding@resend.dev`
2. Or verify your domain in Resend Dashboard (see Step 3)

### Emails not arriving

**Possible causes**:
1. **Wrong API key** → Verify in Resend Dashboard
2. **Spam folder** → Check spam/junk folder
3. **Invalid sender email** → Use verified domain or test domain
4. **Rate limit exceeded** → Free tier: 100/day, 3000/month

**Debug steps**:
1. Check server console for `[EMAIL]` logs
2. Check Resend Dashboard → Emails
3. Look for bounces or complaints
4. Try different recipient email

### Emails in spam folder

**Solutions**:
1. **For development**: Whitelist sender in your email client
2. **For production**:
   - Verify domain in Resend
   - Add SPF/DKIM DNS records
   - Enable DMARC policy
   - Avoid spam trigger words in subject/body

### "Failed to send email" errors

**Check**:
1. Resend API key is correct
2. Sender email matches verified domain
3. Recipient email is valid
4. No rate limits exceeded
5. Check Resend status page: https://resend.com/status

---

## 💡 Development Mode

When `RESEND_API_KEY` is **not set**:
- Emails won't actually send
- Console will log what would have been sent
- Application continues working normally
- Useful for development without email service

To enable this mode:
- Simply comment out `RESEND_API_KEY` in `.env`
- Or don't set it at all

---

## 🚀 Production Deployment

Before deploying to production:

### 1. Verify Domain
- Add your domain in Resend
- Configure DNS records (SPF, DKIM)
- Wait for verification

### 2. Update Environment Variables
```bash
RESEND_API_KEY="re_live_your_production_key"
EMAIL_FROM="IJAISM <noreply@yourdomain.com>"
EMAIL_REPLY_TO="support@yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### 3. Set in Vercel (if using Vercel)
1. Go to Project Settings → Environment Variables
2. Add all email variables
3. Redeploy application

### 4. Monitor Email Delivery
- Check Resend Dashboard regularly
- Set up webhooks for bounce/complaint notifications
- Monitor delivery rates

### 5. Configure Email Preferences
In Resend Dashboard:
- Set up bounce handling
- Configure unsubscribe links
- Add contact information
- Set up webhook notifications

---

## 📈 Email Analytics

Resend provides analytics:
- **Delivery rate**: % of emails successfully delivered
- **Open rate**: How many recipients opened emails
- **Click rate**: How many clicked links in emails
- **Bounce rate**: % of emails that bounced
- **Complaint rate**: % marked as spam

Access in Resend Dashboard → Analytics

---

## 🔒 Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** for all secrets
3. **Rotate API keys** periodically
4. **Use different keys** for dev/staging/production
5. **Monitor for unusual activity** in Resend Dashboard
6. **Implement rate limiting** if you have public endpoints
7. **Validate email addresses** before sending

---

## 📞 Support & Resources

### Resend Documentation
- **Main Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference
- **Node.js SDK**: https://resend.com/docs/send-with-nodejs
- **Status Page**: https://resend.com/status

### IJAISM Email Service
- **Templates**: `/lib/email/templates.ts`
- **Sending Functions**: `/lib/email/send.ts`
- **Client Configuration**: `/lib/email/client.ts`

### Getting Help
- **Resend Support**: support@resend.com
- **Resend Discord**: https://resend.com/discord
- **GitHub Issues**: https://github.com/resendlabs/resend-node

---

## 📁 Files Created/Modified

### Created (4 files)
1. `/lib/email/client.ts` - Resend client initialization
2. `/lib/email/templates.ts` - All email templates (6 types)
3. `/lib/email/send.ts` - Email sending functions
4. `/lib/email/index.ts` - Main export file

### Modified (4 files)
1. `/app/api/auth/register/route.ts` - Added welcome email
2. `/app/api/articles/submit/route.ts` - Added submission confirmation
3. `/app/api/webhooks/stripe/route.ts` - Added membership & payment emails
4. `/.env.example` - Added Resend configuration

### Documentation
1. `/EMAIL-NOTIFICATION-SETUP.md` - This guide

---

## ✅ Testing Checklist

After setup, verify all emails work:

- [ ] Welcome email sent after registration
- [ ] Article submission confirmation sent
- [ ] Membership activation email sent after payment
- [ ] Payment failed email sent when payment fails
- [ ] All emails arrive in inbox (not spam)
- [ ] All links in emails work correctly
- [ ] Emails look good on mobile devices
- [ ] Emails display correctly in Gmail, Outlook, Apple Mail
- [ ] Resend Dashboard shows delivered status
- [ ] Console logs show successful sends

---

## 🎯 What's Next?

After emails are working, consider:

1. **Email Preferences** - Let users customize email notifications
2. **Digest Emails** - Weekly summary of activity
3. **Reminder Emails** - Deadline reminders for reviewers
4. **Newsletter System** - Send updates to all members
5. **Email Verification** - Verify email addresses on signup
6. **Transactional Emails** - Password reset, email change confirmation

---

**Implementation Status**: ✅ COMPLETE
**Build Status**: ✅ PASSING
**Ready for Testing**: ✅ YES (after Resend setup)

Get your Resend API key and start testing! 📧
