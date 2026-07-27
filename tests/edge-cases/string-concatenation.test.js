/**
 * String Concatenation Edge Cases Test Suite
 * Comprehensive tests for string concatenation operator conversion
 */

const assert = require('assert');
const { parseAndLower } = require('../../src/ir/pipeline');
const { IREmitter } = require('../../src/ir/emitter');

describe('String Concatenation Edge Cases', () => {
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

    describe('Basic String Concatenation', () => {
        it('should convert string + string to ..', () => {
            const js = 'let msg = "Hello" + " World";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /"Hello" \.\. " World"/);
        });

        it('should preserve numeric addition', () => {
            const js = 'let sum = 5 + 3;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /5 \+ 3/);
            assert.doesNotMatch(result.code, /\.\./);
        });

        it('should convert string + number to ..', () => {
            const js = 'let msg = "Count: " + 42;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /"Count: " \.\. 42/);
        });

        it('should convert number + string to ..', () => {
            const js = 'let msg = 42 + " items";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /42 \.\. " items"/);
        });
    });

    describe('Chained Concatenation', () => {
        it('should handle triple concatenation', () => {
            const js = 'let full = name + " is " + age;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should handle quad concatenation', () => {
            const js = 'let msg = name + " is " + age + " years old";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should handle mixed numeric and string chains', () => {
            const js = 'let expr = 1 + 2 + " = " + (1 + 2);';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Template Literals', () => {
        it('should convert template literal to concatenation', () => {
            const js = 'let msg = `Hello ${name}`;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should handle multiple interpolations', () => {
            const js = 'let msg = `${first} ${middle} ${last}`;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle nested expressions in templates', () => {
            const js = 'let msg = `Sum is ${a + b}`;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });

    describe('Method Chaining with Strings', () => {
        it('should recognize .toString() as string-producing', () => {
            const js = 'let msg = obj.toString() + " suffix";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should recognize String() constructor', () => {
            const js = 'let msg = String(value) + " text";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should recognize .concat() method', () => {
            const js = 'let msg = str.concat(" more") + " text";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });
    });

    describe('Complex Expressions', () => {
        it('should handle parenthesized expressions', () => {
            const js = 'let msg = ("Hello" + " ") + "World";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should handle conditional string concatenation', () => {
            const js = 'let msg = cond ? "Yes" : "No" + " answer";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });

        it('should handle string in array', () => {
            const js = 'let arr = ["Hello" + " World"];';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should handle string in object', () => {
            const js = 'let obj = { msg: "Hello" + " World" };';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string concatenation', () => {
            const js = 'let msg = "" + value;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /"" \.\. value/);
        });

        it('should handle unicode strings', () => {
            const js = 'let msg = "Hello 👋" + " World 🌍";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should handle escaped strings', () => {
            const js = 'let msg = "Line 1\\n" + "Line 2";';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
            assert.match(result.code, /\.\./);
        });

        it('should handle very long concatenation chains', () => {
            const js = 'let msg = a + b + c + d + e + f + g + h + i + j;';
            const result = transpile(js);
            assert.strictEqual(result.success, true);
        });
    });
});

// Run tests if called directly
if (require.main === module) {
    console.log('🧪 Running String Concatenation Edge Cases Tests...\n');
    const tests = Object.values(module.exports);
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            test();
            passed++;
            console.log(`✅ ${test.name}`);
        } catch (error) {
            failed++;
            console.error(`❌ ${test.name}: ${error.message}`);
        }
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}
