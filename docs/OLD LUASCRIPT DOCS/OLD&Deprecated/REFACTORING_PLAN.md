# LUASCRIPT Refactoring Plan: Eliminate Regex, Consolidate on IR Pipeline

## Current State Analysis

### Duplicate Code Paths
1. **CoreTranspiler** (`src/core_transpiler.js`)
   - Lines 565-660: Regex transforms for arrows, destructuring, async/await, classes, modules
   - Line 170-195: Array pattern destructuring in generateLuaFromAST
   - Mixed AST walking + regex post-processing

2. **AdvancedFeatures** (`src/advanced_features.js`)
   - PatternMatcher class with regex-based transforms
   - Overlaps with CoreTranspiler functionality

3. **IR Pipeline** (CORRECT PATH)
   - `src/ir/lowerer.js`: AST → IR lowering
   - `src/ir/builder.js`: IR construction
   - `src/ir/emitter.js`: IR → Lua emission
   - Currently incomplete coverage

### Issues
- Regex transforms are brittle, fail on edge cases
- No semantic understanding (shadowing, scope, nesting)
- Duplicate logic between CoreTranspiler and IR
- Tests pass through old regex path, not IR

---

## Refactoring Strategy

### Phase 1: IR Node Extension ✅
**Extend IR nodes to cover missing features**

#### Add to `src/ir/nodes.js`:
```javascript
// Async/Await
ASYNC_FUNCTION: 'AsyncFunctionDeclaration',
AWAIT_EXPRESSION: 'AwaitExpression',

// Classes
CLASS_DECLARATION: 'ClassDeclaration',
CLASS_EXPRESSION: 'ClassExpression',
METHOD_DEFINITION: 'MethodDefinition',
CLASS_BODY: 'ClassBody',
SUPER: 'Super',
THIS_EXPRESSION: 'ThisExpression',

// Enhanced Control Flow
FOR_OF_STATEMENT: 'ForOfStatement',
FOR_IN_STATEMENT: 'ForInStatement',
TRY_STATEMENT: 'TryStatement',
CATCH_CLAUSE: 'CatchClause',
THROW_STATEMENT: 'ThrowStatement',

// Spread/Rest
SPREAD_ELEMENT: 'SpreadElement',

// Template Literals
TEMPLATE_LITERAL: 'TemplateLiteral',
TEMPLATE_ELEMENT: 'TemplateElement',
TAGGED_TEMPLATE: 'TaggedTemplateExpression',
```

### Phase 2: Lowerer Implementation ✅
**Implement semantic lowering for new nodes**

#### `src/ir/lowerer.js` additions:
- `lowerAsyncFunction()`: coroutine.create wrapper
- `lowerAwaitExpression()`: coroutine.yield
- `lowerClassDeclaration()`: metatable setup, prototype chain
- `lowerMethodDefinition()`: proper method binding
- `lowerForOfStatement()`: pairs/ipairs iteration
- `lowerTryStatement()`: pcall wrapper with catch/finally
- `lowerSpreadElement()`: table.unpack
- `lowerTemplateLiteral()`: string concatenation

### Phase 3: Emitter Enhancement ✅
**Update `src/ir/emitter.js` to handle new IR nodes**

- Emit coroutine patterns for async
- Emit metatable patterns for classes
- Emit proper iteration for for-of
- Emit pcall for try-catch

### Phase 4: Test Infrastructure ✅
**Build comprehensive test suite**

#### New test files:
```
tests/parity/async-await.test.js
tests/parity/classes.test.js
tests/parity/destructuring-advanced.test.js
tests/parity/control-flow.test.js
tests/parity/template-literals.test.js
tests/golden/async-fixtures.js
tests/golden/class-fixtures.js
tests/negative/edge-cases.test.js
```

#### Test categories:
1. **Parity tests**: JS input → expected Lua output
2. **Golden tests**: Known-good fixtures
3. **Negative tests**: Should fail gracefully (syntax errors, unsupported features)
4. **Edge cases**: Holes, computed keys, nested destructuring, shadowing

### Phase 5: Route CoreTranspiler Through IR ✅
**Make CoreTranspiler.transpile() use IR pipeline**

```javascript
// src/core_transpiler.js
transpile(jsCode, filename = 'main.js') {
    const ast = esprima.parseScript(jsCode);
    
    // NEW: Route through IR pipeline
    const { Lowerer } = require('./ir/lowerer');
    const { IRBuilder } = require('./ir/builder');
    const { Emitter } = require('./ir/emitter');
    
    const builder = new IRBuilder();
    const lowerer = new Lowerer(builder);
    const ir = lowerer.lower(ast);
    
    const emitter = new Emitter();
    const luaCode = emitter.emit(ir);
    
    return {
        code: luaCode,
        sourceMap: this.options.sourceMap ? this.generateSourceMap(...) : null,
        stats: { ... }
    };
}
```

### Phase 6: Delete Regex Transforms ✅
**Remove all regex-based transforms**

#### Delete from `src/core_transpiler.js`:
- Lines 565-571: Arrow function regex
- Lines 583-587: Destructuring regex
- Lines 600-603: Async/await regex
- Lines 615-621: Class regex
- Lines 633-639: Module regex
- Lines 651-660: Cleanup regex

#### Delete/archive:
- `src/advanced_features.js` (PatternMatcher class)
- Old test files that rely on regex behavior

### Phase 7: Static Validation ✅
**Add lint and type checking**

#### New files:
```
.eslintrc.json - ESLint config
src/validation/ast-validator.js - Validate JS AST before lowering
src/validation/ir-validator.js - Validate IR structure
scripts/lint.js - Run all checks
```

#### CI integration:
```json
// package.json
{
  "scripts": {
    "lint": "eslint src/ tests/",
    "validate:ast": "node scripts/validate-ast.js",
    "validate:ir": "node scripts/validate-ir.js",
    "pretest": "npm run lint && npm run validate:ast"
  }
}
```

### Phase 8: Property-Based Fuzzing ✅
**Generate random programs to catch regressions**

#### New file: `tests/fuzz/ast-generator.js`
```javascript
// Generate random valid JS ASTs
// - Binary expressions
// - Function declarations
// - Variable declarations
// - Control flow
// Run through IR pipeline, check for crashes
```

#### Integration:
```json
// package.json
{
  "scripts": {
    "fuzz": "node tests/fuzz/run-fuzzer.js --iterations 1000",
    "fuzz:ci": "node tests/fuzz/run-fuzzer.js --iterations 100 --seed fixed"
  }
}
```

---

## Success Criteria

### Must Have:
✅ All parity tests pass through IR pipeline (no regex)  
✅ 6/6 tests for destructuring (array/object, rest, nested)  
✅ Async/await with coroutine semantics  
✅ Classes with inheritance and statics  
✅ for-of with proper iteration  
✅ try-catch-finally with pcall  
✅ No regex transforms in CoreTranspiler  
✅ Single source of truth: IR pipeline  

### Should Have:
- 100+ parity test cases
- Golden fixtures for common patterns
- Negative tests for unsupported features
- Fuzzing finds no crashes in 1000 iterations
- ESLint clean, no warnings
- CI runs lint + validate + tests

### Nice to Have:
- Source maps through full pipeline
- Performance benchmarks (IR vs old regex)
- Migration guide for existing users
- Tracing/debugging for IR lowering

---

## Implementation Order

1. ✅ **Extend IR nodes** (nodes.js) - 30 min
2. ✅ **Implement lowerer methods** (lowerer.js) - 2 hours
3. ✅ **Update emitter** (emitter.js) - 1 hour
4. ✅ **Build test infrastructure** - 1 hour
5. ✅ **Write parity tests** (100+ cases) - 2 hours
6. ✅ **Route CoreTranspiler** (core_transpiler.js) - 30 min
7. ✅ **Delete regex transforms** - 15 min
8. ✅ **Add validation** (lint/AST/IR) - 1 hour
9. ✅ **Property-based fuzzing** - 1 hour
10. ✅ **CI integration** - 30 min

**Total Estimated Time**: ~10 hours
**Priority**: HIGH - Eliminates technical debt, improves reliability

---

## Rollout Plan

### Week 1: Foundation
- Days 1-2: Extend IR nodes + lowerer
- Days 3-4: Build test infrastructure
- Day 5: First 50 parity tests

### Week 2: Implementation
- Days 1-2: Route CoreTranspiler through IR
- Days 3-4: Remaining parity tests (100+ total)
- Day 5: Validation + fuzzing

### Week 3: Cleanup
- Days 1-2: Delete regex transforms
- Day 3: CI integration
- Days 4-5: Documentation + migration guide

---

## Risk Mitigation

### Risk: Breaking existing code
**Mitigation**: Feature flag to enable/disable IR pipeline
```javascript
const useIR = process.env.LUASCRIPT_USE_IR === '1' || options.useIR;
if (useIR) {
    // New IR path
} else {
    // Legacy regex path (deprecated)
}
```

### Risk: Performance regression
**Mitigation**: Benchmark suite comparing IR vs regex
```bash
npm run bench:transpile -- --compare
```

### Risk: Incomplete coverage
**Mitigation**: Comprehensive test suite + fuzzing catches gaps

---

## Metrics to Track

- **Test Coverage**: % of parity tests passing through IR
- **Code Deletion**: Lines of regex code removed
- **Performance**: Transpile time (IR vs regex)
- **Reliability**: Fuzzing crash rate
- **Maintenance**: # of duplicate code paths (target: 0)

---

## Next Steps

Run this plan past the user, then start with Phase 1: Extend IR nodes.
