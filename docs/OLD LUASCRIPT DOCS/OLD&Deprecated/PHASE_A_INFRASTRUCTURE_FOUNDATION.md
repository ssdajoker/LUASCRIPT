# PHASE A: Infrastructure Foundation
## Multi-Language Integration Bootstrap (Python + C-Family)

**Date:** 2026-02-01  
**Status:** IN PROGRESS  
**Duration Target:** ~3-4 weeks (infrastructure) + parallel Python Phase A (4-5 weeks)  
**Goal:** Establish standardized IR bridge layer supporting all 6 languages through shared canonical IR

---

## PHASE A OBJECTIVE

Establish the **Unified Transpilation Pipeline** for Python and C-family languages:

```
Phase A-E Requirement for EACH Language:
├── Phase A: Core Transpiler (Parser → AST → IR)
├── Phase B: IR Lowering & Canonicalization  
├── Phase C: Canonical IR Emission (IR → Target Code)
├── Phase D: Multi-Pass Optimization
├── Phase E: Deterministic Quality Gates
└── Result: Language-Specific Tier 1 or Tier 2 Support
```

### Key Principle
**Shared Infrastructure, Language-Specific Implementation:**
- ✅ Universal Type System Bridge (shared)
- ✅ Canonical IR Format (shared)
- ✅ Determinism Verification Framework (shared)
- ❌ Parser, Lowerer, Emitter (language-specific for each)

---

## INFRASTRUCTURE COMPONENTS (SHARED LAYER)

### 1. Unified Type System Bridge
**File:** `src/ir/type_system_bridge.js`  
**Purpose:** Map language-specific types → Canonical IR types  
**Scope:** C/C++/C#/ObjC/Python type equivalence

**Deliverables:**
- Type equivalence tables for all 6 languages
- Implicit conversion rules
- Annotation schema for protocol types, generics, optionals, unions
- Function signature normalization
- Struct/class layout calculations

**Test Coverage:**
- Type mapping accuracy tests
- Conversion correctness
- Round-trip type preservation

---

### 2. FFI & Calling Conventions Mapper
**File:** `src/ir/calling_conventions.js`  
**Purpose:** Handle language-specific calling conventions  
**Scope:** cdecl, stdcall, fastcall, C++ ABI, etc.

**Deliverables:**
- Calling convention definitions (cdecl, stdcall, fastcall, System V AMD64, ARM)
- Parameter passing rules per convention
- Return value conventions
- Struct/aggregate passing strategies
- Variadic function handling
- C++ name mangling for interop

**Test Coverage:**
- Convention-specific test cases
- Struct passing correctness
- Variadic function handling

---

### 3. Memory Model Abstraction
**File:** `src/ir/memory_model.js`  
**Purpose:** Abstract memory layout across languages  
**Scope:** Stack, heap, register allocation uniformity

**Deliverables:**
- Memory location types (stack, heap, register, global)
- Pointer/reference unification schema
- Lifetime analysis framework
- Escape analysis interface
- Alias tracking system
- Memory safety annotations

**Test Coverage:**
- Lifetime correctness
- Escape analysis accuracy
- Pointer chain resolution

---

### 4. Syntax Family Classifier
**File:** `src/language_traits.js`  
**Purpose:** Document language families and feature sets  
**Scope:** C-Family, Dynamic Script, Functional, Legacy, Markup

**Deliverables:**
- Language family definitions with feature matrices
- Per-family operator precedence tables
- Scoping and binding rules per family
- Reserved keyword lists
- Syntactic capability matrix

**Test Coverage:**
- Feature detection accuracy
- Operator precedence validation
- Keyword conflict detection

---

### 5. Universal Lowerer Enhancement
**File:** `src/ir/lowerer-universal.js`  
**Purpose:** Universal IR lowering for all families  
**Scope:** Macro expansion, template instantiation, overload resolution

**Deliverables:**
- Macro expansion engine
- Template instantiation system
- Operator overload resolution
- Type coercion insertion
- Control flow normalization

**Test Coverage:**
- Macro correctness
- Template instantiation accuracy
- Overload resolution correctness

---

### 6. Multi-Language Test Framework
**Files:** 
- `tests/harness/multi-language-roundtrip.js`
- `tests/determinism-verifier.js`

**Purpose:** Cross-language validation and determinism testing

**Deliverables:**
- Roundtrip test harness (source → IR → target → IR)
- Determinism verifier (10+ run hash consistency)
- Golden snapshot comparison
- Cross-language parity testing
- IR hash verification

**Test Coverage:**
- Roundtrip correctness for each language pair
- Determinism across runs
- Cross-language semantic equivalence

---

## PYTHON PHASE A IMPLEMENTATION

### Phase A: Core Transpiler (Parser → AST → IR)
**Target:** 500 lines of parser + 300 lines of tests

#### Parser Implementation
**File:** `src/parsers/python_parser.js`

**Components:**
1. **Lexer** - Python 3.11+ tokenization
   - Indent/dedent token tracking
   - String literal variants (f-strings, raw, bytes)
   - Operator tokenization
   - Comment handling

2. **AST Construction** - Canonical format
   - Module-level statements
   - Function and class definitions
   - Expression hierarchy
   - Decorator support
   - Type hint preservation

3. **Feature Coverage:**
   - Classes with inheritance
   - Decorators (@property, @staticmethod, @classmethod)
   - Context managers (with statements)
   - F-strings and string interpolation
   - Type hints and annotations
   - Async/await syntax
   - Exception handling
   - List/dict/set comprehensions
   - Lambda expressions
   - Generators and yield

#### IR Lowering
**File:** `src/ir/lowerer_python.js`

**Components:**
1. **Python-Specific Lowering Rules**
   - Decorator expansion to IR nodes
   - Generator/yield conversion to IR
   - Context manager to try/finally
   - F-string template expansion
   - Comprehension to loops

2. **Feature Handling:**
   - Class method binding
   - Decorator chaining
   - Generator coroutines
   - Exception propagation
   - Type hint extraction

#### Existing Emitter
**File:** `src/ir/emitter_python.js` (already exists: 753 lines)
- Already handles IR → Python code generation
- Reuses existing infrastructure
- No modifications needed for Phase A

#### Tests
**File:** `tests/python_roundtrip.test.js`

**Test Cases:**
- Basic function definitions
- Class definitions with inheritance
- Decorator usage (@property, custom)
- Exception handling (try/except/finally)
- Async/await functions
- F-strings and string formatting
- List/dict comprehensions
- Context managers
- Roundtrip consistency (parse → IR → emit → reparse)

---

## C-FAMILY PHASE A PREPARATION

### Scope (Not Implemented in This Phase)
While Phase A focuses on Python implementation, infrastructure supports future C-family integration:
- C parser (`src/parsers/c_parser.js`) - deferred
- C++ parser (`src/parsers/cpp_parser.js`) - deferred
- C# parser (`src/parsers/csharp_parser.js`) - deferred
- Objective-C parser (`src/parsers/objc_parser.js`) - deferred
- C-- parser (`src/parsers/cmm_parser.js`) - deferred

### Infrastructure Reuse
All 5 C-family parsers will reuse:
- ✅ Unified Type System Bridge
- ✅ FFI & Calling Conventions Mapper
- ✅ Memory Model Abstraction
- ✅ Syntax Family Classifier
- ✅ Universal Lowerer
- ✅ Multi-Language Test Framework

---

## IMPLEMENTATION SEQUENCE

### Week 1: Infrastructure Foundation
- [ ] Unified Type System Bridge
- [ ] Language Traits Classifier
- [ ] Type equivalence tests

### Week 2: Advanced Infrastructure
- [ ] FFI & Calling Conventions Mapper
- [ ] Memory Model Abstraction
- [ ] Multi-Language Test Framework

### Week 3: Lowerer Enhancement
- [ ] Universal Lowerer Enhancement
- [ ] Integration tests
- [ ] Documentation

### Weeks 4-5: Python Phase A
- [ ] Python Parser (src/parsers/python_parser.js)
- [ ] Python Lowerer (src/ir/lowerer_python.js)
- [ ] Roundtrip tests
- [ ] Feature coverage validation

---

## SUCCESS CRITERIA

### Infrastructure (Weeks 1-3)
- ✅ All 6 infrastructure files created with complete implementations
- ✅ >95% test pass rate on infrastructure components
- ✅ Type system bridge handles all language types
- ✅ Determinism verifier confirms 10+ runs with identical IR hashes

### Python Phase A (Weeks 4-5)
- ✅ Python parser handles Python 3.11+ syntax
- ✅ Roundtrip tests pass (parse → IR → emit → reparse)
- ✅ All feature categories covered (100% of test matrix)
- ✅ Zero stub detection flags in CI/CD pipeline

### Integration
- ✅ Python Phase A integrates with existing infrastructure
- ✅ C-family infrastructure ready for future parsers
- ✅ Determinism gates pass without false positives

---

## RISK MITIGATION

### Risk 1: Type System Complexity
**Mitigation:** Start with simple equivalence (C int → Python int), progressively add complex mappings

### Risk 2: Calling Convention Variance
**Mitigation:** Focus on cdecl (most common), defer platform-specific conventions

### Risk 3: Python Feature Density
**Mitigation:** Prioritize core features (classes, functions), defer advanced (metaclasses, descriptors)

### Risk 4: Determinism Edge Cases
**Mitigation:** Run all tests 10+ times, use cryptographic hashing for IR

---

## PHASE A OUTPUTS

### Code Artifacts
```
src/ir/
├── type_system_bridge.js         (450 lines)
├── calling_conventions.js         (300 lines)
├── memory_model.js               (350 lines)
└── lowerer-universal.js          (500 lines - enhancement)

src/language/
├── language_traits.js            (400 lines)

src/parsers/
└── python_parser.js              (500 lines)

src/ir/
├── lowerer_python.js             (400 lines)

tests/
├── harness/multi-language-roundtrip.js  (300 lines)
├── determinism-verifier.js              (200 lines)
└── python_roundtrip.test.js             (300 lines)
```

### Documentation
```
PHASE_A_INFRASTRUCTURE_FOUNDATION.md      (this file)
PHASE_A_PYTHON_IMPLEMENTATION.md          (Python-specific details)
INFRASTRUCTURE_DESIGN_DECISIONS.md        (Architecture justifications)
MULTI_LANGUAGE_DETERMINISM_GUIDE.md       (Testing approach)
```

### Test Results
- Infrastructure: 45+ test cases, 100% pass rate
- Python Phase A: 30+ test cases, 100% pass rate
- Determinism: 10+ roundtrip runs per test, identical IR hashes

---

## NEXT PHASE: PHASE B

**Phase B: IR Lowering & Canonicalization**
- Deep IR transformations
- Semantic preservation verification
- Intermediate optimization passes
- Target-specific canonicalization

---
