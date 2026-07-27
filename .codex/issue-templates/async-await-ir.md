# Add Async/Await Support to Builder and Lowerer

**Priority**: MEDIUM  
**Labels**: codex-work, priority:medium, enhancement  
**Estimated Time**: 2-3 hours

## Issue

LUASCRIPT has async runtime support in `src/advanced_async.js` but the IR builder and lowerer don't have dedicated node types for async functions and await expressions.

## Current Gap

**What Works**:
- `src/advanced_async.js` has Promise implementation
- Runtime supports coroutine-based async execution

**What's Missing**:
- IR node types: `AsyncFunctionExpression`, `AwaitExpression`
- Builder methods: `asyncFunction()`, `awaitExpression()`
- Lowerer methods: `lowerAsyncFunction()`, `lowerAwaitExpression()`
- Test coverage for async/await in harness

## Expected Behavior

```javascript
// Input JS
async function fetchData() {
  const result = await fetch('/api/data');
  return result.json();
}

// Should transpile to Lua with coroutine-based async
```

## Files to Create/Modify

1. **src/ir/nodes/AsyncFunctionExpression.js** (new)
   - Define AsyncFunctionExpression node
   - Schema: `{ type: "AsyncFunctionExpression", params: [], body: BlockStatement, isGenerator: false }`

2. **src/ir/nodes/AwaitExpression.js** (new)
   - Define AwaitExpression node
   - Schema: `{ type: "AwaitExpression", argument: Expression }`

3. **src/ir/builder.js** (modify)
   - Add `asyncFunction(params, body, options)` method
   - Add `awaitExpression(argument)` method

4. **src/ir/lowerer.js** (modify)
   - Add case for `"AsyncFunctionExpression"` in `lowerExpression()`
   - Add `lowerAsyncFunction(node)` method
   - Add `lowerAwaitExpression(node)` method

5. **src/ir/emitter.js** (modify)
   - Add emission logic for async functions (convert to coroutine wrappers)
   - Add emission logic for await expressions (convert to coroutine.yield)

6. **tests/ir/harness.test.js** (modify)
   - Add async function test case
   - Add await expression test case

## Implementation Steps

1. Define AsyncFunctionExpression and AwaitExpression node types
2. Add builder methods for creating these nodes
3. Add lowerer methods to transform parser AST → IR
4. Add emitter logic to generate Lua coroutines
5. Create test fixtures with async/await examples
6. Run harness and validation to ensure no regressions

## Acceptance Criteria

- ✅ `npm run harness` passes with new async tests
- ✅ `npm run ir:validate:all` passes (schema valid)
- ✅ Async functions transpile to Lua coroutines
- ✅ Await expressions transpile to coroutine.yield calls
- ✅ Test case: `async function foo() { return await bar(); }` works

## Related Code

**src/advanced_async.js:50-80** (existing async runtime):
```javascript
async function executeAsync(fn) {
  return new Promise((resolve, reject) => {
    const co = coroutine.create(fn);
    // ... coroutine execution logic
  });
}
```

**src/ir/builder.js** (add to):
```javascript
asyncFunction(params, body, options = {}) {
  return this.createNode('AsyncFunctionExpression', { params, body, ...options });
}

awaitExpression(argument) {
  return this.createNode('AwaitExpression', { argument });
}
```

## References

- ES2017 Async Functions: https://tc39.es/ecma262/#sec-async-function-definitions
- Lua Coroutines: https://www.lua.org/manual/5.4/manual.html#2.6
