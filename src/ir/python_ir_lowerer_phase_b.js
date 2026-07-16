// python_ir_lowerer_phase_b.js
// Phase B: Python IR Lowering Rules (Deep Normalization)
// Transforms Python Phase A IR into canonical Phase B IR with full normalization.

const { _IRNode, IRNodeType, _IRType, IRTypeKind } = require("./canonical_ir_schema");
const { TypeConstraintSolver } = require("./type_constraint_solver");
const { ErrorReporter, ErrorCategory } = require("./error_reporter");
const { SemanticPreservationVerifier } = require("./semantic_preservation_verifier");

/**
 * Object Pool for IRNode and IRType reuse
 * Reduces memory allocation by reusing objects
 */
class ObjectPool {
  constructor(maxSize = 5000) {
    this.nodes = [];
    this.types = [];
    this.maxSize = maxSize;
  }

  getNode(type, data) {
    let node = this.nodes.pop();
    if (!node) {
      node = {};
    }
    // Clear previous data
    for (const key in node) {
      delete node[key];
    }
    node.type = type;
    if (data) {
      Object.assign(node, data);
    }
    return node;
  }

  getType(kind, props) {
    let type = this.types.pop();
    if (!type) {
      type = {};
    }
    // Clear previous data
    for (const key in type) {
      delete type[key];
    }
    type.kind = kind;
    if (props) {
      Object.assign(type, props);
    }
    return type;
  }

  releaseNode(node) {
    if (this.nodes.length < this.maxSize && node) {
      this.nodes.push(node);
    }
  }

  releaseType(type) {
    if (this.types.length < this.maxSize && type) {
      this.types.push(type);
    }
  }

  clear() {
    this.nodes = [];
    this.types = [];
  }

  getStats() {
    return {
      nodesPooled: this.nodes.length,
      typesPooled: this.types.length,
    };
  }
}

/**
 * Python IR Lowerer (Phase B)
 * - Deep normalization of Python constructs
 * - Type constraint solving
 * - Semantic preservation verification
 * - Memory-optimized with object pooling
 */
class PythonIRLowererPhaseB {
  constructor(options = {}) {
    this.options = options;
    this.constraintSolver = new TypeConstraintSolver();
    this.errorReporter = new ErrorReporter();
    this.verifier = new SemanticPreservationVerifier();
    this.symbolCounter = 0;
    
    // Memory management
    this.pool = new ObjectPool(options.poolSize || 5000);
    this.objectCount = 0;
    this.maxObjects = options.maxObjects || 50000;
    this.typeCache = new Map(); // Cache for normalized types
  }

  /**
   * Lower Python Phase A IR to Phase B canonical IR
   * @param {Object} phaseAIR - Phase A IR from Python parser/lowerer
   * @returns {Object} - Phase B canonical IR
   */
  lower(phaseAIR) {
    // Reset state for new transpilation
    this.constraintSolver.clear();
    this.errorReporter.clear();
    this.objectCount = 0;
    this.symbolCounter = 0;
    this.typeCache.clear();
    // Note: Don't clear pool - reuse objects across calls

    const normalizedInput = this.normalizeInput(phaseAIR);

    // Phase B lowering passes
    const phaseB1 = this.normalizeTypes(normalizedInput);
    const phaseB2 = this.normalizeControlFlow(phaseB1);
    const phaseB3 = this.normalizeExpressions(phaseB2);
    const phaseB4 = this.normalizeDeclarations(phaseB3);
    const phaseB5 = this.resolveTypeConstraints(phaseB4);
    const phaseB6 = this.finalizeCanonicalIR(phaseB5);

    // Verify semantic preservation
    const verification = this.verifier.verify(normalizedInput, phaseB6);
    if (!verification.passed) {
      this.errorReporter.error({
        category: ErrorCategory.SemanticError,
        message: "Semantic preservation verification failed",
        related: verification.errors,
      });
    }

    return {
      ir: phaseB6,
      errors: this.errorReporter.getBySeverity("error"),
      warnings: this.errorReporter.getBySeverity("warning"),
      typeConstraints: this.constraintSolver.constraints,
      verification,
    };
  }

  /**
   * Normalize Phase A input to a canonical tree-based structure
   */
  normalizeInput(phaseAIR) {
    if (!phaseAIR || typeof phaseAIR !== "object") return phaseAIR;

    if (phaseAIR.type === "IRModule" && Array.isArray(phaseAIR.nodes)) {
      return {
        type: "Module",
        body: phaseAIR.nodes,
        metadata: phaseAIR.module || {},
      };
    }

    return phaseAIR;
  }

  /**
   * Create deterministic temporary names
   */
  createTempName(prefix) {
    const id = this.symbolCounter++;
    return `_${prefix}_${id}`;
  }

  /**
   * Pass 1: Normalize types to canonical IR types
   */
  normalizeTypes(ir) {
    return this.traverseAndTransform(ir, node => {
      if (!node || typeof node !== "object") return node;

      node.type = this.normalizeNodeType(node.type);

      // Normalize type annotations
      if ((node.type === "Variable" || node.type === "VariableDeclaration") && node.varType) {
        node.varType = this.normalizeType(node.varType);
        this.constraintSolver.registerTypeVariable(node.name, node.varType);
      }

      if ((node.type === "Function" || node.type === "FunctionDefinition") && node.returnType) {
        node.returnType = this.normalizeType(node.returnType);
      }

      if (node.type === "Function" || node.type === "FunctionDefinition") {
        const params = node.params || node.parameters || [];
        node.params = params.map(param => ({
          ...param,
          type: this.normalizeType(param.type || param.typeAnnotation),
        }));
      }

      return node;
    });
  }

  /**
   * Normalize a type to canonical IR type (with caching)
   */
  normalizeType(type) {
    if (!type) {
      return this.getCachedType("any");
    }

    if (typeof type === "string") {
      // Use cached primitive types
      return this.getCachedType(type);
    }

    // Already an IRType
    if (type.kind) {
      return type;
    }

    // Complex type annotation - create cache key
    const cacheKey = JSON.stringify(type);
    if (this.typeCache.has(cacheKey)) {
      return this.typeCache.get(cacheKey);
    }

    let normalizedType;

    if (type.type === "List") {
      normalizedType = this.createType(IRTypeKind.Array, {
        elementType: this.normalizeType(type.elementType),
      });
    } else if (type.type === "Dict") {
      normalizedType = this.createType(IRTypeKind.Map, {
        keyType: this.normalizeType(type.keyType),
        valueType: this.normalizeType(type.valueType),
      });
    } else if (type.type === "Optional") {
      normalizedType = this.createType(IRTypeKind.Optional, {
        inner: this.normalizeType(type.inner),
      });
    } else if (type.type === "Union") {
      normalizedType = this.createType(IRTypeKind.Union, {
        types: type.types.map(t => this.normalizeType(t)),
      });
    } else if (type.type === "Tuple") {
      normalizedType = this.createType(IRTypeKind.Tuple, {
        elements: type.elements.map(t => this.normalizeType(t)),
      });
    } else {
      // Default to any
      normalizedType = this.getCachedType("any");
    }

    this.typeCache.set(cacheKey, normalizedType);
    return normalizedType;
  }

  /**
   * Get cached primitive type (singleton pattern)
   */
  getCachedType(typeName) {
    if (!this._primitiveTypes) {
      this._primitiveTypes = {
        int: this.createType(IRTypeKind.Primitive, { name: "i64" }),
        float: this.createType(IRTypeKind.Primitive, { name: "f64" }),
        bool: this.createType(IRTypeKind.Primitive, { name: "bool" }),
        str: this.createType(IRTypeKind.Primitive, { name: "string" }),
        None: this.createType(IRTypeKind.Primitive, { name: "void" }),
        any: this.createType(IRTypeKind.Primitive, { name: "any" }),
      };
    }

    if (this._primitiveTypes[typeName]) {
      return this._primitiveTypes[typeName];
    }

    // Generic type - create and cache
    if (!this._genericTypes) {
      this._genericTypes = new Map();
    }

    if (!this._genericTypes.has(typeName)) {
      this._genericTypes.set(typeName, this.createType(IRTypeKind.Generic, { name: typeName }));
    }

    return this._genericTypes.get(typeName);
  }

  /**
   * Create IRType with memory limit check
   */
  createType(kind, props) {
    if (++this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} objects created. Consider increasing maxObjects option.`);
    }

    // Use object pool
    return this.pool.getType(kind, props);
  }

  /**
   * Create IRNode with memory limit check
   */
  createNode(type, data) {
    if (++this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} objects created. Consider increasing maxObjects option.`);
    }

    // Use object pool
    return this.pool.getNode(type, data);
  }

  /**
   * Pass 2: Normalize control flow
   */
  normalizeControlFlow(ir) {
    return this.traverseAndTransform(ir, node => {
      if (!node || typeof node !== "object") return node;

      // Normalize IfStatement structure
      if (node.type === "IfStatement") {
        return this.createNode(IRNodeType.If, {
          condition: node.condition,
          then: node.consequent || [],
          else: node.alternate || [],
        });
      }

      // Normalize TryStatement structure
      if (node.type === "TryStatement") {
        return this.createNode(IRNodeType.Try, {
          block: node.body || [],
          handlers: node.handlers || [],
          finalizer: node.finalbody || node.finalizer || null,
        });
      }

      // Normalize Python-specific control flow to canonical forms
      if (node.type === "For" && node.target && node.iter) {
        // Python for loop → canonical iterator loop
        return this.createNode(IRNodeType.For, {
          init: this.createNode(IRNodeType.Variable, {
            name: node.target.name,
            varType: this.createType(IRTypeKind.Generic, { name: "iterator" }),
          }),
          condition: this.createNode(IRNodeType.Call, {
            callee: { name: "hasNext" },
            args: [node.iter],
          }),
          update: this.createNode(IRNodeType.Assignment, {
            target: node.target,
            value: this.createNode(IRNodeType.Call, {
              callee: { name: "next" },
              args: [node.iter],
            }),
          }),
          body: node.body,
        });
      }

      // Normalize while-else to canonical form
      if (node.type === "While" && node.orelse) {
        // while-else → while + flag check
        const flagName = this.createTempName("while_else_flag");
        return this.createNode(IRNodeType.Block, {
          statements: [
            this.createNode(IRNodeType.Variable, {
              name: flagName,
              varType: this.getCachedType("bool"),
              value: this.createNode(IRNodeType.Literal, { value: true }),
            }),
            this.createNode(IRNodeType.While, {
              condition: node.condition,
              body: [
                ...node.body,
                this.createNode(IRNodeType.Assignment, {
                  target: { name: flagName },
                  value: this.createNode(IRNodeType.Literal, { value: false }),
                }),
              ],
            }),
            this.createNode(IRNodeType.If, {
              condition: { name: flagName },
              then: node.orelse,
            }),
          ],
        });
      }

      if (node.type === "ForStatement") {
        return this.createNode(IRNodeType.For, {
          init: this.createNode(IRNodeType.Variable, {
            name: node.variable?.name || "item",
            varType: this.createType(IRTypeKind.Generic, { name: "iterator" }),
          }),
          iter: node.iterable,
          body: node.body || [],
        });
      }

      if (node.type === "WhileStatement") {
        return this.createNode(IRNodeType.While, {
          condition: node.condition,
          body: node.body || [],
          orelse: node.orelse || [],
        });
      }

      return node;
    });
  }

  /**
   * Pass 3: Normalize expressions
   */
  normalizeExpressions(ir) {
    return this.traverseAndTransform(ir, node => {
      if (!node || typeof node !== "object") return node;

      // Normalize Python operators to canonical operators
      if (node.type === "BinaryOp" || node.type === "BinaryExpression") {
        node.operator = this.normalizeOperator(node.operator);

        // Add type constraints
        this.constraintSolver.addConstraint({
          kind: "equality",
          left: node.left.inferredType,
          right: node.right.inferredType,
        });
      }

      // Normalize augmented assignment (+=, -=, etc.)
      if (node.type === "AugmentedAssignment") {
        return this.createNode(IRNodeType.Assignment, {
          target: node.target,
          value: this.createNode(IRNodeType.BinaryOp, {
            operator: node.operator.replace("=", ""),
            left: node.target,
            right: node.value,
          }),
        });
      }

      // Normalize comprehensions to loops
      if (node.type === "ListComprehension" || node.type === "ComprehensionExpression") {
        return this.lowerListComprehension(node);
      }

      return node;
    });
  }

  /**
   * Normalize operator names
   */
  normalizeOperator(op) {
    const opMap = {
      "//": "div", // Floor division
      "**": "pow",
      "@": "matmul",
      and: "&&",
      or: "||",
      not: "!",
      is: "===",
      "is not": "!==",
      in: "contains",
      "not in": "not_contains",
    };

    return opMap[op] || op;
  }

  /**
   * Lower list comprehension to canonical loop
   */
  lowerListComprehension(node) {
    const resultName = this.createTempName("comp_result");
    const target = node.target || node.variable || { name: "item" };
    const iter = node.iter || node.iterable || node.sequence;
    const element = node.element || node.value || target;
    return this.createNode(IRNodeType.Block, {
      statements: [
        this.createNode(IRNodeType.Variable, {
          name: resultName,
          varType: this.createType(IRTypeKind.Array, {
            elementType: this.getCachedType("any"),
          }),
          value: this.createNode(IRNodeType.Literal, { value: [] }),
        }),
        this.createNode(IRNodeType.For, {
          init: this.createNode(IRNodeType.Variable, {
            name: target.name,
            varType: this.getCachedType("any"),
          }),
          condition: this.createNode(IRNodeType.Call, {
            callee: { name: "hasNext" },
            args: [iter],
          }),
          update: this.createNode(IRNodeType.Assignment, {
            target,
            value: this.createNode(IRNodeType.Call, {
              callee: { name: "next" },
              args: [iter],
            }),
          }),
          body: [
            ...(node.condition
              ? [
                this.createNode(IRNodeType.If, {
                  condition: node.condition,
                  then: [
                    this.createNode(IRNodeType.Call, {
                      callee: { name: "append", object: { name: resultName } },
                      args: [element],
                    }),
                  ],
                }),
              ]
              : [
                this.createNode(IRNodeType.Call, {
                  callee: { name: "append", object: { name: resultName } },
                  args: [element],
                }),
              ]),
          ],
        }),
        this.createNode(IRNodeType.Return, {
          value: { name: resultName },
        }),
      ],
    });
  }

  /**
   * Pass 4: Normalize declarations
   */
  normalizeDeclarations(ir) {
    return this.traverseAndTransform(ir, node => {
      if (!node || typeof node !== "object") return node;

      // Normalize class declarations
      if (node.type === "Class" || node.type === "ClassDefinition") {
        return this.normalizeClassDeclaration(node);
      }

      // Normalize function declarations
      if (node.type === "Function" || node.type === "FunctionDefinition") {
        return this.normalizeFunctionDeclaration(node);
      }

      return node;
    });
  }

  /**
   * Normalize class declaration
   */
  normalizeClassDeclaration(node) {
    return this.createNode(IRNodeType.Class, {
      name: node.name,
      superclass: node.superclass
        ? this.normalizeType(node.superclass)
        : node.baseClasses && node.baseClasses[0]
          ? this.normalizeType(node.baseClasses[0])
          : null,
      interfaces: node.interfaces ? node.interfaces.map(i => this.normalizeType(i)) : [],
      fields: node.fields || [],
      methods: (node.methods || []).map(m => this.normalizeFunctionDeclaration(m)),
      staticMethods: (node.staticMethods || []).map(m => this.normalizeFunctionDeclaration(m)),
      properties: node.properties || [],
    });
  }

  /**
   * Normalize function declaration
   */
  normalizeFunctionDeclaration(node) {
    // Add type constraints for parameters
    const params = node.params || node.parameters || [];
    if (params.length > 0) {
      for (const param of params) {
        this.constraintSolver.registerTypeVariable(param.name, param.type || param.typeAnnotation);
      }
    }

    return this.createNode(IRNodeType.Function, {
      name: node.name,
      params,
      returnType: node.returnType
        ? this.normalizeType(node.returnType)
        : this.getCachedType("any"),
      body: node.body || [],
      isAsync: node.isAsync || false,
      isGenerator: node.isGenerator || false,
      decorators: node.decorators || [],
    });
  }

  /**
   * Pass 5: Resolve type constraints
   */
  resolveTypeConstraints(ir) {
    const solved = this.constraintSolver.solve();

    if (!solved) {
      for (const error of this.constraintSolver.getErrors()) {
        this.errorReporter.error({
          category: ErrorCategory.ConstraintViolation,
          message: error.message,
        });
      }
    }

    for (const warning of this.constraintSolver.getWarnings()) {
      this.errorReporter.warning({
        category: ErrorCategory.TypeMismatch,
        message: warning.message,
      });
    }

    return ir;
  }

  /**
   * Pass 6: Finalize canonical IR
   */
  finalizeCanonicalIR(ir) {
    // Add metadata
    return {
      ...ir,
      metadata: {
        phase: "B",
        language: "Python",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Traverse and transform IR tree (in-place for memory efficiency)
   */
  traverseAndTransform(node, transform) {
    if (!node || typeof node !== "object") return node;

    // Skip if already normalized (lazy normalization)
    if (node._normalized && !this.options.forceRenormalize) {
      return node;
    }

    // Transform current node IN-PLACE
    const transformed = transform(node);
    
    // If transform returned a different object, use it
    if (transformed !== node) {
      node = transformed;
    }

    // Traverse children IN-PLACE
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) {
        // Modify array in-place
        for (let i = 0; i < value.length; i++) {
          const child = value[i];
          if (child && typeof child === "object") {
            value[i] = this.traverseAndTransform(child, transform);
          }
        }
      } else if (value && typeof value === "object") {
        // Modify object property in-place
        node[key] = this.traverseAndTransform(value, transform);
      }
    }

    // Mark as normalized
    node._normalized = true;

    return node;
  }

  /**
   * Normalize Phase A node types to canonical IR node types
   */
  normalizeNodeType(type) {
    const map = {
      IRModule: "Module",
      ClassDefinition: "Class",
      FunctionDefinition: "Function",
      IfStatement: "If",
      ForStatement: "For",
      WhileStatement: "While",
      TryStatement: "Try",
      ReturnStatement: "Return",
      RaiseStatement: "Throw",
      ExpressionStatement: "ExpressionStatement",
      BreakStatement: "Break",
      ContinueStatement: "Continue",
      PassStatement: "Block",
      BinaryExpression: "BinaryOp",
      UnaryExpression: "UnaryOp",
      CallExpression: "Call",
      MemberExpression: "MemberAccess",
      IndexExpression: "IndexAccess",
      Literal: "Literal",
      Identifier: "Identifier",
    };

    return map[type] || type;
  }

  /**
   * Get errors
   */
  getErrors() {
    return this.errorReporter.getErrors();
  }

  /**
   * Get warnings
   */
  getWarnings() {
    return this.errorReporter.getWarnings();
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      objectCount: this.objectCount,
      maxObjects: this.maxObjects,
      utilization: ((this.objectCount / this.maxObjects) * 100).toFixed(1) + "%",
      pool: this.pool.getStats(),
      typeCacheSize: this.typeCache.size,
    };
  }

  /**
   * Reset for clean state (useful for testing)
   */
  reset() {
    this.objectCount = 0;
    this.symbolCounter = 0;
    this.typeCache.clear();
    this.pool.clear();
    this.constraintSolver.clear();
    this.errorReporter.clear();
  }
}

module.exports = { PythonIRLowererPhaseB };
