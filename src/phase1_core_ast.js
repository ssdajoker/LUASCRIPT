
/**
 * LUASCRIPT Phase 1 Core - AST Node Definitions
 * PS2/PS3 Specialists + Donald Knuth Algorithm Excellence
 * 32+ Developer Team Implementation
 */

/**
 * The base class for all nodes in the Abstract Syntax Tree (AST).
 * It provides common properties and methods for tree traversal and manipulation.
 */
class ASTNode {
    /**
     * Creates an instance of an ASTNode.
     * @param {string} type - The type of the AST node.
     * @param {object} [properties={}] - Additional properties for the node.
     */
    constructor(type, properties = {}) {
        this.type = type;
        this.line = properties.line || 0;
        this.column = properties.column || 0;
        this.parent = null;
        this.children = [];
        Object.assign(this, properties);
    }

    /**
     * Adds a child node to this node.
     * @param {ASTNode} child - The child node to add.
     * @returns {this} The current node for chaining.
     */
    addChild(child) {
        if (child instanceof ASTNode) {
            child.parent = this;
            this.children.push(child);
        }
        return this;
    }

    /**
     * Removes a child node from this node.
     * @param {ASTNode} child - The child node to remove.
     * @returns {this} The current node for chaining.
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
        return this;
    }

    /**
     * Traverses the AST starting from this node.
     * @param {function(ASTNode): void} callback - The function to call for each node.
     */
    traverse(callback) {
        callback(this);
        for (const child of this.children) {
            child.traverse(callback);
        }
    }

    /**
     * Finds the first node in the subtree that satisfies the predicate.
     * @param {function(ASTNode): boolean} predicate - The predicate function.
     * @returns {ASTNode|null} The found node, or null if not found.
     */
    find(predicate) {
        if (predicate(this)) return this;
        for (const child of this.children) {
            const result = child.find(predicate);
            if (result) return result;
        }
        return null;
    }

    /**
     * Finds all nodes in the subtree that satisfy the predicate.
     * @param {function(ASTNode): boolean} predicate - The predicate function.
     * @returns {ASTNode[]} An array of found nodes.
     */
    findAll(predicate) {
        const results = [];
        this.traverse(node => {
            if (predicate(node)) results.push(node);
        });
        return results;
    }

    /**
     * Creates a deep clone of the node.
     * @returns {ASTNode} The cloned node.
     */
    clone() {
        const cloned = new this.constructor(this.type, { ...this });
        cloned.children = this.children.map(child => child.clone());
        cloned.children.forEach(child => child.parent = cloned);
        return cloned;
    }

    /**
     * Converts the node to a JSON-serializable object.
     * @returns {object} The JSON representation of the node.
     */
    toJSON() {
        return {
            type: this.type,
            line: this.line,
            column: this.column,
            children: this.children.map(child => child.toJSON()),
            ...this.getSerializableProperties()
        };
    }

    /**
     * Gets the properties of the node that should be serialized to JSON.
     * @returns {object} The serializable properties.
     * @private
     */
    getSerializableProperties() {
        const props = { ...this };
        delete props.type;
        delete props.line;
        delete props.column;
        delete props.parent;
        delete props.children;
        return props;
    }
}

/** Represents the root of the AST. */
class ProgramNode extends ASTNode {
    constructor(body = [], properties = {}) {
        super('Program', properties);
        this.body = body;
        this.body.forEach(stmt => this.addChild(stmt));
    }
}

/** Represents a block of statements enclosed in braces. */
class BlockStatementNode extends ASTNode {
    constructor(body = [], properties = {}) {
        super('BlockStatement', properties);
        this.body = body;
        this.body.forEach(stmt => this.addChild(stmt));
    }
}

/** Represents an expression used as a statement. */
class ExpressionStatementNode extends ASTNode {
    constructor(expression, properties = {}) {
        super('ExpressionStatement', properties);
        this.expression = expression;
        if (expression) this.addChild(expression);
    }
}

/** Represents a variable declaration (e.g., let, const, var). */
class VariableDeclarationNode extends ASTNode {
    constructor(declarations, kind = 'let', properties = {}) {
        super('VariableDeclaration', properties);
        this.declarations = declarations;
        this.kind = kind; // 'let', 'const', 'var'
        this.declarations.forEach(decl => this.addChild(decl));
    }
}

/** Represents a single variable declarator within a declaration. */
class VariableDeclaratorNode extends ASTNode {
    constructor(id, init = null, properties = {}) {
        super('VariableDeclarator', properties);
        this.id = id;
        this.init = init;
        this.addChild(id);
        if (init) this.addChild(init);
    }
}

/** Represents a function declaration. */
class FunctionDeclarationNode extends ASTNode {
    constructor(id, params, body, properties = {}) {
        super('FunctionDeclaration', properties);
        this.id = id;
        this.params = params;
        this.body = body;
        this.async = properties.async || false;
        this.generator = properties.generator || false;
        
        if (id) this.addChild(id);
        params.forEach(param => this.addChild(param));
        this.addChild(body);
    }
}

/** Represents a return statement. */
class ReturnStatementNode extends ASTNode {
    constructor(argument = null, properties = {}) {
        super('ReturnStatement', properties);
        this.argument = argument;
        if (argument) this.addChild(argument);
    }
}

/** Represents an if statement. */
class IfStatementNode extends ASTNode {
    constructor(test, consequent, alternate = null, properties = {}) {
        super('IfStatement', properties);
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
        
        this.addChild(test);
        this.addChild(consequent);
        if (alternate) this.addChild(alternate);
    }
}

/** Represents a while loop. */
class WhileStatementNode extends ASTNode {
    constructor(test, body, properties = {}) {
        super('WhileStatement', properties);
        this.test = test;
        this.body = body;
        this.addChild(test);
        this.addChild(body);
    }
}

/** Represents a for loop. */
class ForStatementNode extends ASTNode {
    constructor(init, test, update, body, properties = {}) {
        super('ForStatement', properties);
        this.init = init;
        this.test = test;
        this.update = update;
        this.body = body;
        
        if (init) this.addChild(init);
        if (test) this.addChild(test);
        if (update) this.addChild(update);
        this.addChild(body);
    }
}

/** Represents a break statement. */
class BreakStatementNode extends ASTNode {
    constructor(label = null, properties = {}) {
        super('BreakStatement', properties);
        this.label = label;
        if (label) this.addChild(label);
    }
}

/** Represents a continue statement. */
class ContinueStatementNode extends ASTNode {
    constructor(label = null, properties = {}) {
        super('ContinueStatement', properties);
        this.label = label;
        if (label) this.addChild(label);
    }
}

/** Represents a binary expression (e.g., a + b). */
class BinaryExpressionNode extends ASTNode {
    constructor(operator, left, right, properties = {}) {
        super('BinaryExpression', properties);
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.addChild(left);
        this.addChild(right);
    }
}

/** Represents a unary expression (e.g., !a, -b). */
class UnaryExpressionNode extends ASTNode {
    constructor(operator, argument, prefix = true, properties = {}) {
        super('UnaryExpression', properties);
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
        this.addChild(argument);
    }
}

/** Represents an assignment expression (e.g., a = b). */
class AssignmentExpressionNode extends ASTNode {
    constructor(operator, left, right, properties = {}) {
        super('AssignmentExpression', properties);
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.addChild(left);
        this.addChild(right);
    }
}

/** Represents an update expression (e.g., a++, --b). */
class UpdateExpressionNode extends ASTNode {
    constructor(operator, argument, prefix = true, properties = {}) {
        super('UpdateExpression', properties);
        this.operator = operator; // '++' or '--'
        this.argument = argument;
        this.prefix = prefix;
        this.addChild(argument);
    }
}

/** Represents a logical expression (e.g., a && b, c || d). */
class LogicalExpressionNode extends ASTNode {
    constructor(operator, left, right, properties = {}) {
        super('LogicalExpression', properties);
        this.operator = operator; // '&&', '||'
        this.left = left;
        this.right = right;
        this.addChild(left);
        this.addChild(right);
    }
}

/** Represents a conditional (ternary) expression (e.g., a ? b : c). */
class ConditionalExpressionNode extends ASTNode {
    constructor(test, consequent, alternate, properties = {}) {
        super('ConditionalExpression', properties);
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
        this.addChild(test);
        this.addChild(consequent);
        this.addChild(alternate);
    }
}

/** Represents a function call expression. */
class CallExpressionNode extends ASTNode {
    constructor(callee, args, properties = {}) {
        super('CallExpression', properties);
        this.callee = callee;
        this.arguments = args;
        this.addChild(callee);
        args.forEach(arg => this.addChild(arg));
    }
}

/** Represents a member access expression (e.g., obj.prop, arr[0]). */
class MemberExpressionNode extends ASTNode {
    constructor(object, property, computed = false, properties = {}) {
        super('MemberExpression', properties);
        this.object = object;
        this.property = property;
        this.computed = computed; // true for obj[prop], false for obj.prop
        this.addChild(object);
        this.addChild(property);
    }
}

/** Represents an array literal. */
class ArrayExpressionNode extends ASTNode {
    constructor(elements = [], properties = {}) {
        super('ArrayExpression', properties);
        this.elements = elements;
        elements.forEach(elem => {
            if (elem) this.addChild(elem);
        });
    }
}

/** Represents an object literal. */
class ObjectExpressionNode extends ASTNode {
    constructor(properties = [], nodeProperties = {}) {
        super('ObjectExpression', nodeProperties);
        this.properties = properties;
        properties.forEach(prop => this.addChild(prop));
    }
}

/** Represents a property in an object literal. */
class PropertyNode extends ASTNode {
    constructor(key, value, kind = 'init', properties = {}) {
        super('Property', properties);
        this.key = key;
        this.value = value;
        this.kind = kind; // 'init', 'get', 'set'
        this.method = properties.method || false;
        this.shorthand = properties.shorthand || false;
        this.computed = properties.computed || false;
        
        this.addChild(key);
        this.addChild(value);
    }
}

/** Represents an arrow function expression. */
class ArrowFunctionExpressionNode extends ASTNode {
    constructor(params, body, properties = {}) {
        super('ArrowFunctionExpression', properties);
        this.params = params;
        this.body = body;
        this.async = properties.async || false;
        this.expression = properties.expression || false; // true if body is expression, false if block
        
        params.forEach(param => this.addChild(param));
        this.addChild(body);
    }
}

/** Represents a standard function expression. */
class FunctionExpressionNode extends ASTNode {
    constructor(id, params, body, properties = {}) {
        super('FunctionExpression', properties);
        this.id = id;
        this.params = params;
        this.body = body;
        this.async = properties.async || false;
        this.generator = properties.generator || false;
        
        if (id) this.addChild(id);
        params.forEach(param => this.addChild(param));
        this.addChild(body);
    }
}

/** Represents a literal value (e.g., string, number, boolean, null). */
class LiteralNode extends ASTNode {
    constructor(value, raw = null, properties = {}) {
        super('Literal', properties);
        this.value = value;
        this.raw = raw || String(value);
    }
}

/** Represents an identifier (e.g., a variable name). */
class IdentifierNode extends ASTNode {
    constructor(name, properties = {}) {
        super('Identifier', properties);
        this.name = name;
    }
}

/** Represents the `this` keyword. */
class ThisExpressionNode extends ASTNode {
    constructor(properties = {}) {
        super('ThisExpression', properties);
    }
}

/** Represents a template literal (e.g., `hello ${world}`). */
class TemplateLiteralNode extends ASTNode {
    constructor(quasis, expressions, properties = {}) {
        super('TemplateLiteral', properties);
        this.quasis = quasis;
        this.expressions = expressions;
        
        quasis.forEach(quasi => this.addChild(quasi));
        expressions.forEach(expr => this.addChild(expr));
    }
}

/** Represents a part of a template literal. */
class TemplateElementNode extends ASTNode {
    constructor(value, tail = false, properties = {}) {
        super('TemplateElement', properties);
        this.value = value; // { raw: string, cooked: string }
        this.tail = tail;
    }
}

/** Represents an error encountered during parsing. */
class ErrorNode extends ASTNode {
    constructor(message, token = null, properties = {}) {
        super('Error', properties);
        this.message = message;
        this.token = token;
    }
}

/** A utility class for working with the AST. */
class ASTUtils {
    /**
     * Checks if a node is an expression.
     * @param {ASTNode} node - The node to check.
     * @returns {boolean} True if the node is an expression.
     */
    static isExpression(node) {
        const expressionTypes = [
            'BinaryExpression', 'UnaryExpression', 'AssignmentExpression',
            'UpdateExpression', 'LogicalExpression', 'ConditionalExpression',
            'CallExpression', 'MemberExpression', 'ArrayExpression',
            'ObjectExpression', 'ArrowFunctionExpression', 'FunctionExpression',
            'Literal', 'Identifier', 'ThisExpression', 'TemplateLiteral'
        ];
        return expressionTypes.includes(node.type);
    }

    /**
     * Checks if a node is a statement.
     * @param {ASTNode} node - The node to check.
     * @returns {boolean} True if the node is a statement.
     */
    static isStatement(node) {
        const statementTypes = [
            'ExpressionStatement', 'VariableDeclaration', 'FunctionDeclaration',
            'ReturnStatement', 'IfStatement', 'WhileStatement', 'ForStatement',
            'BreakStatement', 'ContinueStatement', 'BlockStatement'
        ];
        return statementTypes.includes(node.type);
    }

    /**
     * Checks if a node is a declaration.
     * @param {ASTNode} node - The node to check.
     * @returns {boolean} True if the node is a declaration.
     */
    static isDeclaration(node) {
        const declarationTypes = ['VariableDeclaration', 'FunctionDeclaration'];
        return declarationTypes.includes(node.type);
    }

    /**
     * Gets the name of a node if it has one.
     * @param {ASTNode} node - The node to get the name from.
     * @returns {string|null} The name of the node, or null if it doesn't have one.
     */
    static getNodeName(node) {
        if (node.type === 'Identifier') return node.name;
        if (node.type === 'FunctionDeclaration' && node.id) return node.id.name;
        if (node.type === 'VariableDeclarator' && node.id) return node.id.name;
        return null;
    }

    /**
     * Creates a new ProgramNode.
     * @param {ASTNode[]} [body=[]] - The body of the program.
     * @returns {ProgramNode} The new program node.
     */
    static createProgram(body = []) {
        return new ProgramNode(body);
    }

    /**
     * Creates a new IdentifierNode.
     * @param {string} name - The name of the identifier.
     * @param {object} [properties={}] - Additional properties.
     * @returns {IdentifierNode} The new identifier node.
     */
    static createIdentifier(name, properties = {}) {
        return new IdentifierNode(name, properties);
    }

    /**
     * Creates a new LiteralNode.
     * @param {*} value - The value of the literal.
     * @param {object} [properties={}] - Additional properties.
     * @returns {LiteralNode} The new literal node.
     */
    static createLiteral(value, properties = {}) {
        return new LiteralNode(value, null, properties);
    }

    /**
     * Creates a new BinaryExpressionNode.
     * @param {string} operator - The binary operator.
     * @param {ASTNode} left - The left-hand side expression.
     * @param {ASTNode} right - The right-hand side expression.
     * @param {object} [properties={}] - Additional properties.
     * @returns {BinaryExpressionNode} The new binary expression node.
     */
    static createBinaryExpression(operator, left, right, properties = {}) {
        return new BinaryExpressionNode(operator, left, right, properties);
    }

    /**
     * Creates a new CallExpressionNode.
     * @param {ASTNode} callee - The callee expression.
     * @param {ASTNode[]} [args=[]] - The arguments for the call.
     * @param {object} [properties={}] - Additional properties.
     * @returns {CallExpressionNode} The new call expression node.
     */
    static createCallExpression(callee, args = [], properties = {}) {
        return new CallExpressionNode(callee, args, properties);
    }
}

module.exports = {
    ASTNode,
    ProgramNode,
    BlockStatementNode,
    ExpressionStatementNode,
    VariableDeclarationNode,
    VariableDeclaratorNode,
    FunctionDeclarationNode,
    ReturnStatementNode,
    IfStatementNode,
    WhileStatementNode,
    ForStatementNode,
    BreakStatementNode,
    ContinueStatementNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    AssignmentExpressionNode,
    UpdateExpressionNode,
    LogicalExpressionNode,
    ConditionalExpressionNode,
    CallExpressionNode,
    MemberExpressionNode,
    ArrayExpressionNode,
    ObjectExpressionNode,
    PropertyNode,
    ArrowFunctionExpressionNode,
    FunctionExpressionNode,
    LiteralNode,
    IdentifierNode,
    ThisExpressionNode,
    TemplateLiteralNode,
    TemplateElementNode,
    ErrorNode,
    ASTUtils
};
