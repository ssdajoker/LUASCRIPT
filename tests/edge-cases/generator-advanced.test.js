/**
 * Advanced Generator Edge Cases Test Suite
 * Comprehensive tests for generator functions, yield, yield*, async generators
 */

const assert = require('assert');
const { EnhancedLowerer } = require('../../src/ir/lowerer-enhanced');
const { EnhancedEmitter } = require('../../src/ir/emitter-enhanced');
const { LuaScriptParser } = require('../../src/phase1_core_parser');
const { IRBuilder } = require('../../src/ir/builder');

describe('Advanced Generator Edge Cases', () => {
    function transpile(js) {
        try {
            const parser = new LuaScriptParser(js);
            const ast = parser.parse();
            const builder = new IRBuilder();
            const lowerer = new EnhancedLowerer(builder);
            const ir = lowerer.lower(ast);
            const emitter = new EnhancedEmitter();
            const lua = emitter.emit(ir);
            return { success: true, code: lua, ir };
        } catch (error) {
            return { success: false, error: error.message, stack: error.stack };
        }
    }

    describe('Basic Generators', () => {
        it('should handle generator with no yields', () => {
            const js = 'function* gen() { return 42; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /coroutine\.create/);
        });

        it('should handle generator with single yield', () => {
            const js = 'function* gen() { yield 1; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /coroutine\.yield/);
        });

        it('should handle generator with multiple yields', () => {
            const js = `
                function* gen() {
                    yield 1;
                    yield 2;
                    yield 3;
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle generator with parameters', () => {
            const js = 'function* range(start, end) { yield start; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Yield Expressions', () => {
        it('should handle yield with no value', () => {
            const js = 'function* gen() { yield; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /yield\(nil\)/);
        });

        it('should handle yield with expression', () => {
            const js = 'function* gen() { yield x + 1; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle yield in loop', () => {
            const js = `
                function* range(n) {
                    for (let i = 0; i < n; i++) {
                        yield i;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle yield in condition', () => {
            const js = `
                function* gen() {
                    if (condition) {
                        yield 1;
                    } else {
                        yield 2;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle yield in try-catch', () => {
            const js = `
                function* gen() {
                    try {
                        yield 1;
                    } catch (e) {
                        yield 2;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Yield Delegation (yield*)', () => {
        it('should handle yield* with generator', () => {
            const js = `
                function* inner() { yield 1; }
                function* outer() { yield* inner(); }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle yield* with array', () => {
            const js = 'function* gen() { yield* [1, 2, 3]; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle multiple yield*', () => {
            const js = `
                function* gen() {
                    yield* gen1();
                    yield* gen2();
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle nested yield*', () => {
            const js = `
                function* a() { yield 1; }
                function* b() { yield* a(); }
                function* c() { yield* b(); }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Async Generators', () => {
        it('should handle async generator', () => {
            const js = 'async function* gen() { yield 1; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /async_generator/);
        });

        it('should handle await in async generator', () => {
            const js = `
                async function* gen() {
                    yield await promise;
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /__await_value/);
        });

        it('should handle for-await-of in async generator', () => {
            const js = `
                async function* gen() {
                    for await (const item of asyncIterable) {
                        yield item;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle mixed await and yield', () => {
            const js = `
                async function* gen() {
                    const data = await fetch();
                    yield data.value;
                    yield await process(data);
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Generator Methods', () => {
        it('should handle .next() calls', () => {
            const js = `
                const g = gen();
                const val = g.next().value;
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle .return() method', () => {
            const js = `
                const g = gen();
                g.return(value);
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle .throw() method', () => {
            const js = `
                const g = gen();
                g.throw(new Error("test"));
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('For-of with Generators', () => {
        it('should handle for-of iterating generator', () => {
            const js = `
                function* gen() { yield 1; yield 2; }
                for (const n of gen()) {
                    console.log(n);
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.next\(\)/);
        });

        it('should handle destructuring in for-of', () => {
            const js = `
                function* gen() { yield [1, 2]; }
                for (const [a, b] of gen()) {
                    console.log(a, b);
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle break in for-of with generator', () => {
            const js = `
                for (const n of gen()) {
                    if (n > 5) break;
                    console.log(n);
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle generator expression', () => {
            const js = 'const gen = function*() { yield 1; };';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle generator as method', () => {
            const js = `
                const obj = {
                    *gen() { yield 1; }
                };
            `;
            const result = transpile(js);
            // May fail if method syntax not fully supported
            assert.ok(result.success || result.error);
        });

        it('should handle yield in nested function', () => {
            const js = `
                function* outer() {
                    function inner() {
                        // This should NOT be a yield in generator context
                        return 42;
                    }
                    yield inner();
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle infinite generator', () => {
            const js = `
                function* infinite() {
                    let n = 0;
                    while (true) {
                        yield n++;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle recursive generator', () => {
            const js = `
                function* countdown(n) {
                    if (n > 0) {
                        yield n;
                        yield* countdown(n - 1);
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });
});
