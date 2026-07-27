/**
 * PHASE C VALIDATOR FRAMEWORK ORCHESTRATOR
 * Coordinates all 5 validators for comprehensive AST validation
 * 
 * Integration Points:
 * - Runs AFTER parser (receives AST)
 * - Runs BEFORE generator (validates before emission)
 * - Shares context across all validators
 * - Aggregates errors and warnings
 * - Supports fail-fast or collect-all modes
 * 
 * Lines: 50
 */

const TypeValidator = require("./type_validator");
const SemanticValidator = require("./semantic_validator");
const ConcurrencyValidator = require("./concurrency_validator");
const DSLValidator = require("./dsl_validator");
const PerformanceValidator = require("./performance_validator");

class ValidatorFramework {
  constructor(config = {}) {
    this.config = {
      language: config.language || "generic",
      failFast: config.failFast !== true, // Collect all by default
      maxErrors: config.maxErrors || 1000,
      performanceThreshold: config.performanceThreshold || 1000, // 1s in ms
      ...config
    };

    // Create shared context
    this.sharedContext = {
      types: config.types || {},
      symbolTable: new Map(),
      errors: [],
      warnings: [],
      timestamp: Date.now()
    };

    // Initialize validators
    this.validators = {
      type: new TypeValidator(this.sharedContext),
      semantic: new SemanticValidator(this.sharedContext),
      concurrency: new ConcurrencyValidator(this.sharedContext),
      dsl: new DSLValidator(this.sharedContext),
      performance: new PerformanceValidator(this.sharedContext)
    };

    this.validationReport = {
      valid: true,
      errors: [],
      warnings: [],
      metrics: {},
      startTime: null,
      duration: null
    };
  }

  /**
   * Validate complete AST through all validators
   * @param {Object} ast - Abstract syntax tree from parser
   * @returns {Object} - Validation report
   */
  validate(ast) {
    this.validationReport = {
      valid: true,
      errors: [],
      warnings: [],
      metrics: {},
      startTime: Date.now(),
      duration: null,
      results: {}
    };

    if (!ast) {
      return this.createReport({
        valid: false,
        errors: [{ type: "NullAST", message: "AST is null or undefined" }]
      });
    }

    try {
      // 1. Type Validation
      this.runTypeValidation(ast);
      if (this.shouldStop()) return this.createReport();

      // 2. Semantic Validation
      this.runSemanticValidation(ast);
      if (this.shouldStop()) return this.createReport();

      // 3. Concurrency Validation (if applicable)
      this.runConcurrencyValidation(ast);
      if (this.shouldStop()) return this.createReport();

      // 4. DSL Validation (if applicable)
      this.runDSLValidation(ast);
      if (this.shouldStop()) return this.createReport();

      // 5. Performance Validation
      this.runPerformanceValidation(ast);
      if (this.shouldStop()) return this.createReport();

      this.validationReport.valid = this.validationReport.errors.length === 0;
    } catch (e) {
      this.validationReport.errors.push({
        type: "ValidatorError",
        message: `Validation failed: ${e.message}`,
        stack: e.stack
      });
      this.validationReport.valid = false;
    }

    return this.createReport();
  }

  /**
   * INTERNAL: Run type validation
   */
  runTypeValidation(ast) {
    try {
      const startTime = Date.now();
      const _typeErrors = this.validators.type.validateTypeCompatibility(ast, ast);
      const duration = Date.now() - startTime;

      this.validationReport.results.type = { errors: [], duration };
      this.validationReport.metrics.typeValidation = duration;

      // Check for type annotation validation if present
      if (ast.typeAnnotations) {
        for (const annot of ast.typeAnnotations) {
          const result = this.validators.type.validateGenericConstraints(
            annot.typeParams || [],
            annot.bindings || {}
          );
          if (!result.valid) {
            this.validationReport.results.type.errors.push(...result.errors);
          }
        }
      }

      this.validationReport.errors.push(...this.validationReport.results.type.errors);
    } catch (e) {
      this.handleValidatorError("type", e);
    }
  }

  /**
   * INTERNAL: Run semantic validation
   */
  runSemanticValidation(ast) {
    try {
      const startTime = Date.now();
      const scopeErrors = this.validators.semantic.validateScope(ast, this.sharedContext.types);
      const refErrors = this.validators.semantic.validateReferences(ast, this.sharedContext.symbolTable);
      const deadCode = this.validators.semantic.detectDeadCode(ast);
      const nameCollisions = this.validators.semantic.checkNameCollisions();
      const duration = Date.now() - startTime;

      const allErrors = [...scopeErrors, ...refErrors, ...deadCode, ...nameCollisions];
      this.validationReport.results.semantic = {
        errors: allErrors,
        deadCodeRegions: deadCode.length,
        duration
      };
      this.validationReport.metrics.semanticValidation = duration;

      this.validationReport.errors.push(...allErrors);
      this.validationReport.warnings.push(...this.validators.semantic.warnings);
    } catch (e) {
      this.handleValidatorError("semantic", e);
    }
  }

  /**
   * INTERNAL: Run concurrency validation
   */
  runConcurrencyValidation(ast) {
    try {
      const startTime = Date.now();
      const races = this.validators.concurrency.detectRaceConditions(ast);
      const deadlocks = this.validators.concurrency.detectPotentialDeadlocks(ast.concurrency);
      const duration = Date.now() - startTime;

      const allErrors = [...races, ...deadlocks];
      this.validationReport.results.concurrency = {
        errors: allErrors,
        raceConditions: races.length,
        potentialDeadlocks: deadlocks.length,
        duration
      };
      this.validationReport.metrics.concurrencyValidation = duration;

      this.validationReport.warnings.push(...allErrors.filter(e => e.severity !== "critical"));
      this.validationReport.errors.push(...allErrors.filter(e => e.severity === "critical"));
    } catch (e) {
      this.handleValidatorError("concurrency", e);
    }
  }

  /**
   * INTERNAL: Run DSL validation
   */
  runDSLValidation(ast) {
    try {
      const startTime = Date.now();
      let dslErrors = [];

      if (ast.dsl && Array.isArray(ast.dsl)) {
        for (const dslNode of ast.dsl) {
          const errors = this.validators.dsl.validateDSLSyntax(dslNode, dslNode.name);
          dslErrors.push(...errors);
        }
      }

      const duration = Date.now() - startTime;
      this.validationReport.results.dsl = { errors: dslErrors, duration };
      this.validationReport.metrics.dslValidation = duration;

      this.validationReport.errors.push(...dslErrors);
    } catch (e) {
      this.handleValidatorError("dsl", e);
    }
  }

  /**
   * INTERNAL: Run performance validation
   */
  runPerformanceValidation(ast) {
    try {
      const startTime = Date.now();
      const complexityReport = this.validators.performance.analyzeComplexity(ast);
      const perfIssues = this.validators.performance.detectPerformanceIssues(ast);
      const suggestions = this.validators.performance.suggestOptimizations(ast);
      const duration = Date.now() - startTime;

      this.validationReport.results.performance = {
        complexity: complexityReport,
        issues: perfIssues,
        suggestions,
        duration
      };
      this.validationReport.metrics.performanceValidation = duration;

      // Convert performance issues to appropriate level
      for (const issue of perfIssues) {
        if (issue.severity === "error") {
          this.validationReport.errors.push(issue);
        } else {
          this.validationReport.warnings.push(issue);
        }
      }
    } catch (e) {
      this.handleValidatorError("performance", e);
    }
  }

  /**
   * Register custom DSL rules
   * @param {string} dslName - DSL name
   * @param {Object} rules - Validation rules
   */
  registerDSL(dslName, rules) {
    this.validators.dsl.registerDSL(dslName, rules);
  }

  /**
   * INTERNAL: Check if should stop validation
   */
  shouldStop() {
    return this.config.failFast && this.validationReport.errors.length > 0;
  }

  /**
   * INTERNAL: Handle validator error
   */
  handleValidatorError(validatorName, error) {
    this.validationReport.errors.push({
      type: "ValidatorInternalError",
      validator: validatorName,
      message: error.message,
      stack: error.stack
    });
  }

  /**
   * INTERNAL: Create final report
   */
  createReport() {
    this.validationReport.duration = Date.now() - this.validationReport.startTime;
    this.validationReport.valid = this.validationReport.errors.length === 0;

    // Trim errors if exceeded max
    if (this.validationReport.errors.length > this.config.maxErrors) {
      const excess = this.validationReport.errors.length - this.config.maxErrors;
      this.validationReport.errors = this.validationReport.errors.slice(0, this.config.maxErrors);
      this.validationReport.errors.push({
        type: "ErrorsTrimmed",
        message: `${excess} additional errors not shown`
      });
    }

    return this.validationReport;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      valid: this.validationReport.valid,
      totalErrors: this.validationReport.errors.length,
      totalWarnings: this.validationReport.warnings.length,
      duration: this.validationReport.duration,
      metrics: this.validationReport.metrics,
      resultSummary: {
        type: this.validationReport.results.type,
        semantic: this.validationReport.results.semantic,
        concurrency: this.validationReport.results.concurrency,
        dsl: this.validationReport.results.dsl,
        performance: this.validationReport.results.performance
      }
    };
  }

  /**
   * Get detailed report
   */
  getReport() {
    return this.validationReport;
  }

  /**
   * Clear all state
   */
  clear() {
    for (const validator of Object.values(this.validators)) {
      if (validator.clear) {
        validator.clear();
      }
    }
    this.sharedContext.errors = [];
    this.sharedContext.warnings = [];
  }
}

module.exports = ValidatorFramework;
