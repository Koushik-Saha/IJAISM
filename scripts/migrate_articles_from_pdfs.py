#!/usr/bin/env python3
"""
Comprehensive Article Migration Script
--------------------------------------
1. Scans all PDFs from old database folder
2. Extracts title, authors, affiliations, abstract, keywords, dates, DOI, journal info
3. Matches to journal/issue in new database
4. Clears incorrectly migrated articles
5. Inserts all articles + co-authors with correct mappings
"""

import os
import re
import csv
import json
import uuid
import psycopg2
import pdfplumber
from datetime import datetime, timezone
from typing import Optional

# ─── CONFIG ───────────────────────────────────────────────────────────────────
PDF_DIR = "/Users/koushiksaha/Desktop/FixItUp/c5k Database/pdfs"
ARTICLES_CSV = "/Users/koushiksaha/Desktop/FixItUp/c5k Database/articles.csv"
UPLOAD_BASE_URL = "/uploads/manuscript"

DB_URL = "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=60&application_name=migration"
SYSTEM_USER_ID = "c7355725-5752-426d-a3db-bcfee23289e3"  # mother_admin

# Old volume_id → (journal_slug, issue_number)
VOLUME_MAP = {
    "1":  ("jitmb",  1),
    "2":  ("ojbem",  1),
    "3":  ("praihi", 1),
    "4":  ("jsae",   1),
    "5":  ("jbvada", 1),
    "6":  ("ilprom", 1),
    "7":  ("jamsai", 1),
    "8":  ("aesi",   1),
    "9":  ("tbfli",  1),
    "10": ("amlid",  1),
    "11": ("pmsri",  1),
    "12": ("demographic-research-and-social-development-reviews", 1),
    "15": ("tbfli",  2),
    "16": ("amlid",  2),
    "17": ("jsae",   2),
    "18": ("praihi", 2),
    "19": ("ojbem",  2),
    "20": ("jamsai", 2),
    "21": ("demographic-research-and-social-development-reviews", 2),
    "22": ("jbvada", 2),
    "23": ("jitmb",  2),
}

# Journal name fragments → slug mapping (for PDF header matching)
JOURNAL_NAME_MAP = {
    "periodic reviews on artificial intelligence in health informatics": "praihi",
    "journal of business venturing, ai and data analytics": "jbvada",
    "journal of sustainable agricultural economics": "jsae",
    "open journal of business entrepreneurship and marketing": "ojbem",
    "advances in machine learning, iot and data security": "amlid",
    "journal of information technology management and business horizons": "jitmb",
    "progress on multidisciplinary scientific research and innovation": "pmsri",
    "transactions on banking, finance, and leadership informatics": "tbfli",
    "international law policy review organizational management": "ilprom",
    "demographic research and social development reviews": "demographic-research-and-social-development-reviews",
    "journal of advances in medical sciences and artificial intelligence": "jamsai",
    "advances in engineering and science informatics": "aesi",
    # Short variants
    "praihi": "praihi",
    "jbvada": "jbvada",
    "jsae": "jsae",
    "ojbem": "ojbem",
    "amlid": "amlid",
    "jitmb": "jitmb",
    "pmsri": "pmsri",
    "tbfli": "tbfli",
    "ilprom": "ilprom",
    "jamsai": "jamsai",
    "aesi": "aesi",
}


# ─── PDF EXTRACTION ────────────────────────────────────────────────────────────

def clean_text(t: str) -> str:
    """Normalize whitespace and remove stray characters."""
    if not t:
        return ""
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def extract_pdf_data(pdf_path: str) -> dict:
    """Extract structured data from a single academic PDF."""
    data = {
        "title": None,
        "journal_name": None,
        "journal_slug": None,
        "volume": None,
        "issue": None,
        "year": None,
        "authors_raw": None,
        "authors": [],
        "affiliations": [],
        "abstract": None,
        "keywords": [],
        "doi": None,
        "received_date": None,
        "accepted_date": None,
        "published_date": None,
        "article_type": "Research Article",
        "page_count": 0,
        "full_text": "",
    }

    try:
        with pdfplumber.open(pdf_path) as pdf:
            data["page_count"] = len(pdf.pages)
            all_text = ""
            for page in pdf.pages:
                pt = page.extract_text() or ""
                all_text += pt + "\n"
            data["full_text"] = all_text[:5000]  # store first 5000 chars

            # Work with first page primarily
            page1 = pdf.pages[0].extract_text() or ""
            lines = [l.strip() for l in page1.split('\n') if l.strip()]

            # ── Extract journal name (usually first 1-3 lines) ──────────────
            journal_candidate = []
            for line in lines[:5]:
                if len(line) > 10 and not re.match(r'^(Volume|Issue|Year|website|Research|Review|Article)', line, re.I):
                    journal_candidate.append(line)
                else:
                    break
            if journal_candidate:
                raw_journal = " ".join(journal_candidate)
                # Remove common artifacts like fi -> fi
                raw_journal = raw_journal.replace("fi", "fi").replace("Artifi cial", "Artificial")
                raw_journal = clean_text(raw_journal)
                data["journal_name"] = raw_journal
                # Map to slug
                lower = raw_journal.lower()
                for key, slug in JOURNAL_NAME_MAP.items():
                    if key in lower:
                        data["journal_slug"] = slug
                        break

            # ── Extract volume/issue/year ────────────────────────────────────
            for line in lines[:10]:
                m = re.search(r'Volume\s+(\d+)[,\s]+Issue\s+(\d+)[,\s]+Year\s+(\d{4})', line, re.I)
                if m:
                    data["volume"] = int(m.group(1))
                    data["issue"] = int(m.group(2))
                    data["year"] = int(m.group(3))
                    break

            # ── Extract article type ─────────────────────────────────────────
            for line in lines[:15]:
                if re.match(r'^(Research Article|Review Article|Case Study|Short Communication|Technical Note|Original Research)', line, re.I):
                    data["article_type"] = line.strip()
                    break

            # ── Extract title ────────────────────────────────────────────────
            # Title is usually a large text block after article type, before authors
            title_lines = []
            found_type = False
            for i, line in enumerate(lines):
                if re.match(r'^(Research Article|Review Article|Case Study|Short Communication|Technical Note|Original Research)', line, re.I):
                    found_type = True
                    continue
                if found_type:
                    # Title ends when we hit authors (pattern: Name1,*, Name2,)
                    if re.search(r'\d[\s]*$|^\d+[A-Z]|Department of|University|Institute|@', line):
                        break
                    if len(line) > 10:
                        title_lines.append(line)
                    if len(title_lines) >= 4:
                        break
            if title_lines:
                data["title"] = clean_text(" ".join(title_lines))

            # ── Extract authors ──────────────────────────────────────────────
            # Authors line: "Name1*, Name2, Name3" followed by affiliations with numbers
            author_section_start = None
            for i, line in enumerate(lines):
                # Author line pattern: words separated by commas, with superscript numbers
                if re.search(r'[A-Z][a-z]+\s+[A-Z][a-z]+.*\d[\*,]|[A-Z][a-z]+\s+[A-Z][a-z]+.*,\s*\*', line):
                    # Make sure it's not an affiliation line
                    if not re.search(r'Department|University|Institute|College|School|Hospital|@', line, re.I):
                        data["authors_raw"] = line
                        author_section_start = i
                        break

            # Parse individual author names
            if data["authors_raw"]:
                # Remove superscript numbers and asterisks
                authors_clean = re.sub(r'\d+[,\*]*|[\*]', '', data["authors_raw"])
                # Split by comma
                author_names = [a.strip() for a in authors_clean.split(',') if a.strip() and len(a.strip()) > 2]
                # Filter out non-name fragments
                author_names = [a for a in author_names if re.search(r'[A-Za-z]{2,}', a) and len(a) < 80]
                data["authors"] = author_names

            # ── Extract affiliations ─────────────────────────────────────────
            if author_section_start is not None:
                affils = []
                for line in lines[author_section_start+1:author_section_start+10]:
                    if re.search(r'Department|University|Institute|College|School|Hospital', line, re.I):
                        affils.append(clean_text(line))
                    elif re.match(r'^\*', line):
                        affils.append(clean_text(line))
                    elif re.search(r'A R T I C|ARTICLE|ABSTRACT|Keywords', line, re.I):
                        break
                data["affiliations"] = affils

            # ── Extract DOI ──────────────────────────────────────────────────
            # Match proper DOIs: 10.XXXXX/suffix format
            doi_match = re.search(r'DOI:\s*(https?://doi\.org/10\.\d{4,}/[\w./\-]+|10\.\d{4,}/[\w./\-]+)', all_text, re.I)
            if doi_match:
                raw_doi = doi_match.group(1).strip()
                if raw_doi.startswith("10."):
                    raw_doi = "https://doi.org/" + raw_doi
                data["doi"] = raw_doi
            else:
                doi_match2 = re.search(r'https?://doi\.org/(10\.\d{4,}/[\w./\-]+)', all_text)
                if doi_match2:
                    data["doi"] = "https://doi.org/" + doi_match2.group(1).strip()

            # ── Extract keywords ─────────────────────────────────────────────
            kw_match = re.search(r'Keywords?[\s:\n]+([^\n]+(?:\n[^\n]+){0,3}?)(?=\n\s*\n|\nA B S T R A C T|\nABSTRACT)', all_text, re.I | re.DOTALL)
            if kw_match:
                kw_text = clean_text(kw_match.group(1))
                # Split on commas or semicolons
                keywords = [k.strip().rstrip('.') for k in re.split(r'[,;]', kw_text) if k.strip()]
                data["keywords"] = [k for k in keywords if len(k) < 100 and len(k) > 1][:15]

            # Also check the ARTICLE INFO box
            if not data["keywords"]:
                kw_match2 = re.search(r'Keywords?[:\s]+(.+?)(?=\n\n|\nA B|Corresponding|DOI)', all_text, re.I | re.DOTALL)
                if kw_match2:
                    kw_text = clean_text(kw_match2.group(1))
                    keywords = [k.strip().rstrip('.') for k in re.split(r'[,;]', kw_text) if k.strip()]
                    data["keywords"] = [k for k in keywords if len(k) < 100 and len(k) > 1][:15]

            # ── Extract abstract ─────────────────────────────────────────────
            # Look for ABSTRACT section
            abs_patterns = [
                r'A B S T R A C T\s*\n([\s\S]+?)(?=\n\s*DOI|\n\s*\d+\.\s+[A-Z]|\n\s*Introduction)',
                r'ABSTRACT\s*\n([\s\S]+?)(?=\n\s*DOI|\n\s*\d+\.\s+[A-Z]|\n\s*Introduction)',
                r'Abstract\s*\n([\s\S]+?)(?=\n\s*DOI|\n\s*\d+\.\s+[A-Z]|\n\s*Introduction)',
                r'A B S T R A C T\s+([\s\S]{100,800})(?=DOI:)',
            ]
            for pat in abs_patterns:
                abs_match = re.search(pat, all_text, re.DOTALL)
                if abs_match:
                    abstract = clean_text(abs_match.group(1))
                    if len(abstract) > 100:
                        data["abstract"] = abstract[:3000]
                        break

            # Fallback: get text from the right column of page 1 (ABSTRACT area)
            if not data["abstract"]:
                # Try to find a large paragraph block on page 1
                paragraphs = re.split(r'\n\s*\n', page1)
                for para in paragraphs:
                    p = clean_text(para)
                    if len(p) > 200 and not re.search(r'Department|University|Journal|Volume|Issue|DOI:', p[:100]):
                        data["abstract"] = p[:3000]
                        break

            # ── Extract dates ────────────────────────────────────────────────
            date_text = all_text[:2000]
            received = re.search(r'(\d{1,2}\s+\w+\s+\d{4})\s*\(Received\)|Received[)\s:]+(\d{1,2}\s+\w+\s+\d{4})', date_text, re.I)
            if received:
                date_str = received.group(1) or received.group(2)
                data["received_date"] = parse_date(date_str)

            accepted = re.search(r'(\d{1,2}\s+\w+\s+\d{4})\s*\(Accepted\)|Accepted[)\s:]+(\d{1,2}\s+\w+\s+\d{4})', date_text, re.I)
            if accepted:
                date_str = accepted.group(1) or accepted.group(2)
                data["accepted_date"] = parse_date(date_str)

            published = re.search(r'(\d{1,2}\s+\w+\s+\d{4})\s*\(Published\s*Online?\)|Published[)\s:]+(\d{1,2}\s+\w+\s+\d{4})', date_text, re.I)
            if published:
                date_str = published.group(1) or published.group(2)
                data["published_date"] = parse_date(date_str)

    except Exception as e:
        print(f"  [ERROR] Failed to extract from {os.path.basename(pdf_path)}: {e}")

    return data


def parse_date(date_str: str) -> Optional[str]:
    """Parse various date formats to ISO datetime string."""
    if not date_str:
        return None
    date_str = date_str.strip()
    formats = [
        "%d %b %Y", "%d %B %Y",
        "%B %d, %Y", "%b %d, %Y",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            continue
    return None


def get_journal_slug_from_doi(doi: str) -> Optional[str]:
    """Extract journal code from DOI like 'https://doi.org/10.63471/praihi24001'."""
    if not doi:
        return None
    m = re.search(r'10\.\d+/([a-zA-Z]+)\d+', doi)
    if m:
        slug = m.group(1).lower()
        # Map variants
        slug_variants = {
            "jitmbh": "jitmb",
            "amlids": "amlid",
            "drsdr": "demographic-research-and-social-development-reviews",
        }
        return slug_variants.get(slug, slug)
    return None


# ─── CSV PARSING ───────────────────────────────────────────────────────────────

def parse_articles_csv() -> dict:
    """Parse articles.csv and return a dict keyed by file_path."""
    articles = {}
    try:
        with open(ARTICLES_CSV, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                fp = (row.get('file_path') or '').strip()
                if fp:
                    articles[fp] = row
    except Exception as e:
        print(f"[WARN] Could not read articles.csv: {e}")
    return articles


# ─── DATABASE OPERATIONS ───────────────────────────────────────────────────────

def connect_db():
    """Connect to the PostgreSQL database."""
    conn = psycopg2.connect(
        "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb",
        sslmode="require",
        connect_timeout=60,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )
    return conn


def get_journal_map(cursor) -> dict:
    """Return {code: id} for all journals."""
    cursor.execute('SELECT id, code FROM "Journal"')
    return {row[1].lower(): row[0] for row in cursor.fetchall()}


def get_issue_map(cursor) -> dict:
    """Return {(journal_id, volume, issue): id} for all journal issues."""
    cursor.execute('SELECT id, "journalId", volume, issue FROM "JournalIssue"')
    result = {}
    for row in cursor.fetchall():
        key = (row[1], row[2], row[3])
        if key not in result:  # take first if duplicates
            result[key] = row[0]
    return result


def get_existing_dois(cursor) -> set:
    """Return set of DOIs already in the database."""
    cursor.execute('SELECT doi FROM "Article" WHERE doi IS NOT NULL')
    return {row[0] for row in cursor.fetchall()}


def clear_all_articles(cursor):
    """Delete all articles and coauthors from the database."""
    try:
        cursor.execute('DELETE FROM "CoAuthor"')
        print("  ✓ Deleted CoAuthors")
    except Exception as e:
        print(f"  [WARN] CoAuthor delete: {e}")
    try:
        cursor.execute('DELETE FROM "ActivityLog"')
        print("  ✓ Deleted ActivityLogs")
    except Exception as e:
        print(f"  [WARN] ActivityLog delete: {e}")
    try:
        cursor.execute('DELETE FROM "ReviewerInvitation"')
        print("  ✓ Deleted ReviewerInvitations")
    except Exception as e:
        print(f"  [WARN] ReviewerInvitation delete: {e}")
    try:
        cursor.execute('DELETE FROM "Review"')
        print("  ✓ Deleted Reviews")
    except Exception as e:
        print(f"  [WARN] Review delete: {e}")
    try:
        cursor.execute('DELETE FROM "Article"')
        print("  ✓ Deleted Articles")
    except Exception as e:
        print(f"  [WARN] Article delete: {e}")


def find_or_create_issue(journal_id: str, volume: int, issue: int, year: int, issue_map: dict) -> Optional[str]:
    """Find existing issue or create a new one."""
    key = (journal_id, volume, issue)
    if key in issue_map:
        return issue_map[key]
    # Create new issue with its own connection
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    try:
        conn = connect_db()
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(
            '''INSERT INTO "JournalIssue" (id, "journalId", volume, issue, year, "isCurrent", "isSpecial", "createdAt", "updatedAt", "publishedAt")
               VALUES (%s, %s, %s, %s, %s, false, false, %s, %s, %s)''',
            (new_id, journal_id, volume, issue, year, now, now, now)
        )
        cur.close()
        conn.close()
        issue_map[key] = new_id
        print(f"  ✓ Created new JournalIssue: vol{volume} iss{issue} year{year}")
    except Exception as e:
        print(f"  [WARN] Could not create issue: {e}")
        return None
    return new_id


def insert_article(cursor, article_data: dict) -> Optional[str]:
    """Insert a single article and return its new ID."""
    article_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    try:
        cursor.execute(
            '''INSERT INTO "Article" (
                id, "journalId", "issueId", title, abstract, keywords,
                "articleType", doi, volume, issue,
                "publicationDate", "submissionDate", "acceptanceDate",
                status, "pdfUrl", language, "isOpenAccess",
                "authorId", "fullText",
                "citationCount", "viewCount", "downloadCount",
                "isApcPaid", "isBestPaper", "resubmissionCount",
                "createdAt", "updatedAt"
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s,
                0, 0, 0,
                false, false, 0,
                %s, %s
            )''',
            (
                article_id,
                article_data["journal_id"],
                article_data.get("issue_id"),
                article_data["title"][:500] if article_data["title"] else "Untitled",
                article_data.get("abstract") or "",
                article_data.get("keywords") or [],
                article_data.get("article_type") or "Research Article",
                article_data.get("doi"),
                article_data.get("volume"),
                article_data.get("issue"),
                article_data.get("published_date"),
                article_data.get("received_date"),
                article_data.get("accepted_date"),
                "published",
                article_data.get("pdf_url"),
                "en",
                True,
                SYSTEM_USER_ID,
                article_data.get("full_text", "")[:5000],
                now,
                now,
            )
        )
        return article_id
    except Exception as e:
        print(f"  [ERROR] Failed to insert article '{str(article_data.get('title',''))[:60]}': {e}")
        return None


def insert_coauthors(cursor, article_id: str, authors: list, affiliations: list):
    """Insert co-authors for an article."""
    for i, name in enumerate(authors):
        if not name or len(name.strip()) < 2:
            continue
        author_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        # Try to match affiliation by number
        affil = affiliations[i] if i < len(affiliations) else (affiliations[0] if affiliations else None)
        # Extract university from affiliation
        university = None
        if affil:
            u_match = re.search(r'(University|Institute|College|School|Hospital)[^,\n]*', affil, re.I)
            if u_match:
                university = clean_text(u_match.group(0))[:200]

        try:
            cursor.execute(
                '''INSERT INTO "CoAuthor" (id, "articleId", name, university, "isMain", "order", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                (author_id, article_id, name.strip()[:200], university, i == 0, i,
                 datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat())
            )
        except Exception as e:
            print(f"    [WARN] Failed to insert coauthor '{name}': {e}")


# ─── MAIN MIGRATION ────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  ARTICLE MIGRATION FROM PDFs")
    print("=" * 60)

    # 1. Parse articles.csv for supplementary data (volume_id, paper_id, etc.)
    print("\n[1] Loading articles.csv...")
    csv_articles = parse_articles_csv()
    print(f"  Found {len(csv_articles)} articles in CSV")

    # Build lookup by ID number in filename
    csv_by_id = {}
    for fp, row in csv_articles.items():
        m = re.match(r'^(\d+)_', fp)
        if m:
            csv_by_id[m.group(1)] = row

    # 2. Scan PDFs
    print("\n[2] Scanning PDFs...")
    pdf_files = sorted([
        f for f in os.listdir(PDF_DIR) if f.lower().endswith('.pdf')
    ])
    # Deduplicate: if two PDFs have same number prefix, keep shorter name
    seen_ids = {}
    unique_pdfs = []
    for f in pdf_files:
        m = re.match(r'^(\d+)_', f)
        if m:
            num = m.group(1)
            if num not in seen_ids:
                seen_ids[num] = f
                unique_pdfs.append(f)
            else:
                # Keep the one with shorter filename (cleaner name)
                if len(f) < len(seen_ids[num]):
                    unique_pdfs.remove(seen_ids[num])
                    seen_ids[num] = f
                    unique_pdfs.append(f)
        else:
            unique_pdfs.append(f)

    print(f"  Found {len(unique_pdfs)} unique PDFs to process")

    # 3. Connect to DB
    print("\n[3] Connecting to database...")
    conn = connect_db()
    conn.autocommit = True  # auto-commit for initial ops
    cursor = conn.cursor()
    print("  ✓ Connected")

    # 4. Load DB state
    journal_map = get_journal_map(cursor)  # {code: id}
    issue_map = get_issue_map(cursor)       # {(journal_id, vol, iss): id}
    print(f"  Journals in DB: {len(journal_map)}")
    print(f"  Issues in DB: {len(issue_map)}")

    # 5. Clear existing articles
    print("\n[4] Clearing existing articles (they were incorrectly migrated)...")
    clear_all_articles(cursor)
    cursor.close()
    conn.close()

    # 6. Process each PDF
    print("\n[5] Processing PDFs and inserting articles...")
    inserted = 0
    failed = 0
    skipped = 0

    for pdf_file in unique_pdfs:
        pdf_path = os.path.join(PDF_DIR, pdf_file)
        article_num = re.match(r'^(\d+)', pdf_file)
        article_num = article_num.group(1) if article_num else None

        print(f"\n  → [{article_num}] {pdf_file[:70]}")

        # Extract data from PDF
        pdf_data = extract_pdf_data(pdf_path)

        # Get CSV row for supplementary data
        csv_row = csv_by_id.get(article_num, {})

        # ── Determine journal slug ────────────────────────────────────────────
        journal_slug = None

        # Priority 1: From DOI (most reliable)
        doi = pdf_data.get("doi") or (csv_row.get("doi") or "").strip()
        if doi:
            journal_slug = get_journal_slug_from_doi(doi)

        # Priority 2: From paper_id in CSV
        if not journal_slug and csv_row.get("paper_id"):
            paper_id = csv_row["paper_id"].strip()
            m = re.match(r'^([a-zA-Z-]+)', paper_id)
            if m:
                raw = m.group(1).lower()
                variants = {"jitmbh": "jitmb", "amlids": "amlid", "drsdr": "demographic-research-and-social-development-reviews"}
                journal_slug = variants.get(raw, raw)

        # Priority 3: From PDF journal name
        if not journal_slug:
            journal_slug = pdf_data.get("journal_slug")

        if not journal_slug:
            print(f"    [SKIP] Could not determine journal")
            skipped += 1
            continue

        journal_id = journal_map.get(journal_slug)
        if not journal_id:
            print(f"    [SKIP] Journal '{journal_slug}' not found in DB")
            skipped += 1
            continue

        # ── Determine issue ───────────────────────────────────────────────────
        volume = pdf_data.get("volume") or 1
        issue = pdf_data.get("issue") or 1
        year = pdf_data.get("year") or 2024

        # Override with volume map if CSV has volume_id
        vol_id = (csv_row.get("volume_id") or "").strip()
        if vol_id and vol_id in VOLUME_MAP:
            mapped_slug, mapped_issue = VOLUME_MAP[vol_id]
            issue = mapped_issue

        issue_id = find_or_create_issue(journal_id, volume, issue, year, issue_map)

        # ── Build title ───────────────────────────────────────────────────────
        title = pdf_data.get("title") or (csv_row.get("title") or "").strip()
        if not title or len(title) < 5:
            # Derive from filename
            name = os.path.splitext(pdf_file)[0]
            title = re.sub(r'^\d+_', '', name).replace('_', ' ')
            title = re.sub(r'\s+', ' ', title).strip()[:300]

        # ── Build abstract ────────────────────────────────────────────────────
        abstract = pdf_data.get("abstract") or (csv_row.get("description") or "").strip()

        # ── Build keywords ────────────────────────────────────────────────────
        keywords = pdf_data.get("keywords") or []
        if not keywords and csv_row.get("keyword"):
            raw_kw = csv_row["keyword"].strip()
            keywords = [k.strip() for k in re.split(r'[,;]', raw_kw) if k.strip()][:15]

        # ── Build dates ───────────────────────────────────────────────────────
        received_date = pdf_data.get("received_date") or parse_date(csv_row.get("submited_date") or "")
        accepted_date = pdf_data.get("accepted_date") or parse_date(csv_row.get("accepted_date") or "")
        published_date = pdf_data.get("published_date") or parse_date(csv_row.get("updated_at") or "")

        # ── Build PDF URL ─────────────────────────────────────────────────────
        pdf_url = f"{UPLOAD_BASE_URL}/{pdf_file}"

        # ── Insert article ────────────────────────────────────────────────────
        article_data = {
            "journal_id": journal_id,
            "issue_id": issue_id,
            "title": title,
            "abstract": abstract,
            "keywords": keywords,
            "article_type": pdf_data.get("article_type") or "Research Article",
            "doi": doi or None,
            "volume": volume,
            "issue": issue,
            "published_date": published_date,
            "received_date": received_date,
            "accepted_date": accepted_date,
            "pdf_url": pdf_url,
            "full_text": pdf_data.get("full_text", "")[:5000],
        }

        # Use a fresh connection per insert to avoid SSL timeouts
        try:
            conn2 = connect_db()
            conn2.autocommit = False
            cur2 = conn2.cursor()
            # Sync issue_map state into this connection if new issues were created
            article_id = insert_article(cur2, article_data)
            if not article_id:
                conn2.rollback()
                cur2.close()
                conn2.close()
                failed += 1
                continue

            # ── Insert co-authors ─────────────────────────────────────────────────
            authors = pdf_data.get("authors") or []
            if not authors and csv_row.get("author_name"):
                raw_authors = csv_row["author_name"].strip().strip("'\"")
                authors = [a.strip() for a in re.split(r',(?![^(]*\))', raw_authors) if a.strip()]

            affiliations = pdf_data.get("affiliations") or []
            if authors:
                insert_coauthors(cur2, article_id, authors, affiliations)

            conn2.commit()
            cur2.close()
            conn2.close()
        except Exception as e:
            print(f"    [ERROR] DB error: {e}")
            try:
                conn2.rollback()
                cur2.close()
                conn2.close()
            except:
                pass
            failed += 1
            continue

        print(f"    ✓ Inserted: journal={journal_slug}, vol={volume}, iss={issue}, authors={len(authors)}, kw={len(keywords)}")
        inserted += 1

    print("\n" + "=" * 60)
    print(f"  MIGRATION COMPLETE")
    print(f"  Inserted: {inserted}")
    print(f"  Failed:   {failed}")
    print(f"  Skipped:  {skipped}")
    print(f"  Total PDFs: {len(unique_pdfs)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
