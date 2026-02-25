import fs from 'fs';
import readline from 'readline';
import path from 'path';

const DUMP_PATH = '/Users/koushiksaha/Desktop/FixItUp/c5k Database/u260153612_c5k.sql';
const OUTPUT_DIR = path.join(process.cwd(), 'migration-data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Tables we want to extract
const TARGET_TABLES = [
    'users',
    'journal_articals',
    'articles',
    'author_affiliation',
    'submission_authors',
    'issues',
    'volume',
    'book_list',
    'chapters',
    'thesis_list',
    'thesis_chpater',
    'thesis_front_matter',
    'subscribers',
    'news',
    'blogs',
    'view_download'
];

// Robust SQL value parser state machine
function parseSqlValues(sqlString: string): any[][] {
    const rows: any[][] = [];
    let currentRow: any[] = [];
    let currentVal = '';

    let inString = false;
    let escapeNext = false;
    let inTuple = false;

    for (let i = 0; i < sqlString.length; i++) {
        const char = sqlString[i];

        if (escapeNext) {
            currentVal += char;
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            currentVal += char;
            continue;
        }

        if (char === "'") {
            inString = !inString;
            currentVal += char;
            continue;
        }

        if (!inString) {
            if (char === '(' && !inTuple) {
                inTuple = true;
                currentRow = [];
                currentVal = '';
                continue;
            }
            if (char === ')' && inTuple) {
                inTuple = false;
                currentRow.push(currentVal.trim());
                rows.push(currentRow);
                continue;
            }
            if (char === ',' && inTuple) {
                currentRow.push(currentVal.trim());
                currentVal = '';
                continue;
            }
            if (char === ';' && !inTuple) {
                break;
            }
        }

        if (inTuple) {
            currentVal += char;
        }
    }

    return rows.map(row => row.map(v => {
        if (v.toUpperCase() === 'NULL') return null;
        if (v.startsWith("'") && v.endsWith("'")) {
            return v.slice(1, -1)
                .replace(/''/g, "'")
                .replace(/\\'/g, "'")
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "\r")
                .replace(/\\\\/g, "\\");
        }
        const num = Number(v);
        if (!isNaN(num) && v !== '') return num;
        return v;
    }));
}


async function extract() {
    console.log(`Starting extraction from ${DUMP_PATH}`);
    const sqlContent = fs.readFileSync(DUMP_PATH, 'utf-8');

    const tableData: Record<string, any[]> = {};
    TARGET_TABLES.forEach(t => tableData[t] = []);

    // Find all INSERT INTO statements
    const insertRegex = /INSERT INTO `([^`]+)` \((.*?)\) VALUES/g;
    let match;

    while ((match = insertRegex.exec(sqlContent)) !== null) {
        const tableName = match[1];
        if (!TARGET_TABLES.includes(tableName)) continue;

        const cols = match[2].split(',').map(c => c.trim().replace(/`/g, ''));
        const startIdx = match.index + match[0].length;

        // Find the end of this statement (the semicolon)
        // We must be careful about semicolons inside strings, but for dumps
        // we can usually rely on finding `);\n` or we can use our state machine manually.
        // Let's use the state machine starting from startIdx to find the rows!

        const rows: any[][] = [];
        let currentRow: any[] = [];
        let currentVal = '';

        let inString = false;
        let escapeNext = false;
        let inTuple = false;

        for (let i = startIdx; i < sqlContent.length; i++) {
            const char = sqlContent[i];

            if (escapeNext) {
                currentVal += char;
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                escapeNext = true;
                currentVal += char;
                continue;
            }

            if (char === "'") {
                inString = !inString;
                currentVal += char;
                continue;
            }

            if (!inString) {
                if (char === '(' && !inTuple) {
                    inTuple = true;
                    currentRow = [];
                    currentVal = '';
                    continue;
                }
                if (char === ')' && inTuple) {
                    inTuple = false;
                    currentRow.push(currentVal.trim());

                    // Format values
                    const formattedRow = currentRow.map(v => {
                        if (v.toUpperCase() === 'NULL') return null;
                        if (v.startsWith("'") && v.endsWith("'")) {
                            return v.slice(1, -1)
                                .replace(/''/g, "'")
                                .replace(/\\'/g, "'")
                                .replace(/\\n/g, "\n")
                                .replace(/\\r/g, "\r")
                                .replace(/\\\\/g, "\\");
                        }
                        const num = Number(v);
                        if (!isNaN(num) && v !== '') return num;
                        return v;
                    });
                    rows.push(formattedRow);
                    continue;
                }
                if (char === ',' && inTuple) {
                    currentRow.push(currentVal.trim());
                    currentVal = '';
                    continue;
                }
                if (char === ';' && !inTuple) {
                    break; // Found the end of the INSERT statement
                }
            }

            if (inTuple) {
                currentVal += char;
            }
        }

        rows.forEach(rowVals => {
            const obj: Record<string, any> = {};
            cols.forEach((col, idx) => {
                obj[col] = rowVals[idx];
            });
            tableData[tableName].push(obj);
        });
    }

    console.log('Extraction complete. Saving to JSON files...');

    for (const table of TARGET_TABLES) {
        if (tableData[table] && tableData[table].length > 0) {
            const outPath = path.join(OUTPUT_DIR, `${table}.json`);
            fs.writeFileSync(outPath, JSON.stringify(tableData[table], null, 2));
            console.log(`Saved ${tableData[table].length} records to ${table}.json`);
        } else {
            console.log(`No records found for ${table}`);
        }
    }
}

extract().catch(console.error);
