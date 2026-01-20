# Security Audit Report

**Date**: 2026-01-20
**Auditor**: Antigravity (AI System)

## 1. Dependency Analysis
- **Tool**: `npm audit`
- **Findings**:
  - Found 2 low severity vulnerabilities in `undici` (via `@vercel/blob`).
  - Action: Ran `npm audit fix --force` to upgrade `@vercel/blob`.
- **Status**: ✅ Clean

## 2. API Security
- **Authentication**: Verified `verifyToken` usage in all protected routes.
- **Authorization**:
  - Admin routes (`/api/admin/*`) enforce `role === 'admin'`.
  - User routes (`/api/user/*`) enforce correct `userId`.
  - Article access (`/api/articles/[id]`) enforces `authorId` match.
- **Public Routes**: Verified intentional public access for Homepage, Login, Register, Health Check, and Public Journal lists.

## 3. Storage Security
- **File Uploads**:
  - Enforced 10MB limit.
  - Restricted Manuscripts to PDF only.
  - Using Vercel Blob (Secure Cloud Storage).

## 4. Database Security
- **Injection Protection**: Using Prisma ORM which parameterizes queries by default.
- **Connection**: Using standard `DATABASE_URL` with SSL implied by neon/Vercel.

## 5. Secrets Management
- **Local**: Using `.env.local` (git-ignored).
- **Production**: Vercel Environment Variables.
- **CI/CD**: GitHub Secrets.
- **Scan**: No hardcoded API keys found in codebase strings.

## 6. Recommendations
1. **Rate Limiting**: Implement rate limiting middleware (e.g., using Vercel KV or Upstash) for Login endpoints to prevent brute force.
2. **CSP**: Add Content Security Policy headers in `next.config.ts`.
3. **Regular Audits**: Schedule this audit monthly.
