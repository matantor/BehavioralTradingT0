const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/import/journal.json', 'utf-8'));

// Fix each row
const fixed = data.map((row, idx) => {
  const newRow = { ...row };
  const action = (row.actionType || '').toLowerCase();

  // 1. Normalize ticker to uppercase
  if (newRow.ticker) {
    newRow.ticker = newRow.ticker.toUpperCase();
  }

  // 2. Remove positionMode from SELL/SHORT/WITHDRAW/DEPOSIT rows
  //    (they should auto-resolve or use special handling)
  if (['sell', 'short', 'withdraw', 'deposit'].includes(action)) {
    delete newRow.positionMode;
    delete newRow.positionId; // Remove if present (shouldn't be)
  }

  // 3. For BUY/LONG, ensure positionMode is "new" if not specified
  //    and remove it (let importer default to "new")
  if (['buy', 'long'].includes(action)) {
    // If positionMode was "new" or undefined, remove it (will default to "new")
    if (newRow.positionMode === 'new' || !newRow.positionMode) {
      delete newRow.positionMode;
    }
  }

  // 4. Ensure price is present (use pricePerUnit as fallback)
  if (newRow.pricePerUnit !== undefined && newRow.price === undefined) {
    newRow.price = newRow.pricePerUnit;
    delete newRow.pricePerUnit;
  }

  // 5. Ensure isNewMoney is boolean if present
  if (newRow.isNewMoney === null) {
    newRow.isNewMoney = false;
  }

  // 6. Clean up null fees
  if (newRow.fees === null) {
    delete newRow.fees;
  }

  return newRow;
});

// Sort by entryTime to ensure BUYs come before SELLs chronologically
fixed.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());

// Write fixed file
fs.writeFileSync('./data/import/journal.fixed.json', JSON.stringify(fixed, null, 2));

console.log('Fixed file written to: data/import/journal.fixed.json');
console.log('Total records:', fixed.length);

// Verify no more positionMode on sell/withdraw
let badModes = 0;
fixed.forEach((row, idx) => {
  const action = (row.actionType || '').toLowerCase();
  if (['sell', 'short', 'withdraw', 'deposit'].includes(action) && row.positionMode) {
    console.log('STILL HAS positionMode:', idx, action, row.ticker);
    badModes++;
  }
});
console.log('Rows still with bad positionMode:', badModes);
