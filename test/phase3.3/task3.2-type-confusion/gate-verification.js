#!/usr/bin/env node

/**
 * PHASE 3.3 TASK 3.2 - TYPE CONFUSION PREVENTION GATE VERIFICATION
 * 
 * 5-Gate Test Suite (15 tests total):
 * - Gate 1: Correctness (3 tests)
 * - Gate 2: Determinism (3 tests)
 * - Gate 3: IR Validation (3 tests)
 * - Gate 4: Performance (3 tests)
 * - Gate 5: Integration (3 tests)
 */

const { analyzeTypeConfusion } = require('../../../src/optimizers/javascript/security/type-confusion-prevention');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ ${testName}`);
  } else {
    failedTests.push(testName);
    console.log(`  ❌ ${testName}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// GATE 1: CORRECTNESS (3 tests)
// ═══════════════════════════════════════════════════════════════

function testGate1Correctness() {
  console.log('\n📋 GATE 1: CORRECTNESS');
  
  // Test 1: Detect loose equality coercion (==)
  const looseEqualityIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "==",
            left: { type: "Identifier", name: "x" },
            right: { type: "Literal", value: "0" }
          }
        }
      ]
    }
  };
  
  const result1 = analyzeTypeConfusion(looseEqualityIR);
  assert(
    result1.success &&
    result1.analysis.summary.potentialConfusions >= 1,
    "Detect loose equality coercion (==)"
  );
  
  // Test 2: Flag mixed string + number operations
  const mixedTypeIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "Identifier", name: "str" },
            right: { type: "Identifier", name: "num" }
          }
        }
      ]
    }
  };
  
  const result2 = analyzeTypeConfusion(mixedTypeIR);
  assert(
    result2.success &&
    result2.analysis.summary.potentialConfusions >= 1,
    "Flag mixed string + number operations"
  );
  
  // Test 3: Identify implicit numeric conversions
  const numericCoercionIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "*",
            left: { type: "Identifier", name: "a" },
            right: { type: "Identifier", name: "b" }
          }
        }
      ]
    }
  };
  
  const result3 = analyzeTypeConfusion(numericCoercionIR);
  assert(
    result3.success &&
    result3.analysis.summary.totalBinaryExpressions >= 1,
    "Identify implicit numeric conversions"
  );
}

// ═══════════════════════════════════════════════════════════════
// GATE 2: DETERMINISM (3 tests)
// ═══════════════════════════════════════════════════════════════

function testGate2Determinism() {
  console.log('\n📋 GATE 2: DETERMINISM');
  
  const testIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "==",
            left: { type: "Identifier", name: "x" },
            right: { type: "Literal", value: 0 }
          }
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "Identifier", name: "a" },
            right: { type: "Identifier", name: "b" }
          }
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "<",
            left: { type: "Identifier", name: "i" },
            right: { type: "Literal", value: 10 }
          }
        }
      ]
    }
  };
  
  // Test 4: Same IR → same findings (10 runs)
  const runs = [];
  for (let i = 0; i < 10; i++) {
    const result = analyzeTypeConfusion(testIR);
    runs.push(JSON.stringify(result.analysis.summary));
  }
  const allIdentical = runs.every(r => r === runs[0]);
  assert(allIdentical, "Same IR → same summary across 10 runs");
  
  // Test 5: Risk severity consistent across runs
  const severityRuns = [];
  for (let i = 0; i < 10; i++) {
    const result = analyzeTypeConfusion(testIR);
    severityRuns.push(JSON.stringify(result.analysis.findings.map(f => f.severity)));
  }
  const severityConsistent = severityRuns.every(r => r === severityRuns[0]);
  assert(severityConsistent, "Risk severity consistent across runs");
  
  // Test 6: Guard generation deterministic
  const guardRuns = [];
  for (let i = 0; i < 10; i++) {
    const result = analyzeTypeConfusion(testIR);
    guardRuns.push(JSON.stringify(result.analysis.findings.map(f => f.guard)));
  }
  const guardConsistent = guardRuns.every(r => r === guardRuns[0]);
  assert(guardConsistent, "Guard generation deterministic");
}

// ═══════════════════════════════════════════════════════════════
// GATE 3: IR VALIDATION (3 tests)
// ═══════════════════════════════════════════════════════════════

function testGate3IRValidation() {
  console.log('\n📋 GATE 3: IR VALIDATION');
  
  // Test 7: Handle missing BinaryExpression fields
  const incompleteBinaryIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "Literal", value: 1 },
            // Missing right!
          }
        }
      ]
    }
  };
  
  const result1 = analyzeTypeConfusion(incompleteBinaryIR);
  assert(
    result1.success, // Should not crash
    "Handle missing BinaryExpression fields"
  );
  
  // Test 8: Reject null/undefined nodes safely
  const result2 = analyzeTypeConfusion(null);
  assert(
    !result2.success && result2.error,
    "Reject null IR safely"
  );
  
  // Test 9: Survive incomplete type information
  const unknownTypesIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "==",
            left: { type: "CallExpression", callee: { type: "Identifier", name: "foo" }, arguments: [] },
            right: { type: "CallExpression", callee: { type: "Identifier", name: "bar" }, arguments: [] }
          }
        }
      ]
    }
  };
  
  const result3 = analyzeTypeConfusion(unknownTypesIR);
  assert(
    result3.success,
    "Survive incomplete type information"
  );
}

// ═══════════════════════════════════════════════════════════════
// GATE 4: PERFORMANCE (3 tests)
// ═══════════════════════════════════════════════════════════════

function testGate4Performance() {
  console.log('\n📋 GATE 4: PERFORMANCE');
  
  // Test 10: Analyze 200 binary expressions < 40ms
  const largeIR = {
    program: {
      type: "Program",
      body: []
    }
  };
  
  for (let i = 0; i < 200; i++) {
    largeIR.program.body.push({
      type: "ExpressionStatement",
      expression: {
        type: "BinaryExpression",
        operator: i % 2 === 0 ? "==" : "+",
        left: { type: "Identifier", name: `a${i}` },
        right: { type: "Identifier", name: `b${i}` }
      }
    });
  }
  
  const start = performance.now();
  const result = analyzeTypeConfusion(largeIR);
  const elapsed = performance.now() - start;
  
  assert(
    result.success && elapsed < 40,
    `Analyze 200 expressions < 40ms (${elapsed.toFixed(2)}ms)`
  );
  
  // Test 11: Memory usage reasonable
  const memBefore = process.memoryUsage().heapUsed;
  const veryLargeIR = {
    program: {
      type: "Program",
      body: []
    }
  };
  
  for (let i = 0; i < 1000; i++) {
    veryLargeIR.program.body.push({
      type: "ExpressionStatement",
      expression: {
        type: "BinaryExpression",
        operator: i % 3 === 0 ? "==" : (i % 3 === 1 ? "+" : "*"),
        left: { type: "Identifier", name: `x${i % 20}` },
        right: { type: "Identifier", name: `y${i % 20}` }
      }
    });
  }
  
  analyzeTypeConfusion(veryLargeIR);
  const memAfter = process.memoryUsage().heapUsed;
  const memDelta = (memAfter - memBefore) / (1024 * 1024);
  
  assert(
    memDelta < 8,
    `Memory usage < 8MB for 1000 expressions (${memDelta.toFixed(2)}MB)`
  );
  
  // Test 12: Reasonable scaling
  const sizes = [10, 50, 100];
  const times = [];
  
  for (const size of sizes) {
    const ir = {
      program: {
        type: "Program",
        body: Array(size).fill(null).map((_, i) => ({
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: i % 2 === 0 ? "==" : "+",
            left: { type: "Identifier", name: "a" },
            right: { type: "Identifier", name: "b" }
          }
        }))
      }
    };
    
    const startTime = performance.now();
    analyzeTypeConfusion(ir);
    times.push(performance.now() - startTime);
  }
  
  const ratio = times[2] / times[0];
  const isReasonable = ratio >= 2 && ratio <= 20;
  assert(
    isReasonable,
    `Reasonable scaling (10x input → ${ratio.toFixed(1)}x time)`
  );
}

// ═══════════════════════════════════════════════════════════════
// GATE 5: INTEGRATION (3 tests)
// ═══════════════════════════════════════════════════════════════

function testGate5Integration() {
  console.log('\n📋 GATE 5: INTEGRATION');
  
  const testIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "==",
            left: { type: "Identifier", name: "x" },
            right: { type: "Literal", value: "0" }
          }
        }
      ]
    }
  };
  
  // Test 13: Output format compatible with bounds emitter
  const result = analyzeTypeConfusion(testIR);
  assert(
    result.success &&
    result.analysis &&
    result.analysis.findings &&
    Array.isArray(result.analysis.findings) &&
    result.analysis.findings.every(f => f.kind && f.severity && f.reason),
    "Output format compatible with other modules"
  );
  
  // Test 14: Risk levels match Phase 3 security standards
  const allFindings = result.analysis.findings;
  const validSeverities = allFindings.every(f => 
    ['low', 'medium', 'high'].includes(f.severity)
  );
  assert(
    validSeverities,
    "Risk levels use Phase 3 standard (low/medium/high)"
  );
  
  // Test 15: Works with multiple expression types
  const multiTypeIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "==",
            left: { type: "Literal", value: 0 },
            right: { type: "Literal", value: "0" }
          }
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "!=",
            left: { type: "Identifier", name: "a" },
            right: { type: "Identifier", name: "b" }
          }
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "Identifier", name: "str" },
            right: { type: "Literal", value: 123 }
          }
        }
      ]
    }
  };
  
  const multiResult = analyzeTypeConfusion(multiTypeIR);
  assert(
    multiResult.success &&
    multiResult.analysis.findings.length >= 2,
    "Detects multiple type confusion issues"
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║  PHASE 3.3 TASK 3.2 - TYPE CONFUSION PREVENTION VERIFICATION   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');

const startTime = performance.now();

testGate1Correctness();
testGate2Determinism();
testGate3IRValidation();
testGate4Performance();
testGate5Integration();

const totalTime = performance.now() - startTime;

console.log('\n' + '═'.repeat(65));
console.log('📊 FINAL RESULTS');
console.log('═'.repeat(65));
console.log(`Total Tests:     ${totalTests}`);
console.log(`Passed:          ${passedTests} ✅`);
console.log(`Failed:          ${totalTests - passedTests} ❌`);
console.log(`Success Rate:    ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log(`Total Time:      ${totalTime.toFixed(2)}ms`);
console.log('═'.repeat(65));

if (failedTests.length > 0) {
  console.log('\n❌ Failed Tests:');
  failedTests.forEach(test => console.log(`  - ${test}`));
  process.exit(1);
} else {
  console.log('\n✅ ALL GATES VERIFIED - TASK 3.2 COMPLETE');
  process.exit(0);
}
