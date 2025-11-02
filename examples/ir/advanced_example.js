
/**
 * Advanced IR Example
 * 
 * Demonstrates advanced features like building IR manually,
 * transformations, and multi-target compilation.
 */

const { builder, Types, IRSerializer, IRValidator } = require('../../src/ir');
const { IRToJSGenerator, IRToLuaGenerator } = require('../../src/compilers');

console.log('='.repeat(60));
console.log('LUASCRIPT IR Advanced Example');
console.log('='.repeat(60));

// Example 1: Build IR manually using the builder
console.log('\n📦 Example 1: Building IR Manually');
console.log('-'.repeat(60));

// Create a factorial function: function factorial(n) { ... }
const factorialFunc = builder.functionDecl(
    'factorial',
    [builder.parameter('n', Types.number())],
    builder.block([
        builder.ifStmt(
            builder.lessThanOrEqual(
                builder.identifier('n'),
                builder.literal(1)
            ),
            builder.block([
                builder.returnStmt(builder.literal(1))
            ])
        ),
        builder.returnStmt(
            builder.multiply(
                builder.identifier('n'),
                builder.call(
                    builder.identifier('factorial'),
                    [builder.subtract(
                        builder.identifier('n'),
                        builder.literal(1)
                    )]
                )
            )
        )
    ]),
    Types.number()
);

// Create a program with the function and a call
const program = builder.program([
    factorialFunc,
    builder.expressionStmt(
        builder.namedCall('console.log', [
            builder.call(
                builder.identifier('factorial'),
                [builder.literal(5)]
            )
        ])
    )
]);

console.log('✓ IR built manually');

// Validate
const validator = new IRValidator();
const validationResult = validator.validate(program);
console.log(`✓ Validation: ${validationResult.valid ? 'Passed' : 'Failed'}`);

// Generate code for multiple targets
const jsGenerator = new IRToJSGenerator();
const luaGenerator = new IRToLuaGenerator();

console.log('\n📝 Generated JavaScript:');
console.log(jsGenerator.generate(program));

console.log('\n📝 Generated Lua:');
console.log(luaGenerator.generate(program));

// Example 2: Complex data structures
console.log('\n\n📦 Example 2: Complex Data Structures');
console.log('-'.repeat(60));

const complexProgram = builder.program([
    // Create an array
    builder.declareAndInit(
        'numbers',
        builder.arrayLiteral([
            builder.literal(1),
            builder.literal(2),
            builder.literal(3),
            builder.literal(4),
            builder.literal(5)
        ])
    ),
    
    // Create an object
    builder.declareAndInit(
        'person',
        builder.objectLiteral([
            builder.property(
                builder.identifier('name'),
                builder.literal('John Doe')
            ),
            builder.property(
                builder.identifier('age'),
                builder.literal(30)
            ),
            builder.property(
                builder.identifier('city'),
                builder.literal('New York')
            )
        ])
    ),
    
    // Access object property
    builder.expressionStmt(
        builder.namedCall('console.log', [
            builder.member(
                builder.identifier('person'),
                builder.identifier('name'),
                false
            )
        ])
    ),
    
    // Access array element
    builder.expressionStmt(
        builder.namedCall('console.log', [
            builder.member(
                builder.identifier('numbers'),
                builder.literal(0),
                true
            )
        ])
    )
]);

console.log('✓ Complex data structures created');

console.log('\n📝 Generated JavaScript:');
console.log(jsGenerator.generate(complexProgram));

console.log('\n📝 Generated Lua:');
console.log(luaGenerator.generate(complexProgram));

// Example 3: Control flow
console.log('\n\n📦 Example 3: Advanced Control Flow');
console.log('-'.repeat(60));

const controlFlowProgram = builder.program([
    // For loop with array iteration
    builder.forStmt(
        builder.declareAndInit('i', builder.literal(0)),
        builder.lessThan(
            builder.identifier('i'),
            builder.literal(10)
        ),
        builder.unaryOp('++', builder.identifier('i')),
        builder.block([
            builder.ifStmt(
                builder.equals(
                    builder.binaryOp(
                        '%',
                        builder.identifier('i'),
                        builder.literal(2)
                    ),
                    builder.literal(0)
                ),
                builder.block([
                    builder.expressionStmt(
                        builder.namedCall('console.log', [
                            builder.identifier('i'),
                            builder.literal('is even')
                        ])
                    )
                ]),
                builder.block([
                    builder.continueStmt()
                ])
            )
        ])
    ),
    
    // Switch statement
    builder.switchStmt(
        builder.identifier('x'),
        [
            builder.caseStmt(
                builder.literal(1),
                [
                    builder.expressionStmt(
                        builder.namedCall('console.log', [builder.literal('One')])
                    ),
                    builder.breakStmt()
                ]
            ),
            builder.caseStmt(
                builder.literal(2),
                [
                    builder.expressionStmt(
                        builder.namedCall('console.log', [builder.literal('Two')])
                    ),
                    builder.breakStmt()
                ]
            ),
            builder.caseStmt(
                null, // default case
                [
                    builder.expressionStmt(
                        builder.namedCall('console.log', [builder.literal('Other')])
                    )
                ]
            )
        ]
    )
]);

console.log('✓ Control flow structures created');

console.log('\n📝 Generated JavaScript:');
console.log(jsGenerator.generate(controlFlowProgram));

console.log('\n📝 Generated Lua:');
console.log(luaGenerator.generate(controlFlowProgram));

// Example 4: Type annotations
console.log('\n\n📦 Example 4: Type Annotations');
console.log('-'.repeat(60));

const typedProgram = builder.program([
    builder.functionDecl(
        'greet',
        [builder.parameter('name', Types.string())],
        builder.block([
            builder.returnStmt(
                builder.add(
                    builder.literal('Hello, '),
                    builder.identifier('name')
                )
            )
        ]),
        Types.string()
    ),
    
    builder.varDecl(
        'greeting',
        builder.call(
            builder.identifier('greet'),
            [builder.literal('World')]
        ),
        Types.string()
    )
]);

console.log('✓ Typed IR created');

const serializer = new IRSerializer({ prettyPrint: true });
console.log('\n📄 IR with Type Information (JSON):');
console.log(serializer.serialize(typedProgram));

console.log('\n' + '='.repeat(60));
console.log('Advanced examples completed successfully!');
console.log('='.repeat(60));
