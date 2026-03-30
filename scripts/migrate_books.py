#!/usr/bin/env python3
"""
Migrate book data from old MySQL dump to new PostgreSQL DB.
Clears all existing records and inserts clean data from the old site.
"""
import re, uuid, psycopg2, json
from datetime import datetime, timezone
from html.parser import HTMLParser

class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)
    def get_text(self):
        return ' '.join(self.parts).strip()

def strip_html(s):
    if not s:
        return s
    stripper = HTMLStripper()
    try:
        stripper.feed(s)
        text = stripper.get_text()
    except Exception:
        text = re.sub(r'<[^>]+>', ' ', s)
    # collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_text(s, fallback=''):
    """Strip HTML and return None if result is junk (n/a, fff, etc.)"""
    if not s:
        return fallback
    t = strip_html(s)
    # Remove if it's just repeated n/a or short junk
    normalized = re.sub(r'[\s/]+', '', t.lower())
    if not normalized or re.fullmatch(r'(na)+|(n/a\s*)+|f+|x+|0+|-+|\.+', normalized):
        return fallback
    # Too short to be meaningful
    if len(t) < 10:
        return fallback
    return t

SQL_FILE = "/Users/koushiksaha/Desktop/FixItUp/c5k Database/u260153612_c5k_v2.sql"
OLD_SITE_BOOKS = "https://c5k.com/public/backend/books/"

def connect_db():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb",
        sslmode="require", connect_timeout=60,
        keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5,
    )

def parse_rows(text):
    rows = []
    depth, current, in_string, escape_next = 0, [], False, False
    for c in text:
        if escape_next:
            current.append(c); escape_next = False
        elif c == '\\':
            current.append(c); escape_next = True
        elif c == "'":
            in_string = not in_string; current.append(c)
        elif not in_string:
            if c == '(':
                depth += 1
                current = ['('] if depth == 1 else current + ['(']
            elif c == ')':
                depth -= 1
                current.append(')')
                if depth == 0:
                    rows.append(''.join(current)); current = []
            else:
                current.append(c)
        else:
            current.append(c)
    return rows

def parse_fields(row):
    fields, fi, in_str, esc, curr = [], 1, False, False, []
    while fi < len(row) - 1:
        ch = row[fi]
        if esc:
            curr.append(ch); esc = False
        elif ch == '\\':
            curr.append(ch); esc = True
        elif ch == "'":
            in_str = not in_str; curr.append(ch)
        elif not in_str and ch == ',':
            fields.append(''.join(curr).strip()); curr = []
        else:
            curr.append(ch)
        fi += 1
    fields.append(''.join(curr).strip())
    return fields

def unq(s):
    s = s.strip()
    if s.startswith("'") and s.endswith("'"):
        return s[1:-1].replace("\\'", "'").replace('\\n', '\n').replace('\\r', '').replace('\\t', ' ')
    return None if s == 'NULL' else s

def parse_date(s):
    if not s: return None
    for fmt in ["%Y-%m-%d", "%Y-%m-%d %H:%M:%S"]:
        try:
            return datetime.strptime(s.strip(), fmt).replace(tzinfo=timezone.utc)
        except: pass
    return None

def main():
    print("=== Migrate Books ===\n")

    with open(SQL_FILE, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # ── Categories ───────────────────────────────────────────────────────────
    cat_m = re.search(r"INSERT INTO `books_category`.*?;\n", content, re.DOTALL)
    categories = {}
    if cat_m:
        for row in re.finditer(r"\((\d+),\s*'(.*?)',", cat_m.group(0)):
            categories[row.group(1)] = row.group(2).strip()

    # ── Front matter / PDFs per book ─────────────────────────────────────────
    fm_m = re.search(r"INSERT INTO `books_front_matter`.*?;\n", content, re.DOTALL)
    front_matters = {}  # book_id → list of {name, pages, pdf}
    if fm_m:
        for row in re.finditer(r"\((\d+),\s*(NULL|'[^']*'),\s*'([^']*)',\s*'([^']*)',\s*(\d+)", fm_m.group(0)):
            bid = row.group(5)
            if bid not in front_matters:
                front_matters[bid] = []
            front_matters[bid].append({
                'name': unq(row.group(2)) or 'Preview',
                'pages': row.group(3),
                'pdf': row.group(4),
            })

    # ── Books ─────────────────────────────────────────────────────────────────
    books = []
    seen_ids = set()
    # Columns: id,name,cat_id,description,keyfeature,price,hard_cover,paper_book,authors,
    #          online_isbn,first_isbn,first_publsh,timestamp,published_date,doi,type,
    #          items_weight,userId,book_img,...,status,created_at,updated_at,des,about
    for m in re.finditer(r"INSERT INTO `book_list` \([^)]+\) VALUES\n(.*?);\n", content, re.DOTALL):
        for row in parse_rows(m.group(1).strip()):
            f = parse_fields(row)
            if len(f) < 19: continue

            tid      = f[0].strip()
            if tid in seen_ids: continue
            seen_ids.add(tid)

            title      = strip_html(unq(f[1]) or '')
            cat_id     = f[2].strip()
            desc       = clean_text(unq(f[3]) or '')
            keyf       = clean_text(unq(f[4]) or '')
            price      = unq(f[5]) or '0'
            hard_cover = unq(f[6]) or '0'
            paper_book = unq(f[7]) or '0'
            authors    = unq(f[8]) or ''
            isbn_e     = unq(f[9]) or ''
            isbn_p     = unq(f[10]) or ''
            pub_date   = unq(f[13])
            doi        = unq(f[14])
            weight     = unq(f[16]) if len(f) > 16 else None
            book_img   = (unq(f[18]) or '').strip()
            dimensions = unq(f[19]) if len(f) > 19 else None
            des2       = clean_text(unq(f[24]) if len(f) > 24 else '')
            about2     = clean_text(unq(f[25]) if len(f) > 25 else '')

            # Build full description from non-junk parts
            parts = [p for p in [desc, des2, about2] if p and p.strip()]
            full_desc = '\n\n'.join(parts) if parts else title

            # Cover image URL
            cover_url = f"{OLD_SITE_BOOKS}{book_img}" if book_img else None

            # Authors list
            author_list = [a.strip() for a in re.split(r',(?![^(]*\))', authors) if a.strip()] if authors else ['Unknown']

            # Year from pub_date
            yr = 2024
            pd = parse_date(pub_date)
            if pd: yr = pd.year

            # ISBN — use e-ISBN if available, fallback to p-isbn, else generate
            isbn = isbn_e.strip() if isbn_e and isbn_e not in ('0-596-52xxx-z', '') else isbn_p.strip()
            if not isbn or isbn == '0-596-52xxx-z':
                isbn = f"978-1-967642-{tid.zfill(2)}-x"
            # Guarantee uniqueness using old id as suffix differentiator
            isbn = f"{isbn}-{tid}" if tid not in ('1','2','3','4','5','6','11','12','13','14','17') else isbn

            # Chapters / front matter for this book
            fms = front_matters.get(tid, [])
            chapters = [{'name': fm['name'], 'pages': fm['pages'],
                         'pdfUrl': f"{OLD_SITE_BOOKS}{fm['pdf']}"} for fm in fms]

            # Related topics from keyfeature bullet points
            topics = []
            if keyf:
                for line in re.split(r'[\n·•\-]', keyf):
                    line = line.strip().rstrip('.')
                    if 5 < len(line) < 80:
                        topics.append(line[:79])
            topics = topics[:10]

            def fmt_price(s):
                try: return f'${float(s):.2f}' if s and s not in ('0', '0.00') else None
                except: return None

            books.append({
                'old_id': tid,
                'title': title,
                'authors': author_list,
                'year': yr,
                'isbn': isbn,
                'pages': 200,  # not stored in old DB, use default
                'field': categories.get(cat_id, 'General'),
                'description': (desc[:500] if desc else full_desc[:500]) or title,
                'fullDescription': full_desc,
                'price': f'${float(price):.2f}' if price and price != '0.00' else '$9.99',
                'publisher': 'C5K Research Publishing',
                'language': 'English',
                'edition': '1st',
                'format': 'Digital & Print',
                'coverImageUrl': cover_url,
                'relatedTopics': topics,
                'chapters': chapters,
                'doi': doi or f'https://doi.org/10.63471/books/{tid}',
                'pub_date': pd,
                'hardCoverPrice': fmt_price(hard_cover),
                'paperBookPrice': fmt_price(paper_book),
                'dimensions': dimensions,
                'weight': weight,
                'keyFeatures': [t for t in topics],
            })

    print(f"Books parsed from SQL: {len(books)}")

    conn = connect_db()
    conn.autocommit = False
    cur = conn.cursor()

    # Clear existing (cascade deletes chapters, purchases, wishlists)
    cur.execute('DELETE FROM "book_chapters"')
    cur.execute('DELETE FROM "wishlists" WHERE "bookId" IS NOT NULL')
    cur.execute('DELETE FROM "purchased_books"')
    cur.execute('DELETE FROM "Book"')
    print("Cleared existing books\n")

    now = datetime.now(timezone.utc)
    inserted = 0
    errors = 0

    for b in books:
        bid = str(uuid.uuid4())
        try:
            cur.execute(
                '''INSERT INTO "Book" (
                    id, title, authors, year, isbn, pages, field,
                    description, "fullDescription", price,
                    publisher, language, edition, format,
                    "coverImageUrl", "relatedTopics",
                    "tableOfContents", "previewPages", reviews,
                    doi, "hardCoverPrice", "paperBookPrice",
                    dimensions, weight, "keyFeatures",
                    "createdAt", "updatedAt"
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s
                )''',
                (
                    bid, b['title'], b['authors'], b['year'], b['isbn'],
                    b['pages'], b['field'], b['description'], b['fullDescription'],
                    b['price'], b['publisher'], b['language'], b['edition'],
                    b['format'], b['coverImageUrl'], b['relatedTopics'],
                    json.dumps([]), json.dumps([]), json.dumps([]),
                    b['doi'], b['hardCoverPrice'], b['paperBookPrice'],
                    b['dimensions'], b['weight'], b['keyFeatures'],
                    now, now
                )
            )

            # Insert chapters
            for i, ch in enumerate(b['chapters']):
                cur.execute(
                    '''INSERT INTO "book_chapters" (id, "bookId", title, "pageRange", "pdfUrl", "createdAt", "updatedAt")
                       VALUES (%s,%s,%s,%s,%s,%s,%s)''',
                    (str(uuid.uuid4()), bid, ch['name'], ch['pages'], ch['pdfUrl'], now, now)
                )

            print(f"  ✓ [{b['old_id']}] {b['title'][:65]}")
            print(f"       authors: {', '.join(b['authors'][:2])}{'...' if len(b['authors'])>2 else ''}")
            print(f"       isbn: {b['isbn']} | price: {b['price']} | chapters: {len(b['chapters'])}")
            print(f"       cover: {b['coverImageUrl'].split('/')[-1] if b['coverImageUrl'] else 'none'}")
            inserted += 1
        except Exception as e:
            print(f"  [ERROR] [{b['old_id']}] {b['title'][:50]}: {e}")
            errors += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n{'='*55}")
    print(f"Inserted: {inserted}  |  Errors: {errors}")


if __name__ == "__main__":
    main()
