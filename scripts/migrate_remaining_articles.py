#!/usr/bin/env python3
"""
Fix remaining failed/skipped articles after initial migration.
Targets: 79, 80, 83, 86, 89, 90, 91, 96
"""
import os
import re
import uuid
import psycopg2
import pdfplumber
from datetime import datetime, timezone
from typing import Optional

PDF_DIR = "/Users/koushiksaha/Desktop/FixItUp/c5k Database/pdfs"
UPLOAD_BASE_URL = "/uploads/manuscript"
SYSTEM_USER_ID = "c7355725-5752-426d-a3db-bcfee23289e3"

# PDFs to process
TARGET_IDS = ["79", "80", "83", "86", "89", "90", "91", "96"]

JOURNAL_SLUG_MAP = {
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
}


def connect_db():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb",
        sslmode="require", connect_timeout=60, keepalives=1,
        keepalives_idle=30, keepalives_interval=10, keepalives_count=5,
    )


def clean_text(t):
    return re.sub(r'\s+', ' ', t or '').strip()


def parse_date(date_str):
    if not date_str:
        return None
    date_str = date_str.strip()
    formats = ["%d %b %Y", "%d %B %Y", "%B %d, %Y", "%b %d, %Y",
               "%Y-%m-%d", "%d %b, %Y", "%d %B, %Y",
               "%d %b. %Y", "%B %Y"]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            continue
    return None


def extract_pdf(pdf_path):
    data = {
        "title": None, "journal_slug": None, "volume": 1, "issue": 1, "year": 2024,
        "authors": [], "affiliations": [], "abstract": None, "keywords": [],
        "doi": None, "received_date": None, "accepted_date": None, "published_date": None,
        "article_type": "Research Article", "page_count": 0,
    }
    try:
        with pdfplumber.open(pdf_path) as pdf:
            data["page_count"] = len(pdf.pages)
            all_text = "".join(p.extract_text() or "" for p in pdf.pages)
            page1 = pdf.pages[0].extract_text() or ""
            lines = [l.strip() for l in page1.split('\n') if l.strip()]

            # Journal name (first non-empty lines before Volume/Issue)
            jname_lines = []
            for line in lines[:8]:
                # Stop at clear metadata lines
                if re.match(r'(Volume\s+\d|Issue\s+\d|Year\s+\d|website:|Website:|"Volume)', line, re.I):
                    break
                # Stop at article-type labels (full phrases only)
                if re.match(r'^(Research Article|Review Article|Case Study|Short Communication|Technical Note|Original Research)$', line, re.I):
                    break
                if len(line) > 3:
                    jname_lines.append(line)
            if jname_lines:
                jname = clean_text(" ".join(jname_lines))
                jname = jname.replace("fi", "fi").replace("Artifi cial", "Artificial")
                # Normalize spaces around commas for matching
                lower = re.sub(r'\s*,\s*', ', ', jname.lower())
                for key, slug in JOURNAL_SLUG_MAP.items():
                    if key in lower:
                        data["journal_slug"] = slug
                        break

            # Volume/issue/year
            for line in lines[:12]:
                m = re.search(r'Volume\s+(\d+)[,\s]+Issue\s+(\d+)[,\s]+Year\s+(\d{4})', line, re.I)
                if m:
                    data["volume"] = int(m.group(1))
                    data["issue"] = int(m.group(2))
                    data["year"] = int(m.group(3))
                    break

            # Article type
            for line in lines[:15]:
                if re.match(r'^(Research Article|Review Article|Case Study|Short Communication|Technical Note)', line, re.I):
                    data["article_type"] = line.strip()
                    break

            # Title
            title_lines = []
            found_type = False
            for line in lines:
                if re.match(r'^(Research Article|Review Article|Case Study|Short Communication|Technical Note)', line, re.I):
                    found_type = True
                    continue
                if found_type:
                    if re.search(r'\d\s*$|Department|University|Institute|@', line):
                        break
                    if len(line) > 5:
                        title_lines.append(line)
                    if len(title_lines) >= 5:
                        break
            if title_lines:
                data["title"] = clean_text(" ".join(title_lines))

            # Authors
            for i, line in enumerate(lines):
                if (re.search(r'[A-Z][a-z]+\s+[A-Z][a-z]+.*\d[\*,]|[A-Z][a-z]+\s+[A-Z][a-z]+.*,\s*\*', line)
                        and not re.search(r'Department|University|Institute|@', line, re.I)):
                    authors_clean = re.sub(r'\d+[,\*]*|[\*]', '', line)
                    names = [a.strip() for a in authors_clean.split(',') if a.strip() and len(a.strip()) > 2]
                    data["authors"] = [n for n in names if re.search(r'[A-Za-z]{2,}', n) and len(n) < 80]
                    # Affiliations follow
                    affils = []
                    for al in lines[i+1:i+12]:
                        if re.search(r'Department|University|Institute|College', al, re.I):
                            affils.append(clean_text(al))
                        elif re.search(r'A R T I C|ABSTRACT|Keywords|Corresponding', al, re.I):
                            break
                    data["affiliations"] = affils
                    break

            # DOI - only match proper format 10.XXXXX/...
            doi_m = re.search(r'(?:DOI:\s*)?(https?://doi\.org/10\.\d{4,}/[\w./\-]+|10\.\d{4,}/[\w./\-]+)', all_text, re.I)
            if doi_m:
                raw = doi_m.group(1).strip()
                if raw.startswith("10."):
                    raw = "https://doi.org/" + raw
                # Validate: must not be just "https://doi.org/https"
                if re.search(r'10\.\d{4,}/', raw):
                    data["doi"] = raw

            # Keywords
            kw_m = re.search(r'Keywords?[:\s]+(.+?)(?=\nA B S T R A C T|\nABSTRACT|\nAbstract|\n\n)', all_text, re.I | re.DOTALL)
            if kw_m:
                kw_text = clean_text(kw_m.group(1))
                kws = [k.strip().rstrip('.') for k in re.split(r'[,;]', kw_text) if k.strip()]
                data["keywords"] = [k for k in kws if 1 < len(k) < 100][:15]

            # Abstract
            for pat in [
                r'A B S T R A C T\s*\n([\s\S]{100,2000}?)(?=\n\s*DOI|\n\s*\d+\.\s+[A-Z]|\n\s*Introduction)',
                r'ABSTRACT\s*\n([\s\S]{100,2000}?)(?=\n\s*DOI|\n\s*\d+\.\s+[A-Z]|\n\s*Introduction)',
                r'Abstract\s*\n([\s\S]{100,2000}?)(?=\n\s*DOI|\n\s*\d+\.\s+[A-Z]|\n\s*Introduction)',
            ]:
                m = re.search(pat, all_text, re.DOTALL)
                if m:
                    abs_text = clean_text(m.group(1))
                    if len(abs_text) > 100:
                        data["abstract"] = abs_text[:3000]
                        break

            # Dates
            text2k = all_text[:2500]
            for label, field in [("Received", "received_date"), ("Accepted", "accepted_date"), ("Published", "published_date")]:
                m = re.search(rf'(\d{{1,2}}\s+\w+[,\s]+\d{{4}})\s*\({label}|{label}[)\s:]+(\d{{1,2}}\s+\w+[,\s]+\d{{4}})', text2k, re.I)
                if m:
                    ds = m.group(1) or m.group(2)
                    data[field] = parse_date(ds.strip())

    except Exception as e:
        print(f"  [ERROR] {e}")
    return data


def main():
    print("=== Fix Remaining Articles ===\n")

    # Get journal map
    conn = connect_db()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute('SELECT id, code FROM "Journal"')
    journal_map = {row[1].lower(): row[0] for row in cur.fetchall()}
    cur.execute('SELECT id, "journalId", volume, issue FROM "JournalIssue"')
    issue_map = {}
    for row in cur.fetchall():
        key = (row[1], row[2], row[3])
        if key not in issue_map:
            issue_map[key] = row[0]
    cur.close()
    conn.close()

    inserted = 0
    failed = 0

    for pdf_id in TARGET_IDS:
        # Find matching PDF file
        matching = [f for f in os.listdir(PDF_DIR)
                    if re.match(rf'^{pdf_id}[_\.]', f) and f.endswith('.pdf')]
        if not matching:
            print(f"[{pdf_id}] No PDF found")
            continue
        pdf_file = sorted(matching, key=len)[0]  # shortest name
        pdf_path = os.path.join(PDF_DIR, pdf_file)
        print(f"[{pdf_id}] {pdf_file[:70]}")

        d = extract_pdf(pdf_path)

        # Determine journal
        slug = d.get("journal_slug")
        if not slug:
            print(f"  [SKIP] No journal slug found")
            failed += 1
            continue

        journal_id = journal_map.get(slug)
        if not journal_id:
            print(f"  [SKIP] Journal '{slug}' not in DB")
            failed += 1
            continue

        # Find issue
        key = (journal_id, d["volume"], d["issue"])
        issue_id = issue_map.get(key)
        if not issue_id:
            # Create new issue
            new_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            try:
                c = connect_db()
                c.autocommit = True
                cr = c.cursor()
                cr.execute(
                    '''INSERT INTO "JournalIssue" (id, "journalId", volume, issue, year, "isCurrent", "isSpecial", "createdAt", "updatedAt", "publishedAt")
                       VALUES (%s, %s, %s, %s, %s, false, false, %s, %s, %s)''',
                    (new_id, journal_id, d["volume"], d["issue"], d["year"], now, now, now)
                )
                cr.close()
                c.close()
                issue_id = new_id
                issue_map[key] = new_id
                print(f"  Created issue vol{d['volume']} iss{d['issue']} yr{d['year']}")
            except Exception as e:
                print(f"  [WARN] Issue creation: {e}")

        # Build title
        title = d.get("title") or ""
        if len(title) < 5:
            title = re.sub(r'^\d+[_\.]', '', os.path.splitext(pdf_file)[0]).replace('_', ' ')

        # Insert article
        art_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        pdf_url = f"{UPLOAD_BASE_URL}/{pdf_file}"
        try:
            c = connect_db()
            c.autocommit = False
            cr = c.cursor()
            cr.execute(
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
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,
                    0,0,0,false,false,0,%s,%s
                )''',
                (art_id, journal_id, issue_id,
                 title[:500], d.get("abstract") or "",
                 d.get("keywords") or [],
                 d.get("article_type") or "Research Article",
                 d.get("doi"),
                 d["volume"], d["issue"],
                 d.get("published_date"), d.get("received_date"), d.get("accepted_date"),
                 "published", pdf_url, "en", True,
                 SYSTEM_USER_ID, "",
                 now, now)
            )
            # Insert coauthors
            for i, name in enumerate(d.get("authors") or []):
                if not name or len(name.strip()) < 2:
                    continue
                affs = d.get("affiliations") or []
                affil = affs[i] if i < len(affs) else (affs[0] if affs else None)
                univ = None
                if affil:
                    um = re.search(r'(University|Institute|College|School)[^,\n]*', affil, re.I)
                    if um:
                        univ = um.group(0)[:200]
                cr.execute(
                    '''INSERT INTO "CoAuthor" (id, "articleId", name, university, "isMain", "order", "createdAt", "updatedAt")
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s)''',
                    (str(uuid.uuid4()), art_id, name.strip()[:200], univ, i==0, i, now, now)
                )
            c.commit()
            cr.close()
            c.close()
            print(f"  ✓ journal={slug}, vol={d['volume']}, iss={d['issue']}, authors={len(d.get('authors',[]))}, doi={d.get('doi')}")
            inserted += 1
        except Exception as e:
            print(f"  [ERROR] {e}")
            try: c.rollback(); cr.close(); c.close()
            except: pass
            failed += 1

    print(f"\nDone. Inserted: {inserted}, Failed: {failed}")


if __name__ == "__main__":
    main()
