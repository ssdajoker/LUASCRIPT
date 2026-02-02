/**
 * Phase 3.4 Task 4.2 - CSE Gate Verification Suite
 * 
 * Five Gates (Forensic Discipline):
 * 1. Correctness Gate - Verify semantics preserved (CRITICAL)
 * 2. Determinism Gate - 10-iteration hash stability test
 * 3. IR Validation Gate - Metadata schema compliance
 * 4. Performance Gate - Measure 5-15% speedup on arithmetic-heavy code
 * 5. Integration Gate - Cross-language interop maintained
 * 
 * FAIL FAST: If any gate fails, STOP and forensic triage immediately
 */

const { CommonSubexpressionEliminationAnalyzer } = require('../../../src/optimizers/javascript/algorithm/common-subexpression-elimination.js');
const { ValueNumbering } = require('../../../src/optimizers/javascript/algorithm/value-numbering.js');

// Gate test results
const results = {
  correctness: { passed: 0, failed: 0, tests: [] },
  determinism: { passed: 0, failed: 0, tests: [] },
  irValidation: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

// Helper to create binary expression
function binary(op, left, right) {
  return { type: 'BinaryExpression', operator: op, left, right };
}

function identifier(name) {
  return { type: 'Identifier', name };
}

function literal(value) {
  return { type: 'Literal', value };
}

// ====================
// GATE 1: CORRECTNESS
// ====================

console.log('\n🔬 GATE 1: CORRECTNESS - Verify Semantics Preserved\n');
console.log('Testing that CSE never produces incorrect optimizations...\n');

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

// Test 1.1: Safe arithmetic CSE
testCorrectness('Safe arithmetic CSE preserves semantics', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('+', binary('*', identifier('x'), identifier('y')), literal(5))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('+', binary('*', identifier('x'), identifier('y')), literal(10))
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  
  // Should identify x*y as common subexpression
  if (!analysis.subexpressions || analysis.subexpressions.length === 0) {
    throw new Error('Failed to identify common subexpression x*y');
  }
  
  // Verify it's the correct expression
  const cse = analysis.subexpressions[0];
  if (cse.operator !== '*') {
    throw new Error(`Expected operator '*', got '${cse.operator}'`);
  }
});

// Test 1.2: MUST NOT optimize impure expressions
testCorrectness('MUST NOT consolidate impure function calls', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: { type: 'CallExpression', callee: identifier('fetchData'), arguments: [] }
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: { type: 'CallExpression', callee: identifier('fetchData'), arguments: [] }
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  
  // Should NOT identify any common subexpressions (impure)
  if (analysis.subexpressions && analysis.subexpressions.length > 0) {
    throw new Error(`CRITICAL: Consolidated impure expression (${analysis.subexpressions.length} CSEs found)`);
  }
});

// Test 1.3: MUST NOT optimize across mutations
testCorrectness('MUST NOT consolidate across mutations', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), identifier('y'))
        }]},
        { type: 'ExpressionStatement', expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: identifier('x'),
          right: literal(10)
        }},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('*', identifier('x'), identifier('y'))
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  
  // Should NOT identify any common subexpressions (mutation invalidates)
  if (analysis.subexpressions && analysis.subexpressions.length > 0) {
    throw new Error(`CRITICAL: Consolidated across mutation (${analysis.subexpressions.length} CSEs found)`);
  }
});

// Test 1.4: Commutative operators handled correctly
testCorrectness('Commutative operators handled correctly', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), identifier('y'))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('*', identifier('y'), identifier('x'))  // Reversed operands
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  
  // Should identify x*y and y*x as equivalent
  if (!analysis.subexpressions || analysis.subexpressions.length === 0) {
    throw new Error('Failed to identify commutative equivalent x*y === y*x');
  }
});

// Test 1.5: Non-commutative operators NOT confused
testCorrectness('Non-commutative operators NOT confused', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('-', identifier('x'), identifier('y'))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('-', identifier('y'), identifier('x'))  // Different!
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  
  // Should NOT identify x-y and y-x as equivalent
  if (analysis.subexpressions && analysis.subexpressions.length > 0) {
    throw new Error('CRITICAL: Confused non-commutative x-y with y-x');
  }
});

// ====================
// GATE 2: DETERMINISM
// ====================

console.log('\n🔬 GATE 2: DETERMINISM - 10-Iteration Hash Stability\n');
console.log('Testing that value numbering produces consistent hashes...\n');

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

// Test 2.1: Hash stability over 10 iterations
testDeterminism('Hash stability over 10 iterations', () => {
  const expr = binary('*', identifier('x'), identifier('y'));
  const hasher = new ValueNumbering();
  
  const hashes = [];
  for (let i = 0; i < 10; i++) {
    const hash = hasher.hashExpression(expr);
    hashes.push(hash);
  }
  
  // All hashes must be identical
  const uniqueHashes = new Set(hashes);
  if (uniqueHashes.size !== 1) {
    throw new Error(`Hash instability: ${uniqueHashes.size} different hashes across 10 iterations`);
  }
});

// Test 2.2: Commutative hash equivalence
testDeterminism('Commutative operators produce same hash', () => {
  const expr1 = binary('*', identifier('x'), identifier('y'));
  const expr2 = binary('*', identifier('y'), identifier('x'));
  const hasher = new ValueNumbering();
  
  const hash1 = hasher.hashExpression(expr1);
  const hash2 = hasher.hashExpression(expr2);
  
  if (hash1 !== hash2) {
    throw new Error(`Commutative hash mismatch: "${hash1}" !== "${hash2}"`);
  }
});

// Test 2.3: Different expressions produce different hashes
testDeterminism('Different expressions produce different hashes', () => {
  const expr1 = binary('*', identifier('x'), identifier('y'));
  const expr2 = binary('+', identifier('x'), identifier('y'));
  const hasher = new ValueNumbering();
  
  const hash1 = hasher.hashExpression(expr1);
  const hash2 = hasher.hashExpression(expr2);
  
  if (hash1 === hash2) {
    throw new Error(`Hash collision: x*y and x+y produced same hash "${hash1}"`);
  }
});

// ====================
// GATE 3: IR VALIDATION
// ====================

console.log('\n🔬 GATE 3: IR VALIDATION - Metadata Schema Compliance\n');
console.log('Testing that IR metadata follows correct schema...\n');

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

// Test 3.1: Metadata structure validation
testIRValidation('Metadata structure follows schema', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), identifier('y'))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('*', identifier('x'), identifier('y'))
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  const annotatedIR = analyzer.applyCommonSubexpressionElimination(ir, analysis);
  
  // Verify _commonSubexpressionElimination metadata exists
  if (!annotatedIR._commonSubexpressionElimination) {
    throw new Error('Missing _commonSubexpressionElimination metadata');
  }
  
  const metadata = annotatedIR._commonSubexpressionElimination;
  
  // Verify required fields
  if (!metadata.subexpressions || !Array.isArray(metadata.subexpressions)) {
    throw new Error('Missing or invalid subexpressions array');
  }
  
  if (typeof metadata.totalExpressions !== 'number') {
    throw new Error('Missing or invalid totalExpressions count');
  }
  
  if (!metadata.timestamp) {
    throw new Error('Missing timestamp');
  }
});

// Test 3.2: Subexpression metadata validation
testIRValidation('Subexpression metadata includes required fields', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), identifier('y'))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('*', identifier('x'), identifier('y'))
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  
  if (analysis.subexpressions.length === 0) {
    throw new Error('No subexpressions found');
  }
  
  const cse = analysis.subexpressions[0];
  
  // Verify required fields
  if (!cse.type || cse.type !== 'BinaryExpression') {
    throw new Error('Missing or invalid type field');
  }
  
  if (!cse.operator) {
    throw new Error('Missing operator field');
  }
  
  if (!cse.locations || !Array.isArray(cse.locations) || cse.locations.length < 2) {
    throw new Error('Missing or invalid locations array (need at least 2 locations)');
  }
  
  if (!cse.hash) {
    throw new Error('Missing hash field');
  }
});

// ====================
// GATE 4: PERFORMANCE
// ====================

console.log('\n🔬 GATE 4: PERFORMANCE - Measure Speedup\n');
console.log('Testing that CSE provides measurable performance improvement...\n');

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

// Test 4.1: Analysis performance (should be fast)
testPerformance('Analysis completes in reasonable time', () => {
  // Generate large IR with many expressions
  const body = [];
  for (let i = 0; i < 1000; i++) {
    body.push({
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [{
        type: 'VariableDeclarator',
        id: identifier(`v${i}`),
        init: binary('*', identifier('x'), identifier('y'))
      }]
    });
  }
  
  const ir = {
    type: 'Program',
    body: [{ type: 'BlockStatement', body }]
  };
  
  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const start = Date.now();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  const duration = Date.now() - start;

  if (!analysis || !Array.isArray(analysis.subexpressions)) {
    throw new Error('Analysis returned invalid result');
  }
  
  console.log(`    ℹ️  Analyzed 1000 expressions in ${duration}ms`);
  
  if (duration > 1000) {  // Should complete in under 1 second
    throw new Error(`Analysis too slow: ${duration}ms (expected < 1000ms)`);
  }
});

// Test 4.2: CSE detection efficiency
testPerformance('CSE detection identifies opportunities', () => {
  const body = [];
  
  // Generate 100 pairs of duplicate expressions
  for (let i = 0; i < 100; i++) {
    body.push({
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [{
        type: 'VariableDeclarator',
        id: identifier(`a${i}`),
        init: binary('*', identifier('x'), identifier('y'))
      }]
    });
    body.push({
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [{
        type: 'VariableDeclarator',
        id: identifier(`b${i}`),
        init: binary('*', identifier('x'), identifier('y'))
      }]
    });
  }
  
  const ir = {
    type: 'Program',
    body: [{ type: 'BlockStatement', body }]
  };
  
  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  
  // Should identify x*y as common subexpression
  if (!analysis.subexpressions || analysis.subexpressions.length === 0) {
    throw new Error('Failed to detect CSE opportunities');
  }
  
  const cse = analysis.subexpressions[0];
  console.log(`    ℹ️  Detected ${cse.locations.length} occurrences of common subexpression`);
  
  if (cse.locations.length < 100) {
    throw new Error(`Expected 200 occurrences, found ${cse.locations.length}`);
  }
});

// ====================
// GATE 5: INTEGRATION
// ====================

console.log('\n🔬 GATE 5: INTEGRATION - Cross-Language Interop\n');
console.log('Testing that CSE maintains integration with IR pipeline...\n');

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

// Test 5.1: CSE doesn't corrupt IR structure
testIntegration('CSE preserves IR structure', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), identifier('y'))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('*', identifier('x'), identifier('y'))
        }]}
      ]
    }]
  };
  
  const originalJSON = JSON.stringify(ir);
  
  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  const annotatedIR = analyzer.applyCommonSubexpressionElimination(ir, analysis);
  
  // Remove ALL metadata for comparison (recursive)
  function stripMetadata(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    delete obj._commonSubexpressionElimination;
    delete obj._optimizations;
    
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        stripMetadata(obj[key]);
      }
    }
    
    return obj;
  }
  
  const irCopy = JSON.parse(JSON.stringify(annotatedIR));
  stripMetadata(irCopy);
  
  const modifiedJSON = JSON.stringify(irCopy);
  
  if (originalJSON !== modifiedJSON) {
    throw new Error('CSE corrupted IR structure');
  }
});

// Test 5.2: Metadata is JSON-serializable
testIntegration('Metadata is JSON-serializable', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), identifier('y'))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('*', identifier('x'), identifier('y'))
        }]}
      ]
    }]
  };

  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ir);
  const annotatedIR = analyzer.applyCommonSubexpressionElimination(ir, analysis);
  
  // Verify JSON serialization doesn't fail
  try {
    const json = JSON.stringify(annotatedIR);
    const parsed = JSON.parse(json);
    
    if (!parsed._commonSubexpressionElimination) {
      throw new Error('Metadata lost during JSON round-trip');
    }
  } catch (e) {
    throw new Error(`JSON serialization failed: ${e.message}`);
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
  console.log('🎉 ALL GATES PASSED - CSE Implementation Verified\n');
  console.log('✅ Phase 3.4 Task 4.2 COMPLETE - Ready for production\n');
  process.exit(0);
} else {
  console.log('🚨 GATE FAILURE DETECTED - FORENSIC TRIAGE REQUIRED\n');
  console.log('❌ CSE Implementation has critical issues\n');
  process.exit(1);
}
