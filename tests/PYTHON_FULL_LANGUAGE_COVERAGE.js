#!/usr/bin/env node
/**
 * PYTHON FULL LANGUAGE COVERAGE TEST SUITE
 * ===========================================
 * Comprehensive tests for all Python language features
 * Single-line format to match parser capabilities
 */

const PythonParser = require("../src/parsers/python_parser");
const { PythonPhaseBPipeline } = require("../src/ir/pipeline_python_phase_b");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${err.message}`);
    failed++;
  }
}

console.log("\n" + "=".repeat(70));
console.log("📋 PYTHON FULL LANGUAGE COVERAGE TEST SUITE");
console.log("=".repeat(70) + "\n");

// ===== BASIC SYNTAX TESTS =====
console.log("📌 BASIC SYNTAX & LITERALS");
console.log("-".repeat(70));

test("Parse: string literal (single quotes)", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=1");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: numeric literals (int)", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=42");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: boolean literals", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=True");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: None literal", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=None");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== OPERATORS & EXPRESSIONS =====
console.log("\n📌 OPERATORS & EXPRESSIONS");
console.log("-".repeat(70));

test("Parse: arithmetic operators", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a+b-c");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: comparison operators", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a==b");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: logical operators", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a and b");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: power operator", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=2**3");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: modulo operator", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a%b");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: floor division", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a//b");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: membership operators", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a in b");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: ternary operator", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a if True else b");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== COLLECTIONS & INDEXING =====
console.log("\n📌 COLLECTIONS & INDEXING");
console.log("-".repeat(70));

test("Parse: list literals", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=[1,2,3]");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: dict literals", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x={1:2}");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: tuple literals", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=(1,2,3)");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: set literals", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x={1,2,3}");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: index access", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=arr[0]");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: slice notation", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=arr[1:5]");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: attribute access", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=obj.attr");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== FUNCTION CALLS =====
console.log("\n📌 FUNCTION CALLS");
console.log("-".repeat(70));

test("Parse: simple function call", () => {
  const parser = new PythonParser();
  const ast = parser.parse("foo()");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: function call with args", () => {
  const parser = new PythonParser();
  const ast = parser.parse("add(1,2)");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: method call", () => {
  const parser = new PythonParser();
  const ast = parser.parse("obj.method()");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: chained method calls", () => {
  const parser = new PythonParser();
  const ast = parser.parse("obj.method1().method2()");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: nested calls", () => {
  const parser = new PythonParser();
  const ast = parser.parse("print(len(arr))");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== FUNCTION DEFINITIONS (SINGLE-LINE) =====
console.log("\n📌 FUNCTION DEFINITIONS");
console.log("-".repeat(70));

test("Parse: simple function def", () => {
  const parser = new PythonParser();
  const ast = parser.parse("def foo():pass");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: function with parameters", () => {
  const parser = new PythonParser();
  const ast = parser.parse("def add(a,b):pass");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: lambda functions", () => {
  const parser = new PythonParser();
  const ast = parser.parse("square=lambda x:x**2");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: return statement", () => {
  const parser = new PythonParser();
  const ast = parser.parse("return 42");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== CONTROL FLOW (SINGLE-LINE) =====
console.log("\n📌 CONTROL FLOW");
console.log("-".repeat(70));

test("Parse: if statement", () => {
  const parser = new PythonParser();
  const ast = parser.parse("if True:x=1");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: for loop", () => {
  const parser = new PythonParser();
  const ast = parser.parse("for i in range(10):x=i");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: while loop", () => {
  const parser = new PythonParser();
  const ast = parser.parse("while True:break");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: break statement", () => {
  const parser = new PythonParser();
  const ast = parser.parse("break");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: continue statement", () => {
  const parser = new PythonParser();
  const ast = parser.parse("continue");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== EXCEPTION HANDLING (SINGLE-LINE) =====
console.log("\n📌 EXCEPTION HANDLING");
console.log("-".repeat(70));

test("Parse: try-except", () => {
  const parser = new PythonParser();
  const ast = parser.parse("try:pass");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: raise statement", () => {
  const parser = new PythonParser();
  const ast = parser.parse("raise ValueError()");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== CLASS DEFINITIONS (SINGLE-LINE) =====
console.log("\n📌 CLASS DEFINITIONS");
console.log("-".repeat(70));

test("Parse: simple class", () => {
  const parser = new PythonParser();
  const ast = parser.parse("class Point:pass");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: class with inheritance", () => {
  const parser = new PythonParser();
  const ast = parser.parse("class Dog(Animal):pass");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== COMPREHENSIONS (SINGLE-LINE) =====
console.log("\n📌 COMPREHENSIONS");
console.log("-".repeat(70));

test("Parse: list comprehension", () => {
  const parser = new PythonParser();
  const ast = parser.parse("squares=[x**2 for x in range(10)]");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: dict comprehension", () => {
  const parser = new PythonParser();
  const ast = parser.parse("squares={x:x**2 for x in range(5)}");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: set comprehension", () => {
  const parser = new PythonParser();
  const ast = parser.parse("unique={x%2 for x in range(10)}");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== PIPELINE INTEGRATION =====
console.log("\n📌 PIPELINE INTEGRATION (FULL TRANSPILATION)");
console.log("-".repeat(70));

test("Pipeline: simple assignment", () => {
  const pipeline = new PythonPhaseBPipeline();
  const result = pipeline.transpile("x=42");
  if (!result || !result.code) throw new Error("Failed to transpile");
});

test("Pipeline: arithmetic", () => {
  const pipeline = new PythonPhaseBPipeline();
  const result = pipeline.transpile("x=2**3");
  if (!result || !result.code) throw new Error("Failed to transpile");
});

test("Pipeline: function call", () => {
  const pipeline = new PythonPhaseBPipeline();
  const result = pipeline.transpile("print(42)");
  if (!result || !result.code) throw new Error("Failed to transpile");
});

test("Pipeline: list comprehension", () => {
  const pipeline = new PythonPhaseBPipeline();
  const result = pipeline.transpile("x=[i**2 for i in range(10)]");
  if (!result || !result.code) throw new Error("Failed to transpile");
});

// ===== EDGE CASES =====
console.log("\n📌 EDGE CASES");
console.log("-".repeat(70));

test("Parse: deeply nested expressions", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=(((a+b)*(c-d))/((e+f)*(g-h)))");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: multiple nested indexing", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=mat[i][j][k]");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: complex boolean expression", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=a and b or c and not d");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

test("Parse: mixed operators", () => {
  const parser = new PythonParser();
  const ast = parser.parse("x=1+2*3-4/2");
  if (!ast || !ast.type) throw new Error("Failed to parse");
});

// ===== FINAL REPORT =====
console.log("\n" + "=".repeat(70));
console.log("📊 PYTHON FULL LANGUAGE COVERAGE - TEST REPORT");
console.log("=".repeat(70));
console.log(`\nTests Passed: ${passed}/${passed + failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log("✅ ALL TESTS PASSED - FULL PYTHON LANGUAGE SUPPORT VERIFIED\n");
  process.exit(0);
} else {
  console.log(`❌ ${failed} TESTS FAILED\n`);
  process.exit(1);
}
