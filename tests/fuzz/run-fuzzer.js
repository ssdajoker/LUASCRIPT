/**
 * LUASCRIPT AST Fuzzer
 * 
 * Generates random valid JavaScript ASTs and validates transpilation
 * Catches regressions and edge case bugs through randomized testing
 */

const esprima = require('esprima');
const { IRPipeline } = require('../ir/pipeline-integration');

class ASTGenerator {
    constructor() {
        this.depth = 0;
        this.maxDepth = 5;
        this.varCounter = 0;
    }

    generateProgram(complexity = 'medium') {
        this.depth = 0;
        const maxStatements = complexity === 'simple' ? 3 : complexity === 'medium' ? 8 : 15;
        const statements = [];

        for (let i = 0; i < Math.floor(Math.random() * maxStatements); i++) {
            const stmt = this.generateStatement();
            if (stmt) statements.push(stmt);
        }

        return {
            type: 'Program',
            body: statements
        };
    }

    generateStatement() {
        if (this.depth > this.maxDepth) return null;

        const types = [
            'VariableDeclaration',
            'FunctionDeclaration',
            'IfStatement',
            'WhileStatement',
            'ForStatement',
            'ExpressionStatement',
            'ReturnStatement',
            'ThrowStatement',
            'TryStatement',
            'BlockStatement'
        ];

        const type = types[Math.floor(Math.random() * types.length)];
        return this[`generate${type}`]?.() || null;
    }

    generateVariableDeclaration() {
        const kind = ['let', 'const', 'var'][Math.floor(Math.random() * 3)];
        const id = { type: 'Identifier', name: `var${++this.varCounter}` };
        const init = Math.random() > 0.3 ? this.generateExpression() : null;

        return {
            type: 'VariableDeclaration',
            kind,
            declarations: [{ type: 'VariableDeclarator', id, init }]
        };
    }

    generateFunctionDeclaration() {
        const name = `fn${++this.varCounter}`;
        const params = this.generateParameters();

        this.depth++;
        const body = {
            type: 'BlockStatement',
            body: [
                {
                    type: 'ReturnStatement',
                    argument: this.generateExpression()
                }
            ]
        };
        this.depth--;

        return {
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name },
            params,
            body
        };
    }

    generateIfStatement() {
        this.depth++;
        const consequent = {
            type: 'BlockStatement',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: this.generateExpression()
                }
            ]
        };
        this.depth--;

        return {
            type: 'IfStatement',
            test: this.generateExpression(),
            consequent,
            alternate: Math.random() > 0.5 ? this.generateIfStatement() : null
        };
    }

    generateWhileStatement() {
        this.depth++;
        const body = {
            type: 'BlockStatement',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: { type: 'UpdateExpression', operator: '++', argument: { type: 'Identifier', name: 'i' } }
                }
            ]
        };
        this.depth--;

        return {
            type: 'WhileStatement',
            test: { type: 'Identifier', name: 'condition' },
            body
        };
    }

    generateForStatement() {
        this.depth++;
        const init = { type: 'VariableDeclaration', kind: 'let', declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: 'i' }, init: { type: 'Literal', value: 0 } }] };
        const body = {
            type: 'BlockStatement',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: this.generateExpression()
                }
            ]
        };
        this.depth--;

        return {
            type: 'ForStatement',
            init,
            test: { type: 'BinaryExpression', left: { type: 'Identifier', name: 'i' }, operator: '<', right: { type: 'Literal', value: 10 } },
            update: { type: 'UpdateExpression', operator: '++', argument: { type: 'Identifier', name: 'i' } },
            body
        };
    }

    generateTryStatement() {
        this.depth++;
        const tryBody = {
            type: 'BlockStatement',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: this.generateExpression()
                }
            ]
        };
        this.depth--;

        return {
            type: 'TryStatement',
            block: tryBody,
            handler: {
                type: 'CatchClause',
                param: { type: 'Identifier', name: 'e' },
                body: {
                    type: 'BlockStatement',
                    body: [{ type: 'ExpressionStatement', expression: { type: 'Identifier', name: 'console' } }]
                }
            },
            finalizer: null
        };
    }

    generateExpressionStatement() {
        return {
            type: 'ExpressionStatement',
            expression: this.generateExpression()
        };
    }

    generateReturnStatement() {
        return {
            type: 'ReturnStatement',
            argument: Math.random() > 0.3 ? this.generateExpression() : null
        };
    }

    generateThrowStatement() {
        return {
            type: 'ThrowStatement',
            argument: { type: 'Identifier', name: 'error' }
        };
    }

    generateBlockStatement() {
        this.depth++;
        const statements = [];
        for (let i = 0; i < 3; i++) {
            const stmt = this.generateStatement();
            if (stmt) statements.push(stmt);
        }
        this.depth--;

        return {
            type: 'BlockStatement',
            body: statements
        };
    }

    generateExpression() {
        const types = ['Literal', 'Identifier', 'BinaryExpression', 'CallExpression', 'ArrayExpression', 'ObjectExpression'];
        const type = types[Math.floor(Math.random() * types.length)];

        return this[`generate${type}`]?.() || { type: 'Literal', value: 42 };
    }

    generateLiteral() {
        const valueTypes = ['number', 'string', 'boolean', 'null'];
        const valueType = valueTypes[Math.floor(Math.random() * valueTypes.length)];

        switch (valueType) {
            case 'number':
                return { type: 'Literal', value: Math.floor(Math.random() * 1000) };
            case 'string':
                return { type: 'Literal', value: `str${Math.random()}` };
            case 'boolean':
                return { type: 'Literal', value: Math.random() > 0.5 };
            case 'null':
                return { type: 'Literal', value: null };
        }
    }

    generateIdentifier() {
        const names = ['x', 'y', 'z', 'value', 'item', 'result', 'data', 'obj', 'arr'];
        return {
            type: 'Identifier',
            name: names[Math.floor(Math.random() * names.length)]
        };
    }

    generateBinaryExpression() {
        const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '&&', '||'];
        return {
            type: 'BinaryExpression',
            operator: operators[Math.floor(Math.random() * operators.length)],
            left: this.generateLiteral(),
            right: this.generateLiteral()
        };
    }

    generateCallExpression() {
        return {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'func' },
            arguments: [this.generateLiteral()]
        };
    }

    generateArrayExpression() {
        return {
            type: 'ArrayExpression',
            elements: [this.generateLiteral(), this.generateLiteral()]
        };
    }

    generateObjectExpression() {
        return {
            type: 'ObjectExpression',
            properties: [
                {
                    type: 'Property',
                    key: { type: 'Identifier', name: 'key' },
                    value: this.generateLiteral(),
                    kind: 'init'
                }
            ]
        };
    }

    generateParameters() {
        const count = Math.floor(Math.random() * 3);
        const params = [];
        for (let i = 0; i < count; i++) {
            params.push({ type: 'Identifier', name: `p${i}` });
        }
        return params;
    }
}

class Fuzzer {
    constructor(iterations = 100) {
        this.iterations = iterations;
        this.generator = new ASTGenerator();
        this.pipeline = new IRPipeline({ validate: true });
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    run() {
        console.log(`🔀 Starting fuzzer with ${this.iterations} iterations...\n`);

        for (let i = 0; i < this.iterations; i++) {
            const complexity = ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)];
            const ast = this.generator.generateProgram(complexity);

            try {
                // Convert AST to JavaScript code string for transpilation
                const jsCode = this.astToCode(ast);
                const result = this.pipeline.transpile(jsCode, `fuzz_${i}.js`);

                if (result.success) {
                    this.results.passed++;
                    if ((i + 1) % 10 === 0) {
                        console.log(`✅ Iteration ${i + 1}/${this.iterations}: PASSED`);
                    }
                } else {
                    this.results.failed++;
                    console.log(`❌ Iteration ${i + 1}/${this.iterations}: FAILED`);
                    console.log(`   Errors: ${result.errors.join('; ')}`);
                    this.results.errors.push({
                        iteration: i,
                        code: jsCode,
                        errors: result.errors
                    });
                }
            } catch (error) {
                this.results.failed++;
                console.log(`💥 Iteration ${i + 1}/${this.iterations}: CRASHED`);
                console.log(`   Error: ${error.message}`);
                this.results.errors.push({
                    iteration: i,
                    error: error.message,
                    stack: error.stack
                });
            }

            this.results.total++;
        }

        this.printResults();
    }

    astToCode(ast) {
        // Simple AST to JS code conversion (not perfect, just for fuzzing)
        const buffer = [];

        const walk = (node) => {
            if (!node) return;

            if (node.type === 'Program') {
                node.body.forEach(walk);
            } else if (node.type === 'VariableDeclaration') {
                buffer.push(`${node.kind} ${node.declarations[0].id.name}`);
                if (node.declarations[0].init) {
                    buffer.push(' = ');
                    walk(node.declarations[0].init);
                }
                buffer.push(';');
            } else if (node.type === 'FunctionDeclaration') {
                buffer.push(`function ${node.id.name}(${node.params.map(p => p.name).join(',')}) {}`);
            } else if (node.type === 'IfStatement') {
                buffer.push('if (true) {}');
            } else if (node.type === 'Literal') {
                buffer.push(JSON.stringify(node.value));
            } else if (node.type === 'Identifier') {
                buffer.push(node.name);
            }
        };

        walk(ast);
        return buffer.join('');
    }

    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('FUZZING RESULTS');
        console.log('='.repeat(50));
        console.log(`Total:  ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} (${(this.results.passed / this.results.total * 100).toFixed(1)}%)`);
        console.log(`Failed: ${this.results.failed} (${(this.results.failed / this.results.total * 100).toFixed(1)}%)`);

        if (this.results.errors.length > 0) {
            console.log(`\n⚠️  ${this.results.errors.length} errors found:`);
            this.results.errors.slice(0, 5).forEach(err => {
                console.log(`\n  Iteration ${err.iteration}:`);
                if (err.code) {
                    console.log(`    Code: ${err.code.substring(0, 50)}...`);
                }
                if (err.errors) {
                    console.log(`    Errors: ${err.errors.join('; ')}`);
                }
                if (err.error) {
                    console.log(`    Error: ${err.error}`);
                }
            });
            if (this.results.errors.length > 5) {
                console.log(`\n  ... and ${this.results.errors.length - 5} more errors`);
            }
        }

        console.log('='.repeat(50));
    }
}

// CLI entry point
if (require.main === module) {
    const iterations = parseInt(process.argv[2]) || 100;
    const fuzzer = new Fuzzer(iterations);
    fuzzer.run();
}

module.exports = { ASTGenerator, Fuzzer };
