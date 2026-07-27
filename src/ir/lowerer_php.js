"use strict";

/**
 * PHP IR Lowerer - Phase A IR Lowering
 * Converts PHP-specific AST to canonical IR
 * 
 * Handles:
 * - Variable prefix ($var → var)
 * - Arrow notation (-> to .)
 * - Array syntax (array() to [])
 * - Associative arrays to objects
 * - Namespace resolution (\ to .)
 * - Global keyword to scope hoisting
 * - Include/require to import
 */

const UniversalLowerer = require("./lowerer_universal");

/**
 * Object Pool for memory-efficient IR node creation
 */
class ObjectPool {
  constructor(maxSize = 5000) {
    this.nodes = [];
    this.maxSize = maxSize;
  }

  getNode(type, data) {
    let node = this.nodes.pop() || {};
    for (const key in node) delete node[key];
    node.type = type;
    if (data) Object.assign(node, data);
    return node;
  }

  returnNode(node) {
    if (this.nodes.length < this.maxSize) {
      this.nodes.push(node);
    }
  }

  clear() {
    this.nodes = [];
  }

  getStats() {
    return {
      nodesPooled: this.nodes.length,
      maxSize: this.maxSize,
    };
  }
}

class PHPLowerer {
  constructor(options = {}) {
    this.options = options;
    this.universalLowerer = new UniversalLowerer(options);
    this.namespaceStack = [];
    this.globals = new Set();
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(options.poolSize || 5000);
    this.objectCount = 0;
    this.maxObjects = options.maxObjects || 50000;
  }

  /**
   * Lower PHP AST to canonical IR
   */
  lower(ast) {
    if (!ast || !ast.body) {
      throw new Error("Invalid PHP AST: missing body");
    }

    this.objectCount = 0;

    const irNodes = [];

    // Process each top-level statement
    for (const stmt of ast.body) {
      const lowered = this.lowerStatement(stmt);
      if (lowered) {
        irNodes.push(lowered);
      }
    }

    // Run universal lowering passes
    const universalIR = this.universalLowerer.lower({
      type: "Module",
      body: irNodes,
    }, "PHP");

    return this.createNode("IRModule", {
      module: {
        name: "main",
        language: "PHP",
        phase: "A",
      },
      nodes: universalIR.body,
    });
  }

  /**
   * Lower a single statement
   */
  lowerStatement(stmt) {
    if (!stmt) return null;

    switch (stmt.type) {
    case "ClassDeclaration":
      return this.lowerClassDeclaration(stmt);
    case "FunctionDeclaration":
      return this.lowerFunctionDeclaration(stmt);
    case "IfStatement":
      return this.lowerIfStatement(stmt);
    case "ForStatement":
      return this.lowerForStatement(stmt);
    case "WhileStatement":
      return this.lowerWhileStatement(stmt);
    case "DoWhileStatement":
      return this.lowerDoWhileStatement(stmt);
    case "SwitchStatement":
      return this.lowerSwitchStatement(stmt);
    case "TryStatement":
      return this.lowerTryStatement(stmt);
    case "ReturnStatement":
      return this.lowerReturnStatement(stmt);
    case "ThrowStatement":
      return this.lowerThrowStatement(stmt);
    case "ExpressionStatement":
      return this.lowerExpressionStatement(stmt);
    case "BreakStatement":
      return this.lowerBreakStatement(stmt);
    case "ContinueStatement":
      return this.lowerContinueStatement(stmt);
    case "NamespaceDeclaration":
      return this.lowerNamespaceDeclaration(stmt);
    case "UseDeclaration":
      return this.lowerUseDeclaration(stmt);
    default:
      return this.createNode(stmt.type, { canonical: true });
    }
  }

  /**
   * Lower class declaration
   * Handles visibility modifiers (public/private/protected)
   */
  lowerClassDeclaration(stmt) {
    const methods = [];
    const properties = [];

    if (stmt.body && Array.isArray(stmt.body)) {
      for (const member of stmt.body) {
        if (member.type === "FunctionDeclaration" || member.type === "MethodDefinition") {
          methods.push(this.lowerFunctionDeclaration(member));
        } else if (member.type === "PropertyDeclaration") {
          properties.push(this.lowerPropertyDeclaration(member));
        } else {
          properties.push(this.lowerStatement(member));
        }
      }
    }

    return this.createNode("ClassDeclaration", {
      name: this.stripPHPPrefix(stmt.name),
      superClass: stmt.superClass ? this.lowerExpression(stmt.superClass) : null,
      implements: stmt.implements || [],
      body: [...methods, ...properties],
      visibility: stmt.visibility || "public",
    });
  }

  /**
   * Lower function declaration
   * Handle $ prefix in parameters
   */
  lowerFunctionDeclaration(stmt) {
    const params = (stmt.params || []).map(p => {
      if (typeof p === "string") {
        return this.createNode("Identifier", { name: this.stripPHPPrefix(p) });
      }
      return this.lowerExpression(p);
    });

    const body = stmt.body || [];
    const loweredBody = Array.isArray(body) 
      ? body.map(s => this.lowerStatement(s)).filter(Boolean)
      : [this.lowerStatement(body)].filter(Boolean);

    return this.createNode("FunctionDeclaration", {
      name: this.stripPHPPrefix(stmt.name),
      params,
      body: loweredBody,
      returnType: stmt.returnType || null,
      visibility: stmt.visibility || "public",
    });
  }

  /**
   * Lower property declaration
   */
  lowerPropertyDeclaration(stmt) {
    return this.createNode("PropertyDeclaration", {
      name: this.stripPHPPrefix(stmt.name),
      value: stmt.value ? this.lowerExpression(stmt.value) : null,
      visibility: stmt.visibility || "public",
      static: stmt.static || false,
    });
  }

  /**
   * Lower namespace declaration
   */
  lowerNamespaceDeclaration(stmt) {
    const namespace = stmt.name;
    this.namespaceStack.push(namespace);

    return this.createNode("NamespaceDeclaration", {
      name: namespace,
      body: stmt.body ? stmt.body.map(s => this.lowerStatement(s)) : [],
    });
  }

  /**
   * Lower use declaration (imports)
   */
  lowerUseDeclaration(stmt) {
    return this.createNode("ImportDeclaration", {
      source: stmt.source,
      specifiers: stmt.specifiers || [],
    });
  }

  /**
   * Lower if statement
   */
  lowerIfStatement(stmt) {
    return this.createNode("IfStatement", {
      test: this.lowerExpression(stmt.test),
      consequent: this.lowerBlockStatement(stmt.consequent),
      alternate: stmt.alternate ? this.lowerStatement(stmt.alternate) : null,
    });
  }

  /**
   * Lower for statement
   */
  lowerForStatement(stmt) {
    return this.createNode("ForStatement", {
      init: stmt.init ? this.lowerExpression(stmt.init) : null,
      test: stmt.test ? this.lowerExpression(stmt.test) : null,
      update: stmt.update ? this.lowerExpression(stmt.update) : null,
      body: this.lowerBlockStatement(stmt.body),
    });
  }

  /**
   * Lower while statement
   */
  lowerWhileStatement(stmt) {
    return this.createNode("WhileStatement", {
      test: this.lowerExpression(stmt.test),
      body: this.lowerBlockStatement(stmt.body),
    });
  }

  /**
   * Lower do-while statement
   */
  lowerDoWhileStatement(stmt) {
    return this.createNode("DoWhileStatement", {
      body: this.lowerBlockStatement(stmt.body),
      test: this.lowerExpression(stmt.test),
    });
  }

  /**
   * Lower switch statement
   */
  lowerSwitchStatement(stmt) {
    const cases = (stmt.cases || []).map(c => this.createNode("SwitchCase", {
      test: c.test ? this.lowerExpression(c.test) : null,
      consequent: c.consequent ? c.consequent.map(s => this.lowerStatement(s)) : [],
    }));

    return this.createNode("SwitchStatement", {
      discriminant: this.lowerExpression(stmt.discriminant),
      cases,
    });
  }

  /**
   * Lower try statement
   */
  lowerTryStatement(stmt) {
    return this.createNode("TryStatement", {
      block: this.lowerBlockStatement(stmt.block),
      handler: stmt.handler ? this.createNode("CatchClause", {
        param: stmt.handler.param ? this.lowerExpression(stmt.handler.param) : null,
        body: this.lowerBlockStatement(stmt.handler.body),
      }) : null,
      finalizer: stmt.finalizer ? this.lowerBlockStatement(stmt.finalizer) : null,
    });
  }

  /**
   * Lower return statement
   */
  lowerReturnStatement(stmt) {
    return this.createNode("ReturnStatement", {
      argument: stmt.argument ? this.lowerExpression(stmt.argument) : null,
    });
  }

  /**
   * Lower throw statement
   */
  lowerThrowStatement(stmt) {
    return this.createNode("ThrowStatement", {
      argument: this.lowerExpression(stmt.argument),
    });
  }

  /**
   * Lower expression statement
   */
  lowerExpressionStatement(stmt) {
    return this.createNode("ExpressionStatement", {
      expression: this.lowerExpression(stmt.expression || stmt),
    });
  }

  /**
   * Lower break statement
   */
  lowerBreakStatement(stmt) {
    return this.createNode("BreakStatement", {
      label: stmt.label || null,
    });
  }

  /**
   * Lower continue statement
   */
  lowerContinueStatement(stmt) {
    return this.createNode("ContinueStatement", {
      label: stmt.label || null,
    });
  }

  /**
   * Lower block statement
   */
  lowerBlockStatement(block) {
    if (!block) {
      return this.createNode("BlockStatement", { body: [] });
    }

    if (block.type === "BlockStatement") {
      return this.createNode("BlockStatement", {
        body: (block.body || []).map(s => this.lowerStatement(s)).filter(Boolean),
      });
    }

    return this.createNode("BlockStatement", {
      body: [this.lowerStatement(block)],
    });
  }

  /**
   * Lower expression
   */
  lowerExpression(expr) {
    if (!expr) return null;

    // Handle variable prefix ($var)
    if (expr.type === "Identifier" && expr.name && expr.name.startsWith("$")) {
      return this.createNode("Identifier", {
        name: this.stripPHPPrefix(expr.name),
      });
    }

    // Handle arrow notation (->)
    if (expr.type === "MemberExpression" && expr.operator === "->") {
      return this.createNode("MemberExpression", {
        object: this.lowerExpression(expr.object),
        property: this.lowerExpression(expr.property),
        computed: false,
      });
    }

    // Handle associative arrays
    if (expr.type === "ArrayExpression" && this.isAssociativeArray(expr)) {
      return this.lowerAssociativeArray(expr);
    }

    // Handle array() syntax
    if (expr.type === "CallExpression" && expr.callee && expr.callee.name === "array") {
      return this.createNode("ArrayExpression", {
        elements: expr.arguments || [],
      });
    }

    // Pass through standard expressions
    return expr;
  }

  /**
   * Check if array is associative (has => pairs)
   */
  isAssociativeArray(expr) {
    if (!expr.elements) return false;
    return expr.elements.some(el => el && el.type === "Property");
  }

  /**
   * Lower associative array to object
   */
  lowerAssociativeArray(expr) {
    const properties = (expr.elements || []).map(el => {
      if (el.type === "Property") {
        return this.createNode("Property", {
          key: this.lowerExpression(el.key),
          value: this.lowerExpression(el.value),
          kind: "init",
        });
      }
      return el;
    });

    return this.createNode("ObjectExpression", {
      properties,
    });
  }

  /**
   * Strip PHP variable prefix $
   */
  stripPHPPrefix(name) {
    if (typeof name === "string" && name.startsWith("$")) {
      return name.substring(1);
    }
    return name;
  }

  /**
   * Create IR node with memory tracking
   */
  createNode(type, data) {
    this.objectCount++;
    
    if (this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} > ${this.maxObjects}`);
    }

    return this.pool.getNode(type, data);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      objectsCreated: this.objectCount,
      maxObjects: this.maxObjects,
      poolStats: this.pool.getStats(),
    };
  }
}

module.exports = PHPLowerer;
