const fs = require('fs');

const inputPath = './data/import/journal.json';
const pass1Path = './data/import/journal.pass1.json';
const pass2Path = './data/import/journal.pass2.json';

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

const pass1Actions = new Set(['buy', 'deposit']);

const pass1 = [];
const pass2 = [];

data.forEach(row => {
  const action = (row.actionType || '').toLowerCase();
  if (pass1Actions.has(action)) {
    pass1.push(row);
  } else {
    pass2.push(row);
  }
});

fs.writeFileSync(pass1Path, JSON.stringify(pass1, null, 2));
fs.writeFileSync(pass2Path, JSON.stringify(pass2, null, 2));

console.log('Split complete:');
console.log(`  Pass 1 (buy/deposit): ${pass1.length} records → ${pass1Path}`);
console.log(`  Pass 2 (other):       ${pass2.length} records → ${pass2Path}`);
