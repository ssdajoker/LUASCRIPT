#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_CANDIDATES = [
  'static_warnings_near_final.txt',
  'static_warnings_clean.txt',
  'static_warnings.txt',
];

const FILE_BUDGETS = {
  'static_warnings_near_final.txt': 27,
  'static_warnings_clean.txt': 71,
  'static_warnings.txt': 324,
};

function findWarningsFile(candidates = DEFAULT_CANDIDATES) {
  for (const rel of candidates) {
    const abs = path.join(process.cwd(), rel);
    if (fs.existsSync(abs)) {
      return { rel, abs };
    }
  }
  return null;
}

function countWarnings(text) {
  return text.split(/\r?\n/).filter(l => l.trim().startsWith('not ok')).length;
}

function parseHeaderBudget(text) {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const match = firstLine.match(/^(\d+)\.\.(\d+)$/);
  if (!match) return null;
  const upper = Number(match[2]);
  return Number.isFinite(upper) ? upper : null;
function parseHeaderBudget(abs) {
  // Read only the beginning of the file to extract the first line efficiently.
  let fd;
  try {
    fd = fs.openSync(abs, 'r');
    const bufferSize = 256; // More than enough for a simple header line.
    const buffer = Buffer.alloc(bufferSize);
    const bytesRead = fs.readSync(fd, buffer, 0, bufferSize, 0);
    if (bytesRead <= 0) return null;

    const content = buffer.slice(0, bytesRead).toString('utf8');
    const firstLine = content.split(/\r?\n/)[0] || '';
    const match = firstLine.match(/^(\d+)\.\.(\d+)$/);
    if (!match) return null;
    const upper = Number(match[2]);
    return Number.isFinite(upper) ? upper : null;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch (_) {
        // Ignore close errors; they don't affect parsing result.
      }
    }
  }
}

function resolveBudget(rel, count, budgetOverride, text) {
  if (budgetOverride !== undefined) {
    const parsed = Number(budgetOverride);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid WARN_BUDGET value: ${budgetOverride}`);
    }
    return parsed;
  }

  if (FILE_BUDGETS[rel] !== undefined) {
    return FILE_BUDGETS[rel];
  }

  const headerBudget = text ? parseHeaderBudget(text) : null;
  if (headerBudget !== null) return headerBudget;

  return count;
}

function report(found, count, budget, enforce) {
  console.log(`Static warnings: ${count} (file: ${found.rel}, budget: ${budget})`);
  if (count > budget) {
    const overage = count - budget;
    const message = `Static warnings exceed budget by ${overage} (count=${count}, budget=${budget})`;
    if (enforce) {
      console.error(`❌ ${message}`);
      process.exit(1);
    } else {
      console.warn(`⚠️  ${message}`);
    }
  } else {
    console.log('✅ Static warnings within budget');
  }
}

function main() {
  const candidates = process.env.WARN_FILE ? [process.env.WARN_FILE] : DEFAULT_CANDIDATES;
  const found = findWarningsFile(candidates);
  if (!found) {
    console.warn('⚠️  No static warnings file found; skipping budget check.');
    return;
  }

  const text = fs.readFileSync(found.abs, 'utf8');
  const count = countWarnings(text);
  const budget = resolveBudget(found.rel, count, process.env.WARN_BUDGET, text);
  const enforce = process.env.ENFORCE_WARN_BUDGET !== '0';

  report(found, count, budget, enforce);
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_CANDIDATES,
  FILE_BUDGETS,
  findWarningsFile,
  countWarnings,
  resolveBudget,
  parseHeaderBudget,
};
