# 🚀 IJAISM Platform - Vercel Deployment Guide

This guide will help you deploy the IJAISM Academic Publishing Platform to Vercel for production.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Set up a production database (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket
4. **Environment Variables**: Prepare your production environment variables

---

## 🔧 Step 1: Prepare Your Database

### Option A: Using Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project named "ijaism-production"
3. Copy the connection string (format: `postgresql://username:password@host/database`)
4. Run migrations:
   ```bash
   # Set DATABASE_URL to your production database
   export DATABASE_URL="postgresql://username:password@host/database"

   # Run Prisma migrations
   npx prisma migrate deploy

   # Generate Prisma client
   npx prisma generate
   ```

### Option B: Using Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Project Settings > Database
3. Copy the "Connection string" (Transaction pooler recommended)
4. Run migrations as shown above

---

## 🌐 Step 2: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Add Environment Variables**:
   Click "Environment Variables" and add:

   ```
   DATABASE_URL = postgresql://username:password@host/database
   NEXTAUTH_SECRET = [Generate with: openssl rand -base64 32]
   NEXTAUTH_URL = https://your-project.vercel.app
   JWT_SECRET = your-super-secret-jwt-key
   JWT_EXPIRES_IN = 1h
   NEXT_PUBLIC_APP_URL = https://your-project.vercel.app
   NEXT_PUBLIC_APP_NAME = IJAISM
   NODE_ENV = production
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your site will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   # First deployment (preview)
   vercel

   # Production deployment
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add NEXTAUTH_URL production
   ```

---

## 🔐 Step 3: Configure Environment Variables in Vercel

### Required Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL | `https://ijaism.vercel.app` |
| `JWT_SECRET` | JWT signing secret | Your secure random string |
| `NODE_ENV` | Environment mode | `production` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://ijaism.vercel.app` |

### Optional Variables (for full features):

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `SMTP_HOST` | Email server host | Email notifications |
| `SMTP_PORT` | Email server port | Email notifications |
| `SMTP_USER` | Email username | Email notifications |
| `SMTP_PASSWORD` | Email password | Email notifications |
| `AWS_ACCESS_KEY_ID` | AWS access key | File uploads to S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | File uploads to S3 |
| `AWS_BUCKET_NAME` | S3 bucket name | File uploads to S3 |

### How to Add Environment Variables:

1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the left sidebar
4. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environments**: Select "Production" (and "Preview" if needed)
5. Click "Save"

---

## 🔄 Step 4: Custom Domain (Optional)

### Add Your Own Domain:

1. Go to Project Settings > Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `ijaism.com`)
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` environment variable to your custom domain

### DNS Configuration:

For your domain provider, add these DNS records:

**A Record**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record** (for www):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## ✅ Step 5: Post-Deployment Checklist

After deployment, verify:

- [ ] Site loads at production URL
- [ ] Logo and branding display correctly
- [ ] PWA manifest loads (check `/manifest.json`)
- [ ] Service worker registers (check browser DevTools > Application > Service Workers)
- [ ] Database connection works (test login/register)
- [ ] All pages render correctly
- [ ] Mobile responsiveness works
- [ ] SSL certificate is active (HTTPS)

---

## 🔍 Troubleshooting

### Build Fails

**Error**: `Type error: ...`
- **Solution**: Run `npm run build` locally first to catch TypeScript errors
- Fix all type errors before deploying

**Error**: `Module not found`
- **Solution**: Ensure all dependencies are in `package.json`
- Run `npm install` to verify

### Database Connection Issues

**Error**: `Can't reach database server`
- **Solution**:
  1. Verify `DATABASE_URL` is correct
  2. Check database server is running and accessible
  3. Ensure IP whitelist includes Vercel IPs (if using IP restrictions)

### Environment Variables Not Working

**Error**: Variables undefined in production
- **Solution**:
  1. Re-check variable names (no typos)
  2. Ensure variables are added to "Production" environment
  3. Redeploy after adding variables

---

## 🔄 Continuous Deployment

Vercel automatically redeploys when you push to your Git repository:

```bash
# Make changes
git add .
git commit -m "Update feature X"
git push origin main

# Vercel automatically deploys!
```

### Deployment Branches:

- **Production**: Pushes to `main` branch → Production deployment
- **Preview**: Pushes to other branches → Preview deployment

---

## 📊 Monitoring & Analytics

### Vercel Analytics:

1. Go to Project > Analytics
2. View:
   - Page views
   - User locations
   - Performance metrics
   - Core Web Vitals

### Logs:

1. Go to Project > Deployments
2. Click on a deployment
3. Click "View Function Logs"
4. Monitor runtime errors and API calls

---

## 🔐 Security Best Practices

1. **Never commit `.env` files**:
   ```bash
   # .gitignore should include:
   .env
   .env.local
   .env.production
   ```

2. **Generate strong secrets**:
   ```bash
   openssl rand -base64 32
   ```

3. **Use environment variables** for all sensitive data

4. **Enable HTTPS only** (Vercel does this automatically)

5. **Keep dependencies updated**:
   ```bash
   npm audit
   npm update
   ```

---

## 📱 PWA Deployment Verification

After deployment, test PWA functionality:

1. **Desktop (Chrome)**:
   - Open DevTools > Application > Manifest
   - Verify manifest loads
   - Click "Install app" button in address bar

2. **Mobile (iOS Safari)**:
   - Open site in Safari
   - Tap Share button
   - Tap "Add to Home Screen"

3. **Mobile (Android Chrome)**:
   - Open site in Chrome
   - Tap menu (⋮)
   - Tap "Install app" or "Add to Home screen"

---

## 🎯 Performance Optimization

### Image Optimization:

Vercel automatically optimizes images via Next.js Image component. Ensure you're using:

```tsx
import Image from "next/image";

<Image src="/logo.svg" alt="Logo" width={200} height={50} />
```

### Caching:

Service worker caches static assets. Update version in `/public/sw.js` when deploying major changes:

```javascript
const CACHE_NAME = 'ijaism-v2'; // Increment version
```

---

## 📞 Support

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [Next.js Documentation](https://nextjs.org/docs)
3. Review deployment logs in Vercel dashboard
4. Check browser console for client-side errors

---

## 🎉 Success!

Your IJAISM platform is now live in production! 🚀

**Next Steps**:
- Share your production URL
- Configure email notifications
- Set up file upload storage (AWS S3)
- Add custom domain
- Enable monitoring and analytics
- Promote your platform to the academic community

---

**Deployment Status**: Ready for Production ✅
**Platform**: IJAISM - International Journal of Advanced Information Systems and Management
**Last Updated**: January 2026
