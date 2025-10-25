
const assert = require('assert');
const { CoreTranspiler } = require('../src/core_transpiler.js');

describe('Mathematical Operators', () => {
    let transpiler;

    beforeEach(() => {
        transpiler = new CoreTranspiler();
    });

    it('should transpile the product operator ∏', () => {
        const jsCode = 'const result = ∏(i, 1, 10, i * 2)';
        const expectedLuaCode = 'local result = math.product(i, 1, 10, i * 2)';
        const { code } = transpiler.transpile(jsCode);
        assert.strictEqual(code.trim(), expectedLuaCode);
    });

    it('should transpile the summation operator ∑', () => {
        const jsCode = 'const result = ∑(i, 1, 10, i * 2)';
        const expectedLuaCode = 'local result = math.summation(i, 1, 10, i * 2)';
        const { code } = transpiler.transpile(jsCode);
        assert.strictEqual(code.trim(), expectedLuaCode);
    });

    it('should transpile the integral operator ∫', () => {
        const jsCode = 'const result = ∫(x, 0, 1, x * x)';
        const expectedLuaCode = 'local result = math.integral(x, 0, 1, x * x)';
        const { code } = transpiler.transpile(jsCode);
        assert.strictEqual(code.trim(), expectedLuaCode);
    });
});
