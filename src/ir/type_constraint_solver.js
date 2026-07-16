// type_constraint_solver.js
// Phase B: Type Constraint Solver
// Solves type constraints and ensures type safety across the canonical IR.

const { IRTypeKind, _IRType } = require("./canonical_ir_schema");

/**
 * Type Constraint Solver
 * - Resolves type variables and constraints
 * - Performs type inference
 * - Validates type compatibility
 * - Reports type errors
 */
class TypeConstraintSolver {
  constructor() {
    this.constraints = [];
    this.typeVariables = new Map();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Add a type constraint
   * @param {Object} constraint - Constraint object
   */
  addConstraint(constraint) {
    this.constraints.push(constraint);
  }

  /**
   * Register a type variable
   * @param {string} name - Variable name
   * @param {IRType} type - Type annotation
   */
  registerTypeVariable(name, type = null) {
    if (!this.typeVariables.has(name)) {
      this.typeVariables.set(name, {
        name,
        type,
        constraints: [],
        inferred: false,
      });
    }
  }

  /**
   * Solve all constraints
   * @returns {boolean} - True if all constraints are satisfied
   */
  solve() {
    this.errors = [];
    this.warnings = [];

    // Iterate through constraints and solve
    for (const constraint of this.constraints) {
      if (!this.solveConstraint(constraint)) {
        this.errors.push({
          type: "constraint_violation",
          message: `Type constraint not satisfied: ${JSON.stringify(constraint)}`,
          constraint,
        });
      }
    }

    // Perform type inference for unresolved variables
    this.inferTypes();

    return this.errors.length === 0;
  }

  /**
   * Solve a single constraint
   * @param {Object} constraint - Constraint to solve
   * @returns {boolean} - True if constraint is satisfied
   */
  solveConstraint(constraint) {
    const { kind, left, right } = constraint;

    switch (kind) {
    case "equality":
      return this.solveEqualityConstraint(left, right);
    case "subtype":
      return this.solveSubtypeConstraint(left, right);
    case "assignable":
      return this.solveAssignableConstraint(left, right);
    case "callable":
      return this.solveCallableConstraint(left, right);
    default:
      this.warnings.push({
        type: "unknown_constraint",
        message: `Unknown constraint kind: ${kind}`,
        constraint,
      });
      return true;
    }
  }

  /**
   * Solve equality constraint: left == right
   */
  solveEqualityConstraint(left, right) {
    return this.unify(left, right);
  }

  /**
   * Solve subtype constraint: left <: right
   */
  solveSubtypeConstraint(left, right) {
    return this.isSubtype(left, right);
  }

  /**
   * Solve assignable constraint: left := right
   */
  solveAssignableConstraint(left, right) {
    return this.isAssignable(left, right);
  }

  /**
   * Solve callable constraint: function can be called with args
   */
  solveCallableConstraint(funcType, argTypes) {
    if (funcType.kind !== IRTypeKind.Function) {
      return false;
    }

    const { params } = funcType;
    if (params.length !== argTypes.length) {
      return false;
    }

    for (let i = 0; i < params.length; i++) {
      if (!this.isAssignable(params[i].type, argTypes[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Unify two types
   * @param {IRType} t1 - First type
   * @param {IRType} t2 - Second type
   * @returns {boolean} - True if types can be unified
   */
  unify(t1, t2) {
    if (!t1 || !t2) return false;

    // Same kind and name
    if (t1.kind === t2.kind && t1.name === t2.name) {
      return true;
    }

    // Handle generics
    if (t1.kind === IRTypeKind.Generic || t2.kind === IRTypeKind.Generic) {
      return this.unifyGeneric(t1, t2);
    }

    // Handle optionals
    if (t1.kind === IRTypeKind.Optional && t2.kind === IRTypeKind.Optional) {
      return this.unify(t1.inner, t2.inner);
    }

    // Handle arrays
    if (t1.kind === IRTypeKind.Array && t2.kind === IRTypeKind.Array) {
      return this.unify(t1.elementType, t2.elementType);
    }

    // Handle maps
    if (t1.kind === IRTypeKind.Map && t2.kind === IRTypeKind.Map) {
      return this.unify(t1.keyType, t2.keyType) && this.unify(t1.valueType, t2.valueType);
    }

    // Handle tuples
    if (t1.kind === IRTypeKind.Tuple && t2.kind === IRTypeKind.Tuple) {
      if (t1.elements.length !== t2.elements.length) return false;
      for (let i = 0; i < t1.elements.length; i++) {
        if (!this.unify(t1.elements[i], t2.elements[i])) return false;
      }
      return true;
    }

    // Handle functions
    if (t1.kind === IRTypeKind.Function && t2.kind === IRTypeKind.Function) {
      return this.unifyFunctions(t1, t2);
    }

    return false;
  }

  /**
   * Unify generic types
   */
  unifyGeneric(_t1, _t2) {
    // Simplified: treat generics as unified if one is generic
    return true;
  }

  /**
   * Unify function types
   */
  unifyFunctions(f1, f2) {
    if (f1.params.length !== f2.params.length) return false;

    for (let i = 0; i < f1.params.length; i++) {
      if (!this.unify(f1.params[i].type, f2.params[i].type)) return false;
    }

    return this.unify(f1.returnType, f2.returnType);
  }

  /**
   * Check if t1 is a subtype of t2
   * @param {IRType} t1 - Subtype
   * @param {IRType} t2 - Supertype
   * @returns {boolean} - True if t1 <: t2
   */
  isSubtype(t1, t2) {
    if (!t1 || !t2) return false;

    // Same type
    if (this.unify(t1, t2)) return true;

    // Any is supertype of all
    if (t2.kind === IRTypeKind.Primitive && t2.name === "any") return true;

    // Null/undefined subtypes
    if (t1.kind === IRTypeKind.Primitive && (t1.name === "null" || t1.name === "undefined")) {
      return t2.kind === IRTypeKind.Optional;
    }

    // Optional subtyping
    if (t1.kind === IRTypeKind.Optional && t2.kind === IRTypeKind.Optional) {
      return this.isSubtype(t1.inner, t2.inner);
    }

    // Union subtyping
    if (t1.kind === IRTypeKind.Union) {
      return t1.types.every(type => this.isSubtype(type, t2));
    }

    if (t2.kind === IRTypeKind.Union) {
      return t2.types.some(type => this.isSubtype(t1, type));
    }

    return false;
  }

  /**
   * Check if right can be assigned to left
   * @param {IRType} left - Target type
   * @param {IRType} right - Source type
   * @returns {boolean} - True if assignable
   */
  isAssignable(left, right) {
    if (!left || !right) return false;

    // Direct assignment
    if (this.unify(left, right)) return true;

    // Subtype assignment
    if (this.isSubtype(right, left)) return true;

    // Implicit conversions
    if (this.hasImplicitConversion(right, left)) return true;

    return false;
  }

  /**
   * Check if implicit conversion exists
   * @param {IRType} from - Source type
   * @param {IRType} to - Target type
   * @returns {boolean} - True if implicit conversion exists
   */
  hasImplicitConversion(from, to) {
    if (!from || !to) return false;

    // Numeric conversions
    const numericTypes = ["i8", "i16", "i32", "i64", "u8", "u16", "u32", "u64", "f32", "f64"];
    if (from.kind === IRTypeKind.Primitive && to.kind === IRTypeKind.Primitive) {
      if (numericTypes.includes(from.name) && numericTypes.includes(to.name)) {
        return true; // Allow with potential loss warning
      }
    }

    // String conversions
    if (to.kind === IRTypeKind.Primitive && to.name === "string") {
      return true; // Most types can convert to string
    }

    return false;
  }

  /**
   * Perform type inference
   */
  inferTypes() {
    for (const [name, varInfo] of this.typeVariables) {
      if (!varInfo.type && !varInfo.inferred) {
        // Infer from constraints
        const inferredType = this.inferFromConstraints(name, varInfo.constraints);
        if (inferredType) {
          varInfo.type = inferredType;
          varInfo.inferred = true;
        } else {
          this.warnings.push({
            type: "type_inference_failed",
            message: `Could not infer type for variable: ${name}`,
            variable: name,
          });
        }
      }
    }
  }

  /**
   * Infer type from constraints
   */
  inferFromConstraints(name, constraints) {
    // Simple inference: use first constraint's type
    if (constraints.length > 0) {
      return constraints[0].type;
    }
    return null;
  }

  /**
   * Get all errors
   * @returns {Array} - Array of error objects
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get all warnings
   * @returns {Array} - Array of warning objects
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Check if there are errors
   * @returns {boolean} - True if errors exist
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Clear all constraints and errors
   */
  clear() {
    this.constraints = [];
    this.typeVariables.clear();
    this.errors = [];
    this.warnings = [];
  }
}

module.exports = { TypeConstraintSolver };
