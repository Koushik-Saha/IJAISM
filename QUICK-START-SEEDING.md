# 🚀 Quick Start: Import C5K Data

## Step 1: Install Dependencies

```bash
# Install ts-node if not already installed
npm install --save-dev ts-node

# Or install globally
npm install -g ts-node
```

## Step 2: Dry Run (Preview)

```bash
# See what would be imported (no changes to database)
npm run seed:c5k:dry /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl -- --dry-run
```

**Or use the full command:**
```bash
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl --dry-run
```

## Step 3: Import Data

```bash
# Import all C5K data
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl
```

## Step 4: Verify Import

```bash
# Start the development server
npm run dev

# Visit http://localhost:3000/login
# Email: admin@c5k.com
# Password: password123
```

---

## ⚡ Quick Commands

```bash
# Dry run (preview only)
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl --dry-run

# Import data
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl

# Clear database and re-import (DESTRUCTIVE!)
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl --clear-first
```

---

## 📊 What You'll Get

- **12 Journals** (JITMB, DRSDR, ILPROM, TBFLI, PMSRI, JSAE, AMLID, OJBEM, PRAIHI, JBVADA, JAMSAI, AESI)
- **~680 Articles** (research papers with abstracts, keywords, PDFs)
- **~11 Dissertations** (PhD and Masters theses)
- **6 Demo Users** (admin, author, 4 reviewers)

---

## 🔑 Demo Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@c5k.com | password123 | Admin |
| demo.author@c5k.com | password123 | Author |
| reviewer1@c5k.com | password123 | Reviewer |
| reviewer2@c5k.com | password123 | Reviewer |
| reviewer3@c5k.com | password123 | Reviewer |
| reviewer4@c5k.com | password123 | Reviewer |

---

## ⚠️ Troubleshooting

### "ts-node: command not found"
```bash
npm install --save-dev ts-node @types/node
```

### "Cannot find module"
```bash
npm install
```

### "Database connection failed"
```bash
# Check .env file has DATABASE_URL
# Example: DATABASE_URL="postgresql://user:password@localhost:5432/c5k_platform"
```

### "File not found"
```bash
# Use absolute path
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl
```

---

## 📖 Full Documentation

For detailed documentation, see: [scripts/README-SEEDING.md](scripts/README-SEEDING.md)

---

## ✅ Next Steps

After seeding:

1. Login at http://localhost:3000/login
2. Browse articles at http://localhost:3000/articles
3. Access admin panel at http://localhost:3000/admin
4. Test article submission at http://localhost:3000/submit

**Remember to change demo passwords in production!**
