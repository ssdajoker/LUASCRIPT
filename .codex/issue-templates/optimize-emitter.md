# Optimize IR Emitter for Better Lua Code Generation

**Priority**: LOW  
**Labels**: codex-work, priority:low, optimization  
**Estimated Time**: 1-2 hours

## Issue

The IR emitter in `src/ir/emitter.js` generates functional Lua code but could be optimized for:
- Fewer local variable declarations
- Better whitespace formatting
- Reduced parentheses in simple expressions
- More idiomatic Lua patterns

## Current Behavior

**Example Input**:
```javascript
function add(a, b) {
  return a + b;
}
```

**Current Output** (approximate):
```lua
local function add(a, b)
  local _temp1 = a
  local _temp2 = b
  return (_temp1 + _temp2)
end
```

**Desired Output**:
```lua
local function add(a, b)
  return a + b
end
```

## Optimization Opportunities

1. **Eliminate Unnecessary Temporaries**
   - Don't create temp variables for simple identifiers
   - Only use temps for complex expressions

2. **Simplify Binary Expressions**
   - Remove extra parentheses: `(a + b)` → `a + b`
   - Keep parens only when precedence requires

3. **Improve Whitespace**
   - Consistent indentation (2 spaces)
   - Blank lines between function definitions
   - No trailing whitespace

4. **Use Lua Idioms**
   - `if not x then` instead of `if x == false then`
   - `local t = {}` instead of `local t = ({})`
   - Multi-return unpacking: `local a, b = func()`

## Files to Modify

- **src/ir/emitter.js** - Main emitter logic
  - `emitBinaryExpression()` - Remove unnecessary parens
  - `emitIdentifier()` - Skip temp variable creation
  - `emitFunctionDeclaration()` - Better formatting
  - `emitBlock()` - Improved whitespace

## Implementation Steps

1. Add `needsParentheses(node, parent)` helper to check operator precedence
2. Modify `emitBinaryExpression()` to use helper
3. Add `isSimpleExpression(node)` to detect when temps are unnecessary
4. Improve indentation logic in `emitBlock()`
5. Run harness to ensure no regressions
6. Compare before/after output sizes

## Acceptance Criteria

- ✅ `npm run harness` passes (no regressions)
- ✅ Generated Lua code is smaller (10-20% reduction in LOC)
- ✅ Lua code is more readable
- ✅ All parity tests still pass
- ✅ IR validation passes

## Test Command

```bash
# Before optimization
npm run harness > /tmp/before.txt

# After optimization
npm run harness > /tmp/after.txt

# Compare
diff /tmp/before.txt /tmp/after.txt
```

## Related Code

**src/ir/emitter.js:120-150** (BinaryExpression emission):
```javascript
emitBinaryExpression(node) {
  const left = this.emit(node.left);
  const right = this.emit(node.right);
  return `(${left} ${node.operator} ${right})`; // Too many parens!
}
```

Should become:
```javascript
emitBinaryExpression(node, parent) {
  const left = this.emit(node.left, node);
  const right = this.emit(node.right, node);
  const expr = `${left} ${node.operator} ${right}`;
  return this.needsParentheses(node, parent) ? `(${expr})` : expr;
}
```

## References

- Lua 5.4 Operator Precedence: https://www.lua.org/manual/5.4/manual.html#3.4.8
- Code Generation Best Practices: https://en.wikipedia.org/wiki/Code_generation_(compiler)
