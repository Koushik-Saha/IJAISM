# Deployment Runbook

## 1. Pre-Deployment Checklist
Before triggering a deployment to production:

- [ ] **Tests Passing**: Ensure all local tests pass (`npm test`) and CI is green.
- [ ] **Environment Variables**: Verify all new env vars are added to Vercel Production settings.
- [ ] **Database Backup**: Confirm the nightly backup ran or trigger a manual backup via GitHub Actions (`.github/workflows/db-backup.yml`).
- [ ] **Migrations**: Check if there are pending Prisma migrations (`npx prisma migrate status`).
- [ ] **Secrets**: Ensure no secrets are hardcoded in the codebase.

## 2. Deployment Steps
The deployment is automated via GitHub Actions (`.github/workflows/cd.yml`).

1. **Merge to Main**:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```
2. **Monitor Action**: Watch the "CD Pipeline" in GitHub Actions tab.
3. **Monitor Vercel**: Watch the deployment build logs in Vercel Dashboard.

## 3. Post-Deployment Verification
Once the deployment is live:

1. **Smoke Test**:
   - Limit: Visit Homepage.
   - Login: Log in as Admin and Author.
   - API: Check `/api/health`.
2. **Sentry Check**: Look for new error spikes in Sentry Dashboard.
3. **Database**: Verify new tables exist (if migration occurred).

## 4. Rollback Procedure
If a critical bug is found:

**Option A: Vercel Rollback (Fastest)**
1. Go to Vercel Dashboard -> Deployments.
2. Find the previous successful deployment.
3. Click three dots -> **Redeploy** (or Instant Rollback).

**Option B: Git Revert (Cleanest)**
1. Revert the bad commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Wait for CD pipeline to deploy the revert.

## 5. Common Issues
- **Migration Failed**: Usually due to data conflict.
  - *Fix*: Connect to DB directly, fix data, or rollback migration locally and fix script.
- **Build Failed**: TypeScript errors or missing dependencies.
  - *Fix*: Check CI logs, fix type errors locally.
- **Environment Variable Missing**: App crashes on startup.
  - *Fix*: Add variable in Vercel Project Settings -> Redeploy.
