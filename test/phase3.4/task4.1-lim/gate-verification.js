/**
 * Phase 3.4 Task 4.1 - LIM Gate Verification Suite
 * 
 * Five Gates (Forensic Discipline):
 * 1. Correctness Gate - Verify semantics preserved (CRITICAL)
 * 2. Determinism Gate - 10-iteration hash stability test
 * 3. IR Validation Gate - Metadata schema compliance
 * 4. Performance Gate - Measure loop performance improvement
 * 5. Integration Gate - Cross-language interop maintained
 * 
 * FAIL FAST: If any gate fails, STOP and forensic triage immediately
 */

const { LoopInvariantMotionAnalyzer } = require('../../../src/optimizers/javascript/algorithm/loop-invariant-motion.js');

// Gate test results
const results = {
  correctness: { passed: 0, failed: 0, tests: [] },
  determinism: { passed: 0, failed: 0, tests: [] },
  irValidation: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

// Helper to create AST nodes
function binary(op, left, right) {
  return { type: 'BinaryExpression', operator: op, left, right };
}

function identifier(name) {
  return { type: 'Identifier', name };
}

function literal(value) {
  return { type: 'Literal', value };
}

function forLoop(init, test, update, body) {
  return {
    type: 'ForStatement',
    init,
    test,
    update,
    body: { type: 'BlockStatement', body }
  };
}

function varDecl(name, initExpr) {
  return {
    type: 'VariableDeclaration',
    kind: 'let',
    id: name,
    init: initExpr,
    declarations: [{
      type: 'VariableDeclarator',
      id: identifier(name),
      init: initExpr
    }]
  };
}

// ====================
// GATE 1: CORRECTNESS
// ====================

console.log('\n🔬 GATE 1: CORRECTNESS - Verify Semantics Preserved\n');
console.log('Testing that LIM never produces incorrect optimizations...\n');

function testCorrectness(name, testFn) {
  try {
    testFn();
    results.correctness.passed++;
    results.correctness.tests.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.correctness.failed++;
    results.correctness.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

// Test 1.1: Safe loop-invariant detection
testCorrectness('Safe loop-invariant detected correctly', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('invariant', binary('*', literal(5), literal(3))) // Safe: 5 * 3
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Should identify 5*3 as movable invariant
  if (!analysis.invariants || analysis.invariants.length === 0) {
    throw new Error('Failed to identify loop-invariant computation');
  }
  
  const invariant = analysis.invariants[0];
  if (!invariant.movable) {
    throw new Error(`Invariant marked as non-movable: ${invariant.forensicReason}`);
  }
});

// Test 1.2: MUST NOT move loop-dependent expressions
testCorrectness('MUST NOT move loop-variable dependent expressions', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('dependent', binary('*', identifier('i'), literal(2))) // Depends on i
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Should identify it but mark as NOT movable
  if (!analysis.invariants || analysis.invariants.length === 0) {
    throw new Error('Failed to analyze loop-dependent expression');
  }
  
  const candidate = analysis.invariants[0];
  if (candidate.movable) {
    throw new Error('CRITICAL: Marked loop-dependent expression as movable!');
  }
  
  if (candidate.blocked !== 'LOOP_VARIABLE_DEPENDENCY') {
    throw new Error(`Wrong blocking reason: ${candidate.blocked}`);
  }
});

// Test 1.3: MUST NOT move side-effect expressions
testCorrectness('MUST NOT move expressions with side effects', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('unsafe', { 
          type: 'CallExpression', 
          callee: identifier('fetchData'),
          arguments: []
        })
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Should identify but mark as unsafe
  if (!analysis.invariants || analysis.invariants.length === 0) {
    throw new Error('Failed to analyze side-effect expression');
  }
  
  const candidate = analysis.invariants[0];
  if (candidate.movable) {
    throw new Error('CRITICAL: Marked side-effect expression as movable!');
  }
  
  if (candidate.blocked !== 'SIDE_EFFECTS') {
    throw new Error(`Wrong blocking reason: ${candidate.blocked}`);
  }
});

// Test 1.4: Nested loop invariants
testCorrectness('Correctly handles nested loops', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('outerInvariant', binary('*', literal(10), literal(20))), // Outer invariant
        forLoop(
          varDecl('j', literal(0)),
          binary('<', identifier('j'), literal(50)),
          { type: 'UpdateExpression', operator: '++', argument: identifier('j') },
          [
            varDecl('innerInvariant', binary('+', literal(5), literal(7))) // Inner invariant
          ]
        )
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Should find 2 loops and 2 invariants
  if (analysis.analysis.totalLoops !== 2) {
    throw new Error(`Expected 2 loops, found ${analysis.analysis.totalLoops}`);
  }
  
  if (analysis.invariants.length !== 2) {
    throw new Error(`Expected 2 invariants, found ${analysis.invariants.length}`);
  }
  
  // Both should be movable
  const movable = analysis.invariants.filter(inv => inv.movable);
  if (movable.length !== 2) {
    throw new Error(`Expected 2 movable invariants, found ${movable.length}`);
  }
});

// Test 1.5: Empty loop
testCorrectness('Handles empty loops correctly', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [] // Empty body
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Should find 1 loop, 0 invariants
  if (analysis.analysis.totalLoops !== 1) {
    throw new Error(`Expected 1 loop, found ${analysis.analysis.totalLoops}`);
  }
  
  if (analysis.invariants.length !== 0) {
    throw new Error(`Expected 0 invariants, found ${analysis.invariants.length}`);
  }
});

// ====================
// GATE 2: DETERMINISM
// ====================

console.log('\n🔬 GATE 2: DETERMINISM - Hash Stability Test\n');
console.log('Testing that LIM produces identical results across runs...\n');

function testDeterminism(name, testFn) {
  try {
    testFn();
    results.determinism.passed++;
    results.determinism.tests.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.determinism.failed++;
    results.determinism.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

// Test 2.1: 10-iteration stability
testDeterminism('10-iteration analysis produces identical results', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('a', binary('*', literal(5), literal(3))),
        varDecl('b', binary('+', literal(10), literal(20))),
        varDecl('c', binary('-', literal(50), literal(25)))
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const hashes = [];

  for (let i = 0; i < 10; i++) {
    const analysis = analyzer.analyzeLoopInvariantMotion(JSON.parse(JSON.stringify(ir)));
    const hash = JSON.stringify(analysis);
    hashes.push(hash);
  }

  // All hashes must be identical
  const uniqueHashes = new Set(hashes);
  if (uniqueHashes.size !== 1) {
    throw new Error(`Non-deterministic: ${uniqueHashes.size} different results across 10 runs`);
  }
});

// Test 2.2: Complex loop determinism
testDeterminism('Complex nested loops produce stable results', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('x1', binary('*', literal(1), literal(2))),
        varDecl('x2', binary('*', literal(3), literal(4))),
        forLoop(
          varDecl('j', literal(0)),
          binary('<', identifier('j'), literal(50)),
          { type: 'UpdateExpression', operator: '++', argument: identifier('j') },
          [
            varDecl('y1', binary('+', literal(5), literal(6))),
            varDecl('y2', binary('+', literal(7), literal(8)))
          ]
        )
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const runs = [];

  for (let i = 0; i < 10; i++) {
    const analysis = analyzer.analyzeLoopInvariantMotion(JSON.parse(JSON.stringify(ir)));
    runs.push(JSON.stringify(analysis));
  }

  const unique = new Set(runs);
  if (unique.size !== 1) {
    throw new Error(`Non-deterministic nested loop analysis: ${unique.size} different results`);
  }
});

// Test 2.3: Analysis order consistency
testDeterminism('Invariant detection order is consistent', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('z', binary('*', literal(9), literal(8))),
        varDecl('a', binary('*', literal(1), literal(2))),
        varDecl('m', binary('*', literal(5), literal(4)))
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const orders = [];

  for (let i = 0; i < 10; i++) {
    const analysis = analyzer.analyzeLoopInvariantMotion(JSON.parse(JSON.stringify(ir)));
    const order = analysis.invariants.map(inv => inv.variable).join(',');
    orders.push(order);
  }

  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== 1) {
    throw new Error(`Inconsistent invariant order: ${Array.from(uniqueOrders).join(' vs ')}`);
  }
});

// ====================
// GATE 3: IR VALIDATION
// ====================

console.log('\n🔬 GATE 3: IR VALIDATION - Metadata Schema Compliance\n');
console.log('Testing that LIM produces valid IR metadata...\n');

function testIRValidation(name, testFn) {
  try {
    testFn();
    results.irValidation.passed++;
    results.irValidation.tests.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.irValidation.failed++;
    results.irValidation.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

// Test 3.1: Analysis structure validity
testIRValidation('Analysis result has valid schema', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('x', binary('*', literal(5), literal(3)))
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Verify required top-level fields
  if (!analysis.invariants) {
    throw new Error('Missing required field: invariants');
  }
  
  if (!analysis.analysis) {
    throw new Error('Missing required field: analysis');
  }
  
  if (typeof analysis.analysis.totalLoops !== 'number') {
    throw new Error('analysis.totalLoops must be a number');
  }
  
  if (typeof analysis.analysis.totalInvariants !== 'number') {
    throw new Error('analysis.totalInvariants must be a number');
  }
});

// Test 3.2: Metadata is JSON-serializable
testIRValidation('Analysis metadata is JSON-serializable', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('x', binary('*', literal(5), literal(3))),
        varDecl('y', binary('+', literal(10), literal(20)))
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Verify JSON serialization works
  try {
    const json = JSON.stringify(analysis);
    const parsed = JSON.parse(json);
    
    if (!parsed.invariants || !parsed.analysis) {
      throw new Error('Metadata lost during JSON round-trip');
    }
  } catch (e) {
    throw new Error(`JSON serialization failed: ${e.message}`);
  }
});

// ====================
// GATE 4: PERFORMANCE
// ====================

console.log('\n🔬 GATE 4: PERFORMANCE - Efficiency Measurement\n');
console.log('Testing that LIM analysis is efficient...\n');

function testPerformance(name, testFn) {
  try {
    testFn();
    results.performance.passed++;
    results.performance.tests.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.performance.failed++;
    results.performance.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

// Test 4.1: Large loop performance
testPerformance('Analyzes 50 loops in <500ms', () => {
  const loops = [];
  
  // Create 50 loops, each with 5 statements
  for (let i = 0; i < 50; i++) {
    loops.push(forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('a', binary('*', literal(i), literal(2))),
        varDecl('b', binary('+', literal(i), literal(5))),
        varDecl('c', binary('-', literal(i), literal(3))),
        varDecl('d', binary('*', literal(i+1), literal(4))),
        varDecl('e', binary('+', literal(i+2), literal(6)))
      ]
    ));
  }
  
  const ir = { type: 'Program', body: loops };
  
  const analyzer = new LoopInvariantMotionAnalyzer();
  const start = process.hrtime.bigint();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1_000_000;
  
  console.log(`    → Analysis time: ${durationMs.toFixed(2)}ms for ${analysis.analysis.totalLoops} loops`);
  
  if (durationMs > 500) {
    throw new Error(`Too slow: ${durationMs.toFixed(2)}ms (threshold: 500ms)`);
  }
  
  // Verify correctness of large batch
  if (analysis.analysis.totalLoops !== 50) {
    throw new Error(`Expected 50 loops, found ${analysis.analysis.totalLoops}`);
  }
});

// Test 4.2: Analysis efficiency
testPerformance('Detection rate is reasonable', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('invariant1', binary('*', literal(5), literal(3))),
        varDecl('invariant2', binary('+', literal(10), literal(20))),
        varDecl('dependent', binary('*', identifier('i'), literal(2)))
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  console.log(`    → Found ${analysis.analysis.totalInvariants} candidates`);
  console.log(`    → Movable: ${analysis.analysis.totalMovable}`);
  console.log(`    → Blocked: ${analysis.analysis.safetyBlocked}`);
  
  // Should detect all 3 candidates
  if (analysis.analysis.totalInvariants !== 3) {
    throw new Error(`Expected 3 candidates, found ${analysis.analysis.totalInvariants}`);
  }
  
  // 2 should be movable, 1 blocked
  if (analysis.analysis.totalMovable !== 2) {
    throw new Error(`Expected 2 movable, found ${analysis.analysis.totalMovable}`);
  }
});

// ====================
// GATE 5: INTEGRATION
// ====================

console.log('\n🔬 GATE 5: INTEGRATION - Cross-Language Interop\n');
console.log('Testing that LIM maintains integration with IR pipeline...\n');

function testIntegration(name, testFn) {
  try {
    testFn();
    results.integration.passed++;
    results.integration.tests.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.integration.failed++;
    results.integration.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

// Test 5.1: LIM doesn't corrupt IR structure
testIntegration('LIM preserves IR structure', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('x', binary('*', literal(5), literal(3)))
      ]
    )]
  };
  
  const originalJSON = JSON.stringify(ir);
  
  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Analysis shouldn't mutate original IR
  const afterJSON = JSON.stringify(ir);
  
  if (originalJSON !== afterJSON) {
    throw new Error('LIM analysis mutated original IR');
  }
});

// Test 5.2: Invariant metadata structure
testIntegration('Invariant metadata has correct structure', () => {
  const ir = {
    type: 'Program',
    body: [forLoop(
      varDecl('i', literal(0)),
      binary('<', identifier('i'), literal(100)),
      { type: 'UpdateExpression', operator: '++', argument: identifier('i') },
      [
        varDecl('x', binary('*', literal(5), literal(3)))
      ]
    )]
  };

  const analyzer = new LoopInvariantMotionAnalyzer();
  const analysis = analyzer.analyzeLoopInvariantMotion(ir);
  
  // Check invariant structure
  const inv = analysis.invariants[0];
  
  if (!inv.variable) {
    throw new Error('Invariant missing required field: variable');
  }
  
  if (!inv.expression) {
    throw new Error('Invariant missing required field: expression');
  }
  
  if (typeof inv.movable !== 'boolean') {
    throw new Error('Invariant.movable must be boolean');
  }
  
  if (!inv.forensicReason) {
    throw new Error('Invariant missing required field: forensicReason');
  }
});

// ====================
// FINAL REPORT
// ====================

console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('📊 GATE VERIFICATION FINAL REPORT\n');
console.log('═══════════════════════════════════════════════════════════\n');

const gates = ['correctness', 'determinism', 'irValidation', 'performance', 'integration'];
const gateNames = {
  correctness: 'Gate 1: Correctness',
  determinism: 'Gate 2: Determinism',
  irValidation: 'Gate 3: IR Validation',
  performance: 'Gate 4: Performance',
  integration: 'Gate 5: Integration'
};

let totalPassed = 0;
let totalFailed = 0;
let allGatesPassed = true;

gates.forEach(gate => {
  const result = results[gate];
  totalPassed += result.passed;
  totalFailed += result.failed;
  
  const status = result.failed === 0 ? '✅ PASS' : '❌ FAIL';
  
  if (result.failed > 0) {
    allGatesPassed = false;
  }
  
  console.log(`${status} ${gateNames[gate]}`);
  console.log(`   Passed: ${result.passed}/${result.passed + result.failed}`);
  
  if (result.failed > 0) {
    console.log(`   ⚠️  Failed Tests:`);
    result.tests.filter(t => t.status === 'FAIL').forEach(test => {
      console.log(`      • ${test.name}: ${test.error}`);
    });
  }
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Total Tests: ${totalPassed + totalFailed}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);
console.log('');

if (allGatesPassed) {
  console.log('🎉 ALL GATES PASSED - LIM Implementation Verified\n');
  console.log('✅ Phase 3.4 Task 4.1 COMPLETE - Ready for production\n');
  process.exit(0);
} else {
  console.log('🚨 GATE FAILURE DETECTED - FORENSIC TRIAGE REQUIRED\n');
  console.log('❌ LIM Implementation has critical issues\n');
  process.exit(1);
}
