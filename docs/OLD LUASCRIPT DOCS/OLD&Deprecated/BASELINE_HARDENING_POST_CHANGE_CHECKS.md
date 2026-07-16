# Baseline Hardening Post-Change Checks

Generated: 2026-04-29

## npm test

- Status: 0

### stdout tail

```text
ion (4ms)
  ✅ Function Execution (3ms)
  ✅ Unicode Function Call with Nested Arguments (4ms)
Core tests complete

> luascript@1.0.0 test:phase1
> node test/test_perfect_parser_phase1.js && node test/test_perfect_parser_phase1_negative.js

🚀 PERFECT PARSER INITIATIVE - Phase 1 Test Suite
============================================================

📝 Test 1: String Concatenation Fix
----------------------------------------
  ✅ PASS StringConcat_Numeric Addition Preservation: ✅ Found: 5 + 3; ✅ Found: num1 + num2; ✅ Avoided: 5 .. 3; ✅ Avoided: num1 .. num2
  ✅ PASS StringConcat_String Concatenation Conversion: ✅ Found: "Hello" .. " World"; ✅ Found: "Value: " .. value; ✅ Avoided: "Hello" + " World"; ✅ Avoided: "Value: " + value
  ✅ PASS StringConcat_Mixed Operations: ✅ Found: 5 + 3; ✅ Found: "Result: " .. sum; ✅ Avoided: 5 .. 3; ✅ Avoided: "Result: " + sum
  ✅ PASS StringConcat_Chained String Concatenation: ✅ Found: name .. " is " .. age .. " years old"; ✅ Avoided: name + " is "

🔍 Test 2: Runtime Validation
----------------------------------------
  ✅ PASS Validation_Empty Input: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_Non-string Input: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_Invalid Options: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_Unmatched Parentheses: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_Unmatched Braces: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_Unterminated String: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_Eval Usage: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_With Statement: Correctly caught: LUASCRIPT_VALIDATION_ERROR
  ✅ PASS Validation_Valid Code: Valid input processed correctly

⚙️ Test 3: Parser Strategy Alignment
----------------------------------------
  ✅ PASS ParserStrategy_Consistency: Parser strategy validation skipped as irrelevant for current parser.
  ✅ PASS ParserStrategy_ErrorTracking: Error tracking validation skipped as irrelevant for current parser.

🧠 Test 4: Enhanced Memory Management
----------------------------------------
  ✅ PASS Memory_EnhancedStats: Enhanced memory statistics working
  ✅ PASS Memory_LimitEnforcement: Memory limits properly enforced
  ✅ PASS Memory_Cleanup: Memory cleanup working

🚨 Test 5: Error Handling Improvements
----------------------------------------
  ✅ PASS ErrorHandling_ParserRecovery: Parser error handling improved
  ✅ PASS ErrorHandling_ValidationErrors: Validation error handling working

✨ Test Async Function Parsing
----------------------------------------
  ✅ PASS AsyncFunction_Parsing: Async function parsed correctly.

📊 PERFECT PARSER INITIATIVE - Phase 1 Test Report
============================================================
Total Tests: 21
Passed: 21
Failed: 0
Success Rate: 100.0%

🎯 Phase 1 Deliverables Status:
  ✅ COMPLETE String Concatenation Fix
  ✅ COMPLETE Runtime Validation
  ✅ COMPLETE Parser Strategy Alignment
  ✅ COMPLETE Enhanced Memory Management
  ✅ COMPLETE Error Handling Improvements

============================================================
🎉 PERFECT PARSER INITIATIVE - Phase 1 COMPLETE!
✅ All critical fixes implemented and tested successfully.

===== PERFECT PARSER PHASE 1 NEGATIVE TESTS (Limited) =====
✅ Valid code parsing test passed
✅ ALL AVAILABLE PHASE 1 NEGATIVE TESTS PASSED

> luascript@1.0.0 test:runtime
> node tests/test_memory_management.js

Running Memory Management Test Suite...

✅ MemoryManager initializes with correct defaults
✅ MemoryManager allocates nodes correctly
✅ MemoryManager enforces node limit
✅ MemoryManager tracks scope depth
✅ MemoryManager enforces depth limit
✅ MemoryManager cleanup works
✅ MemoryManager provides accurate stats
✅ RuntimeMemoryManager initializes correctly
✅ RuntimeMemoryManager tracks function calls
✅ RuntimeMemoryManager enforces call stack limit
✅ RuntimeMemoryManager tracks heap allocation
[INFO][runtime.memory] GC freed 24 bytes (reason=threshold, aggressive=false) { heapSize: 56, nextThresholdPct: 65.1 }
[INFO][runtime.memory] GC freed 33 bytes (reason=hard-limit-precheck, aggressive=true) { heapSize: 33, nextThresholdPct: 68.4 }
✅ RuntimeMemoryManager enforces heap limit
[INFO][runtime.memory] GC freed 240 bytes (reason=threshold, aggressive=false) { heapSize: 560, nextThresholdPct: 65.1 }
[INFO][runtime.memory] GC freed 228 bytes (reason=threshold, aggressive=false) { heapSize: 532, nextThresholdPct: 68.4 }
✅ RuntimeMemoryManager triggers garbage collection
[INFO][runtime.memory] GC freed 186 bytes (reason=threshold, aggressive=false) { heapSize: 434, nextThresholdPct: 63 }
[INFO][runtime.memory] GC freed 18 bytes (reason=low-yield, aggressive=false) { heapSize: 42, nextThresholdPct: 60 }
✅ RuntimeMemoryManager adaptive GC lowers threshold after low-yield sweep
[INFO][runtime.memory] GC freed 0 bytes (reason=cleanup, aggressive=true) { heapSize: 0, nextThresholdPct: 62 }
✅ RuntimeMemoryManager cleanup works
✅ RuntimeMemoryManager provides accurate stats
✅ Parser with memory limits handles complex code
[INFO][runtime.memory] GC freed 0 bytes (reason=cleanup, aggressive=true) { heapSize: 0, nextThresholdPct: 62 }
✅ Runtime with memory limits prevents infinite recursion
[INFO][runtime.memory] GC freed 0 bytes (reason=cleanup, aggressive=true) { heapSize: 0, nextThresholdPct: 62 }
✅ Interpreter maintains lexical scope resolution under deep shadowing
[INFO][runtime.memory] GC freed 0 bytes (reason=cleanup, aggressive=true) { heapSize: 0, nextThresholdPct: 62 }
✅ Interpreter resolves parent scope writes without leaking shadowed bindings
[INFO][runtime.memory] GC freed 0 bytes (reason=cleanup, aggressive=true) { heapSize: 0, nextThresholdPct: 62 }
✅ Memory stats are accessible during execution
✅ String concatenation allocations are tracked and released
✅ Runtime crashers execute without fatal errors
✅ LuaInterpreter enforces recursion depth limit

Test Results: 24 passed, 0 failed
```

### stderr tail

```text
(empty)
```

## npm run status:check

- Status: 0

### stdout tail

```text
> luascript@1.0.0 status:check
> node scripts/status-consistency-check.js

🔍 Status Consistency Checker
Source of Truth: PROJECT_STATUS.md


📋 Status Consistency Check Results
────────────────────────────────────────────────────────────────────────────────
✅ PROJECT_STATUS.md exists and is valid
✅ All required links present
✅ No deprecated docs found (or all have pointers)
✅ No obvious consistency issues detected
────────────────────────────────────────────────────────────────────────────────

Errors: 0 | Warnings: 0

💡 Recommendations:
  • Documentation is consistent ✅
────────────────────────────────────────────────────────────────────────────────

✅ Status consistency check PASSED
```

### stderr tail

```text
(empty)
```

## npm run verify

- Status: 0

### stdout tail

```text
le expression
✅ Template Literal Parity Tests › should transpile template literal with multiple expressions
✅ Template Literal Parity Tests › should handle template literal with newlines
✅ Template Literal Parity Tests › should handle template literal with escaped chars
✅ Template Literal Parity Tests › should transpile nested template literals
✅ Template Literal Parity Tests › should handle template literal in function call
✅ Template Literal Parity Tests › should handle template literal with object access
✅ Template Literal Parity Tests › should handle template literal with function calls
✅ Template Literal Parity Tests › should handle template literal with complex expressions
✅ Template Literal Parity Tests › should handle template tag functions gracefully
✅ Spread/Rest Operator Parity Tests › should transpile spread in array literal
✅ Spread/Rest Operator Parity Tests › should transpile spread in function call
✅ Spread/Rest Operator Parity Tests › should transpile rest parameter in function
✅ Spread/Rest Operator Parity Tests › should transpile rest in destructuring
✅ Spread/Rest Operator Parity Tests › should transpile multiple spreads in array
✅ Spread/Rest Operator Parity Tests › should handle spread in object literal
✅ Spread/Rest Operator Parity Tests › should handle rest in object destructuring
✅ Spread/Rest Operator Parity Tests › should transpile spread with array methods
✅ Spread/Rest Operator Parity Tests › should handle arrow function with rest params
✅ Spread/Rest Operator Parity Tests › should transpile spread in method call
✅ Spread/Rest Operator Parity Tests › should handle spread with computed properties
✅ Spread/Rest Operator Parity Tests › should transpile spread in super call
✅ Spread/Rest Operator Parity Tests › should handle multiple rest params (invalid, should error or ignore)

Completed 73 tests; passed 73/73

▶️  Core verification suite
harness tests passed
harness tests passed
IR validation successful. CFG count: 1
Schema validation passed.

🎯 Parity Tests: Closures, Patterns, Metamethods

  ✅ Closures: function returns arrow function
  ✅ Pattern Matching: switch -> if/elseif chain
  ✅ Metamethods/OOP: class extends translates to setmetatable + __index
  ✅ Closures: nested captures propagate
  ✅ Destructuring: array with rest
  ✅ Pattern Matching: multiple cases produce multiple conditions

—— Summary ——
Passed 6/6
Determinism test: PASS

═══════════════════════════════════════════════════
🧪 LUASCRIPT DESTRUCTURING PATTERN TESTS
═══════════════════════════════════════════════════

📋 Array Destructuring Tests
─────────────────────────────

  ✅ Simple array destructuring
  ✅ Array destructuring with three elements
  ✅ Array destructuring with fewer elements
  ✅ Array with default value
  ✅ Array with multiple defaults
  ✅ Array destructuring with hole

📚 Rest Pattern Tests
─────────────────────────────

  ✅ Array with rest at end
  ✅ Array with rest in middle position

🎁 Object Destructuring Tests
─────────────────────────────

  ✅ Simple object destructuring
  ✅ Object destructuring with three properties
  ✅ Object with renamed variables
  ✅ Object with default values
  ✅ Object with mixed renamed and default

🎯 Nested Pattern Tests
─────────────────────────────

  ✅ Nested array in array
  ✅ Nested object in array
  ✅ Nested array in object
  ✅ Nested object in object
  ✅ Deep nesting: object > array > object

🔀 Mixed Pattern Tests
─────────────────────────────

  ✅ Array with object element
  ✅ Object with array property

✍️  Assignment Pattern Tests
─────────────────────────────

  ✅ Destructuring in for loop

⚠️  Edge Case Tests
─────────────────────────────

  ✅ Empty array destructuring
  ✅ Empty object destructuring
  ✅ Single element destructuring
  ✅ Destructuring with undefined variable names

═══════════════════════════════════════════════════
📊 Test Results: 25 passed, 0 failed
   Success Rate: 100.0%
═══════════════════════════════════════════════════


═══════════════════════════════════════════════════
🧪 DESTRUCTURING EDGE CASES & ARRAY METHODS
═══════════════════════════════════════════════════

🔀 Spread Patterns in Literals (Phase 4 Feature)
─────────────────────────────

  ℹ️  Spread patterns deferred to Phase 4 (parser enhancement required)
  ℹ️  Will enable: array spreads, object spreads, multiple spreads

📚 Array Methods with Destructuring (Phase 4 Feature)
─────────────────────────────

  ℹ️  Arrow function parameter destructuring deferred to Phase 4
  ℹ️  Will enable: destructuring in arrow parameters, callbacks, event handlers

🎯 Control Flow Edge Cases (Phase 4 Enhancement)
─────────────────────────────

  ℹ️  Control flow destructuring deferred to Phase 4
  ℹ️  Will enable: conditional destructuring, loop patterns, error handling

🔧 Function Parameter Destructuring (Phase 4 Feature)
─────────────────────────────

  ℹ️  Function parameter destructuring deferred to Phase 4
  ℹ️  Will enable: parameter patterns, default values, object/array params

🌳 Complex Nesting Patterns (Phase 3 Working)
─────────────────────────────

  ✅ Triple-nested destructuring
  ✅ Mixed nesting: array of objects of arrays
  ✅ Deeply nested with defaults

🔄 Rest Pattern Edge Cases (Phase 3 Working)
─────────────────────────────

  ✅ Rest with preceding items
  ✅ Rest with holes
  ✅ Multiple rest patterns in variables

🚀 Real-World Usage Patterns (Phase 3 Working)
─────────────────────────────

  ✅ Configuration object destructuring
  ✅ Event data destructuring
  ✅ Response data destructuring
  ✅ Array of objects destructuring
  ✅ Mixed value and nested destructuring

═══════════════════════════════════════════════════
📊 Test Results: 11 passed, 0 failed
   Success Rate: 100.0%
═══════════════════════════════════════════════════

Testing unsupported IR diagnostics...
✅ Unsupported IR diagnostics tests passed

ℹ️  Enhanced verification skipped (set VERIFY_ENHANCED=1 or LUASCRIPT_USE_ENHANCED_IR=1 to enable)

✅ All requested verify suites passed
```

### stderr tail

```text
(node:34552) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
```

## npm run test:actual-programs

- Status: 0

### stdout tail

```text
> luascript@1.0.0 test:actual-programs
> node tests/actual_programs.test.js

Running LUASCRIPT actual-program tests...
-> arithmetic_bindings: compiling
-> arithmetic_bindings: executing
-> functions_conditionals: compiling
-> functions_conditionals: executing
-> loops_for_of: compiling
-> loops_for_of: executing
-> array_runtime_methods: compiling
-> array_runtime_methods: executing
-> class_smoke: compiling
-> class_smoke: executing
-> supported_math_showcase: compiling
-> supported_math_showcase: executing
All LUASCRIPT actual-program tests passed.
```

### stderr tail

```text
(empty)
```

## set PYTHONIOENCODING=utf-8&& node tests/examples_integration.test.js

- Status: 0

### stdout tail

```text
Running LUASCRIPT example integration tests...
→ hello: compiling
→ hello: executing
→ simple: compiling
→ simple: executing
→ simple_class: compiling
→ simple_class: executing
→ vector: compiling
→ vector: executing
→ supported_math_showcase: compiling
→ supported_math_showcase: executing
All example integration tests passed.
```

### stderr tail

```text
(empty)
```

## Reference scan

- Stale baseline references to `examples/mathematical_showcase.ls`: 0
