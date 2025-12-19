
/**
 * LUASCRIPT IR Builder
 * 
 * Provides convenience functions for building IR nodes.
 */

const nodes = require('./nodes');
const { Types } = require('./types');

class IRBuilder {
    constructor() {
        this.nodeStack = [];
    }

    // ========== DECLARATIONS ==========

    program(body) {
        return new nodes.Program(body);
    }

    functionDecl(name, parameters, body, returnType = null, options = {}) {
        return new nodes.FunctionDecl(name, parameters, body, returnType, options);
    }

    varDecl(name, init = null, type = null, options = {}) {
        return new nodes.VarDecl(name, init, type, options);
    }

    parameter(name, type = null, defaultValue = null, options = {}) {
        return new nodes.Parameter(name, type, defaultValue, options);
    }

    // ========== STATEMENTS ==========

    blockStmt(statements, options = {}) {
        return new nodes.Block(statements, options);
    }

    block(statements, options = {}) {
        return this.blockStmt(statements, options);
    }

    returnStmt(value = null, options = {}) {
        return new nodes.Return(value, options);
    }

    ifStmt(condition, consequent, alternate = null, options = {}) {
        return new nodes.If(condition, consequent, alternate, options);
    }

    whileStmt(condition, body, options = {}) {
        return new nodes.While(condition, body, options);
    }

    forStmt(init, condition, update, body, options = {}) {
        return new nodes.For(init, condition, update, body, options);
    }

    doWhileStmt(body, condition, options = {}) {
        return new nodes.DoWhile(body, condition, options);
    }

    switchStmt(discriminant, cases, options = {}) {
        return new nodes.Switch(discriminant, cases, options);
    }

    caseStmt(test, consequent, options = {}) {
        return new nodes.Case(test, consequent, options);
    }

    breakStmt(options = {}) {
        return new nodes.Break(options);
    }

    continueStmt(options = {}) {
        return new nodes.Continue(options);
    }

    expressionStmt(expression, options = {}) {
        return new nodes.ExpressionStmt(expression, options);
    }

    // ========== EXPRESSIONS ==========

    binaryOp(operator, left, right, options = {}) {
        return new nodes.BinaryOp(operator, left, right, options);
    }

    unaryOp(operator, operand, prefix = true, options = {}) {
        return new nodes.UnaryOp(operator, operand, prefix, options);
    }

    call(callee, args, options = {}) {
        return new nodes.Call(callee, args, options);
    }

    member(object, property, computed = false, options = {}) {
        return new nodes.Member(object, property, computed, options);
    }

    arrayLiteral(elements, options = {}) {
        return new nodes.ArrayLiteral(elements, options);
    }

    objectLiteral(properties, options = {}) {
        return new nodes.ObjectLiteral(properties, options);
    }

    property(key, value, options = {}) {
        return new nodes.Property(key, value, options);
    }

    identifier(name, options = {}) {
        return new nodes.Identifier(name, options);
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
        return new nodes.Literal(value, type, options);
    }

    assignment(left, right, operator = '=', options = {}) {
        return new nodes.Assignment(left, right, operator, options);
    }

    conditional(condition, consequent, alternate, options = {}) {
        return new nodes.Conditional(condition, consequent, alternate, options);
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

}

// Export a singleton instance
const builder = new IRBuilder();

module.exports = {
    IRBuilder,
    builder
};
