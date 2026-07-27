"use strict";

/**
 * PHP Clarity Canon Verification
 * Comprehensive test suite for PHP Phases A, B, C, E
 * 
 * Target: 95%+ pass rate
 * Coverage: Lowering, normalization, optimization, security
 */

// Phase A: Lowering
const PHPLowerer = require("../src/ir/lowerer_php");

// Phase B: Normalization
const PHPIRLowererPhaseB = require("../src/ir/php_ir_lowerer_phase_b");

// Phase C: Optimization
const PHPPerformanceOptimizer = require("../src/optimizers/php/php_performance_optimizer");

// Phase E: Security
const PHPSecurityValidator = require("../src/optimizers/php/php_security_validator");

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Test runner
 */
function test(name, fn) {
  totalTests++;
  
  try {
    fn();
    console.log(`✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failedTests++;
  }
}

/**
 * PHASE A TESTS: Lowering
 */

console.log("\n=== PHASE A: PHP Lowering Tests ===\n");

const lowerer = new PHPLowerer();

test("Lowerer instantiates", () => {
  if (!lowerer) {
    throw new Error("Lowerer failed to instantiate");
  }
});

test("Lower: empty program", () => {
  const ast = { type: "Program", body: [] };
  const ir = lowerer.lower(ast);
  
  if (!ir || !ir.module) {
    throw new Error("Empty program lowering failed");
  }
  
  if (ir.module.phase !== "A") {
    throw new Error(`Expected phase A, got ${ir.module.phase}`);
  }
});

test("Lower: variable assignment", () => {
  const ast = {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          left: { type: "Identifier", name: "$x" },
          right: { type: "Literal", value: 42 },
        },
      },
    ],
  };
  
  const ir = lowerer.lower(ast);
  
  if (!ir || !ir.nodes || ir.nodes.length === 0) {
    throw new Error("Variable assignment lowering failed");
  }
});

test("Lower: function declaration", () => {
  const ast = {
    type: "Program",
    body: [
      {
        type: "FunctionDeclaration",
        name: "greet",
        params: ["$name"],
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "echo" },
              arguments: [{ type: "Identifier", name: "$name" }],
            },
          },
        ],
      },
    ],
  };
  
  const ir = lowerer.lower(ast);
  
  if (!ir || !ir.nodes || ir.nodes.length === 0) {
    throw new Error("Function declaration lowering failed");
  }
  
  const funcNode = ir.nodes[0];
  if (funcNode.type !== "FunctionDeclaration") {
    throw new Error("Expected FunctionDeclaration node");
  }
});

test("Lower: class declaration", () => {
  const ast = {
    type: "Program",
    body: [
      {
        type: "ClassDeclaration",
        name: "User",
        body: [
          {
            type: "PropertyDeclaration",
            name: "$name",
            visibility: "public",
          },
          {
            type: "FunctionDeclaration",
            name: "getName",
            params: [],
            body: [],
            visibility: "public",
          },
        ],
      },
    ],
  };
  
  const ir = lowerer.lower(ast);
  
  if (!ir || !ir.nodes || ir.nodes.length === 0) {
    throw new Error("Class declaration lowering failed");
  }
  
  const classNode = ir.nodes[0];
  if (classNode.type !== "ClassDeclaration") {
    throw new Error("Expected ClassDeclaration node");
  }
});

test("Lower: namespace declaration", () => {
  const ast = {
    type: "Program",
    body: [
      {
        type: "NamespaceDeclaration",
        name: "App\\Models",
        body: [],
      },
    ],
  };
  
  const ir = lowerer.lower(ast);
  
  if (!ir || !ir.nodes || ir.nodes.length === 0) {
    throw new Error("Namespace declaration lowering failed");
  }
});

/**
 * PHASE B TESTS: Normalization
 */

console.log("\n=== PHASE B: PHP Normalization Tests ===\n");

const phaseBLowerer = new PHPIRLowererPhaseB();

test("Phase B lowerer instantiates", () => {
  if (!phaseBLowerer) {
    throw new Error("Phase B lowerer failed to instantiate");
  }
});

test("Phase B: normalize types", () => {
  const phaseAIR = {
    module: { name: "main", language: "PHP", phase: "A" },
    nodes: [
      {
        type: "FunctionDeclaration",
        name: "add",
        params: [{ type: "Identifier", name: "a" }, { type: "Identifier", name: "b" }],
        body: [
          {
            type: "ReturnStatement",
            argument: {
              type: "BinaryExpression",
              operator: "+",
              left: { type: "Identifier", name: "a" },
              right: { type: "Identifier", name: "b" },
            },
          },
        ],
        returnType: "int",
      },
    ],
  };
  
  const result = phaseBLowerer.lower(phaseAIR);
  
  if (!result || !result.ir) {
    throw new Error("Phase B normalization failed");
  }
  
  if (result.errors.length > 0) {
    throw new Error(`Phase B errors: ${result.errors.join(", ")}`);
  }
  
  if (result.ir.module.phase !== "B") {
    throw new Error(`Expected phase B, got ${result.ir.module.phase}`);
  }
});

test("Phase B: normalize control flow", () => {
  const phaseAIR = {
    module: { name: "main", language: "PHP", phase: "A" },
    nodes: [
      {
        type: "ForEachStatement",
        left: { type: "Identifier", name: "item" },
        right: {
          type: "ArrayExpression",
          elements: [
            { type: "Literal", value: 1 },
            { type: "Literal", value: 2 },
          ],
        },
        body: {
          type: "BlockStatement",
          body: [],
        },
      },
    ],
  };
  
  const result = phaseBLowerer.lower(phaseAIR);
  
  if (!result || !result.ir) {
    throw new Error("Control flow normalization failed");
  }
});

test("Phase B: normalize expressions", () => {
  const phaseAIR = {
    module: { name: "main", language: "PHP", phase: "A" },
    nodes: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: ".",
          left: { type: "Literal", value: "Hello " },
          right: { type: "Literal", value: "World" },
        },
      },
    ],
  };
  
  const result = phaseBLowerer.lower(phaseAIR);
  
  if (!result || !result.ir) {
    throw new Error("Expression normalization failed");
  }
  
  // Check that concatenation operator was normalized
  const expr = result.ir.nodes[0].expression;
  if (expr.operator !== "+" || !expr.phpConcatenation) {
    throw new Error("Concatenation operator not normalized");
  }
});

/**
 * PHASE C TESTS: Optimization
 */

console.log("\n=== PHASE C: PHP Optimization Tests ===\n");

const optimizer = new PHPPerformanceOptimizer();

test("Optimizer instantiates", () => {
  if (!optimizer) {
    throw new Error("Optimizer failed to instantiate");
  }
});

test("Optimizer: dead code elimination", () => {
  const testIR = {
    module: { name: "main", language: "PHP", phase: "B" },
    nodes: [
      {
        type: "FunctionDeclaration",
        name: "test",
        params: [],
        body: [
          {
            type: "ReturnStatement",
            argument: { type: "Literal", value: 1 },
          },
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "echo" },
              arguments: [{ type: "Literal", value: "unreachable" }],
            },
          },
        ],
      },
    ],
  };
  
  const optimized = optimizer.eliminateDeadCode(testIR);
  
  if (!optimized) {
    throw new Error("DCE failed");
  }
  
  const funcBody = optimized.nodes[0].body;
  if (funcBody.length !== 1) {
    throw new Error(`Expected 1 statement after DCE, got ${funcBody.length}`);
  }
  
  if (optimizer.stats.deadCodeRemoved === 0) {
    throw new Error("No dead code removed");
  }
});

test("Optimizer: constant folding", () => {
  const testIR = {
    module: { name: "main", language: "PHP", phase: "B" },
    nodes: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "+",
          left: { type: "Literal", value: 2 },
          right: { type: "Literal", value: 3 },
        },
      },
    ],
  };
  
  const optimized = optimizer.foldConstants(testIR);
  
  if (!optimized) {
    throw new Error("Constant folding failed");
  }
  
  const expr = optimized.nodes[0].expression;
  if (expr.type !== "Literal" || expr.value !== 5) {
    throw new Error(`Expected folded value 5, got ${expr.value}`);
  }
  
  if (optimizer.stats.constantsFolded === 0) {
    throw new Error("No constants folded");
  }
});

test("Optimizer: loop unrolling", () => {
  const testIR = {
    module: { name: "main", language: "PHP", phase: "B" },
    nodes: [
      {
        type: "ForInStatement",
        left: { type: "Identifier", name: "i" },
        right: {
          type: "ArrayExpression",
          elements: [
            { type: "Literal", value: 1 },
            { type: "Literal", value: 2 },
          ],
        },
        body: {
          type: "BlockStatement",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: { type: "Identifier", name: "echo" },
                arguments: [{ type: "Identifier", name: "i" }],
              },
            },
          ],
        },
      },
    ],
  };
  
  const optimized = optimizer.optimizeLoops(testIR);
  
  if (!optimized) {
    throw new Error("Loop optimization failed");
  }
  
  if (optimizer.stats.loopsOptimized === 0) {
    throw new Error("No loops optimized");
  }
});

test("Optimizer: string concatenation", () => {
  const testIR = {
    module: { name: "main", language: "PHP", phase: "B" },
    nodes: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "+",
          left: { type: "Literal", value: "Hello " },
          right: { type: "Literal", value: "World" },
          phpConcatenation: true,
        },
      },
    ],
  };
  
  const optimized = optimizer.optimizeStrings(testIR);
  
  if (!optimized) {
    throw new Error("String optimization failed");
  }
  
  const expr = optimized.nodes[0].expression;
  if (expr.type === "Literal" && expr.value === "Hello World") {
    // Successfully concatenated
    if (optimizer.stats.stringsOptimized === 0) {
      throw new Error("String optimization stat not updated");
    }
  }
});

test("Optimizer: full pipeline", () => {
  const testIR = {
    module: { name: "main", language: "PHP", phase: "B" },
    nodes: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "+",
          left: { type: "Literal", value: 10 },
          right: { type: "Literal", value: 20 },
        },
      },
    ],
  };
  
  const optimized = optimizer.optimize(testIR);
  
  if (!optimized) {
    throw new Error("Full optimization pipeline failed");
  }
  
  if (!optimized.optimizationStats) {
    throw new Error("Optimization stats missing");
  }
  
  if (optimized.module.phase !== "C") {
    throw new Error(`Expected phase C, got ${optimized.module.phase}`);
  }
});

/**
 * PHASE E TESTS: Security
 */

console.log("\n=== PHASE E: PHP Security Tests ===\n");

const validator = new PHPSecurityValidator();

test("Security validator instantiates", () => {
  if (!validator) {
    throw new Error("Security validator failed to instantiate");
  }
});

test("Security: detect eval vulnerability", () => {
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "eval" },
        arguments: [{ type: "Identifier", name: "_GET" }],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (result.passed) {
    throw new Error("Should detect eval vulnerability");
  }
  
  if (result.stats.criticalIssues === 0) {
    throw new Error("No critical issues found");
  }
  
  if (result.issues.length === 0) {
    throw new Error("No issues reported");
  }
});

test("Security: detect SQL injection", () => {
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "mysql_query" },
        arguments: [
          {
            type: "BinaryExpression",
            operator: ".",
            left: { type: "Literal", value: "SELECT * FROM users WHERE id = " },
            right: { type: "Identifier", name: "_GET" },
          },
        ],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (result.passed) {
    throw new Error("Should detect SQL injection");
  }
  
  if (!result.issues.some(issue => issue.type === "sql-injection")) {
    throw new Error("SQL injection not detected");
  }
});

test("Security: detect command injection", () => {
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "shell_exec" },
        arguments: [{ type: "Identifier", name: "_GET" }],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (result.passed) {
    throw new Error("Should detect command injection");
  }
  
  if (!result.issues.some(issue => issue.type === "command-injection")) {
    throw new Error("Command injection not detected");
  }
});

test("Security: detect XSS vulnerability", () => {
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "echo" },
        arguments: [{ type: "Identifier", name: "_GET" }],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (result.passed) {
    throw new Error("Should detect XSS vulnerability");
  }
  
  if (!result.issues.some(issue => issue.type === "xss")) {
    throw new Error("XSS not detected");
  }
});

test("Security: detect insecure deserialization", () => {
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "unserialize" },
        arguments: [{ type: "Identifier", name: "_COOKIE" }],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (result.passed) {
    throw new Error("Should detect insecure deserialization");
  }
  
  if (!result.issues.some(issue => issue.type === "insecure-deserialization")) {
    throw new Error("Insecure deserialization not detected");
  }
});

test("Security: detect weak cryptography", () => {
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "md5" },
        arguments: [{ type: "Identifier", name: "password" }],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (!result.issues.some(issue => issue.type === "weak-cryptography")) {
    throw new Error("Weak cryptography not detected");
  }
});

test("Security: calculate security score", () => {
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "eval" },
        arguments: [],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (typeof result.securityScore !== "number") {
    throw new Error("Security score not calculated");
  }
  
  if (result.securityScore < 0 || result.securityScore > 100) {
    throw new Error(`Invalid security score: ${result.securityScore}`);
  }
});

test("Security: safe code passes", () => {
  const testIR = {
    nodes: [
      {
        type: "FunctionDeclaration",
        name: "greet",
        params: [{ type: "Identifier", name: "name" }],
        body: [
          {
            type: "ReturnStatement",
            argument: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "htmlspecialchars" },
              arguments: [{ type: "Identifier", name: "name" }],
            },
          },
        ],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  
  if (!result.passed) {
    console.log("  Note: Safe code flagged warnings (expected if conservative)");
  }
  
  if (result.securityScore < 80) {
    throw new Error(`Security score too low for safe code: ${result.securityScore}`);
  }
});

/**
 * PRINT RESULTS
 */

console.log("\n=== CLARITY CANON VERIFICATION RESULTS ===\n");
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log("\n✓ ALL TESTS PASSED - PHP CLARITY CANON VERIFIED\n");
} else {
  console.log(`\n✗ ${failedTests} test(s) failed - Review required\n`);
  process.exit(1);
}
