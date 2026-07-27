const LuaScriptTranspiler = require('./src/transpiler');

const transpiler = new LuaScriptTranspiler({ useCanonicalIR: true });

const jsCode = 'let msg = "Hello, " + name;';

console.log('Input JavaScript:');
console.log(jsCode);
console.log('\nTranspiled Lua:');

try {
    const result = transpiler.transpile(jsCode, {});
    const luaCode = typeof result === 'string' ? result : result.luaCode || result.code;
    console.log(luaCode);
    
    if (luaCode && luaCode.includes('..')) {
        console.log('\n✓ PASS - Uses .. for string concatenation');
    } else if (luaCode && luaCode.includes('+')) {
        console.log('\n✗ FAIL - Uses + instead of .. for string concatenation');
    }
} catch (error) {
    console.error('\nError during transpilation:');
    console.error(error.message);
    console.error(error.stack);
}
