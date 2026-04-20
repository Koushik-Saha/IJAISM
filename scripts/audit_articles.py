import json
import os
import re

def normalize_title(title):
    # Remove file extension
    title = title.replace('.docx', '')
    # Remove leading numbers and separators (e.g., "01_", "02 - ", "05__")
    title = re.sub(r'^\d+[\s\-_]+', '', title)
    title = re.sub(r'^[\s\-_]+', '', title)
    # Strip common variations and punctuation
    title = title.replace(': ', ' ').replace(':', ' ')
    # Normalize to lowercase and alphanumeric only
    title = re.sub(r'[^a-zA-Z0-9]', '', title).lower()
    return title

# 1. Load DB Articles
mapping_path = 'articles_mapping.json'
try:
    with open(mapping_path, 'r') as f:
        db_articles = json.load(f)
except Exception as e:
    print(f"Error loading {mapping_path}: {e}")
    db_articles = []

db_titles_map = {normalize_title(a['title']): a['title'] for a in db_articles}

# 2. Scan Downloads Folder
downloads_path = '/Users/koushiksaha/Downloads/C5K_V1_I1'
fs_files_data = [] # Store (original_filename, normalized_title)
for root, dirs, files in os.walk(downloads_path):
    for file in files:
        if file.endswith('.docx') and not file.startswith('~$'):
            fs_files_data.append((file, normalize_title(file)))

fs_normalized_map = {norm: orig for orig, norm in fs_files_data}

# 3. Compare Results
matches = []
unmatched_db = []
unmatched_fs = []

# DB articles found on disk
for norm_title, original_title in db_titles_map.items():
    if norm_title in fs_normalized_map:
        matches.append(original_title)
    else:
        unmatched_db.append(original_title)

# Files on disk not matched in DB
for orig_file, norm_file in fs_files_data:
    if norm_file not in db_titles_map:
        unmatched_fs.append(orig_file)

# 4. Final Output
print(f"--- SCAN REPORT ---")
print(f"Database Record Count: {len(db_articles)}")
print(f"Files Found on Disk:  {len(fs_files_data)}")
print(f"Successful Matches:   {len(matches)}")

print("\n### ✅ MATCHED ARTICLES ###")
for m in sorted(matches):
    print(f"- [MATCH] {m}")

print("\n### ❌ MISSING FROM DOWNLOADS (In DB but not on disk) ###")
for u in sorted(unmatched_db):
    print(f"- [MISSING] {u}")

print("\n### 🆕 NEW/UNMATCHED FILES (On disk but not in DB) ###")
# Remove duplicates if any from the disk list (e.g. same title in different folders)
unique_unmatched_fs = sorted(list(set(unmatched_fs)))
for u in unique_unmatched_fs:
    print(f"- [NEW] {u}")
