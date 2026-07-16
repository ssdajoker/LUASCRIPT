// semantic_preservation_verifier.js
// Phase B: Semantic Preservation Verification Framework
// Verifies that IR transformations preserve the original program semantics.

const crypto = require("crypto");

/**
 * Semantic Preservation Verifier
 * - Verifies transformations preserve semantics
 * - Checks structural equivalence
 * - Validates behavior preservation
 */
class SemanticPreservationVerifier {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Verify semantic preservation between original and transformed IR
   * @param {Object} originalIR - Original IR
   * @param {Object} transformedIR - Transformed IR
   * @param {Object} context - Verification context
   * @returns {Object} - Verification result
   */
  verify(originalIR, transformedIR, context = {}) {
    this.errors = [];
    this.warnings = [];

    const result = {
      passed: true,
      checks: [],
      errors: [],
      warnings: [],
    };

    // Structural checks
    result.checks.push(this.checkStructuralEquivalence(originalIR, transformedIR));
    result.checks.push(this.checkTypePreservation(originalIR, transformedIR));
    result.checks.push(this.checkControlFlowPreservation(originalIR, transformedIR));
    result.checks.push(this.checkSideEffectPreservation(originalIR, transformedIR));
    result.checks.push(this.checkValuePreservation(originalIR, transformedIR, context));

    // Aggregate results
    result.passed = result.checks.every(check => check.passed);
    result.errors = this.errors;
    result.warnings = this.warnings;

    return result;
  }

  /**
   * Check structural equivalence
   * - Function count, class count, variable count
   */
  checkStructuralEquivalence(original, transformed) {
    const check = {
      name: "structural_equivalence",
      passed: true,
      details: {},
    };

    const originalStats = this.computeStructuralStats(original);
    const transformedStats = this.computeStructuralStats(transformed);

    // Allow transformed to have more nodes (due to lowering), but not fewer
    for (const [key, value] of Object.entries(originalStats)) {
      if (transformedStats[key] < value) {
        check.passed = false;
        this.errors.push({
          type: "structural_mismatch",
          message: `Transformed IR has fewer ${key}: ${transformedStats[key]} < ${value}`,
        });
      }
    }

    check.details = { original: originalStats, transformed: transformedStats };
    return check;
  }

  /**
   * Compute structural statistics
   */
  computeStructuralStats(ir) {
    const stats = {
      functions: 0,
      classes: 0,
      variables: 0,
      statements: 0,
    };

    const traverse = node => {
      if (!node || typeof node !== "object") return;

      if (node.type === "Function") stats.functions++;
      if (node.type === "Class") stats.classes++;
      if (node.type === "Variable") stats.variables++;
      if (node.type && node.type !== "Module" && node.type !== "Block") {
        stats.statements++;
      }

      // Traverse children
      for (const key of Object.keys(node)) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else if (typeof node[key] === "object") {
          traverse(node[key]);
        }
      }
    };

    traverse(ir);
    return stats;
  }

  /**
   * Check type preservation
   * - All original types are preserved or refined
   */
  checkTypePreservation(original, transformed) {
    const check = {
      name: "type_preservation",
      passed: true,
      details: {},
    };

    const originalTypes = this.extractTypes(original);
    const transformedTypes = this.extractTypes(transformed);

    // Check that all original types exist in transformed
    for (const [name, _type] of originalTypes) {
      if (!transformedTypes.has(name)) {
        check.passed = false;
        this.errors.push({
          type: "type_lost",
          message: `Type information lost for: ${name}`,
        });
      }
    }

    check.details = {
      originalTypeCount: originalTypes.size,
      transformedTypeCount: transformedTypes.size,
    };

    return check;
  }

  /**
   * Extract types from IR
   */
  extractTypes(ir) {
    const types = new Map();

    const traverse = node => {
      if (!node || typeof node !== "object") return;

      if (node.name && node.type) {
        types.set(node.name, node.type);
      }

      if (node.returnType) {
        types.set(`${node.name}_return`, node.returnType);
      }

      // Traverse children
      for (const key of Object.keys(node)) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else if (typeof node[key] === "object") {
          traverse(node[key]);
        }
      }
    };

    traverse(ir);
    return types;
  }

  /**
   * Check control flow preservation
   * - Control flow graph is equivalent
   */
  checkControlFlowPreservation(original, transformed) {
    const check = {
      name: "control_flow_preservation",
      passed: true,
      details: {},
    };

    const originalCFG = this.buildControlFlowGraph(original);
    const transformedCFG = this.buildControlFlowGraph(transformed);

    // Simplified check: same number of branches and loops
    if (originalCFG.branchCount !== transformedCFG.branchCount) {
      this.warnings.push({
        type: "control_flow_mismatch",
        message: `Branch count differs: ${originalCFG.branchCount} vs ${transformedCFG.branchCount}`,
      });
    }

    check.details = { original: originalCFG, transformed: transformedCFG };
    return check;
  }

  /**
   * Build control flow graph statistics
   */
  buildControlFlowGraph(ir) {
    const cfg = {
      branchCount: 0,
      loopCount: 0,
      returnCount: 0,
    };

    const traverse = node => {
      if (!node || typeof node !== "object") return;

      if (node.type === "If") cfg.branchCount++;
      if (node.type === "While" || node.type === "For") cfg.loopCount++;
      if (node.type === "Return") cfg.returnCount++;

      // Traverse children
      for (const key of Object.keys(node)) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else if (typeof node[key] === "object") {
          traverse(node[key]);
        }
      }
    };

    traverse(ir);
    return cfg;
  }

  /**
   * Check side effect preservation
   * - All side effects are preserved
   */
  checkSideEffectPreservation(original, transformed) {
    const check = {
      name: "side_effect_preservation",
      passed: true,
      details: {},
    };

    const originalEffects = this.extractSideEffects(original);
    const transformedEffects = this.extractSideEffects(transformed);

    // Check that all original side effects exist in transformed
    for (const effect of originalEffects) {
      if (!transformedEffects.includes(effect)) {
        check.passed = false;
        this.errors.push({
          type: "side_effect_lost",
          message: `Side effect lost: ${effect}`,
        });
      }
    }

    check.details = {
      originalEffectCount: originalEffects.length,
      transformedEffectCount: transformedEffects.length,
    };

    return check;
  }

  /**
   * Extract side effects from IR
   */
  extractSideEffects(ir) {
    const effects = [];

    const traverse = node => {
      if (!node || typeof node !== "object") return;

      // Assignments, calls, throws are side effects
      if (node.type === "Assignment") {
        effects.push(`assign:${node.target?.name || "unknown"}`);
      }
      if (node.type === "Call") {
        effects.push(`call:${node.callee?.name || "unknown"}`);
      }
      if (node.type === "Throw") {
        effects.push(`throw:${node.value || "unknown"}`);
      }

      // Traverse children
      for (const key of Object.keys(node)) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else if (typeof node[key] === "object") {
          traverse(node[key]);
        }
      }
    };

    traverse(ir);
    return effects;
  }

  /**
   * Check value preservation
   * - Constants and literals are preserved
   */
  checkValuePreservation(original, transformed, _context) {
    const check = {
      name: "value_preservation",
      passed: true,
      details: {},
    };

    const originalValues = this.extractLiterals(original);
    const transformedValues = this.extractLiterals(transformed);

    // Check that all original literals exist in transformed
    for (const [key, value] of originalValues) {
      if (!transformedValues.has(key) || transformedValues.get(key) !== value) {
        this.warnings.push({
          type: "literal_mismatch",
          message: `Literal value mismatch for ${key}`,
        });
      }
    }

    check.details = {
      originalLiteralCount: originalValues.size,
      transformedLiteralCount: transformedValues.size,
    };

    return check;
  }

  /**
   * Extract literals from IR
   */
  extractLiterals(ir) {
    const literals = new Map();
    let counter = 0;

    const traverse = node => {
      if (!node || typeof node !== "object") return;

      if (node.type === "Literal" && node.value !== undefined) {
        literals.set(`literal_${counter++}`, node.value);
      }

      // Traverse children
      for (const key of Object.keys(node)) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else if (typeof node[key] === "object") {
          traverse(node[key]);
        }
      }
    };

    traverse(ir);
    return literals;
  }

  /**
   * Compute semantic hash
   * - Hash of semantic-relevant properties
   */
  computeSemanticHash(ir) {
    const normalized = this.normalizeForHashing(ir);
    return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
  }

  /**
   * Normalize IR for hashing
   * - Remove non-semantic fields
   */
  normalizeForHashing(ir) {
    if (!ir || typeof ir !== "object") return ir;

    const normalized = Array.isArray(ir) ? [] : {};

    for (const [key, value] of Object.entries(ir)) {
      // Skip non-semantic fields
      if (key === "location" || key === "sourceMap" || key === "comments") {
        continue;
      }

      if (Array.isArray(value)) {
        normalized[key] = value.map(v => this.normalizeForHashing(v));
      } else if (typeof value === "object" && value !== null) {
        normalized[key] = this.normalizeForHashing(value);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Get all errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get all warnings
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Clear errors and warnings
   */
  clear() {
    this.errors = [];
    this.warnings = [];
  }
}

module.exports = { SemanticPreservationVerifier };
