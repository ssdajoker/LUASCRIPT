
/**
 * Test MLIR Backend
 */

const { IRToMLIRCompiler, LuascriptDialect } = require('../../src/backends/mlir');
const { builder } = require('../../src/ir/builder');

describe('MLIR Compiler', () => {
    let compiler;
    let dialect;

    beforeEach(() => {
        compiler = new IRToMLIRCompiler({ debug: false });
        dialect = new LuascriptDialect();
    });

    test('should define luascript dialect', () => {
        expect(dialect.name).toBe('luascript');
        expect(dialect.operations).toBeDefined();
        expect(dialect.types).toBeDefined();
    });

    test('should compile simple function to MLIR', () => {
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

        const mlir = compiler.compile(ir);
        expect(mlir).toContain('luascript.module');
        expect(mlir).toContain('luascript.func');
        expect(mlir).toContain('add');
        expect(mlir).toContain('luascript.add');
        expect(mlir).toContain('luascript.return');
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

        const mlir = compiler.compile(ir);
        expect(mlir).toMatch(/%v\d+/); // Should contain SSA values like %v0, %v1
        expect(mlir).toContain('luascript.alloc');
        expect(mlir).toContain('luascript.load');
        expect(mlir).toContain('luascript.store');
    });

    test('should handle control flow', () => {
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

        const mlir = compiler.compile(ir);
        expect(mlir).toContain('luascript.if');
        expect(mlir).toContain('luascript.cmp');
    });

    test('should handle loops', () => {
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

        const mlir = compiler.compile(ir);
        expect(mlir).toContain('luascript.while');
    });
});
