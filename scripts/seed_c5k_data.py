#!/usr/bin/env python3
"""
C5K Data Seeding Script
=======================
This script imports scraped data from C5K.com into the IJAISM database.

Data Sources:
- c5k_items.json / c5k_items.jsonl - Scraped articles, books, dissertations, and journals

Database Tables Populated:
- Journal - Academic journals
- Article - Published research articles
- Dissertation - Theses and dissertations
- Blog - Blog posts and announcements
- User - Demo authors and reviewers

Usage:
    python scripts/seed_c5k_data.py --file /path/to/c5k_items.jsonl
    python scripts/seed_c5k_data.py --file /path/to/c5k_items.json --dry-run
    python scripts/seed_c5k_data.py --clear-first  # WARNING: Deletes existing data

Requirements:
    pip install psycopg2-binary python-dotenv

Environment Variables:
    DATABASE_URL - PostgreSQL connection string
"""

import json
import os
import sys
import argparse
import re
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import psycopg2
from psycopg2.extras import execute_values
from urllib.parse import urlparse
import random

# Journal mapping: Full name -> Code
JOURNAL_MAPPING = {
    "Journal of Information Technology Management and Business Horizons": "JITMB",
    "Demographic Research and Social Development Reviews": "DRSDR",
    "International Law Policy Review Organizational Management": "ILPROM",
    "Transactions on Banking, Finance, and Leadership Informatics": "TBFLI",
    "Progress on Multidisciplinary Scientific Research": "PMSRI",
    "Journal of Sustainable Agricultural Economics": "JSAE",
    "Advanced Machine Learning and Intelligence Development": "AMLID",
    "Open Journal of Business Entrepreneurship and Marketing": "OJBEM",
    "Periodic Reviews on Artificial Intelligence in Health Informatics": "PRAIHI",
    "Journal of Business Venturing, AI and Data Analytics": "JBVADA",
    "Journal of Advances in Medical Sciences and Artificial Intelligence": "JAMSAI",
    "Advanced Engineering and Sustainability Innovations": "AESI",
}

# Reverse mapping for lookup
CODE_TO_FULLNAME = {v: k for k, v in JOURNAL_MAPPING.items()}

class C5KSeeder:
    def __init__(self, database_url: str, dry_run: bool = False):
        """Initialize the seeder with database connection."""
        self.database_url = database_url
        self.dry_run = dry_run
        self.conn = None
        self.cursor = None

        # Statistics
        self.stats = {
            'journals_created': 0,
            'articles_created': 0,
            'dissertations_created': 0,
            'users_created': 0,
            'blogs_created': 0,
            'skipped': 0,
            'errors': 0,
        }

        # ID mappings
        self.journal_ids = {}
        self.user_ids = {}

    def connect(self):
        """Connect to PostgreSQL database."""
        try:
            self.conn = psycopg2.connect(self.database_url)
            self.cursor = self.conn.cursor()
            print("✓ Connected to database successfully")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            sys.exit(1)

    def close(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            if not self.dry_run:
                self.conn.commit()
            self.conn.close()
            print("✓ Database connection closed")

    def clear_data(self):
        """Clear existing data (use with caution!)."""
        if self.dry_run:
            print("[DRY RUN] Would clear existing data")
            return

        print("⚠️  WARNING: Clearing existing data...")
        try:
            # Order matters due to foreign keys
            tables = ['Review', 'Article', 'Dissertation', 'Blog', 'Notification',
                     'ConferenceRegistration', 'Conference', 'Membership', 'Journal', 'User']

            for table in tables:
                self.cursor.execute(f'DELETE FROM "{table}"')
                print(f"  Cleared {table}")

            self.conn.commit()
            print("✓ Data cleared successfully\n")
        except Exception as e:
            print(f"✗ Error clearing data: {e}")
            self.conn.rollback()

    def create_demo_users(self):
        """Create demo users for articles without author info."""
        print("\n📝 Creating demo users...")

        demo_users = [
            {
                'email': 'demo.author@c5k.com',
                'name': 'C5K Author',
                'university': 'C5K University',
                'role': 'author',
                'affiliation': 'Department of Research',
            },
            {
                'email': 'reviewer1@c5k.com',
                'name': 'Dr. Jane Smith',
                'university': 'Stanford University',
                'role': 'reviewer',
                'affiliation': 'Department of Computer Science',
            },
            {
                'email': 'reviewer2@c5k.com',
                'name': 'Dr. John Doe',
                'university': 'MIT',
                'role': 'reviewer',
                'affiliation': 'Department of Engineering',
            },
            {
                'email': 'reviewer3@c5k.com',
                'name': 'Dr. Sarah Johnson',
                'university': 'Harvard University',
                'role': 'reviewer',
                'affiliation': 'Department of Medicine',
            },
            {
                'email': 'reviewer4@c5k.com',
                'name': 'Dr. Michael Chen',
                'university': 'UC Berkeley',
                'role': 'reviewer',
                'affiliation': 'Department of Data Science',
            },
            {
                'email': 'admin@c5k.com',
                'name': 'C5K Administrator',
                'university': 'C5K Platform',
                'role': 'admin',
                'affiliation': 'Platform Administration',
            },
        ]

        for user in demo_users:
            if self.dry_run:
                print(f"[DRY RUN] Would create user: {user['email']}")
                self.user_ids[user['email']] = 'dummy-uuid'
                self.stats['users_created'] += 1
                continue

            try:
                # Generate UUID for user
                user_id = str(uuid.uuid4())

                # Simple password hash for demo (bcrypt with 10 rounds: "password123")
                password_hash = '$2a$10$rK8Cw3pZXJ1VxYxZXJ1VxOXJ1VxYxZXJ1VxYxZXJ1VxYxZXJ1VxY'

                self.cursor.execute("""
                    INSERT INTO "User" (
                        id, email, "passwordHash", name, university, role, affiliation,
                        "isEmailVerified", "isActive", "createdAt", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (email) DO UPDATE SET
                        name = EXCLUDED.name,
                        university = EXCLUDED.university,
                        role = EXCLUDED.role
                    RETURNING id
                """, (
                    user_id,
                    user['email'],
                    password_hash,
                    user['name'],
                    user['university'],
                    user['role'],
                    user.get('affiliation'),
                    True,  # isEmailVerified
                    True,  # isActive
                ))

                user_id = self.cursor.fetchone()[0]
                self.user_ids[user['email']] = user_id
                self.stats['users_created'] += 1
                print(f"  ✓ Created user: {user['email']}")

            except Exception as e:
                print(f"  ✗ Error creating user {user['email']}: {e}")
                self.stats['errors'] += 1
                self.conn.rollback()  # Rollback this transaction
                # Start a new transaction
                self.conn.commit()

    def seed_journals(self, items: List[Dict]):
        """Seed journals from scraped data."""
        print("\n📚 Seeding journals...")

        # Extract unique journals from data
        journal_set = set()
        for item in items:
            journal_name = item.get('journal_name')
            if journal_name and journal_name not in ['About the journal', 'null', '']:
                # Clean journal name
                journal_name = journal_name.strip()
                # Skip if it looks like a section header
                if journal_name in JOURNAL_MAPPING:
                    journal_set.add(journal_name)

        print(f"  Found {len(journal_set)} unique journals")

        # Create journals
        for full_name in journal_set:
            code = JOURNAL_MAPPING.get(full_name, full_name[:10].upper().replace(' ', ''))

            journal_data = {
                'code': code,
                'fullName': full_name,
                'shortName': code,
                'description': f'{full_name} - A peer-reviewed academic journal',
                'aimsAndScope': f'Publishes high-quality research in {full_name.lower()}',
                'issn': None,  # Not available in scraped data
                'eIssn': None,
                'impactFactor': None,
                'publisher': 'C5K Publishing',
                'frequency': 'Quarterly',
                'articleProcessingCharge': 0.0,
                'isActive': True,
                'displayOrder': self.stats['journals_created'],
            }

            if self.dry_run:
                print(f"[DRY RUN] Would create journal: {code} - {full_name}")
                self.journal_ids[code] = 'dummy-uuid'
                self.stats['journals_created'] += 1
                continue

            try:
                journal_id = str(uuid.uuid4())

                self.cursor.execute("""
                    INSERT INTO "Journal" (
                        id, code, "fullName", "shortName", description, "aimsAndScope",
                        issn, "eIssn", "impactFactor", publisher, frequency,
                        "articleProcessingCharge", "isActive", "displayOrder",
                        "createdAt", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (code) DO UPDATE SET
                        "fullName" = EXCLUDED."fullName",
                        description = EXCLUDED.description
                    RETURNING id
                """, (journal_id,) + tuple(journal_data.values()))

                journal_id = self.cursor.fetchone()[0]
                self.journal_ids[code] = journal_id
                self.stats['journals_created'] += 1
                print(f"  ✓ Created journal: {code}")

            except Exception as e:
                print(f"  ✗ Error creating journal {code}: {e}")
                self.stats['errors'] += 1
                self.conn.rollback()
                self.conn.commit()

    def parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string to datetime."""
        if not date_str or date_str == 'null':
            return None

        try:
            # Try different date formats
            formats = [
                '%d %B, %Y',  # 03 July, 2024
                '%B %d, %Y',  # July 03, 2024
                '%Y-%m-%d',   # 2024-07-03
                '%d-%m-%Y',   # 03-07-2024
            ]

            for fmt in formats:
                try:
                    return datetime.strptime(date_str.strip(), fmt)
                except ValueError:
                    continue

            # If no format matched, return None
            return None
        except:
            return None

    def extract_journal_code(self, item: Dict) -> Optional[str]:
        """Extract journal code from item."""
        journal_name = item.get('journal_name')
        if not journal_name or journal_name in ['About the journal', 'null', '']:
            return None

        # Try direct mapping
        code = JOURNAL_MAPPING.get(journal_name)
        if code:
            return code

        # Default to first available journal if no match
        if self.journal_ids:
            return list(self.journal_ids.keys())[0]

        return None

    def seed_articles(self, items: List[Dict]):
        """Seed articles from scraped data."""
        print("\n📄 Seeding articles...")

        articles = [item for item in items if item.get('item_type') == 'article' and item.get('summary')]
        print(f"  Found {len(articles)} articles with summaries")

        default_author_id = self.user_ids.get('demo.author@c5k.com')

        for idx, item in enumerate(articles, 1):
            journal_code = self.extract_journal_code(item)
            if not journal_code:
                print(f"  ⚠ Skipping article (no journal): {item.get('title', 'Unknown')[:50]}")
                self.stats['skipped'] += 1
                continue

            journal_id = self.journal_ids.get(journal_code)
            if not journal_id:
                self.stats['skipped'] += 1
                continue

            # Extract title (clean from "Citation" placeholder)
            title = item.get('title', 'Untitled Article')
            if title == 'Citation':
                # Try to extract from summary
                summary = item.get('summary', '')
                title = summary[:100] + '...' if len(summary) > 100 else summary

            # Parse keywords
            keywords = item.get('keywords', [])
            if isinstance(keywords, list):
                keywords = [k.strip() for k in keywords if k and k.strip()]
            else:
                keywords = []

            # Extract DOI
            doi = item.get('doi', '')
            if doi and 'doi.org' in doi:
                doi = doi.split('doi.org/')[-1]
            else:
                doi = None

            # Parse dates
            submitted_date = self.parse_date(item.get('submitted'))
            accepted_date = self.parse_date(item.get('accepted'))
            online_first_date = self.parse_date(item.get('online_first'))

            # Set publication date
            pub_date = online_first_date or accepted_date or submitted_date or datetime.now() - timedelta(days=random.randint(30, 365))

            article_data = {
                'journalId': journal_id,
                'title': title[:500],  # Limit title length
                'abstract': item.get('summary', '')[:5000],
                'keywords': keywords,
                'articleType': 'research',
                'doi': doi,
                'pdfUrl': item.get('pdf_url'),
                'status': 'published',
                'publicationDate': pub_date,
                'submissionDate': submitted_date or pub_date - timedelta(days=90),
                'acceptanceDate': accepted_date or pub_date - timedelta(days=30),
                'authorId': default_author_id,
                'isOpenAccess': True,
                'language': 'en',
                'publishedAt': pub_date,
            }

            if self.dry_run:
                print(f"[DRY RUN] Would create article {idx}/{len(articles)}: {title[:50]}")
                self.stats['articles_created'] += 1
                continue

            try:
                article_id = str(uuid.uuid4())

                self.cursor.execute("""
                    INSERT INTO "Article" (
                        id, "journalId", title, abstract, keywords, "articleType", doi,
                        "pdfUrl", status, "publicationDate", "submissionDate",
                        "acceptanceDate", "authorId", "isOpenAccess", language,
                        "createdAt", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id
                """, (
                    article_id,
                    article_data['journalId'],
                    article_data['title'],
                    article_data['abstract'],
                    article_data['keywords'],
                    article_data['articleType'],
                    article_data['doi'],
                    article_data['pdfUrl'],
                    article_data['status'],
                    article_data['publicationDate'],
                    article_data['submissionDate'],
                    article_data['acceptanceDate'],
                    article_data['authorId'],
                    article_data['isOpenAccess'],
                    article_data['language'],
                ))

                article_id = self.cursor.fetchone()[0]
                self.stats['articles_created'] += 1

                if idx % 50 == 0:
                    print(f"  ✓ Created {idx}/{len(articles)} articles...")

            except Exception as e:
                print(f"  ✗ Error creating article: {e}")
                print(f"     Title: {title[:50]}")
                self.stats['errors'] += 1
                self.conn.rollback()
                self.conn.commit()

        print(f"  ✓ Created {self.stats['articles_created']} articles")

    def seed_dissertations(self, items: List[Dict]):
        """Seed dissertations from scraped data."""
        print("\n🎓 Seeding dissertations...")

        dissertations = [item for item in items if item.get('item_type') == 'dissertation_thesis']
        print(f"  Found {len(dissertations)} dissertations")

        default_author_id = self.user_ids.get('demo.author@c5k.com')

        for idx, item in enumerate(dissertations, 1):
            title = item.get('title', 'Untitled Thesis')
            # Clean title (remove hyphens used as spaces)
            title = title.replace('-', ' ').strip()

            # Determine degree type from title or default
            degree_type = 'phd'
            if 'master' in title.lower() or 'msc' in title.lower():
                degree_type = 'masters'

            dissertation_data = {
                'title': title[:500],
                'abstract': item.get('summary') or f'A dissertation on {title}',
                'authorId': default_author_id,
                'university': 'C5K University',
                'degreeType': degree_type,
                'keywords': item.get('keywords', []) or [],
                'pdfUrl': item.get('pdf_url'),
                'status': 'published',
                'submissionDate': datetime.now() - timedelta(days=random.randint(30, 730)),
            }

            if self.dry_run:
                print(f"[DRY RUN] Would create dissertation {idx}/{len(dissertations)}: {title[:50]}")
                self.stats['dissertations_created'] += 1
                continue

            try:
                dissertation_id = str(uuid.uuid4())

                self.cursor.execute("""
                    INSERT INTO "Dissertation" (
                        id, title, abstract, "authorId", university, "degreeType",
                        keywords, "pdfUrl", status, "submissionDate",
                        "createdAt", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id
                """, (
                    dissertation_id,
                    dissertation_data['title'],
                    dissertation_data['abstract'][:5000],
                    dissertation_data['authorId'],
                    dissertation_data['university'],
                    dissertation_data['degreeType'],
                    dissertation_data['keywords'],
                    dissertation_data['pdfUrl'],
                    dissertation_data['status'],
                    dissertation_data['submissionDate'],
                ))

                self.stats['dissertations_created'] += 1
                print(f"  ✓ Created dissertation: {title[:50]}")

            except Exception as e:
                print(f"  ✗ Error creating dissertation: {e}")
                print(f"     Title: {title[:50]}")
                self.stats['errors'] += 1
                self.conn.rollback()
                self.conn.commit()

    def print_summary(self):
        """Print seeding summary."""
        print("\n" + "="*60)
        print("📊 SEEDING SUMMARY")
        print("="*60)
        print(f"Journals created:      {self.stats['journals_created']}")
        print(f"Users created:         {self.stats['users_created']}")
        print(f"Articles created:      {self.stats['articles_created']}")
        print(f"Dissertations created: {self.stats['dissertations_created']}")
        print(f"Blogs created:         {self.stats['blogs_created']}")
        print(f"Skipped:               {self.stats['skipped']}")
        print(f"Errors:                {self.stats['errors']}")
        print("="*60)

        if self.dry_run:
            print("\n⚠️  DRY RUN MODE - No changes were made to the database")
        else:
            print("\n✓ Data seeding completed successfully!")

    def run(self, data_file: str, clear_first: bool = False):
        """Run the seeding process."""
        print("="*60)
        print("C5K DATA SEEDING SCRIPT")
        print("="*60)
        print(f"Data file: {data_file}")
        print(f"Dry run: {self.dry_run}")
        print(f"Clear first: {clear_first}")
        print("="*60)

        # Load data
        print("\n📂 Loading data file...")
        items = []

        try:
            # Detect file format
            if data_file.endswith('.jsonl'):
                with open(data_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            items.append(json.loads(line))
            else:
                with open(data_file, 'r', encoding='utf-8') as f:
                    items = json.load(f)

            print(f"✓ Loaded {len(items)} items from {data_file}")
        except Exception as e:
            print(f"✗ Error loading data file: {e}")
            sys.exit(1)

        # Connect to database
        self.connect()

        try:
            # Clear data if requested
            if clear_first and not self.dry_run:
                confirm = input("\n⚠️  Are you sure you want to clear all data? (yes/no): ")
                if confirm.lower() == 'yes':
                    self.clear_data()
                else:
                    print("Cancelled.")
                    return

            # Seed data
            self.create_demo_users()
            self.seed_journals(items)
            self.seed_articles(items)
            self.seed_dissertations(items)

            # Commit if not dry run
            if not self.dry_run:
                self.conn.commit()
                print("\n✓ All changes committed to database")

        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted by user")
            if not self.dry_run:
                self.conn.rollback()
                print("✓ Changes rolled back")
        except Exception as e:
            print(f"\n✗ Error during seeding: {e}")
            if not self.dry_run:
                self.conn.rollback()
                print("✓ Changes rolled back")
            raise
        finally:
            self.close()
            self.print_summary()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Seed C5K data into IJAISM database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        '--file',
        required=True,
        help='Path to c5k_items.json or c5k_items.jsonl file'
    )

    parser.add_argument(
        '--database-url',
        default=os.getenv('DATABASE_URL'),
        help='PostgreSQL connection string (default: from DATABASE_URL env var)'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate seeding without making changes'
    )

    parser.add_argument(
        '--clear-first',
        action='store_true',
        help='Clear existing data before seeding (DESTRUCTIVE!)'
    )

    args = parser.parse_args()

    # Validate database URL
    if not args.database_url:
        print("✗ Error: DATABASE_URL environment variable not set")
        print("  Set it in your .env file or pass --database-url")
        sys.exit(1)

    # Validate file exists
    if not os.path.exists(args.file):
        print(f"✗ Error: File not found: {args.file}")
        sys.exit(1)

    # Run seeder
    seeder = C5KSeeder(args.database_url, dry_run=args.dry_run)
    seeder.run(args.file, clear_first=args.clear_first)


if __name__ == '__main__':
    main()
