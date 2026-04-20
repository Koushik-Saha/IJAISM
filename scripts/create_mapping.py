import json, os, re

# Paths
ARTICLES_JSON = '/Users/koushiksaha/Desktop/FixItUp/c5k-platform/articles_mapping.json'
PUBLIC_MANUSCRIPT_DIR = '/Users/koushiksaha/Desktop/FixItUp/c5k-platform/public/uploads/manuscript'
DOWNLOADS_DIR = '/Users/koushiksaha/Downloads/C5k V1_I2_ 15 Papers'
OUTPUT_MAPPING = '/Users/koushiksaha/Desktop/FixItUp/c5k-platform/data/article_id_to_file.json'

with open(ARTICLES_JSON, 'r') as f:
    articles = json.load(f)

# Get all DOCX files
docx_files = []
if os.path.exists(DOWNLOADS_DIR):
    for root, dirs, files in os.walk(DOWNLOADS_DIR):
        for f in files:
            if f.endswith('.docx') and not f.startswith('~$'):
                docx_files.append(os.path.join(root, f))

# Get all PDF files in public
pdf_files = os.listdir(PUBLIC_MANUSCRIPT_DIR) if os.path.exists(PUBLIC_MANUSCRIPT_DIR) else []

mapping = []

for art in articles:
    art_id = art['id']
    title = art['title'].lower()
    pdf_url = art['pdfUrl']
    
    source = None
    source_type = None
    
    # Try to find DOCX match
    for dpath in docx_files:
        dname = os.path.basename(dpath)
        clean_dname = re.sub(r'^\d+[_ -]*Formated[_ -]*', '', dname, flags=re.IGNORECASE)
        clean_dname = clean_dname.replace('.docx', '').lower().strip()
        
        if clean_dname in title or (len(clean_dname) > 10 and clean_dname[:20] in title):
            source = dpath
            source_type = 'docx'
            break
            
    # If no DOCX, find PDF
    if not source and pdf_url:
        pdf_name = os.path.basename(pdf_url)
        if pdf_name in pdf_files:
            source = os.path.join(PUBLIC_MANUSCRIPT_DIR, pdf_name)
            source_type = 'pdf'
            
    mapping.append({
        'id': art_id,
        'title': art['title'],
        'source': source,
        'type': source_type
    })

os.makedirs(os.path.dirname(OUTPUT_MAPPING), exist_ok=True)
with open(OUTPUT_MAPPING, 'w') as f:
    json.dump(mapping, f, indent=2)

print(f"Mapped {len([m for m in mapping if m['source']])} out of {len(mapping)} articles.")
print(f"DOCX sources: {len([m for m in mapping if m['type'] == 'docx'])}")
print(f"PDF sources: {len([m for m in mapping if m['type'] == 'pdf'])}")
