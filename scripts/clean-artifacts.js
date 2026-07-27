#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  'artifacts/coverage',
  'artifacts/.nyc_output',
  'artifacts/lint',
  'artifacts/test',
  'artifacts/test-output',
  'artifacts/tmp',
  'coverage',
  '.nyc_output'
];

function removeTarget(target) {
  const fullPath = path.join(ROOT, target);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`🧹 removed ${target}`);
  }
}

function main() {
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  TARGETS.forEach(removeTarget);
  console.log('✅ artifacts cleaned');
}

if (require.main === module) {
  main();
}

module.exports = { main };
