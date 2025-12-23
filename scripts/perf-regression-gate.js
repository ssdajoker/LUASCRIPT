#!/usr/bin/env node
/**
 * Performance Regression Gate
 * Lightweight benchmark with tolerance band and drift detection.
 * Uploads artifacts to track performance over time.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  iterations: 50,
  tolerancePercent: 15, // Allow 15% performance variance
  baselineFile: path.join(__dirname, '../.perf-baseline.json'),
  resultFile: path.join(__dirname, '../artifacts/perf-regression-results.json'),
  artifactDir: path.join(__dirname, '../artifacts')
};

// Benchmark test cases
const BENCHMARKS = [
  {
    name: 'simple-assignment',
    code: 'let x = 5;',
    expectedMs: 0.5
  },
  {
    name: 'function-call',
    code: 'function f(n){ return n * 2; } f(10);',
    expectedMs: 1.0
  },
  {
    name: 'string-concat',
    code: 'const a = "hello"; const b = "world"; const c = a + " " + b;',
    expectedMs: 0.8
  },
  {
    name: 'array-literal',
    code: 'const arr = [1, 2, 3, 4, 5];',
    expectedMs: 0.7
  },
  {
    name: 'object-literal',
    code: 'const obj = { a: 1, b: 2, c: 3 };',
    expectedMs: 0.9
  },
  {
    name: 'if-else',
    code: 'if (true) { let x = 1; } else { let x = 2; }',
    expectedMs: 0.6
  },
  {
    name: 'while-loop',
    code: 'let i = 0; while (i < 10) { i++; }',
    expectedMs: 0.7
  },
  {
    name: 'for-loop',
    code: 'for (let i = 0; i < 10; i++) { }',
    expectedMs: 0.8
  }
];

function runBenchmark(benchmark) {
  try {
    const { UnifiedLuaScript } = require('../src/unified_luascript');
    const system = new UnifiedLuaScript();
    
    const times = [];
    const warmupIterations = 5;
    
    // Warm-up runs
    for (let i = 0; i < warmupIterations; i++) {
      system.transpile(benchmark.code);
    }
    
    // Actual benchmark
    for (let i = 0; i < CONFIG.iterations; i++) {
      const start = process.hrtime.bigint();
      system.transpile(benchmark.code);
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000); // Convert to ms
    }
    
    system.shutdown();
    
    // Calculate statistics
    times.sort((a, b) => a - b);
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const min = times[0];
    const max = times[times.length - 1];
    
    return {
      success: true,
      avg: avg.toFixed(3),
      median: median.toFixed(3),
      p95: p95.toFixed(3),
      min: min.toFixed(3),
      max: max.toFixed(3),
      samples: times.length
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

function loadBaseline() {
  try {
    if (fs.existsSync(CONFIG.baselineFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.baselineFile, 'utf8'));
    }
  } catch (err) {
    console.warn('⚠️  Could not load baseline:', err.message);
  }
  return null;
}

function saveBaseline(results) {
  try {
    const baseline = {
      timestamp: new Date().toISOString(),
      commit: getCommitHash(),
      benchmarks: {}
    };
    
    for (const result of results) {
      baseline.benchmarks[result.name] = {
        avg: parseFloat(result.avg),
        median: parseFloat(result.median),
        p95: parseFloat(result.p95)
      };
    }
    
    fs.writeFileSync(CONFIG.baselineFile, JSON.stringify(baseline, null, 2));
    console.log('✅ Baseline saved to', CONFIG.baselineFile);
  } catch (err) {
    console.warn('⚠️  Could not save baseline:', err.message);
  }
}

function saveResults(results, regressions) {
  try {
    fs.mkdirSync(CONFIG.artifactDir, { recursive: true });
    
    const output = {
      timestamp: new Date().toISOString(),
      commit: getCommitHash(),
      results,
      regressions,
      summary: {
        total: results.length,
        passed: results.filter(r => r.success && !r.regression).length,
        failed: results.filter(r => !r.success).length,
        regressed: regressions.length
      }
    };
    
    fs.writeFileSync(CONFIG.resultFile, JSON.stringify(output, null, 2));
    console.log('✅ Results saved to', CONFIG.resultFile);
  } catch (err) {
    console.warn('⚠️  Could not save results:', err.message);
  }
}

function getCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function checkRegression(name, current, baseline) {
  const currentAvg = parseFloat(current.avg);
  const baselineAvg = baseline.benchmarks[name]?.avg;
  
  if (!baselineAvg) {
    return { regressed: false, reason: 'no baseline' };
  }
  
  const change = ((currentAvg - baselineAvg) / baselineAvg) * 100;
  const tolerance = CONFIG.tolerancePercent;
  
  if (change > tolerance) {
    return {
      regressed: true,
      change: change.toFixed(2),
      baseline: baselineAvg.toFixed(3),
      current: currentAvg.toFixed(3),
      threshold: tolerance
    };
  }
  
  return {
    regressed: false,
    change: change.toFixed(2),
    baseline: baselineAvg.toFixed(3),
    current: currentAvg.toFixed(3)
  };
}

function displayResults(results, baseline) {
  console.log('\n📊 Performance Benchmark Results');
  console.log('─'.repeat(80));
  
  const regressions = [];
  
  for (const result of results) {
    if (!result.success) {
      console.log(`❌ ${result.name}: ${result.error}`);
      continue;
    }
    
    const regression = baseline ? checkRegression(result.name, result, baseline) : null;
    
    let statusIcon = '✅';
    let statusText = '';
    
    if (regression) {
      if (regression.regressed) {
        statusIcon = '🔴';
        statusText = ` REGRESSION: +${regression.change}% (${regression.baseline}ms → ${regression.current}ms)`;
        regressions.push({ name: result.name, ...regression });
      } else if (regression.reason === 'no baseline') {
        statusIcon = 'ℹ️';
        statusText = ' (no baseline)';
      } else {
        const changeNum = parseFloat(regression.change);
        if (changeNum < 0) {
          statusIcon = '🟢';
          statusText = ` IMPROVEMENT: ${regression.change}%`;
        } else {
          statusText = ` (+${regression.change}% within tolerance)`;
        }
      }
    }
    
    console.log(`${statusIcon} ${result.name}`);
    console.log(`   avg: ${result.avg}ms | median: ${result.median}ms | p95: ${result.p95}ms | range: ${result.min}-${result.max}ms${statusText}`);
  }
  
  console.log('─'.repeat(80));
  
  return regressions;
}

function main() {
  console.log('⚡ Performance Regression Gate');
  console.log(`Tolerance: ±${CONFIG.tolerancePercent}% | Iterations: ${CONFIG.iterations}`);
  console.log('');
  
  const baseline = loadBaseline();
  
  if (baseline) {
    console.log(`📌 Using baseline from ${baseline.timestamp} (${baseline.commit.substring(0, 7)})`);
  } else {
    console.log('ℹ️  No baseline found - this run will establish baseline');
  }
  
  console.log('\n🔄 Running benchmarks...\n');
  
  const results = [];
  
  for (const benchmark of BENCHMARKS) {
    process.stdout.write(`  Running ${benchmark.name}... `);
    const result = runBenchmark(benchmark);
    results.push({ name: benchmark.name, ...result });
    console.log(result.success ? '✅' : '❌');
  }
  
  const regressions = displayResults(results, baseline);
  
  // Save results as artifact
  saveResults(results, regressions);
  
  // Update baseline if requested or if no baseline exists
  if (!baseline || process.env.UPDATE_BASELINE === '1') {
    console.log('\n📝 Updating baseline...');
    saveBaseline(results);
  }
  
  // Summary
  console.log('\n📈 Summary');
  console.log('─'.repeat(80));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total benchmarks: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Regressions: ${regressions.length}`);
  
  if (regressions.length > 0) {
    console.log('\n🔴 Performance Regressions Detected:');
    for (const reg of regressions) {
      console.log(`  • ${reg.name}: +${reg.change}% (${reg.baseline}ms → ${reg.current}ms)`);
    }
    console.log('\n💡 To update baseline: UPDATE_BASELINE=1 npm run perf:gate');
  }
  
  console.log('─'.repeat(80));
  
  // Exit with error if regressions detected (unless explicitly allowed) or if any benchmark failed to run
  if ((regressions.length > 0 && process.env.ALLOW_REGRESSION !== '1') || failed > 0) {
    console.error('\n❌ Performance regression gate FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ Performance regression gate PASSED');
  }
}

if (require.main === module) {
  main();
}

module.exports = { runBenchmark, checkRegression, BENCHMARKS };
