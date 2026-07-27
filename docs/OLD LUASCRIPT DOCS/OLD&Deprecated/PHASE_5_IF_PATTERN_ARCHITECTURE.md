# PHASE 5 IF-PATTERN ARCHITECTURAL DESIGN

**Date**: February 4, 2026  
**Feature**: If-Statement Pattern Destructuring  
**Current Status**: 18% (2/11 tests passing)  
**Target**: 100% (11/11 tests passing)

---

## ARCHITECTURAL ANALYSIS

### Current Implementation Limitations

**parseIfStatement()** (Lines 290-309):
- Only calls `parseExpression()` for test condition
- Treats entire condition as single expression
- No special handling for assignment with patterns
- Returns simple IfStatementNode with test/consequent/alternate

**lowerIfStatement()** (Lines 308-317):
- Simply lowers test expression
- No pattern detection or handling
- Variables from patterns not properly scoped to consequent

### Root Cause Analysis

The failing test cases all use **assignment expressions with pattern left-hand sides**:
```javascript
if ([x, y] = data) { x + y; }
//  ^^^^^^^ Pattern LHS
//          ^ Assignment operator
//            ^^^^ Value RHS
```

JavaScript semantics:
1. Assignment expression evaluates to the RHS value
2. Pattern destructuring binds variables from RHS
3. Variables are in scope for subsequent code
4. Truthiness check uses the RHS value

Current implementation:
- Parser creates generic AssignmentExpression AST
- Lowerer doesn't recognize pattern in assignment
- Variables not properly extracted and scoped

---

## COMPREHENSIVE SOLUTION ARCHITECTURE

### Approach: **Lowerer-Based Pattern Detection** ✅

**Rationale**:
1. Parser already creates correct AssignmentExpression AST
2. Pattern nodes (ArrayPattern, ObjectPattern) already exist
3. For-of uses lowerer-based approach successfully
4. Maintains clean separation: parser = syntax, lowerer = semantics
5. Easier to handle scope and variable extraction

### Implementation Strategy

#### Phase 1: Pattern Detection in Lowerer ✅

**Location**: `src/ir/lowerer.js` - `lowerIfStatement()` method (line 308)

**Logic**:
```javascript
lowerIfStatement(node) {
  // Step 1: Check if test is AssignmentExpression with pattern
  const patternInfo = this.detectIfPatternAssignment(node.test);
  
  if (patternInfo) {
    // Pattern detected: if ([x, y] = data) { ... }
    return this.lowerIfStatementWithPattern(node, patternInfo);
  }
  
  // Standard if-statement (current implementation)
  const testRef = this.lowerExpression(node.test);
  const consequent = this.ensureBlock(node.consequent);
  const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;
  return this.builder.ifStatement(testRef, consequent.id, alternate ? alternate.id : null);
}
```

#### Phase 2: Pattern Detection Helper ✅

**New Method**: `detectIfPatternAssignment(testExpr)`

**Purpose**: Identify if test expression is assignment with pattern

**Logic**:
```javascript
detectIfPatternAssignment(expr) {
  // Handle simple case: ([x, y] = data)
  if (expr.type === 'AssignmentExpression' && 
      (expr.left.type === 'ArrayPattern' || expr.left.type === 'ObjectPattern')) {
    return {
      pattern: expr.left,
      value: expr.right,
      operator: expr.operator,
      isSimple: true
    };
  }
  
  // Handle logical operators: data && ({x} = data)
  if (expr.type === 'LogicalExpression') {
    // Check if right side has pattern
    const rightPattern = this.detectIfPatternAssignment(expr.right);
    if (rightPattern) {
      return {
        ...rightPattern,
        isSimple: false,
        logicalOp: expr.operator,
        logicalLeft: expr.left
      };
    }
  }
  
  // Handle negation: !([x] = arr)
  if (expr.type === 'UnaryExpression' && expr.operator === '!') {
    const innerPattern = this.detectIfPatternAssignment(expr.argument);
    if (innerPattern) {
      return {
        ...innerPattern,
        isSimple: false,
        negated: true
      };
    }
  }
  
  return null;
}
```

#### Phase 3: Lowering with Pattern Support ✅

**New Method**: `lowerIfStatementWithPattern(node, patternInfo)`

**Approach for Simple Pattern** (`if ([x, y] = data) { ... }`):
```javascript
lowerIfStatementWithPattern(node, patternInfo) {
  if (patternInfo.isSimple) {
    // Step 1: Lower the RHS value
    const valueRef = this.lowerExpression(patternInfo.value);
    
    // Step 2: Create temp variable for the value
    const tempVar = this.builder.createTempVar('_if_val');
    const assignTemp = this.builder.assignment(tempVar, valueRef);
    
    // Step 3: Extract pattern bindings
    const bindings = this.extractPatternBindings(
      patternInfo.pattern,
      tempVar
    );
    
    // Step 4: Modify consequent to include bindings at start
    const consequent = this.ensureBlock(node.consequent);
    const modifiedConsequent = this.builder.blockStatement([
      ...bindings,
      ...consequent.body
    ]);
    
    // Step 5: Use temp variable as test condition
    const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;
    
    return this.builder.ifStatement(
      tempVar.id,
      modifiedConsequent.id,
      alternate ? alternate.id : null
    );
  }
  
  // Handle complex cases (logical ops, negation)
  return this.lowerComplexIfPattern(node, patternInfo);
}
```

#### Phase 4: Pattern Binding Extraction ✅

**Method**: `extractPatternBindings(pattern, sourceRef)`

**Purpose**: Convert pattern into variable declarations

**Example**:
```javascript
// Input: pattern = [x, y], sourceRef = _if_val
// Output: [
//   const x = _if_val[0];
//   const y = _if_val[1];
// ]

extractPatternBindings(pattern, sourceRef) {
  const bindings = [];
  
  if (pattern.type === 'ArrayPattern') {
    pattern.elements.forEach((element, index) => {
      if (!element) return; // Skip holes
      
      if (element.type === 'Identifier') {
        const access = this.builder.memberExpression(sourceRef, index);
        const binding = this.builder.variableDeclaration(
          'const',
          element.name,
          access
        );
        bindings.push(binding);
      } else if (element.type === 'RestElement') {
        const sliceCall = this.builder.callExpression(
          this.builder.memberExpression(sourceRef, 'slice'),
          [this.builder.literal(index)]
        );
        const binding = this.builder.variableDeclaration(
          'const',
          element.argument.name,
          sliceCall
        );
        bindings.push(binding);
      } else {
        // Nested pattern - recurse
        const access = this.builder.memberExpression(sourceRef, index);
        const nested = this.extractPatternBindings(element, access);
        bindings.push(...nested);
      }
    });
  } else if (pattern.type === 'ObjectPattern') {
    pattern.properties.forEach(prop => {
      const key = prop.key.name;
      const valueName = prop.value.type === 'Identifier' 
        ? prop.value.name 
        : key;
      
      const access = this.builder.memberExpression(sourceRef, key);
      const binding = this.builder.variableDeclaration(
        'const',
        valueName,
        access
      );
      bindings.push(binding);
    });
  }
  
  return bindings;
}
```

#### Phase 5: Complex Pattern Handling ✅

**Logical AND**: `if (data && ({x} = data))`
```javascript
// Strategy: Extract pattern from right side of &&
// Bindings only execute if left side is truthy

lowerComplexIfPattern(node, patternInfo) {
  if (patternInfo.logicalOp === '&&') {
    // Lower left condition
    const leftRef = this.lowerExpression(patternInfo.logicalLeft);
    
    // Create nested if:
    // if (data) {
    //   if (({x} = data)) { <consequent with x> }
    // }
    const innerIf = this.lowerIfStatementWithPattern(
      {
        test: { 
          type: 'AssignmentExpression',
          left: patternInfo.pattern,
          right: patternInfo.value,
          operator: '='
        },
        consequent: node.consequent,
        alternate: null
      },
      { ...patternInfo, isSimple: true }
    );
    
    const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;
    
    return this.builder.ifStatement(
      leftRef,
      innerIf.id,
      alternate ? alternate.id : null
    );
  }
  
  // Similar logic for || and negation
}
```

---

## IMPLEMENTATION PLAN

### Step 1: Add Pattern Detection Helper (10 min)
- Location: `src/ir/lowerer.js` after `lowerIfStatement()`
- Method: `detectIfPatternAssignment(expr)`
- Tests: Simple pattern, logical ops, negation

### Step 2: Add Pattern Binding Extraction (15 min)
- Method: `extractPatternBindings(pattern, sourceRef)`
- Handle: ArrayPattern, ObjectPattern, nested, rest
- Tests: All pattern types

### Step 3: Modify lowerIfStatement() (5 min)
- Add pattern detection check
- Delegate to new method if pattern found
- Preserve existing behavior for non-pattern cases

### Step 4: Add Pattern-Specific Lowering (20 min)
- Method: `lowerIfStatementWithPattern(node, patternInfo)`
- Handle: Simple patterns first
- Tests: Basic array/object patterns

### Step 5: Add Complex Pattern Support (15 min)
- Method: `lowerComplexIfPattern(node, patternInfo)`
- Handle: Logical operators, negation
- Tests: All complex cases

### Step 6: Comprehensive Testing (10 min)
- Run all 11 if-pattern tests
- Debug failures
- Validate edge cases

**Total Estimated Time**: 75 minutes

---

## EDGE CASES TO HANDLE

### 1. Falsy Values ✅
```javascript
if ([a, b] = [0, false]) { a + b; }
// Assignment returns [0, false] (truthy array)
// Variables a=0, b=false (falsy values)
// Condition is truthy because array is truthy
```

### 2. Null/Undefined ✅
```javascript
if ([x] = null) { x; }
// Assignment returns null (falsy)
// Pattern destructuring would throw at runtime
// Condition is falsy, consequent doesn't execute
```

### 3. Nested Patterns ✅
```javascript
if (({user: {name}}) = data) { name; }
// Recursive extraction needed
// Temp: _if_val = data
// user = _if_val.user
// name = user.name
```

### 4. Default Values ✅
```javascript
if ([a = 10, b = 20] = data) { a + b; }
// Parser already handles defaults in pattern
// Extraction uses default if element is undefined
```

### 5. Else-If Chains ✅
```javascript
if (false) { } else if (({x} = data)) { x; }
// Alternate is another IfStatement
// Recursive lowering handles it
```

---

## TESTING STRATEGY

### Test Progression

**Level 1: Simple Patterns** (3 tests)
1. `if ([x, y] = data) { x + y; }`
2. `if ({x} = data) { x; }`
3. `if ([a, b] = data) { a + b; }` (falsy values)

**Level 2: Nested Patterns** (2 tests)
4. `if (({user: {name}}) = data) { name; }`
5. `if (([a = 10, b = 20] = data)) { a + b; }` (defaults)

**Level 3: Logical Operators** (3 tests)
6. `if (!([a] = arr)) { 'error'; }`
7. `if (data && ({x} = data)) { x; }`
8. `if (({x} = d1) || ({x} = d2)) { x; }`

**Level 4: Control Flow** (3 tests)
9. `if (({a} = data)) { a; } else { 'no'; }`
10. `if (false) { } else if (({x} = data)) { x; }`
11. `if (({x, y} = data)) { x + y; }`

### Validation Approach

After each implementation step:
1. Run specific test subset
2. Check AST generation
3. Validate IR output
4. Debug failures immediately
5. Iterate until all pass

---

## SUCCESS CRITERIA

✅ All 11 if-pattern tests passing (100%)  
✅ No regression in existing tests  
✅ Performance <1ms per test  
✅ Clean, maintainable code  
✅ Comprehensive edge case handling  
✅ Championship-level quality

---

*Architecture Design Complete - Ready for Implementation*
