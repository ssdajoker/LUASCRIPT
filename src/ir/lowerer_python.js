"use strict";

/**
 * Python IR Lowerer - Phase A IR Lowering
 * Converts Python-specific AST to canonical IR
 * 
 * Handles:
 * - Decorator expansion
 * - Generator/yield to IR
 * - Context managers to try/finally
 * - F-string expansion
 * - Comprehension lowering
 * - Class method binding
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

class PythonLowerer {
  constructor(options = {}) {
    this.options = options;
    this.universalLowerer = new UniversalLowerer(options);
    this.decoratorRegistry = new Map();
    this.generatorRegistry = new Map();
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(options.poolSize || 5000);
    this.objectCount = 0;
    this.maxObjects = options.maxObjects || 50000;
  }

  /**
   * Lower Python AST to canonical IR
   * @param {object} ast - Python AST
   * @returns {object} Canonical IR module
   */
  lower(ast) {
    if (!ast || !ast.body) {
      throw new Error("Invalid Python AST: missing body");
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
    }, "Python");

    return this.createNode("IRModule", {
      module: {
        name: "main",
        language: "Python",
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
    case "WithStatement":
      return this.lowerWithStatement(stmt);
    case "TryStatement":
      return this.lowerTryStatement(stmt);
    case "ReturnStatement":
      return this.lowerReturnStatement(stmt);
    case "RaiseStatement":
      return this.lowerRaiseStatement(stmt);
    case "ExpressionStatement":
      return this.lowerExpressionStatement(stmt);
    case "PassStatement":
      return this.lowerPassStatement(stmt);
    case "BreakStatement":
      return this.lowerBreakStatement(stmt);
    case "ContinueStatement":
      return this.lowerContinueStatement(stmt);
    default:
      return this.createNode(stmt.type, {
        canonical: true,
      });
    }
  }

  /**
   * Lower class declaration
   * Handles decorators and method binding
   */
  lowerClassDeclaration(stmt) {
    const irClass = this.createNode("ClassDefinition", {
      name: stmt.name,
      baseClasses: stmt.bases ? stmt.bases.map(b => b.name) : [],
      methods: [],
      properties: [],
      decorators: [],
    });

    // Process decorators if present
    if (stmt.decorators) {
      irClass.decorators = stmt.decorators.map(d => this.createNode("Decorator", {
        name: d.name,
        expanded: this.expandDecorator(d.name),
      }));
    }

    // Process class body
    if (stmt.body) {
      for (const item of stmt.body) {
        if (item.type === "FunctionDeclaration") {
          const method = this.lowerFunctionDeclaration(item);
          method.isMethod = true;
          
          // Check for @property, @staticmethod, @classmethod
          if (item.decorators) {
            for (const deco of item.decorators) {
              if (deco.name === "property") {
                method.kind = "get";
                irClass.properties.push(method);
              } else if (deco.name === "staticmethod") {
                method.isStatic = true;
                irClass.methods.push(method);
              } else if (deco.name === "classmethod") {
                method.isClassMethod = true;
                irClass.methods.push(method);
              }
            }
          }

          if (!item.decorators || !item.decorators.some(d => d.name === "property")) {
            irClass.methods.push(method);
          }
        }
      }
    }

    return irClass;
  }

  /**
   * Lower function declaration
   * Handles decorators and async functions
   */
  lowerFunctionDeclaration(stmt) {
    const irFunc = this.createNode("FunctionDefinition", {
      name: stmt.name,
      parameters: this.lowerParameters(stmt.params),
      returnType: stmt.returnType ? stmt.returnType.name : null,
      body: stmt.body ? stmt.body.map(s => this.lowerStatement(s)) : [],
      decorators: [],
      isAsync: stmt.async || false,
    });

    // Process decorators
    if (stmt.decorators) {
      irFunc.decorators = stmt.decorators.map(d => this.createNode("Decorator", {
        name: d.name,
        expanded: this.expandDecorator(d.name),
      }));
    }

    // Check for yield (generator function)
    if (this.hasYield(stmt.body)) {
      irFunc.isGenerator = true;
      irFunc.body = this.lowerGeneratorBody(stmt.body);
    }

    return irFunc;
  }

  /**
   * Lower function parameters
   */
  lowerParameters(params) {
    if (!params) return [];

    return params.map(param => this.createNode("Parameter", {
      name: param.name,
      typeAnnotation: param.annotation ? param.annotation.name : null,
      default: param.default || null,
      kind: "regular",
    }));
  }

  /**
   * Check if function body contains yield
   */
  hasYield(body) {
    if (!body) return false;
    
    for (const stmt of body) {
      if (this.containsYield(stmt)) return true;
    }
    return false;
  }

  /**
   * Recursively check for yield in AST
   */
  containsYield(node) {
    if (!node) return false;
    if (node.type === "YieldExpression") return true;
    if (Array.isArray(node)) {
      return node.some(n => this.containsYield(n));
    }
    if (typeof node === "object") {
      return Object.values(node).some(v => this.containsYield(v));
    }
    return false;
  }

  /**
   * Lower generator function body
   * Convert yield to generator protocol
   */
  lowerGeneratorBody(body) {
    return this.createNode("GeneratorBody", {
      protocol: "iterator",
      states: this.extractGeneratorStates(body),
      original: body,
    });
  }

  /**
   * Extract states from generator body
   */
  extractGeneratorStates(body) {
    const states = [];
    let stateIndex = 0;

    const extractStates = (node) => {
      if (!node) return;

      if (node.type === "YieldExpression") {
        states.push(this.createNode("yield", {
          index: stateIndex++,
          value: node.argument,
        }));
      }

      if (Array.isArray(node)) {
        node.forEach(extractStates);
      } else if (typeof node === "object") {
        Object.values(node).forEach(extractStates);
      }
    };

    extractStates(body);
    return states;
  }

  /**
   * Lower if statement
   */
  lowerIfStatement(stmt) {
    return this.createNode("IfStatement", {
      condition: stmt.condition,
      consequent: stmt.consequent ? stmt.consequent.map(s => this.lowerStatement(s)) : [],
      alternate: stmt.alternate ? stmt.alternate.map(s => this.lowerStatement(s)) : [],
    });
  }

  /**
   * Lower for statement
   */
  lowerForStatement(stmt) {
    // Check for comprehension pattern
    if (this.isComprehension(stmt)) {
      return this.lowerComprehension(stmt);
    }

    return this.createNode("ForStatement", {
      variable: stmt.target,
      iterable: stmt.iter,
      body: stmt.body ? stmt.body.map(s => this.lowerStatement(s)) : [],
      orelse: stmt.orelse ? stmt.orelse.map(s => this.lowerStatement(s)) : [],
    });
  }

  /**
   * Check if for loop is a comprehension
   */
  isComprehension(stmt) {
    // Simplified: check for comprehension markers
    return stmt.isComprehension || false;
  }

  /**
   * Lower comprehension
   */
  lowerComprehension(stmt) {
    return this.createNode("ComprehensionExpression", {
      pattern: "list_comprehension",
      variable: stmt.target,
      iterable: stmt.iter,
      condition: stmt.condition || null,
      element: stmt.element,
    });
  }

  /**
   * Lower while statement
   */
  lowerWhileStatement(stmt) {
    return this.createNode("WhileStatement", {
      condition: stmt.test,
      body: stmt.body ? stmt.body.map(s => this.lowerStatement(s)) : [],
      orelse: stmt.orelse ? stmt.orelse.map(s => this.lowerStatement(s)) : [],
    });
  }

  /**
   * Lower with statement (context manager)
   * Convert to try/finally pattern
   */
  lowerWithStatement(stmt) {
    // with expr as var: body -> try: body finally: expr.__exit__()
    return this.createNode("TryStatement", {
      body: stmt.body ? stmt.body.map(s => this.lowerStatement(s)) : [],
      handlers: [],
      orelse: [],
      finalbody: [
        this.createNode("ExpressionStatement", {
          expression: this.createNode("MethodCall", {
            object: stmt.context_expr,
            method: "__exit__",
            arguments: [],
          }),
        }),
      ],
      contextManager: stmt.context_expr,
      variable: stmt.optional_vars,
    });
  }

  /**
   * Lower try statement
   */
  lowerTryStatement(stmt) {
    return this.createNode("TryStatement", {
      body: stmt.body ? stmt.body.map(s => this.lowerStatement(s)) : [],
      handlers: stmt.handlers ? stmt.handlers.map(h => this.lowerExceptionHandler(h)) : [],
      orelse: stmt.orelse ? stmt.orelse.map(s => this.lowerStatement(s)) : [],
      finalbody: stmt.finalbody ? stmt.finalbody.map(s => this.lowerStatement(s)) : [],
    });
  }

  /**
   * Lower exception handler
   */
  lowerExceptionHandler(handler) {
    return this.createNode("ExceptionHandler", {
      exceptionType: handler.type,
      variable: handler.name,
      body: handler.body ? handler.body.map(s => this.lowerStatement(s)) : [],
    });
  }

  /**
   * Lower return statement
   */
  lowerReturnStatement(stmt) {
    return this.createNode("ReturnStatement", {
      argument: stmt.value || null,
    });
  }

  /**
   * Lower raise statement
   */
  lowerRaiseStatement(stmt) {
    return this.createNode("RaiseStatement", {
      exception: stmt.exception || null,
    });
  }

  /**
   * Lower expression statement
   */
  lowerExpressionStatement(stmt) {
    return this.createNode("ExpressionStatement", {
      expression: stmt.expression,
    });
  }

  /**
   * Lower pass statement
   */
  lowerPassStatement(_stmt) {
    return this.createNode("PassStatement", {});
  }

  /**
   * Lower break statement
   */
  lowerBreakStatement(_stmt) {
    return this.createNode("BreakStatement", {});
  }

  /**
   * Lower continue statement
   */
  lowerContinueStatement(_stmt) {
    return this.createNode("ContinueStatement", {});
  }

  /**
   * Expand Python decorator to IR
   */
  expandDecorator(decoratorName) {
    const standardDecorators = {
      "property": {
        type: "PropertyDecorator",
        creates: "getter_setter",
      },
      "staticmethod": {
        type: "StaticDecorator",
        bindsTo: "class",
      },
      "classmethod": {
        type: "ClassMethodDecorator",
        bindsTo: "class",
        passesClass: true,
      },
    };

    return standardDecorators[decoratorName] || {
      type: "CustomDecorator",
      name: decoratorName,
    };
  }

  /**
   * Create IR node using object pool (Phase B pattern)
   * @param {string} type - Node type
   * @param {object} data - Node properties
   * @returns {object} Pooled IR node
   */
  createNode(type, data) {
    if (++this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} objects created`);
    }
    return this.pool.getNode(type, data);
  }

  /**
   * Get memory usage statistics
   * @returns {object} Memory statistics
   */
  getMemoryStats() {
    return {
      objectCount: this.objectCount,
      maxObjects: this.maxObjects,
      utilization: ((this.objectCount / this.maxObjects) * 100).toFixed(1) + "%",
      pool: this.pool.getStats(),
    };
  }

  /**
   * Reset memory state
   */
  reset() {
    this.objectCount = 0;
    this.pool.clear();
    this.decoratorRegistry.clear();
    this.generatorRegistry.clear();
  }
}

module.exports = PythonLowerer;
module.exports.PythonLowerer = PythonLowerer;
