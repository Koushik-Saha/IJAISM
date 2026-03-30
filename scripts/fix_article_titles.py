#!/usr/bin/env python3
"""Fix article titles, DOIs, and issue years."""
import os, re, uuid, psycopg2, pdfplumber
from datetime import datetime, timezone

PDF_DIR = "/Users/koushiksaha/Desktop/FixItUp/c5k Database/pdfs"

def connect_db():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb",
        sslmode="require", connect_timeout=60, keepalives=1,
        keepalives_idle=30, keepalives_interval=10, keepalives_count=5,
    )

def clean(t): return re.sub(r'\s+', ' ', t or '').strip()

AUTHOR_PATTERN = re.compile(
    r'\d+[,\*]|,\s*\*|and\s+[A-Z][a-z]+\s+[A-Z]|'
    r'[A-Z][a-z]+\d+[,\*]|[A-Z][a-z]+,\s+[A-Z][a-z]+\d'
)

def extract_clean_title(pdf_path):
    """Extract clean title without author contamination."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            page1 = pdf.pages[0].extract_text() or ""
            lines = [l.strip() for l in page1.split('\n') if l.strip()]

            title_lines = []
            found_type = False
            for line in lines:
                # Start collecting after article type label
                if re.match(r'^(Research Article|Review Article|Case Study|Short Communication|Technical Note|Original Research)$', line, re.I):
                    found_type = True
                    continue

                if not found_type:
                    continue

                # Stop at author lines (contains superscript numbers with commas/stars)
                if AUTHOR_PATTERN.search(line):
                    break
                # Stop at affiliations
                if re.search(r'Department\s+of|University|Institute|College|Hospital', line, re.I):
                    break
                # Stop at email / corresponding author
                if re.search(r'@|Corresponding', line, re.I):
                    break
                # Stop at article info box
                if re.search(r'A\s*R\s*T\s*I\s*C|ARTICLE\s+INFO|Article history', line, re.I):
                    break

                # Title lines: not too short, not starting with numbers
                if len(line) > 5 and not re.match(r'^\d+\.\s', line):
                    title_lines.append(line)

                if len(title_lines) >= 5:
                    break

            if title_lines:
                return clean(" ".join(title_lines))
    except Exception as e:
        print(f"  [ERROR] {e}")
    return None


def extract_own_doi(pdf_path):
    """Extract the article's own C5K DOI (10.63471/...) if it exists."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Check all pages for the c5k DOI
            for page in pdf.pages[:3]:
                text = page.extract_text() or ""
                # Look for c5k-specific DOI format
                m = re.search(r'(?:DOI[:\s]*)?(?:https?://doi\.org/)?(10\.63471/[\w\d]+)', text, re.I)
                if m:
                    doi = m.group(1)
                    return f"https://doi.org/{doi}"
    except:
        pass
    return None


def extract_year_from_pdf(pdf_path):
    """Extract year from PDF Volume/Issue/Year line."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = pdf.pages[0].extract_text() or ""
            m = re.search(r'Volume\s+\d+[,\s]+Issue\s+\d+[,\s]+Year\s+(\d{4})', text, re.I)
            if m:
                return int(m.group(1))
    except:
        pass
    return None


def main():
    print("=== Fix Titles, DOIs, and Issue Years ===\n")

    conn = connect_db()
    conn.autocommit = True
    cur = conn.cursor()

    # Get all articles with their PDF URLs
    cur.execute('SELECT id, "pdfUrl", title, doi, "issueId" FROM "Article"')
    articles = cur.fetchall()

    # Get issue years
    cur.execute('SELECT id, year FROM "JournalIssue"')
    issue_years = {row[0]: row[1] for row in cur.fetchall()}

    title_fixed = 0
    doi_fixed = 0
    year_fixed = 0
    now = datetime.now(timezone.utc).isoformat()

    for art_id, pdf_url, title, doi, issue_id in articles:
        if not pdf_url:
            continue

        pdf_file = os.path.basename(pdf_url)
        pdf_path = os.path.join(PDF_DIR, pdf_file)

        # Handle filename variations
        if not os.path.exists(pdf_path):
            m = re.match(r'^(\d+)', pdf_file)
            if m:
                prefix = m.group(1)
                matches = [f for f in os.listdir(PDF_DIR)
                           if re.match(rf'^{prefix}[_\.]', f) and f.endswith('.pdf')]
                if matches:
                    pdf_path = os.path.join(PDF_DIR, sorted(matches, key=len)[0])

        if not os.path.exists(pdf_path):
            continue

        updates = {}

        # Fix title if it contains author names
        if AUTHOR_PATTERN.search(title) or len(title) > 250:
            new_title = extract_clean_title(pdf_path)
            if new_title and len(new_title) > 5:
                updates['title'] = new_title[:500]
                title_fixed += 1

        # Fix DOI: prefer c5k DOI over external citation DOIs
        if doi and '10.63471/' not in doi:
            own_doi = extract_own_doi(pdf_path)
            if own_doi:
                updates['doi'] = own_doi
                doi_fixed += 1
        elif not doi:
            own_doi = extract_own_doi(pdf_path)
            if own_doi:
                updates['doi'] = own_doi
                doi_fixed += 1

        # Fix issue year if wrong (PDF says 2025 but DB has 2026)
        if issue_id and issue_id in issue_years:
            pdf_year = extract_year_from_pdf(pdf_path)
            if pdf_year and pdf_year != issue_years[issue_id]:
                # Check if there's already an issue with the correct year for this journal
                cur.execute(
                    'SELECT id FROM "JournalIssue" WHERE "journalId" = (SELECT "journalId" FROM "Article" WHERE id = %s) '
                    'AND volume = (SELECT volume FROM "Article" WHERE id = %s) '
                    'AND issue = (SELECT issue FROM "Article" WHERE id = %s) '
                    'AND year = %s LIMIT 1',
                    (art_id, art_id, art_id, pdf_year)
                )
                existing = cur.fetchone()
                if existing:
                    updates['issueId'] = existing[0]
                    year_fixed += 1
                else:
                    # Create new issue with correct year
                    new_issue_id = str(uuid.uuid4())
                    cur.execute(
                        'SELECT "journalId", volume, issue FROM "Article" WHERE id = %s',
                        (art_id,)
                    )
                    jrow = cur.fetchone()
                    if jrow:
                        try:
                            cur.execute(
                                'INSERT INTO "JournalIssue" (id, "journalId", volume, issue, year, "isCurrent", "isSpecial", "createdAt", "updatedAt", "publishedAt") '
                                'VALUES (%s, %s, %s, %s, %s, false, false, %s, %s, %s)',
                                (new_issue_id, jrow[0], jrow[1], jrow[2], pdf_year, now, now, now)
                            )
                            updates['issueId'] = new_issue_id
                            issue_years[new_issue_id] = pdf_year
                            year_fixed += 1
                        except Exception as e:
                            pass  # issue might already exist

        if updates:
            # Build update query
            set_parts = []
            vals = []
            for k, v in updates.items():
                set_parts.append(f'"{k}" = %s')
                vals.append(v)
            set_parts.append('"updatedAt" = %s')
            vals.append(now)
            vals.append(art_id)

            try:
                cur.execute(f'UPDATE "Article" SET {", ".join(set_parts)} WHERE id = %s', vals)
                print(f"  Fixed [{pdf_file[:50]}]: " + ", ".join(
                    f"{k}={'✓' if k!='title' else str(v)[:40]}" for k, v in updates.items()
                ))
            except Exception as e:
                print(f"  [ERROR] Update failed: {e}")

    cur.close()
    conn.close()

    print(f"\nTitles fixed: {title_fixed}")
    print(f"DOIs fixed:   {doi_fixed}")
    print(f"Years fixed:  {year_fixed}")


if __name__ == "__main__":
    main()
