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
    case "TryStatement":
      this.validateTryStatement(node);
      break;
    case "CatchClause":
      this.validateCatchClause(node);
      break;
    case "FinallyClause":
      this.validateFinallyClause(node);
      break;
    case "ThrowStatement":
      this.validateThrowStatement(node);
      break;
    case "ImportDeclaration":
      this.validateImportDeclaration(node);
      break;
    case "ExportDeclaration":
      this.validateExportDeclaration(node);
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

  // ========== EXCEPTION HANDLING & MODULE SYSTEM (CLARITY SUPER CANON) ==========

  validateTryStatement(node) {
    if (!node.block) {
      this.errors.push("TryStatement must have a block");
    }
    if (!node.handler && !node.finalizer) {
      this.errors.push("TryStatement must have handler (CatchClause) and/or finalizer (FinallyClause)");
    }
  }

  validateCatchClause(node) {
    if (!node.body) {
      this.errors.push("CatchClause must have a body");
    }
    if (node.param && typeof node.param !== "string" && typeof node.param !== "object") {
      this.errors.push("CatchClause param must be a string or identifier object");
    }
  }

  validateFinallyClause(node) {
    if (!node.body) {
      this.errors.push("FinallyClause must have a body");
    }
  }

  validateThrowStatement(node) {
    if (!node.argument) {
      this.errors.push("ThrowStatement must have an argument");
    }
  }

  validateImportDeclaration(node) {
    if (!node.source || typeof node.source !== "string") {
      this.errors.push("ImportDeclaration must have a string source");
    }
    if (!Array.isArray(node.specifiers)) {
      this.errors.push("ImportDeclaration specifiers must be an array");
    }
    if (node.importKind && !["value", "type", "typeof"].includes(node.importKind)) {
      this.errors.push("ImportDeclaration importKind must be 'value', 'type', or 'typeof'");
    }
  }

  validateExportDeclaration(node) {
    if (!Array.isArray(node.specifiers)) {
      this.errors.push("ExportDeclaration specifiers must be an array");
    }
    if (node.source && typeof node.source !== "string") {
      this.errors.push("ExportDeclaration source must be a string");
    }
    if (node.exportKind && !["value", "type"].includes(node.exportKind)) {
      this.errors.push("ExportDeclaration exportKind must be 'value' or 'type'");
    }
    if (!node.specifiers.length && !node.declaration) {
      this.errors.push("ExportDeclaration must have either specifiers or a declaration");
    }
  }
}

module.exports = { IRValidator };
