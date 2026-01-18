# 💳 Stripe Payment Integration - Setup & Testing Guide

**Status**: ✅ **FULLY IMPLEMENTED - Ready for Testing**
**Date**: January 18, 2026

This guide will help you set up Stripe payments and test the membership subscription system.

---

## 🎯 What Was Implemented

### Backend API Endpoints (2 new routes)

1. **`/api/payments/create-checkout-session`** (NEW)
   - Creates Stripe Checkout sessions
   - Validates user authentication
   - Checks for existing active memberships
   - Supports 3 tiers: Basic ($99), Premium ($199), Institutional ($499)
   - Returns checkout URL for redirect

2. **`/api/webhooks/stripe`** (NEW)
   - Receives Stripe webhook events
   - Verifies webhook signatures for security
   - Handles payment events:
     - `checkout.session.completed` → Activates membership
     - `customer.subscription.updated` → Updates membership status
     - `customer.subscription.deleted` → Expires membership
     - `invoice.payment_failed` → Notifies user
   - Creates database records and notifications

### Frontend

**`/app/membership/page.tsx`** (UPDATED)
- Converted to client component
- Added Stripe.js integration
- Interactive subscription buttons
- Loading states with spinners
- Error handling and display
- 4 membership tiers with pricing
- Automatic redirect to Stripe Checkout

### Database Integration

- Creates/updates `Membership` records
- Creates `Notification` records
- Handles annual subscriptions (1-year duration)
- Tracks Stripe subscription IDs for management

---

## 📋 Prerequisites

Before you can test payments, you need:

1. **Stripe Account** (free test account)
2. **Stripe Test API Keys**
3. **Stripe Price IDs** for products
4. **Webhook Endpoint** configured

---

## 🔧 Setup Instructions

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Sign up" (or "Sign in" if you have an account)
3. Complete registration
4. You'll be in **Test Mode** by default (perfect for development)

---

### Step 2: Get API Keys

1. In Stripe Dashboard, go to **Developers** → **API Keys**
2. Copy the following keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Click "Reveal test key", starts with `sk_test_`

3. Add to your `.env` file:
   ```bash
   # In /Users/koushiksaha/Desktop/FixItUp/c5k-platform/.env

   STRIPE_SECRET_KEY="sk_test_your_actual_key_here"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_key_here"
   ```

---

### Step 3: Create Products & Prices

You need to create 3 products in Stripe Dashboard:

#### Option A: Using Stripe Dashboard (Recommended for beginners)

1. Go to **Products** → **Add Product**

**Product 1: Basic Membership**
   - **Name**: "Basic Membership"
   - **Description**: "Annual subscription for active researchers"
   - **Pricing**: Recurring, $99.00 USD, Yearly
   - **Click "Save product"**
   - **Copy the Price ID** (starts with `price_`)

**Product 2: Premium Membership**
   - **Name**: "Premium Membership"
   - **Description**: "Annual subscription for prolific researchers"
   - **Pricing**: Recurring, $199.00 USD, Yearly
   - **Click "Save product"**
   - **Copy the Price ID**

**Product 3: Institutional Membership**
   - **Name**: "Institutional Membership"
   - **Description**: "Annual subscription for universities"
   - **Pricing**: Recurring, $499.00 USD, Yearly
   - **Click "Save product"**
   - **Copy the Price ID**

2. Add Price IDs to `.env`:
   ```bash
   STRIPE_PRICE_BASIC="price_1ABC123..."
   STRIPE_PRICE_PREMIUM="price_1DEF456..."
   STRIPE_PRICE_INSTITUTIONAL="price_1GHI789..."
   ```

#### Option B: Using Stripe CLI (Advanced)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

stripe products create --name="Basic Membership" --description="Annual subscription"
stripe prices create --product=prod_xxx --currency=usd --unit-amount=9900 --recurring[interval]=year

stripe products create --name="Premium Membership" --description="Annual subscription"
stripe prices create --product=prod_yyy --currency=usd --unit-amount=19900 --recurring[interval]=year

stripe products create --name="Institutional Membership" --description="Annual subscription"
stripe prices create --product=prod_zzz --currency=usd --unit-amount=49900 --recurring[interval]=year
```

---

### Step 4: Set Up Webhook Endpoint

#### For Local Development (using Stripe CLI)

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli#install

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**:
   ```bash
   # Run this in a separate terminal window
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`):
   ```bash
   # The CLI will output something like:
   # > Ready! Your webhook signing secret is whsec_xxxxx
   ```

5. **Add to `.env`**:
   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_your_secret_here"
   ```

#### For Production Deployment (Vercel)

1. Deploy your app to Vercel first
2. In Stripe Dashboard, go to **Developers** → **Webhooks**
3. Click "Add endpoint"
4. Enter URL: `https://your-domain.vercel.app/api/webhooks/stripe`
5. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to Vercel environment variables

---

### Step 5: Verify Environment Variables

Your `.env` file should now have:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ijaism_db"

# JWT & NextAuth
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="IJAISM"
NODE_ENV="development"

# Stripe (ALL REQUIRED)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_BASIC="price_..."
STRIPE_PRICE_PREMIUM="price_..."
STRIPE_PRICE_INSTITUTIONAL="price_..."
```

---

## 🧪 Testing the Payment Flow

### 1. Start Development Server

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Stripe webhook forwarding (if testing webhooks locally)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 2. Test Subscription Flow

**Steps**:
1. **Login/Register**: http://localhost:3000/login
   - Use an academic email (e.g., `test@university.edu`)

2. **Go to Membership Page**: http://localhost:3000/membership

3. **Click "Get Basic" or "Get Premium"** button

4. **You'll be redirected to Stripe Checkout** (test mode)

5. **Use Stripe Test Cards**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires 3D Secure**: `4000 0025 0000 3155`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

6. **Complete Payment**

7. **You'll be redirected back** to `/dashboard?payment=success`

8. **Verify in Database**:
   ```bash
   npx prisma studio
   ```
   - Check `Membership` table → should have new active membership
   - Check `Notification` table → should have activation notification

---

## ✅ Verification Checklist

After payment, verify:

- [ ] Redirected to Stripe Checkout
- [ ] Test payment processed successfully
- [ ] Redirected back to dashboard with success message
- [ ] Membership created in database with:
  - `status: "active"`
  - `tier: "basic" | "premium" | "institutional"`
  - `stripeSubscriptionId: "sub_xxx..."`
  - `startDate: current date`
  - `endDate: 1 year from now`
  - `autoRenew: true`
- [ ] Notification created with "Membership Activated!" message
- [ ] Webhook events logged in terminal (if using Stripe CLI)

---

## 🔍 How It Works

### Payment Flow Diagram

```
User clicks "Get Premium" on /membership
           ↓
Frontend calls /api/payments/create-checkout-session
           ↓
API validates user & tier
           ↓
API creates Stripe Checkout Session
           ↓
API returns session URL
           ↓
Frontend redirects to Stripe Checkout
           ↓
User enters payment details
           ↓
Stripe processes payment
           ↓
Stripe sends webhook to /api/webhooks/stripe
           ↓
Webhook verifies signature
           ↓
Webhook creates/updates Membership in database
           ↓
Webhook creates Notification
           ↓
User redirected to /dashboard?payment=success
```

---

## 🐛 Troubleshooting

### Error: "STRIPE_SECRET_KEY is not set"
**Solution**: Add Stripe keys to `.env` file and restart dev server

### Error: "Invalid journal"
**Wait, wrong error... this is for articles**

### Error: "Failed to create checkout session"
**Possible causes**:
1. Missing Stripe keys in `.env`
2. Invalid Price IDs
3. Stripe account in restricted mode

**Solution**:
1. Verify all env vars are set
2. Check Price IDs in Stripe Dashboard
3. Complete Stripe account setup

### Error: "Webhook signature verification failed"
**Possible causes**:
1. Wrong webhook secret
2. Stripe CLI not running (local dev)
3. Request not from Stripe

**Solution**:
1. Copy correct `whsec_` secret from Stripe CLI output
2. Ensure `stripe listen` is running
3. Don't test webhooks manually - let Stripe send them

### Payment succeeds but membership not created
**Possible causes**:
1. Webhook not configured
2. Webhook secret incorrect
3. Database connection issue

**Solution**:
1. Check Terminal 2 for webhook events
2. Check server logs for errors
3. Verify database is running: `npx prisma studio`

### "You already have an active membership"
**This is working correctly!** The system prevents duplicate subscriptions.

**To test again**:
```bash
npx prisma studio
# Delete the membership record
# Or change status to "expired"
```

---

## 📊 Stripe Dashboard Monitoring

After test payments, check Stripe Dashboard:

1. **Payments** → See test payments
2. **Customers** → See created customers
3. **Subscriptions** → See active subscriptions
4. **Events** → See webhook events
5. **Logs** → See API requests

---

## 💡 Test Scenarios

### Scenario 1: Successful Subscription
- Select any tier
- Use test card `4242 4242 4242 4242`
- Complete payment
- ✅ Should activate membership

### Scenario 2: Declined Card
- Select any tier
- Use test card `4000 0000 0000 0002`
- Payment will be declined
- ❌ Should show Stripe error

### Scenario 3: Duplicate Subscription
- Already have active membership
- Try to subscribe again
- ❌ Should show error: "You already have an active membership"

### Scenario 4: Unauthenticated User
- Logout
- Go to `/membership`
- Click "Get Basic"
- ✅ Should redirect to `/login`

---

## 🚀 Production Deployment Notes

When deploying to production:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Get Live API Keys** (`pk_live_` and `sk_live_`)
3. **Create Live Products** (same as test)
4. **Update Environment Variables** in Vercel with live keys
5. **Configure Production Webhook** endpoint
6. **Remove test card instructions** from UI
7. **Test with real card** (use your own)
8. **Set up Stripe Tax** (if applicable)
9. **Configure email receipts** in Stripe Dashboard

---

## 📁 Files Created/Modified

### Created (2 API routes)
1. `/app/api/payments/create-checkout-session/route.ts` - Payment endpoint
2. `/app/api/webhooks/stripe/route.ts` - Webhook handler

### Modified (2 files)
1. `/app/membership/page.tsx` - Added Stripe integration
2. `/.env.example` - Added Stripe environment variables

### Documentation
1. `/STRIPE-PAYMENT-SETUP.md` - This guide

---

## 🎯 Next Steps

After payments work:

1. **Email Notifications** (Task 1.3)
   - Send membership activation emails
   - Send payment receipts

2. **Subscription Management**
   - Cancel subscription
   - Upgrade/downgrade tier
   - View billing history

3. **Membership Benefits**
   - Unlock features based on tier
   - Show tier badge in dashboard
   - Limit submissions for free/basic users

---

## 📞 Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Stripe Webhooks Guide**: https://stripe.com/docs/webhooks
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

**Implementation Status**: ✅ COMPLETE
**Build Status**: ✅ PASSING (26 routes)
**Ready for Testing**: ✅ YES (after setup)

Complete the setup steps above, then start testing payments! 💳
