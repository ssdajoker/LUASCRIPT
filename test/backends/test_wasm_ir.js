
/**
 * Test WASM Backend with Canonical IR
 */

const { IRToWasmCompiler } = require('../../src/backends/wasm/ir-to-wasm');
const { builder } = require('../../src/ir/builder');

describe('WASM IR Compiler', () => {
    let compiler;

    beforeEach(() => {
        compiler = new IRToWasmCompiler({ optimize: true });
    });

    test('should compile simple function', () => {
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

        const bytecode = compiler.compile(ir);
        expect(bytecode).toBeInstanceOf(Uint8Array);
        expect(bytecode.length).toBeGreaterThan(0);
        
        // Check WASM magic number
        expect(bytecode[0]).toBe(0x00);
        expect(bytecode[1]).toBe(0x61);
        expect(bytecode[2]).toBe(0x73);
        expect(bytecode[3]).toBe(0x6D);
    });

    test('should compile variable declaration', () => {
        const ir = builder.program([
            builder.variableDecl('x', builder.literal(42))
        ]);

        const bytecode = compiler.compile(ir);
        expect(bytecode).toBeInstanceOf(Uint8Array);
    });

    test('should compile if statement', () => {
        // function test(x) { if (x > 0) return 1; else return 0; }
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

        const bytecode = compiler.compile(ir);
        expect(bytecode).toBeInstanceOf(Uint8Array);
    });

    test('should compile while loop', () => {
        // function count(n) { let i = 0; while (i < n) i = i + 1; return i; }
        const ir = builder.program([
            builder.functionDecl(
                'count',
                [builder.parameter('n', builder.types.number())],
                builder.block([
                    builder.variableDecl('i', builder.literal(0)),
                    builder.whileStmt(
                        builder.lt(builder.identifier('i'), builder.identifier('n')),
                        builder.block([
                            builder.expressionStmt(
                                builder.assign(
                                    builder.identifier('i'),
                                    builder.add(builder.identifier('i'), builder.literal(1))
                                )
                            )
                        ])
                    ),
                    builder.returnStmt(builder.identifier('i'))
                ]),
                builder.types.number()
            )
        ]);

        const bytecode = compiler.compile(ir);
        expect(bytecode).toBeInstanceOf(Uint8Array);
    });
});
