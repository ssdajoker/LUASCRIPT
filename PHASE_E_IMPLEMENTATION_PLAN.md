# 🚀 PHASE E: GENERATORS & TEMPLATE LITERALS

**Start Date:** February 1, 2026  
**Target:** Production-ready generators and template literals  
**Est. Time:** 4-6 hours total  
**Priority:** HIGH - Closes critical feature gaps from Phase D verification

---

## Executive Summary

Phase E addresses the two highest-impact missing features identified in Phase C & D verification:
1. **Generator Functions** (`function*`, `yield`) - 8 edge case tests failing
2. **Template Literals** (`` `Hello ${name}` ``) - 1 edge case test failing

**Why This Matters:**
- Generators enable powerful iterator patterns
- Template literals are ubiquitous in modern JavaScript
- Both have existing partial implementations ready to integrate
- Together they represent ~23% of failing edge cases (9/39)

---

## Phase E Scope

### Feature 1: Generator Functions ✅ (Partially Implemented)

**Status:** 80% complete in enhanced lowerer/emitter  
**What Works:** Basic generators in IR transpiler path  
**What's Needed:** Integration into core transpiler

**Capabilities to Enable:**
```javascript
// Basic generators
function* counter() {
    yield 1;
    yield 2;
    yield 3;
}

// Generator with parameters
function* range(start, end) {
    for (let i = start; i < end; i++) {
        yield i;
    }
}

// Generator delegation
function* outer() {
    yield* inner();
    yield 5;
}

// Async generators
async function* asyncGen() {
    yield await fetch(1);
    yield await fetch(2);
}
```

### Feature 2: Template Literals

**Status:** Not implemented in IR lowerer  
**What's Needed:** Full implementation

**Capabilities to Enable:**
```javascript
// Basic template literals
const greeting = `Hello ${name}!`;

// Multi-line strings
const html = `
    <div>
        <h1>${title}</h1>
        <p>${content}</p>
    </div>
`;

// Expression interpolation
const result = `2 + 2 = ${2 + 2}`;

// Nested templates
const nested = `Outer ${`Inner ${value}`}`;

// Tagged templates (advanced)
const styled = css`
    color: ${primaryColor};
    font-size: ${fontSize}px;
`;
```

---

## Implementation Strategy

### Phase E.1: Generator Integration (2-3 hours)

**Existing Assets:**
- ✅ `src/ir/nodes.js` - GeneratorDeclaration, YieldExpression classes exist
- ✅ `src/ir/lowerer-enhanced.js` - Generator lowering implemented
- ✅ `src/ir/emitter-enhanced.js` - Lua coroutine emission implemented
- ✅ `src/runtime/generator-helpers.js` - Runtime support exists
- ✅ `tests/future/generators-yield.test.js` - Comprehensive test suite ready

**Integration Tasks:**
1. Wire generator support into `src/phase1_core_parser.js`
   - Recognize `function*` syntax
   - Parse `yield` and `yield*` expressions
   - Create proper AST nodes

2. Connect parser output to lowerer
   - Route `function*` to GeneratorDeclaration lowering
   - Handle yield expressions in expression lowering

3. Enable in core transpiler
   - Update `src/core_transpiler.js` to use generator lowering path
   - Ensure proper emit path selection

4. Activate test suite
   - Remove `.skip` from `tests/future/generators-yield.test.js`
   - Run and verify all 25+ tests pass

### Phase E.2: Template Literal Implementation (1-2 hours)

**Implementation Tasks:**
1. Add TemplateLiteral support to parser
   - Already partially working (template-literals.test.js exists)
   - May just need wiring

2. Implement in IR lowerer (`src/ir/lowerer.js`)
   - Add `case "TemplateLiteral"` to lowerExpression
   - Create lowerTemplateLiteral method
   - Handle quasi (static parts) and expressions

3. Implement in IR emitter (`src/ir/emitter.js`)
   - Add TemplateLiteral emission
   - Convert to Lua string concatenation
   - Handle multi-line strings

4. Test coverage
   - Use existing `tests/parity/template-literals.test.js`
   - Add edge cases for nested templates

### Phase E.3: Verification & Documentation (1 hour)

1. Run full edge case verification suite
2. Verify improvement from 8/39 → 17/39 (target)
3. Update Phase E completion report
4. Document usage examples

---

## Technical Architecture

### Generator Implementation Flow

```
JavaScript: function* gen() { yield 1; }
           ↓ (Parser)
AST: FunctionDeclaration { generator: true, ... }
           ↓ (Lowerer)
IR: GeneratorDeclaration { id, params, body }
           ↓ (Emitter)
Lua: function with coroutine.create/yield
```

### Template Literal Flow

```
JavaScript: `Hello ${name}!`
           ↓ (Parser)
AST: TemplateLiteral { quasis: [...], expressions: [...] }
           ↓ (Lowerer)
IR: StringConcatenation or TemplateLiteral IR node
           ↓ (Emitter)
Lua: "Hello " .. name .. "!"
```

---

## Success Criteria

### Phase E.1: Generators ✅
- [ ] Parser recognizes `function*` and `yield` keywords
- [ ] All generator lowering/emission working
- [ ] 8/8 generator edge case tests passing
- [ ] Basic generator demo working
- [ ] Async generator support (at least basic)

### Phase E.2: Template Literals ✅
- [ ] Parser handles template literal syntax
- [ ] Simple interpolation working: `` `${x}` ``
- [ ] Multi-line templates working
- [ ] Nested expressions working
- [ ] 1/1 template literal edge case test passing

### Phase E Overall ✅
- [ ] Edge case pass rate improves from 20.5% to >40%
- [ ] No regressions in existing 72/72 core tests
- [ ] Documentation complete
- [ ] Production-ready

---

## Risk Assessment

### Low Risk ✅
- Generators already 80% implemented
- Template literals straightforward (string concat)
- Existing test suites ready
- No breaking changes to existing features

### Mitigation
- Test existing 72 core tests after each change
- Use feature flags if needed
- Incremental integration with verification at each step

---

## Files to Modify

### Priority 1: Generator Integration
1. `src/phase1_core_parser.js` - Add generator parsing
2. `src/core_transpiler.js` - Wire to generator lowering
3. `src/ir/lowerer.js` - Ensure generator case exists
4. `tests/future/generators-yield.test.js` - Activate tests

### Priority 2: Template Literals
1. `src/ir/lowerer.js` - Add lowerTemplateLiteral
2. `src/ir/emitter.js` - Add emitTemplateLiteral
3. `tests/parity/template-literals.test.js` - Verify/enhance tests

### Documentation
1. `PHASE_E_IMPLEMENTATION_PLAN.md` (this file)
2. `PHASE_E_COMPLETION_REPORT.md` (to create)
3. Update `PROJECT_INDEX.md` with Phase E status

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| E.1.1: Parse generator syntax | 30 min | 🔄 Ready |
| E.1.2: Wire to lowerer/emitter | 30 min | 🔄 Ready |
| E.1.3: Integration testing | 1 hour | 🔄 Ready |
| E.1.4: Activate test suite | 30 min | 🔄 Ready |
| **E.1 Subtotal** | **2.5 hrs** | |
| E.2.1: Template literal lowering | 45 min | 🔄 Ready |
| E.2.2: Template literal emission | 30 min | 🔄 Ready |
| E.2.3: Test & verify | 30 min | 🔄 Ready |
| **E.2 Subtotal** | **1.75 hrs** | |
| E.3: Verification & docs | 1 hour | 🔄 Ready |
| **PHASE E TOTAL** | **5.25 hrs** | |

---

## Expected Impact

### Before Phase E
- Core tests: 72/72 (100%)
- Edge cases: 8/39 (20.5%)
- Generators: Not working
- Template literals: Not working

### After Phase E
- Core tests: 72/72 (100%) - maintained
- Edge cases: 17/39 (43.6%) - improved
- Generators: ✅ Working
- Template literals: ✅ Working

**Net Improvement:** +9 edge cases, +23.1% pass rate

---

## Next Steps

1. **Start E.1.1:** Add generator parsing to phase1_core_parser.js
2. **Verify:** Test generator parsing with simple example
3. **Continue E.1.2:** Wire to existing lowerer/emitter
4. **Test:** Run generator edge case tests
5. **Move to E.2:** Template literal implementation
6. **Final:** Comprehensive verification and documentation

---

**Status:** 📋 **PLAN COMPLETE - READY TO IMPLEMENT**  
**Next Action:** Begin Phase E.1.1 - Generator Parser Integration

