const fs = require('fs');
const path = require('path');

const ARTIFACTS = path.join(process.cwd(), 'artifacts');
const JOURNAL = path.join(ARTIFACTS, 'assistant_journal.json');

function appendEntry(entry) {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(JOURNAL, 'utf8'));
    if (!Array.isArray(data)) data = [];
  } catch (err) {
    data = [];
  }
  data.push({ ...entry, ts: new Date().toISOString() });
  fs.writeFileSync(JOURNAL, JSON.stringify(data, null, 2));
  console.log(`Logged assistant entry (${data.length} total)`);
}

function main() {
  const [assistant = 'unknown', outcome = 'note', detail = ''] = process.argv.slice(2);
  appendEntry({ assistant, outcome, detail });
}

if (require.main === module) {
  main();
}
