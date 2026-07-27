"use strict";

/**
 * Dart IR Lowerer - Phase B Canonical Normalization
 * Converts Phase A IR to Phase B canonical IR
 * 
 * 6-Pass Pipeline:
 * 1. Type normalization (Dart typing → static constraints)
 * 2. Null safety normalization (? ! late required → canonical forms)
 * 3. Async/await normalization (async/await → canonical futures)
 * 4. Control flow normalization (switch → if-else chains)
 * 5. Type constraint resolution (bidirectional inference)
 * 6. Canonical IR finalization (verification + optimization)
 */

const { SemanticPreservationVerifier } = require("./semantic_preservation_verifier");
const { TypeConstraintSolver } = require("./type_constraint_solver");

class DartIRLowererPhaseB {
  constructor(options = {}) {
    this.options = options;
    this.verifier = new SemanticPreservationVerifier(options);
    this.constraintSolver = new TypeConstraintSolver(options);
    this.typeConstraints = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Main entry: 6-pass normalization pipeline
   */
  lower(phaseAIR) {
    if (!phaseAIR || !phaseAIR.nodes) {
      throw new Error("Invalid Phase A IR: missing nodes");
    }

    this.errors = [];
    this.warnings = [];
    this.typeConstraints = [];

    // Validate Phase A IR
    const normalizedInput = this.normalizeInput(phaseAIR);

    // Pass 1: Type normalization
    const phaseB1 = this.normalizeTypes(normalizedInput);

    // Pass 2: Null safety normalization
    const phaseB2 = this.normalizeNullSafety(phaseB1);

    // Pass 3: Async/await normalization
    const phaseB3 = this.normalizeAsync(phaseB2);

    // Pass 4: Control flow normalization
    const phaseB4 = this.normalizeControlFlow(phaseB3);

    // Pass 5: Type constraint resolution
    const phaseB5 = this.resolveTypeConstraints(phaseB4);

    // Pass 6: Canonical IR finalization
    const phaseB6 = this.finalizeCanonicalIR(phaseB5);

    // Semantic verification
    const verification = this.verifier.verify(normalizedInput, phaseB6);

    return {
      ir: phaseB6,
      errors: this.errors,
      warnings: this.warnings,
      verification,
    };
  }

  /**
   * Normalize Phase A input
   */
  normalizeInput(phaseAIR) {
    const normalized = JSON.parse(JSON.stringify(phaseAIR));
    
    if (!normalized.module) {
      normalized.module = {
        name: "main",
        language: "Dart",
        phase: "A",
      };
    }

    normalized.module.phase = "B";
    return normalized;
  }

  /**
   * Pass 1: Type normalization
   */
  normalizeTypes(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node) => {
      // Dart type declarations
      if (node.type === "VariableDeclaration" && node.type) {
        this.addTypeConstraint(node.name, node.type);
      }

      // Function return types
      if (node.type === "FunctionDeclaration" && node.returnType) {
        this.addTypeConstraint(node.name, node.returnType);
      }

      // Infer from literals
      if (node.type === "Literal") {
        node.inferredType = this.inferLiteralType(node.value);
      }

      // Infer from operators
      if (node.type === "BinaryExpression") {
        node.inferredType = this.inferBinaryType(node.operator);
      }

      // List/Map type inference
      if (node.type === "ArrayExpression") {
        node.inferredType = "List";
      }

      if (node.type === "ObjectExpression") {
        node.inferredType = "Map";
      }
    });

    return normalized;
  }

  /**
   * Pass 2: Null safety normalization
   * Normalize Dart null safety annotations
   */
  normalizeNullSafety(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node) => {
      // Normalize nullable types (Type?)
      if (node.type === "TypeAnnotation" && node.nullable) {
        node.canonical = true;
        node.nullable = true;
      }

      // Normalize late keyword
      if (node.late) {
        node.lateInitialization = true;
        node.nonNullable = true;
      }

      // Normalize required keyword
      if (node.required) {
        node.requiredParameter = true;
      }

      // Normalize null assertion (!)
      if (node.dartNullAssertion) {
        node.nullAssertionOperator = true;
      }

      // Normalize null coalescing (??)
      if (node.dartNullCoalesce) {
        node.nullCoalescingOperator = true;
      }
    });

    return normalized;
  }

  /**
   * Pass 3: Async/await normalization
   * Convert async/await to canonical future forms
   */
  normalizeAsync(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node) => {
      // Mark async functions
      if (node.type === "FunctionDeclaration" && node.async) {
        node.returnType = node.returnType || "Future";
        node.asyncFunction = true;
      }

      // Convert generators
      if (node.type === "FunctionDeclaration" && node.generator) {
        node.returnType = node.returnType || "Stream";
        node.generatorFunction = true;
      }

      // Normalize await expressions
      if (node.type === "AwaitExpression") {
        node.futureAwaited = true;
      }
    });

    return normalized;
  }

  /**
   * Pass 4: Control flow normalization
   */
  normalizeControlFlow(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node, parent, key, index) => {
      // Normalize switch to if-else chain
      if (node.type === "SwitchStatement") {
        const ifChain = this.switchToIfElse(node);
        if (parent && typeof index === "number") {
          parent[key][index] = ifChain;
        }
      }

      // Normalize do-while to while
      if (node.type === "DoWhileStatement") {
        const whileNode = this.doWhileToWhile(node);
        if (parent && typeof index === "number") {
          parent[key][index] = whileNode;
        }
      }

      // Normalize cascade to method calls
      if (node.type === "CascadeExpression") {
        node.dartCascade = true;
      }
    });

    return normalized;
  }

  /**
   * Pass 5: Type constraint resolution
   */
  resolveTypeConstraints(ir) {
    const resolvedIR = JSON.parse(JSON.stringify(ir));

    // Solve constraints
    const solution = this.constraintSolver.solve(this.typeConstraints);

    // Apply solution (handle both Map and object)
    if (solution && typeof solution === "object") {
      this.visitNodes(resolvedIR, (node) => {
        if (node.inferredType) {
          const resolvedType = solution instanceof Map
            ? solution.get(node.inferredType)
            : solution[node.inferredType];
          
          if (resolvedType) {
            node.resolvedType = resolvedType;
          }
        }
      });
    }

    return resolvedIR;
  }

  /**
   * Pass 6: Canonical IR finalization
   */
  finalizeCanonicalIR(ir) {
    const finalIR = JSON.parse(JSON.stringify(ir));

    if (finalIR.module) {
      finalIR.module.phase = "B";
      finalIR.module.canonical = true;
    }

    finalIR.metadata = {
      typeConstraints: this.typeConstraints.length,
      normalizedNodes: this.countNodes(finalIR),
      warnings: this.warnings.length,
      errors: this.errors.length,
    };

    return finalIR;
  }

  /**
   * Convert switch to if-else chain
   */
  switchToIfElse(node) {
    let ifChain = null;
    let current = null;

    for (const caseNode of node.cases || []) {
      const test = caseNode.test
        ? {
          type: "BinaryExpression",
          operator: "===",
          left: node.discriminant,
          right: caseNode.test,
        }
        : null;

      const ifNode = {
        type: "IfStatement",
        test,
        consequent: {
          type: "BlockStatement",
          body: caseNode.consequent || [],
        },
        alternate: null,
      };

      if (!ifChain) {
        ifChain = ifNode;
        current = ifNode;
      } else {
        current.alternate = ifNode;
        current = ifNode;
      }
    }

    return ifChain || node;
  }

  /**
   * Convert do-while to while
   */
  doWhileToWhile(node) {
    return {
      type: "BlockStatement",
      body: [
        {
          type: "ExpressionStatement",
          expression: node.body,
        },
        {
          type: "WhileStatement",
          test: node.test,
          body: node.body,
        },
      ],
      dartDoWhile: true,
    };
  }

  /**
   * Infer type from literal value
   */
  inferLiteralType(value) {
    if (typeof value === "string") return "String";
    if (typeof value === "number") return Number.isInteger(value) ? "int" : "double";
    if (typeof value === "boolean") return "bool";
    if (value === null) return "Null";
    return "dynamic";
  }

  /**
   * Infer type from binary operator
   */
  inferBinaryType(operator) {
    const numericOps = ["+", "-", "*", "/", "%", "~/"];
    const comparisonOps = ["<", ">", "<=", ">=", "==", "!="];
    const logicalOps = ["&&", "||"];

    if (numericOps.includes(operator)) return "num";
    if (comparisonOps.includes(operator)) return "bool";
    if (logicalOps.includes(operator)) return "bool";

    return "dynamic";
  }

  /**
   * Add type constraint for solver
   */
  addTypeConstraint(variable, type) {
    this.typeConstraints.push({
      variable,
      type,
      source: "declaration",
    });
  }

  /**
   * Visit all nodes in IR tree
   */
  visitNodes(ir, callback, parent = null, key = null, index = null) {
    if (!ir || typeof ir !== "object") return;

    if (ir.type) {
      callback(ir, parent, key, index);
    }

    for (const [childKey, childValue] of Object.entries(ir)) {
      if (Array.isArray(childValue)) {
        for (let i = 0; i < childValue.length; i++) {
          this.visitNodes(childValue[i], callback, ir, childKey, i);
        }
      } else if (childValue && typeof childValue === "object") {
        this.visitNodes(childValue, callback, ir, childKey, null);
      }
    }
  }

  /**
   * Count total nodes
   */
  countNodes(ir) {
    let count = 0;
    this.visitNodes(ir, () => count++);
    return count;
  }
}

module.exports = DartIRLowererPhaseB;
