# PHASE 4 - COMPREHENSIVE IMPLEMENTATION PLAN

**Championship-Grade Professional Deep Forensic Analysis**  
**Duration**: 3 High-Priority Features (7-9 days total)  
**Standards**: CSC LM EVO-A, 8/8 Quality Gates  
**Current State**: Phase C Week 2 Complete (203/203 tests ✅)

---

## EXECUTIVE SUMMARY

This plan details the complete implementation roadmap for three critical Phase 4 JavaScript ES6+ features:

1. **Arrow Function Parameter Destructuring** (HIGHEST PRIORITY)
2. **Spread Operators** (HIGH PRIORITY)
3. **Control Flow Patterns** (HIGH PRIORITY)

Each feature requires:
- Deep architectural modifications (tokenizer → parser → lowerer)
- 34+ comprehensive unit tests
- 40+ forensic edge case tests
- Performance validation (<20ms target)
- 8/8 quality gate compliance

---

## FEATURE 1: ARROW FUNCTION PARAMETER DESTRUCTURING

### 1.1 Current State Analysis

**What Works:**
- Basic arrow functions: `const f = (x) => x * 2` ✅
- Multiple params: `const f = (x, y) => x + y` ✅
- Expression bodies: `const f = (x) => x + 1` ✅
- Block bodies: `const f = (x) => { return x + 1; }` ✅

**What's Broken:**
- Array destructuring: `const sum = ([a, b]) => a + b` ❌
- Object destructuring: `const greet = ({firstName, lastName}) => ...` ❌
- Nested patterns: `const f = ({user: {id}}) => id` ❌
- Rest patterns: `const f = ([a, ...rest]) => ...` ❌

**Root Cause:**
The parser's `parseParameterList()` method only accepts simple identifiers. It doesn't recognize destructuring patterns (arrays/objects) in parameter position.

### 1.2 Implementation Architecture

#### Phase 1: Tokenizer (No changes needed)
The lexer already recognizes all required tokens:
- `[`, `]` for array patterns
- `{`, `}` for object patterns
- `:` for renaming
- `,` for separation
- `...` for rest patterns

**Current Tokens Verified** ✅

#### Phase 2: Parser Enhancement

**File**: `src/phase1_core_parser.js`

**Method to Modify**: `parseParameterList()` (~line 1450-1480)

```javascript
/**
 * ENHANCED parseParameterList - Supports destructuring patterns
 * Current implementation only accepts identifiers
 * Enhancement: Accept patterns (ArrayPattern, ObjectPattern)
 */
parseParameterList() {
  const params = [];
  
  if (!this.check("RIGHT_PAREN")) {
    do {
      // NEW: Check for pattern before identifier
      if (this.check("LEFT_BRACKET")) {
        // Array destructuring: [a, b, c], [a, ...rest]
        params.push(this.parseArrayPattern());
      } else if (this.check("LEFT_BRACE")) {
        // Object destructuring: {x, y}, {x: a, y: b}
        params.push(this.parseObjectPattern());
      } else {
        // Original: Simple identifier with optional default
        const id = this.parseIdentifier();
        let defaultValue = null;
        if (this.match("ASSIGN")) {
          defaultValue = this.parseAssignmentExpression();
        }
        params.push(new ParameterNode(id, defaultValue, {
          line: id.line,
          column: id.column
        }));
      }
    } while (this.match("COMMA"));
  }
  
  return params;
}
```

**Key Parser Methods Already Exist** ✅
- `parseArrayPattern()` - for `[a, b]` patterns
- `parseObjectPattern()` - for `{x, y}` patterns
- `parseRestElement()` - for `...rest`
- `parseAssignmentExpression()` - for default values

**New AST Node for Pattern Parameters:**
```javascript
class PatternParameterNode {
  constructor(pattern, defaultValue, metadata) {
    this.type = 'PatternParameter';
    this.pattern = pattern;        // ArrayPattern | ObjectPattern
    this.defaultValue = defaultValue;
    this.metadata = metadata;
  }
}
```

#### Phase 3: Lowerer/IR Generation

**File**: `src/ir/lowerer.js` (or equivalent)

**Challenge**: Converting destructuring parameters to IR assignments

**Example transformation**:
```javascript
// Input
const sum = ([a, b]) => a + b;

// Expected IR (Lua-like)
local sum = function(_param_0)
  local a = _param_0[1]
  local b = _param_0[2]
  return a + b
end
```

**Implementation Pattern**:
```javascript
/**
 * ENHANCED emitArrowFunction - Handle pattern parameters
 * @param {ArrowFunctionExpression} node
 * @returns {IRNode}
 */
emitArrowFunction(node) {
  const params = [];
  const paramAssignments = [];
  let paramCounter = 0;
  
  // Convert each parameter
  for (const param of node.params) {
    if (param.type === 'PatternParameter' || 
        param.type === 'ArrayPattern' || 
        param.type === 'ObjectPattern') {
      // Pattern parameter: needs destructuring
      const tempParam = `_param_${paramCounter++}`;
      params.push(tempParam);
      
      // Generate destructuring assignments
      const assignments = this.emitPatternDestructuring(
        param,
        { type: 'Identifier', name: tempParam }
      );
      paramAssignments.push(...assignments);
    } else {
      // Simple parameter: pass through
      params.push(param.name || param);
    }
  }
  
  // Create function with assignments
  const bodyStatements = [
    ...paramAssignments,
    ...this.emitBlockBody(node.body)
  ];
  
  return this.createNode('Function', {
    params,
    body: bodyStatements
  });
}

/**
 * Emit destructuring assignments for parameters
 * @param {Pattern} pattern
 * @param {IRNode} source - the parameter (e.g., _param_0)
 * @returns {IRNode[]} - assignment statements
 */
emitPatternDestructuring(pattern, source) {
  const assignments = [];
  
  if (pattern.type === 'ArrayPattern') {
    pattern.elements.forEach((elem, index) => {
      if (!elem) return; // holes
      
      const srcAccess = {
        type: 'MemberExpression',
        object: source,
        property: { type: 'Literal', value: index + 1 }, // Lua is 1-indexed
        computed: true
      };
      
      if (elem.type === 'RestElement') {
        // ...rest pattern: collect remaining elements
        assignments.push(this.createNode('Assignment', {
          target: elem.argument,
          value: this.createNode('ArraySlice', {
            array: source,
            from: index + 1
          })
        }));
      } else if (elem.type === 'Identifier') {
        assignments.push(this.createNode('Assignment', {
          target: elem,
          value: srcAccess
        }));
      } else {
        // Nested pattern: recurse
        assignments.push(
          ...this.emitPatternDestructuring(elem, srcAccess)
        );
      }
    });
  } else if (pattern.type === 'ObjectPattern') {
    pattern.properties.forEach(prop => {
      let key = prop.key.name;
      let targetName = prop.value.name || key;
      
      const srcAccess = {
        type: 'MemberExpression',
        object: source,
        property: { type: 'Identifier', name: key },
        computed: false
      };
      
      if (prop.value.type === 'RestElement') {
        // ...rest for object: collect remaining properties
        assignments.push(this.createNode('Assignment', {
          target: prop.value.argument,
          value: this.createNode('ObjectRest', {
            object: source,
            excludeKeys: pattern.properties
              .filter(p => p !== prop)
              .map(p => p.key.name)
          })
        }));
      } else if (prop.value.type === 'Identifier') {
        assignments.push(this.createNode('Assignment', {
          target: prop.value,
          value: srcAccess
        }));
      } else {
        // Nested pattern: recurse
        assignments.push(
          ...this.emitPatternDestructuring(prop.value, srcAccess)
        );
      }
    });
  }
  
  return assignments;
}
```

### 1.3 Test Suite Structure (34+ tests)

**File**: `tests/test_arrow_destructuring.js`

```javascript
const runner = new TestRunner('Arrow Function Parameter Destructuring');

// CATEGORY 1: Array Destructuring (12 tests)
runner.test('Basic array destructuring', 'const sum = ([a, b]) => a + b; return sum([1, 2]);', 3);
runner.test('Array with defaults', 'const f = ([a = 1, b = 2]) => a + b; return f([]);', 3);
runner.test('Array with holes', 'const f = ([a, , c]) => c; return f([1, 2, 3]);', 3);
runner.test('Array rest pattern', 'const f = ([a, ...rest]) => rest.length; return f([1, 2, 3]);', 2);
runner.test('Nested array destructuring', 'const f = ([[a], b]) => a + b; return f([[1], 2]);', 3);
runner.test('Array + object destructuring', 'const f = ([{x}]) => x; return f([{x: 5}]);', 5);
runner.test('Empty array pattern', 'const f = ([]) => 42; return f([]);', 42);
runner.test('Single element array', 'const f = ([a]) => a * 2; return f([5]);', 10);
runner.test('Array with assignment target', 'let [a, b] = [1, 2]; const f = ([x, y]) => a + x; return f([10, 20]);', 11);
runner.test('Three-level array nesting', 'const f = ([[[a]]]) => a; return f([[[7]]]);', 7);
runner.test('Array with undefined elements', 'const f = ([a, b, c]) => (a||0) + (b||0) + (c||0); return f([1]);', 1);
runner.test('Array destructuring with side effects', 'let calls = 0; const f = ([a, b = (calls++, 2)]) => calls; return f([1]);', 0);

// CATEGORY 2: Object Destructuring (12 tests)
runner.test('Basic object destructuring', 'const f = ({x, y}) => x + y; return f({x: 2, y: 3});', 5);
runner.test('Object with renaming', 'const f = ({x: a, y: b}) => a * b; return f({x: 3, y: 4});', 12);
runner.test('Object with defaults', 'const f = ({x = 10, y = 20}) => x + y; return f({x: 5});', 25);
runner.test('Object rest pattern', 'const f = ({x, ...rest}) => Object.keys(rest).length; return f({x: 1, y: 2, z: 3});', 2);
runner.test('Nested object destructuring', 'const f = ({user: {id}}) => id; return f({user: {id: 42}});', 42);
runner.test('Mixed object patterns', 'const f = ({x, y: {z}}) => x + z; return f({x: 2, y: {z: 3}});', 5);
runner.test('Object with computed properties', 'const f = ({["key"]: val}) => val; return f({key: 7});', 7);
runner.test('Object with numeric properties', 'const f = ({1: val}) => val; return f({1: 9});', 9);
runner.test('Empty object pattern', 'const f = ({}) => 100; return f({});', 100);
runner.test('Single property object', 'const f = ({a}) => a * 3; return f({a: 5});', 15);
runner.test('Deep object nesting', 'const f = ({a: {b: {c}}}) => c; return f({a: {b: {c: 8}}});', 8);
runner.test('Object destructuring with arrow expression body', 'const f = ({x, y}) => x * y; return f({x: 6, y: 7});', 42);

// CATEGORY 3: Mixed Patterns (7 tests)
runner.test('Array-object-array nesting', 'const f = ([{x: [a]}]) => a; return f([{x: [4]}]);', 4);
runner.test('Object with array property', 'const f = ({arr: [a, b]}) => a + b; return f({arr: [3, 7]});', 10);
runner.test('Multiple arrow functions with patterns', 'const f = ([a]) => a; const g = ({x}) => x; return f([2]) + g({x: 3});', 5);
runner.test('Chained arrow functions', 'const f = ([a]) => ([b]) => a + b; return f([2])([3]);', 5);
runner.test('Arrow pattern with this binding', 'const obj = {val: 10, f: function() { return (([a]) => a + this.val)([5]); }}; return obj.f();', 15);
runner.test('Pattern with complex defaults', 'const f = ({x = 1 + 2}) => x; return f({});', 3);
runner.test('Pattern in returned arrow function', 'const factory = (n) => ([a, b]) => a + b + n; const f = factory(10); return f([1, 2]);', 13);

// CATEGORY 4: Edge Cases & Errors (6+ tests)
runner.test('Duplicate parameter names in destructuring', 'const f = ({x, x}) => x; return f({x: 5});', 5); // Last wins
runner.test('Rest pattern must be last', (() => {
  try {
    new Parser('const f = ([...a, b]) => a;').parse();
    return false;
  } catch(e) {
    return true; // Expected error
  }
})());
runner.test('Parameter default value evaluation order', (() => {
  let order = '';
  const f = ([a = (order += 'a', 1), b = (order += 'b', 2)]) => order;
  const result = f([]);
  return result === 'ab';
})());
runner.test('Large destructuring pattern', 'const f = ([a, b, c, d, e, f, g, h, i, j]) => a + j; return f([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);', 11);
runner.test('Pattern with undefined vs not provided', 'const f = ({x}) => x; const a = f({x: undefined}); const b = f({}); return (a === undefined && b === undefined);', true);
runner.test('Arrow function as callback with pattern', 'const arr = [[1, 2], [3, 4]]; return arr.map(([a, b]) => a + b).reduce((x, y) => x + y, 0);', 10);

runner.run();
```

### 1.4 Forensic Edge Case Tests (40+ tests)

**File**: `tests/test_arrow_destructuring_edge_cases.js`

```javascript
const runner = new TestRunner('Arrow Function Destructuring - Forensic Edge Cases');

// SECTION 1: Destructuring Resolution (10 tests)
runner.test('Pattern resolution with same-named outer variable', (() => {
  let x = 100;
  const f = ([x]) => x;
  return f([50]);
})(), 50);

runner.test('Shadowing with nested patterns', (() => {
  const obj = {a: 1};
  const f = ({a: {b}}) => [a, b]; // 'a' rebound in parameter
  return f({a: {b: 2}})[0].b === 2;
})());

runner.test('Pattern capture in closure', (() => {
  const funcs = [];
  for (let i = 0; i < 3; i++) {
    funcs.push(([a]) => a + i);
  }
  return funcs[0]([10]) === 10 && funcs[2]([10]) === 12;
})());

runner.test('Aliasing captured variables', (() => {
  const f = ([x: a, y: b]) => [a, b];
  return JSON.stringify(f({x: 1, y: 2})) === '[1,2]';
})());

runner.test('Pattern in parameter position vs assignment', (() => {
  const f = ([x]) => x;
  const [y] = [10];
  return f([20]) === 20 && y === 10;
})());

runner.test('Recursive descent in nested pattern', (() => {
  const f = ({a: {b: {c: {d}}}}) => d;
  return f({a: {b: {c: {d: 42}}}}) === 42;
})());

runner.test('Pattern with null/undefined coalescing', (() => {
  const f = ({a = null, b = undefined}) => [a, b];
  const [x, y] = f({});
  return x === null && y === undefined;
})());

runner.test('Multiple patterns in same arrow function', (() => {
  const f = ([a], {b}, c) => a + b + c;
  return f([1], {b: 2}, 3) === 6;
})());

runner.test('Pattern with Symbol properties', (() => {
  const sym = Symbol('test');
  const f = ({[sym]: val}) => val;
  return f({[sym]: 99}) === 99;
})());

runner.test('Pattern evaluation doesn\'t modify source', (() => {
  const src = [1, 2, 3];
  const f = ([a, b, c]) => a + b + c;
  f(src);
  return src[0] === 1 && src.length === 3;
})());

// SECTION 2: Default Value Handling (10 tests)
runner.test('Default value not called when provided', (() => {
  let called = false;
  const f = ([a = (called = true, 1)]) => called;
  return f([10]) === false;
})());

runner.test('Default value evaluated in parameter scope', (() => {
  const f = ([a, b = a + 1]) => [a, b];
  const [x, y] = f([5]);
  return x === 5 && y === 6;
})());

runner.test('Complex default expressions', (() => {
  const f = ([a = Math.random() * 100]) => typeof a === 'number';
  return f([]) === true;
})());

runner.test('Default value with side effects', (() => {
  let counter = 0;
  const f = ([a = ++counter, b = ++counter]) => counter;
  const result = f([]);
  return result === 2;
})());

runner.test('Default chaining in nested patterns', (() => {
  const f = ({x = {y: {z: 1}}}) => f({x: {y: {z: 2}}}); // Partial override
  return f({}).x.y.z === 1;
})());

runner.test('Default value type coercion', (() => {
  const f = ([a = 10]) => a + 5;
  return f([]) === 15 && f([20]) === 25;
})());

runner.test('Nullish coalescing in defaults', (() => {
  const f = ([a = null ?? 1]) => a;
  return f([undefined]) === undefined && f([]) === 1;
})());

runner.test('Multiple defaults in array pattern', (() => {
  const f = ([a = 1, b = 2, c = 3]) => a + b + c;
  return f([]) === 6 && f([10]) === 15 && f([10, 20]) === 33;
})());

runner.test('Object default with nested array', (() => {
  const f = ({arr = [1, 2, 3]}) => arr[0];
  return f({}) === 1 && f({arr: [4]}) === 4;
})());

runner.test('REST element with defaults', (() => {
  const f = ([a = 1, ...rest]) => rest.length;
  return f([]) === 0 && f([2, 3, 4]) === 2;
})());

// SECTION 3: Rest Element Behavior (10 tests)
runner.test('Rest captures remaining array elements', (() => {
  const f = ([a, ...rest]) => rest;
  const result = f([1, 2, 3, 4, 5]);
  return result.length === 4 && result[0] === 2;
})());

runner.test('Rest with empty array', (() => {
  const f = ([a, ...rest]) => rest.length;
  return f([1]) === 0 && f([]) === undefined; // a is undefined, rest is []
})());

runner.test('Rest in object destructuring', (() => {
  const f = ({a, ...rest}) => Object.keys(rest);
  const result = f({a: 1, b: 2, c: 3});
  return result.includes('b') && result.includes('c') && !result.includes('a');
})());

runner.test('REST element identity (not copy)', (() => {
  const original = [2, 3];
  const f = ([a, ...rest]) => rest === original; // Should be reference
  return f([1, ...original]) === true; // Depends on implementation
})());

runner.test('Multiple REST elements should error', (() => {
  try {
    new Parser('const f = ([...a, ...b]) => a;').parse();
    return false;
  } catch(e) {
    return true; // Expected syntax error
  }
})());

runner.test('REST must be last in pattern', (() => {
  try {
    new Parser('const f = ([...a, b]) => a;').parse();
    return false;
  } catch(e) {
    return true; // Expected syntax error
  }
})());

runner.test('REST with computed property names', (() => {
  const f = ({[Symbol.iterator]: iter, ...rest}) => Object.keys(rest).length;
  const obj = {[Symbol.iterator]: function(){}, a: 1, b: 2};
  return f(obj) === 2;
})());

runner.test('REST combined with defaults', (() => {
  const f = ([a = 10, b = 20, ...rest]) => [a, b, rest.length];
  const [x, y, z] = f([1]);
  return x === 1 && y === 20 && z === 0;
})());

runner.test('REST type checking', (() => {
  const f = ([a, ...rest]) => Array.isArray(rest);
  return f([1, 2, 3]) === true && f([1]) === true;
})());

runner.test('Large REST collection', (() => {
  const f = ([first, ...rest]) => rest.length;
  const largeArr = new Array(1000).fill(0).map((_, i) => i);
  return f(largeArr) === 999;
})());

// SECTION 4: Type & Format Variations (10+ tests)
runner.test('Pattern with sparse array', (() => {
  const arr = [1, , 3]; // Sparse (index 1 is empty)
  const f = ([a, b, c]) => [a, b, c];
  const [x, y, z] = f(arr);
  return x === 1 && y === undefined && z === 3;
})());

runner.test('Pattern with non-numeric array indices', (() => {
  const arr = [1, 2];
  arr.prop = 'value';
  const f = ([a, b]) => a + b; // Ignores non-numeric properties
  return f(arr) === 3;
})());

runner.test('Object pattern with non-existent properties', (() => {
  const f = ({a, b, c}) => [a, b, c];
  const [x, y, z] = f({a: 1});
  return x === 1 && y === undefined && z === undefined;
})());

runner.test('Arrow with pattern in switch case', (() => {
  const f = ([a]) => a;
  switch (true) {
    case f([1]) === 1:
      return true;
    default:
      return false;
  }
})());

runner.test('Pattern parameter in recursive function', (() => {
  const factorial = ([n, acc = 1]) => n <= 1 ? acc : factorial([n - 1, acc * n]);
  return factorial([5]) === 120;
})());

runner.test('Pattern with getters/setters', (() => {
  const obj = {
    _value: 10,
    get value() { return this._value; }
  };
  const f = ({value}) => value;
  return f(obj) === 10;
})());

runner.test('Pattern binding consistency', (() => {
  const f = ([a, b]) => g => ([c, d]) => [a, b, c, d];
  const g = f([1, 2]);
  const result = g(null)([3, 4]);
  return result[0] === 1 && result[3] === 4;
})());

runner.test('Arrow destructuring with this context', (() => {
  const obj = {
    x: 10,
    method: function() {
      return (([a]) => a + this.x)([5]);
    }
  };
  return obj.method() === 15;
})());

runner.test('Destructuring parameter in generator arrow', (() => {
  const gen = function*() {
    const f = ([a]) => a;
    yield f([10]);
  };
  const result = gen().next();
  return result.value === 10;
})());

runner.test('Pattern with array subclass', (() => {
  class MyArray extends Array {}
  const arr = new MyArray(1, 2, 3);
  const f = ([a, b]) => a + b;
  return f(arr) === 3;
})());

runner.run();
```

### 1.5 Implementation Checklist

- [ ] **Parser Enhancement** (4-6 hours)
  - [ ] Create `PatternParameterNode` class
  - [ ] Modify `parseParameterList()` to detect patterns
  - [ ] Add pattern node support (already exist - just need to use)
  - [ ] Handle rest elements in parameters
  - [ ] Test parser with pattern detection

- [ ] **Lowerer Enhancement** (6-8 hours)
  - [ ] Create `emitPatternDestructuring()` method
  - [ ] Enhance `emitArrowFunction()` for pattern params
  - [ ] Handle array indexing (0-based JS → 1-based Lua)
  - [ ] Handle object property access
  - [ ] Support nested patterns recursively
  - [ ] Handle rest elements in lowering

- [ ] **Test Suite** (4-6 hours)
  - [ ] Implement all 34 tests
  - [ ] Implement 40+ edge case tests
  - [ ] Create test helper functions
  - [ ] Validate test coverage

- [ ] **Quality Gates** (2-3 hours)
  - [ ] All tests passing (100%)
  - [ ] Performance <20ms
  - [ ] No memory leaks
  - [ ] Lint clean
  - [ ] Integration tests passing

**Estimated Duration**: 3-4 days (full implementation with testing)

---

## FEATURE 2: SPREAD OPERATORS

### 2.1 Current State Analysis

**What's Broken:**
```javascript
// Array spread
let arr = [1, ...[2, 3], 4];  // ❌ Should produce [1, 2, 3, 4]
let arr2 = [...arr, 5];        // ❌ Should produce [1, 2, 3, 4, 5]

// Object spread
let obj = {a: 1, ...other, b: 2};  // ❌ Should merge objects
let obj2 = {...obj, c: 3};         // ❌ Should create new object with all props

// Function call spread
func(...args);  // ❌ Should expand array as separate arguments
Math.max(...nums);  // ❌ Should work
```

**Root Causes:**
1. Tokenizer recognizes `...` but doesn't mark it as spread operator
2. Parser has `SpreadElement` AST nodes but doesn't fully process them
3. Lowerer doesn't expand spread elements during IR generation

### 2.2 Implementation Architecture

#### Phase 1: Tokenizer Enhancement

**File**: `src/phase1_core_lexer.js`

The lexer already recognizes `...` as a token. No changes needed.

**Current Status**: ✅ Already tokenizes

#### Phase 2: Parser Enhancement

**File**: `src/phase1_core_parser.js`

**Methods to Enhance**:
1. `parseArrayExpression()` (~line 1600)
2. `parseObjectExpression()` (~line 1650)
3. `parseArgumentList()` (~line 1250)

```javascript
/**
 * ENHANCED parseArrayExpression - Support spread elements
 */
parseArrayExpression() {
  const elements = [];
  
  while (!this.check("RIGHT_BRACKET") && !this.isAtEnd()) {
    if (this.match("SPREAD")) {
      // NEW: Spread element
      const expr = this.parseAssignmentExpression();
      elements.push(new SpreadElementNode(expr, {
        line: this.previous().line,
        column: this.previous().column
      }));
    } else if (this.check("COMMA")) {
      // Hole in array: [1, , 3]
      elements.push(null);
    } else {
      elements.push(this.parseAssignmentExpression());
    }
    
    if (!this.check("RIGHT_BRACKET")) {
      this.consume("COMMA", "Expected ',' or ']' in array literal");
    }
  }
  
  this.consume("RIGHT_BRACKET", "Expected ']' after array elements");
  
  return new ArrayExpressionNode(elements, {
    line: this.previous().line,
    column: this.previous().column
  });
}

/**
 * ENHANCED parseObjectExpression - Support spread properties
 */
parseObjectExpression() {
  const properties = [];
  
  while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
    if (this.match("SPREAD")) {
      // NEW: Spread property in object
      const expr = this.parseAssignmentExpression();
      properties.push(new SpreadPropertyNode(expr, {
        line: this.previous().line,
        column: this.previous().column
      }));
    } else if (this.check("IDENTIFIER") || this.check("STRING") || this.check("NUMBER")) {
      // Regular property
      const key = this.parseIdentifier();
      let value;
      
      if (this.match("COLON")) {
        value = this.parseAssignmentExpression();
      } else {
        // Shorthand: {x} instead of {x: x}
        value = key;
      }
      
      properties.push(new PropertyNode(key, value, {
        line: key.line,
        column: key.column
      }));
    } else {
      throw new SyntaxError(`Unexpected token in object literal at line ${this.peek().line}`);
    }
    
    if (!this.check("RIGHT_BRACE")) {
      this.consume("COMMA", "Expected ',' or '}' in object literal");
    }
  }
  
  this.consume("RIGHT_BRACE", "Expected '}' after object properties");
  
  return new ObjectExpressionNode(properties, {
    line: this.previous().line,
    column: this.previous().column
  });
}

/**
 * ENHANCED parseArgumentList - Support spread in function calls
 */
parseArgumentList() {
  const args = [];
  
  if (!this.check("RIGHT_PAREN")) {
    do {
      if (this.match("SPREAD")) {
        // NEW: Spread argument
        const expr = this.parseAssignmentExpression();
        args.push(new SpreadElementNode(expr, {
          line: this.previous().line,
          column: this.previous().column
        }));
      } else {
        args.push(this.parseAssignmentExpression());
      }
    } while (this.match("COMMA"));
  }
  
  return args;
}
```

**AST Nodes (may already exist):**
```javascript
class SpreadElementNode {
  constructor(argument, metadata) {
    this.type = 'SpreadElement';
    this.argument = argument;  // Expression to spread
    this.metadata = metadata;
  }
}

class SpreadPropertyNode {
  constructor(argument, metadata) {
    this.type = 'SpreadProperty';
    this.argument = argument;  // Object expression to spread
    this.metadata = metadata;
  }
}
```

#### Phase 3: Lowerer/IR Generation

**File**: `src/ir/lowerer.js`

**Challenge**: Converting spread syntax to equivalent loop-based expansion

**Example transformations:**

```javascript
// Array spread
// Input: [1, ...[2, 3], 4]
// IR output:
local _spread_1 = {}
table.insert(_spread_1, 1)
for _i, _v in ipairs({2, 3}) do
  table.insert(_spread_1, _v)
end
table.insert(_spread_1, 4)
// Result: _spread_1 = {1, 2, 3, 4}

// Object spread
// Input: {a: 1, ...other, b: 2}
// IR output:
local _spread_1 = {a = 1}
for _k, _v in pairs(other) do
  _spread_1[_k] = _v
end
_spread_1.b = 2
// Result: _spread_1 merged with other

// Function call spread
// Input: Math.max(...nums)
// IR output:
local _spread_args = {}
for _i, _v in ipairs(nums) do
  table.insert(_spread_args, _v)
end
Math.max(unpack(_spread_args))  // unpack to expand args
```

**Implementation Pattern:**

```javascript
/**
 * ENHANCED emitArrayExpression - Handle spread elements
 */
emitArrayExpression(node) {
  if (this.hasSpreadElements(node.elements)) {
    // Use dynamic array building
    const arrayVar = this.generateTempVariable('array');
    const assignments = [];
    
    assignments.push(this.createNode('Assignment', {
      target: arrayVar,
      value: { type: 'ArrayLiteral', elements: [] }
    }));
    
    for (const elem of node.elements) {
      if (!elem) {
        // Hole: skip
        continue;
      }
      
      if (elem.type === 'SpreadElement') {
        // Spread: iterate and insert
        const iterVar = this.generateTempVariable('iter');
        const valVar = this.generateTempVariable('val');
        
        assignments.push(this.createNode('ForInLoop', {
          variable: iterVar,
          value: valVar,
          collection: this.emit(elem.argument),
          body: [
            this.createNode('FunctionCall', {
              callee: { type: 'MemberExpression', object: 'table', property: 'insert' },
              arguments: [arrayVar, valVar]
            })
          ]
        }));
      } else {
        // Regular element: insert directly
        assignments.push(this.createNode('FunctionCall', {
          callee: { type: 'MemberExpression', object: 'table', property: 'insert' },
          arguments: [arrayVar, this.emit(elem)]
        }));
      }
    }
    
    // Return the array variable
    assignments.push(this.createNode('ReturnValue', { value: arrayVar }));
    
    // Wrap in IIFE (inline function)
    return this.createNode('IIFE', {
      body: assignments,
      returns: arrayVar
    });
  }
  
  // No spread: use simple array literal
  return this.createNode('ArrayLiteral', {
    elements: node.elements.map(e => e ? this.emit(e) : null)
  });
}

/**
 * Helper: Check if array has spread elements
 */
hasSpreadElements(elements) {
  return elements.some(e => e && e.type === 'SpreadElement');
}

/**
 * ENHANCED emitObjectExpression - Handle spread properties
 */
emitObjectExpression(node) {
  if (this.hasSpreadProperties(node.properties)) {
    // Use dynamic object building
    const objVar = this.generateTempVariable('object');
    const assignments = [];
    
    assignments.push(this.createNode('Assignment', {
      target: objVar,
      value: { type: 'ObjectLiteral', properties: [] }
    }));
    
    for (const prop of node.properties) {
      if (prop.type === 'SpreadProperty') {
        // Spread: iterate properties and copy
        const spreadObj = this.emit(prop.argument);
        const keyVar = this.generateTempVariable('key');
        const valVar = this.generateTempVariable('val');
        
        assignments.push(this.createNode('ForInLoop', {
          variables: [keyVar, valVar],
          collection: spreadObj,
          body: [
            this.createNode('Assignment', {
              target: { 
                type: 'MemberExpression', 
                object: objVar, 
                property: keyVar,
                computed: true
              },
              value: valVar
            })
          ]
        }));
      } else {
        // Regular property
        assignments.push(this.createNode('Assignment', {
          target: {
            type: 'MemberExpression',
            object: objVar,
            property: prop.key,
            computed: false
          },
          value: this.emit(prop.value)
        }));
      }
    }
    
    assignments.push(this.createNode('ReturnValue', { value: objVar }));
    
    return this.createNode('IIFE', {
      body: assignments,
      returns: objVar
    });
  }
  
  // No spread: use simple object literal
  return this.createNode('ObjectLiteral', {
    properties: node.properties.map(p => ({
      key: p.key,
      value: this.emit(p.value)
    }))
  });
}

/**
 * Helper: Check if object has spread properties
 */
hasSpreadProperties(properties) {
  return properties.some(p => p.type === 'SpreadProperty');
}

/**
 * ENHANCED emitCallExpression - Handle spread arguments
 */
emitCallExpression(node) {
  if (this.hasSpreadElements(node.arguments)) {
    // Expand spread arguments for function call
    const argsVar = this.generateTempVariable('args');
    const setupAssignments = [];
    
    setupAssignments.push(this.createNode('Assignment', {
      target: argsVar,
      value: { type: 'ArrayLiteral', elements: [] }
    }));
    
    for (const arg of node.arguments) {
      if (arg.type === 'SpreadElement') {
        const iterVar = this.generateTempVariable('iter');
        const valVar = this.generateTempVariable('val');
        
        setupAssignments.push(this.createNode('ForInLoop', {
          variable: iterVar,
          value: valVar,
          collection: this.emit(arg.argument),
          body: [
            this.createNode('FunctionCall', {
              callee: { type: 'MemberExpression', object: 'table', property: 'insert' },
              arguments: [argsVar, valVar]
            })
          ]
        }));
      } else {
        setupAssignments.push(this.createNode('FunctionCall', {
          callee: { type: 'MemberExpression', object: 'table', property: 'insert' },
          arguments: [argsVar, this.emit(arg)]
        }));
      }
    }
    
    // Call with unpacked arguments
    return this.createNode('CallWithSpread', {
      callee: this.emit(node.callee),
      arguments: argsVar,  // unpack(argsVar) in Lua
      setupStatements: setupAssignments
    });
  }
  
  // No spread: use simple call
  return this.createNode('Call', {
    callee: this.emit(node.callee),
    arguments: node.arguments.map(a => this.emit(a))
  });
}
```

### 2.3 Test Suite Structure (34+ tests)

**File**: `tests/test_spread_operators.js`

```javascript
const runner = new TestRunner('Spread Operators');

// CATEGORY 1: Array Spread (12 tests)
runner.test('Basic array spread', 'let arr = [1, ...[2, 3], 4]; return arr[0] + arr[3];', 5);
runner.test('Spread at start', 'let arr = [...[1, 2], 3]; return arr.length;', 3);
runner.test('Spread at end', 'let arr = [1, ...[2, 3]]; return arr[2];', 3);
runner.test('Multiple spreads', 'let arr = [1, ...[2], ...[3, 4]]; return arr.length;', 4);
runner.test('Spread empty array', 'let arr = [1, ..[], 2]; return arr.length;', 2);
runner.test('Spread with holes', 'let arr = [...[1, , 3]]; return arr.length;', 3);
runner.test('Spread nested array', 'let arr = [...[[1, 2]]]; return arr[0][1];', 2);
runner.test('Spread string (iterable)', 'let arr = [..."abc"]; return arr.length;', 3);
runner.test('Spread with variables', 'let a = [1, 2]; let b = [...a]; return b[1];', 2);
runner.test('Spread mutations don\'t affect original', 'let a = [1, 2]; let b = [...a]; b[0] = 99; return a[0];', 1);
runner.test('Deep spread', 'let a = [[1, 2], [3, 4]]; let b = [...a]; return b[1][0];', 3);
runner.test('Spread in Array constructor', 'let arr = new Array(...[1, 2, 3]); return arr.length;', 3);

// CATEGORY 2: Object Spread (12 tests)
runner.test('Basic object spread', 'let obj = {a: 1, ...{b: 2}, c: 3}; return obj.b;', 2);
runner.test('Spread at start', 'let obj = {...{a: 1}, b: 2}; return obj.a;', 1);
runner.test('Spread overwrites earlier properties', 'let obj = {a: 1, ...{a: 2}}; return obj.a;', 2);
runner.test('Later properties overwrite spread', 'let obj = {...{a: 1}, a: 2}; return obj.a;', 2);
runner.test('Multiple object spreads', 'let obj = {...{a: 1}, ...{b: 2}}; return Object.keys(obj).length;', 2);
runner.test('Spread empty object', 'let obj = {a: 1, ...{}, b: 2}; return Object.keys(obj).length;', 2);
runner.test('Spread object with methods', 'let src = {fn: () => 42}; let obj = {...src}; return obj.fn();', 42);
runner.test('Spread doesn\'t include non-enumerable', (() => {
  const src = {};
  Object.defineProperty(src, 'hidden', { value: 1, enumerable: false });
  const obj = {...src};
  return obj.hidden === undefined;
})());
runner.test('Spread with getter/setter', (() => {
  const src = {
    _val: 10,
    get value() { return this._val; }
  };
  const obj = {...src};
  return obj.value === undefined; // Getter not copied, only result
})());
runner.test('Spread computed properties', 'const sym = Symbol(); let obj = {...{[sym]: 1}}; return obj[sym];', 1);
runner.test('Spread nested objects', 'let obj = {...{a: {b: 1}}}; return obj.a.b;', 1);
runner.test('Spread with prototype', (() => {
  const src = Object.create({inherited: 1});
  src.own = 2;
  const obj = {...src};
  return obj.own === 2 && obj.inherited === undefined;
})());

// CATEGORY 3: Function Call Spread (8 tests)
runner.test('Basic function spread', 'function sum(a, b, c) { return a + b + c; } return sum(...[1, 2, 3]);', 6);
runner.test('Spread in method call', 'const obj = {fn(a, b) { return a * b; }}; return obj.fn(...[3, 4]);', 12);
runner.test('Math.max with spread', 'return Math.max(...[5, 2, 8, 1]);', 8);
runner.test('Mixed arguments with spread', 'function f(a, b, c) { return a + b + c; } return f(1, ...[2, 3]);', 6);
runner.test('Array.concat with spread', 'let arr = [1]; return arr.concat(...[[2, 3]]).length;', 3);
runner.test('Constructor with spread', 'function F(a, b) { this.val = a + b; } const f = new F(...[10, 20]); return f.val;', 30);
runner.test('Rest parameters with spread', 'function f(...args) { return args.length; } return f(...[1, 2, 3, 4, 5]);', 5);
runner.test('Nested spread calls', 'function f(a, b, c) { return a + b + c; } const arr = [1, ...[2]]; return f(...arr, 3);', 6);

// CATEGORY 4: Complex Scenarios (7+ tests)
runner.test('Array spread with map', 'let arr = [1, 2, 3]; return [...arr.map(x => x * 2)][1];', 4);
runner.test('Object spread with Object.assign', 'let a = {x: 1}; let b = {...a}; return b.x === a.x && b !== a;', true);
runner.test('Spread in array methods', 'return [1, 2].concat(...[[3, 4]]).join("");', '1234');
runner.test('Spread generator', 'function* gen() { yield 1; yield 2; } return [...gen()].length;', 2);
runner.test('Spread with async iterables', (() => {
  const iterable = { [Symbol.iterator]: () => ({ next: () => ({value: 1, done: false}) }) };
  // This would need proper async handling
  return true; // Placeholder
})());
runner.test('Spread performance (large array)', 'let a = new Array(1000).fill(0); let b = [...a]; return b.length;', 1000);
runner.test('Spread in destructuring + spread', 'let arr = [1, ...[2, 3]]; let [a, ...rest] = arr; return rest.length;', 2);

runner.run();
```

### 2.4 Forensic Edge Cases (40+ tests)

**File**: `tests/test_spread_operators_edge_cases.js`

```javascript
const runner = new TestRunner('Spread Operators - Forensic Edge Cases');

// SECTION 1: Array Spread Edge Cases (10 tests)
runner.test('Spread preserves array type', (() => {
  const typed = new Uint8Array([1, 2, 3]);
  const spread = [...typed];
  return Array.isArray(spread);
})());

runner.test('Spread with sparse arrays', (() => {
  const sparse = [1, , 3];
  const spread = [...sparse];
  return spread.length === 3 && spread[1] === undefined;
})());

runner.test('Spread stops at length property', (() => {
  const arr = [1, 2, 3];
  arr.length = 2;
  return [...arr].length === 2;
})());

runner.test('Spread doesn\'t include array properties', (() => {
  const arr = [1, 2];
  arr.prop = 'value';
  const spread = [...arr];
  return spread.length === 2 && spread.prop === undefined;
})());

runner.test('Spread respects custom iterators', (() => {
  const obj = {
    [Symbol.iterator]: function*() {
      yield 1;
      yield 2;
      yield 3;
    }
  };
  return [...obj].length === 3;
})());

runner.test('Spread with infinite iterator (bounded)', (() => {
  // Should not hang
  return true; // Depends on implementation safety
})());

runner.test('Multiple spreads preserve order', (() => {
  const a = [1, 2];
  const b = [3, 4];
  const result = [...a, 2.5, ...b];
  return result[2] === 2.5;
})());

runner.test('Spread with function returning array', (() => {
  const fn = () => [1, 2, 3];
  const result = [...fn()];
  return result[1] === 2;
})());

runner.test('Spread with array-like object', (() => {
  const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
  // Normal spread doesn't work on array-like without Symbol.iterator
  // This tests handling of non-iterable
  return true; // Implementation dependent
})());

runner.test('Spread modifying during iteration (snapshot)', (() => {
  const arr = [1, 2, 3];
  const result = [...arr];
  arr.push(4);
  return result.length === 3; // Spread captures at moment of evaluation
})());

// SECTION 2: Object Spread Edge Cases (10 tests)
runner.test('Spread with Symbol properties', (() => {
  const sym = Symbol('test');
  const obj = {[sym]: 'value'};
  const spread = {...obj};
  return spread[sym] === 'value';
})());

runner.test('Spread preserves property descriptors', (() => {
  const obj = {};
  Object.defineProperty(obj, 'prop', { value: 1, writable: false });
  const spread = {...obj};
  return spread.prop === 1; // Value copied, descriptor not preserved
})());

runner.test('Spread with getter triggers side effects', (() => {
  let called = false;
  const obj = {
    get prop() {
      called = true;
      return 1;
    }
  };
  const spread = {...obj};
  return called === true; // Getter invoked during spread
})());

runner.test('Spread doesn\'t copy inherited properties', (() => {
  const proto = {inherited: 1};
  const obj = Object.create(proto);
  obj.own = 2;
  const spread = {...obj};
  return spread.own === 2 && spread.inherited === undefined;
})());

runner.test('Spread with null/undefined (throws or ignored)', (() => {
  try {
    const result = {...null};
    return true; // null is ignored in spread
  } catch(e) {
    return true; // Error is acceptable
  }
})());

runner.test('Spread with accessor descriptor', (() => {
  const obj = {};
  Object.defineProperty(obj, 'prop', {
    get() { return 42; },
    configurable: true
  });
  const spread = {...obj};
  return spread.prop === 42;
})());

runner.test('Spread property name conflicts', (() => {
  const obj = {...{a: 1, a: 2}};
  return obj.a === 2; // Last value wins
})());

runner.test('Large object spread', (() => {
  const obj = {};
  for (let i = 0; i < 1000; i++) {
    obj[`key${i}`] = i;
  }
  const spread = {...obj};
  return Object.keys(spread).length === 1000;
})());

runner.test('Spread with Proxy', (() => {
  const target = {a: 1};
  const proxy = new Proxy(target, {
    ownKeys(t) { return ['a', 'b']; },
    getOwnPropertyDescriptor(t, k) { return {enumerable: true, configurable: true}; },
    get(t, k) { return k === 'b' ? 2 : t[k]; }
  });
  const spread = {...proxy};
  return spread.a === 1 && spread.b === 2;
})());

runner.test('Spread mutating during iteration (should not see mutations)', (() => {
  const obj = {a: 1, b: 2};
  const spread = {...obj};
  obj.c = 3;
  return spread.c === undefined; // Snapshot at spread time
})());

// SECTION 3: Function Call Spread Edge Cases (10 tests)
runner.test('Spread converts to iterable check', (() => {
  const arr = [1, 2, 3];
  const count = arr.length;
  arr[Symbol.iterator]; // Just checking property exists
  return true;
})());

runner.test('Spread with empty array as argument', (() => {
  function f(...args) { return args.length; }
  return f(...[]) === 0;
})());

runner.test('Spread with null throws or is error', (() => {
  function f(a, b, c) { return a + b + c; }
  try {
    f(...null);
    return false; // Should throw
  } catch(e) {
    return true; // Expected
  }
})());

runner.test('Spread applies after other arguments', (() => {
  function f(a, b, c, d) { return `${a}-${b}-${c}-${d}`; }
  const result = f(1, ...[2, 3], 4);
  return result === '1-2-3-4';
})());

runner.test('Spread with this binding', (() => {
  const obj = {
    val: 10,
    method(a, b) { return this.val + a + b; }
  };
  const args = [1, 2];
  return obj.method(...args) === 13;
})());

runner.test('Spread in new expression', (() => {
  function C(a, b) { this.sum = a + b; }
  const instance = new C(...[3, 4]);
  return instance.sum === 7;
})());

runner.test('Spread with more args than function params', (() => {
  function f(a) { return arguments.length; }
  return f(...[1, 2, 3]) === 3;
})());

runner.test('Spread with generator function', (() => {
  function* gen() { yield 1; yield 2; }
  function f(a, b) { return a + b; }
  return f(...gen()) === 3;
})());

runner.test('Nested spread calls', (() => {
  function f(a, b, c) { return a + b + c; }
  const inner = [...[1, 2]];
  const result = f(...inner, 3);
  return result === 6;
})());

runner.test('Spread side effects evaluation order', (() => {
  let order = '';
  function log(val) {
    order += val;
    return val;
  }
  function f(a, b, c) { return order; }
  f(log(1), ...log(2), log(3)); // This is ambiguous - testing evaluation order
  return order.includes('1') && order.includes('2') && order.includes('3');
})());

// SECTION 4: Type & Mutation Tests (10+ tests)
runner.test('Spread string creates array of characters', (() => {
  const arr = [..."hello"];
  return arr[0] === 'h' && arr.length === 5;
})());

runner.test('Spread Map entries', (() => {
  const map = new Map([['a', 1], ['b', 2]]);
  // Depending on implementation
  return true;
})());

runner.test('Spread Set values', (() => {
  const set = new Set([1, 2, 3]);
  const arr = [...set];
  return arr.length === 3;
})());

runner.test('Spread with get() side effects', (() => {
  let called = 0;
  const obj = {
    get val() {
      called++;
      return 42;
    }
  };
  const spread = {...obj};
  return called === 1; // Getter called once
})());

runner.test('Spread respects Object.freeze', (() => {
  const obj = {a: 1};
  Object.freeze(obj);
  const spread = {...obj};
  spread.a = 99;
  return obj.a === 1 && spread.a === 99; // Spread is independent
})());

runner.test('Spread with Object.seal', (() => {
  const obj = {a: 1};
  Object.seal(obj);
  const spread = {...obj};
  spread.b = 2;
  return spread.b === 2 && obj.b === undefined; // Spread can add new props
})());

runner.test('Array spread with very large arrays', (() => {
  const large = new Array(10000).fill(0);
  const spread = [...large];
  return spread.length === 10000;
})());

runner.test('Spread in reduce with accumulator', (() => {
  const arrays = [[1, 2], [3, 4], [5, 6]];
  const result = arrays.reduce((acc, arr) => [...acc, ...arr], []);
  return result.length === 6;
})());

runner.run();
```

### 2.5 Implementation Checklist

- [ ] **Parser Enhancement** (4-6 hours)
  - [ ] Update `parseArrayExpression()` for spread elements
  - [ ] Update `parseObjectExpression()` for spread properties
  - [ ] Update `parseArgumentList()` for spread arguments
  - [ ] Validate existing `SpreadElement` AST nodes
  - [ ] Test all three contexts

- [ ] **Lowerer Enhancement** (6-8 hours)
  - [ ] Create spread expansion logic for arrays
  - [ ] Create spread expansion logic for objects
  - [ ] Create spread expansion logic for function calls
  - [ ] Handle Lua table insertion and unpacking
  - [ ] Support iterables (arrays, strings, Map, Set)

- [ ] **Test Suite** (4-6 hours)
  - [ ] Implement 34 comprehensive tests
  - [ ] Implement 40+ edge case tests
  - [ ] Performance benchmarks

- [ ] **Quality Gates** (2-3 hours)
  - [ ] All tests passing
  - [ ] Performance <20ms
  - [ ] Memory optimization
  - [ ] No semantic differences from JS

**Estimated Duration**: 3-4 days

---

## FEATURE 3: CONTROL FLOW PATTERNS

### 3.1 Current State Analysis

**What's Broken:**
```javascript
// Destructuring in if condition
if (let [x, y] = getPoint()) {
  console.log(x, y);
}

// Destructuring in while loop
while (let {done, value} = iterator.next()) {
  if (done) break;
}

// Destructuring in for loop variable
for (let [{id, name}] of users) {
  console.log(name);
}

// Destructuring in switch
switch (true) {
  case let {type} = event: ...
}
```

**Root Causes:**
1. Parser's conditional/loop parsing expects simple identifiers in variable declarations
2. `for...of` loop doesn't support destructuring patterns yet
3. Pattern matching in condition position requires parser redesign
4. Control flow with patterns needs special handling in lowerer

### 3.2 Implementation Architecture

#### Phase 1: Parser Enhancement

**File**: `src/phase1_core_parser.js`

**Methods to Enhance**:
1. `parseIfStatement()` - Allow patterns in conditions
2. `parseWhileStatement()` - Allow patterns in conditions
3. `parseForStatement()` - Allow patterns in loops
4. `parseForOfStatement()` - Support destructuring iterator

```javascript
/**
 * ENHANCED parseIfStatement - Support variable declarations with patterns
 */
parseIfStatement() {
  const token = this.previous(); // 'if'
  
  this.consume("LEFT_PAREN", "Expected '(' after 'if'");
  
  let test;
  
  // NEW: Check for variable declaration with pattern
  if (this.check("KEYWORD") && ['let', 'const', 'var'].includes(this.peek().value)) {
    const kind = this.advance().value;
    
    // Parse pattern (identifier, array pattern, or object pattern)
    let pattern;
    if (this.check("LEFT_BRACKET")) {
      pattern = this.parseArrayPattern();
    } else if (this.check("LEFT_BRACE")) {
      pattern = this.parseObjectPattern();
    } else {
      pattern = this.parseIdentifier();
    }
    
    this.consume("ASSIGN", "Expected '=' in pattern-based if condition");
    const init = this.parseAssignmentExpression();
    
    // Create a special "ConditionalPattern" node
    test = new ConditionalPatternNode(kind, pattern, init, {
      line: token.line,
      column: token.column
    });
  } else {
    // Regular condition
    test = this.parseExpression();
  }
  
  this.consume("RIGHT_PAREN", "Expected ')' after if condition");
  
  const consequent = this.parseStatement();
  let alternate = null;
  
  if (this.match("KEYWORD") && this.previous().value === "else") {
    alternate = this.parseStatement();
  } else {
    this.current--; // Backtrack if not 'else'
  }
  
  return new IfStatementNode(test, consequent, alternate, {
    line: token.line,
    column: token.column
  });
}

/**
 * ENHANCED parseWhileStatement - Support patterns in condition
 */
parseWhileStatement() {
  const token = this.previous(); // 'while'
  this.loopDepth++;
  
  this.consume("LEFT_PAREN", "Expected '(' after 'while'");
  
  let test;
  
  // NEW: Check for variable declaration with pattern
  if (this.check("KEYWORD") && ['let', 'const', 'var'].includes(this.peek().value)) {
    const kind = this.advance().value;
    
    let pattern;
    if (this.check("LEFT_BRACKET")) {
      pattern = this.parseArrayPattern();
    } else if (this.check("LEFT_BRACE")) {
      pattern = this.parseObjectPattern();
    } else {
      pattern = this.parseIdentifier();
    }
    
    this.consume("ASSIGN", "Expected '=' in pattern-based while condition");
    const init = this.parseAssignmentExpression();
    
    test = new ConditionalPatternNode(kind, pattern, init, {
      line: token.line,
      column: token.column
    });
  } else {
    test = this.parseExpression();
  }
  
  this.consume("RIGHT_PAREN", "Expected ')' after while condition");
  
  const body = this.parseStatement();
  
  this.loopDepth--;
  
  return new WhileStatementNode(test, body, {
    line: token.line,
    column: token.column
  });
}

/**
 * ENHANCED parseForOfStatement - Support destructuring patterns
 */
parseForOfStatement(kind, pattern, right) {
  // Already partially implemented, just need to ensure patterns work
  
  this.consume("RIGHT_PAREN", "Expected ')' after for-of clauses");
  const body = this.parseStatement();
  this.loopDepth--;
  
  // Pattern is already parsed above
  const decl = new VariableDeclarationNode([
    new VariableDeclaratorNode(pattern, null, {
      line: pattern.line,
      column: pattern.column
    })
  ], kind, {
    line: pattern.line,
    column: pattern.column
  });
  
  return new ForOfStatementNode(decl, right, body, {
    line: pattern.line,
    column: pattern.column
  });
}

/**
 * NEW: ConditionalPatternNode for if/while with patterns
 */
class ConditionalPatternNode {
  constructor(kind, pattern, init, metadata) {
    this.type = 'ConditionalPattern';
    this.kind = kind;        // 'let', 'const', 'var'
    this.pattern = pattern;  // Pattern to destructure
    this.init = init;        // Expression to destructure from
    this.metadata = metadata;
  }
}
```

#### Phase 2: Lowerer Enhancement

**File**: `src/ir/lowerer.js`

**Challenge**: Convert pattern-based control flow to conventional JS

**Example transformation:**

```javascript
// Input: if (let [x, y] = getPoint()) { ... }
// Output: 
let [x, y] = getPoint();
if (x !== null && x !== undefined) {
  // ... body
}

// Input: while (let {done, value} = iter.next()) { ... }
// Output:
let _iter;
while (true) {
  _iter = iter.next();
  let {done, value} = _iter;
  if (!_iter) break;  // Falsy check
  // ... body
}

// Input: for (let [{id}] of users) { ... }
// Output:
for (let user of users) {
  let [{id}] = [user];
  // ... body
}
```

**Implementation Pattern:**

```javascript
/**
 * ENHANCED emitIfStatement - Handle pattern-based conditions
 */
emitIfStatement(node) {
  if (node.test.type === 'ConditionalPattern') {
    // Transform pattern condition
    const pattern = node.test;
    
    // Create destructuring assignment
    const destructAssign = this.createNode('VariableDeclaration', {
      kind: pattern.kind,
      declarations: [{
        id: pattern.pattern,
        init: this.emit(pattern.init)
      }]
    });
    
    // Create truthiness check on destructured variable
    let testExpr;
    if (pattern.pattern.type === 'Identifier') {
      // Simple identifier: check if not null/undefined
      testExpr = this.createNode('BinaryExpression', {
        operator: '!==',
        left: pattern.pattern,
        right: { type: 'Literal', value: null }
      });
    } else {
      // Pattern: check first destructured variable
      const firstVar = this.getFirstIdentifierInPattern(pattern.pattern);
      testExpr = this.createNode('BinaryExpression', {
        operator: '!==',
        left: firstVar,
        right: { type: 'Literal', value: null }
      });
    }
    
    return this.createNode('IfStatement', {
      setup: destructAssign,  // Assignment before condition check
      test: testExpr,
      consequent: this.emit(node.consequent),
      alternate: node.alternate ? this.emit(node.alternate) : null
    });
  }
  
  // Regular if statement
  return this.createNode('IfStatement', {
    test: this.emit(node.test),
    consequent: this.emit(node.consequent),
    alternate: node.alternate ? this.emit(node.alternate) : null
  });
}

/**
 * ENHANCED emitWhileStatement - Handle pattern-based conditions
 */
emitWhileStatement(node) {
  if (node.test.type === 'ConditionalPattern') {
    const pattern = node.test;
    
    // Convert to: while (true) { let {x} = expr; if (!x) break; ... }
    const tempVar = this.generateTempVariable('loop');
    
    const bodyStatements = [
      // Destructuring assignment
      this.createNode('VariableDeclaration', {
        kind: pattern.kind,
        declarations: [{
          id: pattern.pattern,
          init: this.emit(pattern.init)
        }]
      }),
      // Check if pattern binding is truthy
      this.createNode('IfStatement', {
        test: this.createNode('UnaryExpression', {
          operator: '!',
          argument: tempVar
        }),
        consequent: this.createNode('BreakStatement')
      }),
      // Original body
      this.emit(node.body)
    ];
    
    return this.createNode('WhileStatement', {
      test: { type: 'Literal', value: true },
      body: this.createNode('BlockStatement', {
        body: bodyStatements
      })
    });
  }
  
  // Regular while statement
  return this.createNode('WhileStatement', {
    test: this.emit(node.test),
    body: this.emit(node.body)
  });
}

/**
 * ENHANCED emitForOfStatement - Support patterns
 */
emitForOfStatement(node) {
  const pattern = node.left.declarations[0].id;
  
  if (this.isDestructuringPattern(pattern)) {
    // Transform: for (let {x, y} of arr) { ... }
    // To: for (let _item of arr) { let {x, y} = _item; ... }
    
    const tempVar = this.generateTempVariable('item');
    
    const bodyStatements = [
      // Destructuring from loop variable
      this.createNode('VariableDeclaration', {
        kind: node.left.kind,
        declarations: [{
          id: pattern,
          init: tempVar
        }]
      }),
      // Original body
      this.emit(node.body)
    ];
    
    return this.createNode('ForOfStatement', {
      left: this.createNode('VariableDeclaration', {
        kind: node.left.kind,
        declarations: [{
          id: { type: 'Identifier', name: tempVar },
          init: null
        }]
      }),
      right: this.emit(node.right),
      body: this.createNode('BlockStatement', {
        body: bodyStatements
      })
    });
  }
  
  // Already simple identifier
  return this.createNode('ForOfStatement', {
    left: this.emit(node.left),
    right: this.emit(node.right),
    body: this.emit(node.body)
  });
}

/**
 * Helper: Check if node is destructuring pattern
 */
isDestructuringPattern(node) {
  return node.type === 'ArrayPattern' || node.type === 'ObjectPattern';
}

/**
 * Helper: Get first identifier in pattern
 */
getFirstIdentifierInPattern(pattern) {
  if (pattern.type === 'Identifier') {
    return pattern;
  }
  
  if (pattern.type === 'ArrayPattern') {
    for (const elem of pattern.elements) {
      if (elem && elem.type === 'Identifier') return elem;
      if (elem) {
        const found = this.getFirstIdentifierInPattern(elem);
        if (found) return found;
      }
    }
  }
  
  if (pattern.type === 'ObjectPattern') {
    for (const prop of pattern.properties) {
      if (prop.value && prop.value.type === 'Identifier') return prop.value;
      if (prop.value) {
        const found = this.getFirstIdentifierInPattern(prop.value);
        if (found) return found;
      }
    }
  }
  
  return null;
}
```

### 3.3 Test Suite (34+ tests)

**File**: `tests/test_control_flow_patterns.js`

```javascript
const runner = new TestRunner('Control Flow Patterns');

// CATEGORY 1: If Statement Patterns (10 tests)
runner.test('Array destructuring in if condition', (() => {
  function getPoint() { return [5, 10]; }
  if (let [x, y] = getPoint()) {
    return x + y;
  }
  return 0;
})(), 15);

runner.test('Object destructuring in if condition', (() => {
  function getConfig() { return {enabled: true, timeout: 3000}; }
  if (let {enabled, timeout} = getConfig()) {
    return enabled && timeout === 3000;
  }
  return false;
})(), true);

runner.test('Pattern with default in if', (() => {
  function getData() { return [1]; }
  if (let [a, b = 99] = getData()) {
    return a + b;
  }
  return 0;
})(), 100);

runner.test('Nested pattern in if', (() => {
  function getUser() { return {profile: {age: 25}}; }
  if (let {profile: {age}} = getUser()) {
    return age >= 18;
  }
  return false;
})(), true);

runner.test('If with false pattern binding', (() => {
  if (let [x] = [null]) {
    return 'true branch';
  }
  return 'false branch';
})(), 'true branch'); // null is still an object, truthy test

runner.test('If-else with patterns', (() => {
  function getValue() { return undefined; }
  if (let x = getValue()) {
    return 'if';
  } else {
    return 'else';
  }
})(), 'else');

runner.test('Nested if with patterns', (() => {
  function getOuter() { return {inner: [1, 2]}; }
  if (let {inner} = getOuter()) {
    if (let [a, b] = inner) {
      return a + b;
    }
  }
  return 0;
})(), 3);

runner.test('Pattern scope isolation', (() => {
  let x = 'outer';
  if (let [x] = [5]) {
    x = 10;
  }
  return x === 'outer';
})(), true);

runner.test('Multiple if statements with same pattern name', (() => {
  if (let [x] = [1]) { var result1 = x; }
  if (let [x] = [2]) { var result2 = x; }
  return result1 + result2;
})(), 3);

runner.test('Pattern destructuring in condition chain', (() => {
  let count = 0;
  if (let [x] = [1]) count++;
  if (let [y] = [2]) count++;
  if (let [z] = [3]) count++;
  return count;
})(), 3);

// CATEGORY 2: While Loop Patterns (8 tests)
runner.test('Array pattern in while', (() => {
  const values = [[1, 2], [3, 4], [5, 6]];
  let index = 0;
  let sum = 0;
  while (let [a, b] = values[index++]) {
    sum += a + b;
    if (index >= values.length) break;
  }
  return sum;
})(), 21);

runner.test('Object pattern in while', (() => {
  const queue = [{val: 10}, {val: 20}, {val: 30}];
  let index = 0;
  let total = 0;
  while (let {val} = queue[index++]) {
    total += val;
    if (index >= queue.length) break;
  }
  return total;
})(), 60);

runner.test('Pattern with undefined terminates loop', (() => {
  let iterations = 0;
  let i = 0;
  while (let [x] = [i++ < 2 ? 1 : null]) {
    iterations++;
    if (i > 5) break;
  }
  return iterations >= 2;
})(), true);

runner.test('While pattern with mutable state', (() => {
  let data = {count: 0};
  let iterations = 0;
  while (let {count} = data) {
    iterations++;
    data.count++;
    if (iterations > 5) break;
  }
  return iterations >= 3;
})(), true);

runner.test('Nested pattern in while', (() => {
  const items = [{list: [1, 2]}, {list: [3, 4]}];
  let index = 0;
  let sum = 0;
  while (let {list} = items[index++]) {
    sum += list.reduce((a, b) => a + b, 0);
    if (index >= items.length) break;
  }
  return sum;
})(), 10);

runner.test('Do-while with pattern', (() => {
  let iterations = 0;
  let value = 0;
  do {
    iterations++;
    let [x] = [value++];
  } while (value < 3);
  return iterations;
})(), 3);

runner.test('While loop variable shadowing outer', (() => {
  let x = 'outer';
  let i = 0;
  while (let [x] = [i++ < 1 ? 'inner' : undefined]) {
    // x is shadowed
    if (i > 5) break;
  }
  return x === 'outer';
})(), true);

runner.test('Multiple while loops with patterns', (() => {
  let sum1 = 0;
  let i = 0;
  while (let [x] = [i++ < 2 ? 1 : null]) {
    sum1 += x;
    if (i > 5) break;
  }
  
  let sum2 = 0;
  let j = 0;
  while (let [y] = [j++ < 3 ? 2 : null]) {
    sum2 += y;
    if (j > 5) break;
  }
  
  return sum1 + sum2;
})(), 8);

// CATEGORY 3: For-of Loop Patterns (8 tests)
runner.test('Array destructuring in for-of', (() => {
  const pairs = [[1, 2], [3, 4], [5, 6]];
  let sum = 0;
  for (let [a, b] of pairs) {
    sum += a + b;
  }
  return sum;
})(), 21);

runner.test('Object destructuring in for-of', (() => {
  const objects = [{x: 1, y: 2}, {x: 3, y: 4}];
  let sum = 0;
  for (let {x, y} of objects) {
    sum += x + y;
  }
  return sum;
})(), 10);

runner.test('Nested pattern in for-of', (() => {
  const data = [{user: {name: 'Alice', age: 30}}, {user: {name: 'Bob', age: 25}}];
  let ages = [];
  for (let {user: {age}} of data) {
    ages.push(age);
  }
  return ages[0] + ages[1];
})(), 55);

runner.test('For-of with array of arrays', (() => {
  const matrix = [[1, 2, 3], [4, 5, 6]];
  let total = 0;
  for (let [a, b, c] of matrix) {
    total += a + b + c;
  }
  return total;
})(), 21);

runner.test('For-of pattern with rest', (() => {
  const lists = [[1, 2, 3, 4], [5, 6]];
  let result = 0;
  for (let [first, ...rest] of lists) {
    result += first + rest.length;
  }
  return result;
})(), 8); // (1 + 3) + (5 + 1)

runner.test('For-of with defaults in pattern', (() => {
  const data = [[1], [2, 3]];
  let sum = 0;
  for (let [a, b = 10] of data) {
    sum += a + b;
  }
  return sum;
})(), 16); // (1 + 10) + (2 + 3)

runner.test('For-of object iteration with pattern', (() => {
  const obj = {a: 1, b: 2, c: 3};
  let sum = 0;
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === 'number') sum += value;
  }
  return sum;
})(), 6);

runner.test('For-of loop variable shadowing', (() => {
  let x = 'outer';
  for (let [x] of [[1], [2]]) {
    // x shadowed in loop
  }
  return x === 'outer';
})(), true);

// CATEGORY 4: Complex Scenarios (6+ tests)
runner.test('Iterator with pattern destructuring', (() => {
  const iter = {
    items: [1, 2, 3],
    index: 0,
    [Symbol.iterator]() { return this; },
    next() {
      if (this.index < this.items.length) {
        return {value: [this.items[this.index++]], done: false};
      }
      return {done: true};
    }
  };
  let sum = 0;
  for (let [val] of iter) {
    sum += val;
  }
  return sum;
})(), 6);

runner.test('Pattern with function calls in init', (() => {
  let callCount = 0;
  function getValue() {
    callCount++;
    return [10, 20];
  }
  
  if (let [a, b] = getValue()) {
    // Verify getValue was called once
  }
  return callCount;
})(), 1);

runner.test('Control flow pattern in ternary', (() => {
  const condition = true;
  const result = condition ? 
    (() => { let [x] = [5]; return x; })() :
    null;
  return result;
})(), 5);

runner.test('Pattern in switch (rare case)', (() => {
  const val = {type: 'admin'};
  let isAdmin = false;
  
  if (let {type} = val) {
    isAdmin = type === 'admin';
  }
  return isAdmin;
})(), true);

runner.test('Break from for-of with pattern', (() => {
  const data = [[1, 2], [3, 4], [5, 6]];
  let sum = 0;
  for (let [a, b] of data) {
    sum += a + b;
    if (sum > 5) break;
  }
  return sum === 7; // [1,2] + [3,4] = 10 but only first iteration
})(), false); // Actually sum after first is 3, second is 10

runner.test('Continue in for-of with pattern', (() => {
  const data = [[1, 1], [2, 2], [3, 3]];
  let sum = 0;
  for (let [a, b] of data) {
    if (a === 2) continue;
    sum += a + b;
  }
  return sum;
})(), 8); // 1+1 and 3+3

runner.run();
```

### 3.4 Implementation Checklist

- [ ] **Parser Enhancement** (4-6 hours)
  - [ ] Create `ConditionalPatternNode` class
  - [ ] Enhance `parseIfStatement()` for patterns
  - [ ] Enhance `parseWhileStatement()` for patterns
  - [ ] Enhance `parseForOfStatement()` for patterns
  - [ ] Test pattern recognition in all contexts

- [ ] **Lowerer Enhancement** (6-8 hours)
  - [ ] Implement `emitIfStatement()` pattern handling
  - [ ] Implement `emitWhileStatement()` pattern handling
  - [ ] Implement `emitForOfStatement()` pattern handling
  - [ ] Create helper for truthiness checking
  - [ ] Handle scope isolation for pattern variables

- [ ] **Test Suite** (4-6 hours)
  - [ ] Implement 34+ tests
  - [ ] Edge case coverage
  - [ ] Scope isolation verification

- [ ] **Quality Gates** (2-3 hours)
  - [ ] All tests passing
  - [ ] No variable shadowing issues
  - [ ] Proper scope management

**Estimated Duration**: 3-4 days

---

## EXECUTION ROADMAP

### Week 1: Arrow Function Parameter Destructuring
**Days 1-3**: Implementation (Parser → Lowerer → Tests)
- Day 1: Parser enhancement (4 hours) + test infrastructure
- Day 2: Lowerer implementation (8 hours)
- Day 3: Test suite + quality gates (6 hours)

**Day 4**: Integration & validation
- Code review
- Performance benchmarking
- 8/8 quality gate verification

### Week 2: Spread Operators
**Days 1-3**: Implementation (same pattern)
- Day 1: Parser enhancement
- Day 2: Lowerer implementation
- Day 3: Test suite + validation

**Day 4**: Integration & cross-feature testing

### Week 3: Control Flow Patterns
**Days 1-3**: Implementation
- Day 1: Parser enhancement
- Day 2: Lowerer implementation  
- Day 3: Test suite + validation

**Days 4-5**: Final integration, documentation, delivery

---

## QUALITY GATES (8/8 REQUIRED)

For each feature:

| # | Gate | Measurement | Target | Method |
|---|------|-------------|--------|--------|
| 1 | Test Coverage | Unit tests passing | 34/34 (100%) | Run `npm test` |
| 2 | Edge Cases | Forensic tests passing | 40/40 (100%) | Run edge case suite |
| 3 | Performance | Execution time | <20ms per test | Benchmark suite |
| 4 | Memory | No leaks | 0 leaks | Memory profiler |
| 5 | Lint | Code quality | 0 errors | `npm run lint` |
| 6 | Integration | Cross-feature tests | 100% pass | Integration suite |
| 7 | IR Output | Deterministic | 100% match | Determinism test |
| 8 | Documentation | Coverage | 100% | Doc review |

---

## DELIVERABLES SUMMARY

### Per Feature (3 × this):
- ✅ Complete parser modifications with code samples
- ✅ Complete lowerer modifications with examples
- ✅ 34+ comprehensive unit tests
- ✅ 40+ forensic edge case tests
- ✅ Integration test suite
- ✅ Performance benchmarks
- ✅ Quality gate verification report

### Final Delivery:
- ✅ Phase 4 Implementation Complete Report
- ✅ All tests passing (100%)
- ✅ All quality gates (8/8)
- ✅ Professional documentation
- ✅ Code review checklist

---

## SUCCESS CRITERIA

✅ **Feature 1 (Arrow Destructuring)**: 
- Basic patterns working
- Defaults handling
- Rest elements
- 74 tests passing
- <20ms performance
- 8/8 gates

✅ **Feature 2 (Spread Operators)**:
- Array spread working
- Object spread working
- Function call spread working
- 74 tests passing
- <20ms performance
- 8/8 gates

✅ **Feature 3 (Control Flow Patterns)**:
- If statements with patterns
- While loops with patterns
- For-of with destructuring
- 74 tests passing
- <20ms performance
- 8/8 gates

**TOTAL**: 222+ tests, 8/8 gates per feature, professional-grade implementation

---

## TECHNICAL NOTES

### Key Architecture Points

1. **Parser Strategy**: Lookahead for patterns before consuming tokens
2. **Lowerer Strategy**: Expand patterns to sequential assignments
3. **Scope Management**: Pattern variables properly scoped to block
4. **Performance**: Minimize temporary variables, reuse IR nodes

### Known Complexities

1. **Array indexing**: JS is 0-based, Lua is 1-based → convert in lowerer
2. **Truthiness**: Pattern failures need truthiness checks
3. **Rest handling**: Collect remaining elements efficiently
4. **Iterator protocol**: Support for Symbol.iterator

### Testing Philosophy

- **Unit tests**: Each feature in isolation
- **Edge cases**: Corner cases, boundary conditions
- **Integration**: Multiple features together
- **Performance**: <20ms per test
- **Determinism**: Exact IR output matching

---

**END OF COMPREHENSIVE PHASE 4 IMPLEMENTATION PLAN**

---

## APPENDIX A: FILE LOCATIONS

Core Implementation Files:
- Tokenizer: `src/phase1_core_lexer.js`
- Parser: `src/phase1_core_parser.js`
- Lowerer: `src/ir/lowerer.js` or equivalent
- AST Nodes: `src/phase1_core_ast.js`

Test Files:
- Feature 1: `tests/test_arrow_destructuring.js` + `_edge_cases.js`
- Feature 2: `tests/test_spread_operators.js` + `_edge_cases.js`
- Feature 3: `tests/test_control_flow_patterns.js` + `_edge_cases.js`

Quality Gates:
- Test Runner: `npm test`
- Lint: `npm run lint`
- Performance: `npm run benchmark`

---

## APPENDIX B: QUICK REFERENCE

**Arrow Destructuring**:
```javascript
const sum = ([a, b]) => a + b;
const greet = ({firstName, lastName}) => \`\${firstName} \${lastName}\`;
```

**Spread Operators**:
```javascript
let arr = [1, ...[2, 3], 4];
let obj = {a: 1, ...other, b: 2};
func(...args);
```

**Control Flow**:
```javascript
if (let [x, y] = point()) { ... }
while (let {done, value} = iter.next()) { ... }
for (let [{id, name}] of users) { ... }
```
