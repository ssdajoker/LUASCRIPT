/**
 * Parity Tests: Control Flow
 * Validates advanced control flow transpilation
 */

const { describe, it, expect } = require('./jest-lite');
const Transpiler = require('../../src/transpiler');

describe('Control Flow Parity Tests', () => {
    const transpiler = new Transpiler();

    it('should transpile for-of loop', () => {
        const js = 'for (const item of items) { console.log(item); }';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('for');
        expect(result.code).toContain('ipairs');
    });

    it('should transpile for-in loop', () => {
        const js = 'for (const key in obj) { console.log(key); }';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('for');
        expect(result.code).toContain('pairs');
    });

    it('should transpile try-catch-finally', () => {
        const js = `try {
            risky();
        } catch (e) {
            handle(e);
        } finally {
            cleanup();
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('pcall');
    });

    it('should transpile try-catch without finally', () => {
        const js = `try {
            risky();
        } catch (e) {
            handle(e);
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('pcall');
    });

    it('should transpile try-finally without catch', () => {
        const js = `try {
            risky();
        } finally {
            cleanup();
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('pcall');
    });

    it('should transpile throw statement', () => {
        const js = 'throw new Error("message");';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('error');
    });

    it('should transpile switch statement', () => {
        const js = `switch (value) {
            case 1: console.log("one"); break;
            case 2: console.log("two"); break;
            default: console.log("other");
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('if');
    });

    it('should handle continue in loops', () => {
        const js = `for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) continue;
            console.log(i);
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('for');
    });

    it('should handle break in loops', () => {
        const js = `while (true) {
            if (condition) break;
            process();
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('while');
        expect(result.code).toContain('break');
    });

    it('should transpile labeled statements', () => {
        const js = `outer: for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (j === 5) break outer;
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle nested try-catch', () => {
        const js = `try {
            try {
                risky1();
            } catch (e1) {
                risky2();
            }
        } catch (e2) {
            handle(e2);
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect((result.code.match(/pcall/g) || []).length).toBeGreaterEqual(2);
    });

    it('should handle conditional (ternary) operator', () => {
        const js = 'const x = condition ? valueA : valueB;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('and');
        expect(result.code).toContain('or');
    });

    it('should handle logical operators with short-circuit', () => {
        const js = 'const x = a && b || c && d;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('and');
        expect(result.code).toContain('or');
    });

    it('should transpile do-while loop', () => {
        const js = `do {
            process();
        } while (condition);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('repeat');
        expect(result.code).toContain('until');
    });

    it('should handle for-of with destructuring', () => {
        const js = `for (const {id, name} of items) {
            console.log(id, name);
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });
});
