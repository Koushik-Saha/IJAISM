# 🚀 IJAISM Platform - Implementation Roadmap

**Current Status**: 42% Complete (Strong UI Foundation, Backend Needs Work)
**Goal**: Production-Ready MVP in 3-4 Weeks

---

## 📊 Implementation Strategy

This roadmap prioritizes features to get you to a **Minimum Viable Product (MVP)** that can handle real users, then builds toward a full-featured platform.

```
Phase 1 (MVP) → Phase 2 (Beta) → Phase 3 (Full Launch)
  2 weeks         1 week           1 week
```

---

## 🎯 PHASE 1: MVP - Core Functionality (2 Weeks)

**Goal**: Make the platform functional for real users to submit articles, review them, and pay for memberships.

### Task 1.1: Connect Article Submission to Database
**Priority**: 🔴 CRITICAL
**Estimated Time**: 3-4 days
**Current Status**: Form UI exists, backend API missing

#### What to Build:

**A. Create Article Submission API**
File: `/app/api/articles/submit/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user authentication
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // 2. Parse form data
    const body = await req.json();
    const {
      submissionType,
      journal,
      title,
      abstract,
      keywords,
      manuscriptUrl, // Will handle file upload separately
      coverLetterUrl
    } = body;

    // 3. Validate required fields
    if (!journal || !title || !abstract || !keywords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Find journal by name
    const journalRecord = await prisma.journal.findFirst({
      where: { name: journal }
    });

    if (!journalRecord) {
      return NextResponse.json(
        { error: 'Invalid journal' },
        { status: 400 }
      );
    }

    // 5. Create article in database
    const article = await prisma.article.create({
      data: {
        title,
        abstract,
        keywords: keywords.split(',').map((k: string) => k.trim()),
        articleType: submissionType,
        status: 'submitted',
        authorId: userId,
        journalId: journalRecord.id,
        manuscriptUrl,
        coverLetterUrl,
        submittedAt: new Date(),
      },
      include: {
        author: {
          select: { name: true, email: true }
        },
        journal: {
          select: { name: true, code: true }
        }
      }
    });

    // 6. Create notification for author
    await prisma.notification.create({
      data: {
        userId,
        type: 'submission_update',
        title: 'Article Submitted Successfully',
        message: `Your article "${title}" has been submitted to ${journalRecord.name}`,
        link: `/dashboard/submissions/${article.id}`,
      }
    });

    // 7. TODO: Send confirmation email

    return NextResponse.json({
      success: true,
      articleId: article.id,
      message: 'Article submitted successfully',
      article
    });

  } catch (error) {
    console.error('Article submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**B. Update Frontend Submission Form**
File: `/app/submit/page.tsx` (MODIFY)

```typescript
// Add this function inside the SubmitPage component
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsSubmitting(true);
  setError(null);

  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?redirect=/submit');
      return;
    }

    // Prepare submission data
    const submissionData = {
      submissionType: formData.submissionType,
      journal: formData.journal,
      title: formData.title,
      abstract: formData.abstract,
      keywords: formData.keywords,
      // TODO: Handle file uploads
      manuscriptUrl: null,
      coverLetterUrl: null,
    };

    // Submit to API
    const response = await fetch('/api/articles/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(submissionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Submission failed');
    }

    // Success - redirect to dashboard
    alert(`Success! Your article has been submitted. Submission ID: ${data.articleId}`);
    router.push('/dashboard');

  } catch (error: any) {
    setError(error.message);
    console.error('Submission error:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

**C. Add File Upload Support (Optional for MVP, recommended)**
Use AWS S3 or Vercel Blob Storage for file uploads.

**D. Testing Checklist:**
- [ ] User can submit article with all fields
- [ ] Article appears in database
- [ ] Notification created for user
- [ ] Form validation works
- [ ] Error handling works for missing fields
- [ ] Token authentication works

---

### Task 1.2: Integrate Stripe Payment Processing
**Priority**: 🔴 CRITICAL
**Estimated Time**: 3-4 days
**Current Status**: Membership tiers displayed, no payment

#### What to Build:

**A. Set Up Stripe**
```bash
npm install stripe @stripe/stripe-js
```

**B. Create Stripe Checkout API**
File: `/app/api/payments/create-checkout-session/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { tier } = await req.json();

    // Define pricing
    const prices = {
      basic: 'price_1234567890', // Replace with your Stripe Price IDs
      premium: 'price_0987654321',
      institutional: 'price_1111111111',
    };

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: decoded.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices[tier as keyof typeof prices],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership?payment=cancelled`,
      metadata: {
        userId: decoded.userId,
        tier,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Payment setup failed' },
      { status: 500 }
    );
  }
}
```

**C. Handle Stripe Webhooks**
File: `/app/api/webhooks/stripe/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      // Create membership in database
      await prisma.membership.create({
        data: {
          userId: session.metadata!.userId,
          tier: session.metadata!.tier,
          status: 'active',
          startDate: new Date(),
          stripeSubscriptionId: session.subscription as string,
          autoRenew: true,
        }
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: session.metadata!.userId,
          type: 'membership',
          title: 'Membership Activated',
          message: `Your ${session.metadata!.tier} membership is now active!`,
          link: '/dashboard',
        }
      });
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }

  return NextResponse.json({ received: true });
}
```

**D. Update Membership Page**
File: `/app/membership/page.tsx` (MODIFY)

Add this function:
```typescript
const handleSubscribe = async (tier: string) => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login?redirect=/membership');
    return;
  }

  try {
    const response = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ tier }),
    });

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    await stripe?.redirectToCheckout({ sessionId });
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

**E. Environment Variables**
Add to `.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**F. Testing Checklist:**
- [ ] User can click "Subscribe" button
- [ ] Redirects to Stripe checkout
- [ ] Payment succeeds in test mode
- [ ] Membership created in database
- [ ] Webhook receives events
- [ ] User sees active membership in dashboard

---

### Task 1.3: Set Up Email Notification System
**Priority**: 🔴 CRITICAL
**Estimated Time**: 2-3 days
**Current Status**: Notifications stored in DB, not sent via email

#### What to Build:

**A. Choose Email Provider**
Recommended: **SendGrid** (100 emails/day free) or **Resend** (3,000/month free)

```bash
npm install @sendgrid/mail
# OR
npm install resend
```

**B. Create Email Service**
File: `/lib/email.ts` (NEW)

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    await sgMail.send({
      to,
      from: process.env.SMTP_FROM || 'noreply@ijaism.com',
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log(`Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

// Email Templates
export const emailTemplates = {
  articleSubmitted: (name: string, title: string, submissionId: string) => ({
    subject: 'Article Submission Received - IJAISM',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Article Submission Received</h2>
        <p>Dear ${name},</p>
        <p>Thank you for submitting your article to IJAISM.</p>
        <p><strong>Article Title:</strong> ${title}</p>
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p>Your article will be assigned to 4 expert reviewers within 7 days. If all 4 reviewers accept your paper, it will be automatically published.</p>
        <p>You can track your submission status in your dashboard.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Dashboard</a>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          IJAISM - International Journal of Advanced Information Systems and Management
        </p>
      </div>
    `,
  }),

  reviewRequest: (reviewerName: string, articleTitle: string, dueDate: string, reviewId: string) => ({
    subject: 'Review Request - IJAISM',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Review Request</h2>
        <p>Dear ${reviewerName},</p>
        <p>You have been invited to review the following article:</p>
        <p><strong>Title:</strong> ${articleTitle}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p>Please log in to your dashboard to accept or decline this review invitation.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reviews/${reviewId}" style="display: inline-block; background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Review Request</a>
      </div>
    `,
  }),

  articlePublished: (authorName: string, articleTitle: string, articleId: string) => ({
    subject: 'Your Article Has Been Published! - IJAISM',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Congratulations! Your Article is Published</h2>
        <p>Dear ${authorName},</p>
        <p>Great news! Your article has been accepted by all 4 reviewers and is now published.</p>
        <p><strong>Article:</strong> ${articleTitle}</p>
        <p>Your article is now live and accessible to the global academic community.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/articles/${articleId}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Published Article</a>
      </div>
    `,
  }),

  membershipActivated: (name: string, tier: string) => ({
    subject: 'Membership Activated - IJAISM',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Welcome to IJAISM ${tier} Membership</h2>
        <p>Dear ${name},</p>
        <p>Your ${tier} membership has been activated successfully!</p>
        <p>You now have access to:</p>
        <ul>
          <li>Unlimited article submissions</li>
          <li>Priority review processing</li>
          <li>Full journal access</li>
          <li>Conference discounts</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Dashboard</a>
      </div>
    `,
  }),
};
```

**C. Update Article Submission API to Send Email**
File: `/app/api/articles/submit/route.ts` (MODIFY)

Add after article creation:
```typescript
import { sendEmail, emailTemplates } from '@/lib/email/send';

// After creating article
const author = await prisma.user.findUnique({
  where: { id: userId },
  select: { name: true, email: true }
});

const template = emailTemplates.articleSubmitted(
  author!.name,
  article.title,
  article.id
);

await sendEmail({
  to: author!.email,
  ...template,
});
```

**D. Update Review System to Send Emails**
File: `/lib/review-system.ts` (MODIFY)

```typescript
import { sendEmail, emailTemplates } from './email';

// In checkAndAutoPublish function, after publishing:
const template = emailTemplates.articlePublished(
  article.author.name,
  article.title,
  article.id
);

await sendEmail({
  to: article.author.email,
  ...template,
});
```

**E. Environment Variables**
```
SENDGRID_API_KEY=SG.your_api_key_here
SMTP_FROM=noreply@ijaism.com
```

**F. Testing Checklist:**
- [ ] Article submission sends confirmation email
- [ ] Publication sends congratulations email
- [ ] Membership activation sends welcome email
- [ ] Emails have correct formatting
- [ ] Links in emails work
- [ ] Unsubscribe links included (optional for MVP)

---

### Task 1.4: Build Reviewer Dashboard and Review Submission
**Priority**: 🔴 CRITICAL
**Estimated Time**: 3-4 days
**Current Status**: Review logic exists, no UI for reviewers

#### What to Build:

**A. Create Reviewer Dashboard Page**
File: `/app/dashboard/reviews/page.tsx` (NEW)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/reviews/my-reviews', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading reviews...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-primary mb-8">My Review Assignments</h1>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">You have no review assignments at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {review.article.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {review.article.abstract}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Journal: {review.article.journal.name}</span>
                      <span>Due: {new Date(review.dueDate).toLocaleDateString()}</span>
                      <span className={`font-semibold ${
                        review.status === 'pending' ? 'text-yellow-600' :
                        review.status === 'completed' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        Status: {review.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    {review.status === 'pending' ? (
                      <Link
                        href={`/dashboard/reviews/${review.id}`}
                        className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded font-semibold"
                      >
                        Start Review
                      </Link>
                    ) : review.status === 'completed' ? (
                      <Link
                        href={`/dashboard/reviews/${review.id}`}
                        className="bg-gray-500 text-white px-6 py-2 rounded font-semibold"
                      >
                        View Review
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**B. Create Review Submission Page**
File: `/app/dashboard/reviews/[id]/page.tsx` (NEW)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  const [review, setReview] = useState<any>(null);
  const [decision, setDecision] = useState<'accept' | 'reject'>('accept');
  const [commentsToAuthor, setCommentsToAuthor] = useState('');
  const [commentsToEditor, setCommentsToEditor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchReview();
  }, []);

  const fetchReview = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/reviews/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setReview(data.review);

    if (data.review.status === 'completed') {
      setDecision(data.review.decision);
      setCommentsToAuthor(data.review.commentsToAuthor || '');
      setCommentsToEditor(data.review.commentsToEditor || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          commentsToAuthor,
          commentsToEditor,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      alert('Review submitted successfully!');
      router.push('/dashboard/reviews');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!review) return <div className="p-8">Loading...</div>;

  const isCompleted = review.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Review Article</h1>

        {/* Article Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {review.article.title}
          </h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p><strong>Journal:</strong> {review.article.journal.name}</p>
            <p><strong>Authors:</strong> {review.article.author.name}</p>
            <p><strong>Submitted:</strong> {new Date(review.article.submittedAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {new Date(review.dueDate).toLocaleDateString()}</p>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-900 mb-2">Abstract</h3>
            <p className="text-gray-700">{review.article.abstract}</p>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-gray-900 mb-2">Keywords</h3>
            <div className="flex gap-2 flex-wrap">
              {review.article.keywords.map((keyword: string, index: number) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Review</h2>

          {/* Decision */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Decision <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="decision"
                  value="accept"
                  checked={decision === 'accept'}
                  onChange={(e) => setDecision(e.target.value as 'accept')}
                  disabled={isCompleted}
                  className="mr-2"
                />
                <span className="text-green-600 font-semibold">Accept</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === 'reject'}
                  onChange={(e) => setDecision(e.target.value as 'reject')}
                  disabled={isCompleted}
                  className="mr-2"
                />
                <span className="text-red-600 font-semibold">Reject</span>
              </label>
            </div>
          </div>

          {/* Comments to Author */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Comments to Author
            </label>
            <textarea
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Provide constructive feedback for the author..."
              value={commentsToAuthor}
              onChange={(e) => setCommentsToAuthor(e.target.value)}
              disabled={isCompleted}
            />
          </div>

          {/* Comments to Editor */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Confidential Comments to Editor
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Private comments for the editor only..."
              value={commentsToEditor}
              onChange={(e) => setCommentsToEditor(e.target.value)}
              disabled={isCompleted}
            />
          </div>

          {/* Submit */}
          {!isCompleted && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          )}

          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-semibold">
                Review submitted on {new Date(review.submittedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
```

**C. Create Review APIs**
File: `/app/api/reviews/my-reviews/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const reviews = await prisma.review.findMany({
      where: {
        reviewerId: decoded.userId,
      },
      include: {
        article: {
          include: {
            author: { select: { name: true } },
            journal: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

File: `/app/api/reviews/[id]/submit/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { submitReviewDecision } from '@/lib/review-system';
import { verifyToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { decision, commentsToAuthor, commentsToEditor } = await req.json();

    // Verify this review belongs to the reviewer
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!review || review.reviewerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Submit review using existing review system
    const result = await submitReviewDecision(
      params.id,
      decision,
      commentsToAuthor,
      commentsToEditor
    );

    return NextResponse.json({
      success: true,
      autoPublishResult: result.autoPublishResult
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**D. Update Dashboard to Show Review Link**
File: `/app/dashboard/page.tsx` (MODIFY)

Add a check for user role and show "My Reviews" link if user is a reviewer.

**E. Testing Checklist:**
- [ ] Reviewer can see assigned reviews
- [ ] Review detail page loads with article info
- [ ] Reviewer can submit accept/reject decision
- [ ] Comments save properly
- [ ] Auto-publish triggers when 4th review submitted
- [ ] Email notifications sent on publication

---

### Task 1.5: Create Basic Admin Panel
**Priority**: 🟡 HIGH
**Estimated Time**: 2-3 days
**Current Status**: No admin interface exists

#### What to Build:

**A. Create Admin Dashboard**
File: `/app/admin/page.tsx` (NEW)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    pendingReviews: 0,
    activeMembers: 0,
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // TODO: Verify admin role
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setStats(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Articles</h3>
            <p className="text-3xl font-bold text-primary">{stats.totalArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Pending Reviews</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingReviews}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Members</h3>
            <p className="text-3xl font-bold text-green-600">{stats.activeMembers}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/articles"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">Manage Articles</h3>
              <p className="text-sm text-gray-600">View and manage all submissions</p>
            </Link>
            <Link
              href="/admin/users"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">Manage Users</h3>
              <p className="text-sm text-gray-600">User roles and permissions</p>
            </Link>
            <Link
              href="/admin/reviews"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">Review Management</h3>
              <p className="text-sm text-gray-600">Assign reviewers and track reviews</p>
            </Link>
            <Link
              href="/admin/announcements"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">Announcements</h3>
              <p className="text-sm text-gray-600">Create and manage announcements</p>
            </Link>
            <Link
              href="/admin/journals"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">Journals</h3>
              <p className="text-sm text-gray-600">Edit journal information</p>
            </Link>
            <Link
              href="/admin/members"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <h3 className="font-bold text-gray-900 mb-2">Memberships</h3>
              <p className="text-sm text-gray-600">View and manage memberships</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**B. Create Admin API Endpoints**
File: `/app/api/admin/stats/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get stats
    const [totalUsers, totalArticles, pendingReviews, activeMembers] = await Promise.all([
      prisma.user.count(),
      prisma.article.count(),
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.membership.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalArticles,
      pendingReviews,
      activeMembers,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**C. Testing Checklist:**
- [ ] Admin can access `/admin` route
- [ ] Non-admin users cannot access admin panel
- [ ] Stats display correctly
- [ ] Quick action links work

---

## 🎯 PHASE 2: Beta Features (1 Week)

After MVP is complete, add these features:

### Task 2.1: Replace Mock Data with Database Queries
- Update homepage to fetch real articles
- Update journal pages to fetch from database
- Update announcements from database
- Add database seeding script

### Task 2.2: Implement Search Functionality
- Add global search bar in header
- Create search API endpoint
- Implement filters (journal, year, author)
- Add search results page

### Task 2.3: User Profile Management
- Create profile edit page
- Add profile picture upload
- Update user information API
- Add password change functionality

---

## 🎯 PHASE 3: Full Launch Features (1 Week)

### Task 3.1: Password Reset Flow
- Create forgot password page
- Generate reset tokens
- Send reset emails
- Create password reset form

### Task 3.2: Email Verification
- Send verification email on registration
- Create email verification endpoint
- Add resend verification option

### Task 3.3: Blog System
- Create blog admin interface
- Add blog post creation form
- Implement blog publishing workflow
- Add blog listing and detail pages

### Task 3.4: Advanced Features
- Conference registration system
- Dissertation submission workflow
- Book submission form
- Analytics dashboard

---

## 📊 Progress Tracking

Track your progress using this checklist:

### MVP Checklist (Phase 1)
- [ ] Article submission saves to database
- [ ] File upload working (manuscripts, cover letters)
- [ ] Stripe checkout integration complete
- [ ] Membership activation working
- [ ] Email notifications sending
- [ ] Reviewer dashboard functional
- [ ] Review submission working
- [ ] Auto-publish triggered correctly
- [ ] Basic admin panel accessible

### Beta Checklist (Phase 2)
- [ ] Mock data replaced with DB queries
- [ ] Search functionality working
- [ ] Profile edit page complete
- [ ] Database seeding implemented

### Launch Checklist (Phase 3)
- [ ] Password reset functional
- [ ] Email verification working
- [ ] Blog system operational
- [ ] All advanced features complete

---

## 🛠️ Development Tips

1. **Test Each Feature Independently**: Don't move to the next task until the current one is fully working.

2. **Use Environment Variables**: Keep all secrets in `.env` file, never commit them.

3. **Database Migrations**: After adding new fields, run:
   ```bash
   npx prisma migrate dev --name feature_name
   ```

4. **Error Handling**: Always include try-catch blocks and meaningful error messages.

5. **TypeScript**: Use proper types to catch errors early.

6. **Testing**: Test in both development and production modes:
   ```bash
   npm run dev  # Development
   npm run build && npm run start  # Production
   ```

---

## 📞 Need Help?

If you get stuck:
1. Check the Prisma docs for database queries
2. Check Next.js docs for API routes
3. Check Stripe docs for payment integration
4. Review existing code in `/lib/review-system.ts` for examples

---

**Let's Get Started!** 🚀

Begin with **Phase 1, Task 1.1** (Article Submission). Each task builds on the previous one, so follow the order for best results.

Good luck building IJAISM into a production-ready platform!
