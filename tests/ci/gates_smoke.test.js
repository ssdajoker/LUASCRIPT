/**
 * CI Gates Smoke Test
 *
 * Verifies existence of key npm scripts used for CI gates to avoid drift.
 */

const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const pkg = readJSON(path.join(process.cwd(), 'package.json'));
  const scripts = pkg.scripts || {};
  const required = [
    'harness',
    'ir:validate:all',
    'test:parity',
    'test:core',
    'test:edge',
    'refactor:fuzz'
  ];

  const missing = required.filter(k => !scripts[k]);
  if (missing.length) {
    console.error('❌ Missing CI gate scripts: ' + missing.join(', '));
    process.exit(1);
  }

  console.log('✅ CI gate scripts present:', required.join(', '));
}

main();
