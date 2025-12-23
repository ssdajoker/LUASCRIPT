/**
 * LUASCRIPT AST Validator
 * 
 * Validates JavaScript AST for transpilability and consistency
 * Catches errors early before lowering
 */

class ASTValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validate(ast) {
        this.errors = [];
        this.warnings = [];

        if (!ast || ast.type !== "Program") {
            this.errors.push("Invalid AST: root must be Program node");
            return { valid: false, errors: this.errors, warnings: this.warnings };
        }

        this.visitNode(ast);

        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    visitNode(node) {
        if (!node) return;

        if (typeof node !== "object") {
            return;
        }

        if (Array.isArray(node)) {
            node.forEach(n => this.visitNode(n));
            return;
        }

        const method = `visit${node.type}`;
        if (typeof this[method] === "function") {
            this[method](node);
        }

        // Recursively visit children
        for (const key in node) {
            if (key !== "type" && Object.prototype.hasOwnProperty.call(node, key)) {
                this.visitNode(node[key]);
            }
        }
    }

    visitAsyncFunctionDeclaration(node) {
        if (!node.id || !node.id.name) {
            this.warnings.push("AsyncFunctionDeclaration should have named id");
        }
        if (!node.params || !Array.isArray(node.params)) {
            this.warnings.push("AsyncFunctionDeclaration should have params array");
        }
        if (!node.body || node.body.type !== "BlockStatement") {
            this.warnings.push("AsyncFunctionDeclaration should have body as BlockStatement");
        }
    }

    visitAwaitExpression(node) {
        if (!node.argument) {
            this.errors.push("AwaitExpression must have argument");
        }
    }

    visitClassDeclaration(node) {
        if (!node.id || !node.id.name) {
            this.errors.push("ClassDeclaration must have named id");
        }
        if (node.body && node.body.type !== "ClassBody") {
            this.errors.push("ClassDeclaration body must be ClassBody");
        }
    }

    visitClassExpression(node) {
        // Optional id for class expressions
        if (node.body && node.body.type !== "ClassBody") {
            this.errors.push("ClassExpression body must be ClassBody");
        }
    }

    visitClassBody(node) {
        if (!node.body || !Array.isArray(node.body)) {
            this.errors.push("ClassBody must have body array");
        }
        node.body?.forEach(method => {
            if (method.type !== "MethodDefinition") {
                this.errors.push("ClassBody elements must be MethodDefinition");
            }
        });
    }

    visitMethodDefinition(node) {
        if (!node.key) {
            this.errors.push("MethodDefinition must have key");
        }
        if (!node.value || node.value.type !== "FunctionExpression") {
            this.errors.push("MethodDefinition value must be FunctionExpression");
        }
    }

    visitTryStatement(node) {
        if (!node.body || node.body.type !== "BlockStatement") {
            this.errors.push("TryStatement body must be BlockStatement");
        }
        if (!node.handler && !node.finalizer) {
            this.errors.push("TryStatement must have handler and/or finalizer");
        }
        if (node.handler && node.handler.type !== "CatchClause") {
            this.errors.push("TryStatement handler must be CatchClause");
        }
    }

    visitCatchClause(node) {
        if (!node.body || node.body.type !== "BlockStatement") {
            this.errors.push("CatchClause body must be BlockStatement");
        }
    }

    visitForOfStatement(node) {
        if (!node.left) {
            this.errors.push("ForOfStatement must have left");
        }
        if (!node.right) {
            this.errors.push("ForOfStatement must have right");
        }
        if (!node.body || node.body.type !== "BlockStatement") {
            this.errors.push("ForOfStatement body must be BlockStatement");
        }
    }

    visitForInStatement(node) {
        if (!node.left) {
            this.errors.push("ForInStatement must have left");
        }
        if (!node.right) {
            this.errors.push("ForInStatement must have right");
        }
        if (!node.body || node.body.type !== "BlockStatement") {
            this.errors.push("ForInStatement body must be BlockStatement");
        }
    }

    visitTemplateLiteral(node) {
        if (!node.quasis || !Array.isArray(node.quasis)) {
            this.errors.push("TemplateLiteral must have quasis array");
        }
        if (!node.expressions || !Array.isArray(node.expressions)) {
            this.errors.push("TemplateLiteral must have expressions array");
        }
    }

    visitThisExpression(_node) {
        // This is valid in class/object methods
        // Could warn if used outside class context
    }

    visitSpreadElement(node) {
        if (!node.argument) {
            this.errors.push("SpreadElement must have argument");
        }
    }

    visitFunctionExpression(node) {
        if (!node.params || !Array.isArray(node.params)) {
            this.warnings.push("FunctionExpression should have params array");
        }
        if (!node.body || node.body.type !== "BlockStatement") {
            this.warnings.push("FunctionExpression should have body as BlockStatement");
        }
    }

    visitArrowFunctionExpression(node) {
        if (!node.params || !Array.isArray(node.params)) {
            this.warnings.push("ArrowFunctionExpression should have params array");
        }
        // Body can be BlockStatement or Expression
        if (node.expression && typeof node.body !== "object") {
            this.warnings.push("ArrowFunctionExpression expression body should be object");
        }
        if (!node.expression && (!node.body || node.body.type !== "BlockStatement")) {
            this.warnings.push("ArrowFunctionExpression block body should be BlockStatement");
        }
    }

    visitArrayPattern(node) {
        if (!node.elements || !Array.isArray(node.elements)) {
            this.errors.push("ArrayPattern must have elements array");
        }
    }

    visitObjectPattern(node) {
        if (!node.properties || !Array.isArray(node.properties)) {
            this.errors.push("ObjectPattern must have properties array");
        }
    }

    visitRestElement(node) {
        if (!node.argument) {
            this.errors.push("RestElement must have argument");
        }
        // Only allowed in specific contexts
    }

    visitAssignmentPattern(node) {
        if (!node.left) {
            this.errors.push("AssignmentPattern must have left");
        }
        if (!node.right) {
            this.errors.push("AssignmentPattern must have default (right)");
        }
    }

    visitBinaryExpression(node) {
        if (!node.left || !node.operator || !node.right) {
            this.errors.push("BinaryExpression must have left, operator, right");
        }
    }

    visitCallExpression(node) {
        if (!node.callee) {
            this.errors.push("CallExpression must have callee");
        }
        if (!node.arguments || !Array.isArray(node.arguments)) {
            this.errors.push("CallExpression must have arguments array");
        }
    }

    visitMemberExpression(node) {
        if (!node.object || !node.property) {
            this.errors.push("MemberExpression must have object and property");
        }
    }

    visitVariableDeclaration(node) {
        if (!node.declarations || !Array.isArray(node.declarations)) {
            this.errors.push("VariableDeclaration must have declarations array");
        }
    }

    visitFunctionDeclaration(node) {
        if (!node.id || !node.id.name) {
            this.warnings.push("FunctionDeclaration should have named id");
        }
        if (!node.params || !Array.isArray(node.params)) {
            this.warnings.push("FunctionDeclaration should have params array");
        }
        if (!node.body || node.body.type !== "BlockStatement") {
            this.warnings.push("FunctionDeclaration should have body as BlockStatement");
        }
    }

    visitIfStatement(node) {
        if (!node.test) {
            this.errors.push("IfStatement must have test");
        }
        if (!node.consequent || node.consequent.type !== "BlockStatement") {
            this.errors.push("IfStatement consequent must be BlockStatement");
        }
    }

    visitWhileStatement(node) {
        if (!node.test) {
            this.errors.push("WhileStatement must have test");
        }
        if (!node.body || node.body.type !== "BlockStatement") {
            this.errors.push("WhileStatement body must be BlockStatement");
        }
    }

    visitForStatement(node) {
        if (!node.body || node.body.type !== "BlockStatement") {
            this.errors.push("ForStatement body must be BlockStatement");
        }
    }
}

module.exports = { ASTValidator };
