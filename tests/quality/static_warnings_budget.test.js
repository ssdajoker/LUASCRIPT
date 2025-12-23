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

function main() {
  const candidates = process.env.WARN_FILE ? [process.env.WARN_FILE] : DEFAULT_CANDIDATES;
  const found = findWarningsFile(candidates);
  if (!found) {
    console.warn('⚠️ No static warnings file found; skipping budget check.');
    return;
  }

  const budget = resolveBudget(
    found.rel,
    countWarnings(found.abs),
    process.env.WARN_BUDGET,
    found.abs
  );
  const enforce = process.env.ENFORCE_WARN_BUDGET === '1';
  const count = countWarnings(found.abs);

  console.log(`Static warnings: ${count} (file: ${found.rel})`);
  console.log(`Budget=${budget}; enforcement=${enforce ? 'on' : 'off'}`);

  if (enforce && count > budget) {
    console.error(`❌ Static warnings (${count}) exceed budget (${budget}).`);
    process.exit(1);
  }

  console.log(`✅ Budget check ${enforce ? 'enforced' : 'informational'}; budget=${budget}.`);
}

main();
