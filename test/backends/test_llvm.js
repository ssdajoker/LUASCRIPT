
/**
 * Test LLVM IR Backend
 */

const { IRToLLVMCompiler, LLVMType } = require('../../src/backends/llvm');
const { builder } = require('../../src/ir/builder');

describe('LLVM IR Compiler', () => {
    let compiler;

    beforeEach(() => {
        compiler = new IRToLLVMCompiler({ optimize: true });
    });

    test('should compile simple function to LLVM IR', () => {
        // function add(a, b) { return a + b; }
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

        const llvmIR = compiler.compile(ir);
        expect(llvmIR).toContain('define double @add');
        expect(llvmIR).toContain('entry:');
        expect(llvmIR).toContain('fadd double'); // Floating-point add
        expect(llvmIR).toContain('ret double');
    });

    test('should generate SSA form', () => {
        // let x = 5; let y = x + 1; return y;
        const ir = builder.program([
            builder.functionDecl(
                'test',
                [],
                builder.block([
                    builder.variableDecl('x', builder.literal(5)),
                    builder.variableDecl('y', 
                        builder.add(builder.identifier('x'), builder.literal(1))
                    ),
                    builder.returnStmt(builder.identifier('y'))
                ]),
                builder.types.number()
            )
        ]);

        const llvmIR = compiler.compile(ir);
        expect(llvmIR).toMatch(/%\w+\d+/); // Should contain SSA values like %v0, %v1
        expect(llvmIR).toContain('alloca');
        expect(llvmIR).toContain('load');
        expect(llvmIR).toContain('store');
    });

    test('should handle control flow with basic blocks', () => {
        // if (x > 0) return 1; else return 0;
        const ir = builder.program([
            builder.functionDecl(
                'test',
                [builder.parameter('x', builder.types.number())],
                builder.block([
                    builder.ifStmt(
                        builder.gt(builder.identifier('x'), builder.literal(0)),
                        builder.block([builder.returnStmt(builder.literal(1))]),
                        builder.block([builder.returnStmt(builder.literal(0))])
                    )
                ]),
                builder.types.number()
            )
        ]);

        const llvmIR = compiler.compile(ir);
        expect(llvmIR).toContain('fcmp'); // Floating-point comparison
        expect(llvmIR).toContain('br i1'); // Conditional branch
        expect(llvmIR).toContain('if_then:');
        expect(llvmIR).toContain('if_else:');
        expect(llvmIR).toContain('if_end:');
    });

    test('should handle loops with proper CFG', () => {
        // while (x < 10) x = x + 1;
        const ir = builder.program([
            builder.functionDecl(
                'test',
                [builder.parameter('x', builder.types.number())],
                builder.block([
                    builder.whileStmt(
                        builder.lt(builder.identifier('x'), builder.literal(10)),
                        builder.block([
                            builder.expressionStmt(
                                builder.assign(
                                    builder.identifier('x'),
                                    builder.add(builder.identifier('x'), builder.literal(1))
                                )
                            )
                        ])
                    )
                ]),
                builder.types.void()
            )
        ]);

        const llvmIR = compiler.compile(ir);
        expect(llvmIR).toContain('while_cond:');
        expect(llvmIR).toContain('while_body:');
        expect(llvmIR).toContain('while_end:');
        expect(llvmIR).toContain('br label %while_cond');
    });

    test('should handle function calls', () => {
        // function double(x) { return x * 2; }
        // function test() { return double(5); }
        const ir = builder.program([
            builder.functionDecl(
                'double',
                [builder.parameter('x', builder.types.number())],
                builder.block([
                    builder.returnStmt(
                        builder.multiply(builder.identifier('x'), builder.literal(2))
                    )
                ]),
                builder.types.number()
            ),
            builder.functionDecl(
                'test',
                [],
                builder.block([
                    builder.returnStmt(
                        builder.call(builder.identifier('double'), [builder.literal(5)])
                    )
                ]),
                builder.types.number()
            )
        ]);

        const llvmIR = compiler.compile(ir);
        expect(llvmIR).toContain('define double @double');
        expect(llvmIR).toContain('define double @test');
        expect(llvmIR).toContain('call double @double');
    });

    test('should generate valid LLVM IR structure', () => {
        const ir = builder.program([
            builder.functionDecl(
                'main',
                [],
                builder.block([
                    builder.returnStmt(builder.literal(0))
                ]),
                builder.types.number()
            )
        ]);

        const llvmIR = compiler.compile(ir);
        
        // Check module header
        expect(llvmIR).toContain('ModuleID');
        expect(llvmIR).toContain('target triple');
        
        // Check function declaration
        expect(llvmIR).toMatch(/declare.*@printf/);
        
        // Check function definition
        expect(llvmIR).toContain('define');
        expect(llvmIR).toContain('@main');
    });
});
