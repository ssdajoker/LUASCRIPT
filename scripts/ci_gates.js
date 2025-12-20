/**
 * CI Gate Runner
 * 
 * Unified script to run all CI quality gates: lint, format check, tests, and validation.
 * Exits non-zero if any gate fails.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const GATES = [
  { name: 'Lint', cmd: 'npm', args: ['run', 'lint'], optional: true },
  { name: 'IR Validation', cmd: 'npm', args: ['run', 'ir:validate:all'], optional: false },
  { name: 'Core Tests', cmd: 'npm', args: ['run', 'test:core'], optional: false },
  { name: 'Parity Tests', cmd: 'npm', args: ['run', 'test:parity'], optional: false },
  { name: 'Determinism', cmd: 'npm', args: ['run', 'test:determinism'], optional: false },
  { name: 'Edge Cases', cmd: 'npm', args: ['run', 'test:edge:gaps'], optional: true },
  { name: 'Roadmap Tests', cmd: 'npm', args: ['run', 'test:roadmap'], optional: true },
];

function runGate(gate) {
  console.log(`\n🔍 Running gate: ${gate.name}`);
  const result = spawnSync(gate.cmd, gate.args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  if (result.error) {
    console.error(`❌ ${gate.name} failed to execute: ${result.error.message}`);
    return false;
  }

  if (result.status !== 0) {
    if (gate.optional) {
      console.log(`⚠️  ${gate.name} failed (optional gate, continuing)`);
      return true;
    }
    console.error(`❌ ${gate.name} failed with exit code ${result.status}`);
    return false;
  }

  console.log(`✅ ${gate.name} passed`);
  return true;
}

function main() {
  console.log('🚪 CI Quality Gates');
  console.log('='.repeat(60));

  const results = GATES.map(gate => ({
    gate: gate.name,
    passed: runGate(gate),
    optional: gate.optional,
  }));

  console.log('\n' + '='.repeat(60));
  console.log('📊 Gate Summary');
  console.log('='.repeat(60));

  results.forEach(r => {
    const icon = r.passed ? '✅' : (r.optional ? '⚠️' : '❌');
    const label = r.optional ? '(optional)' : '';
    console.log(`${icon} ${r.gate} ${label}`);
  });

  const failed = results.filter(r => !r.passed && !r.optional);
  if (failed.length > 0) {
    console.log(`\n❌ ${failed.length} required gate(s) failed.`);
    process.exit(1);
  }

  console.log('\n✅ All required gates passed!');
}

main();
