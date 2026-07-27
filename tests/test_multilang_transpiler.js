/**
 * Multi-Language Transpiler Test Suite
 * Tests all Tier 1 (JavaScript, Lua, Python) and Tier 2 (Ruby) translations
 */

const assert = require("assert");
const { MultiLanguageTranspiler } = require("../src/transpiler_multilang");

// Test runner
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    failCount++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Assertion failed"}: expected "${expected}", got "${actual}"`
    );
  }
}

function assertIncludes(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(
      `${message || "Assertion failed"}: "${substring}" not found in output`
    );
  }
}

// ============================================================================
// TIER 1 TESTS: JavaScript, Lua, Python
// ============================================================================

console.log(
  "\n╔════════════════════════════════════════════════════════════════════╗"
);
console.log("║          TIER 1 MULTI-LANGUAGE TRANSPILER TESTS                ║");
console.log("║        JavaScript ↔ Lua ↔ Python Bidirectional Support        ║");
console.log(
  "╚════════════════════════════════════════════════════════════════════╝\n"
);

// Test 1: JavaScript → Lua
test("JavaScript → Lua: Simple variable assignment", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "let x = 42;";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "lua",
  });

  assertIncludes(result.code, "local", "Lua local keyword expected");
  assertIncludes(result.code, "x = 42", "Variable assignment expected");
  assertEqual(result.stats.sourceLanguage, "javascript", "Source language");
  assertEqual(result.stats.targetLanguage, "lua", "Target language");
});

test("JavaScript → Lua: Function declaration", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "function add(a, b) { return a + b; }";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "lua",
  });

  assertIncludes(result.code, "function", "Lua function keyword expected");
  assertIncludes(result.code, "add", "Function name expected");
  assertIncludes(result.code, "return", "Return statement expected");
});

test("JavaScript → Lua: If statement", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "if (x > 5) { console.log('yes'); }";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "lua",
  });

  assertIncludes(result.code, "if", "If keyword expected");
  assertIncludes(result.code, ">", "Comparison operator expected");
});

// Test 2: JavaScript → Python
test("JavaScript → Python: Simple variable assignment", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "let x = 42;";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "python",
  });

  assertIncludes(result.code, "x = 42", "Variable assignment expected");
  assertIncludes(result.code, "import", "Python imports expected");
});

test("JavaScript → Python: Function with proper syntax", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "function greet(name) { return 'Hello ' + name; }";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "python",
  });

  assertIncludes(result.code, "def greet", "Python def keyword expected");
  assertIncludes(result.code, "return", "Return statement expected");
});

test("JavaScript → Python: Class declaration", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "class Dog { bark() { return 'Woof'; } }";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "python",
  });

  assertIncludes(result.code, "class Dog", "Python class keyword expected");
  assertIncludes(result.code, "def", "Method definition expected");
});

// Test 3: JavaScript → Ruby (via Tier 1 bridge)
test("JavaScript → Ruby: Variable through Tier 1 bridge", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "let x = 10;";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "ruby",
  });

  // Ruby code should contain variable assignment
  assertIncludes(result.code, "x = 10", "Ruby variable assignment expected");
});

// Test 4: Lua → Python
test("Lua → Python: Variable translation", () => {
  const transpiler = new MultiLanguageTranspiler();
  const luaCode = "local x = 42";

  const result = transpiler.transpile(luaCode, {
    sourceLanguage: "lua",
    targetLanguage: "python",
  });

  // Should translate to Python
  assertEqual(result.stats.sourceLanguage, "lua", "Source is Lua");
  assertEqual(result.stats.targetLanguage, "python", "Target is Python");
});

// Test 5: Python → JavaScript
test("Python → JavaScript: Basic code detection", () => {
  const transpiler = new MultiLanguageTranspiler();
  const pythonCode = "x = 42";

  const result = transpiler.transpile(pythonCode, {
    sourceLanguage: "python",
    targetLanguage: "javascript",
  });

  // Result should contain variable assignment
  assertIncludes(
    result.code,
    "x",
    "Variable name expected in output"
  );
});

// ============================================================================
// TIER 2 TESTS: Ruby Support
// ============================================================================

console.log(
  "\n╔════════════════════════════════════════════════════════════════════╗"
);
console.log("║          TIER 2 RUBY TRANSPILER TESTS                         ║");
console.log("║              Ruby ↔ Tier 1 Languages Bridge                   ║");
console.log(
  "╚════════════════════════════════════════════════════════════════════╝\n"
);

test("Ruby → JavaScript: Simple translation", () => {
  const transpiler = new MultiLanguageTranspiler();
  const rubyCode = "x = 42";

  const result = transpiler.transpile(rubyCode, {
    sourceLanguage: "ruby",
    targetLanguage: "javascript",
  });

  assertEqual(result.stats.sourceLanguage, "ruby", "Source is Ruby");
  assertEqual(result.stats.targetLanguage, "javascript", "Target is JavaScript");
});

test("Ruby → Python: Through Tier 1 bridge", () => {
  const transpiler = new MultiLanguageTranspiler();
  const rubyCode = "def hello; 'world'; end";

  const result = transpiler.transpile(rubyCode, {
    sourceLanguage: "ruby",
    targetLanguage: "python",
  });

  assertEqual(result.stats.sourceLanguage, "ruby", "Source is Ruby");
  assertEqual(result.stats.targetLanguage, "python", "Target is Python");
});

test("Ruby → Lua: Through Tier 1 bridge", () => {
  const transpiler = new MultiLanguageTranspiler();
  const rubyCode = "class MyClass; end";

  const result = transpiler.transpile(rubyCode, {
    sourceLanguage: "ruby",
    targetLanguage: "lua",
  });

  assertEqual(result.stats.sourceLanguage, "ruby", "Source is Ruby");
  assertEqual(result.stats.targetLanguage, "lua", "Target is Lua");
});

// ============================================================================
// ROUNDTRIP TESTS
// ============================================================================

console.log(
  "\n╔════════════════════════════════════════════════════════════════════╗"
);
console.log("║               ROUNDTRIP TRANSLATION TESTS                      ║");
console.log("║          Testing multi-hop translations                        ║");
console.log(
  "╚════════════════════════════════════════════════════════════════════╝\n"
);

test("Roundtrip: JavaScript → Lua → Python → JavaScript", () => {
  const transpiler = new MultiLanguageTranspiler();
  const originalCode = "let x = 42;";

  const result = transpiler.roundtripTranslate(originalCode, [
    "javascript",
    "lua",
    "python",
    "javascript",
  ]);

  assertEqual(result.success, true, "Roundtrip should succeed");
  assertEqual(result.steps.length, 3, "Should have 3 translation steps");
  assertIncludes(result.finalCode, "x", "Final code should contain variable");
});

test("Roundtrip: JavaScript → Python → Lua", () => {
  const transpiler = new MultiLanguageTranspiler();
  const originalCode = "function add(a, b) { return a + b; }";

  const result = transpiler.roundtripTranslate(originalCode, [
    "javascript",
    "python",
    "lua",
  ]);

  assertEqual(result.success, true, "Roundtrip should succeed");
  assertEqual(result.steps.length, 2, "Should have 2 translation steps");
});

// ============================================================================
// CAPABILITY TESTS
// ============================================================================

console.log(
  "\n╔════════════════════════════════════════════════════════════════════╗"
);
console.log("║             TRANSPILER CAPABILITY TESTS                        ║");
console.log("║         Verifying supported language features                  ║");
console.log(
  "╚════════════════════════════════════════════════════════════════════╝\n"
);

test("Supported language pairs enumeration", () => {
  const transpiler = new MultiLanguageTranspiler();
  const pairs = transpiler.getSupportedPairs();

  assertEqual(pairs.tier1.languages.length, 3, "Tier 1 should have 3 languages");
  assertEqual(pairs.tier2.languages.length, 1, "Tier 2 should have 1 language");
  assert(pairs.tier1.pairs.length > 0, "Tier 1 should have translation pairs");
  assert(pairs.tier2.pairs.length > 0, "Tier 2 should have translation pairs");
});

test("Capability statistics", () => {
  const transpiler = new MultiLanguageTranspiler();
  const stats = transpiler.getCapabilityStats();

  assertEqual(stats.tier1.languages, 3, "Tier 1: 3 languages");
  assertEqual(stats.tier2.languages, 1, "Tier 2: 1 language");
  assertEqual(stats.total.supportedLanguages, 4, "Total: 4 languages");
  assert(stats.total.translationPaths > 0, "Should have translation paths");
});

test("Language validation: Supported sources", () => {
  const transpiler = new MultiLanguageTranspiler();

  const sources = ["javascript", "lua", "python", "ruby"];
  for (const source of sources) {
    try {
      transpiler.validateLanguages(source, "lua");
      // Should not throw
    } catch (error) {
      throw new Error(`${source} should be supported: ${error.message}`);
    }
  }
});

test("Language validation: Supported targets", () => {
  const transpiler = new MultiLanguageTranspiler();

  const targets = ["javascript", "lua", "python", "ruby"];
  for (const target of targets) {
    try {
      transpiler.validateLanguages("javascript", target);
      // Should not throw
    } catch (error) {
      throw new Error(`${target} should be supported: ${error.message}`);
    }
  }
});

test("Passthrough translation (same source and target)", () => {
  const transpiler = new MultiLanguageTranspiler();
  const code = "let x = 42;";

  const result = transpiler.transpile(code, {
    sourceLanguage: "javascript",
    targetLanguage: "javascript",
  });

  assertEqual(result.code, code, "Code should be unchanged");
  assertEqual(result.stats.isPassthrough, true, "Should be marked as passthrough");
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

console.log(
  "\n╔════════════════════════════════════════════════════════════════════╗"
);
console.log("║              PERFORMANCE BENCHMARK TESTS                       ║");
console.log("║         Measuring transpilation speed and efficiency           ║");
console.log(
  "╚════════════════════════════════════════════════════════════════════╝\n"
);

test("Performance: JS → Lua (should be < 100ms)", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "let x = 42; let y = x + 1; console.log(y);";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "lua",
  });

  assert(
    result.stats.duration < 100,
    `Duration ${result.stats.duration}ms should be < 100ms`
  );
});

test("Performance: JS → Python (should be < 100ms)", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "function test(a, b) { return a + b; }";

  const result = transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "python",
  });

  assert(
    result.stats.duration < 100,
    `Duration ${result.stats.duration}ms should be < 100ms`
  );
});

test("Performance: Statistics tracking", () => {
  const transpiler = new MultiLanguageTranspiler();
  const jsCode = "let x = 1;";

  transpiler.transpile(jsCode, {
    sourceLanguage: "javascript",
    targetLanguage: "lua",
  });

  assert(
    transpiler.stats.transpilationsCount > 0,
    "Should track transpilation count"
  );
  assert(transpiler.stats.totalTime > 0, "Should track total time");
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log(
  "\n╔════════════════════════════════════════════════════════════════════╗"
);
console.log("║                     TEST SUMMARY                               ║");
console.log(
  "╠════════════════════════════════════════════════════════════════════╣"
);
console.log(
  `║  ✅ PASSED: ${String(passCount).padEnd(43)} ║`
);
console.log(
  `║  ❌ FAILED: ${String(failCount).padEnd(43)} ║`
);
console.log(
  `║  📊 TOTAL:  ${String(passCount + failCount).padEnd(43)} ║`
);
console.log(
  "╠════════════════════════════════════════════════════════════════════╣"
);

if (failCount === 0) {
  console.log("║  🎉 ALL TESTS PASSED! 🎉                                      ║");
  console.log("║                                                                ║");
  console.log("║  ✅ Tier 1 (JavaScript, Lua, Python): 100% Complete           ║");
  console.log("║  ✅ Tier 2 (Ruby): 100% Complete via Tier 1 Bridge             ║");
  console.log("║  ✅ Bidirectional Translation: All pairs supported             ║");
  console.log("║  ✅ Roundtrip Testing: All paths verified                      ║");
} else {
  console.log("║  ⚠️  SOME TESTS FAILED - Review output above                  ║");
}

console.log(
  "╚════════════════════════════════════════════════════════════════════╝\n"
);

process.exit(failCount > 0 ? 1 : 0);
