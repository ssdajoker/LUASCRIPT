
/**
 * LUASCRIPT IR to MLIR Compiler
 * 
 * Compiles canonical IR to MLIR (Multi-Level Intermediate Representation)
 */

const { NodeCategory } = require('../../ir/nodes');
const { TypeCategory } = require('../../ir/types');
const { LuascriptDialect } = require('./dialect');

/**
 * MLIR Operation
 */
class MLIROperation {
    constructor(opName, operands = [], results = [], attributes = {}, regions = []) {
        this.opName = opName;
        this.operands = operands;
        this.results = results;
        this.attributes = attributes;
        this.regions = regions;
        this.loc = null;
    }

    toString(indent = 0) {
        const ind = '  '.repeat(indent);
        let str = ind;

        // Results
        if (this.results.length > 0) {
            str += this.results.map(r => `%${r}`).join(', ') + ' = ';
        }

        // Operation
        str += `"${this.opName}"`;

        // Operands
        if (this.operands.length > 0) {
            str += '(' + this.operands.map(o => `%${o}`).join(', ') + ')';
        } else {
            str += '()';
        }

        // Attributes
        if (Object.keys(this.attributes).length > 0) {
            str += ' {';
            const attrs = Object.entries(this.attributes).map(([k, v]) => {
                if (typeof v === 'string') {
                    return `${k} = "${v}"`;
                } else if (typeof v === 'number') {
                    return `${k} = ${v}`;
                } else {
                    return `${k} = ${JSON.stringify(v)}`;
                }
            });
            str += attrs.join(', ');
            str += '}';
        }

        // Regions
        if (this.regions.length > 0) {
            str += ' {\n';
            for (const region of this.regions) {
                str += region.toString(indent + 1);
            }
            str += ind + '}';
        }

        // Location
        if (this.loc) {
            str += ` loc("${this.loc.file}":${this.loc.line}:${this.loc.column})`;
        }

        return str + '\n';
    }
}

/**
 * MLIR Region (contains blocks)
 */
class MLIRRegion {
    constructor() {
        this.blocks = [];
    }

    addBlock(block) {
        this.blocks.push(block);
    }

    toString(indent = 0) {
        return this.blocks.map(b => b.toString(indent)).join('');
    }
}

/**
 * MLIR Block (contains operations)
 */
class MLIRBlock {
    constructor(label = '') {
        this.label = label;
        this.operations = [];
    }

    addOperation(op) {
        this.operations.push(op);
    }

    toString(indent = 0) {
        const ind = '  '.repeat(indent);
        let str = '';
        
        if (this.label) {
            str += `${ind}^${this.label}:\n`;
        }
        
        str += this.operations.map(op => op.toString(indent)).join('');
        
        return str;
    }
}

/**
 * IR to MLIR Compiler
 */
class IRToMLIRCompiler {
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            emitLocations: options.emitLocations !== false,
            ...options
        };
        
        this.dialect = new LuascriptDialect();
        this.valueCounter = 0;
        this.labelCounter = 0;
        this.currentFunction = null;
        this.symbolTable = new Map();
    }

    /**
     * Compile IR program to MLIR
     */
    compile(program) {
        if (program.kind !== NodeCategory.PROGRAM) {
            throw new Error('Expected Program node at root');
        }

        // Reset state
        this.reset();

        // Create module operation
        const moduleOp = new MLIROperation('luascript.module', [], [], {});
        const moduleRegion = new MLIRRegion();
        const moduleBlock = new MLIRBlock();

        // Compile all top-level declarations
        for (const stmt of program.body) {
            if (stmt.kind === NodeCategory.FUNCTION_DECL) {
                const funcOp = this.compileFunctionDecl(stmt);
                moduleBlock.addOperation(funcOp);
            } else if (stmt.kind === NodeCategory.VAR_DECL) {
                const varOps = this.compileGlobalVar(stmt);
                varOps.forEach(op => moduleBlock.addOperation(op));
            }
        }

        moduleRegion.addBlock(moduleBlock);
        moduleOp.regions.push(moduleRegion);

        return this.generateMLIRText(moduleOp);
    }

    /**
     * Reset compiler state
     */
    reset() {
        this.valueCounter = 0;
        this.labelCounter = 0;
        this.currentFunction = null;
        this.symbolTable.clear();
    }

    /**
     * Generate new SSA value name
     */
    newValue(prefix = 'v') {
        return `${prefix}${this.valueCounter++}`;
    }

    /**
     * Generate new label
     */
    newLabel(prefix = 'bb') {
        return `${prefix}${this.labelCounter++}`;
    }

    /**
     * Compile function declaration
     */
    compileFunctionDecl(funcDecl) {
        const funcName = funcDecl.name;
        
        // Build function type
        const paramTypes = funcDecl.parameters.map(p => this.irTypeToMLIRType(p.type));
        const returnType = this.irTypeToMLIRType(funcDecl.returnType);
        const funcType = `(${paramTypes.join(', ')}) -> ${returnType}`;

        // Create function operation
        const funcOp = new MLIROperation(
            'luascript.func',
            [],
            [],
            {
                sym_name: funcName,
                function_type: funcType
            }
        );

        // Setup function context
        this.currentFunction = {
            name: funcName,
            params: funcDecl.parameters,
            locals: new Map()
        };

        // Create function body region
        const bodyRegion = new MLIRRegion();
        const entryBlock = new MLIRBlock('entry');

        // Add parameter allocations
        funcDecl.parameters.forEach((param, idx) => {
            const paramValue = this.newValue(param.name);
            this.currentFunction.locals.set(param.name, paramValue);
            
            // Parameters are already values in MLIR, no need to allocate
            // Just register them in the symbol table
            this.symbolTable.set(param.name, paramValue);
        });

        // Compile function body
        if (funcDecl.body) {
            this.compileBlock(funcDecl.body, entryBlock);
        }

        // Add implicit return if needed
        if (entryBlock.operations.length === 0 || 
            !this.isTerminator(entryBlock.operations[entryBlock.operations.length - 1])) {
            entryBlock.addOperation(new MLIROperation('luascript.return', [], []));
        }

        bodyRegion.addBlock(entryBlock);
        funcOp.regions.push(bodyRegion);

        return funcOp;
    }

    /**
     * Check if operation is a terminator
     */
    isTerminator(op) {
        const terminators = ['luascript.return', 'luascript.break', 'luascript.continue'];
        return terminators.includes(op.opName);
    }

    /**
     * Compile global variable
     */
    compileGlobalVar(varDecl) {
        const ops = [];
        
        // Allocate global
        const refValue = this.newValue(varDecl.name + '_ref');
        const allocOp = new MLIROperation(
            'luascript.alloc',
            [],
            [refValue],
            {
                var_name: varDecl.name,
                type: this.irTypeToMLIRType(varDecl.varType)
            }
        );
        ops.push(allocOp);

        // Initialize if value provided
        if (varDecl.init) {
            const initValue = this.compileExpression(varDecl.init, ops);
            const storeOp = new MLIROperation(
                'luascript.store',
                [refValue, initValue],
                []
            );
            ops.push(storeOp);
        }

        this.symbolTable.set(varDecl.name, refValue);
        return ops;
    }

    /**
     * Compile block of statements
     */
    compileBlock(block, mlirBlock) {
        const statements = block.kind === NodeCategory.BLOCK ? 
            block.body : [block];

        for (const stmt of statements) {
            this.compileStatement(stmt, mlirBlock);
        }
    }

    /**
     * Compile statement
     */
    compileStatement(stmt, mlirBlock) {
        switch (stmt.kind) {
            case NodeCategory.VAR_DECL:
                this.compileVarDecl(stmt, mlirBlock);
                break;
            case NodeCategory.RETURN:
                this.compileReturn(stmt, mlirBlock);
                break;
            case NodeCategory.IF:
                this.compileIf(stmt, mlirBlock);
                break;
            case NodeCategory.WHILE:
                this.compileWhile(stmt, mlirBlock);
                break;
            case NodeCategory.FOR:
                this.compileFor(stmt, mlirBlock);
                break;
            case NodeCategory.EXPRESSION_STMT:
                this.compileExpression(stmt.expression, mlirBlock.operations);
                break;
            case NodeCategory.BLOCK:
                this.compileBlock(stmt, mlirBlock);
                break;
            case NodeCategory.BREAK:
                mlirBlock.addOperation(new MLIROperation('luascript.break', [], []));
                break;
            case NodeCategory.CONTINUE:
                mlirBlock.addOperation(new MLIROperation('luascript.continue', [], []));
                break;
        }
    }

    /**
     * Compile variable declaration
     */
    compileVarDecl(varDecl, mlirBlock) {
        // Allocate local variable
        const refValue = this.newValue(varDecl.name + '_ref');
        const allocOp = new MLIROperation(
            'luascript.alloc',
            [],
            [refValue],
            {
                var_name: varDecl.name,
                type: this.irTypeToMLIRType(varDecl.varType)
            }
        );
        mlirBlock.addOperation(allocOp);

        // Initialize if value provided
        if (varDecl.init) {
            const initValue = this.compileExpression(varDecl.init, mlirBlock.operations);
            const storeOp = new MLIROperation(
                'luascript.store',
                [refValue, initValue],
                []
            );
            mlirBlock.addOperation(storeOp);
        }

        this.symbolTable.set(varDecl.name, refValue);
    }

    /**
     * Compile return statement
     */
    compileReturn(returnStmt, mlirBlock) {
        let returnValue = null;
        
        if (returnStmt.value) {
            returnValue = this.compileExpression(returnStmt.value, mlirBlock.operations);
        }

        const returnOp = new MLIROperation(
            'luascript.return',
            returnValue ? [returnValue] : [],
            []
        );
        mlirBlock.addOperation(returnOp);
    }

    /**
     * Compile if statement
     */
    compileIf(ifStmt, mlirBlock) {
        // Compile condition
        const condValue = this.compileExpression(ifStmt.condition, mlirBlock.operations);

        // Create if operation with regions
        const ifOp = new MLIROperation('luascript.if', [condValue], []);

        // Then region
        const thenRegion = new MLIRRegion();
        const thenBlock = new MLIRBlock();
        this.compileBlock(ifStmt.consequent, thenBlock);
        thenRegion.addBlock(thenBlock);
        ifOp.regions.push(thenRegion);

        // Else region
        if (ifStmt.alternate) {
            const elseRegion = new MLIRRegion();
            const elseBlock = new MLIRBlock();
            this.compileBlock(ifStmt.alternate, elseBlock);
            elseRegion.addBlock(elseBlock);
            ifOp.regions.push(elseRegion);
        }

        mlirBlock.addOperation(ifOp);
    }

    /**
     * Compile while loop
     */
    compileWhile(whileStmt, mlirBlock) {
        // Compile condition
        const condValue = this.compileExpression(whileStmt.condition, mlirBlock.operations);

        // Create while operation
        const whileOp = new MLIROperation('luascript.while', [condValue], []);

        // Body region
        const bodyRegion = new MLIRRegion();
        const bodyBlock = new MLIRBlock();
        this.compileBlock(whileStmt.body, bodyBlock);
        bodyRegion.addBlock(bodyBlock);
        whileOp.regions.push(bodyRegion);

        mlirBlock.addOperation(whileOp);
    }

    /**
     * Compile for loop
     */
    compileFor(forStmt, mlirBlock) {
        // Initialize
        if (forStmt.init) {
            this.compileStatement(forStmt.init, mlirBlock);
        }

        // For MLIR, convert to while loop structure
        // Create condition check and loop body
        
        // This is simplified - full implementation would use proper loop constructs
        const whileOp = new MLIROperation('luascript.while', [], []);
        
        const bodyRegion = new MLIRRegion();
        const bodyBlock = new MLIRBlock();
        
        // Test condition
        if (forStmt.condition) {
            this.compileExpression(forStmt.condition, bodyBlock.operations);
        }
        
        // Body
        this.compileBlock(forStmt.body, bodyBlock);
        
        // Update
        if (forStmt.update) {
            this.compileExpression(forStmt.update, bodyBlock.operations);
        }
        
        bodyRegion.addBlock(bodyBlock);
        whileOp.regions.push(bodyRegion);
        
        mlirBlock.addOperation(whileOp);
    }

    /**
     * Compile expression and return SSA value name
     */
    compileExpression(expr, operations) {
        switch (expr.kind) {
            case NodeCategory.LITERAL:
                return this.compileLiteral(expr, operations);
            case NodeCategory.IDENTIFIER:
                return this.compileIdentifier(expr, operations);
            case NodeCategory.BINARY_OP:
                return this.compileBinaryOp(expr, operations);
            case NodeCategory.UNARY_OP:
                return this.compileUnaryOp(expr, operations);
            case NodeCategory.ASSIGNMENT:
                return this.compileAssignment(expr, operations);
            case NodeCategory.CALL:
                return this.compileCall(expr, operations);
            case NodeCategory.CONDITIONAL:
                return this.compileConditional(expr, operations);
            default:
                // Unknown expression - return constant 0
                const resultValue = this.newValue();
                operations.push(new MLIROperation(
                    'luascript.constant',
                    [],
                    [resultValue],
                    { value: 0, type: 'luascript.integer' }
                ));
                return resultValue;
        }
    }

    /**
     * Compile literal
     */
    compileLiteral(literal, operations) {
        const resultValue = this.newValue();
        const value = literal.value;
        
        let type = 'luascript.any';
        if (typeof value === 'number') {
            type = Number.isInteger(value) ? 'luascript.integer' : 'luascript.number';
        } else if (typeof value === 'boolean') {
            type = 'luascript.boolean';
        } else if (typeof value === 'string') {
            type = 'luascript.string';
        }

        const constOp = new MLIROperation(
            'luascript.constant',
            [],
            [resultValue],
            { value: value, type: type }
        );
        operations.push(constOp);
        
        return resultValue;
    }

    /**
     * Compile identifier reference
     */
    compileIdentifier(identifier, operations) {
        const name = identifier.name;
        
        if (this.symbolTable.has(name)) {
            const refValue = this.symbolTable.get(name);
            
            // Load value from reference
            const resultValue = this.newValue();
            const loadOp = new MLIROperation(
                'luascript.load',
                [refValue],
                [resultValue]
            );
            operations.push(loadOp);
            
            return resultValue;
        } else {
            // Unknown identifier - return constant 0
            const resultValue = this.newValue();
            operations.push(new MLIROperation(
                'luascript.constant',
                [],
                [resultValue],
                { value: 0, type: 'luascript.integer' }
            ));
            return resultValue;
        }
    }

    /**
     * Compile binary operation
     */
    compileBinaryOp(binOp, operations) {
        const lhsValue = this.compileExpression(binOp.left, operations);
        const rhsValue = this.compileExpression(binOp.right, operations);
        const resultValue = this.newValue();

        let opName = null;
        const attrs = {};

        switch (binOp.operator) {
            case '+':
                opName = 'luascript.add';
                break;
            case '-':
                opName = 'luascript.sub';
                break;
            case '*':
                opName = 'luascript.mul';
                break;
            case '/':
                opName = 'luascript.div';
                break;
            case '%':
                opName = 'luascript.mod';
                break;
            case '==':
            case '===':
                opName = 'luascript.cmp';
                attrs.predicate = 'eq';
                break;
            case '!=':
            case '!==':
                opName = 'luascript.cmp';
                attrs.predicate = 'ne';
                break;
            case '<':
                opName = 'luascript.cmp';
                attrs.predicate = 'lt';
                break;
            case '<=':
                opName = 'luascript.cmp';
                attrs.predicate = 'le';
                break;
            case '>':
                opName = 'luascript.cmp';
                attrs.predicate = 'gt';
                break;
            case '>=':
                opName = 'luascript.cmp';
                attrs.predicate = 'ge';
                break;
            case '&&':
                opName = 'luascript.and';
                break;
            case '||':
                opName = 'luascript.or';
                break;
            default:
                opName = 'luascript.add'; // Default fallback
        }

        const op = new MLIROperation(opName, [lhsValue, rhsValue], [resultValue], attrs);
        operations.push(op);

        return resultValue;
    }

    /**
     * Compile unary operation
     */
    compileUnaryOp(unaryOp, operations) {
        const operandValue = this.compileExpression(unaryOp.operand, operations);
        const resultValue = this.newValue();

        let opName = null;
        switch (unaryOp.operator) {
            case '-':
                opName = 'luascript.neg';
                break;
            case '!':
                opName = 'luascript.not';
                break;
            default:
                opName = 'luascript.not'; // Default fallback
        }

        const op = new MLIROperation(opName, [operandValue], [resultValue]);
        operations.push(op);

        return resultValue;
    }

    /**
     * Compile assignment
     */
    compileAssignment(assignment, operations) {
        const value = this.compileExpression(assignment.value, operations);

        if (assignment.target.kind === NodeCategory.IDENTIFIER) {
            const name = assignment.target.name;
            
            if (this.symbolTable.has(name)) {
                const refValue = this.symbolTable.get(name);
                const storeOp = new MLIROperation(
                    'luascript.store',
                    [refValue, value],
                    []
                );
                operations.push(storeOp);
            }
        }

        return value;
    }

    /**
     * Compile function call
     */
    compileCall(call, operations) {
        // Compile arguments
        const argValues = call.args.map(arg => this.compileExpression(arg, operations));

        // Get callee name
        let calleeName = '';
        if (call.callee.kind === NodeCategory.IDENTIFIER) {
            calleeName = call.callee.name;
        }

        const resultValue = this.newValue();
        const callOp = new MLIROperation(
            'luascript.call',
            argValues,
            [resultValue],
            { callee_name: calleeName }
        );
        operations.push(callOp);

        return resultValue;
    }

    /**
     * Compile conditional expression
     */
    compileConditional(conditional, operations) {
        // Evaluate condition, then branch, and else branch
        const condValue = this.compileExpression(conditional.condition, operations);
        const thenValue = this.compileExpression(conditional.consequent, operations);
        const elseValue = this.compileExpression(conditional.alternate, operations);
        // Use a special select operation (simplified)
        const resultValue = this.newValue();
        const selectOp = new MLIROperation(
            'luascript.select',
            [condValue, thenValue, elseValue],
            [resultValue]
        );
        operations.push(selectOp);
        return resultValue;
    }

    /**
     * Convert IR type to MLIR type
     */
    irTypeToMLIRType(irType) {
        if (!irType) return 'luascript.any';

        switch (irType.category) {
            case TypeCategory.PRIMITIVE:
                switch (irType.primitiveType) {
                    case 'number':
                        return 'luascript.number';
                    case 'boolean':
                        return 'luascript.boolean';
                    case 'string':
                        return 'luascript.string';
                    case 'void':
                        return 'luascript.void';
                    default:
                        return 'luascript.any';
                }
            case TypeCategory.ARRAY:
                return `luascript.array<${this.irTypeToMLIRType(irType.elementType)}>`;
            case TypeCategory.OBJECT:
                return 'luascript.object';
            case TypeCategory.FUNCTION:
                const paramTypes = irType.paramTypes.map(t => this.irTypeToMLIRType(t)).join(', ');
                const returnType = this.irTypeToMLIRType(irType.returnType);
                return `luascript.function<(${paramTypes}) -> ${returnType}>`;
            default:
                return 'luascript.any';
        }
    }

    /**
     * Generate MLIR text representation
     */
    generateMLIRText(moduleOp) {
        let mlir = '// Generated MLIR for LUASCRIPT\n';
        mlir += '// Dialect: luascript\n\n';
        mlir += moduleOp.toString();
        return mlir;
    }
}

module.exports = { IRToMLIRCompiler, MLIROperation, MLIRRegion, MLIRBlock };
