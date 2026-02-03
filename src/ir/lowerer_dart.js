"use strict";

/**
 * Dart IR Lowerer - Phase A IR Lowering
 * Converts Dart-specific AST to canonical IR
 * 
 * Handles:
 * - Type annotations (int, String, List<T>, etc.)
 * - Null safety (?, !, late, required)
 * - Async/await patterns
 * - Cascades (..)
 * - Spread operator (...)
 * - Extension methods
 * - Mixin composition
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

class DartLowerer {
  constructor(options = {}) {
    this.options = options;
    this.universalLowerer = new UniversalLowerer(options);
    this.nullSafetyLevel = options.nullSafety || "sound"; // sound, weak, legacy
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(options.poolSize || 5000);
    this.objectCount = 0;
    this.maxObjects = options.maxObjects || 50000;
  }

  /**
   * Lower Dart AST to canonical IR
   */
  lower(ast) {
    if (!ast || !ast.body) {
      throw new Error("Invalid Dart AST: missing body");
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
    }, "Dart");

    return this.createNode("IRModule", {
      module: {
        name: "main",
        language: "Dart",
        phase: "A",
        nullSafety: this.nullSafetyLevel,
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
    case "MixinDeclaration":
      return this.lowerMixinDeclaration(stmt);
    case "EnumDeclaration":
      return this.lowerEnumDeclaration(stmt);
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
    case "VariableDeclaration":
      return this.lowerVariableDeclaration(stmt);
    default:
      return this.createNode(stmt.type, { canonical: true });
    }
  }

  /**
   * Lower class declaration
   * Dart: supports mixins, factory constructors
   */
  lowerClassDeclaration(stmt) {
    const methods = [];
    const properties = [];
    const constructors = [];

    if (stmt.body && Array.isArray(stmt.body)) {
      for (const member of stmt.body) {
        if (member.type === "ConstructorDeclaration") {
          constructors.push(this.lowerConstructor(member));
        } else if (member.type === "MethodDefinition") {
          methods.push(this.lowerFunctionDeclaration(member));
        } else if (member.type === "PropertyDeclaration") {
          properties.push(this.lowerPropertyDeclaration(member));
        }
      }
    }

    return this.createNode("ClassDeclaration", {
      name: stmt.name,
      superClass: stmt.superClass ? this.lowerExpression(stmt.superClass) : null,
      mixins: (stmt.mixins || []).map(m => this.lowerExpression(m)),
      implements: (stmt.implements || []).map(i => this.lowerExpression(i)),
      constructors,
      body: [...methods, ...properties],
      abstract: stmt.abstract || false,
    });
  }

  /**
   * Lower mixin declaration
   */
  lowerMixinDeclaration(stmt) {
    const methods = [];
    const properties = [];

    if (stmt.body && Array.isArray(stmt.body)) {
      for (const member of stmt.body) {
        if (member.type === "MethodDefinition") {
          methods.push(this.lowerFunctionDeclaration(member));
        } else if (member.type === "PropertyDeclaration") {
          properties.push(this.lowerPropertyDeclaration(member));
        }
      }
    }

    return this.createNode("MixinDeclaration", {
      name: stmt.name,
      superConstraints: (stmt.on || []).map(s => this.lowerExpression(s)),
      body: [...methods, ...properties],
    });
  }

  /**
   * Lower enum declaration
   */
  lowerEnumDeclaration(stmt) {
    return this.createNode("EnumDeclaration", {
      name: stmt.name,
      values: stmt.values || [],
    });
  }

  /**
   * Lower constructor
   */
  lowerConstructor(stmt) {
    return this.createNode("ConstructorDeclaration", {
      name: stmt.name,
      params: (stmt.params || []).map(p => this.lowerExpression(p)),
      body: stmt.body ? [this.lowerStatement(stmt.body)].filter(Boolean) : [],
      factory: stmt.factory || false,
    });
  }

  /**
   * Lower function declaration
   * Dart: async/await, generator functions
   */
  lowerFunctionDeclaration(stmt) {
    const params = (stmt.params || []).map(p => {
      if (typeof p === "string") {
        return this.createNode("Identifier", { name: p });
      }
      return this.lowerExpression(p);
    });

    const body = stmt.body || [];
    const loweredBody = Array.isArray(body)
      ? body.map(s => this.lowerStatement(s)).filter(Boolean)
      : [this.lowerStatement(body)].filter(Boolean);

    return this.createNode("FunctionDeclaration", {
      name: stmt.name || "anonymous",
      params,
      body: loweredBody,
      returnType: stmt.returnType || null,
      async: stmt.async || false,
      generator: stmt.generator || false,
      static: stmt.static || false,
    });
  }

  /**
   * Lower property declaration
   */
  lowerPropertyDeclaration(stmt) {
    return this.createNode("PropertyDeclaration", {
      name: stmt.name,
      value: stmt.value ? this.lowerExpression(stmt.value) : null,
      type: stmt.type || null,
      static: stmt.static || false,
      final: stmt.final || false,
      late: stmt.late || false,
    });
  }

  /**
   * Lower variable declaration
   * Dart: var, final, const, late, required
   */
  lowerVariableDeclaration(stmt) {
    return this.createNode("VariableDeclaration", {
      kind: stmt.kind || "var",
      name: stmt.name,
      type: stmt.type || null,
      value: stmt.value ? this.lowerExpression(stmt.value) : null,
      final: stmt.final || false,
      const: stmt.const || false,
      late: stmt.late || false,
      required: stmt.required || false,
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
      handlers: (stmt.handlers || []).map(h => this.createNode("CatchClause", {
        exceptionType: h.exceptionType || null,
        param: h.param ? this.lowerExpression(h.param) : null,
        body: this.lowerBlockStatement(h.body),
      })),
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
   * Dart: cascade (..), null coalescing (??), spread (...)
   */
  lowerExpression(expr) {
    if (!expr) return null;

    // Handle cascade operator (..)
    if (expr.type === "CascadeExpression") {
      return this.lowerCascade(expr);
    }

    // Handle null coalescing (??)
    if (expr.type === "BinaryExpression" && expr.operator === "??") {
      return this.createNode("LogicalExpression", {
        operator: "??",
        left: this.lowerExpression(expr.left),
        right: this.lowerExpression(expr.right),
        dartNullCoalesce: true,
      });
    }

    // Handle spread operator (...)
    if (expr.type === "SpreadElement") {
      return this.createNode("SpreadElement", {
        argument: this.lowerExpression(expr.argument),
      });
    }

    // Handle async/await
    if (expr.type === "AwaitExpression") {
      return this.createNode("AwaitExpression", {
        argument: this.lowerExpression(expr.argument),
      });
    }

    // Handle null assertion (!)
    if (expr.type === "UnaryExpression" && expr.operator === "!") {
      return this.createNode("UnaryExpression", {
        operator: "!",
        argument: this.lowerExpression(expr.argument),
        dartNullAssertion: expr.dartNullAssertion || false,
      });
    }

    // Pass through standard expressions
    return expr;
  }

  /**
   * Lower cascade expression (..)
   */
  lowerCascade(expr) {
    return this.createNode("CascadeExpression", {
      object: this.lowerExpression(expr.object),
      operations: (expr.operations || []).map(op => this.lowerExpression(op)),
      dartCascade: true,
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

module.exports = DartLowerer;
