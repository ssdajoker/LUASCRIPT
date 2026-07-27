#!/usr/bin/env node

/**
 * @fileoverview Side Effect Detection for Loop Invariant Motion
 * 
 * Purpose: Identify expressions with side effects that CANNOT be moved
 * out of loops safely. Critical for correctness preservation.
 * 
 * Side Effects Include:
 * - I/O operations (file, network, console)
 * - State mutations (array.push, object property assignment)
 * - Non-deterministic operations (Math.random, Date.now)
 * - Function calls (unless proven pure)
 * 
 * Forensic Note: CONSERVATIVE APPROACH - when uncertain, assume impure.
 * False negatives (missing optimization) are acceptable.
 * False positives (wrong optimization) are CRITICAL ERRORS.
 * 
 * @module side-effect-detector
 * @phase 3.4
 * @task 4.1
 * @version 1.0.0
 */

// ============================================================================
// KNOWN IMPURE OPERATIONS
// ============================================================================

const IMPURE_BUILTINS = new Set([
  // Math (non-deterministic)
  "Math.random",
  
  // Date/Time
  "Date.now",
  "Date.parse",
  "new Date",
  
  // I/O
  "console.log",
  "console.error",
  "console.warn",
  "console.info",
  "console.debug",
  "console.trace",
  "alert",
  "prompt",
  "confirm",
  
  // Global state
  "eval",
  "Function",
  
  // Timers (side effects)
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  
  // Storage
  "localStorage",
  "sessionStorage",
  "indexedDB",
  
  // Network
  "fetch",
  "XMLHttpRequest",
  "WebSocket"
]);

const MUTATION_METHODS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin"
]);

const PURE_BUILTINS = new Set([
  // Math (pure)
  "Math.abs",
  "Math.ceil",
  "Math.floor",
  "Math.round",
  "Math.sqrt",
  "Math.pow",
  "Math.min",
  "Math.max",
  "Math.sin",
  "Math.cos",
  "Math.tan",
  "Math.PI",
  "Math.E",
  
  // String methods (pure)
  "String.fromCharCode",
  "String.fromCodePoint",
  
  // Array methods (pure - return new array)
  "Array.from",
  "Array.of",
  "Array.isArray",
  
  // Object methods (pure)
  "Object.keys",
  "Object.values",
  "Object.entries",
  "Object.freeze",
  "Object.seal"
]);

// ============================================================================
// SIDE EFFECT DETECTOR
// ============================================================================

class SideEffectDetector {
  constructor(options = {}) {
    this.options = {
      // User-annotated pure functions
      pureFunctions: options.pureFunctions || new Set(),
      // Conservative mode: assume all unknown functions are impure
      conservative: options.conservative !== false
    };
  }

  /**
   * Check if expression has side effects
   */
  hasSideEffects(node) {
    if (!node || typeof node !== "object") {
      return false;
    }

    switch (node.type) {
    case "Literal":
      return false;
      
    case "Identifier":
      return false;
      
    case "BinaryExpression":
    case "LogicalExpression":
      return this.hasSideEffects(node.left) || this.hasSideEffects(node.right);
      
    case "UnaryExpression":
      return this.hasSideEffects(node.argument);
      
    case "CallExpression":
      return this.checkCallExpression(node);
      
    case "MemberExpression":
      return this.checkMemberExpression(node);
      
    case "AssignmentExpression":
      return true; // Always a side effect
      
    case "UpdateExpression":
      return true; // ++, -- are mutations
      
    case "NewExpression":
      // Object construction may have side effects
      return this.options.conservative;
      
    case "ArrayExpression":
      // Check array elements for side effects
      if (node.elements) {
        return node.elements.some(el => this.hasSideEffects(el));
      }
      return false;
      
    case "ObjectExpression":
      // Check object properties for side effects
      if (node.properties) {
        return node.properties.some(prop => 
          this.hasSideEffects(prop.value)
        );
      }
      return false;
      
    case "ConditionalExpression":
      // Ternary: check all branches
      return this.hasSideEffects(node.test) ||
               this.hasSideEffects(node.consequent) ||
               this.hasSideEffects(node.alternate);
      
    default:
      // Conservative: unknown node types assumed impure
      return this.options.conservative;
    }
  }

  /**
   * Check if call expression has side effects
   */
  checkCallExpression(node) {
    const funcName = this.getFunctionName(node.callee);

    // Check against known impure builtins
    if (IMPURE_BUILTINS.has(funcName)) {
      return true;
    }

    // Check against known pure builtins
    if (PURE_BUILTINS.has(funcName)) {
      // Still need to check arguments for side effects
      if (node.arguments) {
        return node.arguments.some(arg => this.hasSideEffects(arg));
      }
      return false;
    }

    // Check user-annotated pure functions
    if (this.options.pureFunctions.has(funcName)) {
      if (node.arguments) {
        return node.arguments.some(arg => this.hasSideEffects(arg));
      }
      return false;
    }

    // Conservative: unknown functions assumed impure
    return this.options.conservative;
  }

  /**
   * Check if member expression has side effects
   */
  checkMemberExpression(node) {
    // Check for mutation methods (arr.push, arr.splice, etc.)
    if (node.property) {
      const propName = typeof node.property === "string" 
        ? node.property 
        : node.property.name;
      
      if (MUTATION_METHODS.has(propName)) {
        return true;
      }
    }

    // Check object for side effects
    if (typeof node.object === "object") {
      return this.hasSideEffects(node.object);
    }

    return false;
  }

  /**
   * Get function name from callee node
   */
  getFunctionName(callee) {
    if (!callee) {
      return "";
    }

    if (callee.type === "Identifier") {
      return callee.name;
    }

    if (callee.type === "MemberExpression") {
      const objName = typeof callee.object === "string"
        ? callee.object
        : (callee.object.name || "");
      const propName = typeof callee.property === "string"
        ? callee.property
        : (callee.property.name || "");
      return `${objName}.${propName}`;
    }

    return "";
  }

  /**
   * Classify expression purity with confidence
   */
  classifyPurity(node) {
    if (!node || typeof node !== "object") {
      return { pure: true, confidence: 1.0, reason: "null or primitive" };
    }

    // Literals are always pure
    if (node.type === "Literal") {
      return { pure: true, confidence: 1.0, reason: "literal value" };
    }

    // Identifiers are pure (reading a variable)
    if (node.type === "Identifier") {
      return { pure: true, confidence: 1.0, reason: "variable reference" };
    }

    // Binary/logical operations pure if operands pure
    if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
      const leftPure = this.classifyPurity(node.left);
      const rightPure = this.classifyPurity(node.right);
      
      if (leftPure.pure && rightPure.pure) {
        return {
          pure: true,
          confidence: Math.min(leftPure.confidence, rightPure.confidence),
          reason: "pure operands"
        };
      }
      
      return {
        pure: false,
        confidence: 1.0,
        reason: `impure operand: ${!leftPure.pure ? "left" : "right"}`
      };
    }

    // Assignments always impure
    if (node.type === "AssignmentExpression") {
      return { pure: false, confidence: 1.0, reason: "assignment mutation" };
    }

    // Updates always impure
    if (node.type === "UpdateExpression") {
      return { pure: false, confidence: 1.0, reason: "increment/decrement mutation" };
    }

    // Function calls need careful analysis
    if (node.type === "CallExpression") {
      const funcName = this.getFunctionName(node.callee);

      if (IMPURE_BUILTINS.has(funcName)) {
        return { pure: false, confidence: 1.0, reason: `impure builtin: ${funcName}` };
      }

      if (PURE_BUILTINS.has(funcName)) {
        // Check arguments
        if (node.arguments) {
          for (const arg of node.arguments) {
            const argPurity = this.classifyPurity(arg);
            if (!argPurity.pure) {
              return { pure: false, confidence: 1.0, reason: "impure argument" };
            }
          }
        }
        return { pure: true, confidence: 0.95, reason: `pure builtin: ${funcName}` };
      }

      if (this.options.pureFunctions.has(funcName)) {
        return { pure: true, confidence: 0.9, reason: `user-annotated pure: ${funcName}` };
      }

      // Conservative: unknown function assumed impure
      return { pure: false, confidence: 0.7, reason: `unknown function: ${funcName}` };
    }

    // Member expressions need mutation check
    if (node.type === "MemberExpression") {
      const propName = typeof node.property === "string"
        ? node.property
        : node.property?.name;

      if (MUTATION_METHODS.has(propName)) {
        return { pure: false, confidence: 1.0, reason: `mutation method: ${propName}` };
      }

      return { pure: true, confidence: 0.9, reason: "property access" };
    }

    // Conservative fallback
    return { pure: false, confidence: 0.5, reason: `unknown node type: ${node.type}` };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  SideEffectDetector,
  IMPURE_BUILTINS,
  PURE_BUILTINS,
  MUTATION_METHODS
};

// CLI interface
if (require.main === module) {
  console.log(`
Side Effect Detector
====================

Tests expressions for side effects to determine if they can be safely moved.

Conservative approach: When uncertain, assume impure (side effects present).

Known Impure Operations:
${Array.from(IMPURE_BUILTINS).slice(0, 10).join(", ")}... (${IMPURE_BUILTINS.size} total)

Known Pure Operations:
${Array.from(PURE_BUILTINS).slice(0, 10).join(", ")}... (${PURE_BUILTINS.size} total)

Mutation Methods:
${Array.from(MUTATION_METHODS).join(", ")}
`);
}
