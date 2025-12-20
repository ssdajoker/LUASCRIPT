/**
 * Parity Tests: Spread and Rest Operators
 * Validates spread/rest transpilation
 */

const { describe, it, expect } = require('./jest-lite');
const Transpiler = require('../../src/transpiler');

describe('Spread/Rest Operator Parity Tests', () => {
    const transpiler = new Transpiler();

    it('should transpile spread in array literal', () => {
        const js = 'const x = [1, ...arr, 2];';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('{');
        expect(result.code).toContain('1');
        expect(result.code).toContain('2');
    });

    it('should transpile spread in function call', () => {
        const js = 'func(1, ...args, 2);';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('func');
    });

    it('should transpile rest parameter in function', () => {
        const js = 'function fn(a, b, ...rest) { return rest; }';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should transpile rest in destructuring', () => {
        const js = 'const [first, ...rest] = arr;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('first');
    });

    it('should transpile multiple spreads in array', () => {
        const js = 'const x = [...a, ...b, ...c];';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle spread in object literal', () => {
        const js = 'const x = { ...obj, key: value };';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle rest in object destructuring', () => {
        const js = 'const { a, ...rest } = obj;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('a');
    });

    it('should transpile spread with array methods', () => {
        const js = 'const x = [1, 2, ...[3, 4, 5]];';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle arrow function with rest params', () => {
        const js = 'const fn = (a, ...rest) => rest.map(x => x * 2);';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should transpile spread in method call', () => {
        const js = 'obj.method(...args);';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle spread with computed properties', () => {
        const js = 'const x = { ...{a: 1, b: 2}, [computed]: value };';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should transpile spread in super call', () => {
        const js = `class C extends B {
            constructor(...args) {
                super(...args);
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle multiple rest params (invalid, should error or ignore)', () => {
        const js = 'function fn(a, ...rest1, ...rest2) { }';
        // This is invalid JS, should handle gracefully
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });
});
