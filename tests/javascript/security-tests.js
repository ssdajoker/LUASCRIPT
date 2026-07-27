/*
 * JavaScript Security Optimization Tests - Phase 3.3
 * 50+ test cases covering buffer overflow detection, type confusion prevention,
 * and bounds-checking emission with CWE mapping.
 */

const {
  analyzeBufferOverflow,
  applyBufferOverflowProtection
} = require("../../src/optimizers/javascript/security/buffer-overflow-detection");
const {
  analyzeTypeConfusion,
  applyTypeGuards
} = require("../../src/optimizers/javascript/security/type-confusion-prevention");
const {
  emitBoundsChecks,
  applyBoundsChecks
} = require("../../src/optimizers/javascript/security/bounds-checking-emitter");

class SecurityTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.cweCoverage = new Set();
  }

  test(name, cwe, testFn) {
    this.tests.push({ name, cwe, testFn });
  }

  assertEqual(actual, expected, message = "") {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but got ${actual}. ${message}`);
    }
  }

  assertTrue(condition, message = "") {
    if (!condition) {
      throw new Error(`Expected condition to be true. ${message}`);
    }
  }

  run() {
    console.log("Running JavaScript Security Optimization Tests...\n");

    for (const { name, cwe, testFn } of this.tests) {
      try {
        testFn();
        if (cwe) this.cweCoverage.add(cwe);
        console.log(`✅ ${name}`);
        this.passed += 1;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed += 1;
      }
    }

    console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
    console.log(`CWE Coverage: ${Array.from(this.cweCoverage).sort().join(", ")}`);

    if (this.failed > 0) {
      process.exitCode = 1;
    }
  }
}

const runner = new SecurityTestRunner();

// Helpers to build minimal AST/IR nodes
const identifier = (name) => ({ type: "Identifier", name });
const literal = (value) => ({ type: "Literal", value });
const arrayExpression = (elements) => ({ type: "ArrayExpression", elements });
const memberExpression = (object, property) => ({
  type: "MemberExpression",
  object,
  property,
  computed: true
});
const exprStmt = (expression) => ({ type: "ExpressionStatement", expression });
const binaryExpr = (left, operator, right) => ({ type: "BinaryExpression", operator, left, right });
const varDecl = (name, init, kind = "const") => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: identifier(name),
      init
    }
  ]
});
const callExpr = (callee, args) => ({ type: "CallExpression", callee, arguments: args });

const program = (...body) => ({
  program: {
    type: "Program",
    body
  }
});

// ---------------------------
// Buffer Overflow Detection
// ---------------------------

const safeIndexes = [0, 1, 2, 3, 4];
const outOfBoundsIndexes = [-1, 5, 9, 100, -3, 12, 50, 999];

safeIndexes.forEach((index, idx) => {
  runner.test(
    `Buffer: in-bounds literal index ${index}`,
    "CWE-125",
    () => {
      const ir = program(
        varDecl("arr", arrayExpression([literal(1), literal(2), literal(3), literal(4), literal(5)])),
        exprStmt(memberExpression(identifier("arr"), literal(index)))
      );
      const analysis = analyzeBufferOverflow(ir);
      runner.assertEqual(analysis.analysis.summary.safeAccesses, 1, `Case ${idx} should be safe`);
      runner.assertEqual(analysis.analysis.summary.outOfBoundsAccesses, 0);
    }
  );
});

outOfBoundsIndexes.forEach((index, idx) => {
  runner.test(
    `Buffer: out-of-bounds literal index ${index}`,
    "CWE-787",
    () => {
      const ir = program(
        varDecl("arr", arrayExpression([literal(1), literal(2), literal(3)])),
        exprStmt(memberExpression(identifier("arr"), literal(index)))
      );
      const analysis = analyzeBufferOverflow(ir);
      runner.assertEqual(analysis.analysis.summary.outOfBoundsAccesses, 1, `Case ${idx} should be out-of-bounds`);
    }
  );
});

["i", "j", "k", "offset"].forEach((name) => {
  runner.test(
    `Buffer: dynamic index ${name} requires check`,
    "CWE-119",
    () => {
      const ir = program(
        varDecl("arr", arrayExpression([literal(1), literal(2)])),
        exprStmt(memberExpression(identifier("arr"), identifier(name)))
      );
      const analysis = analyzeBufferOverflow(ir);
      runner.assertEqual(analysis.analysis.summary.needsCheckAccesses, 1);
    }
  );
});

runner.test("Buffer: unknown array length flagged", "CWE-20", () => {
  const ir = program(exprStmt(memberExpression(identifier("arr"), identifier("i"))));
  const analysis = analyzeBufferOverflow(ir);
  runner.assertEqual(analysis.analysis.summary.unknownLengthAccesses, 1);
});

runner.test("Buffer: mutation makes length unknown", "CWE-119", () => {
  const ir = program(
    varDecl("arr", arrayExpression([literal(1), literal(2)])),
    exprStmt(callExpr(memberExpression(identifier("arr"), identifier("push")), [literal(3)])),
    exprStmt(memberExpression(identifier("arr"), literal(0)))
  );
  const analysis = analyzeBufferOverflow(ir);
  runner.assertEqual(analysis.analysis.summary.unknownLengthAccesses, 1);
});

runner.test("Buffer: apply bounds protection marks access", "CWE-119", () => {
  const ir = program(
    varDecl("arr", arrayExpression([literal(1)])),
    exprStmt(memberExpression(identifier("arr"), literal(3)))
  );
  const analysis = analyzeBufferOverflow(ir);
  const result = applyBufferOverflowProtection(ir, analysis);
  const marked = result.optimizedIR.program.body[1].expression._boundsCheck;
  runner.assertTrue(Boolean(marked));
});

// ---------------------------
// Type Confusion Prevention
// ---------------------------

const typeConfusionCases = [
  { name: "Loose equality string vs number", left: literal("1"), op: "==", right: literal(1), severity: "high", cwe: "CWE-843" },
  { name: "Loose equality boolean vs string", left: literal(true), op: "==", right: literal("true"), severity: "high", cwe: "CWE-843" },
  { name: "Plus mixes string and number", left: literal("a"), op: "+", right: literal(1), severity: "medium", cwe: "CWE-704" },
  { name: "Numeric op with string", left: literal("5"), op: "*", right: literal(2), severity: "high", cwe: "CWE-704" },
  { name: "Comparison with unknown", left: identifier("x"), op: "<", right: literal(10), severity: "low", cwe: "CWE-704" },
  { name: "Loose equality unknown", left: identifier("x"), op: "!=", right: literal(null), severity: "medium", cwe: "CWE-843" },
  { name: "Numeric op unknown", left: identifier("x"), op: "/", right: literal(2), severity: "medium", cwe: "CWE-704" },
  { name: "Plus with unknown", left: identifier("x"), op: "+", right: literal("b"), severity: "medium", cwe: "CWE-704" },
  { name: "Comparison mismatched types", left: literal("z"), op: ">", right: literal(3), severity: "low", cwe: "CWE-843" },
  { name: "Loose equality null vs undefined", left: literal(null), op: "==", right: literal(undefined), severity: "high", cwe: "CWE-843" },
  { name: "Loose equality number vs boolean", left: literal(1), op: "==", right: literal(true), severity: "high", cwe: "CWE-843" },
  { name: "Plus mixes string and boolean", left: literal("a"), op: "+", right: literal(false), severity: "medium", cwe: "CWE-704" },
  { name: "Numeric op with array", left: arrayExpression([literal(1)]), op: "*", right: literal(2), severity: "high", cwe: "CWE-704" },
  { name: "Numeric op with null", left: literal(null), op: "-", right: literal(1), severity: "high", cwe: "CWE-704" },
  { name: "Comparison unknown vs unknown", left: identifier("a"), op: ">=", right: identifier("b"), severity: "low", cwe: "CWE-704" },
  { name: "Loose equality undefined vs number", left: literal(undefined), op: "==", right: literal(0), severity: "medium", cwe: "CWE-843" },
  { name: "Plus mixes array and number", left: arrayExpression([literal(1)]), op: "+", right: literal(2), severity: "medium", cwe: "CWE-704" },
  { name: "Comparison string vs boolean", left: literal("a"), op: "<=", right: literal(true), severity: "low", cwe: "CWE-843" }
];

const safeTypeCases = [
  { name: "Strict equality numbers", left: literal(1), op: "===", right: literal(2) },
  { name: "Numeric addition", left: literal(1), op: "+", right: literal(2) },
  { name: "Numeric subtraction", left: literal(10), op: "-", right: literal(3) },
  { name: "Strict equality strings", left: literal("a"), op: "===", right: literal("b") },
  { name: "Comparison numbers", left: literal(1), op: "<", right: literal(3) },
  { name: "Comparison booleans", left: literal(true), op: ">", right: literal(false) }
];

typeConfusionCases.forEach((testCase) => {
  runner.test(`Type: ${testCase.name}`, testCase.cwe, () => {
    const ir = program(exprStmt(binaryExpr(testCase.left, testCase.op, testCase.right)));
    const analysis = analyzeTypeConfusion(ir, { includeLowRisk: true });
    runner.assertEqual(analysis.analysis.summary.potentialConfusions, 1);
  });
});

safeTypeCases.forEach((testCase) => {
  runner.test(`Type: ${testCase.name} is safe`, "CWE-704", () => {
    const ir = program(exprStmt(binaryExpr(testCase.left, testCase.op, testCase.right)));
    const analysis = analyzeTypeConfusion(ir, { includeLowRisk: true });
    runner.assertEqual(analysis.analysis.summary.potentialConfusions, 0);
  });
});

runner.test("Type: apply type guards marks nodes", "CWE-843", () => {
  const ir = program(exprStmt(binaryExpr(literal("1"), "==", literal(1))));
  const analysis = analyzeTypeConfusion(ir, { includeLowRisk: true });
  const result = applyTypeGuards(ir, analysis);
  const guard = result.optimizedIR.program.body[0].expression._typeGuard;
  runner.assertTrue(Boolean(guard));
});

// ---------------------------
// Bounds Checking Emission
// ---------------------------

runner.test("Emit: dynamic index produces check", "CWE-119", () => {
  const ir = program(
    varDecl("arr", arrayExpression([literal(1), literal(2)])),
    exprStmt(memberExpression(identifier("arr"), identifier("i")))
  );
  const emission = emitBoundsChecks(ir);
  runner.assertEqual(emission.summary.totalChecks, 1);
});

runner.test("Emit: safe access skipped", "CWE-125", () => {
  const ir = program(
    varDecl("arr", arrayExpression([literal(1), literal(2), literal(3)])),
    exprStmt(memberExpression(identifier("arr"), literal(1)))
  );
  const emission = emitBoundsChecks(ir);
  runner.assertEqual(emission.summary.totalChecks, 0);
});

runner.test("Emit: out-of-bounds emits high severity", "CWE-787", () => {
  const ir = program(
    varDecl("arr", arrayExpression([literal(1), literal(2)])),
    exprStmt(memberExpression(identifier("arr"), literal(5)))
  );
  const emission = emitBoundsChecks(ir, { includeSafeAccesses: true });
  runner.assertTrue(emission.checks.some(check => check.severity === "high"));
});

runner.test("Emit: dedupe repeated access", "CWE-119", () => {
  const access = memberExpression(identifier("arr"), identifier("i"));
  const ir = program(
    varDecl("arr", arrayExpression([literal(1), literal(2)])),
    exprStmt(access),
    exprStmt(memberExpression(identifier("arr"), identifier("i")))
  );
  const emission = emitBoundsChecks(ir);
  runner.assertEqual(emission.summary.totalChecks, 1);
});

runner.test("Emit: apply bounds checks attaches metadata", "CWE-119", () => {
  const ir = program(
    varDecl("arr", arrayExpression([literal(1), literal(2)])),
    exprStmt(memberExpression(identifier("arr"), identifier("i")))
  );
  const emission = emitBoundsChecks(ir);
  const result = applyBoundsChecks(ir, emission);
  const guard = result.optimizedIR.program.body[1].expression._boundsCheck;
  runner.assertTrue(Boolean(guard));
});

runner.test("Emit: include safe access when requested", "CWE-125", () => {
  const ir = program(
    varDecl("arr", arrayExpression([literal(1), literal(2)])),
    exprStmt(memberExpression(identifier("arr"), literal(0)))
  );
  const emission = emitBoundsChecks(ir, { includeSafeAccesses: true });
  runner.assertEqual(emission.summary.totalChecks, 1);
});

// Run tests
runner.run();
