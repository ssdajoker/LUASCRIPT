/**
 * Status Alignment Test
 *
 * Ensures basic alignment between claimed project phases and available test suites.
 * Does not execute heavy tests; acts as a quick gate to catch drift.
 */

const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function exists(rel) {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function main() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = readJSON(pkgPath);
  const phases = pkg.luascript && pkg.luascript.phases || {};

  const requiredPhaseTests = [
    'test/test_phase1_6_comprehensive.js',
    'test/test_phase9_ecosystem.js',
    'test/test_edge_cases_comprehensive.js'
  ];

  const missingTests = requiredPhaseTests.filter(t => !exists(t));
  const phaseKeys = Object.keys(phases);

  const problems = [];
  if (phaseKeys.length === 0) {
    problems.push('package.json.luascript.phases is missing or empty');
  }

  missingTests.forEach(t => problems.push(`Missing expected test suite: ${t}`));

  if (!exists('run_tests.sh')) {
    problems.push('Missing run_tests.sh harness');
  }

  if (problems.length) {
    console.error('Status alignment issues found:\n' + problems.map(p => ` - ${p}`).join('\n'));
    process.exit(1);
  }

  console.log('✅ Status alignment looks good. Phase keys:', phaseKeys.join(', '));
}

main();
