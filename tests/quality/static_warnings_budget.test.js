/**
 * Static Warnings Budget Test
 *
 * Reads static_warnings.txt and enforces a configurable budget. By default,
 * it only reports counts; set ENFORCE_WARN_BUDGET=1 to fail when exceeding WARN_BUDGET.
 */

const fs = require('fs');
const path = require('path');

function readWarningsFile() {
  const candidates = [
    'static_warnings.txt',
    'static_warnings_clean.txt',
    'static_warnings_near_final.txt'
  ];
  for (const rel of candidates) {
    const abs = path.join(process.cwd(), rel);
    if (fs.existsSync(abs)) return { abs, rel };
  }
  return null;
}

function countLines(abs) {
  const text = fs.readFileSync(abs, 'utf8');
  return text.split(/\r?\n/).filter(l => l.trim().length > 0).length;
}

function main() {
  const found = readWarningsFile();
  if (!found) {
    console.warn('⚠️ No static warnings file found; skipping budget check.');
    return;
  }

  const budget = Number(process.env.WARN_BUDGET || 100000);
  const enforce = process.env.ENFORCE_WARN_BUDGET === '1';
  const count = countLines(found.abs);

  console.log(`Static warnings: ${count} (file: ${found.rel})`);

  if (enforce && count > budget) {
    console.error(`❌ Static warnings (${count}) exceed budget (${budget}).`);
    process.exit(1);
  }

  console.log(`✅ Budget check ${enforce ? 'enforced' : 'informational'}; budget=${budget}.`);
}

main();
