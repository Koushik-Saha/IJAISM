# C5K Data Seeding Guide

This directory contains scripts to import scraped C5K.com data into your IJAISM database.

## 📋 Overview

You have **two seeding options**:

1. **Python Script** (`seed_c5k_data.py`) - Standalone, uses `psycopg2`
2. **TypeScript Script** (`seed-c5k.ts`) - Uses Prisma, integrates with Next.js

Both scripts do the same thing - choose based on your preference.

---

## 🚀 Quick Start

### Option 1: TypeScript/Prisma (Recommended)

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run dry-run to see what would be imported
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl --dry-run

# 3. Import the data
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl

# 4. (Optional) Clear database and re-seed
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl --clear-first
```

### Option 2: Python

```bash
# 1. Install dependencies
pip install psycopg2-binary python-dotenv

# 2. Set DATABASE_URL in .env file
# DATABASE_URL=postgresql://user:password@localhost:5432/c5k_platform

# 3. Run dry-run
python scripts/seed_c5k_data.py --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl --dry-run

# 4. Import the data
python scripts/seed_c5k_data.py --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl

# 5. (Optional) Clear and re-seed
python scripts/seed_c5k_data.py --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl --clear-first
```

---

## 📊 What Gets Imported

### Journals (12 journals)
- Journal of Information Technology Management and Business Horizons (JITMB)
- Demographic Research and Social Development Reviews (DRSDR)
- International Law Policy Review Organizational Management (ILPROM)
- Transactions on Banking, Finance, and Leadership Informatics (TBFLI)
- Progress on Multidisciplinary Scientific Research (PMSRI)
- Journal of Sustainable Agricultural Economics (JSAE)
- Advanced Machine Learning and Intelligence Development (AMLID)
- Open Journal of Business Entrepreneurship and Marketing (OJBEM)
- Periodic Reviews on Artificial Intelligence in Health Informatics (PRAIHI)
- Journal of Business Venturing, AI and Data Analytics (JBVADA)
- Journal of Advances in Medical Sciences and Artificial Intelligence (JAMSAI)
- Advanced Engineering and Sustainability Innovations (AESI)

### Articles (~680 research articles)
- Title, abstract, keywords
- DOI (if available)
- PDF URLs
- Publication dates
- Journal associations

### Dissertations (~11 theses)
- PhD and Masters theses
- Titles, abstracts
- PDF URLs

### Demo Users (6 users)
- `demo.author@c5k.com` (Author role) - Password: `password123`
- `reviewer1@c5k.com` (Reviewer) - Dr. Jane Smith
- `reviewer2@c5k.com` (Reviewer) - Dr. John Doe
- `reviewer3@c5k.com` (Reviewer) - Dr. Sarah Johnson
- `reviewer4@c5k.com` (Reviewer) - Dr. Michael Chen
- `admin@c5k.com` (Admin) - C5K Administrator

**All demo users have password:** `password123`

---

## 🎯 Command Line Options

### TypeScript Script

```bash
npx ts-node scripts/seed-c5k.ts [OPTIONS]

Options:
  --file <path>       Required. Path to c5k_items.json or c5k_items.jsonl
  --dry-run          Simulate without making changes
  --clear-first      Delete all existing data before seeding (DESTRUCTIVE!)
```

### Python Script

```bash
python scripts/seed_c5k_data.py [OPTIONS]

Options:
  --file <path>           Required. Path to c5k_items.json or c5k_items.jsonl
  --database-url <url>    PostgreSQL connection string (default: from .env)
  --dry-run               Simulate without making changes
  --clear-first           Delete all existing data before seeding (DESTRUCTIVE!)
```

---

## 📁 Data File Format

The scripts accept two file formats:

### JSON Format (`c5k_items.json`)
```json
[
  {
    "source_section": "academic_journal",
    "url": "https://c5k.com/...",
    "title": "Article Title",
    "item_type": "article",
    "summary": "Article abstract...",
    "keywords": ["keyword1", "keyword2"],
    "authors": ["Author Name"],
    "affiliations": "University Name",
    "doi": "https://doi.org/10.xxxx/xxxxx",
    "pdf_url": "https://c5k.com/download-pdf?file=...",
    "submitted": "03 July, 2024",
    "accepted": "12 August, 2024",
    "journal_name": "Journal of Information Technology..."
  }
]
```

### JSONL Format (`c5k_items.jsonl`)
```jsonl
{"source_section": "academic_journal", "title": "Article 1", ...}
{"source_section": "dissertation_thesis", "title": "Thesis 1", ...}
{"source_section": "article", "title": "Article 2", ...}
```

---

## 🔍 Dry Run Mode

**Always run a dry-run first** to see what will be imported:

```bash
# TypeScript
npx ts-node scripts/seed-c5k.ts --file /path/to/c5k_items.jsonl --dry-run

# Python
python scripts/seed_c5k_data.py --file /path/to/c5k_items.jsonl --dry-run
```

Dry run will:
- ✓ Parse the data file
- ✓ Connect to database
- ✓ Show what would be created
- ✗ NOT make any changes
- ✗ NOT commit transactions

---

## ⚠️ Warning: Clear First Option

The `--clear-first` flag **DELETES ALL DATA** from these tables:
- Review
- Article
- Dissertation
- Blog
- Notification
- ConferenceRegistration
- Conference
- Membership
- Journal
- User

**Only use this in development!**

```bash
# TypeScript - will prompt for confirmation
npx ts-node scripts/seed-c5k.ts --file /path/to/data.jsonl --clear-first

# Python - will prompt for confirmation
python scripts/seed_c5k_data.py --file /path/to/data.jsonl --clear-first
```

---

## 📈 Expected Output

```
============================================================
C5K DATA SEEDING SCRIPT
============================================================
Data file: /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl
Dry run: false
Clear first: false
============================================================

📂 Loading data file...
✓ Loaded 986 items from c5k_items.jsonl

✓ Connected to database successfully

📝 Creating demo users...
  ✓ Created user: demo.author@c5k.com
  ✓ Created user: reviewer1@c5k.com
  ✓ Created user: reviewer2@c5k.com
  ✓ Created user: reviewer3@c5k.com
  ✓ Created user: reviewer4@c5k.com
  ✓ Created user: admin@c5k.com

📚 Seeding journals...
  Found 12 unique journals
  ✓ Created journal: JITMB
  ✓ Created journal: DRSDR
  ✓ Created journal: ILPROM
  ... (9 more)

📄 Seeding articles...
  Found 680 articles with summaries
  ✓ Created 50/680 articles...
  ✓ Created 100/680 articles...
  ... (continuing)
  ✓ Created 680 articles

🎓 Seeding dissertations...
  Found 11 dissertations
  ✓ Created dissertation: Evaluation of Credit Performance...
  ✓ Created dissertation: Level of Employee Job Satisfaction...
  ... (9 more)

✓ All changes committed to database

============================================================
📊 SEEDING SUMMARY
============================================================
Journals created:      12
Users created:         6
Articles created:      680
Dissertations created: 11
Blogs created:         0
Skipped:               15
Errors:                0
============================================================

✓ Data seeding completed successfully!
```

---

## 🛠️ Troubleshooting

### Error: "DATABASE_URL not set"
```bash
# Add to .env file
DATABASE_URL="postgresql://user:password@localhost:5432/c5k_platform"
```

### Error: "File not found"
```bash
# Use absolute path
npx ts-node scripts/seed-c5k.ts --file /Users/koushiksaha/Desktop/FixItUp/c5k_items.jsonl
```

### Error: "Connection refused"
```bash
# Ensure PostgreSQL is running
brew services start postgresql  # macOS
sudo service postgresql start   # Linux
```

### Error: "psycopg2 not installed" (Python)
```bash
pip install psycopg2-binary python-dotenv
```

### Error: "ts-node not found" (TypeScript)
```bash
npm install --save-dev ts-node @types/node
```

### Partial Import (Some Items Skipped)
This is normal. Items are skipped if:
- No valid journal name found
- Missing required fields (title, summary)
- Invalid data format

Check the `Skipped` count in the summary. A few skipped items is expected.

---

## 🔄 Re-seeding Data

If you need to re-import data:

```bash
# Option 1: Clear and re-seed
npx ts-node scripts/seed-c5k.ts --file /path/to/data.jsonl --clear-first

# Option 2: Manual deletion then seed
psql $DATABASE_URL -c "DELETE FROM \"Article\";"
psql $DATABASE_URL -c "DELETE FROM \"Journal\";"
psql $DATABASE_URL -c "DELETE FROM \"User\";"
npx ts-node scripts/seed-c5k.ts --file /path/to/data.jsonl
```

---

## 📝 Notes

1. **Demo Users**: All demo users have the password `password123`. Change this in production!

2. **Published Status**: All imported articles are set to `status: "published"` by default.

3. **Author Assignment**: All articles are assigned to `demo.author@c5k.com` since the scraped data doesn't include real author accounts.

4. **DOI Handling**: DOIs are extracted from the format `https://doi.org/10.xxxx/xxxxx` to just `10.xxxx/xxxxx`.

5. **Date Parsing**: Dates are parsed from formats like "03 July, 2024". If parsing fails, a default date is used.

6. **Journal Mapping**: The scripts map C5K journal names to codes. If a journal isn't recognized, articles are assigned to the first available journal.

7. **Duplicate Handling**:
   - Journals use `upsert` (update if exists, create if not)
   - Articles are always created new (no duplicate checking by title)

---

## 🚦 Next Steps After Seeding

1. **Verify Import**
   ```bash
   # Check counts
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Journal\";"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Article\";"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
   ```

2. **Login to Platform**
   - Email: `admin@c5k.com`
   - Password: `password123`
   - Go to: http://localhost:3000/login

3. **Browse Articles**
   - Go to: http://localhost:3000/articles
   - Should see ~680 imported articles

4. **Admin Panel**
   - Go to: http://localhost:3000/admin
   - View statistics and manage content

5. **Change Demo Passwords**
   ```typescript
   // In production, change all demo user passwords!
   ```

---

## 📚 Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **C5K Website**: https://c5k.com/

---

## 🤝 Support

If you encounter issues:

1. Check the error message in the output
2. Verify DATABASE_URL is correct
3. Ensure PostgreSQL is running
4. Try `--dry-run` mode first
5. Check the `Errors` count in summary

For detailed debugging, check:
- Database logs: `/var/log/postgresql/`
- Application logs in console output
- Prisma Studio: `npx prisma studio`

---

**Last Updated**: 2026-01-18
**Scripts Version**: 1.0.0
