/**
 * Static Warnings Budget Test
 *
 * Reads the best available static warnings snapshot and enforces a configurable budget.
 * Prefer cleaner snapshots (near_final → clean → base) to encourage burn down.
 */

const {
  DEFAULT_CANDIDATES,
  findWarningsFile,
  countWarnings,
  resolveBudget,
} = require('../../scripts/static_warnings_gate');
const fs = require('fs');

function main() {
  const candidates = process.env.WARN_FILE ? [process.env.WARN_FILE] : DEFAULT_CANDIDATES;
  const found = findWarningsFile(candidates);
  if (!found) {
    console.warn('⚠️ No static warnings file found; skipping budget check.');
    return;
  }

  const text = fs.readFileSync(found.abs, 'utf8');
  const count = countWarnings(text);
  const budget = resolveBudget(
    found.rel,
    count,
    process.env.WARN_BUDGET,
    text
  );
  const enforce = process.env.ENFORCE_WARN_BUDGET === '1';

  console.log(`Static warnings: ${count} (file: ${found.rel})`);
  console.log(`Budget=${budget}; enforcement=${enforce ? 'on' : 'off'}`);

  if (enforce && count > budget) {
    console.error(`❌ Static warnings (${count}) exceed budget (${budget}).`);
    process.exit(1);
  }

  console.log(`✅ Budget check ${enforce ? 'enforced' : 'informational'}; budget=${budget}.`);
}

main();
