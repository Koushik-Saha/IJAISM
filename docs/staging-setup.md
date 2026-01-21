# Staging Environment Setup Guide (Vercel)

## 1. Create Staging Project in Vercel
1. Go to Vercel Dashboard.
2. Click **Add New...** -> **Project**.
3. Import the `c5k-platform` repository.
4. Name the project `c5k-platform-staging`.
5. In **Framework Preset**, select **Next.js**.
6. **Deploy** (Empty or initial deploy).

## 2. Configure Environment Variables (Staging)
In the new `c5k-platform-staging` project settings:
1. Go to **Settings** -> **Environment Variables**.
2. Add all necessary env vars (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, etc.).
3. **Important**: Set a **different** `DATABASE_URL` (point to a separate Staging DB).

## 3. Get Project ID
1. Go to **Settings** -> **General**.
2. Copy **Project ID**.

## 4. Configure GitHub Secrets
In your GitHub Repository Settings -> Secrets and variables -> Actions:
1. Add `VERCEL_PROJECT_ID_STAGING`: Paste the ID from step 3.
2. Add `DATABASE_URL_STAGING`: The Connection String for your Staging DB.

## 5. Workflow
- Push to `develop` branch -> Triggers Staging Deployment.
- Push to `main` branch -> Triggers Production Deployment.
