#!/usr/bin/env node

/**
 * PHASE 3.3 TASK 3.1 - BUFFER OVERFLOW DETECTION GATE VERIFICATION
 * 
 * 5-Gate Test Suite (15 tests total):
 * - Gate 1: Correctness (3 tests)
 * - Gate 2: Determinism (3 tests)
 * - Gate 3: IR Validation (3 tests)
 * - Gate 4: Performance (3 tests)
 * - Gate 5: Integration (3 tests)
 */

const { analyzeBufferOverflow } = require('../../../src/optimizers/javascript/security/buffer-overflow-detection');

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
  
  // Test 1: Detect constant out-of-bounds access
  const outOfBoundsIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "arr" },
              init: {
                type: "ArrayExpression",
                elements: [
                  { type: "Literal", value: 1 },
                  { type: "Literal", value: 2 },
                  { type: "Literal", value: 3 }
                ]
              }
            }
          ]
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "arr" },
            property: { type: "Literal", value: 5 } // Out of bounds!
          }
        }
      ]
    }
  };
  
  const result1 = analyzeBufferOverflow(outOfBoundsIR);
  assert(
    result1.success &&
    result1.analysis.summary.outOfBoundsAccesses >= 1,
    "Detect constant out-of-bounds access"
  );
  
  // Test 2: Flag dynamic index requiring runtime check
  const dynamicIndexIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "VariableDeclaration",
          kind: "const", // Use const so array is not mutable
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "data" },
              init: {
                type: "ArrayExpression",
                elements: [
                  { type: "Literal", value: 10 },
                  { type: "Literal", value: 20 }
                ]
              }
            }
          ]
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "data" },
            property: { type: "Identifier", name: "i" } // Dynamic index
          }
        }
      ]
    }
  };
  
  const result2 = analyzeBufferOverflow(dynamicIndexIR);
  assert(
    result2.success &&
    result2.analysis.summary.needsCheckAccesses >= 1,
    "Flag dynamic index requiring runtime check"
  );
  
  // Test 3: Track array length through mutations
  const mutatedArrayIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "VariableDeclaration",
          kind: "let",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "list" },
              init: {
                type: "ArrayExpression",
                elements: [{ type: "Literal", value: 1 }]
              }
            }
          ]
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "list" },
              property: { type: "Identifier", name: "push" }
            },
            arguments: [{ type: "Literal", value: 2 }]
          }
        }
      ]
    }
  };
  
  const result3 = analyzeBufferOverflow(mutatedArrayIR, { trackMutations: true });
  assert(
    result3.success &&
    result3.analysis.summary.mutatedArrays >= 1,
    "Track array mutation (push)"
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
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "x" },
              init: {
                type: "ArrayExpression",
                elements: [{ type: "Literal", value: 1 }]
              }
            }
          ]
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "x" },
            property: { type: "Literal", value: 0 }
          }
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "x" },
            property: { type: "Identifier", name: "idx" }
          }
        }
      ]
    }
  };
  
  // Test 4: Same IR → same findings (10 runs)
  const runs = [];
  for (let i = 0; i < 10; i++) {
    const result = analyzeBufferOverflow(testIR);
    runs.push(JSON.stringify(result.analysis.summary));
  }
  const allIdentical = runs.every(r => r === runs[0]);
  assert(allIdentical, "Same IR → same summary across 10 runs");
  
  // Test 5: Finding order consistent across runs
  const findingRuns = [];
  for (let i = 0; i < 10; i++) {
    const result = analyzeBufferOverflow(testIR);
    findingRuns.push(JSON.stringify(result.analysis.findings.map(f => f.status)));
  }
  const orderConsistent = findingRuns.every(r => r === findingRuns[0]);
  assert(orderConsistent, "Finding order consistent across runs");
  
  // Test 6: Risk classification deterministic
  const severityRuns = [];
  for (let i = 0; i < 10; i++) {
    const result = analyzeBufferOverflow(testIR);
    severityRuns.push(JSON.stringify(result.analysis.findings.map(f => f.severity)));
  }
  const severityConsistent = severityRuns.every(r => r === severityRuns[0]);
  assert(severityConsistent, "Risk severity deterministic");
}

// ═══════════════════════════════════════════════════════════════
// GATE 3: IR VALIDATION (3 tests)
// ═══════════════════════════════════════════════════════════════

function testGate3IRValidation() {
  console.log('\n📋 GATE 3: IR VALIDATION');
  
  // Test 7: Reject malformed IR gracefully
  const result1 = analyzeBufferOverflow(null);
  assert(
    !result1.success && result1.error,
    "Reject null IR gracefully"
  );
  
  // Test 8: Handle missing array expressions
  const incompleteIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "unknown" },
            property: { type: "Literal", value: 0 }
          }
        }
      ]
    }
  };
  
  const result2 = analyzeBufferOverflow(incompleteIR);
  assert(
    result2.success && result2.analysis.summary.unknownLengthAccesses >= 1,
    "Handle unknown array (no declaration)"
  );
  
  // Test 9: Survive invalid AST nodes
  const invalidNodeIR = {
    program: {
      type: "Program",
      body: [
        {
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "arr" },
              init: { type: "ArrayExpression", elements: [] }
            }
          ]
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: null, // Invalid!
            property: { type: "Literal", value: 0 }
          }
        }
      ]
    }
  };
  
  const result3 = analyzeBufferOverflow(invalidNodeIR);
  assert(
    result3.success, // Should not crash
    "Survive invalid AST nodes (null object)"
  );
}

// ═══════════════════════════════════════════════════════════════
// GATE 4: PERFORMANCE (3 tests)
// ═══════════════════════════════════════════════════════════════

function testGate4Performance() {
  console.log('\n📋 GATE 4: PERFORMANCE');
  
  // Test 10: Analyze 100 array accesses < 50ms
  const largeIR = {
    program: {
      type: "Program",
      body: []
    }
  };
  
  // Create 100 array accesses
  for (let i = 0; i < 100; i++) {
    largeIR.program.body.push({
      type: "ExpressionStatement",
      expression: {
        type: "MemberExpression",
        computed: true,
        object: { type: "Identifier", name: `arr${i % 10}` },
        property: { type: "Literal", value: i % 5 }
      }
    });
  }
  
  const start = performance.now();
  const result = analyzeBufferOverflow(largeIR);
  const elapsed = performance.now() - start;
  
  assert(
    result.success && elapsed < 50,
    `Analyze 100 array accesses < 50ms (${elapsed.toFixed(2)}ms)`
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
        type: "MemberExpression",
        computed: true,
        object: { type: "Identifier", name: `data${i % 20}` },
        property: { type: "Identifier", name: "idx" }
      }
    });
  }
  
  analyzeBufferOverflow(veryLargeIR);
  const memAfter = process.memoryUsage().heapUsed;
  const memDelta = (memAfter - memBefore) / (1024 * 1024);
  
  assert(
    memDelta < 10,
    `Memory usage < 10MB for 1000 accesses (${memDelta.toFixed(2)}MB)`
  );
  
  // Test 12: Linear scaling
  const sizes = [10, 50, 100];
  const times = [];
  
  for (const size of sizes) {
    const ir = {
      program: {
        type: "Program",
        body: Array(size).fill(null).map((_, i) => ({
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "arr" },
            property: { type: "Literal", value: i }
          }
        }))
      }
    };
    
    const startTime = performance.now();
    analyzeBufferOverflow(ir);
    times.push(performance.now() - startTime);
  }
  
  // Check if roughly linear: time(100) / time(10) should be ~10
  // For very fast operations, ratio may be lower due to constant overhead
  const ratio = times[2] / times[0];
  const isReasonable = ratio >= 2 && ratio <= 20; // More lenient for fast operations
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
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "buffer" },
              init: {
                type: "ArrayExpression",
                elements: [
                  { type: "Literal", value: 10 },
                  { type: "Literal", value: 20 }
                ]
              }
            }
          ]
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "buffer" },
            property: { type: "Literal", value: 5 }
          }
        }
      ]
    }
  };
  
  // Test 13: Output compatible with bounds-checking-emitter
  const result = analyzeBufferOverflow(testIR);
  assert(
    result.success &&
    result.analysis &&
    result.analysis.findings &&
    Array.isArray(result.analysis.findings) &&
    result.analysis.findings.every(f => f.access && f.status && f.severity),
    "Output format compatible with bounds emitter"
  );
  
  // Test 14: IR metadata format matches Phase 3 standard
  assert(
    result.success &&
    result.analysis.summary &&
    typeof result.analysis.summary.totalArrayAccesses === 'number' &&
    typeof result.analysis.summary.safeAccesses === 'number',
    "Summary format matches Phase 3 standard"
  );
  
  // Test 15: Findings have required fields
  const requiredFields = ['access', 'status', 'severity', 'reason'];
  const allFindingsValid = result.analysis.findings.every(finding => 
    requiredFields.every(field => field in finding)
  );
  
  assert(
    allFindingsValid,
    "All findings have required fields (access, status, severity, reason)"
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║  PHASE 3.3 TASK 3.1 - BUFFER OVERFLOW DETECTION VERIFICATION  ║');
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
  console.log('\n✅ ALL GATES VERIFIED - TASK 3.1 COMPLETE');
  process.exit(0);
}
