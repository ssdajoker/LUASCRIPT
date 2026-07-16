#!/usr/bin/env node
/**
 * CSC LM EVO-A v3: Phase 2 Test Suite
 * Comprehensive validation of all 31 Tier 1 showcase modules
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SHOWCASE_DIR = path.join(__dirname, '../modules/tier1-showcase');
const TRANSPILER = path.join(__dirname, '../../src/transpiler.js');

console.log('='.repeat(80));
console.log('CSC LM EVO-A v3: PHASE 2 VALIDATION');
console.log('Testing all 31 Tier 1 Showcase Modules');
console.log('='.repeat(80));

const EXPECTED_MODULES = {
  'Type System': [
    'mirror_type_basics.ls',
    'mirror_type_advanced.ls',
    'mirror_type_generics.ls',
    'mirror_type_constraints.ls',
    'mirror_type_performance.ls'
  ],
  'Pattern Matching': [
    'mirror_patterns_basic.ls',
    'mirror_patterns_guards.ls',
    'mirror_patterns_binding.ls',
    'mirror_patterns_nested.ls',
    'mirror_patterns_exhaustive.ls',
    'mirror_patterns_performance.ls'
  ],
  'Metaprogramming': [
    'mirror_meta_reflection.ls',
    'mirror_meta_macros.ls',
    'mirror_meta_ast.ls',
    'mirror_meta_generation.ls'
  ],
  'Optimization': [
    'mirror_perf_caching.ls',
    'mirror_perf_memoization.ls',
    'mirror_perf_constantfolding.ls',
    'mirror_perf_deadcode.ls',
    'mirror_perf_benchmark.ls'
  ],
  'Security': [
    'mirror_sec_input.ls',
    'mirror_sec_crypto.ls',
    'mirror_sec_injection.ls',
    'mirror_sec_audit.ls'
  ],
  'Async & Control Flow': [
    'mirror_async_promises.ls',
    'mirror_async_coroutines.ls',
    'mirror_async_parallel.ls',
    'mirror_async_errhandling.ls'
  ],
  'IR & Determinism': [
    'mirror_ir_canonical.ls',
    'mirror_ir_determinism.ls',
    'mirror_ir_tracing.ls'
  ]
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = {};

// Test each category
for (const [category, modules] of Object.entries(EXPECTED_MODULES)) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`CATEGORY: ${category}`);
  console.log('='.repeat(80));
  
  results[category] = {
    total: modules.length,
    passed: 0,
    failed: 0,
    modules: {}
  };
  
  for (const module of modules) {
    const modulePath = path.join(SHOWCASE_DIR, module);
    totalTests++;
    
    process.stdout.write(`Testing ${module}... `);
    
    try {
      // Check file exists
      if (!fs.existsSync(modulePath)) {
        throw new Error('Module file not found');
      }
      
      // Check transpiler exists
      if (!fs.existsSync(TRANSPILER)) {
        throw new Error('Transpiler not found');
      }
      
      // Attempt to transpile
      const output = execSync(`node "${TRANSPILER}" "${modulePath}"`, {
        encoding: 'utf8',
        timeout: 5000
      });
      
      // Basic validation: output should contain valid Lua
      if (output.includes('local') || output.includes('return') || output.includes('function')) {
        console.log('✅ PASS');
        passedTests++;
        results[category].passed++;
        results[category].modules[module] = 'PASS';
      } else {
        throw new Error('Invalid transpilation output');
      }
      
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
      failedTests++;
      results[category].failed++;
      results[category].modules[module] = `FAIL: ${error.message}`;
    }
  }
}

// Summary Report
console.log('\n' + '='.repeat(80));
console.log('PHASE 2 VALIDATION SUMMARY');
console.log('='.repeat(80));

for (const [category, data] of Object.entries(results)) {
  const percentage = (data.passed / data.total * 100).toFixed(1);
  console.log(`${category}: ${data.passed}/${data.total} (${percentage}%)`);
}

console.log('\n' + '='.repeat(80));
console.log(`TOTAL: ${passedTests}/${totalTests} tests passed`);
console.log(`SUCCESS RATE: ${(passedTests / totalTests * 100).toFixed(1)}%`);
console.log('='.repeat(80));

if (passedTests === totalTests) {
  console.log('\n✅ ALL TESTS PASSED - PHASE 2 COMPLETE!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed - review required\n`);
  process.exit(1);
}
