#!/usr/bin/env node

/**
 * PHASE 3.6 - SLO GATES VALIDATION TEST
 * Validates latency, memory, and throughput thresholds
 */

const { evaluateSloGates } = require('../../src/optimizers/javascript/quality/slo-gates.js');

console.log('=== PHASE 3.6: SLO GATES VALIDATION ===\n');

// Test SLO gates with typical metrics
const testCases = [
  {
    name: 'Buffer Overflow Detection (Low Load)',
    metrics: {
      latencyMs: 35,
      baselineMemoryBytes: 1024000,
      currentMemoryBytes: 1024000,
      throughputOpsPerSec: 2500
    }
  },
  {
    name: 'Type Confusion Prevention (Moderate Load)',
    metrics: {
      latencyMs: 150,
      baselineMemoryBytes: 2048000,
      currentMemoryBytes: 2150000,
      throughputOpsPerSec: 1500
    }
  },
  {
    name: 'Register Pressure Analysis (High Load)',
    metrics: {
      latencyMs: 195,
      baselineMemoryBytes: 5120000,
      currentMemoryBytes: 5200000,
      throughputOpsPerSec: 1050
    }
  },
  {
    name: 'Edge Case - High Latency',
    metrics: {
      latencyMs: 250,
      baselineMemoryBytes: 1024000,
      currentMemoryBytes: 1024000,
      throughputOpsPerSec: 500
    }
  }
];

let passCount = 0;
const results = [];

testCases.forEach(({ name, metrics }) => {
  const result = evaluateSloGates(metrics);
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  
  if (result.success) passCount++;
  
  console.log(`✓ ${name}:`);
  console.log(`  Latency: ${metrics.latencyMs}ms (limit: ${result.metrics.limits.latencyMs}ms)`);
  console.log(`  Memory: ${((metrics.currentMemoryBytes / metrics.baselineMemoryBytes) * 100).toFixed(1)}% (limit: ${(result.metrics.limits.memoryRatio * 100).toFixed(0)}%)`);
  console.log(`  Throughput: ${metrics.throughputOpsPerSec} ops/sec (limit: ${result.metrics.limits.throughputOpsPerSec})`);
  if (result.failures.length > 0) {
    console.log(`  Failures: ${result.failures.join(', ')}`);
  }
  console.log(`  Result: ${status}\n`);
  
  results.push({
    name,
    passed: result.success,
    gates: result.metrics,
    failures: result.failures
  });
});

console.log(`SLO Gates Summary: ${passCount}/${testCases.length} passed`);
console.log(`Overall: ${passCount === testCases.length ? '✅ ALL PASS' : '⚠️  SOME FAILURES'}\n`);

process.exit(passCount === testCases.length ? 0 : 1);
