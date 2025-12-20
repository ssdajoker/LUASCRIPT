/**
 * Parity Tests: Async/Await
 * Validates async/await transpilation to Lua coroutines
 */

const { describe, it, expect } = require('./jest-lite');
const Transpiler = require('../../src/transpiler');

describe('Async/Await Parity Tests', () => {
    const transpiler = new Transpiler();

    it('should transpile async function declaration', () => {
        const js = 'async function fetchData() { return 42; }';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('coroutine');
        expect(result.code).toContain('function fetchData');
    });

    it('should transpile await expression', () => {
        const js = `async function getData() {
            const x = await fetch();
            return x;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('coroutine.yield');
    });

    it('should handle async IIFE', () => {
        const js = `(async function() {
            return await Promise.resolve(42);
        })();`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('coroutine');
    });

    it('should transpile async arrow function', () => {
        const js = 'const fn = async (x) => x * 2;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should handle multiple awaits', () => {
        const js = `async function chain() {
            const a = await getA();
            const b = await getB();
            return a + b;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect((result.code.match(/coroutine\.yield/g) || []).length).toBeGreaterEqual(2);
    });

    it('should handle await in try-catch', () => {
        const js = `async function safe() {
            try {
                const data = await fetch();
            } catch (e) {
                console.log(e);
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('pcall');
        expect(result.code).toContain('coroutine');
    });

    it('should transpile async method in class', () => {
        const js = `class API {
            async getData() {
                return await fetch();
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('coroutine');
    });

    it('should handle nested async calls', () => {
        const js = `async function outer() {
            async function inner() {
                return await value;
            }
            return await inner();
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('coroutine');
    });

    it('should transpile async generator (if supported)', () => {
        const js = `async function* generator() {
            yield await value;
        }`;
        // May not be supported, should handle gracefully
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle await outside async context gracefully', () => {
        const js = 'const x = await something();';
        // Should either work or error gracefully
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });
});
