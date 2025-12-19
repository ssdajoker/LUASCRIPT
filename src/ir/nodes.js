
/**
 * LUASCRIPT IR Node Definitions
 * 
 * Defines all node types for the canonical Intermediate Representation.
 */

const { Types } = require('./types');
const { BalancedTernaryIdGenerator } = require('./idGenerator');

/**
 * Node Categories
 */
const NodeCategory = {
    // Declarations
    PROGRAM: 'Program',
    FUNCTION_DECL: 'FunctionDecl',
    VAR_DECL: 'VarDecl',
    PARAMETER: 'Parameter',
    
    // Statements
    BLOCK: 'Block',
    RETURN: 'Return',
    IF: 'If',
    WHILE: 'While',
    FOR: 'For',
    DO_WHILE: 'DoWhile',
    SWITCH: 'Switch',
    CASE: 'Case',
    BREAK: 'Break',
    CONTINUE: 'Continue',
    EXPRESSION_STMT: 'ExpressionStmt',
    
    // Expressions
    BINARY_OP: 'BinaryOp',
    UNARY_OP: 'UnaryOp',
    CALL: 'Call',
    MEMBER: 'Member',
    ARRAY_LITERAL: 'ArrayLiteral',
    OBJECT_LITERAL: 'ObjectLiteral',
    IDENTIFIER: 'Identifier',
    LITERAL: 'Literal',
    ASSIGNMENT: 'Assignment',
    CONDITIONAL: 'Conditional',
    
    // Special
    PROPERTY: 'Property'
};

/**
 * Base Node class
 */
class IRNode {
    constructor(kind, options = {}) {
        this.kind = kind;
        this.loc = options.loc || null; // Source location
        this.metadata = options.metadata || {};
    }

    toJSON() {
        const json = { kind: this.kind };
        
        if (this.loc) json.loc = this.loc;
        if (Object.keys(this.metadata).length > 0) json.metadata = this.metadata;
        
        return json;
    }

    static fromJSON(json) {
        // Factory method to reconstruct nodes from JSON
        switch (json.kind) {
            case NodeCategory.PROGRAM:
                return Program.fromJSON(json);
            case NodeCategory.FUNCTION_DECL:
                return FunctionDecl.fromJSON(json);
            case NodeCategory.VAR_DECL:
                return VarDecl.fromJSON(json);
            case NodeCategory.PARAMETER:
                return Parameter.fromJSON(json);
            case NodeCategory.BLOCK:
                return Block.fromJSON(json);
            case NodeCategory.RETURN:
                return Return.fromJSON(json);
            case NodeCategory.IF:
                return If.fromJSON(json);
            case NodeCategory.WHILE:
                return While.fromJSON(json);
            case NodeCategory.FOR:
                return For.fromJSON(json);
            case NodeCategory.DO_WHILE:
                return DoWhile.fromJSON(json);
            case NodeCategory.SWITCH:
                return Switch.fromJSON(json);
            case NodeCategory.CASE:
                return Case.fromJSON(json);
            case NodeCategory.BREAK:
                return Break.fromJSON(json);
            case NodeCategory.CONTINUE:
                return Continue.fromJSON(json);
            case NodeCategory.EXPRESSION_STMT:
                return ExpressionStmt.fromJSON(json);
            case NodeCategory.BINARY_OP:
                return BinaryOp.fromJSON(json);
            case NodeCategory.UNARY_OP:
                return UnaryOp.fromJSON(json);
            case NodeCategory.CALL:
                return Call.fromJSON(json);
            case NodeCategory.MEMBER:
                return Member.fromJSON(json);
            case NodeCategory.ARRAY_LITERAL:
                return ArrayLiteral.fromJSON(json);
            case NodeCategory.OBJECT_LITERAL:
                return ObjectLiteral.fromJSON(json);
            case NodeCategory.IDENTIFIER:
                return Identifier.fromJSON(json);
            case NodeCategory.LITERAL:
                return Literal.fromJSON(json);
            case NodeCategory.ASSIGNMENT:
                return Assignment.fromJSON(json);
            case NodeCategory.CONDITIONAL:
                return Conditional.fromJSON(json);
            case NodeCategory.PROPERTY:
                return Property.fromJSON(json);
            default:
                throw new Error(`Unknown node kind: ${json.kind}`);
        }
    }
}

// ========== DECLARATIONS ==========

class Program extends IRNode {
    constructor(body, options = {}) {
        super(NodeCategory.PROGRAM, options);
        this.body = body; // Array of statements
    }

    toJSON() {
        return {
            ...super.toJSON(),
            body: this.body.map(stmt => stmt.toJSON())
        };
    }

    static fromJSON(json) {
        return new Program(
            json.body.map(stmt => IRNode.fromJSON(stmt)),
            json
        );
    }
}

class FunctionDecl extends IRNode {
    constructor(name, parameters, body, returnType = null, options = {}) {
        super(NodeCategory.FUNCTION_DECL, options);
        this.name = name;
        this.parameters = parameters; // Array of Parameter nodes
        this.body = body; // Block node
        this.returnType = returnType;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            parameters: this.parameters.map(p => p.toJSON()),
            body: this.body.toJSON(),
            returnType: this.returnType ? this.returnType.toJSON() : null
        };
    }

    static fromJSON(json) {
        return new FunctionDecl(
            json.name,
            json.parameters.map(p => IRNode.fromJSON(p)),
            IRNode.fromJSON(json.body),
            json.returnType ? require('./types').Type.fromJSON(json.returnType) : null,
            json
        );
    }
}

class VarDecl extends IRNode {
    constructor(name, init = null, type = null, options = {}) {
        super(NodeCategory.VAR_DECL, options);
        this.name = name;
        this.init = init; // Expression node or null
        this.type = type; // Type or null
        this.varKind = options.kind || 'let'; // 'let', 'const', 'var'
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            init: this.init ? this.init.toJSON() : null,
            type: this.type ? this.type.toJSON() : null,
            varKind: this.varKind
        };
    }

    static fromJSON(json) {
        return new VarDecl(
            json.name,
            json.init ? IRNode.fromJSON(json.init) : null,
            json.type ? require('./types').Type.fromJSON(json.type) : null,
            { ...json, kind: json.varKind }
        );
    }
}

class Parameter extends IRNode {
    constructor(name, type = null, defaultValue = null, options = {}) {
        super(NodeCategory.PARAMETER, options);
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            type: this.type ? this.type.toJSON() : null,
            defaultValue: this.defaultValue ? this.defaultValue.toJSON() : null
        };
    }

    static fromJSON(json) {
        return new Parameter(
            json.name,
            json.type ? require('./types').Type.fromJSON(json.type) : null,
            json.defaultValue ? IRNode.fromJSON(json.defaultValue) : null,
            json
        );
    }
}

// ========== STATEMENTS ==========

class Block extends IRNode {
    constructor(statements, options = {}) {
        super(NodeCategory.BLOCK, options);
        this.statements = statements;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            statements: this.statements.map(stmt => stmt.toJSON())
        };
    }

    static fromJSON(json) {
        return new Block(
            json.statements.map(stmt => IRNode.fromJSON(stmt)),
            json
        );
    }
}

class Return extends IRNode {
    constructor(value = null, options = {}) {
        super(NodeCategory.RETURN, options);
        this.value = value;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            value: this.value ? this.value.toJSON() : null
        };
    }

    static fromJSON(json) {
        return new Return(
            json.value ? IRNode.fromJSON(json.value) : null,
            json
        );
    }
}

class If extends IRNode {
    constructor(condition, consequent, alternate = null, options = {}) {
        super(NodeCategory.IF, options);
        this.condition = condition;
        this.consequent = consequent; // Block or statement
        this.alternate = alternate; // Block, If, or null
    }

    toJSON() {
        return {
            ...super.toJSON(),
            condition: this.condition.toJSON(),
            consequent: this.consequent.toJSON(),
            alternate: this.alternate ? this.alternate.toJSON() : null
        };
    }

    static fromJSON(json) {
        return new If(
            IRNode.fromJSON(json.condition),
            IRNode.fromJSON(json.consequent),
            json.alternate ? IRNode.fromJSON(json.alternate) : null,
            json
        );
    }
}

class While extends IRNode {
    constructor(condition, body, options = {}) {
        super(NodeCategory.WHILE, options);
        this.condition = condition;
        this.body = body;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            condition: this.condition.toJSON(),
            body: this.body.toJSON()
        };
    }

    static fromJSON(json) {
        return new While(
            IRNode.fromJSON(json.condition),
            IRNode.fromJSON(json.body),
            json
        );
    }
}

class For extends IRNode {
    constructor(init, condition, update, body, options = {}) {
        super(NodeCategory.FOR, options);
        this.init = init; // VarDecl, Assignment, or null
        this.condition = condition; // Expression or null
        this.update = update; // Expression or null
        this.body = body;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            init: this.init ? this.init.toJSON() : null,
            condition: this.condition ? this.condition.toJSON() : null,
            update: this.update ? this.update.toJSON() : null,
            body: this.body.toJSON()
        };
    }

    static fromJSON(json) {
        return new For(
            json.init ? IRNode.fromJSON(json.init) : null,
            json.condition ? IRNode.fromJSON(json.condition) : null,
            json.update ? IRNode.fromJSON(json.update) : null,
            IRNode.fromJSON(json.body),
            json
        );
    }
}

class DoWhile extends IRNode {
    constructor(body, condition, options = {}) {
        super(NodeCategory.DO_WHILE, options);
        this.body = body;
        this.condition = condition;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            body: this.body.toJSON(),
            condition: this.condition.toJSON()
        };
    }

    static fromJSON(json) {
        return new DoWhile(
            IRNode.fromJSON(json.body),
            IRNode.fromJSON(json.condition),
            json
        );
    }
}

class Switch extends IRNode {
    constructor(discriminant, cases, options = {}) {
        super(NodeCategory.SWITCH, options);
        this.discriminant = discriminant;
        this.cases = cases; // Array of Case nodes
    }

    toJSON() {
        return {
            ...super.toJSON(),
            discriminant: this.discriminant.toJSON(),
            cases: this.cases.map(c => c.toJSON())
        };
    }

    static fromJSON(json) {
        return new Switch(
            IRNode.fromJSON(json.discriminant),
            json.cases.map(c => IRNode.fromJSON(c)),
            json
        );
    }
}

class Case extends IRNode {
    constructor(test, consequent, options = {}) {
        super(NodeCategory.CASE, options);
        this.test = test; // Expression or null (for default)
        this.consequent = consequent; // Array of statements
    }

    toJSON() {
        return {
            ...super.toJSON(),
            test: this.test ? this.test.toJSON() : null,
            consequent: this.consequent.map(stmt => stmt.toJSON())
        };
    }

    static fromJSON(json) {
        return new Case(
            json.test ? IRNode.fromJSON(json.test) : null,
            json.consequent.map(stmt => IRNode.fromJSON(stmt)),
            json
        );
    }
}

class Break extends IRNode {
    constructor(options = {}) {
        super(NodeCategory.BREAK, options);
    }

    static fromJSON(json) {
        return new Break(json);
    }
}

class Continue extends IRNode {
    constructor(options = {}) {
        super(NodeCategory.CONTINUE, options);
    }

    static fromJSON(json) {
        return new Continue(json);
    }
}

class ExpressionStmt extends IRNode {
    constructor(expression, options = {}) {
        super(NodeCategory.EXPRESSION_STMT, options);
        this.expression = expression;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            expression: this.expression.toJSON()
        };
    }

    static fromJSON(json) {
        return new ExpressionStmt(
            IRNode.fromJSON(json.expression),
            json
        );
    }
}

// ========== EXPRESSIONS ==========

class BinaryOp extends IRNode {
    constructor(operator, left, right, options = {}) {
        super(NodeCategory.BINARY_OP, options);
        this.operator = operator; // +, -, *, /, %, ==, !=, <, >, <=, >=, &&, ||, etc.
        this.left = left;
        this.right = right;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operator: this.operator,
            left: this.left.toJSON(),
            right: this.right.toJSON()
        };
    }

    static fromJSON(json) {
        return new BinaryOp(
            json.operator,
            IRNode.fromJSON(json.left),
            IRNode.fromJSON(json.right),
            json
        );
    }
}

class UnaryOp extends IRNode {
    constructor(operator, operand, prefix = true, options = {}) {
        super(NodeCategory.UNARY_OP, options);
        this.operator = operator; // +, -, !, ~, ++, --, typeof, etc.
        this.operand = operand;
        this.prefix = prefix;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operator: this.operator,
            operand: this.operand.toJSON(),
            prefix: this.prefix
        };
    }

    static fromJSON(json) {
        return new UnaryOp(
            json.operator,
            IRNode.fromJSON(json.operand),
            json.prefix,
            json
        );
    }
}

class Call extends IRNode {
    constructor(callee, args, options = {}) {
        super(NodeCategory.CALL, options);
        this.callee = callee; // Identifier or Member
        this.args = args; // Array of expressions
    }

    toJSON() {
        return {
            ...super.toJSON(),
            callee: this.callee.toJSON(),
            args: this.args.map(arg => arg.toJSON())
        };
    }

    static fromJSON(json) {
        return new Call(
            IRNode.fromJSON(json.callee),
            json.args.map(arg => IRNode.fromJSON(arg)),
            json
        );
    }
}

class Member extends IRNode {
    constructor(object, property, computed = false, options = {}) {
        super(NodeCategory.MEMBER, options);
        this.object = object;
        this.property = property;
        this.computed = computed; // true for obj[prop], false for obj.prop
    }

    toJSON() {
        return {
            ...super.toJSON(),
            object: this.object.toJSON(),
            property: this.property.toJSON(),
            computed: this.computed
        };
    }

    static fromJSON(json) {
        return new Member(
            IRNode.fromJSON(json.object),
            IRNode.fromJSON(json.property),
            json.computed,
            json
        );
    }
}

class ArrayLiteral extends IRNode {
    constructor(elements, options = {}) {
        super(NodeCategory.ARRAY_LITERAL, options);
        this.elements = elements; // Array of expressions
    }

    toJSON() {
        return {
            ...super.toJSON(),
            elements: this.elements.map(el => el ? el.toJSON() : null)
        };
    }

    static fromJSON(json) {
        return new ArrayLiteral(
            json.elements.map(el => el ? IRNode.fromJSON(el) : null),
            json
        );
    }
}

class ObjectLiteral extends IRNode {
    constructor(properties, options = {}) {
        super(NodeCategory.OBJECT_LITERAL, options);
        this.properties = properties; // Array of Property nodes
    }

    toJSON() {
        return {
            ...super.toJSON(),
            properties: this.properties.map(prop => prop.toJSON())
        };
    }

    static fromJSON(json) {
        return new ObjectLiteral(
            json.properties.map(prop => IRNode.fromJSON(prop)),
            json
        );
    }
}

class Property extends IRNode {
    constructor(key, value, options = {}) {
        super(NodeCategory.PROPERTY, options);
        this.key = key; // Identifier or Literal
        this.value = value; // Expression
    }

    toJSON() {
        return {
            ...super.toJSON(),
            key: this.key.toJSON(),
            value: this.value.toJSON()
        };
    }

    static fromJSON(json) {
        return new Property(
            IRNode.fromJSON(json.key),
            IRNode.fromJSON(json.value),
            json
        );
    }
}

class Identifier extends IRNode {
    constructor(name, options = {}) {
        super(NodeCategory.IDENTIFIER, options);
        this.name = name;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name
        };
    }

    static fromJSON(json) {
        return new Identifier(json.name, json);
    }
}

class Literal extends IRNode {
    constructor(value, type = null, options = {}) {
        super(NodeCategory.LITERAL, options);
        this.value = value;
        this.type = type;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            value: this.value,
            type: this.type ? this.type.toJSON() : null
        };
    }

    static fromJSON(json) {
        return new Literal(
            json.value,
            json.type ? require('./types').Type.fromJSON(json.type) : null,
            json
        );
    }
}

class Assignment extends IRNode {
    constructor(left, right, operator = '=', options = {}) {
        super(NodeCategory.ASSIGNMENT, options);
        this.left = left; // Identifier or Member
        this.right = right; // Expression
        this.operator = operator; // =, +=, -=, *=, /=, etc.
    }

    toJSON() {
        return {
            ...super.toJSON(),
            left: this.left.toJSON(),
            right: this.right.toJSON(),
            operator: this.operator
        };
    }

    static fromJSON(json) {
        return new Assignment(
            IRNode.fromJSON(json.left),
            IRNode.fromJSON(json.right),
            json.operator,
            json
        );
    }
}

class Conditional extends IRNode {
    constructor(condition, consequent, alternate, options = {}) {
        super(NodeCategory.CONDITIONAL, options);
        this.condition = condition;
        this.consequent = consequent;
        this.alternate = alternate;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            condition: this.condition.toJSON(),
            consequent: this.consequent.toJSON(),
            alternate: this.alternate.toJSON()
        };
    }

    static fromJSON(json) {
        return new Conditional(
            IRNode.fromJSON(json.condition),
            IRNode.fromJSON(json.consequent),
            IRNode.fromJSON(json.alternate),
            json
        );
    }
}

module.exports = {
    NodeCategory,
    IRNode,
    Program,
    FunctionDecl,
    VarDecl,
    Parameter,
    Block,
    Return,
    If,
    While,
    For,
    DoWhile,
    Switch,
    Case,
    Break,
    Continue,
    ExpressionStmt,
    BinaryOp,
    UnaryOp,
    Call,
    Member,
    ArrayLiteral,
    ObjectLiteral,
    Property,
    Identifier,
    Literal,
    Assignment,
    Conditional,
    IRNodeFactory,
};
