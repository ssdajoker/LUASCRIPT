#!/usr/bin/env node

/**
 * PHASE 3.6 - DETERMINISM VERIFICATION TEST
 * Validates that critical optimizers produce identical output across 10+ runs
 */

const { analyzeBufferOverflow } = require('../../src/optimizers/javascript/security/buffer-overflow-detection.js');
const { analyzeTypeConfusion } = require('../../src/optimizers/javascript/security/type-confusion-prevention.js');
const { analyzeRegisterPressure } = require('../../src/optimizers/javascript/memory/register-pressure.js');
const { verifyDeterminism } = require('../../src/optimizers/javascript/quality/determinism-verifier.js');

console.log('=== PHASE 3.6: DETERMINISM VERIFICATION ===\n');

// Test determinism for each major optimizer
const testCases = [
  {
    name: 'Buffer Overflow Detection',
    mod: analyzeBufferOverflow,
    ir: { 
      program: { 
        type: 'Program', 
        body: [
          { 
            type: 'VariableDeclaration', 
            declarations: [
              { 
                id: { name: 'arr' }, 
                init: { type: 'ArrayExpression', elements: [{}, {}, {}] } 
              }
            ] 
          }
        ] 
      } 
    }
  },
  {
    name: 'Type Confusion Prevention',
    mod: analyzeTypeConfusion,
    ir: { 
      program: { 
        type: 'Program', 
        body: [
          { 
            type: 'ExpressionStatement', 
            expression: { 
              type: 'BinaryExpression', 
              operator: '+', 
              left: { type: 'Identifier', name: 'x' }, 
              right: { type: 'Literal', value: '5' } 
            } 
          }
        ] 
      } 
    }
  },
  {
    name: 'Register Pressure Analysis',
    mod: analyzeRegisterPressure,
    ir: { 
      program: { 
        type: 'Program', 
        body: [
          { 
            type: 'VariableDeclaration', 
            declarations: [
              { id: { name: 'v1' } }, 
              { id: { name: 'v2' } }
            ] 
          }
        ] 
      } 
    }
  }
];

let allPassed = true;
const results = [];

// Normalize function: remove timestamps for determinism checking
function normalizeOutput(output) {
  const normalized = JSON.parse(JSON.stringify(output));
  delete normalized.timestamp;
  if (normalized.analysis && normalized.analysis.timestamp) {
    delete normalized.analysis.timestamp;
  }
  return normalized;
}

testCases.forEach(({ name, mod, ir }) => {
  const result = verifyDeterminism({
    run: () => mod(ir),
    runs: 10,
    normalize: normalizeOutput,
    label: name
  });
  
  console.log(`✓ ${name}:`);
  console.log(`  Runs: ${result.runs}, Unique hashes: ${result.uniqueHashes.length}`);
  console.log(`  Duration: ${result.durationMs.toFixed(2)}ms`);
  console.log(`  Result: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`);
  
  results.push({
    name,
    passed: result.success,
    runs: result.runs,
    uniqueHashes: result.uniqueHashes.length,
    durationMs: result.durationMs
  });
  
  if (!result.success) allPassed = false;
});

console.log(`Overall Determinism: ${allPassed ? '✅ ALL PASS' : '❌ FAILURES DETECTED'}`);
console.log(`\nResults Summary:`);
console.log(JSON.stringify({ determinism: results, allPassed }, null, 2));

process.exit(allPassed ? 0 : 1);
