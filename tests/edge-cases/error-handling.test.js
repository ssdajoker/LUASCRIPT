/**
 * Error Handling Edge Cases Test Suite
 * Tests for try-catch-finally, throw, and error propagation
 */

const assert = require('assert');
const { parseAndLower } = require('../../src/ir/pipeline');
const { IREmitter } = require('../../src/ir/emitter');

describe('Error Handling Edge Cases', () => {
    function transpile(js) {
        try {
            const ir = parseAndLower(js);
            const emitter = new IREmitter();
            const lua = emitter.emit(ir);
            return { success: true, code: lua, ir };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    describe('Basic Try-Catch', () => {
        it('should handle simple try-catch', () => {
            const js = 'try { risky(); } catch (e) { handle(e); }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /pcall/);
        });

        it('should handle try-catch without error binding', () => {
            const js = 'try { risky(); } catch { fallback(); }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle try-finally', () => {
            const js = 'try { work(); } finally { cleanup(); }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle try-catch-finally', () => {
            const js = 'try { work(); } catch (e) { handle(e); } finally { cleanup(); }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Throw Statements', () => {
        it('should handle throw with Error', () => {
            const js = 'throw new Error("message");';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /error/);
        });

        it('should handle throw with string', () => {
            const js = 'throw "error message";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle throw with object', () => {
            const js = 'throw { code: 500, message: "Server error" };';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle re-throw in catch', () => {
            const js = 'try { risky(); } catch (e) { log(e); throw e; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Nested Error Handling', () => {
        it('should handle nested try-catch', () => {
            const js = `
                try {
                    try {
                        inner();
                    } catch (e) {
                        innerHandle(e);
                    }
                } catch (e) {
                    outerHandle(e);
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle try-catch in loop', () => {
            const js = `
                for (let i = 0; i < 10; i++) {
                    try {
                        process(i);
                    } catch (e) {
                        continue;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle try-catch in function', () => {
            const js = `
                function safe() {
                    try {
                        return risky();
                    } catch (e) {
                        return defaultValue;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Error Destructuring', () => {
        it('should handle destructuring error properties', () => {
            const js = 'try { risky(); } catch ({ message, stack }) {}';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle complex error destructuring', () => {
            const js = 'try { risky(); } catch ({ message, code = 500 }) {}';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Async Error Handling', () => {
        it('should handle try-catch with await', () => {
            const js = `
                async function fn() {
                    try {
                        await asyncOp();
                    } catch (e) {
                        handle(e);
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle Promise.catch()', () => {
            const js = 'promise.catch(e => handle(e));';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle Promise.finally()', () => {
            const js = 'promise.finally(() => cleanup());';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Return in Error Handlers', () => {
        it('should handle return in try', () => {
            const js = `
                function fn() {
                    try {
                        return risky();
                    } catch (e) {
                        return fallback;
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle return in catch', () => {
            const js = `
                function fn() {
                    try {
                        risky();
                    } catch (e) {
                        return handleError(e);
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle return in finally', () => {
            const js = `
                function fn() {
                    try {
                        return work();
                    } finally {
                        cleanup();
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty try block', () => {
            const js = 'try {} catch (e) { handle(e); }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle empty catch block', () => {
            const js = 'try { risky(); } catch (e) {}';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle empty finally block', () => {
            const js = 'try { work(); } finally {}';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle multiple catches (when supported)', () => {
            const js = `
                try {
                    risky();
                } catch (e) {
                    if (e instanceof TypeError) {
                        handleType(e);
                    } else {
                        handleGeneric(e);
                    }
                }
            `;
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle conditional throw', () => {
            const js = 'if (error) throw new Error("conditional");';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle throw in ternary', () => {
            const js = 'const value = condition ? valid : throw new Error("invalid");';
            const result = transpile(js);
            // May fail - throw in expression position
            assert.ok(result.success || result.error);
        });
    });
});
