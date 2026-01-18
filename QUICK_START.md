# 🚀 Quick Start Guide

## You're Almost Ready to Launch!

Your IJAISM Academic Publishing Platform is built and ready to run. Follow these simple steps:

---

## Step 1: Database Setup (5 minutes)

### Option A: Use PostgreSQL (Recommended)

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS with Homebrew
   brew install postgresql@14
   brew services start postgresql@14

   # Or download from https://www.postgresql.org/
   ```

2. **Create the database**:
   ```bash
   createdb c5k_db
   ```

3. **Update `.env` file** with your credentials:
   ```env
   DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/c5k_db"
   ```

4. **Initialize the database**:
   ```bash
   cd /Users/koushiksaha/Desktop/FixItUp/c5k-platform
   npx prisma generate
   npx prisma migrate dev --name init
   ```

### Option B: Use SQLite (For Quick Testing)

If you want to test immediately without PostgreSQL:

1. **Update `prisma/schema.prisma`**:
   Change line 6 from:
   ```prisma
   provider = "postgresql"
   ```
   to:
   ```prisma
   provider = "sqlite"
   ```

2. **Update `.env`**:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Run migrations**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

---

## Step 2: Start the Development Server

```bash
cd /Users/koushiksaha/Desktop/FixItUp/c5k-platform
npm run dev
```

You should see:
```
▲ Next.js 16.1.3
- Local:    http://localhost:3000
✓ Starting...
✓ Ready in 2.5s
```

---

## Step 3: Open in Browser

Visit: **http://localhost:3000**

---

## 🎉 What You'll See

### Homepage (/)
- Hero banner with CTAs
- Latest announcements
- 12 academic journals carousel
- Latest articles
- Newsletter subscription

### Journal Pages (/journals)
- Browse all 12 journals
- Click any journal to see details

### Article Pages (/articles)
- Browse articles with filters
- Click any article for full details

---

## 🔧 Common Issues & Solutions

### Issue: Port 3000 already in use
```bash
# Kill the process and try again
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Issue: Database connection error
- Make sure PostgreSQL is running: `brew services start postgresql@14`
- Check your DATABASE_URL in `.env`
- Verify database exists: `psql -l | grep c5k_db`

### Issue: Prisma errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

---

## 📊 Adding Sample Data (Optional)

Right now the site uses mock data. To add real data to your database:

### Create a seed file:

**prisma/seed.ts**:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create journals
  await prisma.journal.createMany({
    data: [
      {
        code: 'JITMB',
        fullName: 'Journal of Information Technology and Management in Business',
        description: 'Focuses on the intersection of IT and business management',
        issn: '2456-7890',
        impactFactor: 2.5,
        isActive: true,
      },
      // Add more journals...
    ],
  });

  console.log('✅ Database seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Run the seed:
```bash
npx tsx prisma/seed.ts
```

---

## 🎯 Next Features to Build

1. **User Authentication** (3-4 hours)
   - Login/register pages
   - JWT tokens
   - Protected routes

2. **Article Submission** (4-6 hours)
   - Multi-step form
   - File upload
   - Draft saving

3. **User Dashboard** (2-3 hours)
   - My submissions
   - Profile editing
   - Notifications

4. **Search Functionality** (2-3 hours)
   - Full-text search
   - Filters and sorting
   - Elasticsearch integration

---

## 📚 Documentation

- **README.md** - Full setup guide
- **BUILD_SUMMARY.md** - What was built
- **c5k-clone-project/** - Complete specifications

---

## 🆘 Need Help?

### View Database
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Check Logs
```bash
# Next.js logs appear in your terminal
# Check for errors when running npm run dev
```

### Rebuild Everything
```bash
rm -rf .next node_modules
npm install
npm run dev
```

---

## ✅ Checklist

- [ ] Database created
- [ ] `.env` file updated
- [ ] Prisma client generated
- [ ] Migrations run
- [ ] Dev server started
- [ ] Site opens at http://localhost:3000
- [ ] Can navigate between pages

---

## 🎊 You're Ready!

Once you complete the database setup and start the server, you'll have a fully functional academic publishing platform!

**Happy coding! 🚀**
