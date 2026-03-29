import fs from 'fs';
import path from 'path';

const INPUT_DIR = path.join(process.cwd(), 'migration-data');

function countJSON(filename: string) {
    const filepath = path.join(INPUT_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.log(`${filename} not found`);
        return;
    }
    const raw = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(raw);
    console.log(`${filename}: ${data.length} records`);
}

countJSON('users.json');
countJSON('articles.json');
countJSON('issues.json');
countJSON('volume.json');
countJSON('journal_articals.json');
countJSON('thesis_list.json');
countJSON('book_list.json');

