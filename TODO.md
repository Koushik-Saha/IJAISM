# 🚀 C5K Platform - TODO List

**Project:** IJAISM Academic Publishing Platform
**Current Completion:** ~45%
**Target:** Production-Ready MVP
**Estimated Time:** 3-4 weeks

---

## 🚨 PHASE 1: CRITICAL SECURITY (Days 1-2) - DO FIRST!

### Task 1: Remove .env from Git & Rotate All Credentials
**Priority:** 🔴 CRITICAL | **Time:** 1 hour
**Location:** Root directory, `.gitignore`

- Add `.env` to `.gitignore`
- Remove `.env` from git tracking with `git rm --cached .env`
- Rotate Neon database password (visible in current .env)
- Generate new Gmail app password (current one exposed)
- Generate new JWT_SECRET using `openssl rand -base64 64`
- Never commit `.env` file again

---

### Task 2: Configure Environment Variables in Vercel
**Priority:** 🔴 CRITICAL | **Time:** 30 minutes
**Location:** Vercel Dashboard

- Go to Vercel project settings → Environment Variables
- Add all required env vars: DATABASE_URL, JWT_SECRET, SMTP credentials, Stripe keys
- Use different values for Production, Preview, and Development environments
- Test that deployed app reads from Vercel env vars, not local .env

---

### Task 3: Add Rate Limiting to Auth Endpoints
**Priority:** 🔴 CRITICAL | **Time:** 2 hours
**Location:** `lib/rate-limit.ts`, `app/api/auth/*/route.ts`

- Install rate limiting package
- Create rate limiter utility (5 login attempts per 15 minutes)
- Apply to login, register, forgot-password endpoints
- Prevent brute force attacks
- Return 429 status when limit exceeded

---

### Task 4: Configure CORS for API Routes
**Priority:** 🔴 CRITICAL | **Time:** 1 hour
**Location:** `middleware.ts` (create in root)

- Create Next.js middleware file
- Whitelist allowed origins (production domain, localhost)
- Add security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Handle OPTIONS preflight requests
- Force HTTPS in production

---

## 💳 PHASE 2: PAYMENT INTEGRATION (Days 3-5)

### Task 5: Set Up Stripe Payment Integration
**Priority:** 🟠 HIGH | **Time:** 3 hours
**Location:** Stripe Dashboard, `.env`

- Create Stripe account and verify business
- Create 3 products: Basic ($29/mo), Premium ($99/mo), Institutional ($499/mo)
- Get API keys (publishable, secret, webhook secret)
- Add Stripe Price IDs to environment variables
- Test in test mode before going live

---

### Task 6: Implement Stripe Webhook Endpoint
**Priority:** 🟠 HIGH | **Time:** 2 hours
**Location:** `app/api/webhooks/stripe/route.ts`

- Verify webhook signatures for security
- Handle checkout.session.completed (create membership)
- Handle customer.subscription.updated (renew membership)
- Handle customer.subscription.deleted (cancel membership)
- Handle invoice.payment_failed (notify user)
- Test locally using Stripe CLI

---

## ✨ PHASE 3: CORE FEATURES (Days 6-12)

### Task 7: Complete Reviewer Dashboard UI
**Priority:** 🟠 HIGH | **Time:** 4 hours
**Location:** `app/(routes)/dashboard/reviews/page.tsx`

- Create reviewer dashboard page showing assigned reviews
- Display article title, journal, due date, status
- Add review form with accept/reject decision
- Include fields for comments to author and editor
- Show pending vs completed reviews
- Link to review detail pages

---

### Task 8: Implement Automatic Reviewer Assignment
**Priority:** 🟡 MEDIUM | **Time:** 3 hours
**Location:** `app/api/admin/articles/[id]/auto-assign-reviewers/route.ts`

- Create API endpoint to auto-assign 4 reviewers
- Find eligible reviewers (role=reviewer, active=true)
- Filter by expertise/keywords match
- Check reviewer workload (max 5 active reviews)
- Assign reviewers and set due date (21 days)
- Send email notifications to reviewers

---

### Task 9: Build Search Backend
**Priority:** 🟡 MEDIUM | **Time:** 2 hours
**Location:** `app/api/search/route.ts`

- Implement full-text search across title, abstract, keywords
- Add filters: journal, year, article type
- Return paginated results (20 per page)
- Include article metadata, journal, and author info
- Order by relevance and publication date

---

### Task 10: Create Email Templates for All Workflows
**Priority:** 🟠 HIGH | **Time:** 3 hours
**Location:** `lib/email/templates.ts`

- Article submission confirmation email
- Review assignment notification (to reviewers)
- Review submission confirmation
- Article publication notification (with DOI)
- Membership activation/renewal emails
- Payment failure notifications
- Use HTML templates with inline CSS for email compatibility

---

### Task 11: Implement 4-Reviewer Auto-Publish Logic
**Priority:** 🔴 CRITICAL | **Time:** 2 hours
**Location:** `lib/reviews/auto-publish.ts`, `app/api/reviews/[id]/route.ts`

- Check if all 4 reviews are completed after each review submission
- If all 4 reviewers accept → automatically publish article
- Generate DOI for published article
- Update article status to "published"
- Send publication notification to author
- **This is your unique selling point!**

---

### Task 12: Add Input Validation with Zod Schemas
**Priority:** 🟡 MEDIUM | **Time:** 2 hours
**Location:** `lib/validations.ts`

- Create Zod schemas for all API endpoints
- Login/register validation
- Article submission validation (title, abstract word count, keywords count)
- Review submission validation
- Replace manual validation with schema.safeParse()

---

## 🧪 PHASE 4: TESTING (Week 2)

### Task 13: Set Up Jest Testing Framework
**Priority:** 🟡 MEDIUM | **Time:** 1 hour
**Location:** `jest.config.js`, `package.json`

- Install Jest and React Testing Library
- Configure Jest for Next.js with path aliases
- Add test scripts to package.json
- Create `__tests__` folder structure

---

### Task 14: Write Unit Tests for Auth Functions
**Priority:** 🟡 MEDIUM | **Time:** 2 hours
**Location:** `lib/__tests__/auth.test.ts`

- Test JWT token generation and verification
- Test password hashing and comparison
- Test academic email validation
- Aim for 100% code coverage on auth utilities

---

### Task 15: Write API Tests for Article Submission
**Priority:** 🟡 MEDIUM | **Time:** 3 hours
**Location:** `app/api/articles/__tests__/submit.test.ts`

- Test authentication required (401 without token)
- Test field validation (400 for missing fields)
- Test abstract word count (150-300 words)
- Test keywords count (4-7 keywords)
- Test submission limits by membership tier
- Test successful article creation

---

### Task 16: Write Integration Tests for Payment Flow
**Priority:** 🟡 MEDIUM | **Time:** 3 hours
**Location:** `__tests__/integration/payment.test.ts`

- Test Stripe checkout session creation
- Test webhook handling for subscription events
- Test membership creation and updates
- Use Stripe test mode and mock webhooks

---

### Task 17: Set Up Playwright E2E Tests
**Priority:** 🟡 MEDIUM | **Time:** 3 hours
**Location:** `tests/e2e/`, `playwright.config.ts`

- Install Playwright
- Test user registration and email verification flow
- Test article submission end-to-end
- Test reviewer dashboard and review submission
- Run tests in CI pipeline

---

## 🚀 PHASE 5: DEVOPS & CI/CD (Week 3)

### Task 18: Create GitHub Actions CI Workflow
**Priority:** 🟠 HIGH | **Time:** 2 hours
**Location:** `.github/workflows/ci.yml`

- Run on every push and pull request
- Jobs: install dependencies, lint, type check, test, build
- Use Node.js 20.x
- Fail if any step fails

---

### Task 19: Create GitHub Actions CD Workflow
**Priority:** 🟠 HIGH | **Time:** 2 hours
**Location:** `.github/workflows/deploy.yml`

- Trigger on push to main branch
- Run CI tests first
- Deploy to Vercel automatically
- Run database migrations
- Send deployment notifications

---

### Task 20: Set Up Sentry Error Monitoring
**Priority:** 🟠 HIGH | **Time:** 1 hour
**Location:** `sentry.client.config.ts`, `sentry.server.config.ts`

- Create Sentry account
- Install Sentry Next.js SDK
- Configure error tracking for client and server
- Set up alert rules for critical errors
- Test error reporting

---

### Task 21: Implement Database Backup Strategy
**Priority:** 🟠 HIGH | **Time:** 2 hours
**Location:** `scripts/backup-db.sh`

- Create automated backup script using pg_dump
- Store backups in Vercel Blob or S3
- Schedule daily backups (cron job)
- Keep 30 days of backups
- Document restore procedure

---

### Task 22: Create Admin Analytics Dashboard
**Priority:** 🟡 MEDIUM | **Time:** 3 hours
**Location:** `app/(routes)/admin/analytics/page.tsx`

- Display total users, articles, reviews
- Show articles by status (charts)
- Revenue breakdown by membership tier
- Monthly growth metrics
- Use recharts or similar library

---

## 📜 PHASE 6: COMPLIANCE & INFRASTRUCTURE (Week 3-4)

### Task 23: Add GDPR Compliance Features
**Priority:** 🟠 HIGH | **Time:** 4 hours
**Location:** `app/(routes)/privacy/page.tsx`, `app/api/user/*`

- Create privacy policy page
- Add cookie consent banner
- Implement data export API (download all user data as JSON)
- Implement account deletion API (soft delete)
- Add data retention policy documentation

---

### Task 24: Migrate from Gmail SMTP to Resend
**Priority:** 🟡 MEDIUM | **Time:** 2 hours
**Location:** `lib/email/client.ts`

- Create Resend account and verify domain
- Get Resend API key
- Replace Nodemailer with Resend SDK
- Update all email sending functions
- Test all email workflows

---

### Task 25: Create Staging Environment in Vercel
**Priority:** 🟠 HIGH | **Time:** 1 hour
**Location:** Vercel Dashboard

- Create separate Vercel project for staging
- Link to `develop` branch
- Use separate database for staging
- Add environment variables with staging values
- Test deployment pipeline: develop → staging → main → production

---

### Task 26: Set Up Uptime Monitoring
**Priority:** 🟡 MEDIUM | **Time:** 30 minutes
**Location:** External service (UptimeRobot)

- Create UptimeRobot account (free tier)
- Add monitors for homepage, API health check, login endpoint
- Set up email/Slack alerts
- Configure public status page
- Check every 5 minutes

---

### Task 27: Implement File Upload to Cloud Storage
**Priority:** 🟠 HIGH | **Time:** 2 hours
**Location:** `app/api/upload/route.ts`

- Use Vercel Blob (already in dependencies)
- Update upload API to store files in cloud
- Set file size limits (10MB for PDFs)
- Validate file types (PDF only for manuscripts)
- Return public URL for downloads

---

### Task 28: Add Performance Monitoring with Vercel Analytics
**Priority:** 🟡 MEDIUM | **Time:** 30 minutes
**Location:** `app/layout.tsx`

- Import and add Analytics component
- Enable in Vercel dashboard
- Monitor Core Web Vitals (LCP, FID, CLS)
- Track page load times and API response times
- Set performance budgets

---

### Task 29: Create Deployment Runbook Documentation
**Priority:** 🟡 MEDIUM | **Time:** 2 hours
**Location:** `DEPLOYMENT.md`

- Pre-deployment checklist (tests, env vars, DB backup)
- Deployment steps (git tag, push, verify)
- Post-deployment verification (smoke tests, Sentry check)
- Rollback procedure
- Common issues and troubleshooting

---

### Task 30: Conduct Security Audit and Penetration Testing
**Priority:** 🔴 CRITICAL | **Time:** 4 hours
**Location:** Various

- Run `npm audit fix` to patch vulnerabilities
- Test for SQL injection (Prisma should be safe)
- Test for XSS attacks in all form inputs
- Test authentication bypass attempts
- Check git history for exposed secrets
- Verify HTTPS-only in production
- Review all API endpoints for authorization checks

---

## 📊 SUMMARY

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| Security | 4 | 2 days | 🔴 Critical |
| Payments | 2 | 3 days | 🟠 High |
| Core Features | 6 | 1 week | 🟠 High |
| Testing | 5 | 1 week | 🟡 Medium |
| DevOps | 3 | 2 days | 🟠 High |
| Infrastructure | 10 | 1 week | 🟡 Medium |

**Total: 30 tasks over 3-4 weeks**

---

## 🎯 CRITICAL PATH (Must Do First)

1. ✅ Task 1: Remove .env from git (1 hour) - **DO THIS NOW**
2. ✅ Task 2: Configure Vercel env vars (30 min)
3. ✅ Task 3: Rate limiting (2 hours)
4. ✅ Task 5-6: Stripe integration (5 hours)
5. ✅ Task 11: Auto-publish logic (2 hours) - **Your USP!**

---

## 📝 QUICK START

```bash
# Week 1: Security & Payments (Tasks 1-6)
Day 1: Security fixes (Tasks 1-4)
Day 2-3: Stripe setup (Tasks 5-6)

# Week 2: Core Features (Tasks 7-12)
Day 4-5: Reviewer dashboard (Task 7-8)
Day 6-7: Search, emails, auto-publish (Tasks 9-11)

# Week 3: Testing & DevOps (Tasks 13-22)
Day 8-10: Write tests (Tasks 13-17)
Day 11-12: CI/CD and monitoring (Tasks 18-22)

# Week 4: Polish & Deploy (Tasks 23-30)
Day 13-15: Compliance, infrastructure (Tasks 23-28)
Day 16-17: Documentation, security audit (Tasks 29-30)
Day 18: Production deployment 🚀
```

---

## 🚀 DEPLOYMENT READINESS

**Current Score: 4.1/10**

After completing all tasks: **9.5/10** ✅ Production Ready

---

## 📞 SUPPORT

For detailed implementation help on any task, ask for specific task guidance.

Example: "Help me with Task 3 - Rate Limiting" for detailed code and implementation steps.
