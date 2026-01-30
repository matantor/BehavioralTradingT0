const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/import/journal.json', 'utf-8'));

// Analyze each row
const issues = [];
data.forEach((row, idx) => {
  const action = (row.actionType || '').toLowerCase();
  const mode = row.positionMode;
  const posId = row.positionId;

  // Check for SELL/SHORT with positionMode but no positionId
  if ((action === 'sell' || action === 'short') && mode && !posId) {
    issues.push({
      row: idx,
      action: action.toUpperCase(),
      ticker: row.ticker,
      entryTime: row.entryTime,
      issue: 'positionMode set but no positionId'
    });
  }

  // Check for WITHDRAW with positionMode but no positionId
  if (action === 'withdraw' && mode && !posId) {
    issues.push({
      row: idx,
      action: action.toUpperCase(),
      ticker: row.ticker,
      entryTime: row.entryTime,
      issue: 'withdraw with positionMode'
    });
  }
});

console.log('=== FAILING ROWS ===');
console.log('Row | Action   | Ticker    | EntryTime            | Issue');
console.log('----+----------+-----------+----------------------+----------------------------------');
issues.forEach(i => {
  console.log(String(i.row).padStart(3) + ' | ' +
              i.action.padEnd(8) + ' | ' +
              (i.ticker || '').padEnd(9) + ' | ' +
              (i.entryTime || '').padEnd(20) + ' | ' +
              i.issue);
});
console.log('');
console.log('Total failing rows:', issues.length);

// Count by action type
const byAction = {};
issues.forEach(i => {
  byAction[i.action] = (byAction[i.action] || 0) + 1;
});
console.log('By action type:', byAction);

// Count by ticker
const byTicker = {};
issues.forEach(i => {
  byTicker[i.ticker] = (byTicker[i.ticker] || 0) + 1;
});
console.log('By ticker:', byTicker);
