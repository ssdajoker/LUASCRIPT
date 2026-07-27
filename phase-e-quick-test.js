/**
 * Phase E Quick Verification - Generator Support Check
 */

const { CoreTranspiler } = require("./src/core_transpiler");

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║     PHASE E - GENERATOR SUPPORT QUICK VERIFICATION             ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

const transpiler = new CoreTranspiler({ optimize: false });

// Test 1: Basic generator
console.log("Test 1: Basic generator function");
try {
  const js = `function* counter() { yield 1; yield 2; yield 3; }`;
  const result = transpiler.transpile(js, "test.js");
  console.log("✅ PASS - Transpiled successfully");
  console.log("Output preview:", result.code.substring(0, 100) + "...\n");
} catch (err) {
  console.log("❌ FAIL:", err.message, "\n");
}

// Test 2: Generator with parameters
console.log("Test 2: Generator with parameters");
try {
  const js = `function* range(start, end) { for (let i = start; i < end; i++) { yield i; } }`;
  const result = transpiler.transpile(js, "test.js");
  console.log("✅ PASS - Transpiled successfully");
  console.log("Output preview:", result.code.substring(0, 100) + "...\n");
} catch (err) {
  console.log("❌ FAIL:", err.message, "\n");
}

// Test 3: Generator expression
console.log("Test 3: Generator expression");
try {
  const js = `const gen = function*() { yield 1; yield 2; };`;
  const result = transpiler.transpile(js, "test.js");
  console.log("✅ PASS - Transpiled successfully");
  console.log("Output preview:", result.code.substring(0, 100) + "...\n");
} catch (err) {
  console.log("❌ FAIL:", err.message, "\n");
}

// Test 4: yield* delegation
console.log("Test 4: yield* delegation");
try {
  const js = `function* outer() { yield* inner(); yield 5; }`;
  const result = transpiler.transpile(js, "test.js");
  console.log("✅ PASS - Transpiled successfully");
  console.log("Output preview:", result.code.substring(0, 100) + "...\n");
} catch (err) {
  console.log("❌ FAIL:", err.message, "\n");
}

// Test 5: Template literal (should fail currently)
console.log("Test 5: Template literal");
try {
  const js = "const greeting = `Hello ${name}!`;";
  const result = transpiler.transpile(js, "test.js");
  console.log("✅ PASS - Transpiled successfully");
  console.log("Output preview:", result.code.substring(0, 100) + "...\n");
} catch (err) {
  console.log("❌ FAIL (expected):", err.message, "\n");
}

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║                     VERIFICATION COMPLETE                      ║");
console.log("╚════════════════════════════════════════════════════════════════╝");
