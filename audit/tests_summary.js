#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIT = process.env.AUDIT_DIR ? path.resolve(process.env.AUDIT_DIR) : path.resolve(__dirname);

function main() {
  const lines = ['# Tests Report', ''];
  // Discover tests directories
  const candidates = ['test', 'tests', 'spec', 'specs'];
  const found = candidates.filter(d => fs.existsSync(path.join(ROOT, d)));
  lines.push('## Test Directories');
  if (found.length) lines.push('', ...found.map(d => `- ${d}`), ''); else lines.push('', '_None detected_', '');

  // Append captured outputs if present
  const cap = path.join(AUDIT, 'tests_output.txt');
  if (fs.existsSync(cap)) {
    lines.push('## Captured Output', '', '```', fs.readFileSync(cap,'utf8').slice(0,40000), '```');
  }
  fs.writeFileSync(path.join(AUDIT, 'tests_report.md'), lines.join('\n'));
  console.log('tests_report.md written');
}

if (require.main === module) main();
