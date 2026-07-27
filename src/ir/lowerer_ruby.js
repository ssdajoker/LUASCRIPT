"use strict";

/**
 * Ruby IR Lowerer - Phase A IR Lowering
 * Converts Ruby-specific AST to canonical IR
 * 
 * Handles:
 * - Block parameter expansion
 * - Symbol to string conversion
 * - String interpolation expansion
 * - Hash rocket (=>) to object notation
 * - yield to generator lowering
 * - Method visibility (private/protected/public)
 */

const UniversalLowerer = require("./lowerer_universal");

/**
 * Object Pool for memory-efficient IR node creation
 * Reuses objects across multiple lowering operations
 */
class ObjectPool {
  constructor(maxSize = 5000) {
    this.nodes = [];
    this.maxSize = maxSize;
  }

  getNode(type, data) {
    let node = this.nodes.pop() || {};
    // Clear previous properties
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

class RubyLowerer {
  constructor(options = {}) {
    this.options = options;
    this.universalLowerer = new UniversalLowerer(options);
    this.blockRegistry = new Map();
    this.symbolRegistry = new Map();
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(options.poolSize || 5000);
    this.objectCount = 0;
    this.maxObjects = options.maxObjects || 50000;
  }

  /**
   * Lower Ruby AST to canonical IR
   * @param {object} ast - Ruby AST
   * @returns {object} Canonical IR module
   */
  lower(ast) {
    if (!ast || !ast.body) {
      throw new Error("Invalid Ruby AST: missing body");
    }

    // Reset memory tracking for new lowering operation
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
    }, "Ruby");

    return this.createNode("IRModule", {
      module: {
        name: "main",
        language: "Ruby",
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
    case "CaseStatement":
      return this.lowerCaseStatement(stmt);
    case "TryStatement":
      return this.lowerTryStatement(stmt);
    case "ReturnStatement":
      return this.lowerReturnStatement(stmt);
    case "ExpressionStatement":
      return this.lowerExpressionStatement(stmt);
    case "BreakStatement":
      return this.lowerBreakStatement(stmt);
    case "NextStatement": // Ruby's continue
      return this.lowerNextStatement(stmt);
    default:
      return this.createNode(stmt.type, {
        canonical: true,
      });
    }
  }

  /**
   * Lower class declaration
   * Handles method visibility and blocks
   */
  lowerClassDeclaration(stmt) {
    const methods = [];
    const properties = [];

    // Process class body
    if (stmt.body && Array.isArray(stmt.body)) {
      for (const member of stmt.body) {
        if (member.type === "FunctionDeclaration") {
          methods.push(this.lowerFunctionDeclaration(member));
        } else {
          properties.push(this.lowerStatement(member));
        }
      }
    }

    return this.createNode("ClassDeclaration", {
      name: stmt.name,
      superClass: stmt.superClass,
      body: [...methods, ...properties],
    });
  }

  /**
   * Lower function declaration
   * Handles blocks with parameters |x, y|
   */
  lowerFunctionDeclaration(stmt) {
    const params = stmt.params || [];
    const body = stmt.body || [];

    // Lower function body
    const loweredBody = body.map(s => this.lowerStatement(s)).filter(Boolean);

    return this.createNode("FunctionDeclaration", {
      name: stmt.name,
      params: params.map(p => this.lowerExpression(p)),
      body: loweredBody,
      async: stmt.async || false,
      generator: stmt.generator || false,
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
   * Lower for statement (Ruby: for x in array)
   */
  lowerForStatement(stmt) {
    return this.createNode("ForOfStatement", {
      left: this.lowerExpression(stmt.left),
      right: this.lowerExpression(stmt.right),
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
   * Lower case/when statement to switch/case
   */
  lowerCaseStatement(stmt) {
    const cases = [];
    
    if (stmt.cases && Array.isArray(stmt.cases)) {
      for (const whenClause of stmt.cases) {
        cases.push(this.createNode("SwitchCase", {
          test: this.lowerExpression(whenClause.test),
          consequent: whenClause.body ? whenClause.body.map(s => this.lowerStatement(s)) : [],
        }));
      }
    }

    return this.createNode("SwitchStatement", {
      discriminant: this.lowerExpression(stmt.discriminant),
      cases,
    });
  }

  /**
   * Lower try/rescue/ensure to try/catch/finally
   */
  lowerTryStatement(stmt) {
    const handlers = [];
    
    if (stmt.rescue && Array.isArray(stmt.rescue)) {
      for (const rescue of stmt.rescue) {
        handlers.push(this.createNode("CatchClause", {
          param: rescue.param ? this.lowerExpression(rescue.param) : null,
          body: this.lowerBlockStatement(rescue.body),
        }));
      }
    }

    return this.createNode("TryStatement", {
      block: this.lowerBlockStatement(stmt.block),
      handler: handlers.length > 0 ? handlers[0] : null,
      finalizer: stmt.ensure ? this.lowerBlockStatement(stmt.ensure) : null,
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
   * Lower next statement (Ruby's continue)
   */
  lowerNextStatement(stmt) {
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

    // Single statement - wrap in block
    return this.createNode("BlockStatement", {
      body: [this.lowerStatement(block)],
    });
  }

  /**
   * Lower expression
   */
  lowerExpression(expr) {
    if (!expr) return null;

    // Handle Ruby symbols (:symbol)
    if (expr.type === "Symbol") {
      return this.createNode("Literal", {
        value: expr.name,
        raw: `:${expr.name}`,
      });
    }

    // Handle string interpolation
    if (expr.type === "StringInterpolation") {
      return this.lowerStringInterpolation(expr);
    }

    // Handle blocks with parameters { |x, y| ... }
    if (expr.type === "BlockExpression") {
      return this.lowerBlockExpression(expr);
    }

    // Handle hash rocket (=>)
    if (expr.type === "HashLiteral") {
      return this.lowerHashLiteral(expr);
    }

    // Pass through standard expressions
    return expr;
  }

  /**
   * Lower string interpolation #{expr} to template literal
   */
  lowerStringInterpolation(expr) {
    const parts = [];
    
    if (expr.parts && Array.isArray(expr.parts)) {
      for (const part of expr.parts) {
        if (part.type === "Literal") {
          parts.push(part);
        } else {
          parts.push(this.lowerExpression(part));
        }
      }
    }

    return this.createNode("TemplateLiteral", {
      quasis: parts.filter(p => p.type === "Literal"),
      expressions: parts.filter(p => p.type !== "Literal"),
    });
  }

  /**
   * Lower block expression { |x, y| body }
   */
  lowerBlockExpression(expr) {
    return this.createNode("FunctionExpression", {
      params: expr.params || [],
      body: this.lowerBlockStatement(expr.body),
      async: false,
      generator: false,
    });
  }

  /**
   * Lower hash literal { :key => value } to object
   */
  lowerHashLiteral(expr) {
    const properties = [];
    
    if (expr.properties && Array.isArray(expr.properties)) {
      for (const prop of expr.properties) {
        properties.push(this.createNode("Property", {
          key: this.lowerExpression(prop.key),
          value: this.lowerExpression(prop.value),
          kind: "init",
        }));
      }
    }

    return this.createNode("ObjectExpression", {
      properties,
    });
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

module.exports = RubyLowerer;
