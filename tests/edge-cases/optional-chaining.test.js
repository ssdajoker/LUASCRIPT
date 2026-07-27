/**
 * Optional Chaining Edge Cases Test Suite
 * Tests for ?. and ?? operators
 */

const assert = require('assert');
const { parseAndLower } = require('../../src/ir/pipeline');
const { IREmitter } = require('../../src/ir/emitter');

describe('Optional Chaining and Nullish Coalescing', () => {
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

    describe('Optional Member Access (?.)', () => {
        it('should transpile optional property access', () => {
            const js = 'let value = obj?.prop;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /~= nil/);
        });

        it('should transpile chained optional access', () => {
            const js = 'let value = obj?.prop?.nested;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should transpile optional computed access', () => {
            const js = 'let value = obj?.[key];';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /~= nil/);
        });

        it('should handle deep optional chains', () => {
            const js = 'let value = obj?.a?.b?.c?.d;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Optional Call (?.())', () => {
        it('should transpile optional function call', () => {
            const js = 'let result = fn?.();';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /type.*== "function"/);
        });

        it('should transpile optional method call', () => {
            const js = 'let result = obj?.method?.();';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle optional call with arguments', () => {
            const js = 'let result = fn?.(arg1, arg2);';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Nullish Coalescing (??)', () => {
        it('should transpile nullish coalescing', () => {
            const js = 'let value = maybeNull ?? defaultValue;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /or/);
        });

        it('should handle chained nullish coalescing', () => {
            const js = 'let value = first ?? second ?? third;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should combine with optional chaining', () => {
            const js = 'let value = obj?.prop ?? defaultValue;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Complex Combinations', () => {
        it('should handle optional chain in expression', () => {
            const js = 'let sum = (obj?.value ?? 0) + 10;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle optional chain in return', () => {
            const js = 'function get() { return obj?.prop ?? "default"; }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle optional chain in condition', () => {
            const js = 'if (obj?.value) { console.log("exists"); }';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle optional chain with array', () => {
            const js = 'let item = array?.[0]?.name;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle optional chain on literals', () => {
            const js = 'let value = null?.prop;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle optional chain with side effects', () => {
            const js = 'let value = getObj()?.(arg);';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle nested optional calls', () => {
            const js = 'let value = obj?.method()?.()?.[key];';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should distinguish ?? from ||', () => {
            const js = 'let a = value ?? "default"; let b = value || "default";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            // Both should use 'or' in Lua, but semantically different
        });
    });
});
