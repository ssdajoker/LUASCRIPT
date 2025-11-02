/**
 * Lua to IR Compiler
 * 
 * Converts Lua AST to LUASCRIPT IR.
 */

const luaparse = require('luaparse');
const { builder } = require('../ir/builder');
const { Types } = require('../ir/types');

class LuaToIRCompiler {
    constructor(options = {}) {
        this.options = {
            comments: options.comments !== false,
            scope: options.scope !== false,
            locations: true,
            ranges: false,
            ...options
        };
        this.builder = builder;
    }

    /**
     * Compile Lua code to IR
     */
    compile(luaCode) {
        try {
            // Parse Lua to AST
            const ast = luaparse.parse(luaCode, this.options);

            // Convert AST to IR
            return this.convertNode(ast);
        } catch (error) {
            throw new Error(`Lua compilation error: ${error.message}`);
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

        throw new Error(`Unsupported Lua AST node type: ${node.type}`);
    }

    // ========== PROGRAM & DECLARATIONS ==========

    convertChunk(node) {
        // Chunk is the root node in Lua AST (equivalent to Program)
        const body = node.body.map(stmt => this.convertNode(stmt));
        return this.builder.program(body, this.getLoc(node));
    }

    convertFunctionDeclaration(node) {
        // Lua function declaration
        // Check if this is a local function or a regular/anonymous function
        const name = node.identifier ? this.convertIdentifierName(node.identifier) : null;
        const parameters = node.parameters.map(param => this.convertParameter(param));
        const body = this.convertBlock(node.body);
        
        const funcDecl = this.builder.functionDecl(name, parameters, body, null, this.getLoc(node));
        
        // If it's a local function, add metadata
        if (node.isLocal) {
            funcDecl.metadata = { ...funcDecl.metadata, isLocal: true };
        }
        
        return funcDecl;
    }

    convertLocalStatement(node) {
        // Local variable declarations in Lua
        // Can have multiple variables: local a, b, c = 1, 2, 3
        const declarations = node.variables.map((variable, index) => {
            const name = variable.name;
            const init = node.init && node.init[index] ? this.convertNode(node.init[index]) : null;
            return this.builder.varDecl(name, init, null, {
                kind: 'local',
                ...this.getLoc(variable)
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
        } else if (node.type === 'VarargLiteral') {
            // Handle vararg parameters (...)
            return this.builder.parameter('...', null, null, this.getLoc(node));
        }
        
        throw new Error(`Unsupported parameter type: ${node.type}`);
    }

    convertIdentifierName(node) {
        if (node.type === 'Identifier') {
            return node.name;
        } else if (node.type === 'MemberExpression') {
            // Handle obj.method style declarations
            const obj = this.convertIdentifierName(node.base);
            const prop = this.convertIdentifierName(node.identifier);
            return `${obj}.${prop}`;
        }
        
        return node.name || 'anonymous';
    }

    convertBlock(body) {
        // Lua blocks are just arrays of statements
        const statements = body.map(stmt => this.convertNode(stmt));
        return this.builder.block(statements);
    }

    // ========== STATEMENTS ==========

    convertReturnStatement(node) {
        // Lua can return multiple values, we'll wrap them in an array if needed
        if (node.arguments.length === 0) {
            return this.builder.returnStmt(null, this.getLoc(node));
        } else if (node.arguments.length === 1) {
            return this.builder.returnStmt(this.convertNode(node.arguments[0]), this.getLoc(node));
        } else {
            // Multiple return values - wrap in array
            const elements = node.arguments.map(arg => this.convertNode(arg));
            return this.builder.returnStmt(
                this.builder.arrayLiteral(elements),
                this.getLoc(node)
            );
        }
    }

    convertIfStatement(node) {
        const clauses = node.clauses;
        
        // Build nested if-else chain
        let result = null;
        for (let i = clauses.length - 1; i >= 0; i--) {
            const clause = clauses[i];
            
            if (clause.type === 'ElseClause') {
                // Else clause - just the body
                result = this.convertBlock(clause.body);
            } else if (clause.type === 'ElseifClause' || clause.type === 'IfClause') {
                const condition = this.convertNode(clause.condition);
                const consequent = this.convertBlock(clause.body);
                result = this.builder.ifStmt(condition, consequent, result, this.getLoc(clause));
            }
        }
        
        return result;
    }

    convertWhileStatement(node) {
        const condition = this.convertNode(node.condition);
        const body = this.convertBlock(node.body);
        
        return this.builder.whileStmt(condition, body, this.getLoc(node));
    }

    convertRepeatStatement(node) {
        // Repeat-until in Lua is like do-while
        const body = this.convertBlock(node.body);
        // Negate the condition since repeat continues while condition is false
        const condition = this.builder.not(this.convertNode(node.condition));
        
        return this.builder.doWhileStmt(body, condition, this.getLoc(node));
    }

    convertForNumericStatement(node) {
        // Numeric for loop: for i = start, end, step do ... end
        const varName = node.variable.name;
        const start = this.convertNode(node.start);
        const end = this.convertNode(node.end);
        const step = node.step ? this.convertNode(node.step) : this.builder.literal(1);
        
        // Convert to standard for loop
        const init = this.builder.varDecl(varName, start);
        const condition = this.builder.lessThanOrEqual(
            this.builder.identifier(varName),
            end
        );
        const update = this.builder.assignment(
            this.builder.identifier(varName),
            this.builder.add(this.builder.identifier(varName), step)
        );
        const body = this.convertBlock(node.body);
        
        return this.builder.forStmt(init, condition, update, body, this.getLoc(node));
    }

    convertForGenericStatement(node) {
        // Generic for loop: for k, v in pairs(t) do ... end
        // This is complex, we'll represent it as a while loop with iterator
        // For now, just convert it to a comment and a block
        const body = this.convertBlock(node.body);
        
        // Add metadata to indicate this was a generic for loop
        body.metadata = {
            ...body.metadata,
            luaGenericFor: true,
            variables: node.variables.map(v => v.name),
            iterators: node.iterators.map(iter => this.convertNode(iter))
        };
        
        return body;
    }

    convertBreakStatement(node) {
        return this.builder.breakStmt(this.getLoc(node));
    }

    convertGotoStatement(node) {
        // Lua goto statement - represent as a labeled break
        return this.builder.breakStmt({
            ...this.getLoc(node),
            metadata: { isGoto: true, label: node.label.name }
        });
    }

    convertLabelStatement(node) {
        // Lua label statement - represent as metadata in a block
        return this.builder.block([], {
            ...this.getLoc(node),
            metadata: { isLabel: true, label: node.label.name }
        });
    }

    convertDoStatement(node) {
        // Do-end block in Lua - just convert the body
        return this.convertBlock(node.body);
    }

    convertAssignmentStatement(node) {
        // Lua can have multiple assignments: a, b = 1, 2
        const assignments = node.variables.map((variable, index) => {
            const left = this.convertNode(variable);
            const right = node.init[index] ? this.convertNode(node.init[index]) : this.builder.literal(null);
            return this.builder.assignment(left, right, '=', this.getLoc(node));
        });
        
        if (assignments.length === 1) {
            return this.builder.expressionStmt(assignments[0]);
        }
        
        // Multiple assignments - wrap in a block
        return this.builder.block(assignments.map(a => this.builder.expressionStmt(a)));
    }

    convertCallStatement(node) {
        const call = this.convertNode(node.expression);
        return this.builder.expressionStmt(call, this.getLoc(node));
    }

    // ========== EXPRESSIONS ==========

    convertBinaryExpression(node) {
        const left = this.convertNode(node.left);
        const right = this.convertNode(node.right);
        
        // Map Lua operators to IR operators
        const operatorMap = {
            'and': '&&',
            'or': '||',
            '..': 'concat', // String concatenation (special IR operator for Lua '..')
            '~=': '!=',
        };
        
        const operator = operatorMap[node.operator] || node.operator;
        
        return this.builder.binaryOp(operator, left, right, this.getLoc(node));
    }

    convertLogicalExpression(node) {
        // Same as binary expression in Lua
        return this.convertBinaryExpression(node);
    }

    convertUnaryExpression(node) {
        const operand = this.convertNode(node.argument);
        
        // Map Lua operators to IR operators
        const operatorMap = {
            'not': '!',
            '#': 'length', // Length operator
        };
        
        const operator = operatorMap[node.operator] || node.operator;
        
        return this.builder.unaryOp(operator, operand, true, this.getLoc(node));
    }

    convertCallExpression(node) {
        const callee = this.convertNode(node.base);
        const args = node.arguments.map(arg => this.convertNode(arg));
        
        return this.builder.call(callee, args, this.getLoc(node));
    }

    convertTableCallExpression(node) {
        // Function call with table argument: func{...}
        const callee = this.convertNode(node.base);
        const tableArg = this.convertNode(node.arguments);
        
        return this.builder.call(callee, [tableArg], this.getLoc(node));
    }

    convertStringCallExpression(node) {
        // Function call with string argument: func"..."
        const callee = this.convertNode(node.base);
        const stringArg = this.convertNode(node.argument);
        
        return this.builder.call(callee, [stringArg], this.getLoc(node));
    }

    convertMemberExpression(node) {
        const object = this.convertNode(node.base);
        const property = this.convertNode(node.identifier);
        
        // Lua uses : for method calls, . for property access
        const computed = node.indexer === '[';
        
        return this.builder.member(object, property, computed, this.getLoc(node));
    }

    convertIndexExpression(node) {
        // Array/table indexing: t[key]
        const object = this.convertNode(node.base);
        const property = this.convertNode(node.index);
        
        return this.builder.member(object, property, true, this.getLoc(node));
    }

    convertTableConstructorExpression(node) {
        // Lua table constructor: {a=1, b=2} or {1, 2, 3}
        const fields = node.fields;
        
        // Check if it's an array-like table or object-like
        const isArray = fields.every(field => 
            field.type === 'TableValue' || 
            (field.type === 'TableKeyString' && /^\d+$/.test(field.key.name))
        );
        
        if (isArray) {
            const elements = fields.map(field => {
                if (field.type === 'TableValue') {
                    return this.convertNode(field.value);
                } else if (field.type === 'TableKey') {
                    return this.convertNode(field.value);
                }
            });
            return this.builder.arrayLiteral(elements, this.getLoc(node));
        } else {
            const properties = fields.map(field => {
                let key, value;
                
                if (field.type === 'TableKeyString') {
                    key = this.builder.identifier(field.key.name);
                    value = this.convertNode(field.value);
                } else if (field.type === 'TableKey') {
                    key = this.convertNode(field.key);
                    value = this.convertNode(field.value);
                } else if (field.type === 'TableValue') {
                    // Array-style value, use numeric key
                    key = this.builder.literal(fields.indexOf(field) + 1);
                    value = this.convertNode(field.value);
                }
                
                return this.builder.property(key, value);
            });
            
            return this.builder.objectLiteral(properties, this.getLoc(node));
        }
    }

    convertIdentifier(node) {
        return this.builder.identifier(node.name, this.getLoc(node));
    }

    convertNumericLiteral(node) {
        return this.builder.literal(node.value, Types.number(), this.getLoc(node));
    }

    convertStringLiteral(node) {
        return this.builder.literal(node.value, Types.string(), this.getLoc(node));
    }

    convertBooleanLiteral(node) {
        return this.builder.literal(node.value, Types.boolean(), this.getLoc(node));
    }

    convertNilLiteral(node) {
        return this.builder.literal(null, Types.null(), this.getLoc(node));
    }

    convertVarargLiteral(node) {
        // Vararg literal (...) - represent as a special identifier
        return this.builder.identifier('...', this.getLoc(node));
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
    LuaToIRCompiler
};
