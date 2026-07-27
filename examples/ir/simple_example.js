
/**
 * Simple IR Example
 * 
 * Demonstrates basic usage of the LUASCRIPT IR system.
 */

const { JSToIRCompiler, IRToJSGenerator, IRToLuaGenerator } = require('../../src/compilers');
const { IRSerializer, IRValidator } = require('../../src/ir');

console.log('='.repeat(60));
console.log('LUASCRIPT IR Simple Example');
console.log('='.repeat(60));

// Source JavaScript code
const jsCode = `
let x = 5;
let y = 10;

function add(a, b) {
    return a + b;
}

console.log(add(x, y));
`;

console.log('\n📝 Original JavaScript:');
console.log(jsCode);

// Step 1: Compile JavaScript to IR
console.log('\n🔄 Compiling JavaScript to IR...');
const compiler = new JSToIRCompiler();
const ir = compiler.compile(jsCode);
console.log('✓ Compilation successful!');

// Step 2: Validate IR
console.log('\n🔍 Validating IR...');
const validator = new IRValidator();
const validationResult = validator.validate(ir);

if (validationResult.valid) {
    console.log('✓ IR is valid!');
} else {
    console.log('✗ IR validation failed:');
    validationResult.errors.forEach(err => console.log(`  - ${err.message}`));
}

if (validationResult.warnings.length > 0) {
    console.log('⚠ Warnings:');
    validationResult.warnings.forEach(warn => console.log(`  - ${warn.message}`));
}

// Step 3: Serialize IR to JSON
console.log('\n💾 Serializing IR to JSON...');
const serializer = new IRSerializer({ prettyPrint: true });
const jsonIR = serializer.serialize(ir);
console.log('✓ Serialization successful! (truncated output)');
console.log(jsonIR.substring(0, 200) + '...');

// Step 4: Visualize IR as tree
console.log('\n🌳 IR Tree Visualization:');
const tree = serializer.visualize(ir);
console.log(tree);

// Step 5: Generate JavaScript from IR
console.log('\n🔄 Generating JavaScript from IR...');
const jsGenerator = new IRToJSGenerator();
const generatedJS = jsGenerator.generate(ir);
console.log('✓ JavaScript generation successful!');
console.log('\n📝 Generated JavaScript:');
console.log(generatedJS);

// Step 6: Generate Lua from IR
console.log('\n🔄 Generating Lua from IR...');
const luaGenerator = new IRToLuaGenerator();
const generatedLua = luaGenerator.generate(ir);
console.log('✓ Lua generation successful!');
console.log('\n📝 Generated Lua:');
console.log(generatedLua);

console.log('\n' + '='.repeat(60));
console.log('Example completed successfully!');
console.log('='.repeat(60));
