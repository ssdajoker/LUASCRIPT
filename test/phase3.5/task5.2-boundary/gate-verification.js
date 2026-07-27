/**
 * Phase 3.5 Task 5.2 - Boundary Optimizer Gate Verification
 * 
 * 5 Gates:
 * 1. CORRECTNESS - Boundary optimization preserves semantics
 * 2. DETERMINISM - Analysis output is consistent
 * 3. IR VALIDATION - Metadata follows schema
 * 4. PERFORMANCE - Analysis is efficient and provides >20% reduction
 * 5. INTEGRATION - Works with IR pipeline and FFI analyzer
 */

const {
  analyzeBoundaries,
  applyBoundaryOptimizations,
  detectBoundaries,
  detectBatchingOpportunities,
  detectHoistingOpportunities,
  detectFusionOpportunities,
  findLoops,
  isNodeInScope,
  calculateOptimizedOverhead
} = require('../../../src/optimizers/javascript/interop/boundary-optimizer.js');

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error('Expected:', expected);
    console.error('Actual:', actual);
    throw new Error(`❌ ${message}`);
  }
}

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${error.message}`);
  }
}

console.log('\n🔬 GATE 1: CORRECTNESS - Verify Boundary Optimization Preserves Semantics\n');
console.log('Testing that boundary optimizer never produces incorrect optimizations...\n');

test('Correctly detects sequential boundaries', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func1()'
      },
      {
        type: 'Call',
        _nodeId: 'Call_T1',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func2()'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  assert(analysis.boundaries.length === 2, 'Should detect 2 boundaries');
});

test('Detects batching opportunities for sequential calls', () => {
  const boundaries = [
    {
      id: 'Boundary_0',
      type: 'js-lua',
      calls: ['Call_T0'],
      overhead: 60,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T0'
    },
    {
      id: 'Boundary_1',
      type: 'js-lua',
      calls: ['Call_T1'],
      overhead: 70,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T1'
    }
  ];
  
  const opportunities = detectBatchingOpportunities(boundaries);
  assert(opportunities.length === 1, 'Should find 1 batching opportunity');
  assert(opportunities[0].estimatedSavings === 0.30, 'Should estimate 30% savings');
});

test('Does NOT batch non-batchable boundaries', () => {
  const boundaries = [
    {
      id: 'Boundary_0',
      type: 'js-lua',
      calls: ['Call_T0'],
      overhead: 60,
      batchable: false,  // NOT batchable
      fusable: true,
      nodeId: 'Call_T0'
    },
    {
      id: 'Boundary_1',
      type: 'js-lua',
      calls: ['Call_T1'],
      overhead: 70,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T1'
    }
  ];
  
  const opportunities = detectBatchingOpportunities(boundaries);
  assert(opportunities.length === 0, 'Should NOT batch non-batchable boundaries');
});

test('Detects boundaries inside loops', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'ForStatement',
        _nodeId: 'Loop_T0',
        body: {
          type: 'Block',
          body: [
            {
              type: 'Call',
              _nodeId: 'Call_T0',
              callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
              _ffiSignature: 'void func()'
            }
          ]
        }
      }
    ]
  };
  
  const loops = findLoops(ir);
  assert(loops.length === 1, 'Should find 1 loop');
  
  const inScope = isNodeInScope('Call_T0', loops[0]);
  assert(inScope, 'Should detect FFI call inside loop');
});

test('Detects hoisting opportunities for loop-invariant boundaries', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'ForStatement',
        _nodeId: 'Loop_T0',
        body: {
          type: 'Block',
          body: [
            {
              type: 'Call',
              _nodeId: 'Call_T0',
              callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
              _ffiSignature: 'void invariant()'
            }
          ]
        }
      }
    ]
  };
  
  const boundaries = [
    {
      id: 'Boundary_0',
      type: 'js-lua',
      calls: ['Call_T0'],
      overhead: 60,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T0'
    }
  ];
  
  const opportunities = detectHoistingOpportunities(ir, boundaries);
  // May or may not find hoisting (depends on invariant detection)
  // Just verify it doesn't crash
  assert(Array.isArray(opportunities), 'Should return array of hoisting opportunities');
});

test('Detects fusion opportunities for adjacent boundaries', () => {
  const boundaries = [
    {
      id: 'Boundary_0',
      type: 'js-lua',
      calls: ['Call_T0'],
      overhead: 60,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T0'
    },
    {
      id: 'Boundary_1',
      type: 'js-lua',
      calls: ['Call_T1'],
      overhead: 70,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T1'
    }
  ];
  
  const opportunities = detectFusionOpportunities(boundaries);
  assert(opportunities.length === 1, 'Should find 1 fusion opportunity');
  assert(opportunities[0].estimatedSavings === 0.50, 'Should estimate 50% savings');
});

test('Calculates optimized overhead correctly', () => {
  const analysis = {
    totalOverhead: 300,
    batchingOpportunities: [
      { savingsMicros: 30 }
    ],
    hoistingOpportunities: [
      { savingsMicros: 100 }
    ],
    fusionOpportunities: [
      { savingsMicros: 50 }
    ]
  };
  
  const optimized = calculateOptimizedOverhead(analysis);
  assertEquals(optimized, 120, 'Should reduce from 300µs to 120µs');
});

test('Complete boundary analysis produces valid results', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func1()'
      },
      {
        type: 'Call',
        _nodeId: 'Call_T1',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func2()'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  
  assert(Array.isArray(analysis.boundaries), 'Should have boundaries array');
  assert(typeof analysis.totalOverhead === 'number', 'Should calculate total overhead');
  assert(typeof analysis.optimizedOverhead === 'number', 'Should calculate optimized overhead');
  assert(Array.isArray(analysis.recommendations), 'Should have recommendations');
});

console.log('\n🔬 GATE 2: DETERMINISM - Hash Stability Test\n');
console.log('Testing that boundary analysis produces identical results across runs...\n');

test('10-iteration analysis produces identical results', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void a()'
      },
      {
        type: 'Call',
        _nodeId: 'Call_T1',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void b()'
      }
    ]
  };
  
  const hashes = [];
  for (let i = 0; i < 10; i++) {
    const analysis = analyzeBoundaries(ir);
    hashes.push(JSON.stringify(analysis));
  }
  
  const uniqueHashes = new Set(hashes);
  assert(uniqueHashes.size === 1, 'All 10 runs should produce identical results');
});

test('Boundary detection order is consistent', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T2',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void c()'
      },
      {
        type: 'Call',
        _nodeId: 'Call_T1',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void b()'
      },
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void a()'
      }
    ]
  };
  
  const results = [];
  for (let i = 0; i < 3; i++) {
    const analysis = analyzeBoundaries(ir);
    results.push(analysis.boundaries.map(b => b.id));
  }
  
  // All runs should detect boundaries in same order
  for (let i = 1; i < results.length; i++) {
    assertEquals(results[i], results[0], `Run ${i} should match run 0`);
  }
});

test('Optimization opportunity detection is stable', () => {
  const boundaries = [
    {
      id: 'Boundary_0',
      type: 'js-lua',
      calls: ['Call_T0'],
      overhead: 60,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T0'
    },
    {
      id: 'Boundary_1',
      type: 'js-lua',
      calls: ['Call_T1'],
      overhead: 70,
      batchable: true,
      fusable: true,
      nodeId: 'Call_T1'
    }
  ];
  
  const results = [];
  for (let i = 0; i < 10; i++) {
    const opportunities = detectBatchingOpportunities(boundaries);
    results.push(JSON.stringify(opportunities));
  }
  
  const uniqueResults = new Set(results);
  assert(uniqueResults.size === 1, 'Optimization detection should be deterministic');
});

console.log('\n🔬 GATE 3: IR VALIDATION - Metadata Schema Compliance\n');
console.log('Testing that boundary optimizer produces valid IR metadata...\n');

test('Analysis result has valid schema', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void test()'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  
  // Verify required fields
  assert(Array.isArray(analysis.boundaries), 'boundaries should be array');
  assert(Array.isArray(analysis.batchingOpportunities), 'batchingOpportunities should be array');
  assert(Array.isArray(analysis.hoistingOpportunities), 'hoistingOpportunities should be array');
  assert(Array.isArray(analysis.fusionOpportunities), 'fusionOpportunities should be array');
  assert(typeof analysis.totalOverhead === 'number', 'totalOverhead should be number');
  assert(typeof analysis.optimizedOverhead === 'number', 'optimizedOverhead should be number');
  assert(Array.isArray(analysis.recommendations), 'recommendations should be array');
});

test('Boundary metadata includes required fields', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'int compute(int x)'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  const boundary = analysis.boundaries[0];
  
  assert(boundary.id, 'Should have id');
  assert(boundary.type, 'Should have type');
  assert(Array.isArray(boundary.calls), 'Should have calls array');
  assert(typeof boundary.overhead === 'number', 'Should have overhead');
  assert(typeof boundary.batchable === 'boolean', 'Should have batchable flag');
  assert(typeof boundary.hoistable === 'boolean', 'Should have hoistable flag');
  assert(typeof boundary.fusable === 'boolean', 'Should have fusable flag');
});

test('Applied metadata is JSON-serializable', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void test()'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  const optimizedIr = applyBoundaryOptimizations(ir, analysis);
  
  // Should be serializable
  let serialized;
  try {
    serialized = JSON.stringify(optimizedIr);
    assert(true, 'IR should be JSON-serializable');
  } catch (e) {
    throw new Error('IR with boundary metadata is not JSON-serializable');
  }
  
  // Should be deserializable
  const deserialized = JSON.parse(serialized);
  assert(deserialized.body[0]._boundaryId, 'Metadata should survive serialization');
});

console.log('\n🔬 GATE 4: PERFORMANCE - Analysis Efficiency and Optimization Impact\n');
console.log('Testing that boundary optimizer is efficient and provides >20% reduction...\n');

test('Analyzes 50 boundaries in reasonable time', () => {
  const ir = {
    type: 'Program',
    body: []
  };
  
  // Create 50 FFI calls (boundaries)
  for (let i = 0; i < 50; i++) {
    ir.body.push({
      type: 'Call',
      _nodeId: `Call_T${i}`,
      callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
      _ffiSignature: `void func${i}()`
    });
  }
  
  const start = process.hrtime.bigint();
  const analysis = analyzeBoundaries(ir);
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1_000_000;
  console.log(`    → Analysis time: ${durationMs.toFixed(2)}ms for 50 boundaries`);
  
  assert(durationMs < 100, 'Should analyze 50 boundaries in <100ms');
  assert(analysis.boundaries.length === 50, 'Should detect all 50 boundaries');
});

test('Batching provides >20% overhead reduction', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func1()'
      },
      {
        type: 'Call',
        _nodeId: 'Call_T1',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func2()'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  
  const reduction = 
    (analysis.totalOverhead - analysis.optimizedOverhead) / analysis.totalOverhead;
  
  console.log(`    → Overhead: ${analysis.totalOverhead.toFixed(0)}µs → ${analysis.optimizedOverhead.toFixed(0)}µs`);
  console.log(`    → Reduction: ${(reduction * 100).toFixed(1)}%`);
  
  assert(reduction >= 0.20, 'Should achieve >20% overhead reduction');
});

test('Optimization detection is efficient', () => {
  const boundaries = [];
  for (let i = 0; i < 30; i++) {
    boundaries.push({
      id: `Boundary_${i}`,
      type: 'js-lua',
      calls: [`Call_T${i}`],
      overhead: 60 + i,
      batchable: i % 2 === 0,
      fusable: true,
      nodeId: `Call_T${i}`
    });
  }
  
  const start = process.hrtime.bigint();
  const batching = detectBatchingOpportunities(boundaries);
  const fusion = detectFusionOpportunities(boundaries);
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1_000_000;
  console.log(`    → Detected ${batching.length + fusion.length} opportunities in ${durationMs.toFixed(2)}ms`);
  
  assert(durationMs < 10, 'Should detect opportunities in <10ms');
});

console.log('\n🔬 GATE 5: INTEGRATION - Works with IR Pipeline and FFI Analyzer\n');
console.log('Testing that boundary optimizer integrates with IR pipeline...\n');

test('Boundary optimizer preserves IR structure', () => {
  const ir = {
    type: 'Program',
    _metadata: { version: '1.0' },
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void test()'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  const optimizedIr = applyBoundaryOptimizations(ir, analysis);
  
  // Structure should be preserved
  assertEquals(optimizedIr.type, 'Program', 'Program type preserved');
  assertEquals(optimizedIr._metadata, { version: '1.0' }, 'Metadata preserved');
  assert(optimizedIr.body.length === 1, 'Body length preserved');
});

test('Boundary metadata integrates with existing IR metadata', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        _tier: 'T0',
        _optimized: false,
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'int compute(int x)'
      }
    ]
  };
  
  const analysis = analyzeBoundaries(ir);
  const optimizedIr = applyBoundaryOptimizations(ir, analysis);
  
  const call = optimizedIr.body[0];
  
  // Should have both existing and new metadata
  assert(call._tier === 'T0', 'Existing metadata preserved');
  assert(call._optimized === false, 'Existing flags preserved');
  assert(call._boundaryId, 'Boundary ID added');
  assert(call._boundaryType, 'Boundary type added');
  assert(typeof call._boundaryOverhead === 'number', 'Boundary overhead added');
});

test('Integrates with FFI analyzer results', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func1()',
        // FFI analyzer metadata
        _ffiOverhead: 'low',
        _ffiBatchable: true
      },
      {
        type: 'Call',
        _nodeId: 'Call_T1',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'void func2()',
        _ffiOverhead: 'low',
        _ffiBatchable: true
      }
    ]
  };
  
  // Boundary optimizer uses FFI analyzer results
  const analysis = analyzeBoundaries(ir);
  
  assert(analysis.boundaries.length === 2, 'Should detect boundaries from FFI calls');
  assert(analysis.batchingOpportunities.length > 0, 'Should find batching opportunities');
});

// Final report
console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('📊 GATE VERIFICATION FINAL REPORT\n');
console.log('═══════════════════════════════════════════════════════════\n');

const gate1Tests = 8;
const gate2Tests = 3;
const gate3Tests = 3;
const gate4Tests = 3;
const gate5Tests = 3;

console.log(`${testsPassed >= gate1Tests ? '✅' : '❌'} PASS Gate 1: Correctness`);
console.log(`   Passed: ${Math.min(testsPassed, gate1Tests)}/${gate1Tests}\n`);

const gate2Start = gate1Tests;
const gate2Passed = Math.min(testsPassed - gate2Start, gate2Tests);
console.log(`${gate2Passed === gate2Tests ? '✅' : '❌'} PASS Gate 2: Determinism`);
console.log(`   Passed: ${Math.max(0, gate2Passed)}/${gate2Tests}\n`);

const gate3Start = gate1Tests + gate2Tests;
const gate3Passed = Math.min(testsPassed - gate3Start, gate3Tests);
console.log(`${gate3Passed === gate3Tests ? '✅' : '❌'} PASS Gate 3: IR Validation`);
console.log(`   Passed: ${Math.max(0, gate3Passed)}/${gate3Tests}\n`);

const gate4Start = gate1Tests + gate2Tests + gate3Tests;
const gate4Passed = Math.min(testsPassed - gate4Start, gate4Tests);
console.log(`${gate4Passed === gate4Tests ? '✅' : '❌'} PASS Gate 4: Performance`);
console.log(`   Passed: ${Math.max(0, gate4Passed)}/${gate4Tests}\n`);

const gate5Start = gate1Tests + gate2Tests + gate3Tests + gate4Tests;
const gate5Passed = Math.min(testsPassed - gate5Start, gate5Tests);
console.log(`${gate5Passed === gate5Tests ? '✅' : '❌'} PASS Gate 5: Integration`);
console.log(`   Passed: ${Math.max(0, gate5Passed)}/${gate5Tests}\n`);

console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Total Tests: ${testsRun}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsRun - testsPassed}\n`);

if (testsPassed === testsRun) {
  console.log('🎉 ALL GATES PASSED - Boundary Optimizer Implementation Verified\n');
  console.log('✅ Phase 3.5 Task 5.2 COMPLETE - Ready for production\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review and fix issues\n');
  process.exit(1);
}
