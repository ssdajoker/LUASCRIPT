
/**
 * Example: Compile to All Backends
 * 
 * Demonstrates compiling LUASCRIPT IR to WASM, MLIR, and LLVM IR
 */

const { BackendManager } = require('../../src/backends');
const { builder } = require('../../src/ir/builder');
const fs = require('fs');
const path = require('path');

// Create a simple program
console.log('📝 Creating LUASCRIPT IR Program...\n');

const program = builder.program([
    // function fibonacci(n) {
    //   if (n <= 1) return n;
    //   return fibonacci(n - 1) + fibonacci(n - 2);
    // }
    builder.functionDecl(
        'fibonacci',
        [builder.parameter('n', builder.types.number())],
        builder.block([
            builder.ifStmt(
                builder.lte(builder.identifier('n'), builder.literal(1)),
                builder.block([
                    builder.returnStmt(builder.identifier('n'))
                ]),
                null
            ),
            builder.returnStmt(
                builder.add(
                    builder.call(
                        builder.identifier('fibonacci'),
                        [builder.subtract(builder.identifier('n'), builder.literal(1))]
                    ),
                    builder.call(
                        builder.identifier('fibonacci'),
                        [builder.subtract(builder.identifier('n'), builder.literal(2))]
                    )
                )
            )
        ]),
        builder.types.number()
    )
]);

console.log('Program: Fibonacci function');
console.log('═'.repeat(60));

// Initialize backend manager
const backendMgr = new BackendManager({
    wasm: { optimize: true },
    mlir: { debug: false },
    llvm: { optimize: true }
});

console.log('\n🔧 Compiling to all backends...\n');

// Compile to all backends
const results = backendMgr.compileAll(program);

// Display results
console.log('📊 Compilation Results:');
console.log('═'.repeat(60));

for (const [backend, result] of Object.entries(results)) {
    console.log(`\n${backend.toUpperCase()} Backend:`);
    console.log('-'.repeat(40));
    
    if (result.success) {
        console.log('✅ Success');
        
        if (backend === 'wasm') {
            console.log(`   Size: ${result.output.length} bytes`);
            console.log(`   Magic: ${Array.from(result.output.slice(0, 4)).map(b => '0x' + b.toString(16)).join(' ')}`);
            
            // Save to file
            const wasmPath = path.join(__dirname, 'output', 'fibonacci.wasm');
            fs.mkdirSync(path.dirname(wasmPath), { recursive: true });
            fs.writeFileSync(wasmPath, result.output);
            console.log(`   Saved: ${wasmPath}`);
        } else {
            console.log(`   Output length: ${result.output.length} characters`);
            
            // Save to file
            const ext = backend === 'mlir' ? 'mlir' : 'll';
            const filePath = path.join(__dirname, 'output', `fibonacci.${ext}`);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, result.output);
            console.log(`   Saved: ${filePath}`);
            
            // Show snippet
            const snippet = result.output.split('\n').slice(0, 10).join('\n');
            console.log('\n   Preview:');
            console.log('   ' + snippet.replace(/\n/g, '\n   '));
            console.log('   ...');
        }
    } else {
        console.log('❌ Failed');
        console.log(`   Error: ${result.error}`);
    }
}

console.log('\n' + '═'.repeat(60));
console.log('✨ Done! Check the output directory for generated files.');
