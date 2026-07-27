/**
 * PHASE C SEMANTIC VALIDATOR
 * Semantic error detection, scoping rules, reference validation
 * 
 * Responsibilities:
 * - Scope analysis (variable/function/module scoping)
 * - Forward reference detection
 * - Dead code detection
 * - Unreachable code detection
 * - Type mismatch errors
 * - Unused variable detection
 * - Name collision detection
 * 
 * Lines: 170
 */

class SemanticValidator {
  constructor(sharedContext = {}) {
    this.context = sharedContext;
    this.scopes = [{ type: "global", bindings: {}, used: new Set() }];
    this.symbolTable = new Map();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate scope integrity for an AST
   * @param {Object} ast - Abstract syntax tree
   * @param {Object} globalScope - Global scope bindings
   * @returns {Array} - Scope errors
   */
  validateScope(ast, globalScope = {}) {
    this.errors = [];
    this.scopes = [{ type: "global", bindings: globalScope, used: new Set() }];

    if (!ast || !ast.body) return this.errors;

    // Build symbol table
    this.buildSymbolTable(ast.body, globalScope);

    // Validate scope usage
    for (const node of ast.body) {
      this.visitNode(node);
    }

    // Check unused variables
    this.checkUnusedVariables();

    return this.errors;
  }

  /**
   * Validate references in AST
   * @param {Object} ast - Abstract syntax tree
   * @param {Map} symbolTable - Global symbol table
   * @returns {Array} - Reference errors
   */
  validateReferences(ast, symbolTable = new Map()) {
    const errors = [];

    if (!ast || !ast.body) return errors;

    for (const node of ast.body) {
      this.collectReferenceErrors(node, symbolTable, errors);
    }

    return errors;
  }

  /**
   * Detect dead code in AST
   * @param {Object} ast - Abstract syntax tree
   * @returns {Array} - Dead code regions with line ranges
   */
  detectDeadCode(ast) {
    const deadCode = [];

    if (!ast || !ast.body) return deadCode;

    for (let i = 0; i < ast.body.length; i++) {
      const node = ast.body[i];

      // Return statement makes following statements dead
      if (this.isTerminator(node)) {
        for (let j = i + 1; j < ast.body.length; j++) {
          const deadNode = ast.body[j];
          if (deadNode.type !== "Comment") {
            deadCode.push({
              line: deadNode.loc?.start?.line || j,
              endLine: deadNode.loc?.end?.line || j,
              code: this.nodeToString(deadNode),
              reason: "Unreachable after " + this.getTerminatorType(node)
            });
          }
        }
        break;
      }
    }

    return deadCode;
  }

  /**
   * Validate assignments and type mismatches
   * @param {Array} assignments - Assignment nodes
   * @param {Object} types - Type information
   * @returns {Array} - Type errors
   */
  validateAssignments(assignments, types = {}) {
    const errors = [];

    for (const assignment of assignments) {
      if (!assignment.target || !assignment.value) continue;

      const targetType = this.getNodeType(assignment.target, types);
      const valueType = this.getNodeType(assignment.value, types);

      // Type compatibility check
      if (targetType && valueType && !this.typesCompatible(valueType, targetType)) {
        errors.push({
          type: "TypeMismatch",
          target: assignment.target.name || this.nodeToString(assignment.target),
          targetType,
          valueType,
          line: assignment.loc?.start?.line,
          message: `Cannot assign ${valueType} to ${targetType}`
        });
      }

      // Mutability check
      if (assignment.target.immutable && !assignment.isInitialization) {
        errors.push({
          type: "ImmutabilityViolation",
          target: assignment.target.name,
          line: assignment.loc?.start?.line,
          message: `Cannot reassign immutable binding ${assignment.target.name}`
        });
      }
    }

    return errors;
  }

  /**
   * Check for name collisions in symbol table
   * @param {Map} symbolTable - Symbol table to check
   * @returns {Array} - Collision information
   */
  checkNameCollisions(symbolTable = null) {
    const collisions = [];
    const table = symbolTable || this.symbolTable;

    if (!table || table.size === 0) return collisions;

    const _names = new Map();

    for (const [name, entries] of table) {
      if (Array.isArray(entries) && entries.length > 1) {
        collisions.push({
          name,
          count: entries.length,
          locations: entries.map(e => ({
            type: e.type,
            line: e.line,
            scope: e.scope
          })),
          message: `Name '${name}' defined ${entries.length} times in same scope`
        });
      }
    }

    return collisions;
  }

  /**
   * INTERNAL: Build symbol table from AST
   */
  buildSymbolTable(body, _globalScope) {
    for (const node of body) {
      if (node.type === "VariableDeclaration" || node.type === "FunctionDeclaration") {
        const name = node.id?.name || node.name;
        if (name) {
          this.addSymbol(name, {
            type: node.type,
            node,
            scope: "global"
          });
        }
      } else if (node.type === "FunctionExpression" && node.id?.name) {
        this.addSymbol(node.id.name, {
          type: "FunctionExpression",
          node,
          scope: "global"
        });
      }
    }
  }

  /**
   * INTERNAL: Visit node for scope validation
   */
  visitNode(node, inBlock = false) {
    if (!node) return;

    if (node.type === "VariableDeclaration") {
      this.registerBinding(node.id?.name, node);
    } else if (node.type === "Identifier") {
      const scope = this.scopes[this.scopes.length - 1];
      if (scope && scope.used) {
        scope.used.add(node.name);
      }
    } else if (node.type === "BlockStatement" && node.body) {
      this.scopes.push({ type: "block", bindings: {}, used: new Set() });
      for (const stmt of node.body) {
        this.visitNode(stmt, true);
      }
      this.scopes.pop();
    } else if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
      this.scopes.push({ type: "function", bindings: {}, used: new Set() });
      if (node.body?.body) {
        for (const stmt of node.body.body) {
          this.visitNode(stmt, true);
        }
      }
      this.scopes.pop();
    } else if (node.params && Array.isArray(node.params)) {
      for (const param of node.params) {
        this.registerBinding(param.name || param.id?.name, param);
      }
    }

    // Recursively visit children
    for (const key in node) {
      if (key !== "loc" && typeof node[key] === "object") {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            this.visitNode(child, inBlock);
          }
        } else if (node[key].type) {
          this.visitNode(node[key], inBlock);
        }
      }
    }
  }

  /**
   * INTERNAL: Collect reference errors
   */
  collectReferenceErrors(node, symbolTable, errors) {
    if (!node) return;

    if (node.type === "Identifier") {
      if (!symbolTable.has(node.name) && !this.isBuiltIn(node.name)) {
        errors.push({
          type: "UndefinedReference",
          name: node.name,
          line: node.loc?.start?.line,
          message: `Reference to undefined symbol '${node.name}'`
        });
      }
    }

    for (const key in node) {
      if (key !== "loc" && typeof node[key] === "object") {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            this.collectReferenceErrors(child, symbolTable, errors);
          }
        } else if (node[key].type) {
          this.collectReferenceErrors(node[key], symbolTable, errors);
        }
      }
    }
  }

  /**
   * INTERNAL: Add symbol to table
   */
  addSymbol(name, info) {
    if (!this.symbolTable.has(name)) {
      this.symbolTable.set(name, []);
    }
    this.symbolTable.get(name).push(info);
  }

  /**
   * INTERNAL: Register binding in current scope
   */
  registerBinding(name, node) {
    if (!name) return;
    const scope = this.scopes[this.scopes.length - 1];
    if (scope && !scope.bindings[name]) {
      scope.bindings[name] = { used: false, node };
    } else if (scope && scope.bindings[name]) {
      this.errors.push({
        type: "NameCollision",
        name,
        line: node.loc?.start?.line,
        message: `Variable '${name}' already defined in scope`
      });
    }
  }

  /**
   * INTERNAL: Check for unused variables
   */
  checkUnusedVariables() {
    for (const scope of this.scopes) {
      for (const [name, binding] of Object.entries(scope.bindings)) {
        if (!scope.used.has(name) && !name.startsWith("_")) {
          this.warnings.push({
            type: "UnusedVariable",
            name,
            line: binding.node?.loc?.start?.line,
            message: `Variable '${name}' is defined but never used`
          });
        }
      }
    }
  }

  /**
   * INTERNAL: Check if node is a terminator
   */
  isTerminator(node) {
    return node.type === "ReturnStatement" || 
           node.type === "ThrowStatement" ||
           node.type === "BreakStatement" ||
           node.type === "ContinueStatement";
  }

  /**
   * INTERNAL: Get terminator type
   */
  getTerminatorType(node) {
    return node.type.replace("Statement", "").toLowerCase();
  }

  /**
   * INTERNAL: Get node type
   */
  getNodeType(node, types = {}) {
    if (node.typeAnnotation) return node.typeAnnotation;
    if (types[this.nodeToString(node)]) return types[this.nodeToString(node)];
    return null;
  }

  /**
   * INTERNAL: Check type compatibility
   */
  typesCompatible(actual, expected) {
    if (actual === expected) return true;
    if (expected === "Any") return true;
    return false;
  }

  /**
   * INTERNAL: Node to string
   */
  nodeToString(node) {
    if (node.name) return node.name;
    if (node.type === "Literal") return String(node.value);
    return node.type || "unknown";
  }

  /**
   * INTERNAL: Is built-in identifier
   */
  isBuiltIn(name) {
    const builtins = new Set([
      "console", "print", "require", "module", "exports",
      "undefined", "null", "true", "false"
    ]);
    return builtins.has(name);
  }

  /**
   * Get errors and warnings
   */
  getIssues() {
    return { errors: this.errors, warnings: this.warnings };
  }

  /**
   * Clear state
   */
  clear() {
    this.errors = [];
    this.warnings = [];
    this.symbolTable.clear();
  }
}

module.exports = SemanticValidator;
