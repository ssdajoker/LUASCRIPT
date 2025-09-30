
/**
 * LUASCRIPT Phase 1 Core - AST Node Definitions
 * PS2/PS3 Specialists + Donald Knuth Algorithm Excellence
 * 32+ Developer Team Implementation
 */

class ASTNode {
    constructor(type, properties = {}) {
        this.type = type;
        this.line = properties.line || 0;
        this.column = properties.column || 0;
        this.parent = null;
        this.children = [];
        Object.assign(this, properties);
    }

    addChild(child) {
        if (child instanceof ASTNode) {
            child.parent = this;
            this.children.push(child);
        }
        return this;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
        return this;
    }

    traverse(callback) {
        callback(this);
        for (const child of this.children) {
            child.traverse(callback);
        }
    }

    find(predicate) {
        if (predicate(this)) return this;
        for (const child of this.children) {
            const result = child.find(predicate);
            if (result) return result;
        }
        return null;
    }

    findAll(predicate) {
        const results = [];
        this.traverse(node => {
            if (predicate(node)) results.push(node);
        });
        return results;
    }

    clone() {
        const cloned = new this.constructor(this.type, { ...this });
        cloned.children = this.children.map(child => child.clone());
        cloned.children.forEach(child => child.parent = cloned);
        return cloned;
    }

    toJSON() {
        return {
            type: this.type,
            line: this.line,
            column: this.column,
            children: this.children.map(child => child.toJSON()),
            ...this.getSerializableProperties()
        };
    }

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

// Program and Statement Nodes
class ProgramNode extends ASTNode {
    constructor(body = [], properties = {}) {
        super('Program', properties);
        this.body = body;
        this.body.forEach(stmt => this.addChild(stmt));
    }
}

class BlockStatementNode extends ASTNode {
    constructor(body = [], properties = {}) {
        super('BlockStatement', properties);
        this.body = body;
        this.body.forEach(stmt => this.addChild(stmt));
    }
}

class ExpressionStatementNode extends ASTNode {
    constructor(expression, properties = {}) {
        super('ExpressionStatement', properties);
        this.expression = expression;
        if (expression) this.addChild(expression);
    }
}

class VariableDeclarationNode extends ASTNode {
    constructor(declarations, kind = 'let', properties = {}) {
        super('VariableDeclaration', properties);
        this.declarations = declarations;
        this.kind = kind; // 'let', 'const', 'var'
        this.declarations.forEach(decl => this.addChild(decl));
    }
}

class VariableDeclaratorNode extends ASTNode {
    constructor(id, init = null, properties = {}) {
        super('VariableDeclarator', properties);
        this.id = id;
        this.init = init;
        this.addChild(id);
        if (init) this.addChild(init);
    }
}

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

class ReturnStatementNode extends ASTNode {
    constructor(argument = null, properties = {}) {
        super('ReturnStatement', properties);
        this.argument = argument;
        if (argument) this.addChild(argument);
    }
}

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

class WhileStatementNode extends ASTNode {
    constructor(test, body, properties = {}) {
        super('WhileStatement', properties);
        this.test = test;
        this.body = body;
        this.addChild(test);
        this.addChild(body);
    }
}

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

class BreakStatementNode extends ASTNode {
    constructor(label = null, properties = {}) {
        super('BreakStatement', properties);
        this.label = label;
        if (label) this.addChild(label);
    }
}

class ContinueStatementNode extends ASTNode {
    constructor(label = null, properties = {}) {
        super('ContinueStatement', properties);
        this.label = label;
        if (label) this.addChild(label);
    }
}

// Expression Nodes
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

class UnaryExpressionNode extends ASTNode {
    constructor(operator, argument, prefix = true, properties = {}) {
        super('UnaryExpression', properties);
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
        this.addChild(argument);
    }
}

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

class UpdateExpressionNode extends ASTNode {
    constructor(operator, argument, prefix = true, properties = {}) {
        super('UpdateExpression', properties);
        this.operator = operator; // '++' or '--'
        this.argument = argument;
        this.prefix = prefix;
        this.addChild(argument);
    }
}

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

class CallExpressionNode extends ASTNode {
    constructor(callee, args, properties = {}) {
        super('CallExpression', properties);
        this.callee = callee;
        this.arguments = args;
        this.addChild(callee);
        args.forEach(arg => this.addChild(arg));
    }
}

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

class ArrayExpressionNode extends ASTNode {
    constructor(elements = [], properties = {}) {
        super('ArrayExpression', properties);
        this.elements = elements;
        elements.forEach(elem => {
            if (elem) this.addChild(elem);
        });
    }
}

class ObjectExpressionNode extends ASTNode {
    constructor(properties = [], nodeProperties = {}) {
        super('ObjectExpression', nodeProperties);
        this.properties = properties;
        properties.forEach(prop => this.addChild(prop));
    }
}

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

// Literal Nodes
class LiteralNode extends ASTNode {
    constructor(value, raw = null, properties = {}) {
        super('Literal', properties);
        this.value = value;
        this.raw = raw || String(value);
    }
}

class IdentifierNode extends ASTNode {
    constructor(name, properties = {}) {
        super('Identifier', properties);
        this.name = name;
    }
}

class ThisExpressionNode extends ASTNode {
    constructor(properties = {}) {
        super('ThisExpression', properties);
    }
}

// Template Literal Nodes
class TemplateLiteralNode extends ASTNode {
    constructor(quasis, expressions, properties = {}) {
        super('TemplateLiteral', properties);
        this.quasis = quasis;
        this.expressions = expressions;
        
        quasis.forEach(quasi => this.addChild(quasi));
        expressions.forEach(expr => this.addChild(expr));
    }
}

class TemplateElementNode extends ASTNode {
    constructor(value, tail = false, properties = {}) {
        super('TemplateElement', properties);
        this.value = value; // { raw: string, cooked: string }
        this.tail = tail;
    }
}

// Error Recovery Node
class ErrorNode extends ASTNode {
    constructor(message, token = null, properties = {}) {
        super('Error', properties);
        this.message = message;
        this.token = token;
    }
}

// AST Utilities
class ASTUtils {
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

    static isStatement(node) {
        const statementTypes = [
            'ExpressionStatement', 'VariableDeclaration', 'FunctionDeclaration',
            'ReturnStatement', 'IfStatement', 'WhileStatement', 'ForStatement',
            'BreakStatement', 'ContinueStatement', 'BlockStatement'
        ];
        return statementTypes.includes(node.type);
    }

    static isDeclaration(node) {
        const declarationTypes = ['VariableDeclaration', 'FunctionDeclaration'];
        return declarationTypes.includes(node.type);
    }

    static getNodeName(node) {
        if (node.type === 'Identifier') return node.name;
        if (node.type === 'FunctionDeclaration' && node.id) return node.id.name;
        if (node.type === 'VariableDeclarator' && node.id) return node.id.name;
        return null;
    }

    static createProgram(body = []) {
        return new ProgramNode(body);
    }

    static createIdentifier(name, properties = {}) {
        return new IdentifierNode(name, properties);
    }

    static createLiteral(value, properties = {}) {
        return new LiteralNode(value, null, properties);
    }

    static createBinaryExpression(operator, left, right, properties = {}) {
        return new BinaryExpressionNode(operator, left, right, properties);
    }

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
