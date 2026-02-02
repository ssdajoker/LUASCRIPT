/**
 * Phase 3.5 Task 5.1 - FFI Analyzer Gate Verification
 * 
 * 5 Gates:
 * 1. CORRECTNESS - FFI analysis preserves semantics
 * 2. DETERMINISM - Analysis output is consistent
 * 3. IR VALIDATION - Metadata follows schema
 * 4. PERFORMANCE - Analysis is efficient
 * 5. INTEGRATION - Works with IR pipeline
 */

const {
  analyzeFfiCalls,
  applyFfiOptimizations,
  isFfiCall,
  parseFfiSignature,
  estimateOverhead,
  validateSafety,
  detectBatchingOpportunities
} = require('../../../src/optimizers/javascript/interop/ffi-analyzer.js');

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

console.log('\n🔬 GATE 1: CORRECTNESS - Verify FFI Analysis Preserves Semantics\n');
console.log('Testing that FFI analyzer never produces incorrect analysis...\n');

test('Correctly identifies simple FFI call', () => {
  const node = {
    type: 'Call',
    callee: {
      type: 'Member',
      object: { name: 'ffi' },
      property: 'call'
    },
    arguments: [
      { type: 'Literal', value: 'add' },
      { type: 'Identifier', name: 'a' },
      { type: 'Identifier', name: 'b' }
    ]
  };
  
  assert(isFfiCall(node), 'Should detect ffi.call pattern');
});

test('Correctly identifies FFI callback', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Callback_T0',
        callee: {
          type: 'Member',
          object: { name: 'ffi' },
          property: 'callback'
        },
        arguments: [
          { type: 'Function', body: [] }
        ]
      }
    ]
  };
  
  const analysis = analyzeFfiCalls(ir);
  assert(analysis.ffiCallbacks.length === 1, 'Should detect FFI callback');
});

test('Parses FFI signature correctly', () => {
  const signature = 'int add(int a, int b)';
  const parsed = parseFfiSignature(signature);
  
  assertEquals(parsed.returnType, 'int', 'Return type should be int');
  assertEquals(parsed.name, 'add', 'Function name should be add');
  assert(parsed.parameters.length === 2, 'Should have 2 parameters');
  assertEquals(parsed.parameters[0].type, 'int', 'First param type should be int');
  assertEquals(parsed.parameters[1].type, 'int', 'Second param type should be int');
});

test('Estimates overhead correctly for simple call', () => {
  const parsed = {
    returnType: 'int',
    name: 'add',
    parameters: [
      { type: 'int', name: 'a' },
      { type: 'int', name: 'b' }
    ]
  };
  
  const overhead = estimateOverhead(parsed);
  assert(overhead >= 50, 'Should have base overhead');
  assert(overhead < 100, 'Should be reasonable for simple types');
});

test('Detects unsafe FFI calls (pointers)', () => {
  const node = {};
  const parsed = {
    returnType: 'void',
    name: 'write',
    parameters: [
      { type: 'char*', name: 'buffer' }
    ]
  };
  
  const safety = validateSafety(node, parsed);
  assertEquals(safety, 'unsafe', 'Pointer parameters should be unsafe');
});

test('Detects safe FFI calls (simple types)', () => {
  const node = {};
  const parsed = {
    returnType: 'int',
    name: 'add',
    parameters: [
      { type: 'int', name: 'a' },
      { type: 'int', name: 'b' }
    ]
  };
  
  const safety = validateSafety(node, parsed);
  assertEquals(safety, 'safe', 'Simple types should be safe');
});

test('Analyzes complete IR with FFI calls', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: {
          type: 'Member',
          object: { name: 'ffi' },
          property: 'call'
        },
        arguments: [
          { type: 'Literal', value: 'compute' }
        ],
        _ffiSignature: 'int compute(int x)'
      }
    ]
  };
  
  const analysis = analyzeFfiCalls(ir);
  assert(analysis.ffiCalls.length === 1, 'Should find 1 FFI call');
  assert(analysis.totalOverhead > 0, 'Should calculate overhead');
  assert(Array.isArray(analysis.recommendations), 'Should have recommendations');
});

console.log('\n🔬 GATE 2: DETERMINISM - Hash Stability Test\n');
console.log('Testing that FFI analysis produces identical results across runs...\n');

test('10-iteration analysis produces identical results', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: {
          type: 'Member',
          object: { name: 'ffi' },
          property: 'call'
        },
        arguments: [{ type: 'Literal', value: 'func1' }],
        _ffiSignature: 'void func1()'
      },
      {
        type: 'Call',
        _nodeId: 'Call_T1',
        callee: {
          type: 'Member',
          object: { name: 'ffi' },
          property: 'call'
        },
        arguments: [{ type: 'Literal', value: 'func2' }],
        _ffiSignature: 'int func2(int x)'
      }
    ]
  };
  
  const hashes = [];
  for (let i = 0; i < 10; i++) {
    const analysis = analyzeFfiCalls(ir);
    hashes.push(JSON.stringify(analysis));
  }
  
  const uniqueHashes = new Set(hashes);
  assert(uniqueHashes.size === 1, 'All 10 runs should produce identical results');
});

test('FFI call detection order is consistent', () => {
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
  
  // Run analysis multiple times
  const results = [];
  for (let i = 0; i < 3; i++) {
    const analysis = analyzeFfiCalls(ir);
    results.push(analysis.ffiCalls.map(c => c.nodeId));
  }
  
  // All runs should detect calls in same order
  for (let i = 1; i < results.length; i++) {
    assertEquals(results[i], results[0], `Run ${i} should match run 0`);
  }
});

test('Batching opportunity detection is stable', () => {
  const ffiCalls = [
    {
      nodeId: 'Call_T0',
      batchable: true,
      overheadMicros: 60
    },
    {
      nodeId: 'Call_T1',
      batchable: true,
      overheadMicros: 70
    }
  ];
  
  const results = [];
  for (let i = 0; i < 10; i++) {
    const opportunities = detectBatchingOpportunities(ffiCalls);
    results.push(JSON.stringify(opportunities));
  }
  
  const uniqueResults = new Set(results);
  assert(uniqueResults.size === 1, 'Batching detection should be deterministic');
});

console.log('\n🔬 GATE 3: IR VALIDATION - Metadata Schema Compliance\n');
console.log('Testing that FFI analyzer produces valid IR metadata...\n');

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
  
  const analysis = analyzeFfiCalls(ir);
  
  // Verify required fields
  assert(Array.isArray(analysis.ffiCalls), 'ffiCalls should be array');
  assert(Array.isArray(analysis.ffiCallbacks), 'ffiCallbacks should be array');
  assert(Array.isArray(analysis.batchingOpportunities), 'batchingOpportunities should be array');
  assert(typeof analysis.totalOverhead === 'number', 'totalOverhead should be number');
  assert(Array.isArray(analysis.recommendations), 'recommendations should be array');
});

test('FFI call metadata includes required fields', () => {
  const ir = {
    type: 'Program',
    body: [
      {
        type: 'Call',
        _nodeId: 'Call_T0',
        callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
        _ffiSignature: 'int compute(int x, float y)'
      }
    ]
  };
  
  const analysis = analyzeFfiCalls(ir);
  const call = analysis.ffiCalls[0];
  
  assert(call.nodeId, 'Should have nodeId');
  assert(call.signature, 'Should have signature');
  assert(call.overhead, 'Should have overhead category');
  assert(typeof call.batchable === 'boolean', 'Should have batchable flag');
  assert(typeof call.inlineCandidate === 'boolean', 'Should have inlineCandidate flag');
  assert(call.safetyLevel, 'Should have safetyLevel');
  assert(Array.isArray(call.parameters), 'Should have parameters array');
  assert(call.returnType, 'Should have returnType');
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
  
  const analysis = analyzeFfiCalls(ir);
  const optimizedIr = applyFfiOptimizations(ir, analysis);
  
  // Should be serializable
  let serialized;
  try {
    serialized = JSON.stringify(optimizedIr);
    assert(true, 'IR should be JSON-serializable');
  } catch (e) {
    throw new Error('IR with FFI metadata is not JSON-serializable');
  }
  
  // Should be deserializable
  const deserialized = JSON.parse(serialized);
  assert(deserialized.body[0]._ffiSignature, 'Metadata should survive serialization');
});

console.log('\n🔬 GATE 4: PERFORMANCE - Analysis Efficiency\n');
console.log('Testing that FFI analysis is efficient...\n');

test('Analyzes 100 FFI calls in reasonable time', () => {
  const ir = {
    type: 'Program',
    body: []
  };
  
  // Create 100 FFI calls
  for (let i = 0; i < 100; i++) {
    ir.body.push({
      type: 'Call',
      _nodeId: `Call_T${i}`,
      callee: { type: 'Member', object: { name: 'ffi' }, property: 'call' },
      _ffiSignature: `void func${i}()`
    });
  }
  
  const start = process.hrtime.bigint();
  const analysis = analyzeFfiCalls(ir);
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1_000_000;
  console.log(`    → Analysis time: ${durationMs.toFixed(2)}ms for 100 FFI calls`);
  
  assert(durationMs < 200, 'Should analyze 100 FFI calls in <200ms');
  assert(analysis.ffiCalls.length === 100, 'Should detect all 100 calls');
});

test('FFI signature parsing is efficient', () => {
  const signatures = [
    'void func()',
    'int add(int, int)',
    'float compute(float x, float y, float z)',
    'char* getString(int id)',
    'void processArray(int* arr, int size)'
  ];
  
  const start = process.hrtime.bigint();
  for (let i = 0; i < 1000; i++) {
    signatures.forEach(sig => parseFfiSignature(sig));
  }
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1_000_000;
  console.log(`    → Parsed 5000 signatures in ${durationMs.toFixed(2)}ms`);
  
  assert(durationMs < 100, 'Should parse 5000 signatures in <100ms');
});

test('Batching detection is efficient', () => {
  const ffiCalls = [];
  for (let i = 0; i < 50; i++) {
    ffiCalls.push({
      nodeId: `Call_T${i}`,
      batchable: i % 2 === 0,
      overheadMicros: 60 + i
    });
  }
  
  const start = process.hrtime.bigint();
  const opportunities = detectBatchingOpportunities(ffiCalls);
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1_000_000;
  console.log(`    → Detected batching opportunities in ${durationMs.toFixed(2)}ms`);
  
  assert(durationMs < 10, 'Should detect batching in <10ms');
  assert(opportunities.length > 0, 'Should find some batching opportunities');
});

console.log('\n🔬 GATE 5: INTEGRATION - Works with IR Pipeline\n');
console.log('Testing that FFI analyzer integrates with IR pipeline...\n');

test('FFI analyzer preserves IR structure', () => {
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
  
  const analysis = analyzeFfiCalls(ir);
  const optimizedIr = applyFfiOptimizations(ir, analysis);
  
  // Structure should be preserved
  assertEquals(optimizedIr.type, 'Program', 'Program type preserved');
  assertEquals(optimizedIr._metadata, { version: '1.0' }, 'Metadata preserved');
  assert(optimizedIr.body.length === 1, 'Body length preserved');
});

test('FFI metadata integrates with existing IR metadata', () => {
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
  
  const analysis = analyzeFfiCalls(ir);
  const optimizedIr = applyFfiOptimizations(ir, analysis);
  
  const call = optimizedIr.body[0];
  
  // Should have both existing and new metadata
  assert(call._tier === 'T0', 'Existing metadata preserved');
  assert(call._optimized === false, 'Existing flags preserved');
  assert(call._ffiSignature, 'FFI signature added');
  assert(call._ffiOverhead, 'FFI overhead added');
  assert(typeof call._ffiBatchable === 'boolean', 'FFI batchable added');
});

test('Round-trip: analyze → optimize → analyze again', () => {
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
  
  // First analysis
  const analysis1 = analyzeFfiCalls(ir);
  const optimized = applyFfiOptimizations(ir, analysis1);
  
  // Second analysis (should still work)
  const analysis2 = analyzeFfiCalls(optimized);
  
  assert(analysis2.ffiCalls.length === 1, 'Should still detect FFI call');
  assertEquals(analysis1.ffiCalls[0].signature, analysis2.ffiCalls[0].signature, 
    'Signature should match across analyses');
});

// Final report
console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('📊 GATE VERIFICATION FINAL REPORT\n');
console.log('═══════════════════════════════════════════════════════════\n');

const gate1Tests = 7;
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
  console.log('🎉 ALL GATES PASSED - FFI Analyzer Implementation Verified\n');
  console.log('✅ Phase 3.5 Task 5.1 COMPLETE - Ready for production\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review and fix issues\n');
  process.exit(1);
}
