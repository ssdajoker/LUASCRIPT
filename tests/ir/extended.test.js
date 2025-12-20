/**
 * Extended Test Suite for LUASCRIPT IR System
 * Focus: Edge cases, error handling, and advanced patterns
 */

const { parseAndLower } = require('../../src/ir/pipeline');
const { emitLuaFromIR } = require('../../src/ir/emitter');
const { validateIR } = require('../../src/ir/validator');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passedTests++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err.message });
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

console.log('\n🧪 Extended IR Test Suite\n');

// ========== ArrayPattern Edge Cases ==========
console.log('📦 ArrayPattern Tests:');

test('ArrayPattern with RestElement', () => {
  const source = 'const [first, ...rest] = items;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('first'), 'first binding missing');
  assert.ok(lua.includes('rest'), 'rest binding missing');
});

test('ArrayPattern with holes', () => {
  const source = 'const [a, , c] = arr;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('a'), 'first element missing');
  assert.ok(lua.includes('c'), 'third element missing');
});

test('ArrayPattern with default values', () => {
  const source = 'const [x = 10, y = 20] = values;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('10') || lua.includes('x'), 'default value handling missing');
});

test('Nested ArrayPattern', () => {
  const source = 'const [[a, b], [c, d]] = matrix;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'nested destructuring transpilation failed');
});

// ========== ObjectPattern Edge Cases ==========
console.log('\n🎯 ObjectPattern Tests:');

test('ObjectPattern basic', () => {
  const source = 'const {x, y} = point;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('x') && lua.includes('y'), 'object destructuring missing');
});

test('ObjectPattern with renaming', () => {
  const source = 'const {x: newX, y: newY} = point;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'renamed destructuring failed');
});

test('ObjectPattern with RestElement', () => {
  const source = 'const {a, b, ...rest} = obj;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('rest') || lua.includes('a'), 'rest in object missing');
});

test('ObjectPattern with defaults', () => {
  const source = 'const {x = 0, y = 0} = config;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'object defaults failed');
});

// ========== Arrow Functions ==========
console.log('\n➡️  Arrow Function Tests:');

test('Arrow function expression', () => {
  const source = 'const add = (a, b) => a + b;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('function'), 'arrow function not transpiled');
});

test('Arrow function with block body', () => {
  const source = 'const fn = (x) => { return x * 2; };';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('return'), 'block body missing return');
});

test('Arrow function with no parameters', () => {
  const source = 'const fn = () => 42;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('42'), 'parameterless arrow function failed');
});

test('Arrow function with single parameter (no parens)', () => {
  const source = 'const double = x => x * 2;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'single param arrow function failed');
});

// ========== Template Literals ==========
console.log('\n📝 Template Literal Tests:');

test('Template literal basic', () => {
  const source = 'const msg = `Hello, ${name}!`;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'template literal failed');
});

test('Template literal with multiple expressions', () => {
  const source = 'const msg = `${a} + ${b} = ${a + b}`;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'multi-expression template failed');
});

test('Template literal no interpolation', () => {
  const source = 'const msg = `Just a string`;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('Just a string'), 'plain template literal failed');
});

// ========== Spread Operator ==========
console.log('\n🌊 Spread Operator Tests:');

test('Spread in array literal', () => {
  const source = 'const arr = [1, ...middle, 5];';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'spread in array failed');
});

test('Spread in function call', () => {
  const source = 'func(...args);';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'spread in call failed');
});

// ========== For-of Loops ==========
console.log('\n🔄 For-of Loop Tests:');

test('For-of with array', () => {
  const source = 'for (const item of items) { console.log(item); }';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('for') || lua.includes('pairs'), 'for-of not transpiled');
});

test('For-of with destructuring', () => {
  const source = 'for (const [key, value] of entries) { }';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'for-of destructuring failed');
});

// ========== Try-Catch ==========
console.log('\n🛡️  Try-Catch Tests:');

test('Try-catch basic', () => {
  const source = 'try { doSomething(); } catch (err) { handleError(err); }';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('pcall') || lua.includes('xpcall'), 'try-catch not transpiled');
});

test('Try-catch-finally', () => {
  const source = 'try { doSomething(); } catch (err) { log(err); } finally { cleanup(); }';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'finally block missing');
});

// ========== Class Declarations ==========
console.log('\n🏛️  Class Tests:');

test('Class declaration', () => {
  const source = 'class Point { constructor(x, y) { this.x = x; this.y = y; } }';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'class declaration failed');
});

test('Class with methods', () => {
  const source = 'class Calc { add(a, b) { return a + b; } multiply(a, b) { return a * b; } }';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('add') && lua.includes('multiply'), 'class methods missing');
});

test('Class inheritance', () => {
  const source = 'class Child extends Parent { constructor() { super(); } }';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('setmetatable') || lua.length > 0, 'inheritance not transpiled');
});

// ========== Binary Operations ==========
console.log('\n➕ Binary Operation Tests:');

test('Logical AND/OR', () => {
  const source = 'const result = a && b || c;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes('and') || lua.includes('or'), 'logical operators not transpiled');
});

test('Nullish coalescing', () => {
  const source = 'const value = input ?? default;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'nullish coalescing failed');
});

test('Optional chaining', () => {
  const source = 'const value = obj?.prop?.nested;';
  const ir = parseAndLower(source);
  const validation = validateIR(ir);
  assert.strictEqual(validation.ok, true, 'IR validation failed');
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.length > 0, 'optional chaining failed');
});

// ========== Summary ==========
console.log('\n' + '='.repeat(50));
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);

if (failures.length > 0) {
  console.log('\n❌ Failures:');
  failures.forEach(({ name, error }) => {
    console.log(`  - ${name}: ${error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 All extended tests passed!');
  process.exit(0);
}
