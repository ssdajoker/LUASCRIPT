/**
 * Simple Jest-compatible test runner for Phase B validation
 * Runs tests without requiring Jest installation
 */

const LuaScriptTranspiler = require('../src/transpiler');
const { AdvancedCache } = require('../src/optimizations/speed_optimization');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

// Test framework mock
const tests = [];
const describes = [];
let currentDescribe = null;

global.describe = (name, fn) => {
  const describe = { name, tests: [], befores: [] };
  describes.push(describe);
  currentDescribe = describe;
  fn();
  currentDescribe = null;
};

global.test = (name, fn) => {
  if (currentDescribe) {
    currentDescribe.tests.push({ name, fn });
  } else {
    tests.push({ name, fn });
  }
};

global.beforeEach = (fn) => {
  if (currentDescribe) {
    currentDescribe.befores.push(fn);
  }
};

global.expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to be ${expected}`);
    }
  },
  toContain: (expected) => {
    if (!actual.includes(expected)) {
      throw new Error(`Expected ${actual} to contain ${expected}`);
    }
  },
  toBeDefined: () => {
    if (actual === undefined) {
      throw new Error(`Expected value to be defined`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected ${actual} to be truthy`);
    }
  },
  toBeInstanceOf: (cls) => {
    if (!(actual instanceof cls)) {
      throw new Error(`Expected ${actual} to be instance of ${cls.name}`);
    }
  },
  toBeGreaterThan: (expected) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toBeGreaterThanOrEqual: (expected) => {
    if (actual < expected) {
      throw new Error(`Expected ${actual} to be >= ${expected}`);
    }
  },
  toBeLessThan: (expected) => {
    if (actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`);
    }
  },
  toThrow: (pattern) => {
    try {
      actual();
      throw new Error(`Expected function to throw`);
    } catch (err) {
      if (pattern && !pattern.test(err.message)) {
        throw new Error(`Expected error message "${err.message}" to match ${pattern}`);
      }
    }
  },
  not: {
    toThrow: () => {
      try {
        actual();
      } catch (err) {
        throw new Error(`Expected function not to throw, but got: ${err.message}`);
      }
    }
  }
});

// Run Phase B tests
require('./phase_b_tier1_validation.test.js');

// Execute tests
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

console.log('\n='.repeat(80));
console.log('PHASE B: TIER 1 VALIDATION - TEST EXECUTION');
console.log('='.repeat(80));

describes.forEach(describe => {
  console.log(`\n${describe.name}`);
  
  describe.tests.forEach(test => {
    totalTests++;
    
    try {
      // Run beforeEach
      describe.befores.forEach(before => before());
      
      // Run test
      test.fn();
      
      passedTests++;
      console.log(`  ✓ ${test.name}`);
    } catch (err) {
      failedTests++;
      console.log(`  ✗ ${test.name}`);
      console.log(`    Error: ${err.message}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(80));
console.log(`PHASE B RESULTS: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)`);
console.log(`  ✓ Passed: ${passedTests}`);
console.log(`  ✗ Failed: ${failedTests}`);
console.log('='.repeat(80) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
