const fs = require('fs');
const sql = fs.readFileSync('/Users/koushiksaha/Desktop/FixItUp/c5k Database/u260153612_c5k.sql', 'utf8');
const match = sql.match(/INSERT INTO `articles` \([^)]+\) VALUES([\s\S]*?);/);
if (match) {
  // Count top-level tuples ( ... ),
  const valuesStr = match[1];
  let inString = false;
  let count = 0;
  for (let i = 0; i < valuesStr.length; i++) {
    if (valuesStr[i] === "'" && valuesStr[i-1] !== '\\') inString = !inString;
    if (!inString && valuesStr[i] === '(') count++;
  }
  console.log('Tuples counted in SQL INSERT statement for articles: ' + count);
} else {
  console.log('No articles insert found');
}
