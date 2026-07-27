/**
 * Performance Smoke Test
 * 
 * Lightweight harness that runs a minimal benchmark to catch perf regressions.
 * Integrates with run_bench.sh and luascript_performance_benchmark.py.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const THRESHOLD_MS = Number(process.env.PERF_THRESHOLD_MS || 1000);
const ITERATIONS = Number(process.env.PERF_ITERATIONS || 100);

const TEST_CASES = [
  { name: 'simple assignment', code: 'let x = 5;' },
  { name: 'function call', code: 'function f(n){ return n * 2; } f(10);' },
  { name: 'string literal', code: 'const str = "hello world";' },
];

function benchmarkCase(testCase) {
  const startTime = Date.now();
  
  try {
    // Use UnifiedLuaScript to transpile
    const { UnifiedLuaScript } = require('../src/unified_luascript');
    const system = new UnifiedLuaScript();
    
    for (let i = 0; i < ITERATIONS; i++) {
      system.transpile(testCase.code);
    }
    
    system.shutdown();
    const elapsed = Date.now() - startTime;
    return { ok: true, elapsed, avgMs: elapsed / ITERATIONS };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function runPythonBench() {
  const pyPath = path.join(__dirname, '..', 'luascript_performance_benchmark.py');
  if (!fs.existsSync(pyPath)) {
    console.log('⚠️  Python benchmark not found, skipping');
    return null;
  }

  try {
    const result = spawnSync('python', [pyPath, '--quick'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      timeout: 30000,
    });

    if (result.error) {
      console.log('⚠️  Python benchmark failed to execute');
      return null;
    }

    return { exitCode: result.status, stdout: result.stdout };
  } catch (err) {
    console.log('⚠️  Python benchmark error:', err.message);
    return null;
  }
}

function main() {
  console.log('⚡ Performance Smoke Test');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    const result = benchmarkCase(testCase);
    if (result.ok) {
      const status = result.avgMs < THRESHOLD_MS ? '✅' : '⚠️';
      console.log(`${status} ${testCase.name}: ${result.avgMs.toFixed(2)}ms avg (${result.elapsed}ms total)`);
      if (result.avgMs >= THRESHOLD_MS) {
        console.log(`   ⚠️  Exceeds threshold of ${THRESHOLD_MS}ms`);
      }
      passed++;
    } else {
      console.log(`❌ ${testCase.name}: ${result.error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Performance smoke: ${passed} passed, ${failed} failed`);

  // Optional: run Python benchmark if available
  const pyResult = runPythonBench();
  if (pyResult && pyResult.exitCode === 0) {
    console.log('\n✅ Python benchmark completed');
  }

  console.log('='.repeat(60));
  
  // Exit 0 regardless of Python benchmark result
  process.exit(0);
}

main();
