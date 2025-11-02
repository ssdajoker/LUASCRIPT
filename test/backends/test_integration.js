
/**
 * Integration Tests for All Backends
 */

const { BackendManager } = require('../../src/backends');
const { builder } = require('../../src/ir/builder');

describe('Backend Integration', () => {
    let backendManager;

    beforeEach(() => {
        backendManager = new BackendManager({
            wasm: { optimize: true },
            mlir: { debug: false },
            llvm: { optimize: true }
        });
    });

    test('should have all backends available', () => {
        const backends = backendManager.getAvailableBackends();
        expect(backends).toContain('wasm');
        expect(backends).toContain('mlir');
        expect(backends).toContain('llvm');
    });

    test('should compile same IR to all backends', () => {
        // Simple function: add(a, b) { return a + b; }
        const ir = builder.program([
            builder.functionDecl(
                'add',
                [
                    builder.parameter('a', builder.types.number()),
                    builder.parameter('b', builder.types.number())
                ],
                builder.block([
                    builder.returnStmt(
                        builder.add(
                            builder.identifier('a'),
                            builder.identifier('b')
                        )
                    )
                ]),
                builder.types.number()
            )
        ]);

        const results = backendManager.compileAll(ir);

        // All compilations should succeed
        expect(results.wasm.success).toBe(true);
        expect(results.mlir.success).toBe(true);
        expect(results.llvm.success).toBe(true);

        // Verify outputs
        expect(results.wasm.output).toBeInstanceOf(Uint8Array);
        expect(results.mlir.output).toContain('luascript.module');
        expect(results.llvm.output).toContain('define double @add');
    });

    test('should compile complex program to all backends', () => {
        // function factorial(n) {
        //   if (n <= 1) return 1;
        //   return n * factorial(n - 1);
        // }
        const ir = builder.program([
            builder.functionDecl(
                'factorial',
                [builder.parameter('n', builder.types.number())],
                builder.block([
                    builder.ifStmt(
                        builder.lte(builder.identifier('n'), builder.literal(1)),
                        builder.block([builder.returnStmt(builder.literal(1))]),
                        null
                    ),
                    builder.returnStmt(
                        builder.multiply(
                            builder.identifier('n'),
                            builder.call(
                                builder.identifier('factorial'),
                                [builder.subtract(builder.identifier('n'), builder.literal(1))]
                            )
                        )
                    )
                ]),
                builder.types.number()
            )
        ]);

        const results = backendManager.compileAll(ir);

        expect(results.wasm.success).toBe(true);
        expect(results.mlir.success).toBe(true);
        expect(results.llvm.success).toBe(true);
    });

    test('should handle errors gracefully', () => {
        // Invalid IR
        const invalidIR = { kind: 'Invalid' };

        const result = backendManager.compile(invalidIR, 'wasm');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test('should get specific backend compiler', () => {
        const wasmCompiler = backendManager.getBackend('wasm');
        expect(wasmCompiler).toBeDefined();
        expect(wasmCompiler.compile).toBeDefined();
    });
});

describe('End-to-End Compilation Pipeline', () => {
    test('should compile JS → IR → WASM', () => {
        const { JSToIRCompiler } = require('../../src/compilers/js-to-ir');
        const { BackendManager } = require('../../src/backends');

        const jsCode = `
            function fibonacci(n) {
                if (n <= 1) return n;
                return fibonacci(n - 1) + fibonacci(n - 2);
            }
        `;

        // JS → IR
        const jsCompiler = new JSToIRCompiler();
        const ir = jsCompiler.compile(jsCode);
        expect(ir.kind).toBe('Program');

        // IR → WASM
        const backendMgr = new BackendManager();
        const result = backendMgr.compile(ir, 'wasm');
        expect(result.success).toBe(true);
        expect(result.output).toBeInstanceOf(Uint8Array);
    });

    test('should compile JS → IR → MLIR', () => {
        const { JSToIRCompiler } = require('../../src/compilers/js-to-ir');
        const { BackendManager } = require('../../src/backends');

        const jsCode = `
            function sum(arr) {
                let total = 0;
                for (let i = 0; i < arr.length; i++) {
                    total = total + arr[i];
                }
                return total;
            }
        `;

        const jsCompiler = new JSToIRCompiler();
        const ir = jsCompiler.compile(jsCode);

        const backendMgr = new BackendManager();
        const result = backendMgr.compile(ir, 'mlir');
        expect(result.success).toBe(true);
        expect(result.output).toContain('luascript.func');
    });

    test('should compile JS → IR → LLVM', () => {
        const { JSToIRCompiler } = require('../../src/compilers/js-to-ir');
        const { BackendManager } = require('../../src/backends');

        const jsCode = `
            function multiply(a, b) {
                return a * b;
            }
        `;

        const jsCompiler = new JSToIRCompiler();
        const ir = jsCompiler.compile(jsCode);

        const backendMgr = new BackendManager();
        const result = backendMgr.compile(ir, 'llvm');
        expect(result.success).toBe(true);
        expect(result.output).toContain('define');
        expect(result.output).toContain('@multiply');
    });
});
