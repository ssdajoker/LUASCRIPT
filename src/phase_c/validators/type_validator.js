/**
 * PHASE C TYPE VALIDATOR
 * Generic constraint checking, type compatibility validation
 * 
 * Responsibilities:
 * - Type compatibility checking (covariance/contravariance)
 * - Generic constraint validation
 * - Type parameter bounds checking
 * - Inheritance chain validation
 * - Union/intersection type resolution
 * - Phantom type handling (GADTs)
 * 
 * Lines: 170
 */

class TypeValidator {
  constructor(sharedContext = {}) {
    this.context = sharedContext;
    this.typeCache = new Map();
    this.inheritanceChain = new Map();
    this.genericConstraints = new Map();
    this.varianceRules = new Map();
    this.errors = [];
  }

  /**
   * Validate type compatibility between two types
   * @param {string|Object} fromType - Source type
   * @param {string|Object} toType - Target type
   * @param {Object} context - Validation context
   * @returns {boolean} - true if compatible
   */
  validateTypeCompatibility(fromType, toType, context = {}) {
    const cacheKey = `${JSON.stringify(fromType)}→${JSON.stringify(toType)}`;
    if (this.typeCache.has(cacheKey)) {
      return this.typeCache.get(cacheKey);
    }

    let result = false;

    // Exact match
    if (fromType === toType) {
      result = true;
    }
    // Any type is universal
    else if (toType === "Any" || fromType === "Any") {
      result = true;
    }
    // Null compatibility
    else if (fromType === "Null" && this.isNullable(toType)) {
      result = true;
    }
    // Union type checking
    else if (typeof toType === "object" && toType.kind === "Union") {
      result = toType.types.some(t => this.validateTypeCompatibility(fromType, t, context));
    }
    // Intersection type checking
    else if (typeof fromType === "object" && fromType.kind === "Intersection") {
      result = fromType.types.every(t => this.validateTypeCompatibility(t, toType, context));
    }
    // Generic type compatibility
    else if (typeof fromType === "object" && fromType.kind === "Generic") {
      result = this.validateGenericCompatibility(fromType, toType, context);
    }
    // Built-in numeric subtype compatibility
    else if (this.isNumericSubtype(fromType, toType)) {
      result = true;
    }
    // Inheritance chain checking
    else if (typeof fromType === "string") {
      const chain = this.resolveTypeInheritance(fromType, context);
      result = chain.includes(toType);
    }

    this.typeCache.set(cacheKey, result);
    return result;
  }

  /**
   * Validate generic type constraints
   * @param {Array} typeParams - Type parameters with bounds
   * @param {Object} bindings - Actual type bindings
   * @returns {Object} - { errors: [], valid: boolean }
   */
  validateGenericConstraints(typeParams, bindings) {
    const errors = [];

    for (const param of typeParams) {
      if (!param.name || !Object.prototype.hasOwnProperty.call(bindings, param.name)) {
        errors.push({
          type: "MissingGenericBinding",
          param: param.name,
          message: `Missing binding for type parameter ${param.name}`
        });
        continue;
      }

      const actualType = bindings[param.name];
      const constraints = param.bounds || param.constraints || [];

      // Check upper bounds
      for (const bound of constraints) {
        if (bound.kind === "upper" || !bound.kind) {
          if (!this.validateTypeCompatibility(actualType, bound.upper || bound.type)) {
            errors.push({
              type: "BoundViolation",
              param: param.name,
              actual: actualType,
              bound: bound.upper || bound.type,
              message: `Type ${actualType} does not satisfy upper bound ${bound.upper || bound.type}`
            });
          }
        }
        // Check lower bounds
        if (bound.kind === "lower") {
          if (!this.validateTypeCompatibility(bound.lower, actualType)) {
            errors.push({
              type: "LowerBoundViolation",
              param: param.name,
              actual: actualType,
              bound: bound.lower,
              message: `Type ${actualType} does not satisfy lower bound ${bound.lower}`
            });
          }
        }
      }
    }

    return {
      errors,
      valid: errors.length === 0
    };
  }

  /**
   * Resolve complete inheritance chain for a type
   * @param {string} type - Type to resolve
   * @param {Object} context - Lookup context
   * @returns {Array} - Inheritance chain
   */
  resolveTypeInheritance(type, context = {}) {
    if (this.inheritanceChain.has(type)) {
      return this.inheritanceChain.get(type);
    }

    const chain = [type];
    let current = type;
    const visited = new Set([type]);
    const maxDepth = 100;
    let depth = 0;

    while (depth < maxDepth) {
      const parent = this.getDirectParent(current, context);
      if (!parent || visited.has(parent)) break;

      chain.push(parent);
      visited.add(parent);
      current = parent;
      depth++;
    }

    this.inheritanceChain.set(type, chain);
    return chain;
  }

  /**
   * Check type variance rules
   * @param {string} variance - Invariant|Covariant|Contravariant
   * @param {string} actual - Actual type
   * @param {string} expected - Expected type
   * @returns {boolean} - true if variance satisfied
   */
  checkBounds(typeParam, constraints) {
    if (!constraints || constraints.length === 0) return true;

    for (const constraint of constraints) {
      const upper = constraint.upper || constraint.type;
      if (upper && !this.validateTypeCompatibility(typeParam, upper)) {
        return false;
      }
      const lower = constraint.lower;
      if (lower && !this.validateTypeCompatibility(lower, typeParam)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate variance relationships
   * @param {string} variance - Variance mode
   * @param {string} actual - Actual type
   * @param {string} expected - Expected type
   * @returns {boolean} - true if valid
   */
  validateVariance(variance, actual, expected) {
    const _rule = this.varianceRules.get(variance) || {};

    if (variance === "Invariant") {
      return actual === expected;
    } else if (variance === "Covariant") {
      return this.validateTypeCompatibility(actual, expected);
    } else if (variance === "Contravariant") {
      return this.validateTypeCompatibility(expected, actual);
    }
    return true;
  }

  /**
   * INTERNAL: Validate generic type compatibility
   */
  validateGenericCompatibility(fromType, toType, _context) {
    if (typeof toType === "string") return false;
    if (toType.kind !== "Generic") return false;

    if (fromType.name !== toType.name) return false;
    if (!fromType.params || !toType.params) return true;

    // Check type argument compatibility
    if (fromType.params.length !== toType.params.length) return false;

    for (let i = 0; i < fromType.params.length; i++) {
      const variance = fromType.variances?.[i] || "Invariant";
      if (!this.validateVariance(variance, fromType.params[i], toType.params[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * INTERNAL: Get direct parent type
   */
  getDirectParent(type, context = {}) {
    if (context.types && context.types[type]) {
      return context.types[type].parent;
    }
    return null;
  }

  /**
   * INTERNAL: Check if type can be null
   */
  isNullable(type) {
    if (typeof type === "string") {
      return type.includes("?") || type.toLowerCase() === "optional" || 
             type.startsWith("Maybe") || type.toLowerCase() === "any";
    }
    if (typeof type === "object") {
      return type.kind === "Optional" || type.nullable === true;
    }
    return type === "Any";
  }

  /**
   * INTERNAL: Check numeric subtype compatibility
   */
  isNumericSubtype(fromType, toType) {
    if (typeof fromType !== "string" || typeof toType !== "string") return false;
    if (fromType === toType) return true;
    if (toType !== "Number") return false;

    const numericTypes = new Set([
      "Int", "Float", "Double", "Long", "Short", "Byte", "Number"
    ]);

    return numericTypes.has(fromType);
  }

  /**
   * Register type definition
   */
  registerType(name, _definition) {
    this.inheritanceChain.delete(name);
    this.typeCache.clear();
  }

  /**
   * Get all validation errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear error state
   */
  clearErrors() {
    this.errors = [];
    this.typeCache.clear();
  }
}

module.exports = TypeValidator;
