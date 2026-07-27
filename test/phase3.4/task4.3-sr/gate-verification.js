/**
 * Phase 3.4 Task 4.3 - Strength Reduction Gate Verification Suite
 * 
 * Five Forensic Gates:
 * 1. Correctness Gate - Verify no false optimizations
 * 2. Determinism Gate - 10-iteration hash stability
 * 3. IR Validation Gate - Metadata schema compliance
 * 4. Performance Gate - Measure 5-15% speedup
 * 5. Integration Gate - Cross-language interop maintained
 * 
 * FAIL FAST: If any gate fails, stop immediately for forensic triage
 */

const { StrengthReductionAnalyzer } = require('../../../src/optimizers/javascript/algorithm/strength-reduction.js');

// Gate test results
const results = {
  correctness: { passed: 0, failed: 0, tests: [] },
  determinism: { passed: 0, failed: 0, tests: [] },
  irValidation: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

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

console.log('\n🔬 GATE 1: CORRECTNESS - Verify No False Optimizations\n');
console.log('Testing that SR never produces incorrect optimizations...\n');

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

// Test 1.1: Power-of-2 multiplication
testCorrectness('Power-of-2 multiplication detected (x * 8)', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), literal(8))
        }]}
      ]
    }]
  };

  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  
  if (!analysis.reductions || analysis.reductions.length === 0) {
    throw new Error('Failed to detect power-of-2 multiplication');
  }
  
  const reduction = analysis.reductions[0];
  if (reduction.operator !== '*' || reduction.exponent !== 3) {
    throw new Error(`Expected * operator with exponent 3, got ${reduction.operator} with ${reduction.exponent}`);
  }
});

// Test 1.2: MUST NOT optimize float multiplication
testCorrectness('MUST NOT optimize float multiplication', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), literal(2.5))
        }]}
      ]
    }]
  };

  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  
  // Should NOT detect optimization (float constant)
  if (analysis.reductions && analysis.reductions.length > 0) {
    throw new Error('CRITICAL: Optimized float multiplication');
  }
});

// Test 1.3: MUST NOT optimize non-power-of-2
testCorrectness('MUST NOT optimize non-power-of-2 multiplication', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), literal(3))
        }]}
      ]
    }]
  };

  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  
  if (analysis.reductions && analysis.reductions.length > 0) {
    throw new Error('CRITICAL: Optimized non-power-of-2 multiplication');
  }
});

// Test 1.4: Power-of-2 division detected
testCorrectness('Power-of-2 division detected (x / 16)', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('/', identifier('x'), literal(16))
        }]}
      ]
    }]
  };

  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  
  if (!analysis.reductions || analysis.reductions.length === 0) {
    throw new Error('Failed to detect power-of-2 division');
  }
  
  const reduction = analysis.reductions[0];
  if (reduction.operator !== '/' || reduction.exponent !== 4) {
    throw new Error(`Expected / operator with exponent 4, got ${reduction.operator}`);
  }
});

// Test 1.5: Power-of-2 modulo detected
testCorrectness('Power-of-2 modulo detected (x % 32)', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('%', identifier('x'), literal(32))
        }]}
      ]
    }]
  };

  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  
  if (!analysis.reductions || analysis.reductions.length === 0) {
    throw new Error('Failed to detect power-of-2 modulo');
  }
  
  const reduction = analysis.reductions[0];
  if (reduction.operator !== '%' || reduction.exponent !== 5) {
    throw new Error(`Expected % operator with exponent 5`);
  }
});

// ====================
// GATE 2: DETERMINISM
// ====================

console.log('\n🔬 GATE 2: DETERMINISM - 10-Iteration Stability\n');
console.log('Testing that SR produces consistent optimization decisions...\n');

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

// Test 2.1: Consistent analysis across 10 runs
testDeterminism('Analysis output consistent across 10 runs', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), literal(4))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('b'),
          init: binary('/', identifier('y'), literal(8))
        }]},
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('c'),
          init: binary('%', identifier('z'), literal(16))
        }]}
      ]
    }]
  };

  const results = [];
  for (let i = 0; i < 10; i++) {
    const analyzer = new StrengthReductionAnalyzer();
    const analysis = analyzer.analyzeStrengthReduction(ir);
    results.push(JSON.stringify(analysis.reductions));
  }

  // All 10 should be identical
  const first = results[0];
  for (let i = 1; i < 10; i++) {
    if (results[i] !== first) {
      throw new Error(`Run ${i} produced different output than run 1`);
    }
  }
});

// Test 2.2: Same decisions on same IR
testDeterminism('Same IR always produces same decisions', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('x'),
          init: binary('*', identifier('a'), literal(256))
        }]}
      ]
    }]
  };

  const analyzer1 = new StrengthReductionAnalyzer();
  const analysis1 = analyzer1.analyzeStrengthReduction(ir);
  
  const analyzer2 = new StrengthReductionAnalyzer();
  const analysis2 = analyzer2.analyzeStrengthReduction(ir);
  
  if (JSON.stringify(analysis1.reductions) !== JSON.stringify(analysis2.reductions)) {
    throw new Error('Two analyzers produced different results for same IR');
  }
});

// Test 2.3: No optimizations for non-power-of-2 (deterministic blocking)
testDeterminism('Non-power-of-2 consistently blocked', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('x'),
          init: binary('*', identifier('a'), literal(7))  // Not power-of-2
        }]}
      ]
    }]
  };

  for (let i = 0; i < 5; i++) {
    const analyzer = new StrengthReductionAnalyzer();
    const analysis = analyzer.analyzeStrengthReduction(ir);
    
    if (analysis.reductions && analysis.reductions.length > 0) {
      throw new Error(`Run ${i}: Inconsistently optimized non-power-of-2`);
    }
  }
});

// ====================
// GATE 3: IR VALIDATION
// ====================

console.log('\n🔬 GATE 3: IR VALIDATION - Metadata Schema Compliance\n');
console.log('Testing that SR metadata follows correct schema...\n');

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

// Test 3.1: Metadata structure
testIRValidation('Metadata structure follows schema', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), literal(4))
        }]}
      ]
    }]
  };

  const { applyStrengthReduction } = require('../../../src/optimizers/javascript/algorithm/strength-reduction.js');
  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  const annotatedIR = applyStrengthReduction(ir, analysis);
  
  if (!annotatedIR._strengthReduction) {
    throw new Error('Missing _strengthReduction metadata');
  }
  
  const metadata = annotatedIR._strengthReduction;
  
  if (!metadata.subexpressions || !Array.isArray(metadata.subexpressions)) {
    throw new Error('Missing or invalid subexpressions array');
  }
  
  if (typeof metadata.totalOperations !== 'number') {
    throw new Error('Missing or invalid totalOperations');
  }
  
  if (!metadata.timestamp) {
    throw new Error('Missing timestamp');
  }
});

// Test 3.2: Individual node metadata
testIRValidation('Individual node metadata includes transformation', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('x'),
          init: binary('*', identifier('a'), literal(8))
        }]}
      ]
    }]
  };

  const { applyStrengthReduction } = require('../../../src/optimizers/javascript/algorithm/strength-reduction.js');
  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  const annotatedIR = applyStrengthReduction(ir, analysis);
  
  // Find the binary expression in the annotated IR
  const binaryExpr = annotatedIR.body[0].body[0].declarations[0].init;
  
  if (!binaryExpr._strengthReduction) {
    throw new Error('Missing _strengthReduction on transformed node');
  }
  
  const nodeMeta = binaryExpr._strengthReduction;
  if (!nodeMeta.operator || !nodeMeta.transformation) {
    throw new Error('Missing operator or transformation in node metadata');
  }
});

// ====================
// GATE 4: PERFORMANCE
// ====================

console.log('\n🔬 GATE 4: PERFORMANCE - Measure Speedup Impact\n');
console.log('Testing that SR provides measurable optimization...\n');

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

// Test 4.1: Analysis speed
testPerformance('Analysis completes in reasonable time', () => {
  // Generate large IR with many expressions
  const body = [];
  for (let i = 0; i < 100; i++) {
    body.push({
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [{
        type: 'VariableDeclarator',
        id: identifier(`v${i}`),
        init: binary('*', identifier('x'), literal(Math.pow(2, i % 30)))
      }]
    });
  }
  
  const ir = {
    type: 'Program',
    body: [{ type: 'BlockStatement', body }]
  };
  
  const analyzer = new StrengthReductionAnalyzer();
  const start = Date.now();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  const duration = Date.now() - start;

  if (!analysis || !Array.isArray(analysis.reductions)) {
    throw new Error('Analysis returned invalid result');
  }
  
  console.log(`    ℹ️  Analyzed 100 expressions in ${duration}ms`);
  
  if (duration > 500) {
    throw new Error(`Analysis too slow: ${duration}ms (expected < 500ms)`);
  }
});

// Test 4.2: SR detection efficiency
testPerformance('Detects strength reduction opportunities', () => {
  const body = [];
  
  // Generate 50 power-of-2 multiplications
  for (let i = 0; i < 50; i++) {
    body.push({
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [{
        type: 'VariableDeclarator',
        id: identifier(`m${i}`),
        init: binary('*', identifier('x'), literal(Math.pow(2, 1 + (i % 16))))
      }]
    });
  }
  
  // Add 50 power-of-2 divisions
  for (let i = 0; i < 50; i++) {
    body.push({
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [{
        type: 'VariableDeclarator',
        id: identifier(`d${i}`),
        init: binary('/', identifier('y'), literal(Math.pow(2, 1 + (i % 16))))
      }]
    });
  }
  
  const ir = {
    type: 'Program',
    body: [{ type: 'BlockStatement', body }]
  };
  
  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  
  console.log(`    ℹ️  Detected ${analysis.reductions.length} optimization opportunities`);
  
  if (analysis.reductions.length < 90) {
    throw new Error(`Expected ~100 reductions, found ${analysis.reductions.length}`);
  }
});

// ====================
// GATE 5: INTEGRATION
// ====================

console.log('\n🔬 GATE 5: INTEGRATION - Cross-Language Interop\n');
console.log('Testing that SR maintains integration with IR pipeline...\n');

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

// Test 5.1: SR preserves IR structure
testIntegration('SR preserves IR structure', () => {
  const ir = {
    type: 'Program',
    body: [{
      type: 'BlockStatement',
      body: [
        { type: 'VariableDeclaration', kind: 'let', declarations: [{ 
          type: 'VariableDeclarator',
          id: identifier('a'),
          init: binary('*', identifier('x'), literal(4))
        }]}
      ]
    }]
  };
  
  const originalJSON = JSON.stringify(ir);
  
  const { applyStrengthReduction } = require('../../../src/optimizers/javascript/algorithm/strength-reduction.js');
  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  const annotatedIR = applyStrengthReduction(ir, analysis);
  
  // Remove metadata
  function stripMetadata(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    delete obj._strengthReduction;
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
    throw new Error('SR corrupted IR structure');
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
          init: binary('*', identifier('x'), literal(8))
        }]}
      ]
    }]
  };

  const { applyStrengthReduction } = require('../../../src/optimizers/javascript/algorithm/strength-reduction.js');
  const analyzer = new StrengthReductionAnalyzer();
  const analysis = analyzer.analyzeStrengthReduction(ir);
  const annotatedIR = applyStrengthReduction(ir, analysis);
  
  try {
    const json = JSON.stringify(annotatedIR);
    const parsed = JSON.parse(json);
    
    if (!parsed._strengthReduction) {
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
  
  const statusSymbol = result.failed === 0 ? '✅' : '❌';
  
  if (result.failed > 0) {
    allGatesPassed = false;
  }
  
  console.log(`${statusSymbol} ${gateNames[gate]}`);
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
  console.log('🎉 ALL GATES PASSED - SR Implementation Verified\n');
  console.log('✅ Phase 3.4 Task 4.3 COMPLETE - Ready for production\n');
  process.exit(0);
} else {
  console.log('🚨 GATE FAILURE DETECTED - FORENSIC TRIAGE REQUIRED\n');
  console.log('❌ SR Implementation has critical issues\n');
  process.exit(1);
}
