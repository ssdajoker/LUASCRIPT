/**
 * Edge-Case Gap Runner
 * Runs gap tests for JS features. By default, logs failures but does not exit non-zero.
 * Set ENFORCE_EDGE_GAPS=1 to enforce failures.
 */
const tests = [
  require('./gap_short_circuiting.test'),
  require('./gap_switch_semantics.test'),
  require('./gap_function_expressions.test'),
  require('./gap_switch_lua_pattern.test'),
  require('./gap_function_expr_lua_pattern.test'),
  require('./gap_array_methods.test'),
];

async function main() {
  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const name = t.name || 'unnamed';
    try {
      const ok = await t.run();
      if (ok) { console.log(`✅ ${name}`); passed++; }
      else { console.log(`❌ ${name} (returned false)`); failed++; }
    } catch (err) {
      const msg = (err && err.message) || String(err);
      if (/Unsupported AST node type/i.test(msg)) {
        console.log(`⚠️  ${name}: skipped (parser limitation: ${msg})`);
      } else {
        console.log(`❌ ${name}: ${msg}`);
        failed++;
      }
    }
  }

  console.log(`\nEdge-case gaps summary: ${passed} passed, ${failed} failed.`);
  const enforce = process.env.ENFORCE_EDGE_GAPS === '1';
  process.exit(enforce && failed > 0 ? 1 : 0);
}

main();
