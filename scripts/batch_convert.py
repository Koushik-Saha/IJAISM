import json, os, re, base64
import mammoth
from pypdf import PdfReader

# Paths
MAPPING_JSON = '/Users/koushiksaha/Desktop/FixItUp/c5k-platform/data/article_id_to_file.json'
OUTPUT_DIR = '/Users/koushiksaha/Desktop/FixItUp/c5k-platform/data/article-content'
IMAGE_DIR = '/Users/koushiksaha/Desktop/FixItUp/c5k-platform/public/article-images'

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)

with open(MAPPING_JSON, 'r') as f:
    mapping = json.load(f)

def handle_image(image):
    # This is a mammoth image handler
    # We could save to disk, but for now we'll let mammoth do base64 if we want,
    # or we can save them to public/article-images/[id]/imageN.png
    # But since the user wants it 'just like sample page', and I used base64 there efficiently,
    # I will stick with default mammoth behavior (base64) unless there are too many images.
    # Actually, saving to disk is cleaner for 78 articles.
    return {
        "src": "" # placeholder
    }

for entry in mapping:
    art_id = entry['id']
    source = entry['source']
    stype = entry['type']
    
    if not source or not os.path.exists(source):
        print(f"Skipping {art_id}: source not found ({source})")
        continue
        
    output_file = os.path.join(OUTPUT_DIR, f"{art_id}.html")
    
    try:
        if stype == 'docx':
            print(f"Converting DOCX: {os.path.basename(source)}")
            with open(source, "rb") as docx_file:
                # We'll use default mammoth conversion for now
                result = mammoth.convert_to_html(docx_file)
                html = result.value
                
                # REFINEMENT: Strip leading images (usually Logo and Cover) from the body
                # We remove the first 2 images if they appear at the very start of the doc
                # This prevents them from appearing in the body while they are already in our custom header bar.
                for _ in range(2):
                    img_match = re.search(r'<img [^>]+>', html)
                    if img_match:
                        # Only remove if it's in the first 2k characters (likely header)
                        if img_match.start() < 2000:
                            html = html[:img_match.start()] + html[img_match.end():]
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(html)
                    
        elif stype == 'pdf':
            print(f"Extracting PDF: {os.path.basename(source)}")
            reader = PdfReader(source)
            text_content = []
            for page in reader.pages:
                text_content.append(page.extract_text())
            
            # Simple PDF to HTML: split by lines, wrap in <p>
            full_text = "\n".join(text_content)
            paragraphs = full_text.split('\n\n')
            html_parts = []
            for p in paragraphs:
                if p.strip():
                    # Escape basic HTML
                    p_esc = p.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    html_parts.append(f"<p>{p_esc}</p>")
            
            html = "".join(html_parts)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html)
                
    except Exception as e:
        print(f"Error processing {art_id} ({source}): {e}")

print("Batch conversion completed.")
