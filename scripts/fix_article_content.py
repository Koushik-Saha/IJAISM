#!/usr/bin/env python3
"""
Fix article abstracts and keywords by re-extracting from PDFs
with proper two-column PDF handling.
"""
import os
import re
import psycopg2
import pdfplumber
from datetime import datetime, timezone

PDF_DIR = "/Users/koushiksaha/Desktop/FixItUp/c5k Database/pdfs"
UPLOAD_BASE_URL = "/uploads/manuscript"

# Date prefixes seen in the article info column
DATE_PATTERN = re.compile(
    r'^\s*(\d{1,2}\s+\w+[,\s]+\d{4}|\d{1,2}\s+\w+\s+\d{4})\s*\((Received|Accepted|Published|Online)\)[,\s]*',
    re.IGNORECASE
)
METADATA_PREFIXES = re.compile(
    r'^\s*(Article history:|Corresponding Author:|\*Corresponding|Cite this article:)',
    re.IGNORECASE
)


def connect_db():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb",
        sslmode="require", connect_timeout=60, keepalives=1,
        keepalives_idle=30, keepalives_interval=10, keepalives_count=5,
    )


def clean_text(t):
    return re.sub(r'\s+', ' ', t or '').strip()


def strip_article_info_prefix(line: str) -> str:
    """Remove article-info column prefixes from the start of a line."""
    # Remove date + (Received/Accepted/Published) prefix
    line = DATE_PATTERN.sub('', line)
    # Remove metadata labels
    line = METADATA_PREFIXES.sub('', line)
    return line.strip()


def extract_abstract_from_pdf(pdf_path: str) -> tuple[str, list]:
    """
    Extract clean abstract and keywords from PDF.
    Returns (abstract, keywords).
    """
    abstract = ""
    keywords = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Get all text from first 2 pages
            all_text = ""
            for i, page in enumerate(pdf.pages[:2]):
                all_text += (page.extract_text() or "") + "\n"

            lines = all_text.split('\n')

            # ── Find the ARTICLE INFO / ABSTRACT box ────────────────────────
            # Look for the combined "A R T I C LE I N F O A B S T R A C T" header
            info_abs_idx = -1
            for i, line in enumerate(lines):
                if re.search(r'A\s+R\s+T\s+I\s+C|ARTICLE\s+INFO.*ABSTRACT|A R T I C LE', line, re.I):
                    info_abs_idx = i
                    break

            if info_abs_idx == -1:
                # Try fallback: find "Abstract" keyword
                for i, line in enumerate(lines):
                    if re.match(r'^Abstract\s*$', line.strip(), re.I):
                        info_abs_idx = i
                        break

            # ── Extract keywords from the article info box ───────────────────
            kw_section_start = -1
            kw_section_end = -1
            for i, line in enumerate(lines):
                if re.match(r'^Keywords?[\s:]*$', line.strip(), re.I):
                    kw_section_start = i + 1
                elif re.match(r'^Keywords?\s*:', line.strip(), re.I):
                    kw_section_start = i
                    kw_section_end = i + 3  # keywords usually 1-3 lines

            if kw_section_start >= 0:
                kw_lines = []
                for i in range(kw_section_start, min(kw_section_start + 4, len(lines))):
                    line = lines[i].strip()
                    # Stop if we hit abstract text (long lines not looking like keywords)
                    if DATE_PATTERN.match(line):
                        # This line has date prefix - extract just keyword part
                        kw_part = DATE_PATTERN.sub('', line).strip()
                        # keyword part might start with keyword text then transition
                        if kw_part and not re.search(r'[A-Z][a-z]+.*[A-Z][a-z]+.*[A-Z]', kw_part[:50]):
                            kw_lines.append(kw_part)
                        continue
                    if re.match(r'^(Cite|Corresponding|DOI|@|©|Copyright)', line, re.I):
                        break
                    if line and len(line) < 200:
                        kw_lines.append(line)
                    if len(kw_lines) >= 4:
                        break

                # Parse keywords from collected lines
                kw_text = ' '.join(kw_lines)
                # Remove any "Keywords:" prefix
                kw_text = re.sub(r'^Keywords?\s*:', '', kw_text, flags=re.I).strip()
                # Split on commas/semicolons
                raw_kws = [k.strip().rstrip('.') for k in re.split(r'[,;]', kw_text) if k.strip()]
                # Filter: keep only proper keywords (not full sentences, not too long)
                keywords = [k for k in raw_kws if 1 < len(k) <= 80
                           and not re.search(r'\(Received\)|\(Accepted\)', k)][:15]

            # ── Extract abstract ─────────────────────────────────────────────
            if info_abs_idx >= 0:
                # Collect lines after the header
                abstract_lines = []
                in_abstract = True
                for line in lines[info_abs_idx + 1:]:
                    stripped = line.strip()
                    if not stripped:
                        continue

                    # Stop conditions: section headers after abstract
                    if re.match(r'^\d+\.\s+[A-Z][a-z]', stripped):  # "1. Introduction"
                        break
                    if re.match(r'^(Introduction|1\s+Introduction)', stripped, re.I):
                        break
                    if re.match(r'^(DOI:|@\s*\d{4}|©\s*\d{4}|Copyright)', stripped, re.I):
                        break

                    # Remove article-info column prefixes
                    cleaned = strip_article_info_prefix(stripped)

                    # Skip keyword lines that got mixed in
                    if re.match(r'^Keywords?\s*:', cleaned, re.I) or (
                        kw_section_start > 0 and len(cleaned) < 100 and
                        re.search(r'^[A-Z][A-Za-z\s,]+,\s+[A-Z]', cleaned) and
                        not re.search(r'[a-z]\s+[a-z]{4,}', cleaned)
                    ):
                        continue

                    # Skip if mostly article-info content was removed (short remnants)
                    if cleaned and len(cleaned) > 15:
                        abstract_lines.append(cleaned)

                abstract = clean_text(' '.join(abstract_lines))

                # Remove any remaining article-history at the start
                abstract = re.sub(r'^Article history:\s*', '', abstract, flags=re.I)
                # Remove leading date patterns
                abstract = DATE_PATTERN.sub('', abstract).strip()

                # Trim to reasonable length
                abstract = abstract[:3000]

            # ── Fallback keyword extraction if still empty ───────────────────
            if not keywords:
                # Try searching full text for keywords pattern
                kw_m = re.search(r'Keywords?[:\s]+([^\n]{10,200})', all_text, re.I)
                if kw_m:
                    kw_text = kw_m.group(1)
                    # Remove date prefixes from mixed content
                    kw_text = DATE_PATTERN.sub('', kw_text).strip()
                    raw_kws = [k.strip().rstrip('.') for k in re.split(r'[,;]', kw_text) if k.strip()]
                    keywords = [k for k in raw_kws if 1 < len(k) <= 80][:15]

    except Exception as e:
        print(f"  [ERROR] PDF extraction failed: {e}")

    return abstract, keywords


def main():
    print("=== Fix Article Content (Abstract + Keywords) ===\n")

    # Get all articles from DB
    conn = connect_db()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute('SELECT id, "pdfUrl", title FROM "Article" ORDER BY title')
    articles = cur.fetchall()
    print(f"Found {len(articles)} articles to fix\n")

    fixed = 0
    skipped = 0
    errors = 0

    for art_id, pdf_url, title in articles:
        # Find PDF file
        if not pdf_url:
            print(f"  [SKIP] No PDF URL: {title[:50]}")
            skipped += 1
            continue

        # Extract filename from URL
        pdf_file = os.path.basename(pdf_url)
        pdf_path = os.path.join(PDF_DIR, pdf_file)

        # Handle filename variations (e.g., %28IoT%29 vs __IoT__)
        if not os.path.exists(pdf_path):
            # Try to find by numeric prefix
            m = re.match(r'^(\d+)', pdf_file)
            if m:
                prefix = m.group(1)
                matches = [f for f in os.listdir(PDF_DIR)
                           if re.match(rf'^{prefix}[_\.]', f) and f.endswith('.pdf')]
                if matches:
                    pdf_path = os.path.join(PDF_DIR, sorted(matches, key=len)[0])
                    pdf_file = os.path.basename(pdf_path)

        if not os.path.exists(pdf_path):
            print(f"  [SKIP] PDF not found: {pdf_file}")
            skipped += 1
            continue

        print(f"  Processing: {pdf_file[:60]}")
        abstract, keywords = extract_abstract_from_pdf(pdf_path)

        if not abstract and not keywords:
            print(f"    [WARN] No content extracted")
            skipped += 1
            continue

        # Update in DB
        try:
            now = datetime.now(timezone.utc).isoformat()
            cur.execute(
                '''UPDATE "Article" SET abstract=%s, keywords=%s, "updatedAt"=%s WHERE id=%s''',
                (abstract or "", keywords or [], now, art_id)
            )
            kw_preview = ', '.join(keywords[:3]) if keywords else 'none'
            abs_preview = abstract[:80] if abstract else 'none'
            print(f"    ✓ Keywords: {kw_preview}")
            print(f"    ✓ Abstract: {abs_preview}...")
            fixed += 1
        except Exception as e:
            print(f"    [ERROR] DB update: {e}")
            errors += 1

    cur.close()
    conn.close()

    print(f"\n{'='*50}")
    print(f"Fixed: {fixed} | Skipped: {skipped} | Errors: {errors}")


if __name__ == "__main__":
    main()
