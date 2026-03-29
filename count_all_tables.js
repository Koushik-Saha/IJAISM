const fs = require('fs');

const sqlPath = '/Users/koushiksaha/Desktop/FixItUp/c5k Database/u260153612_c5k.sql';
if (!fs.existsSync(sqlPath)) {
    console.log("SQL dump file not found at " + sqlPath);
    process.exit(1);
}

console.log("Analyzing database dump, please wait...");
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
const tableCounts = {};

// Find all insert statements
const insertRegex = /INSERT INTO `([^`]+)`[\s\S]*?VALUES([\s\S]*?);/g;

let match;
while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const valuesStr = match[2];

    if (!tableCounts[tableName]) {
        tableCounts[tableName] = 0;
    }

    // Tally the inserted rows
    let inString = false;
    let inTuple = false;
    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];

        // Handle string escape sequences to correctly identify tuple bounds
        if (char === "'" && (i === 0 || valuesStr[i - 1] !== '\\')) {
            inString = !inString;
        }

        // We only count the starting parenthesis of an insert tuple 
        // that is outside of a string value
        if (!inString && char === '(') {
            if (!inTuple) {
                inTuple = true;
                tableCounts[tableName]++;
            }
        }
        if (!inString && char === ')') {
            inTuple = false;
        }
    }
}

console.log("\n--- Old Database Table Counts ---");
const sortedTables = Object.entries(tableCounts).sort((a, b) => a[0].localeCompare(b[0]));
for (const [table, count] of sortedTables) {
    console.log(`${table.padEnd(25)} : ${count} records`);
}
console.log("---------------------------------");
