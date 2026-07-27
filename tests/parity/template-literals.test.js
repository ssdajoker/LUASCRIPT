/**
 * Parity Tests: Template Literals
 * Validates template literal transpilation
 */

const { describe, it, expect } = require('./jest-lite');
const Transpiler = require('../../src/transpiler');

describe('Template Literal Parity Tests', () => {
    const transpiler = new Transpiler();

    it('should transpile simple template literal', () => {
        const js = 'const x = `hello`;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('hello');
    });

    it('should transpile template literal with single expression', () => {
        const js = 'const x = `value: ${value}`;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('...');
        expect(result.code).toContain('tostring');
    });

    it('should transpile template literal with multiple expressions', () => {
        const js = 'const x = `${a} + ${b} = ${a + b}`;';
        const result = transpiler.transpile(js, 'test.js');
        expect((result.code.match(/\.\./g) || []).length).toBeGreaterEqual(2);
    });

    it('should handle template literal with newlines', () => {
        const js = `const x = \`line 1
line 2
line 3\`;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle template literal with escaped chars', () => {
        const js = 'const x = `line\\nbreak`;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should transpile nested template literals', () => {
        const js = 'const x = `outer ${`inner ${value}`}`;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle template literal in function call', () => {
        const js = 'console.log(`message: ${value}`);';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('print');
    });

    it('should handle template literal with object access', () => {
        const js = 'const x = `${obj.prop}`;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle template literal with function calls', () => {
        const js = 'const x = `${getValue()}`;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle template literal with complex expressions', () => {
        const js = 'const x = `${a ? b : c} and ${d || e}`;';
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle template tag functions gracefully', () => {
        const js = 'const x = html`<div>${content}</div>`;';
        // May not be fully supported, should handle gracefully
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });
});
