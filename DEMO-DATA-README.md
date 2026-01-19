# 🌱 Demo Data Seeding Guide

## Overview

This script seeds realistic demo data into your IJAISM database for the user account **koushik.saha.517@my.csun.edu**.

## What Gets Created

### 1. **User Account** ✅
- **Email**: koushik.saha.517@my.csun.edu
- **Password**: password123
- **Name**: Koushik Saha
- **Role**: Author
- **University**: California State University, Northridge
- **Affiliation**: Department of Computer Science

### 2. **Blog Posts** (5 Articles) ✅
- "The Future of Academic Publishing in the Digital Age"
- "Best Practices for Writing Research Papers"
- "Understanding the Peer Review Process"
- "Top 10 Research Tools Every Academic Should Know"
- "Navigating Academic Conferences: A First-Timer's Guide"

All with full content, realistic view counts, and professional featured images.

### 3. **Conferences** (5 Conferences) ✅
- **International Conference on AI and Machine Learning 2026** (Hybrid)
- **IEEE International Symposium on Information Systems** (In-person)
- **Global Summit on Business Intelligence** (Virtual)
- **ACM Conference on Human-Computer Interaction** (Hybrid)
- **International Workshop on Educational Technology** (Completed)

### 4. **Conference Registrations** (3 Registrations) ✅
- Registered for 3 upcoming conferences
- Payment status: Completed
- Registration type: Academic
- Payment amount: $450 each

### 5. **Membership** (1 Premium Membership) ✅
- **Tier**: Premium
- **Status**: Active
- **Valid**: Jan 1, 2025 - Dec 31, 2026
- **Auto-renew**: Enabled
- Includes Stripe subscription ID

### 6. **Notifications** (8 Notifications) ✅
- Article submission updates
- Review requests
- Conference confirmations
- Membership renewals
- Mix of read and unread notifications

### 7. **Reviews** (5 Reviews) ✅
- **3 Completed reviews** with detailed feedback
- **1 In-progress review**
- **1 Pending review**
- Realistic comments to authors and editors
- Various decision outcomes (accept, revisions needed)

---

## 🚀 How to Run

### Option 1: Basic Run (Keeps Existing Data)
```bash
npx ts-node scripts/seed-demo-data.ts
```

### Option 2: Fresh Start (Clears Demo Data First)
```bash
npx ts-node scripts/seed-demo-data.ts --clear-first
```

**Warning**: `--clear-first` will delete:
- All blogs
- All conferences and registrations
- Membership for the user
- Notifications for the user
- Reviews by the user

---

## 📊 Expected Output

```
============================================================
🌱 DEMO DATA SEEDING SCRIPT
============================================================
User: koushik.saha.517@my.csun.edu
Clear first: false
============================================================

👤 Ensuring user account exists...
✓ User account ready: koushik.saha.517@my.csun.edu

📝 Creating blog posts...
  ✓ Created blog: The Future of Academic Publishing in the Digital...
  ✓ Created blog: Best Practices for Writing Research Papers...
  ✓ Created blog: Understanding the Peer Review Process...
  ✓ Created blog: Top 10 Research Tools Every Academic Should Kno...
  ✓ Created blog: Navigating Academic Conferences: A First-Timer'...
✓ Created 5 blog posts

🎤 Creating conferences...
  ✓ Created conference: International Conference on Artificial Intelligence and...
  ✓ Created conference: IEEE International Symposium on Information Systems Ma...
  ✓ Created conference: Global Summit on Business Intelligence and Data Scienc...
  ✓ Created conference: ACM Conference on Human-Computer Interaction...
  ✓ Created conference: International Workshop on Educational Technology and L...
✓ Created 5 conferences

🎫 Creating conference registrations...
  ✓ Registered for conference
  ✓ Registered for conference
  ✓ Registered for conference
✓ Created 3 conference registrations

💳 Creating membership...
  ✓ Created premium membership (valid until Dec 31, 2026)

🔔 Creating notifications...
✓ Created 8 notifications

📋 Creating reviews...
  ✓ Created review (completed)
  ✓ Created review (completed)
  ✓ Created review (completed)
  ✓ Created review (in_progress)
  ✓ Created review (pending)
✓ Created 5 reviews

============================================================
📊 DEMO DATA SEEDING SUMMARY
============================================================
User:                  koushik.saha.517@my.csun.edu
Blogs created:         5
Conferences created:   5
Registrations:         3
Membership:            Premium (Active)
Notifications:         8
Reviews:               5
============================================================

✓ Demo data seeding completed successfully!

📝 Next steps:
1. Login with: koushik.saha.517@my.csun.edu / password123
2. Visit dashboard to see your data
3. Check notifications, reviews, and conferences
4. Browse blog posts on the homepage
```

---

## 🧪 Testing the Data

### 1. Login
```
URL: http://localhost:3000/login
Email: koushik.saha.517@my.csun.edu
Password: password123
```

### 2. Check Dashboard
```
URL: http://localhost:3000/dashboard
- Should show your membership status (Premium)
- Should display recent notifications
- Should show submission and review statistics
```

### 3. View Notifications
```
URL: http://localhost:3000/dashboard/notifications
- Should show 8 notifications
- Mix of read and unread
- Various types (submissions, reviews, messages)
```

### 4. View Reviews
```
URL: http://localhost:3000/dashboard/reviews
- Should show 5 reviews
- 3 completed, 1 in-progress, 1 pending
- Detailed review comments visible
```

### 5. View Conferences
```
URL: http://localhost:3000/conferences
- Should show 5 conferences
- 3 with "Registered" badge
- Different types (virtual, hybrid, in-person)
```

### 6. View Blog Posts
```
URL: http://localhost:3000 (homepage)
- Blog posts visible in the blogs section
- Click to read full articles
- Each has realistic content and formatting
```

### 7. Check Membership
```
URL: http://localhost:3000/membership
- Should show Premium membership
- Valid until Dec 31, 2026
- Auto-renew enabled
```

---

## 📁 Data Details

### Blog Post Content

All blog posts include:
- **Full markdown-formatted content** (2000-5000 words)
- **Professional featured images** from Unsplash
- **Realistic view counts** (100-1000 views)
- **Publication dates** (spread over last 60 days)
- **SEO-friendly slugs**
- **Excerpts** for preview

Topics covered:
- Academic publishing trends
- Research writing techniques
- Peer review process
- Research tools and software
- Conference networking

### Conference Details

Each conference includes:
- Full description (150-300 words)
- Specific dates and venues
- Registration and submission deadlines
- Conference type (virtual/hybrid/in-person)
- Website URLs
- Geographic location

### Review Content

Reviews include:
- **Detailed comments to authors** (200-500 words)
- **Confidential comments to editors**
- **Structured feedback** (strengths, weaknesses, suggestions)
- **Decision recommendations** (accept, reject, revise)
- **Realistic timelines** (assigned date, due date, submission date)

### Notification Types

1. **submission_update**: Article status changes
2. **review_request**: Review assignments
3. **message**: General system messages

Each notification:
- Has a clear title and message
- Links to relevant page
- Has read/unread status
- Timestamped appropriately

---

## 🔧 Customization

### Change User Details

Edit lines 28-48 in `scripts/seed-demo-data.ts`:

```typescript
const user = await prisma.user.upsert({
  where: { email: USER_EMAIL },
  create: {
    email: USER_EMAIL,
    name: 'Your Name Here',        // Change name
    university: 'Your University', // Change university
    affiliation: 'Your Department', // Change department
    bio: 'Your bio here...',       // Change bio
    // ... rest of the fields
  },
});
```

### Add More Blogs

Add new blog objects to the `blogs` array (line 67):

```typescript
{
  title: 'Your Blog Title',
  slug: 'your-blog-slug',
  excerpt: 'Short description...',
  content: 'Full markdown content...',
  featuredImageUrl: 'https://your-image-url.com',
  status: 'published',
  publishedAt: new Date(),
}
```

### Add More Conferences

Add new conference objects to the `conferences` array (line 260):

```typescript
{
  title: 'Your Conference Title',
  description: 'Conference description...',
  startDate: new Date('2026-XX-XX'),
  endDate: new Date('2026-XX-XX'),
  venue: 'Venue name',
  city: 'City',
  country: 'Country',
  conferenceType: 'hybrid', // or 'virtual' or 'in_person'
  status: 'upcoming',
}
```

### Modify Membership Tier

Edit line 409 in `scripts/seed-demo-data.ts`:

```typescript
tier: 'basic',  // Options: 'free', 'basic', 'premium', 'institutional'
```

---

## 🗃️ Database Schema Reference

### Blog
- id, title, slug, content, excerpt
- featuredImageUrl, authorId, status
- publishedAt, viewCount, createdAt

### Conference
- id, title, description
- startDate, endDate, venue, city, country
- websiteUrl, registrationUrl
- submissionDeadline, notificationDate
- conferenceType, status

### ConferenceRegistration
- id, conferenceId, userId
- registrationType, paymentStatus
- paymentAmount, stripePaymentId

### Membership
- id, userId, tier, status
- startDate, endDate, autoRenew
- stripeSubscriptionId

### Notification
- id, userId, type, title, message
- link, isRead, readAt, createdAt

### Review
- id, articleId, reviewerId
- reviewerNumber, round, status
- decision, commentsToAuthor
- commentsToEditor, assignedAt
- dueDate, submittedAt

---

## ⚠️ Important Notes

1. **Password**: Default password is `password123` - change in production!

2. **Stripe IDs**: Generated IDs are random strings for demo purposes

3. **Article Dependencies**: Reviews need published articles to exist

4. **Unique Constraints**: Script handles existing data gracefully

5. **Idempotent**: Safe to run multiple times (use `--clear-first` for clean slate)

---

## 🐛 Troubleshooting

### Error: "User email already exists"
This is normal - the script uses `upsert` to handle existing users.

### Error: "No published articles found"
Run the main seeding script first:
```bash
npx ts-node scripts/seed-c5k.ts --file /path/to/c5k_items.jsonl
```

### Error: "Unique constraint failed on slug"
Use `--clear-first` to remove existing blogs:
```bash
npx ts-node scripts/seed-demo-data.ts --clear-first
```

### Reviews not showing up
Make sure you have published articles in the database first.

---

## 🎯 Use Cases

### Development
- Test UI components with realistic data
- Verify notification system
- Test review workflow
- Check membership features

### Demo/Presentation
- Showcase platform capabilities
- Present to stakeholders
- User acceptance testing
- Training new users

### Testing
- Test data migration
- Verify database relationships
- Performance testing with realistic content
- End-to-end testing scenarios

---

## 🔄 Cleanup

### Remove All Demo Data
```bash
npx ts-node scripts/seed-demo-data.ts --clear-first
# Then don't run the seeding part
```

### Remove Specific Tables
Use Prisma Studio or SQL:
```bash
npx prisma studio
# Navigate to tables and delete manually
```

### Reset Entire Database
```bash
npx prisma migrate reset
# Warning: This deletes ALL data!
```

---

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Seeding Guide**: https://www.prisma.io/docs/guides/database/seed-database
- **TypeScript Best Practices**: https://www.typescriptlang.org/docs/

---

## ✅ Checklist

After running the script, verify:

- [ ] User can login with koushik.saha.517@my.csun.edu
- [ ] Dashboard shows correct membership (Premium)
- [ ] 8 notifications visible
- [ ] 5 reviews visible in reviews page
- [ ] 3 conference registrations visible
- [ ] 5 blog posts visible on homepage
- [ ] All data looks realistic and professional

---

## 🎉 Success!

You now have a fully populated demo account with realistic data across all major features of the IJAISM platform.

**Created**: 2026-01-19
**Version**: 1.0.0
**Status**: ✅ Production ready
