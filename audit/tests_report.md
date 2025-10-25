# Tests Report

## Test Directories

- test
- tests

## Captured Output

```

📝 Testing Basic Transpilation...
  ✅ Variable Declaration (42ms)
  ✅ Function Declaration (2ms)
  ✅ Arrow Function (1ms)

🔧 Testing Runtime Execution...
  ✅ Basic Execution (9ms)
  ✅ Function Execution (4ms)
Core tests complete

===== PERFECT PARSER PHASE 1 TESTS =====
📝 Using legacy string-rewrite transpilation
Phase1 Step1 OK
Phase1 Step2 OK
Phase1 Step3 OK
Phase1 Step4 OK
ALL PERFECT PARSER PHASE 1 TESTS PASSED

===== PERFECT PARSER PHASE 1 NEGATIVE TESTS =====
ALL PHASE 1 NEGATIVE TESTS PASSED
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
GC: Freed 24 bytes (reason=threshold, aggressive=false), heap size now 56 bytes, next threshold 65.1%
GC: Freed 33 bytes (reason=hard-limit-precheck, aggressive=true), heap size now 33 bytes, next threshold 68.4%
✅ RuntimeMemoryManager enforces heap limit
GC: Freed 240 bytes (reason=threshold, aggressive=false), heap size now 560 bytes, next threshold 65.1%
GC: Freed 228 bytes (reason=threshold, aggressive=false), heap size now 532 bytes, next threshold 68.4%
✅ RuntimeMemoryManager triggers garbage collection
GC: Freed 186 bytes (reason=threshold, aggressive=false), heap size now 434 bytes, next threshold 63.0%
GC: Freed 18 bytes (reason=low-yield, aggressive=false), heap size now 42 bytes, next threshold 60.0%
✅ RuntimeMemoryManager adaptive GC lowers threshold after low-yield sweep
GC: Freed 0 bytes (reason=cleanup, aggressive=true), heap size now 0 bytes, next threshold 62.0%
✅ RuntimeMemoryManager cleanup works
✅ RuntimeMemoryManager provides accurate stats
✅ Parser with memory limits handles complex code
GC: Freed 0 bytes (reason=cleanup, aggressive=true), heap size now 0 bytes, next threshold 62.0%
✅ Runtime with memory limits prevents infinite recursion
GC: Freed 0 bytes (reason=cleanup, aggressive=true), heap size now 0 bytes, next threshold 62.0%
✅ Interpreter maintains lexical scope resolution under deep shadowing
GC: Freed 0 bytes (reason=cleanup, aggressive=true), heap size now 0 bytes, next threshold 62.0%
✅ Interpreter resolves parent scope writes without leaking shadowed bindings
GC: Freed 0 bytes (reason=cleanup, aggressive=true), heap size now 0 bytes, next threshold 62.0%
✅ Memory stats are accessible during execution
✅ String concatenation allocations are tracked and released
✅ Runtime crashers execute without fatal errors
✅ LuaInterpreter enforces recursion depth limit

Test Results: 24 passed, 0 failed

```