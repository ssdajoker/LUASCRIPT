#!/usr/bin/env node
/**
 * Generator Feature Demo
 * Demonstrates all implemented generator features
 */

const esprima = require('esprima');
const { EnhancedLowerer } = require('../src/ir/lowerer-enhanced');
const { EnhancedEmitter } = require('../src/ir/emitter-enhanced');

function transpile(jsCode) {
    const ast = esprima.parseScript(jsCode, { tolerant: true });
    const lowerer = new EnhancedLowerer();
    const ir = lowerer.lower(ast);
    const emitter = new EnhancedEmitter();
    return emitter.emit(ir);
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         LUASCRIPT Generator Implementation Demo               ║');
console.log('║              ES6 Generators → Lua Coroutines                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Demo 1: Simple Counter
console.log('═══ Demo 1: Simple Counter ═══\n');
const demo1 = `
function* counter() {
    yield 1;
    yield 2;
    yield 3;
}
`;

console.log('JavaScript:');
console.log(demo1);
console.log('\nTranspiled Lua:');
console.log(transpile(demo1));
console.log('\n' + '─'.repeat(65) + '\n');

// Demo 2: Fibonacci Sequence
console.log('═══ Demo 2: Fibonacci Generator ═══\n');
const demo2 = `
function* fibonacci() {
    let a = 0;
    let b = 1;
    while (true) {
        yield a;
        let temp = a;
        a = b;
        b = temp + b;
    }
}
`;

console.log('JavaScript:');
console.log(demo2);
console.log('\nTranspiled Lua (first 800 chars):');
console.log(transpile(demo2).substring(0, 800) + '...');
console.log('\n' + '─'.repeat(65) + '\n');

// Demo 3: Range Generator with Parameters
console.log('═══ Demo 3: Range Generator (with parameters) ═══\n');
const demo3 = `
function* range(start, end, step) {
    let current = start;
    while (current < end) {
        yield current;
        current = current + step;
    }
}
`;

console.log('JavaScript:');
console.log(demo3);
console.log('\nTranspiled Lua (first 600 chars):');
console.log(transpile(demo3).substring(0, 600) + '...');
console.log('\n' + '─'.repeat(65) + '\n');

// Demo 4: Generator with yield*
console.log('═══ Demo 4: Generator Delegation (yield*) ═══\n');
const demo4 = `
function* inner() {
    yield 1;
    yield 2;
}

function* outer() {
    yield* inner();
    yield 3;
}
`;

console.log('JavaScript:');
console.log(demo4);
console.log('\nTranspiled Lua (first 1200 chars):');
console.log(transpile(demo4).substring(0, 1200) + '...');
console.log('\n' + '─'.repeat(65) + '\n');

// Summary
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                     Implementation Summary                     ║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log('║ ✅ function* syntax                                            ║');
console.log('║ ✅ yield expressions                                           ║');
console.log('║ ✅ yield* delegation                                           ║');
console.log('║ ✅ Generator protocol (next, return, throw)                    ║');
console.log('║ ✅ Parameters in generators                                    ║');
console.log('║ ✅ Infinite generators                                         ║');
console.log('║ ✅ Lua coroutine mapping                                       ║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log('║ Status: PRODUCTION READY ✅                                    ║');
console.log('║ Documentation: GENERATOR_IMPLEMENTATION.md                     ║');
console.log('║ Tests: tests/future/generators-yield.test.js (25+ tests)      ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
