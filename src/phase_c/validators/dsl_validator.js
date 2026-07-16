/**
 * PHASE C DSL VALIDATOR
 * Domain-specific language validation, builder pattern verification
 * 
 * Responsibilities:
 * - DSL syntax validation
 * - Builder pattern completion checking
 * - DSL constraint verification
 * - Lambda receiver type checking
 * - Type-safe builder validation
 * - DSL property validation
 * - Required field completion checking
 * 
 * Lines: 170
 */

class DSLValidator {
  constructor(sharedContext = {}) {
    this.context = sharedContext;
    this.dslRules = new Map(); // DSL name -> rules
    this.builderState = new Map(); // builder -> fields set
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate DSL syntax
   * @param {string|Object} dslCode - DSL code or AST
   * @param {string} dslName - Name of the DSL
   * @returns {Array} - Syntax errors
   */
  validateDSLSyntax(dslCode, dslName = "generic") {
    const errors = [];

    if (typeof dslCode === "string") {
      errors.push(...this.validateDSLString(dslCode, dslName));
    } else if (typeof dslCode === "object") {
      errors.push(...this.validateDSLAST(dslCode, dslName));
    }

    return errors;
  }

  /**
   * Validate builder pattern completion
   * @param {Object} builder - Builder object
   * @returns {Array} - Missing fields/required methods
   */
  validateBuilderCompletion(builder) {
    const missing = [];

    if (!builder || !builder.dslName) {
      return [{
        type: "InvalidBuilder",
        message: "Invalid builder object"
      }];
    }

    const rules = this.dslRules.get(builder.dslName) || {};
    const required = rules.required || [];
    const optional = rules.optional || [];
    const allFields = new Set([...required, ...optional]);

    // Check required fields
    for (const field of required) {
      if (!Object.prototype.hasOwnProperty.call(builder, field) || builder[field] === undefined) {
        missing.push({
          field,
          type: "MissingRequiredField",
          message: `Required field '${field}' not set in builder`,
          severity: "error"
        });
      }
    }

    // Check for invalid fields
    for (const key in builder) {
      if (!allFields.has(key) && !key.startsWith("_") && key !== "dslName") {
        missing.push({
          field: key,
          type: "UnknownField",
          message: `Unknown field '${key}' in builder`,
          severity: "warning"
        });
      }
    }

    return missing;
  }

  /**
   * Validate builder constraints
   * @param {Object} builder - Builder object
   * @returns {Array} - Constraint violations
   */
  validateBuilderConstraints(builder) {
    const violations = [];

    if (!builder || !builder.dslName) return violations;

    const rules = this.dslRules.get(builder.dslName) || {};
    const constraints = rules.constraints || [];

    for (const constraint of constraints) {
      const result = this.evaluateConstraint(constraint, builder);
      if (!result.valid) {
        violations.push({
          constraint: constraint.name,
          type: "ConstraintViolation",
          message: result.message,
          severity: constraint.severity || "error"
        });
      }
    }

    return violations;
  }

  /**
   * Validate lambda receiver type
   * @param {Object} lambda - Lambda expression
   * @param {string|Object} receiverType - Expected receiver type
   * @returns {Array} - Type errors
   */
  validateLambdaReceiver(lambda, receiverType) {
    const errors = [];

    if (!lambda) {
      return [{
        type: "InvalidLambda",
        message: "Lambda is null or undefined"
      }];
    }

    // Check if lambda has correct receiver
    if (lambda.receiver && typeof receiverType === "string") {
      const actualType = lambda.receiver.type || lambda.receiver;
      if (actualType !== receiverType) {
        errors.push({
          type: "ReceiverTypeMismatch",
          expected: receiverType,
          actual: actualType,
          message: `Lambda receiver type mismatch: expected ${receiverType}, got ${actualType}`
        });
      }
    }

    // Validate lambda parameters
    if (lambda.params && receiverType && typeof receiverType === "object") {
      for (let i = 0; i < lambda.params.length; i++) {
        const param = lambda.params[i];
        const expectedType = receiverType.paramTypes?.[i];

        if (expectedType && param.type && param.type !== expectedType) {
          errors.push({
            type: "ParameterTypeMismatch",
            parameter: i,
            expected: expectedType,
            actual: param.type,
            message: `Parameter ${i} type mismatch in lambda`
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate required fields in builder
   * @param {Object} builder - Builder to validate
   * @returns {Array} - Missing required fields
   */
  validateRequiredFields(builder) {
    const missing = [];

    if (!builder) return missing;

    const rules = this.dslRules.get(builder.dslName);
    if (!rules || !rules.required) return missing;

    for (const field of rules.required) {
      if (!Object.prototype.hasOwnProperty.call(builder, field) || builder[field] === null || builder[field] === undefined) {
        missing.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: "error"
        });
      }
    }

    return missing;
  }

  /**
   * Register DSL rules
   * @param {string} dslName - Name of DSL
   * @param {Object} rules - DSL validation rules
   */
  registerDSL(dslName, rules) {
    this.dslRules.set(dslName, rules);
  }

  /**
   * INTERNAL: Validate DSL string
   */
  validateDSLString(code, dslName) {
    const errors = [];

    // Check for balanced braces/brackets
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        type: "SyntaxError",
        message: `Unbalanced braces in ${dslName} DSL`,
        severity: "error"
      });
    }

    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push({
        type: "SyntaxError",
        message: `Unbalanced brackets in ${dslName} DSL`,
        severity: "error"
      });
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        type: "SyntaxError",
        message: `Unbalanced parentheses in ${dslName} DSL`,
        severity: "error"
      });
    }

    return errors;
  }

  /**
   * INTERNAL: Validate DSL AST
   */
  validateDSLAST(ast, dslName) {
    const errors = [];

    if (!ast.type) {
      errors.push({
        type: "InvalidAST",
        message: "DSL AST node missing type field"
      });
      return errors;
    }

    // Validate known DSL constructs
    if (dslName === "html" || dslName === "xml") {
      errors.push(...this.validateHTMLDSL(ast));
    } else if (dslName === "sql") {
      errors.push(...this.validateSQLDSL(ast));
    } else if (dslName === "json") {
      errors.push(...this.validateJSONDSL(ast));
    }

    return errors;
  }

  /**
   * INTERNAL: Evaluate constraint
   */
  evaluateConstraint(constraint, builder) {
    if (!constraint.predicate) {
      return { valid: true };
    }

    try {
      const valid = constraint.predicate(builder);
      return {
        valid,
        message: valid ? "" : (constraint.message || "Constraint violated")
      };
    } catch (e) {
      return {
        valid: false,
        message: `Constraint evaluation error: ${e.message}`
      };
    }
  }

  /**
   * INTERNAL: Validate HTML DSL
   */
  validateHTMLDSL(ast) {
    const errors = [];

    if (ast.type === "Element") {
      const validTags = new Set([
        "div", "p", "span", "a", "img", "input", "button",
        "h1", "h2", "h3", "form", "table", "tr", "td"
      ]);

      if (!validTags.has(ast.tag)) {
        errors.push({
          type: "InvalidTag",
          tag: ast.tag,
          message: `Invalid HTML tag: ${ast.tag}`
        });
      }

      // Validate required attributes for certain tags
      if (ast.tag === "img" && !ast.attrs?.src) {
        errors.push({
          type: "MissingAttribute",
          tag: "img",
          attribute: "src",
          message: "img tag requires src attribute"
        });
      }
      if (ast.tag === "a" && !ast.attrs?.href) {
        errors.push({
          type: "MissingAttribute",
          tag: "a",
          attribute: "href",
          message: "a tag requires href attribute"
        });
      }
    }

    return errors;
  }

  /**
   * INTERNAL: Validate SQL DSL
   */
  validateSQLDSL(ast) {
    const errors = [];

    if (ast.type === "SelectStatement") {
      if (!ast.from) {
        errors.push({
          type: "MissingSQLClause",
          clause: "FROM",
          message: "SELECT statement requires FROM clause"
        });
      }
    }

    return errors;
  }

  /**
   * INTERNAL: Validate JSON DSL
   */
  validateJSONDSL(ast) {
    const errors = [];

    if (ast.type !== "Object" && ast.type !== "Array" && ast.type !== "Literal") {
      errors.push({
        type: "InvalidJSONType",
        actualType: ast.type,
        message: `Invalid JSON type: ${ast.type}`
      });
    }

    return errors;
  }

  /**
   * Get all errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get issues (errors and warnings)
   */
  getIssues() {
    return { errors: this.errors, warnings: this.warnings };
  }

  /**
   * Clear state
   */
  clear() {
    this.errors = [];
    this.warnings = [];
    this.builderState.clear();
  }
}

module.exports = DSLValidator;
