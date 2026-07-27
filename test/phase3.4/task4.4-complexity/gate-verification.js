/**
 * Phase 3.4 Task 4.4 - Complexity Analyzer Gate Verification Suite
 * 
 * Five Gates (Forensic Discipline):
 * 1. Correctness Gate - Verify correct complexity classification (CRITICAL)
 * 2. Determinism Gate - 10-iteration hash stability test
 * 3. IR Validation Gate - Metadata schema compliance
 * 4. Performance Gate - Analysis efficiency
 * 5. Integration Gate - Optimization preservation verification
 * 
 * FAIL FAST: If any gate fails, STOP and forensic triage immediately
 */

const { ComplexityAnalyzer } = require('../../../src/optimizers/javascript/algorithm/complexity-analyzer.js');

// Gate test results
const results = {
  correctness: { passed: 0, failed: 0, tests: [] },
  determinism: { passed: 0, failed: 0, tests: [] },
  irValidation: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

// Helper to create AST nodes
function identifier(name) {
  return { type: 'Identifier', name };
}

function literal(value) {
  return { type: 'Literal', value };
}

function funcDecl(name, body) {
  return {
    type: 'FunctionDeclaration',
    id: identifier(name),
    params: [],
    body: { type: 'BlockStatement', body }
  };
}

function forLoop(body) {
  return {
    type: 'ForStatement',
    init: { type: 'VariableDeclaration', declarations: [] },
    test: literal(true),
    update: null,
    body: { type: 'BlockStatement', body }
  };
}

function callExpr(funcName) {
  return {
    type: 'CallExpression',
    callee: identifier(funcName),
    arguments: []
  };
}

function returnStmt(expr) {
  return { type: 'ReturnStatement', argument: expr };
}

// ====================
// GATE 1: CORRECTNESS
// ====================

console.log('\n🔬 GATE 1: CORRECTNESS - Verify Complexity Classification\n');
console.log('Testing that complexity analysis correctly identifies Big-O classes...\n');

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

// Test 1.1: O(1) - Constant time
testCorrectness('Correctly classifies O(1) constant time', () => {
  const ir = {
    type: 'Program',
    body: [funcDecl('constantTime', [
      { type: 'ExpressionStatement', expression: identifier('x') },
      returnStmt(literal(42))
    ])]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  if (analysis.functions.length !== 1) {
    throw new Error(`Expected 1 function, found ${analysis.functions.length}`);
  }
  
  const func = analysis.functions[0];
  if (func.complexity !== 'O(1)') {
    throw new Error(`Expected O(1), got ${func.complexity}`);
  }
});

// Test 1.2: O(n) - Linear single loop
testCorrectness('Correctly classifies O(n) linear time', () => {
  const ir = {
    type: 'Program',
    body: [funcDecl('linearTime', [
      forLoop([
        { type: 'ExpressionStatement', expression: identifier('process') }
      ])
    ])]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  const func = analysis.functions[0];
  if (func.complexity !== 'O(n)') {
    throw new Error(`Expected O(n), got ${func.complexity}`);
  }
  
  if (func.maxLoopNesting !== 1) {
    throw new Error(`Expected nesting 1, got ${func.maxLoopNesting}`);
  }
});

// Test 1.3: O(n²) - Quadratic nested loops
testCorrectness('Correctly classifies O(n²) quadratic time', () => {
  const ir = {
    type: 'Program',
    body: [funcDecl('quadraticTime', [
      forLoop([
        forLoop([
          { type: 'ExpressionStatement', expression: identifier('compare') }
        ])
      ])
    ])]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  const func = analysis.functions[0];
  if (func.complexity !== 'O(n²)') {
    throw new Error(`Expected O(n²), got ${func.complexity}`);
  }
  
  if (func.maxLoopNesting !== 2) {
    throw new Error(`Expected nesting 2, got ${func.maxLoopNesting}`);
  }
});

// Test 1.4: O(n³) - Cubic triple nested loops
testCorrectness('Correctly classifies O(n³) cubic time', () => {
  const ir = {
    type: 'Program',
    body: [funcDecl('cubicTime', [
      forLoop([
        forLoop([
          forLoop([
            { type: 'ExpressionStatement', expression: identifier('compute') }
          ])
        ])
      ])
    ])]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  const func = analysis.functions[0];
  if (func.complexity !== 'O(n³)') {
    throw new Error(`Expected O(n³), got ${func.complexity}`);
  }
  
  if (func.maxLoopNesting !== 3) {
    throw new Error(`Expected nesting 3, got ${func.maxLoopNesting}`);
  }
});

// Test 1.5: O(2^n) - Exponential recursion
testCorrectness('Correctly classifies O(2^n) exponential recursion', () => {
  const ir = {
    type: 'Program',
    body: [funcDecl('fibonacci', [
      returnStmt({
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'ExpressionStatement', expression: callExpr('fibonacci') },
        right: { type: 'ExpressionStatement', expression: callExpr('fibonacci') }
      })
    ])]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  const func = analysis.functions[0];
  if (func.complexity !== 'O(2^n)') {
    throw new Error(`Expected O(2^n), got ${func.complexity}`);
  }
  
  if (!func.isRecursive) {
    throw new Error('Failed to detect recursion');
  }
});

// Test 1.6: Multiple functions with different complexities
testCorrectness('Analyzes multiple functions correctly', () => {
  const ir = {
    type: 'Program',
    body: [
      funcDecl('constantFunc', [returnStmt(literal(1))]),
      funcDecl('linearFunc', [forLoop([])]),
      funcDecl('quadraticFunc', [forLoop([forLoop([])])])
    ]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  if (analysis.functions.length !== 3) {
    throw new Error(`Expected 3 functions, found ${analysis.functions.length}`);
  }
  
  if (analysis.functions[0].complexity !== 'O(1)') {
    throw new Error(`Function 0: expected O(1), got ${analysis.functions[0].complexity}`);
  }
  
  if (analysis.functions[1].complexity !== 'O(n)') {
    throw new Error(`Function 1: expected O(n), got ${analysis.functions[1].complexity}`);
  }
  
  if (analysis.functions[2].complexity !== 'O(n²)') {
    throw new Error(`Function 2: expected O(n²), got ${analysis.functions[2].complexity}`);
  }
  
  // Overall should be worst case
  if (analysis.overall !== 'O(n²)') {
    throw new Error(`Overall: expected O(n²), got ${analysis.overall}`);
  }
});

// ====================
// GATE 2: DETERMINISM
// ====================

console.log('\n🔬 GATE 2: DETERMINISM - Hash Stability Test\n');
console.log('Testing that complexity analysis produces identical results across runs...\n');

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
    body: [
      funcDecl('func1', [forLoop([])]),
      funcDecl('func2', [forLoop([forLoop([])])]),
      funcDecl('func3', [returnStmt(literal(1))])
    ]
  };

  const analyzer = new ComplexityAnalyzer();
  const hashes = [];

  for (let i = 0; i < 10; i++) {
    const analysis = analyzer.analyzeComplexity(JSON.parse(JSON.stringify(ir)));
    const hash = JSON.stringify(analysis);
    hashes.push(hash);
  }

  const uniqueHashes = new Set(hashes);
  if (uniqueHashes.size !== 1) {
    throw new Error(`Non-deterministic: ${uniqueHashes.size} different results across 10 runs`);
  }
});

// Test 2.2: Function order consistency
testDeterminism('Function analysis order is consistent', () => {
  const ir = {
    type: 'Program',
    body: [
      funcDecl('zFunc', [forLoop([forLoop([])])]),
      funcDecl('aFunc', [returnStmt(literal(1))]),
      funcDecl('mFunc', [forLoop([])])
    ]
  };

  const analyzer = new ComplexityAnalyzer();
  const orders = [];

  for (let i = 0; i < 10; i++) {
    const analysis = analyzer.analyzeComplexity(JSON.parse(JSON.stringify(ir)));
    const order = analysis.functions.map(f => f.name).join(',');
    orders.push(order);
  }

  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== 1) {
    throw new Error(`Inconsistent function order: ${Array.from(uniqueOrders).join(' vs ')}`);
  }
});

// Test 2.3: Complexity classification stability
testDeterminism('Complexity classification is stable', () => {
  const ir = {
    type: 'Program',
    body: [funcDecl('recursive', [
      returnStmt(callExpr('recursive'))
    ])]
  };

  const analyzer = new ComplexityAnalyzer();
  const complexities = [];

  for (let i = 0; i < 10; i++) {
    const analysis = analyzer.analyzeComplexity(JSON.parse(JSON.stringify(ir)));
    complexities.push(analysis.functions[0].complexity);
  }

  const uniqueComplexities = new Set(complexities);
  if (uniqueComplexities.size !== 1) {
    throw new Error(`Inconsistent complexity: ${Array.from(uniqueComplexities).join(' vs ')}`);
  }
});

// ====================
// GATE 3: IR VALIDATION
// ====================

console.log('\n🔬 GATE 3: IR VALIDATION - Metadata Schema Compliance\n');
console.log('Testing that complexity analysis produces valid metadata...\n');

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

// Test 3.1: Schema validity
testIRValidation('Analysis result has valid schema', () => {
  const ir = {
    type: 'Program',
    body: [funcDecl('test', [forLoop([])])]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  // Required top-level fields
  if (typeof analysis.overall !== 'string') {
    throw new Error('Missing or invalid field: overall');
  }
  
  if (!Array.isArray(analysis.functions)) {
    throw new Error('Missing or invalid field: functions');
  }
  
  if (!analysis.analysis || typeof analysis.analysis !== 'object') {
    throw new Error('Missing or invalid field: analysis');
  }
  
  // Required function fields
  const func = analysis.functions[0];
  if (typeof func.name !== 'string') {
    throw new Error('Function missing field: name');
  }
  
  if (typeof func.complexity !== 'string') {
    throw new Error('Function missing field: complexity');
  }
  
  if (typeof func.forensicReason !== 'string') {
    throw new Error('Function missing field: forensicReason');
  }
});

// Test 3.2: JSON serializability
testIRValidation('Analysis metadata is JSON-serializable', () => {
  const ir = {
    type: 'Program',
    body: [
      funcDecl('func1', [forLoop([])]),
      funcDecl('func2', [returnStmt(literal(1))])
    ]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  try {
    const json = JSON.stringify(analysis);
    const parsed = JSON.parse(json);
    
    if (!parsed.overall || !parsed.functions || !parsed.analysis) {
      throw new Error('Metadata lost during JSON round-trip');
    }
  } catch (e) {
    throw new Error(`JSON serialization failed: ${e.message}`);
  }
});

// ====================
// GATE 4: PERFORMANCE
// ====================

console.log('\n🔬 GATE 4: PERFORMANCE - Analysis Efficiency\n');
console.log('Testing that complexity analysis is efficient...\n');

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

// Test 4.1: Large codebase performance
testPerformance('Analyzes 100 functions in <200ms', () => {
  const functions = [];
  
  // Create 100 functions with varying complexity
  for (let i = 0; i < 100; i++) {
    const nesting = (i % 3) + 1; // Mix of O(n), O(n²), O(n³)
    let body = [{ type: 'ExpressionStatement', expression: identifier('x') }];
    
    for (let j = 0; j < nesting; j++) {
      body = [forLoop(body)];
    }
    
    functions.push(funcDecl(`func${i}`, body));
  }
  
  const ir = { type: 'Program', body: functions };
  
  const analyzer = new ComplexityAnalyzer();
  const start = process.hrtime.bigint();
  const analysis = analyzer.analyzeComplexity(ir);
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1_000_000;
  
  console.log(`    → Analysis time: ${durationMs.toFixed(2)}ms for ${analysis.analysis.totalFunctions} functions`);
  
  if (durationMs > 200) {
    throw new Error(`Too slow: ${durationMs.toFixed(2)}ms (threshold: 200ms)`);
  }
  
  if (analysis.analysis.totalFunctions !== 100) {
    throw new Error(`Expected 100 functions, found ${analysis.analysis.totalFunctions}`);
  }
});

// Test 4.2: Classification accuracy
testPerformance('Classification rate is accurate', () => {
  const ir = {
    type: 'Program',
    body: [
      funcDecl('constant', [returnStmt(literal(1))]),
      funcDecl('linear', [forLoop([])]),
      funcDecl('quadratic', [forLoop([forLoop([])])]),
      funcDecl('cubic', [forLoop([forLoop([forLoop([])])])])
    ]
  };

  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeComplexity(ir);
  
  console.log(`    → Analyzed ${analysis.analysis.totalFunctions} functions`);
  console.log(`    → Complexities: ${analysis.functions.map(f => f.complexity).join(', ')}`);
  
  const expected = ['O(1)', 'O(n)', 'O(n²)', 'O(n³)'];
  const actual = analysis.functions.map(f => f.complexity);
  
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(`Function ${i}: expected ${expected[i]}, got ${actual[i]}`);
    }
  }
});

// ====================
// GATE 5: INTEGRATION
// ====================

console.log('\n🔬 GATE 5: INTEGRATION - Optimization Preservation\n');
console.log('Testing that complexity preservation verification works...\n');

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

// Test 5.1: Complexity preservation verification
testIntegration('Verifies complexity is preserved after optimization', () => {
  const analyzer = new ComplexityAnalyzer();
  
  const verification = analyzer.verifyComplexityPreservation('O(n)', 'O(n)');
  
  if (!verification.preserved) {
    throw new Error('Failed to recognize preserved complexity');
  }
  
  if (verification.verdict !== 'PASS') {
    throw new Error(`Expected PASS verdict, got ${verification.verdict}`);
  }
});

// Test 5.2: Complexity improvement detection
testIntegration('Detects complexity improvements', () => {
  const analyzer = new ComplexityAnalyzer();
  
  const verification = analyzer.verifyComplexityPreservation('O(n²)', 'O(n)');
  
  if (!verification.improved) {
    throw new Error('Failed to detect complexity improvement');
  }
  
  if (verification.verdict !== 'PASS') {
    throw new Error(`Expected PASS verdict, got ${verification.verdict}`);
  }
});

// Test 5.3: Complexity degradation detection
testIntegration('Detects complexity degradations (CRITICAL)', () => {
  const analyzer = new ComplexityAnalyzer();
  
  const verification = analyzer.verifyComplexityPreservation('O(n)', 'O(n²)');
  
  if (!verification.degraded) {
    throw new Error('Failed to detect complexity degradation');
  }
  
  if (verification.verdict !== 'FAIL') {
    throw new Error(`Expected FAIL verdict, got ${verification.verdict}`);
  }
  
  if (!verification.forensicReason.includes('DEGRADED')) {
    throw new Error('Missing degradation warning in forensic reason');
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
  console.log('🎉 ALL GATES PASSED - Complexity Analyzer Verified\n');
  console.log('✅ Phase 3.4 Task 4.4 COMPLETE - Ready for production\n');
  process.exit(0);
} else {
  console.log('🚨 GATE FAILURE DETECTED - FORENSIC TRIAGE REQUIRED\n');
  console.log('❌ Complexity Analyzer has critical issues\n');
  process.exit(1);
}
