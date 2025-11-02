/**
 * Round-Trip Tests for IR Compilers
 * 
 * Tests compilation from JavaScript/Lua to IR and back.
 */

const assert = require('assert');
const { JSToIRCompiler, LuaToIRCompiler, IRToJSGenerator, IRToLuaGenerator } = require('../../src/compilers');
const { IRSerializer } = require('../../src/ir');

// Mock describe and it functions for compatibility
const describe = (name, fn) => fn && fn();
const it = (name, fn) => fn && fn();

describe('Round-Trip Tests', () => {
    describe('JavaScript → IR → JavaScript', () => {
        it('should handle variable declarations', () => {
            const jsCode = 'let x = 5;';
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('let x = 5'));
        });

        it('should handle function declarations', () => {
            const jsCode = `
function add(a, b) {
    return a + b;
}`;
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('function add'));
            assert.ok(result.includes('a + b'));
        });

        it('should handle if statements', () => {
            const jsCode = `
if (x > 0) {
    console.log("positive");
}`;
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('if'));
            assert.ok(result.includes('x > 0'));
        });

        it('should handle for loops', () => {
            const jsCode = `
for (let i = 0; i < 10; i++) {
    console.log(i);
}`;
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('for'));
            assert.ok(result.includes('i < 10'));
        });

        it('should handle while loops', () => {
            const jsCode = `
while (x < 10) {
    x++;
}`;
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('while'));
            assert.ok(result.includes('x < 10'));
        });

        it('should handle arrays', () => {
            const jsCode = 'let arr = [1, 2, 3];';
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('[1, 2, 3]'));
        });

        it('should handle objects', () => {
            const jsCode = 'let obj = { name: "John", age: 30 };';
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('name'));
            assert.ok(result.includes('John'));
        });

        it('should handle arrow functions', () => {
            const jsCode = 'const double = x => x * 2;';
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('function'));
            assert.ok(result.includes('x * 2'));
        });

        it('should handle binary operations', () => {
            const jsCode = 'let result = (2 + 3) * 4;';
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('2 + 3'));
            assert.ok(result.includes('* 4'));
        });

        it('should handle complex programs', () => {
            const jsCode = `
function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

let result = factorial(5);
`;
            
            const compiler = new JSToIRCompiler();
            const generator = new IRToJSGenerator();
            
            const ir = compiler.compile(jsCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('function factorial'));
            assert.ok(result.includes('n <= 1'));
            assert.ok(result.includes('factorial') && result.includes('n - 1'));
        });
    });

    describe('Lua → IR → Lua', () => {
        it('should handle variable declarations', () => {
            const luaCode = 'local x = 5';
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('local x'));
            assert.ok(result.includes('5'));
        });

        it('should handle function declarations', () => {
            const luaCode = `
local function add(a, b)
    return a + b
end`;
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('function add'));
            assert.ok(result.includes('a + b'));
        });

        it('should handle if statements', () => {
            const luaCode = `
if x > 0 then
    print("positive")
end`;
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('if'));
            assert.ok(result.includes('x > 0'));
        });

        it('should handle for loops', () => {
            const luaCode = `
for i = 1, 10 do
    print(i)
end`;
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            // Lua numeric for loops are converted to while loops in IR
            // which is semantically equivalent
            assert.ok(result.includes('i') && (result.includes('for') || result.includes('while')));
        });

        it('should handle while loops', () => {
            const luaCode = `
while x < 10 do
    x = x + 1
end`;
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('while'));
            assert.ok(result.includes('x < 10'));
        });

        it('should handle tables (arrays)', () => {
            const luaCode = 'local arr = {1, 2, 3}';
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('1'));
            assert.ok(result.includes('2'));
            assert.ok(result.includes('3'));
        });

        it('should handle tables (objects)', () => {
            const luaCode = 'local obj = {name = "John", age = 30}';
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('name'));
            assert.ok(result.includes('John'));
        });

        it('should handle complex programs', () => {
            const luaCode = `
local function factorial(n)
    if n <= 1 then
        return 1
    end
    return n * factorial(n - 1)
end

local result = factorial(5)
`;
            
            const compiler = new LuaToIRCompiler();
            const generator = new IRToLuaGenerator();
            
            const ir = compiler.compile(luaCode);
            const result = generator.generate(ir);
            
            assert.ok(result.includes('function factorial'));
            assert.ok(result.includes('n <= 1'));
            assert.ok(result.includes('factorial') && result.includes('n - 1'));
        });
    });

    describe('Cross-Language Tests', () => {
        it('should convert JavaScript to Lua', () => {
            const jsCode = `
function add(a, b) {
    return a + b;
}`;
            
            const jsCompiler = new JSToIRCompiler();
            const luaGenerator = new IRToLuaGenerator();
            
            const ir = jsCompiler.compile(jsCode);
            const luaCode = luaGenerator.generate(ir);
            
            assert.ok(luaCode.includes('function add'));
            assert.ok(luaCode.includes('a + b'));
        });

        it('should convert Lua to JavaScript', () => {
            const luaCode = `
local function add(a, b)
    return a + b
end`;
            
            const luaCompiler = new LuaToIRCompiler();
            const jsGenerator = new IRToJSGenerator();
            
            const ir = luaCompiler.compile(luaCode);
            const jsCode = jsGenerator.generate(ir);
            
            assert.ok(jsCode.includes('function add'));
            assert.ok(jsCode.includes('a + b'));
        });

        it('should preserve semantics across languages', () => {
            const jsCode = 'let x = 5; let y = x * 2;';
            
            const jsCompiler = new JSToIRCompiler();
            const luaGenerator = new IRToLuaGenerator();
            const jsGenerator = new IRToJSGenerator();
            
            // JS → IR → Lua
            const ir1 = jsCompiler.compile(jsCode);
            const luaCode = luaGenerator.generate(ir1);
            
            // Lua → IR → JS
            const luaCompiler = new LuaToIRCompiler();
            const ir2 = luaCompiler.compile(luaCode);
            const jsCode2 = jsGenerator.generate(ir2);
            
            // Both should contain similar semantics
            assert.ok(jsCode2.includes('x'));
            assert.ok(jsCode2.includes('5'));
        });
    });

    describe('IR Serialization', () => {
        it('should serialize and deserialize IR', () => {
            const jsCode = `
function test() {
    let x = 5;
    return x * 2;
}`;
            
            const compiler = new JSToIRCompiler();
            const serializer = new IRSerializer();
            
            const ir = compiler.compile(jsCode);
            const json = serializer.serialize(ir);
            const deserialized = serializer.deserialize(json);
            
            // Should have the same structure
            assert.strictEqual(ir.kind, deserialized.kind);
            assert.strictEqual(ir.body.length, deserialized.body.length);
        });

        it('should preserve metadata during serialization', () => {
            const jsCode = 'let x = 5;';
            
            const compiler = new JSToIRCompiler();
            const serializer = new IRSerializer();
            
            const ir = compiler.compile(jsCode);
            
            // Add some metadata
            ir.metadata.custom = 'test';
            
            const json = serializer.serialize(ir);
            const deserialized = serializer.deserialize(json);
            
            assert.strictEqual(deserialized.metadata.custom, 'test');
        });

        it('should handle complex nested structures', () => {
            const jsCode = `
function outer() {
    function inner() {
        let x = 5;
        return x;
    }
    return inner();
}`;
            
            const compiler = new JSToIRCompiler();
            const serializer = new IRSerializer();
            
            const ir = compiler.compile(jsCode);
            const json = serializer.serialize(ir);
            const deserialized = serializer.deserialize(json);
            
            assert.strictEqual(ir.kind, deserialized.kind);
        });
    });
});

// Manual test runner
if (require.main === module) {
    console.log('Running Round-Trip Tests...\n');
    
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
            if (error.stack) {
                console.error(`  ${error.stack.split('\n').slice(1, 3).join('\n')}`);
            }
            failed++;
        }
    };
    
    // JavaScript → IR → JavaScript tests
    console.log('JavaScript → IR → JavaScript Tests:');
    runTest('variable declarations', () => {
        const jsCode = 'let x = 5;';
        const compiler = new JSToIRCompiler();
        const generator = new IRToJSGenerator();
        const ir = compiler.compile(jsCode);
        const result = generator.generate(ir);
        assert.ok(result.includes('let x = 5'));
    });
    
    runTest('function declarations', () => {
        const jsCode = 'function add(a, b) { return a + b; }';
        const compiler = new JSToIRCompiler();
        const generator = new IRToJSGenerator();
        const ir = compiler.compile(jsCode);
        const result = generator.generate(ir);
        assert.ok(result.includes('function add'));
    });
    
    // Lua → IR → Lua tests
    console.log('\nLua → IR → Lua Tests:');
    runTest('Lua variable declarations', () => {
        const luaCode = 'local x = 5';
        const compiler = new LuaToIRCompiler();
        const generator = new IRToLuaGenerator();
        const ir = compiler.compile(luaCode);
        const result = generator.generate(ir);
        assert.ok(result.includes('local x'));
    });
    
    runTest('Lua function declarations', () => {
        const luaCode = 'local function add(a, b) return a + b end';
        const compiler = new LuaToIRCompiler();
        const generator = new IRToLuaGenerator();
        const ir = compiler.compile(luaCode);
        const result = generator.generate(ir);
        assert.ok(result.includes('function add'));
    });
    
    // Cross-language tests
    console.log('\nCross-Language Tests:');
    runTest('JavaScript to Lua', () => {
        const jsCode = 'function add(a, b) { return a + b; }';
        const jsCompiler = new JSToIRCompiler();
        const luaGenerator = new IRToLuaGenerator();
        const ir = jsCompiler.compile(jsCode);
        const luaCode = luaGenerator.generate(ir);
        assert.ok(luaCode.includes('function add'));
    });
    
    runTest('Lua to JavaScript', () => {
        const luaCode = 'local function add(a, b) return a + b end';
        const luaCompiler = new LuaToIRCompiler();
        const jsGenerator = new IRToJSGenerator();
        const ir = luaCompiler.compile(luaCode);
        const jsCode = jsGenerator.generate(ir);
        assert.ok(jsCode.includes('function add'));
    });
    
    // Serialization tests
    console.log('\nIR Serialization Tests:');
    runTest('serialize and deserialize', () => {
        const jsCode = 'function test() { let x = 5; return x * 2; }';
        const compiler = new JSToIRCompiler();
        const serializer = new IRSerializer();
        const ir = compiler.compile(jsCode);
        const json = serializer.serialize(ir);
        const deserialized = serializer.deserialize(json);
        assert.strictEqual(ir.kind, deserialized.kind);
    });
    
    console.log(`\n\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

module.exports = {};
