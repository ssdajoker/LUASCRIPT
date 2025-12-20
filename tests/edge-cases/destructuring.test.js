/**
 * Destructuring Edge Cases Test Suite
 * Tests for array and object destructuring patterns
 */

const assert = require('assert');
const { parseAndLower } = require('../../src/ir/pipeline');
const { IREmitter } = require('../../src/ir/emitter');

describe('Destructuring Edge Cases', () => {
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

    describe('Array Destructuring', () => {
        it('should handle basic array destructuring', () => {
            const js = 'const [a, b] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle nested array destructuring', () => {
            const js = 'const [a, [b, c]] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle array destructuring with rest', () => {
            const js = 'const [first, ...rest] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle array destructuring with defaults', () => {
            const js = 'const [a = 1, b = 2] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle array destructuring with holes', () => {
            const js = 'const [a, , c] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle array destructuring in function params', () => {
            const js = 'function fn([a, b]) { return a + b; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Object Destructuring', () => {
        it('should handle basic object destructuring', () => {
            const js = 'const { a, b } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle nested object destructuring', () => {
            const js = 'const { a, b: { c } } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle object destructuring with rename', () => {
            const js = 'const { a: x, b: y } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle object destructuring with defaults', () => {
            const js = 'const { a = 1, b = 2 } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle object destructuring with rest', () => {
            const js = 'const { a, ...rest } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle computed property destructuring', () => {
            const js = 'const { [key]: value } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Mixed Destructuring', () => {
        it('should handle array destructuring in object', () => {
            const js = 'const { arr: [a, b] } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle object destructuring in array', () => {
            const js = 'const [{ a, b }] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle deeply nested destructuring', () => {
            const js = 'const { a: { b: [c, { d }] } } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Destructuring in Different Contexts', () => {
        it('should handle destructuring in for-of', () => {
            const js = 'for (const [key, value] of entries) {}';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle destructuring in catch', () => {
            const js = 'try {} catch ({ message, stack }) {}';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle destructuring assignment', () => {
            const js = '([a, b] = array);';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle destructuring with default function params', () => {
            const js = 'function fn({ a = 1, b = 2 } = {}) {}';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty array destructuring', () => {
            const js = 'const [] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle empty object destructuring', () => {
            const js = 'const {} = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle destructuring with very long chains', () => {
            const js = 'const [a, b, c, d, e, f, g, h, i, j] = array;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle destructuring with function calls', () => {
            const js = 'const [a, b] = getArray();';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle destructuring with expressions as defaults', () => {
            const js = 'const { a = computeDefault() } = obj;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });
});
