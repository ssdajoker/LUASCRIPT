
/**
 * LUASCRIPT IR Validator
 * 
 * Validates IR nodes for correctness and type consistency.
 */

const { NodeCategory } = require('./nodes');

class ValidationError extends Error {
    constructor(message, node) {
        super(message);
        this.name = 'ValidationError';
        this.node = node;
    }
}

class IRValidator {
    constructor(options = {}) {
        this.options = {
            strictTypes: options.strictTypes !== false,
            allowImplicitConversions: options.allowImplicitConversions !== false,
            ...options
        };
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validate an IR node and its children
     */
    validate(node) {
        this.errors = [];
        this.warnings = [];

        try {
            this.visitNode(node);
        } catch (error) {
            if (error instanceof ValidationError) {
                this.errors.push(error);
            } else {
                throw error;
            }
        }

        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    /**
     * Visit a node and validate it
     */
    visitNode(node) {
        if (!node || !node.kind) {
            throw new ValidationError('Invalid node: missing kind', node);
        }

        switch (node.kind) {
            case NodeCategory.PROGRAM:
                return this.validateProgram(node);
            case NodeCategory.FUNCTION_DECL:
                return this.validateFunctionDecl(node);
            case NodeCategory.VAR_DECL:
                return this.validateVarDecl(node);
            case NodeCategory.PARAMETER:
                return this.validateParameter(node);
            case NodeCategory.BLOCK:
                return this.validateBlock(node);
            case NodeCategory.RETURN:
                return this.validateReturn(node);
            case NodeCategory.IF:
                return this.validateIf(node);
            case NodeCategory.WHILE:
            case NodeCategory.DO_WHILE:
                return this.validateWhile(node);
            case NodeCategory.FOR:
                return this.validateFor(node);
            case NodeCategory.SWITCH:
                return this.validateSwitch(node);
            case NodeCategory.CASE:
                return this.validateCase(node);
            case NodeCategory.BREAK:
            case NodeCategory.CONTINUE:
                return true; // Always valid
            case NodeCategory.EXPRESSION_STMT:
                return this.validateExpressionStmt(node);
            case NodeCategory.BINARY_OP:
                return this.validateBinaryOp(node);
            case NodeCategory.UNARY_OP:
                return this.validateUnaryOp(node);
            case NodeCategory.CALL:
                return this.validateCall(node);
            case NodeCategory.MEMBER:
                return this.validateMember(node);
            case NodeCategory.ARRAY_LITERAL:
                return this.validateArrayLiteral(node);
            case NodeCategory.OBJECT_LITERAL:
                return this.validateObjectLiteral(node);
            case NodeCategory.PROPERTY:
                return this.validateProperty(node);
            case NodeCategory.IDENTIFIER:
                return this.validateIdentifier(node);
            case NodeCategory.LITERAL:
                return this.validateLiteral(node);
            case NodeCategory.ASSIGNMENT:
                return this.validateAssignment(node);
            case NodeCategory.CONDITIONAL:
                return this.validateConditional(node);
            default:
                throw new ValidationError(`Unknown node kind: ${node.kind}`, node);
        }
    }

    // ========== VALIDATION METHODS ==========

    validateProgram(node) {
        if (!Array.isArray(node.body)) {
            throw new ValidationError('Program body must be an array', node);
        }
        node.body.forEach(stmt => this.visitNode(stmt));
        return true;
    }

    validateFunctionDecl(node) {
        // Allow anonymous functions (name can be null or undefined)
        if (node.name !== undefined && node.name !== null && typeof node.name !== 'string') {
            throw new ValidationError('Function name must be a string, null, or undefined', node);
        }
        if (!Array.isArray(node.parameters)) {
            throw new ValidationError('Function parameters must be an array', node);
        }
        node.parameters.forEach(param => this.visitNode(param));
        this.visitNode(node.body);
        return true;
    }

    validateVarDecl(node) {
        if (!node.name || typeof node.name !== 'string') {
            throw new ValidationError('Variable declaration must have a name', node);
        }
        if (node.init) {
            this.visitNode(node.init);
        }
        return true;
    }

    validateParameter(node) {
        if (!node.name || typeof node.name !== 'string') {
            throw new ValidationError('Parameter must have a name', node);
        }
        if (node.defaultValue) {
            this.visitNode(node.defaultValue);
        }
        return true;
    }

    validateBlock(node) {
        if (!Array.isArray(node.statements)) {
            throw new ValidationError('Block statements must be an array', node);
        }
        node.statements.forEach(stmt => this.visitNode(stmt));
        return true;
    }

    validateReturn(node) {
        if (node.value) {
            this.visitNode(node.value);
        }
        return true;
    }

    validateIf(node) {
        this.visitNode(node.condition);
        this.visitNode(node.consequent);
        if (node.alternate) {
            this.visitNode(node.alternate);
        }
        return true;
    }

    validateWhile(node) {
        this.visitNode(node.condition);
        this.visitNode(node.body);
        return true;
    }

    validateFor(node) {
        if (node.init) this.visitNode(node.init);
        if (node.condition) this.visitNode(node.condition);
        if (node.update) this.visitNode(node.update);
        this.visitNode(node.body);
        return true;
    }

    validateSwitch(node) {
        this.visitNode(node.discriminant);
        if (!Array.isArray(node.cases)) {
            throw new ValidationError('Switch cases must be an array', node);
        }
        node.cases.forEach(c => this.visitNode(c));
        return true;
    }

    validateCase(node) {
        if (node.test) {
            this.visitNode(node.test);
        }
        if (!Array.isArray(node.consequent)) {
            throw new ValidationError('Case consequent must be an array', node);
        }
        node.consequent.forEach(stmt => this.visitNode(stmt));
        return true;
    }

    validateExpressionStmt(node) {
        this.visitNode(node.expression);
        return true;
    }

    validateBinaryOp(node) {
        if (!node.operator) {
            throw new ValidationError('Binary operation must have an operator', node);
        }
        this.visitNode(node.left);
        this.visitNode(node.right);
        return true;
    }

    validateUnaryOp(node) {
        if (!node.operator) {
            throw new ValidationError('Unary operation must have an operator', node);
        }
        this.visitNode(node.operand);
        return true;
    }

    validateCall(node) {
        this.visitNode(node.callee);
        if (!Array.isArray(node.args)) {
            throw new ValidationError('Call arguments must be an array', node);
        }
        node.args.forEach(arg => this.visitNode(arg));
        return true;
    }

    validateMember(node) {
        this.visitNode(node.object);
        this.visitNode(node.property);
        return true;
    }

    validateArrayLiteral(node) {
        if (!Array.isArray(node.elements)) {
            throw new ValidationError('Array elements must be an array', node);
        }
        node.elements.forEach(el => {
            if (el) this.visitNode(el);
        });
        return true;
    }

    validateObjectLiteral(node) {
        if (!Array.isArray(node.properties)) {
            throw new ValidationError('Object properties must be an array', node);
        }
        node.properties.forEach(prop => this.visitNode(prop));
        return true;
    }

    validateProperty(node) {
        this.visitNode(node.key);
        this.visitNode(node.value);
        return true;
    }

    validateIdentifier(node) {
        if (!node.name || typeof node.name !== 'string') {
            throw new ValidationError('Identifier must have a name', node);
        }
        return true;
    }

    validateLiteral(node) {
        // Literals are always valid
        return true;
    }

    validateAssignment(node) {
        if (!node.operator) {
            throw new ValidationError('Assignment must have an operator', node);
        }
        this.visitNode(node.left);
        this.visitNode(node.right);
        return true;
    }

    validateConditional(node) {
        this.visitNode(node.condition);
        this.visitNode(node.consequent);
        this.visitNode(node.alternate);
        return true;
    }

    /**
     * Add a warning
     */
    warn(message, node) {
        this.warnings.push({ message, node });
    }

    /**
     * Add an error
     */
    error(message, node) {
        this.errors.push(new ValidationError(message, node));
    }
}

module.exports = {
    IRValidator,
    ValidationError
};
