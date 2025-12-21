/**
 * LUASCRIPT IR Validator
 * 
 * Validates Intermediate Representation for consistency
 * and compatibility with Lua emitter
 */


class IRValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validate(ir) {
        this.errors = [];
        this.warnings = [];

        if (!ir) {
            this.errors.push("IR must be defined");
            return { valid: false, errors: this.errors, warnings: this.warnings };
        }

        this.visitNode(ir);

        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    visitNode(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(n => this.visitNode(n));
            return;
        }

        if (typeof node !== "object") {
            return;
        }

        // Check if it's an IR node
        if (node.kind) {
            this.validateIRNode(node);
        }

        // Recursively visit all properties
        for (const key in node) {
            if (Object.prototype.hasOwnProperty.call(node, key) && key !== "kind") {
                this.visitNode(node[key]);
            }
        }
    }

    validateIRNode(node) {
        const { kind } = node;

        switch (kind) {
        case "Program":
            this.validateProgram(node);
            break;
        case "BlockStatement":
            this.validateBlockStatement(node);
            break;
        case "FunctionDeclaration":
            this.validateFunctionDeclaration(node);
            break;
        case "AsyncFunctionDeclaration":
            this.validateAsyncFunctionDeclaration(node);
            break;
        case "ClassDeclaration":
            this.validateClassDeclaration(node);
            break;
        case "VariableDeclaration":
            this.validateVariableDeclaration(node);
            break;
        case "ReturnStatement":
            this.validateReturnStatement(node);
            break;
        case "IfStatement":
            this.validateIfStatement(node);
            break;
        case "CallExpression":
            this.validateCallExpression(node);
            break;
        default:
            // Unknown node type - log warning but continue
            break;
        }
    }

    validateProgram(node) {
        if (!node.body || !Array.isArray(node.body)) {
            this.errors.push("Program must have body array");
        }
    }

    validateBlockStatement(node) {
        // IR uses 'statements', AST uses 'body'
        const body = node.statements || node.body;
        if (!body || !Array.isArray(body)) {
            this.errors.push("BlockStatement must have statements or body array");
        }
    }

    validateFunctionDeclaration(node) {
        // IR uses 'name', AST uses 'id'
        if (!node.id && !node.name) {
            this.errors.push("FunctionDeclaration must have id or name");
        }
        // IR uses 'parameters', AST uses 'params'
        const params = node.parameters || node.params;
        if (!params || !Array.isArray(params)) {
            this.errors.push("FunctionDeclaration must have parameters array");
        }
        if (!node.body) {
            this.errors.push("FunctionDeclaration must have body");
        }
    }

    validateAsyncFunctionDeclaration(node) {
        this.validateFunctionDeclaration(node);
    }

    validateClassDeclaration(node) {
        if (!node.id) {
            this.errors.push("ClassDeclaration must have id");
        }
        if (!node.body || !Array.isArray(node.body)) {
            this.errors.push("ClassDeclaration must have body array");
        }
    }

    validateVariableDeclaration(node) {
        if (!node.declarations || !Array.isArray(node.declarations)) {
            this.errors.push("VariableDeclaration must have declarations array");
        }
        node.declarations.forEach(decl => {
            if (!decl.id) {
                this.errors.push("VariableDeclarator must have id");
            }
        });
    }

    validateReturnStatement(_node) {
        // argument is optional
    }

    validateIfStatement(node) {
        // IR uses 'condition', AST uses 'test'
        const test = node.condition || node.test;
        if (!test) {
            this.errors.push("IfStatement must have condition or test");
        }
        if (!node.consequent) {
            this.errors.push("IfStatement must have consequent");
        }
    }

    validateCallExpression(node) {
        if (!node.callee) {
            this.errors.push("CallExpression must have callee");
        }
        // IR uses 'args', AST uses 'arguments'
        const args = node.args || node.arguments;
        if (!args || !Array.isArray(args)) {
            this.errors.push("CallExpression must have args or arguments array");
        }
    }

    // Structural validation methods
    validateNodeReference(node, nodeType) {
        if (!node || !node.kind) {
            this.errors.push(`Expected ${nodeType} node but got invalid reference`);
            return false;
        }
        return true;
    }

    validateNodeArray(nodes, nodeType) {
        if (!Array.isArray(nodes)) {
            this.errors.push(`Expected ${nodeType} array`);
            return false;
        }
        return nodes.every(n => this.validateNodeReference(n, nodeType));
    }
}

module.exports = { IRValidator };
