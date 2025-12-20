/**
 * LUASCRIPT IR Validator
 * 
 * Validates Intermediate Representation for consistency
 * and compatibility with Lua emitter
 */

const nodes = require('../ir/nodes');

class IRValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validate(ir) {
        this.errors = [];
        this.warnings = [];

        if (!ir) {
            this.errors.push('IR must be defined');
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

        if (typeof node !== 'object') {
            return;
        }

        // Check if it's an IR node
        if (node.kind) {
            this.validateIRNode(node);
        }

        // Recursively visit all properties
        for (const key in node) {
            if (node.hasOwnProperty(key) && key !== 'kind') {
                this.visitNode(node[key]);
            }
        }
    }

    validateIRNode(node) {
        const { kind } = node;

        switch (kind) {
            case 'Program':
                this.validateProgram(node);
                break;
            case 'BlockStatement':
                this.validateBlockStatement(node);
                break;
            case 'FunctionDeclaration':
                this.validateFunctionDeclaration(node);
                break;
            case 'AsyncFunctionDeclaration':
                this.validateAsyncFunctionDeclaration(node);
                break;
            case 'ClassDeclaration':
                this.validateClassDeclaration(node);
                break;
            case 'VariableDeclaration':
                this.validateVariableDeclaration(node);
                break;
            case 'ReturnStatement':
                this.validateReturnStatement(node);
                break;
            case 'IfStatement':
                this.validateIfStatement(node);
                break;
            case 'CallExpression':
                this.validateCallExpression(node);
                break;
            case 'AsyncFunctionDeclaration':
            case 'AwaitExpression':
            case 'ClassDeclaration':
            case 'ClassExpression':
            case 'TryStatement':
            case 'ForOfStatement':
            case 'ForInStatement':
            case 'TemplateLiteral':
                // New node types - validate they exist
                if (!node.kind) {
                    this.errors.push(`IR node missing kind property`);
                }
                break;
        }
    }

    validateProgram(node) {
        if (!node.body || !Array.isArray(node.body)) {
            this.errors.push('Program must have body array');
        }
    }

    validateBlockStatement(node) {
        if (!node.body || !Array.isArray(node.body)) {
            this.errors.push('BlockStatement must have body array');
        }
    }

    validateFunctionDeclaration(node) {
        if (!node.id) {
            this.errors.push('FunctionDeclaration must have id');
        }
        if (!node.params || !Array.isArray(node.params)) {
            this.errors.push('FunctionDeclaration must have params array');
        }
        if (!node.body) {
            this.errors.push('FunctionDeclaration must have body');
        }
    }

    validateAsyncFunctionDeclaration(node) {
        this.validateFunctionDeclaration(node);
    }

    validateClassDeclaration(node) {
        if (!node.id) {
            this.errors.push('ClassDeclaration must have id');
        }
        if (!node.body || !Array.isArray(node.body)) {
            this.errors.push('ClassDeclaration must have body array');
        }
    }

    validateVariableDeclaration(node) {
        if (!node.declarations || !Array.isArray(node.declarations)) {
            this.errors.push('VariableDeclaration must have declarations array');
        }
        node.declarations.forEach(decl => {
            if (!decl.id) {
                this.errors.push('VariableDeclarator must have id');
            }
        });
    }

    validateReturnStatement(node) {
        // argument is optional
    }

    validateIfStatement(node) {
        if (!node.test) {
            this.errors.push('IfStatement must have test');
        }
        if (!node.consequent) {
            this.errors.push('IfStatement must have consequent');
        }
    }

    validateCallExpression(node) {
        if (!node.callee) {
            this.errors.push('CallExpression must have callee');
        }
        if (!node.arguments || !Array.isArray(node.arguments)) {
            this.errors.push('CallExpression must have arguments array');
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
