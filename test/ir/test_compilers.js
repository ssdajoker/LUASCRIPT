
/**
 * Compiler Tests
 */

const assert = require('assert');
const { JSToIRCompiler, IRToJSGenerator, IRToLuaGenerator } = require('../../src/compilers');
const { IRValidator } = require('../../src/ir');

describe('Compiler Tests', () => {
    describe('JavaScript to IR', () => {
        const compiler = new JSToIRCompiler();

        it('should compile variable declarations', () => {
            const jsCode = 'let x = 5;';
            const ir = compiler.compile(jsCode);
            
            assert.strictEqual(ir.kind, 'Program');
            assert.strictEqual(ir.body.length, 1);
            assert.strictEqual(ir.body[0].kind, 'VarDecl');
            assert.strictEqual(ir.body[0].name, 'x');
        });

        it('should compile function declarations', () => {
            const jsCode = 'function add(a, b) { return a + b; }';
            const ir = compiler.compile(jsCode);
            
            assert.strictEqual(ir.body[0].kind, 'FunctionDecl');
            assert.strictEqual(ir.body[0].name, 'add');
            assert.strictEqual(ir.body[0].parameters.length, 2);
        });

        it('should compile if statements', () => {
            const jsCode = 'if (x > 0) { console.log("positive"); }';
            const ir = compiler.compile(jsCode);
            
            assert.strictEqual(ir.body[0].kind, 'If');
            assert.ok(ir.body[0].condition);
            assert.ok(ir.body[0].consequent);
        });

        it('should compile for loops', () => {
            const jsCode = 'for (let i = 0; i < 10; i++) { console.log(i); }';
            const ir = compiler.compile(jsCode);
            
            assert.strictEqual(ir.body[0].kind, 'For');
            assert.ok(ir.body[0].init);
            assert.ok(ir.body[0].condition);
            assert.ok(ir.body[0].update);
        });

        it('should compile binary expressions', () => {
            const jsCode = 'let result = 2 + 3;';
            const ir = compiler.compile(jsCode);
            
            const init = ir.body[0].init;
            assert.strictEqual(init.kind, 'BinaryOp');
            assert.strictEqual(init.operator, '+');
        });

        it('should compile arrow functions', () => {
            const jsCode = 'const add = (a, b) => a + b;';
            const ir = compiler.compile(jsCode);
            
            const init = ir.body[0].init;
            assert.strictEqual(init.kind, 'FunctionDecl');
            assert.strictEqual(init.name, null); // anonymous
        });

        it('should compile arrays and objects', () => {
            const jsCode = `
                let arr = [1, 2, 3];
                let obj = { name: "John", age: 30 };
            `;
            const ir = compiler.compile(jsCode);
            
            assert.strictEqual(ir.body[0].init.kind, 'ArrayLiteral');
            assert.strictEqual(ir.body[1].init.kind, 'ObjectLiteral');
        });
    });

    describe('IR to JavaScript', () => {
        const compiler = new JSToIRCompiler();
        const generator = new IRToJSGenerator();

        it('should generate variable declarations', () => {
            const jsCode = 'let x = 5;';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('let x = 5'));
        });

        it('should generate function declarations', () => {
            const jsCode = 'function add(a, b) { return a + b; }';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('function add'));
            assert.ok(output.includes('return'));
        });

        it('should generate if statements', () => {
            const jsCode = 'if (x > 0) { y = 1; }';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('if'));
            assert.ok(output.includes('x > 0'));
        });

        it('should generate for loops', () => {
            const jsCode = 'for (let i = 0; i < 10; i++) { sum += i; }';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('for'));
            assert.ok(output.includes('i < 10'));
        });
    });

    describe('IR to Lua', () => {
        const compiler = new JSToIRCompiler();
        const generator = new IRToLuaGenerator();

        it('should generate variable declarations', () => {
            const jsCode = 'let x = 5;';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('local x = 5'));
        });

        it('should generate function declarations', () => {
            const jsCode = 'function add(a, b) { return a + b; }';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('local function add'));
            assert.ok(output.includes('return'));
        });

        it('should generate if statements', () => {
            const jsCode = 'if (x > 0) { y = 1; }';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('if'));
            assert.ok(output.includes('then'));
            assert.ok(output.includes('end'));
        });

        it('should translate operators', () => {
            const jsCode = 'let result = (x && y) || !z;';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('and'));
            assert.ok(output.includes('or'));
            assert.ok(output.includes('not'));
        });

        it('should translate console.log to print', () => {
            const jsCode = 'console.log("Hello");';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('print'));
        });

        it('should translate null to nil', () => {
            const jsCode = 'let x = null;';
            const ir = compiler.compile(jsCode);
            const output = generator.generate(ir);
            
            assert.ok(output.includes('nil'));
        });
    });

    describe('Round-Trip Tests', () => {
        const jsCompiler = new JSToIRCompiler();
        const jsGenerator = new IRToJSGenerator();

        it('should preserve semantics in round-trip (simple)', () => {
            const original = 'let x = 5;';
            const ir = jsCompiler.compile(original);
            const regenerated = jsGenerator.generate(ir);
            
            // Recompile regenerated code
            const ir2 = jsCompiler.compile(regenerated);
            
            // IR should be equivalent
            assert.deepStrictEqual(ir.toJSON(), ir2.toJSON());
        });

        it('should preserve semantics in round-trip (function)', () => {
            const original = 'function add(a, b) { return a + b; }';
            const ir = jsCompiler.compile(original);
            const regenerated = jsGenerator.generate(ir);
            const ir2 = jsCompiler.compile(regenerated);
            
            assert.deepStrictEqual(ir.toJSON(), ir2.toJSON());
        });

        it('should preserve semantics in round-trip (complex)', () => {
            const original = `
                function fibonacci(n) {
                    if (n <= 1) {
                        return n;
                    }
                    return fibonacci(n - 1) + fibonacci(n - 2);
                }
            `;
            
            const ir = jsCompiler.compile(original);
            const validator = new IRValidator();
            const validationResult = validator.validate(ir);
            
            assert.ok(validationResult.valid, 'IR should be valid');
            
            const regenerated = jsGenerator.generate(ir);
            const ir2 = jsCompiler.compile(regenerated);
            
            assert.deepStrictEqual(ir.toJSON(), ir2.toJSON());
        });
    });

    describe('Cross-Language Tests', () => {
        it('should compile JS to Lua correctly', () => {
            const jsCode = `
                let x = 5;
                let y = 10;
                function add(a, b) {
                    return a + b;
                }
                console.log(add(x, y));
            `;
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(jsCode);
            const luaCode = generator.generate(ir);
            
            assert.ok(luaCode.includes('local x = 5'));
            assert.ok(luaCode.includes('local function add'));
            assert.ok(luaCode.includes('print(add(x, y))'));
        });

        it('should handle conditional expressions', () => {
            const jsCode = 'let result = x > 0 ? "positive" : "negative";';
            
            const compiler = new JSToIRCompiler();
            const luaGenerator = new IRToLuaGenerator();
            
            const ir = compiler.compile(jsCode);
            const luaCode = luaGenerator.generate(ir);
            
            // Lua should have conditional expression
            assert.ok(luaCode.includes('and') || luaCode.includes('or'));
        });
    });
});

// Run tests
if (require.main === module) {
    console.log('Running Compiler Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    const runTest = (name, fn) => {
        try {
            fn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (error) {
            console.log(`✗ ${name}`);
            console.error(`  ${error.message}`);
            failed++;
        }
    };
    
    console.log('JavaScript to IR Tests:');
    const compiler = new JSToIRCompiler();
    
    runTest('should compile variable declarations', () => {
        const ir = compiler.compile('let x = 5;');
        assert.strictEqual(ir.body[0].kind, 'VarDecl');
    });
    
    runTest('should compile function declarations', () => {
        const ir = compiler.compile('function add(a, b) { return a + b; }');
        assert.strictEqual(ir.body[0].kind, 'FunctionDecl');
    });
    
    console.log('\nIR to JavaScript Tests:');
    const jsGenerator = new IRToJSGenerator();
    
    runTest('should generate variable declarations', () => {
        const ir = compiler.compile('let x = 5;');
        const output = jsGenerator.generate(ir);
        assert.ok(output.includes('let x'));
    });
    
    console.log('\nIR to Lua Tests:');
    const luaGenerator = new IRToLuaGenerator();
    
    runTest('should generate Lua variable declarations', () => {
        const ir = compiler.compile('let x = 5;');
        const output = luaGenerator.generate(ir);
        assert.ok(output.includes('local x'));
    });
    
    runTest('should translate console.log to print', () => {
        const ir = compiler.compile('console.log("test");');
        const output = luaGenerator.generate(ir);
        assert.ok(output.includes('print'));
    });
    
    console.log('\nRound-Trip Tests:');
    runTest('should preserve semantics in round-trip', () => {
        const original = 'let x = 5;';
        const ir = compiler.compile(original);
        const regenerated = jsGenerator.generate(ir);
        const ir2 = compiler.compile(regenerated);
        assert.deepStrictEqual(ir.toJSON(), ir2.toJSON());
    });
    
    console.log(`\n\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

module.exports = {};
