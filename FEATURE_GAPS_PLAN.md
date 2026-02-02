# Feature Gap Implementation Plan - Phase 4 Item #4

**Date**: January 31, 2026  
**Status**: PLANNING  
**Scope**: Array/Control-Flow/Function Expression Edge Cases  
**Per**: PROJECT_STATUS.md Item #4

## Gap Analysis

### 1. Array Access Edge Cases

**Current Limitation**: Array access syntax `arr[i]` is converted to `arr{i}` which requires manual adjustment.

**Root Cause**: 
- IR representation doesn't distinguish between array/object member access
- Lua uses `{}` for both arrays and tables; JS uses `[]` for arrays and `.` or `[]` for objects

**Gaps to Fix**:
- ❌ Computed array access: `arr[index]` should emit `arr[index]` (1-based in Lua, not 0-based)
- ❌ Array bounds checking: `arr[-1]` or `arr[arr.length]` (out of bounds handling)
- ❌ Sparse array support: `arr[10] = value` with undefined elements
- ❌ Array method preservation: `arr.push()`, `arr.pop()`, `arr.length`

**Implementation Tasks**:
1. Add `computed_member_access` flag to IR MemberExpression nodes
2. Track whether base is an array vs object at lowering time
3. Add 1-based index conversion for array access
4. Add runtime bounds checking in emitter
5. Add tests for all array access patterns

### 2. Control Flow Edge Cases

**Current Limitation**: Switch statements converted to if-elseif chains don't preserve fall-through behavior.

**Root Cause**:
- Switch cases don't map cleanly to if-elseif without explicit break handling
- Complex nested control flow (break in nested loops) not tracked

**Gaps to Fix**:
- ❌ Switch fall-through: `case 1: case 2:` should execute both
- ❌ Labeled statements: `label: while() { break label; }`
- ❌ Nested loop breaks: `break` vs `break n` levels
- ❌ Complex condition nesting: `if (a && (b || c))` scoping
- ❌ Try-catch-finally edge cases: Multiple catches, finally without catch

**Implementation Tasks**:
1. Add `fallthrough` metadata to SwitchCase IR nodes
2. Implement proper fall-through in switch emission
3. Add break tracking in loop context stack
4. Add labeled break support
5. Add tests for fall-through and labeled breaks

### 3. Function Expression Edge Cases

**Current Limitation**: Complex function bodies and nested functions may not transpile correctly.

**Root Cause**:
- Parameter destructuring in function expressions not supported
- IIFE (Immediately Invoked Function Expressions) not optimized
- Recursive function expressions create scope issues

**Gaps to Fix**:
- ❌ Function parameter destructuring: `(({x, y}) => x + y)`
- ❌ IIFE optimization: `(function() { ... })()` emit inline vs variable
- ❌ Named function expressions: `const f = function name() { ... }`
- ❌ Closure variable capture: Proper scope binding for nested functions
- ❌ Function hoisting edge cases: Forward references in declarations

**Implementation Tasks**:
1. Merge parameter destructuring into function lowering
2. Add IIFE detection and optimization
3. Add named function expression support
4. Add closure scope tracking
5. Add tests for all function expression patterns

## Implementation Roadmap

### Phase A: Array Access (2-3 hours)

**Step 1**: Update IR nodes and lowerer
- [ ] Add `arrayAccess` flag to MemberExpression in `nodes.js`
- [ ] Update lowerer to detect array vs object access
- [ ] Add 1-based index conversion in IR

**Step 2**: Update emitter
- [ ] Add array index bounds checking in `emitter.js`
- [ ] Emit proper Lua array access syntax
- [ ] Add runtime array length handling

**Step 3**: Add tests
- [ ] Create `tests/features/array-access.test.js`
- [ ] Add 15+ test cases
- [ ] Wire into npm run harness

### Phase B: Control Flow (3-4 hours)

**Step 1**: Update IR and lowerer
- [ ] Add `fallthrough` flag to SwitchCase nodes
- [ ] Track break context in lowerer
- [ ] Add labeled statement support

**Step 2**: Update emitter
- [ ] Implement fall-through logic in switch emission
- [ ] Add labeled break support
- [ ] Generate proper Lua control flow

**Step 3**: Add tests
- [ ] Create `tests/features/control-flow-edges.test.js`
- [ ] Add 15+ test cases for fall-through, labeled breaks
- [ ] Wire into npm run harness

### Phase C: Function Expressions (2-3 hours)

**Step 1**: Update lowerer
- [ ] Add parameter destructuring support
- [ ] Add named function expression handling
- [ ] Add IIFE detection

**Step 2**: Update emitter
- [ ] Emit destructured parameters correctly
- [ ] Optimize IIFE emission
- [ ] Handle named function expressions

**Step 3**: Add tests
- [ ] Create `tests/features/function-expression-edges.test.js`
- [ ] Add 15+ test cases
- [ ] Wire into npm run harness

## Testing Strategy

### Unit Tests
- Test each gap in isolation
- Verify IR representation is correct
- Verify Lua emission matches expected output

### Integration Tests
- Test combinations (array access + control flow)
- Test nested scenarios (function with array access in switch)
- Test parity (JS behavior matches Lua behavior)

### Regression Tests
- Ensure existing functionality still works
- Run full Phase 3 test suite
- Run determinism verification

## Success Criteria

- ✅ All feature gaps addressed in IR/lowerer/emitter
- ✅ 45+ new test cases created and passing
- ✅ Tests wired into `npm run harness`
- ✅ Parity tests passing for all edge cases
- ✅ No regressions in Phase 3 functionality
- ✅ Determinism verification passing

## Estimated Effort

- **Implementation**: 7-10 hours
- **Testing**: 3-5 hours
- **Documentation**: 1-2 hours
- **Total**: 11-17 hours (1-2 days)

## Deliverables

1. Enhanced `src/ir/lowerer.js` with gap implementations
2. Enhanced `src/ir/emitter.js` with gap implementations
3. Enhanced `src/ir/nodes.js` with new IR metadata
4. Test suite: `tests/features/array-access.test.js`
5. Test suite: `tests/features/control-flow-edges.test.js`
6. Test suite: `tests/features/function-expression-edges.test.js`
7. Updated `package.json` npm scripts for feature tests
8. `FEATURE_GAPS_IMPLEMENTATION.md` summary

## Next Steps After This Phase

1. ⏳ Harden CI: determinism + fuzz + parity + coverage gates
2. ⏳ Merge all changes to main
3. ⏳ Create PR for feature gap implementation
4. ⏳ Phase 5: Advanced features (destructuring, spread, etc.)

---

**Ready to begin**: Array Access implementation (Phase A, Step 1)  
**Current Status**: Planning complete, awaiting approval to proceed
