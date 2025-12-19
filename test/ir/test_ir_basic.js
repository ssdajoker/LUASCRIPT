
/**
 * Basic IR System Tests
 */

const assert = require('assert');
const { builder, Types, IRValidator, IRSerializer } = require('../../src/ir');

describe('IR Basic Tests', () => {
    describe('Type System', () => {
        it('should create primitive types', () => {
            const numType = Types.number();
            assert.strictEqual(numType.category, 'primitive');
            assert.strictEqual(numType.primitiveType, 'number');
        });

        it('should create array types', () => {
            const arrayType = Types.array(Types.string());
            assert.strictEqual(arrayType.category, 'array');
            assert.strictEqual(arrayType.elementType.primitiveType, 'string');
        });

        it('should create object types', () => {
            const objType = Types.object({
                name: Types.string(),
                age: Types.number()
            });
            assert.strictEqual(objType.category, 'object');
            assert.ok(objType.properties.name);
            assert.ok(objType.properties.age);
        });

        it('should check type equality', () => {
            const type1 = Types.number();
            const type2 = Types.number();
            const type3 = Types.string();
            
            assert.ok(type1.equals(type2));
            assert.ok(!type1.equals(type3));
        });

        it('should serialize and deserialize types', () => {
            const original = Types.function(
                [Types.string(), Types.number()],
                Types.boolean()
            );
            
            const json = original.toJSON();
            const { Type } = require('../../src/ir/types');
            const deserialized = Type.fromJSON(json);
            
            assert.ok(original.equals(deserialized));
        });
    });

    describe('Node Creation', () => {
        it('should create variable declarations', () => {
            const varDecl = builder.varDecl('x', builder.literal(5));
            assert.strictEqual(varDecl.kind, 'VarDecl');
            assert.strictEqual(varDecl.name, 'x');
            assert.strictEqual(varDecl.init.value, 5);
        });

        it('should create function declarations', () => {
            const func = builder.functionDecl(
                'add',
                [
                    builder.parameter('a'),
                    builder.parameter('b')
                ],
                builder.block([
                    builder.returnStmt(
                        builder.add(
                            builder.identifier('a'),
                            builder.identifier('b')
                        )
                    )
                ])
            );
            
            assert.strictEqual(func.kind, 'FunctionDecl');
            assert.strictEqual(func.name, 'add');
            assert.strictEqual(func.parameters.length, 2);
        });

        it('should create if statements', () => {
            const ifStmt = builder.ifStmt(
                builder.greaterThan(
                    builder.identifier('x'),
                    builder.literal(0)
                ),
                builder.block([
                    builder.expressionStmt(
                        builder.namedCall('print', [builder.literal('positive')])
                    )
                ])
            );
            
            assert.strictEqual(ifStmt.kind, 'If');
            assert.ok(ifStmt.condition);
            assert.ok(ifStmt.consequent);
        });

        it('should create loops', () => {
            const forLoop = builder.forStmt(
                builder.varDecl('i', builder.literal(0)),
                builder.lessThan(builder.identifier('i'), builder.literal(10)),
                builder.unaryOp('++', builder.identifier('i')),
                builder.block([
                    builder.expressionStmt(
                        builder.namedCall('print', [builder.identifier('i')])
                    )
                ])
            );
            
            assert.strictEqual(forLoop.kind, 'For');
            assert.ok(forLoop.init);
            assert.ok(forLoop.condition);
            assert.ok(forLoop.update);
        });

        it('should create binary operations', () => {
            const expr = builder.add(
                builder.multiply(
                    builder.literal(2),
                    builder.literal(3)
                ),
                builder.literal(4)
            );
            
            assert.strictEqual(expr.kind, 'BinaryOp');
            assert.strictEqual(expr.operator, '+');
            assert.strictEqual(expr.right.value, 4);
        });

        it('should create arrays and objects', () => {
            const array = builder.arrayLiteral([
                builder.literal(1),
                builder.literal(2),
                builder.literal(3)
            ]);
            
            assert.strictEqual(array.kind, 'ArrayLiteral');
            assert.strictEqual(array.elements.length, 3);
            
            const object = builder.objectLiteral([
                builder.property(
                    builder.identifier('name'),
                    builder.literal('John')
                ),
                builder.property(
                    builder.identifier('age'),
                    builder.literal(30)
                )
            ]);
            
            assert.strictEqual(object.kind, 'ObjectLiteral');
            assert.strictEqual(object.properties.length, 2);
        });
    });

    describe('Validation', () => {
        it('should validate correct IR', () => {
            const program = builder.program([
                builder.varDecl('x', builder.literal(5))
            ]);
            
            const validator = new IRValidator();
            const result = validator.validate(program);
            
            assert.ok(result.valid);
            assert.strictEqual(result.errors.length, 0);
        });

        it('should detect invalid nodes', () => {
            const invalidNode = {
                kind: 'VarDecl',
                // missing required 'name' field
                init: builder.literal(5)
            };
            
            const validator = new IRValidator();
            const result = validator.validate(invalidNode);
            
            assert.ok(!result.valid);
            assert.ok(result.errors.length > 0);
        });
    });

    describe('Serialization', () => {
        it('should serialize and deserialize IR', () => {
            const program = builder.program([
                builder.varDecl('x', builder.literal(5)),
                builder.functionDecl(
                    'test',
                    [],
                    builder.block([
                        builder.returnStmt(builder.identifier('x'))
                    ])
                )
            ]);
            
            const serializer = new IRSerializer();
            const json = serializer.serialize(program);
            const deserialized = serializer.deserialize(json);
            
            assert.deepStrictEqual(program.toJSON(), deserialized.toJSON());
        });

        it('should create tree visualization', () => {
            const program = builder.program([
                builder.varDecl('x', builder.literal(5))
            ]);
            
            const serializer = new IRSerializer();
            const tree = serializer.visualize(program);
            
            assert.ok(tree.includes('Program'));
            assert.ok(tree.includes('VarDecl'));
        });
    });

    describe('Builder Helpers', () => {
        it('should create named function calls', () => {
            const call = builder.namedCall('print', [
                builder.literal('Hello')
            ]);
            
            assert.strictEqual(call.kind, 'Call');
            assert.strictEqual(call.callee.kind, 'Identifier');
            assert.strictEqual(call.callee.name, 'print');
        });

        it('should create member access', () => {
            const member = builder.memberAccess('obj', 'prop');
            
            assert.strictEqual(member.kind, 'Member');
            assert.strictEqual(member.object.name, 'obj');
            assert.strictEqual(member.property.name, 'prop');
        });

        it('should create simple assignments', () => {
            const assignment = builder.simpleAssignment('x', builder.literal(10));
            
            assert.strictEqual(assignment.kind, 'Assignment');
            assert.strictEqual(assignment.left.name, 'x');
            assert.strictEqual(assignment.right.value, 10);
        });

        it('should create comparison operations', () => {
            const lessThan = builder.lessThan(
                builder.identifier('x'),
                builder.literal(10)
            );
            
            assert.strictEqual(lessThan.operator, '<');
            
            const equals = builder.equals(
                builder.identifier('x'),
                builder.literal(5)
            );
            
            assert.strictEqual(equals.operator, '==');
        });

        it('should create logical operations', () => {
            const andOp = builder.and(
                builder.identifier('a'),
                builder.identifier('b')
            );
            
            assert.strictEqual(andOp.operator, '&&');
            
            const orOp = builder.or(
                builder.identifier('c'),
                builder.identifier('d')
            );
            
            assert.strictEqual(orOp.operator, '||');
        });
    });
});

// Run tests
if (require.main === module) {
    console.log('Running IR Basic Tests...\n');
    
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
    
    // Run all tests manually (since we don't have Mocha installed)
    console.log('Type System Tests:');
    runTest('should create primitive types', () => {
        const numType = Types.number();
        assert.strictEqual(numType.category, 'primitive');
    });
    
    console.log('\nNode Creation Tests:');
    runTest('should create variable declarations', () => {
        const varDecl = builder.varDecl('x', builder.literal(5));
        assert.strictEqual(varDecl.kind, 'VarDecl');
    });
    
    console.log('\nValidation Tests:');
    runTest('should validate correct IR', () => {
        const program = builder.program([
            builder.varDecl('x', builder.literal(5))
        ]);
        const validator = new IRValidator();
        const result = validator.validate(program);
        assert.ok(result.valid);
    });
    
    console.log('\nSerialization Tests:');
    runTest('should serialize and deserialize IR', () => {
        const program = builder.program([
            builder.varDecl('x', builder.literal(5))
        ]);
        const serializer = new IRSerializer();
        const json = serializer.serialize(program);
        const deserialized = serializer.deserialize(json);
        assert.ok(deserialized.kind === 'Program');
    });
    
    console.log(`\n\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

module.exports = {};
