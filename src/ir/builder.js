
/**
 * LUASCRIPT IR Builder
 * 
 * Provides convenience functions for building IR nodes.
 */

const nodes = require('./nodes');
const { Types } = require('./types');
const { BalancedTernaryIdGenerator } = require("./idGenerator"); // Import idGenerator

class IRBuilder {
    constructor(options = {}) {
        this.nodes = {}; // Stores all nodes by ID
        this.module = {
            body: [], // Array of node IDs in the module body
            metadata: options.metadata || {},
            source: options.source || {},
            directives: options.directives || [],
            toolchain: options.toolchain || {},
            schemaVersion: options.schemaVersion || "1.0.0",
        };
        this.idGenerator = new BalancedTernaryIdGenerator({ prefix: "node" }); // Use BalancedTernaryIdGenerator
    }

    // Helper to generate a unique ID
    _generateId() {
        return this.idGenerator.next();
    }

    // Helper to store a node and return the node itself (with its new ID)
    _storeNode(node) {
        const id = this._generateId();
        node.id = id;
        this.nodes[id] = node;
        return node;
    }

    // New methods
    pushToBody(node) {
        if (!node || !node.id) {
            throw new Error("Cannot push null or un-ID'd node to body");
        }
        this.module.body.push(node.id);
    }

    build(options = {}) {
        // Ensure module has an ID
        if (!this.module.id) {
            this.module.id = this._generateId();
        }
        
        // Return IR artifact with schema version at top level
        return {
            schemaVersion: this.module.schemaVersion,
            module: this.module,
            nodes: this.nodes,
        };
    }

    // ========== DECLARATIONS ==========

    program(body) {
        return this._storeNode(new nodes.Program(body));
    }

    functionDeclaration(name, parameters, body, returnType = null, options = {}) {
        return this._storeNode(new nodes.FunctionDecl(name, parameters, body, returnType, options));
    }

    varDecl(name, init = null, type = null, options = {}) {
        return this._storeNode(new nodes.VarDecl(name, init, type, options));
    }

    variableDeclaration(declarations, options = {}) {
        return this._storeNode(new nodes.VariableDeclaration(declarations, options));
    }

    parameter(name, type = null, defaultValue = null, options = {}) {
        return this._storeNode(new nodes.Parameter(name, type, defaultValue, options));
    }

    // ========== STATEMENTS ==========

    block(statements, options = {}) {
        return this._storeNode(new nodes.Block(statements, options));
    }

    returnStmt(value = null, options = {}) {
        return this._storeNode(new nodes.Return(value, options));
    }

    ifStmt(condition, consequent, alternate = null, options = {}) {
        return this._storeNode(new nodes.If(condition, consequent, alternate, options));
    }

    whileStmt(condition, body, options = {}) {
        return this._storeNode(new nodes.While(condition, body, options));
    }

    forStmt(init, condition, update, body, options = {}) {
        return this._storeNode(new nodes.For(init, condition, update, body, options));
    }

    doWhileStmt(body, condition, options = {}) {
        return this._storeNode(new nodes.DoWhile(body, condition, options));
    }

    switchStmt(discriminant, cases, options = {}) {
        return this._storeNode(new nodes.Switch(discriminant, cases, options));
    }

    caseStmt(test, consequent, options = {}) {
        return this._storeNode(new nodes.Case(test, consequent, options));
    }

    breakStmt(options = {}) {
        return this._storeNode(new nodes.Break(options));
    }

    continueStmt(options = {}) {
        return this._storeNode(new nodes.Continue(options));
    }

    expressionStmt(expression, options = {}) {
        return this._storeNode(new nodes.ExpressionStmt(expression, options));
    }

    // ========== EXPRESSIONS ==========

    binaryOp(operator, left, right, options = {}) {
        return this._storeNode(new nodes.BinaryOp(operator, left, right, options));
    }

    unaryOp(operator, operand, prefix = true, options = {}) {
        return this._storeNode(new nodes.UnaryOp(operator, operand, prefix, options));
    }

    call(callee, args, options = {}) {
        return this._storeNode(new nodes.Call(callee, args, options));
    }

    member(object, property, computed = false, options = {}) {
        return this._storeNode(new nodes.Member(object, property, computed, options));
    }

    callExpression(callee, args, options = {}) {
        return this.call(callee, args, options);
    }

    arrayLiteral(elements, options = {}) {
        return this._storeNode(new nodes.ArrayLiteral(elements, options));
    }

    objectLiteral(properties, options = {}) {
        return this._storeNode(new nodes.ObjectLiteral(properties, options));
    }

    property(key, value, options = {}) {
        return this._storeNode(new nodes.Property(key, value, options));
    }

    identifier(name, options = {}) {
        return this._storeNode(new nodes.Identifier(name, options));
    }

    literal(value, type = null, options = {}) {
        if (type === null) {
            // Infer type from value
            if (typeof value === 'number') {
                type = Types.number();
            } else if (typeof value === 'string') {
                type = Types.string();
            } else if (typeof value === 'boolean') {
                type = Types.boolean();
            } else if (value === null) {
                type = Types.null();
            } else if (value === undefined) {
                type = Types.undefined();
            }
        }
        return this._storeNode(new nodes.Literal(value, type, options));
    }

    assignment(left, right, operator = '=', options = {}) {
        return this._storeNode(new nodes.Assignment(left, right, operator, options));
    }

    conditional(condition, consequent, alternate, options = {}) {
        return this._storeNode(new nodes.Conditional(condition, consequent, alternate, options));
    }

    // ========== HELPER METHODS ==========

    /**
     * Create a function call with named arguments
     */
    namedCall(functionName, args, options = {}) {
        return this.call(this.identifier(functionName), args, options);
    }

    /**
     * Create a member access (obj.prop or obj[prop])
     */
    memberAccess(objectName, propertyName, computed = false, options = {}) {
        const object = typeof objectName === 'string' 
            ? this.identifier(objectName) 
            : objectName;
        const property = typeof propertyName === 'string'
            ? this.identifier(propertyName)
            : propertyName;
        return this.member(object, property, computed, options);
    }

    /**
     * Create a simple assignment statement (var = value)
     */
    simpleAssignment(varName, value, options = {}) {
        return this.assignment(this.identifier(varName), value, '=', options);
    }

    /**
     * Create arithmetic operations
     */
    add(left, right, options = {}) {
        return this.binaryOp('+', left, right, options);
    }

    subtract(left, right, options = {}) {
        return this.binaryOp('-', left, right, options);
    }

    multiply(left, right, options = {}) {
        return this.binaryOp('*', left, right, options);
    }

    divide(left, right, options = {}) {
        return this.binaryOp('/', left, right, options);
    }

    modulo(left, right, options = {}) {
        return this.binaryOp('%', left, right, options);
    }

    /**
     * Create comparison operations
     */
    equals(left, right, options = {}) {
        return this.binaryOp('==', left, right, options);
    }

    notEquals(left, right, options = {}) {
        return this.binaryOp('!=', left, right, options);
    }

    lessThan(left, right, options = {}) {
        return this.binaryOp('<', left, right, options);
    }

    lessThanOrEqual(left, right, options = {}) {
        return this.binaryOp('<=', left, right, options);
    }

    greaterThan(left, right, options = {}) {
        return this.binaryOp('>', left, right, options);
    }

    greaterThanOrEqual(left, right, options = {}) {
        return this.binaryOp('>=', left, right, options);
    }

    /**
     * Create logical operations
     */
    and(left, right, options = {}) {
        return this.binaryOp('&&', left, right, options);
    }

    or(left, right, options = {}) {
        return this.binaryOp('||', left, right, options);
    }

    not(operand, options = {}) {
        return this.unaryOp('!', operand, true, options);
    }

    /**
     * Create a variable declaration with initialization
     */
    declareAndInit(name, value, kind = 'let', type = null, options = {}) {
        return this.varDecl(name, value, type, { ...options, kind });
    }

    /**
     * Create a constant declaration
     */
    constant(name, value, type = null, options = {}) {
        return this.declareAndInit(name, value, 'const', type, options);
    }

    // ========== ALIASES FOR LOWERER COMPATIBILITY ==========
    // These methods provide alternative names used by the lowerer

    blockStatement(statements, options = {}) {
        return this.block(statements, options);
    }

    break() {
        return this.breakStmt();
    }

    continue() {
        return this.continueStmt();
    }

    expressionStatement(expression, options = {}) {
        return this.expressionStmt(expression, options);
    }

    returnStatement(value = null, options = {}) {
        return this.returnStmt(value, options);
    }

    forStatement(init, condition, update, body, options = {}) {
        return this.forStmt(init, condition, update, body, options);
    }

    doWhileStatement(body, condition, options = {}) {
        return this.doWhileStmt(body, condition, options);
    }

    switchStatement(discriminant, cases, options = {}) {
        return this.switchStmt(discriminant, cases, options);
    }

    switchCase(test, consequent, options = {}) {
        return this.caseStmt(test, consequent, options);
    }

    blockStatement(statements, options = {}) {
        return this.block(statements, options);
    }

    expressionStatement(expression, options = {}) {
        return this.expressionStmt(expression, options);
    }

    returnStatement(value = null, options = {}) {
        return this.returnStmt(value, options);
    }

    ifStatement(condition, consequent, alternate = null, options = {}) {
        return this.ifStmt(condition, consequent, alternate, options);
    }

    whileStatement(condition, body, options = {}) {
        return this.whileStmt(condition, body, options);
    }

    binaryExpression(left, operator, right, options = {}) {
        return this.binaryOp(operator, left, right, options);
    }

    unaryExpression(operator, operand, options = {}) {
        return this.unaryOp(operator, operand, true, options);
    }

    updateExpression(operator, argument, options = {}) {
        // UpdateExpression is like i++ or ++i
        // We can model it as assignment with binary op
        const prefix = options.prefix !== false;
        const one = this.literal(1, Types.number());
        const binOp = operator === '++' ? '+' : '-';
        const result = this.binaryOp(binOp, argument, one);
        return this.assignment(argument, result, '=', { ...options, updateOp: operator, prefix });
    }

    callExpression(callee, args, options = {}) {
        return this.call(callee, args, options);
    }

    callExpression(callee, args, options = {}) {
        return this.call(callee, args, options);
    }

    newExpression(callee, args, options = {}) {
        return this.call(callee, args, { ...options, isNew: true });
    }

    createMemberExpression(object, property, options = {}) {
        return this.member(object, property, options.computed || false, options);
    }

    memberExpression(object, property, computed = false, options = {}) {
        return this.member(object, property, computed, options);
    }

    arrayExpression(elements, options = {}) {
        return this.arrayLiteral(elements, options);
    }

    objectExpression(properties, options = {}) {
        return this.objectLiteral(properties, options);
    }

    conditionalExpression(test, consequent, alternate, options = {}) {
        return this.conditional(test, consequent, alternate, options);
    }

    logicalExpression(left, operator, right, options = {}) {
        return this.binaryOp(operator, left, right, options);
    }

    assignmentExpression(left, operator, right, options = {}) {
        return this.assignment(left, right, operator, options);
    }

    functionDecl(name, parameters, body, returnType = null, options = {}) {
        return this.functionDeclaration(name, parameters, body, returnType, options);
    }

    functionExpression(id, parameters, body, options = {}) {
        const name = id && id.name ? id.name : id || null;
        return this.functionDeclaration(name, parameters, body, null, { ...options, expression: true });
    }

    arrowFunctionExpression(parameters, body, options = {}) {
        // Arrow functions are similar to regular functions but with different semantics
        return this.functionDeclaration(null, parameters, body, null, { ...options, arrow: true, expression: true });
    }

    arrayPattern(elements, options = {}) {
        return this._storeNode(new nodes.ArrayPattern(elements, options));
    }

    objectPattern(properties, options = {}) {
        return this._storeNode(new nodes.ObjectPattern(properties, options));
    }

    restElement(argument, options = {}) {
        return this._storeNode(new nodes.RestElement(argument, options));
    }

    assignmentPattern(left, right, options = {}) {
        return this._storeNode(new nodes.AssignmentPattern(left, right, options));
    }

    registerControlFlowGraph(cfgId, cfg) {
        // Store CFG in module metadata
        if (!this.module.metadata.controlFlowGraphs) {
            this.module.metadata.controlFlowGraphs = {};
        }
        this.module.metadata.controlFlowGraphs[cfgId] = cfg;
    }
}

// Export a singleton instance
const builder = new IRBuilder();

module.exports = {
    IRBuilder,
    builder
};
