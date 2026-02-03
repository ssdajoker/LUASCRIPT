"use strict";

/**
 * PHP IR Lowerer - Phase B Canonical Normalization
 * Converts Phase A IR to Phase B canonical IR
 * 
 * 6-Pass Pipeline:
 * 1. Type normalization (PHP dynamic typing → static constraints)
 * 2. Control flow normalization (switch/foreach → canonical forms)
 * 3. Expression normalization (arrow notation, concatenation)
 * 4. Declaration normalization (visibility → scope modifiers)
 * 5. Type constraint resolution (bidirectional inference)
 * 6. Canonical IR finalization (verification + optimization)
 */

const { SemanticPreservationVerifier } = require("./semantic_preservation_verifier");
const { TypeConstraintSolver } = require("./type_constraint_solver");

class PHPIRLowererPhaseB {
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

    // Pass 2: Control flow normalization
    const phaseB2 = this.normalizeControlFlow(phaseB1);

    // Pass 3: Expression normalization
    const phaseB3 = this.normalizeExpressions(phaseB2);

    // Pass 4: Declaration normalization
    const phaseB4 = this.normalizeDeclarations(phaseB3);

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
    
    // Ensure canonical structure
    if (!normalized.module) {
      normalized.module = {
        name: "main",
        language: "PHP",
        phase: "A",
      };
    }

    normalized.module.phase = "B";

    return normalized;
  }

  /**
   * Pass 1: Type normalization
   * Convert PHP dynamic types to static type constraints
   */
  normalizeTypes(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node) => {
      // PHP type declarations
      if (node.type === "FunctionDeclaration" && node.returnType) {
        this.addTypeConstraint(node.name, node.returnType);
      }

      // PHP type hints
      if (node.type === "Identifier" && node.typeHint) {
        this.addTypeConstraint(node.name, node.typeHint);
      }

      // Infer from literals
      if (node.type === "Literal") {
        node.inferredType = this.inferLiteralType(node.value);
      }

      // Infer from operators
      if (node.type === "BinaryExpression") {
        node.inferredType = this.inferBinaryType(node.operator);
      }

      // PHP-specific: array() to ArrayType
      if (node.type === "ArrayExpression") {
        node.inferredType = "Array";
      }

      // PHP-specific: associative array to ObjectType
      if (node.type === "ObjectExpression") {
        node.inferredType = "Object";
      }
    });

    return normalized;
  }

  /**
   * Pass 2: Control flow normalization
   * Convert PHP control flow to canonical forms
   */
  normalizeControlFlow(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node, parent, key, index) => {
      // Normalize foreach to for
      if (node.type === "ForEachStatement") {
        const forNode = this.foreachToFor(node);
        if (parent && typeof index === "number") {
          parent[key][index] = forNode;
        }
      }

      // Normalize switch to if-else chain
      if (node.type === "SwitchStatement" && this.shouldNormalizeSwitchtoIF(node)) {
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
    });

    return normalized;
  }

  /**
   * Pass 3: Expression normalization
   * Convert PHP expressions to canonical forms
   */
  normalizeExpressions(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node) => {
      // Normalize concatenation (. to +)
      if (node.type === "BinaryExpression" && node.operator === ".") {
        node.operator = "+";
        node.phpConcatenation = true;
      }

      // Normalize arrow notation (-> to .)
      if (node.type === "MemberExpression" && node.operator === "->") {
        node.operator = ".";
        node.phpArrow = true;
      }

      // Normalize scope resolution (:: to .)
      if (node.type === "MemberExpression" && node.operator === "::") {
        node.operator = ".";
        node.phpScopeResolution = true;
      }

      // Normalize isset/empty to null checks
      if (node.type === "CallExpression") {
        if (node.callee && node.callee.name === "isset") {
          node.phpBuiltin = "isset";
        }
        if (node.callee && node.callee.name === "empty") {
          node.phpBuiltin = "empty";
        }
      }

      // Normalize array access
      if (node.type === "MemberExpression" && node.computed) {
        node.canonicalArrayAccess = true;
      }
    });

    return normalized;
  }

  /**
   * Pass 4: Declaration normalization
   * Convert PHP declarations to canonical forms
   */
  normalizeDeclarations(ir) {
    const normalized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(normalized, (node) => {
      // Normalize visibility modifiers
      if (node.visibility) {
        node.accessModifier = this.normalizeVisibility(node.visibility);
        delete node.visibility;
      }

      // Normalize static keyword
      if (node.static) {
        node.isStatic = true;
        delete node.static;
      }

      // Normalize namespace declarations
      if (node.type === "NamespaceDeclaration") {
        node.canonical = true;
      }

      // Normalize global keyword
      if (node.type === "GlobalDeclaration") {
        node.scopeModifier = "global";
      }
    });

    return normalized;
  }

  /**
   * Pass 5: Type constraint resolution
   * Solve type constraints using bidirectional inference
   */
  resolveTypeConstraints(ir) {
    const resolvedIR = JSON.parse(JSON.stringify(ir));

    // Solve constraints
    const solution = this.constraintSolver.solve(this.typeConstraints);

    // Apply solution
    // FIX: Handle both Map and object solutions (Ruby bug lesson)
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
   * Verify semantic preservation + final optimizations
   */
  finalizeCanonicalIR(ir) {
    const finalIR = JSON.parse(JSON.stringify(ir));

    // Update phase
    if (finalIR.module) {
      finalIR.module.phase = "B";
      finalIR.module.canonical = true;
    }

    // Add metadata
    finalIR.metadata = {
      typeConstraints: this.typeConstraints.length,
      normalizedNodes: this.countNodes(finalIR),
      warnings: this.warnings.length,
      errors: this.errors.length,
    };

    return finalIR;
  }

  /**
   * Convert foreach to for loop
   */
  foreachToFor(node) {
    // foreach ($array as $key => $value) => for (k in array)
    return {
      type: "ForInStatement",
      left: node.left || node.variable,
      right: node.right || node.iterable,
      body: node.body,
      phpForeach: true,
    };
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
    // Execute body once then convert to while
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
      phpDoWhile: true,
    };
  }

  /**
   * Normalize visibility modifier
   */
  normalizeVisibility(visibility) {
    const map = {
      public: "public",
      private: "private",
      protected: "protected",
    };
    return map[visibility] || "public";
  }

  /**
   * Check if switch should be normalized to if-else
   */
  shouldNormalizeSwitchtoIF(node) {
    // Normalize switches with < 3 cases
    return node.cases && node.cases.length < 3;
  }

  /**
   * Infer type from literal value
   */
  inferLiteralType(value) {
    if (typeof value === "string") return "String";
    if (typeof value === "number") return Number.isInteger(value) ? "Integer" : "Float";
    if (typeof value === "boolean") return "Boolean";
    if (value === null) return "Null";
    return "Unknown";
  }

  /**
   * Infer type from binary operator
   */
  inferBinaryType(operator) {
    const numericOps = ["+", "-", "*", "/", "%", "**"];
    const comparisonOps = ["<", ">", "<=", ">=", "==", "!=", "===", "!=="];
    const logicalOps = ["&&", "||"];

    if (numericOps.includes(operator)) return "Number";
    if (comparisonOps.includes(operator)) return "Boolean";
    if (logicalOps.includes(operator)) return "Boolean";
    if (operator === ".") return "String"; // PHP concatenation

    return "Unknown";
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

    // Visit current node
    if (ir.type) {
      callback(ir, parent, key, index);
    }

    // Visit children
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

module.exports = PHPIRLowererPhaseB;
