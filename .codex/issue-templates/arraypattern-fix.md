# Fix ArrayPattern Destructuring with RestElement in Parity Tests

**Priority**: HIGH  
**Labels**: codex-work, priority:high, bug  
**Estimated Time**: 30-60 minutes

## Issue

ArrayPattern destructuring is failing in parity tests.

**Current Status**: 5/6 parity tests passing, 1 failing  
**Failure**: `Destructuring: array with rest (Unsupported AST node type: ArrayPattern)`  
**Test Case**: `let [a, ...rest] = arr;`

## Root Cause

The lowerer has ArrayPattern support in `src/ir/lowerer.js` (lines 347-369), but it's not being invoked correctly during destructuring transpilation. The issue occurs when ArrayPattern contains RestElement nodes.

## Expected Behavior

1. **Parse**: `let [a, ...rest] = arr;`
2. **Lower**: ArrayPattern with Identifier('a') + RestElement(Identifier('rest'))
3. **Emit**: Valid Lua code that unpacks array into local variables

## Files to Modify

- `src/ir/lowerer.js` - Ensure ArrayPattern properly handles RestElement children
- `tests/parity/run_parity_tests.js` - Verify test passes after fix

## Implementation Steps

1. Check how `lowerArrayPattern()` handles `RestElement` nodes in the elements array
2. Verify `lowerRestElement()` is being called for rest parameters
3. Ensure the emitter generates correct Lua unpacking code
4. Run `npm run test:parity` to verify fix
5. Ensure all 6/6 tests pass

## Related Code

**src/ir/lowerer.js:365-369**:
```javascript
lowerArrayPattern(node) {
  const elements = (node.elements || []).map((el) => 
    el ? this.lowerExpression(el) : null
  );
  return this.builder.arrayPattern(elements);
}
```

**src/ir/lowerer.js:389-392**:
```javascript
lowerRestElement(node) {
  const argument = this.lowerExpression(node.argument);
  return this.builder.restElement(argument);
}
```

## Acceptance Criteria

- ✅ Parity tests: 6/6 passing (currently 5/6)
- ✅ `npm run test:parity` exits with code 0
- ✅ ArrayPattern + RestElement transpiles to valid Lua
- ✅ Test case `let [a, ...rest] = arr;` works correctly
- ✅ Harness tests still pass (no regressions)
- ✅ IR validation passes

## Test Command

```bash
npm run test:parity
```

Expected output:
```
Passed 6/6
```

## GitHub Issue Creation Command

```bash
gh issue create --title "Fix ArrayPattern destructuring with RestElement" --label "codex-work,priority:high,bug" --body-file .codex/issue-templates/arraypattern-fix.md
```
