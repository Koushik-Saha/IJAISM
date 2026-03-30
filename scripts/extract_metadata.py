import os
import json
import re
from pypdf import PdfReader

def extract_metadata(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        # Extract first 3 pages to be safe
        text = ""
        for i in range(min(3, len(reader.pages))):
            text += reader.pages[i].extract_text() + "\n"
        
        # Clean text
        text = re.sub(r'\s+', ' ', text)
        
        # Extract Abstract
        # Common patterns: "Abstract", "ABSTRACT", "ABSTRACT:"
        abstract_match = re.search(r'(?:Abstract|ABSTRACT)[:\s]*(.*?)(?:Keywords|KEYWORDS|Introduction|1\. Introduction)', text, re.DOTALL | re.IGNORECASE)
        abstract = abstract_match.group(1).strip() if abstract_match else ""
        
        # Extract Keywords
        keywords_match = re.search(r'(?:Keywords|KEYWORDS)[:\s]*(.*?)(?:Introduction|1\. Introduction|I\. Introduction)', text, re.DOTALL | re.IGNORECASE)
        keywords_str = keywords_match.group(1).strip() if keywords_match else ""
        keywords = [k.strip() for k in re.split(r'[,;]', keywords_str) if k.strip()]
        
        return {
            "filename": os.path.basename(pdf_path),
            "abstract": abstract,
            "keywords": keywords,
            "full_text_preview": text[:5000] # First 5000 chars for fullText field
        }
    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        return None

def main():
    pdf_dir = "/Users/koushiksaha/Desktop/FixItUp/c5k-platform/public/uploads/manuscript"
    output_file = "/Users/koushiksaha/Desktop/FixItUp/c5k-platform/migration-data/extracted_metadata.json"
    
    results = []
    files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
    print(f"Found {len(files)} PDFs")
    
    for i, filename in enumerate(files):
        print(f"[{i+1}/{len(files)}] Processing {filename}...")
        pdf_path = os.path.join(pdf_dir, filename)
        metadata = extract_metadata(pdf_path)
        if metadata:
            results.append(metadata)
            
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully saved metadata for {len(results)} PDFs to {output_file}")

if __name__ == "__main__":
    main()
