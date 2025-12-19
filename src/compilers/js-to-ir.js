
/**
 * JavaScript to IR Compiler
 * 
 * Converts JavaScript AST to LUASCRIPT IR.
 */

const acorn = require('acorn');
const { builder } = require('../ir/builder');
const { Types } = require('../ir/types');

class JSToIRCompiler {
    constructor(options = {}) {
        this.options = {
            sourceType: options.sourceType || 'module',
            ecmaVersion: options.ecmaVersion || 2020,
            ...options
        };
        this.builder = builder;
    }

    /**
     * Compile JavaScript code to IR
     */
    compile(jsCode) {
        try {
            // Parse JavaScript to AST
            const ast = acorn.parse(jsCode, {
                ecmaVersion: this.options.ecmaVersion,
                sourceType: this.options.sourceType,
                locations: true
            });

            // Convert AST to IR
            return this.convertNode(ast);
        } catch (error) {
            throw new Error(`JavaScript compilation error: ${error.message}`);
        }
    }

    /**
     * Convert an AST node to IR
     */
    convertNode(node) {
        if (!node) return null;

        const methodName = `convert${node.type}`;
        if (typeof this[methodName] === 'function') {
            return this[methodName](node);
        }

        throw new Error(`Unsupported AST node type: ${node.type}`);
    }

    // ========== PROGRAM & DECLARATIONS ==========

    convertProgram(node) {
        const body = node.body.map(stmt => this.convertNode(stmt));
        return this.builder.program(body, this.getLoc(node));
    }

    convertFunctionDeclaration(node) {
        const name = node.id ? node.id.name : null;
        const parameters = node.params.map(param => this.convertParameter(param));
        const body = this.convertNode(node.body);
        
        return this.builder.functionDecl(name, parameters, body, null, this.getLoc(node));
    }

    convertVariableDeclaration(node) {
        // JavaScript variable declarations can have multiple declarators
        // We'll convert each to a separate IR VarDecl
        const declarations = node.declarations.map(declarator => {
            // Handle different types of declarator.id (Identifier, ArrayPattern, ObjectPattern, etc.)
            let name;
            if (declarator.id.type === 'Identifier') {
                name = declarator.id.name;
            } else if (declarator.id.type === 'ArrayPattern' || declarator.id.type === 'ObjectPattern') {
                // For destructuring patterns, convert the pattern and use a temporary name
                name = this.convertNode(declarator.id);
            } else {
                // Fallback for other pattern types
                name = this.convertNode(declarator.id);
            }
            
            const init = declarator.init ? this.convertNode(declarator.init) : null;
            return this.builder.varDecl(name, init, null, {
                kind: node.kind,
                ...this.getLoc(declarator)
            });
        });

        // If only one declaration, return it directly
        if (declarations.length === 1) {
            return declarations[0];
        }

        // Otherwise, wrap in a block
        return this.builder.block(declarations);
    }

    convertParameter(node) {
        if (node.type === 'Identifier') {
            return this.builder.parameter(node.name, null, null, this.getLoc(node));
        } else if (node.type === 'AssignmentPattern') {
            const name = node.left.name;
            const defaultValue = this.convertNode(node.right);
            return this.builder.parameter(name, null, defaultValue, this.getLoc(node));
        } else if (node.type === 'ArrayPattern') {
            // Handle array destructuring parameters
            // For now, convert to a single parameter with metadata about the pattern
            const paramName = `_destructured_${Date.now()}`;
            return this.builder.parameter(paramName, null, null, {
                ...this.getLoc(node),
                metadata: { 
                    destructuring: 'array',
                    elements: node.elements.map(el => el ? el.name || null : null)
                }
            });
        } else if (node.type === 'RestElement') {
            // Handle rest parameters (...rest)
            const name = node.argument.name;
            return this.builder.parameter(name, null, null, {
                ...this.getLoc(node),
                metadata: { isRest: true }
            });
        }
        
        throw new Error(`Unsupported parameter type: ${node.type}`);
    }

    // ========== STATEMENTS ==========

    convertBlockStatement(node) {
        const statements = node.body.map(stmt => this.convertNode(stmt));
        return this.builder.block(statements, this.getLoc(node));
    }

    convertExpressionStatement(node) {
        const expression = this.convertNode(node.expression);
        return this.builder.expressionStmt(expression, this.getLoc(node));
    }

    convertReturnStatement(node) {
        const value = node.argument ? this.convertNode(node.argument) : null;
        return this.builder.returnStmt(value, this.getLoc(node));
    }

    convertIfStatement(node) {
        const condition = this.convertNode(node.test);
        const consequent = this.convertNode(node.consequent);
        const alternate = node.alternate ? this.convertNode(node.alternate) : null;
        
        return this.builder.ifStmt(condition, consequent, alternate, this.getLoc(node));
    }

    convertWhileStatement(node) {
        const condition = this.convertNode(node.test);
        const body = this.convertNode(node.body);
        
        return this.builder.whileStmt(condition, body, this.getLoc(node));
    }

    convertDoWhileStatement(node) {
        const body = this.convertNode(node.body);
        const condition = this.convertNode(node.test);
        
        return this.builder.doWhileStmt(body, condition, this.getLoc(node));
    }

    convertForStatement(node) {
        const init = node.init ? this.convertNode(node.init) : null;
        const condition = node.test ? this.convertNode(node.test) : null;
        const update = node.update ? this.convertNode(node.update) : null;
        const body = this.convertNode(node.body);
        
        return this.builder.forStmt(init, condition, update, body, this.getLoc(node));
    }

    convertSwitchStatement(node) {
        const discriminant = this.convertNode(node.discriminant);
        const cases = node.cases.map(c => this.convertSwitchCase(c));
        
        return this.builder.switchStmt(discriminant, cases, this.getLoc(node));
    }

    convertSwitchCase(node) {
        const test = node.test ? this.convertNode(node.test) : null;
        const consequent = node.consequent.map(stmt => this.convertNode(stmt));
        
        return this.builder.caseStmt(test, consequent, this.getLoc(node));
    }

    convertBreakStatement(node) {
        return this.builder.breakStmt(this.getLoc(node));
    }

    convertContinueStatement(node) {
        return this.builder.continueStmt(this.getLoc(node));
    }

    // ========== EXPRESSIONS ==========

    convertBinaryExpression(node) {
        const left = this.convertNode(node.left);
        const right = this.convertNode(node.right);
        
        return this.builder.binaryOp(node.operator, left, right, this.getLoc(node));
    }

    convertLogicalExpression(node) {
        // Logical expressions are also binary operations in IR
        return this.convertBinaryExpression(node);
    }

    convertUnaryExpression(node) {
        const operand = this.convertNode(node.argument);
        
        return this.builder.unaryOp(node.operator, operand, node.prefix, this.getLoc(node));
    }

    convertUpdateExpression(node) {
        // ++ and -- are unary operations
        const operand = this.convertNode(node.argument);
        
        return this.builder.unaryOp(node.operator, operand, node.prefix, this.getLoc(node));
    }

    convertCallExpression(node) {
        const callee = this.convertNode(node.callee);
        const args = node.arguments.map(arg => this.convertNode(arg));
        
        return this.builder.call(callee, args, this.getLoc(node));
    }

    convertMemberExpression(node) {
        const object = this.convertNode(node.object);
        const property = this.convertNode(node.property);
        
        return this.builder.member(object, property, node.computed, this.getLoc(node));
    }

    convertArrayExpression(node) {
        const elements = node.elements.map(el => el ? this.convertNode(el) : null);
        
        return this.builder.arrayLiteral(elements, this.getLoc(node));
    }

    convertObjectExpression(node) {
        const properties = node.properties.map(prop => this.convertProperty(prop));
        
        return this.builder.objectLiteral(properties, this.getLoc(node));
    }

    convertProperty(node) {
        const key = this.convertNode(node.key);
        const value = this.convertNode(node.value);
        
        return this.builder.property(key, value, this.getLoc(node));
    }

    convertIdentifier(node) {
        return this.builder.identifier(node.name, this.getLoc(node));
    }

    convertLiteral(node) {
        let type = null;
        
        if (typeof node.value === 'number') {
            type = Types.number();
        } else if (typeof node.value === 'string') {
            type = Types.string();
        } else if (typeof node.value === 'boolean') {
            type = Types.boolean();
        } else if (node.value === null) {
            type = Types.null();
        }
        
        return this.builder.literal(node.value, type, this.getLoc(node));
    }

    convertAssignmentExpression(node) {
        const left = this.convertNode(node.left);
        const right = this.convertNode(node.right);
        
        return this.builder.assignment(left, right, node.operator, this.getLoc(node));
    }

    convertConditionalExpression(node) {
        const condition = this.convertNode(node.test);
        const consequent = this.convertNode(node.consequent);
        const alternate = this.convertNode(node.alternate);
        
        return this.builder.conditional(condition, consequent, alternate, this.getLoc(node));
    }

    convertArrowFunctionExpression(node) {
        // Convert arrow functions to regular function declarations
        const parameters = node.params.map(param => this.convertParameter(param));
        
        // Handle expression body vs block body
        let body;
        if (node.body.type === 'BlockStatement') {
            body = this.convertNode(node.body);
        } else {
            // Expression body - wrap in return statement
            const returnStmt = this.builder.returnStmt(this.convertNode(node.body));
            body = this.builder.block([returnStmt]);
        }
        
        // Arrow functions are anonymous, so name is null
        return this.builder.functionDecl(null, parameters, body, null, this.getLoc(node));
    }

    convertFunctionExpression(node) {
        // Similar to function declaration but may be anonymous
        const name = node.id ? node.id.name : null;
        const parameters = node.params.map(param => this.convertParameter(param));
        const body = this.convertNode(node.body);
        
        return this.builder.functionDecl(name, parameters, body, null, this.getLoc(node));
    }

    convertThisExpression(node) {
        // Represent 'this' as a special identifier
        return this.builder.identifier('this', this.getLoc(node));
    }

    convertNewExpression(node) {
        // Represent 'new' as a special function call
        const callee = this.convertNode(node.callee);
        const args = node.arguments.map(arg => this.convertNode(arg));
        
        return this.builder.call(callee, args, {
            ...this.getLoc(node),
            metadata: { isNew: true }
        });
    }

    convertArrayPattern(node) {
        // Array patterns in variable declarations (e.g., const [a, b] = arr)
        const elements = node.elements.map(el => el ? this.convertNode(el) : null);
        return this.builder.identifier('_array_pattern', {
            ...this.getLoc(node),
            metadata: { pattern: 'array', elements }
        });
    }

    convertRestElement(node) {
        // Rest elements in destructuring (e.g., ...rest)
        const argument = this.convertNode(node.argument);
        return this.builder.identifier('_rest', {
            ...this.getLoc(node),
            metadata: { isRest: true, argument }
        });
    }

    // ========== HELPERS ==========

    getLoc(node) {
        if (node.loc) {
            return {
                loc: {
                    start: { line: node.loc.start.line, column: node.loc.start.column },
                    end: { line: node.loc.end.line, column: node.loc.end.column }
                }
            };
        }
        return {};
    }
}

module.exports = {
    JSToIRCompiler
};
