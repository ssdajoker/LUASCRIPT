#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FILES = [
  'scripts/run_verify.js',
  'scripts/ci_gates.js',
  'scripts/static_warnings_gate.js',
  'tests/quality/static_warnings_budget.test.js',
];

function checkFile(relPath) {
  const absPath = path.join(process.cwd(), relPath);
  const text = fs.readFileSync(absPath, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const issues = [];

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (/\s+$/.test(line)) {
      issues.push({ line: lineNo, message: 'Trailing whitespace' });
    }
    if (/\t/.test(line)) {
      issues.push({ line: lineNo, message: 'Tab character found' });
    }
  });

  if (!text.endsWith('\n')) {
    issues.push({ line: lines.length, message: 'File must end with a newline' });
  }

  return issues;
}

function main() {
  let failures = 0;
  FILES.forEach(rel => {
    if (!fs.existsSync(rel)) {
      console.warn(`⚠️  Skipping missing file: ${rel}`);
      return;
    }
    const issues = checkFile(rel);
    if (issues.length > 0) {
      failures += issues.length;
      console.error(`❌ ${rel} has formatting issues:`);
      issues.forEach(i => console.error(`   - line ${i.line}: ${i.message}`));
    } else {
      console.log(`✅ ${rel} is clean`);
    }
  });

  if (failures > 0) {
    console.error(`\n❌ Formatting gate failed with ${failures} issue(s).`);
    process.exit(1);
  }

  console.log('\n✅ Formatting gate passed');
}

if (require.main === module) {
  main();
}

module.exports = { FILES, checkFile };
