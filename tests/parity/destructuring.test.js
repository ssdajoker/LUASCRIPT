/**
 * Parity Tests: Destructuring
 * Validates destructuring assignment transpilation
 */

const { describe, it, expect } = require('./jest-lite');
const Transpiler = require('../../src/transpiler');

describe('Destructuring Parity Tests', () => {
    const transpiler = new Transpiler();

    it('should transpile array destructuring', () => {
        const js = 'const [a, b] = [1, 2];';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('a');
        expect(result.code).toContain('b');
    });

    it('should handle array destructuring with defaults', () => {
        const js = 'const [x = 10, y = 20] = arr;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('x');
        expect(result.code).toContain('y');
    });

    it('should transpile object destructuring', () => {
        const js = 'const { name, age } = person;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('name');
        expect(result.code).toContain('age');
    });

    it('should handle object destructuring with renaming', () => {
        const js = 'const { firstName: first, lastName: last } = person;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('first');
        expect(result.code).toContain('last');
    });

    it('should handle nested array destructuring', () => {
        const js = 'const [a, [b, c]] = [1, [2, 3]];';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('a');
        expect(result.code).toContain('b');
        expect(result.code).toContain('c');
    });

    it('should handle nested object destructuring', () => {
        const js = 'const { user: { name, age } } = data;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('name');
    });

    it('should handle rest elements in array destructuring', () => {
        const js = 'const [first, ...rest] = items;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('first');
    });

    it('should handle rest elements in object destructuring', () => {
        const js = 'const { x, ...rest } = obj;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('x');
    });

    it('should transpile destructuring in parameters', () => {
        const js = 'function greet({ name, age }) { return name; }';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('greet');
    });

    it('should handle destructuring assignment to existing vars', () => {
        const js = 'let a, b; [a, b] = [1, 2];';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle complex mixed destructuring', () => {
        const js = `const { items: [first, ...rest], meta: { count } } = response;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle destructuring with computed properties', () => {
        const js = 'const { [key]: value } = obj;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should transpile for-of with destructuring', () => {
        const js = 'for (const [key, val] of entries) { console.log(key); }';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('for');
    });

    it('should handle skip pattern in array destructuring', () => {
        const js = 'const [a, , c] = [1, 2, 3];';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('a');
        expect(result.code).toContain('c');
    });
});
