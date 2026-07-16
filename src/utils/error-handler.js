/**
 * ERROR HANDLER UTILITY
 * 
 * Provides comprehensive error handling and recovery strategies
 * for the LUASCRIPT transpilation and optimization pipeline.
 * 
 * @module src/utils/error-handler
 * @version 1.0.0
 */

const fs = require("fs");
const path = require("path");

/**
 * Error Handler for graceful error management
 */
class ErrorHandler {
  constructor(options = {}) {
    this.errorLog = [];
    this.warnings = [];
    this.maxErrors = options.maxErrors || 100;
    this.throwOnError = options.throwOnError || false;
    this.logToFile = options.logToFile || false;
    this.logPath = options.logPath || path.join(process.cwd(), "logs", "errors.log");
    this.severity = options.severity || "error"; // error, warning, info
  }

  /**
   * Handle an error with logging and optional throwing
   */
  handle(error, context = {}) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      severity: context.severity || "error",
      context: {
        phase: context.phase || "unknown",
        operation: context.operation || "unknown",
        input: context.input ? this._truncate(String(context.input)) : undefined,
        details: context.details || undefined
      }
    };

    this.errorLog.push(errorRecord);

    // Trim error log if it exceeds maxErrors
    if (this.errorLog.length > this.maxErrors) {
      this.errorLog = this.errorLog.slice(-this.maxErrors);
    }

    // Log to file if enabled
    if (this.logToFile) {
      this._writeToLog(errorRecord);
    }

    // Log to console
    console.error(`[${errorRecord.severity.toUpperCase()}] ${errorRecord.message}`, errorRecord.context);

    // Throw if configured
    if (this.throwOnError) {
      throw error;
    }

    return {
      success: false,
      error: error.message,
      context: errorRecord.context,
      recovered: false
    };
  }

  /**
   * Handle error with automatic recovery using fallback
   */
  recover(error, fallback, context = {}) {
    this.handle(error, { ...context, recovery: "fallback" });
    
    console.warn(`[RECOVERY] Using fallback for ${context.operation || "operation"}`);
    
    return {
      success: true,
      recovered: true,
      data: fallback,
      error: error.message
    };
  }

  /**
   * Handle warning (non-fatal issue)
   */
  warn(message, context = {}) {
    const warning = {
      timestamp: new Date().toISOString(),
      message,
      context,
      severity: "warning"
    };

    this.warnings.push(warning);
    console.warn(`[WARNING] ${message}`, context);

    return warning;
  }

  /**
   * Validate input and return error if invalid
   */
  validate(value, validator, context = {}) {
    try {
      const result = validator(value);
      if (!result.valid) {
        return this.handle(
          new Error(result.errors ? result.errors.join(", ") : "Validation failed"),
          { ...context, operation: "validation" }
        );
      }
      return { success: true, valid: true };
    } catch (e) {
      return this.handle(e, { ...context, operation: "validation" });
    }
  }

  /**
   * Get error log
   */
  getErrorLog() {
    return this.errorLog;
  }

  /**
   * Get warnings log
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Get error statistics
   */
  getStats() {
    const errors = this.errorLog.length;
    const warnings = this.warnings.length;
    const bySeverity = {};

    for (const error of this.errorLog) {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    }

    return {
      totalErrors: errors,
      totalWarnings: warnings,
      bySeverity,
      lastError: this.errorLog[this.errorLog.length - 1] || null,
      lastWarning: this.warnings[this.warnings.length - 1] || null
    };
  }

  /**
   * Clear error and warning logs
   */
  clearLogs() {
    this.errorLog = [];
    this.warnings = [];
  }

  /**
   * Export logs to JSON
   */
  exportLogs(filepath) {
    const data = {
      exported: new Date().toISOString(),
      stats: this.getStats(),
      errors: this.errorLog,
      warnings: this.warnings
    };

    try {
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      return { success: true, filepath };
    } catch (e) {
      return this.handle(e, { operation: "export_logs" });
    }
  }

  /**
   * Private: Write error to log file
   */
  _writeToLog(errorRecord) {
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const line = JSON.stringify(errorRecord) + "\n";
      fs.appendFileSync(this.logPath, line);
    } catch (e) {
      console.error("Failed to write to error log:", e.message);
    }
  }

  /**
   * Private: Truncate long strings
   */
  _truncate(str, length = 100) {
    if (str.length > length) {
      return str.substring(0, length) + "...";
    }
    return str;
  }
}

/**
 * Validation Utilities
 */
class Validator {
  static isValidAST(ast) {
    if (!ast || typeof ast !== "object") {
      return { valid: false, errors: ["AST must be an object"] };
    }
    if (!ast.type && !ast.body) {
      return { valid: false, errors: ["AST must have type or body property"] };
    }
    return { valid: true };
  }

  static isValidBytecode(bytecode) {
    if (!Array.isArray(bytecode)) {
      return { valid: false, errors: ["Bytecode must be an array"] };
    }
    if (bytecode.length === 0) {
      return { valid: false, errors: ["Bytecode cannot be empty"] };
    }
    for (let i = 0; i < bytecode.length; i++) {
      if (!bytecode[i].type) {
        return { valid: false, errors: [`Instruction ${i} missing type property`] };
      }
    }
    return { valid: true };
  }

  static isValidCode(code, _language = "unknown") {
    if (!code || typeof code !== "string") {
      return { valid: false, errors: ["Code must be a non-empty string"] };
    }
    if (code.length === 0) {
      return { valid: false, errors: ["Code cannot be empty"] };
    }
    return { valid: true };
  }
}

/**
 * Graceful Degradation Helper
 */
class GracefulDegradation {
  /**
   * Try operation with fallback
   */
  static tryWithFallback(operation, fallback, errorHandler = null) {
    try {
      const result = operation();
      return { success: true, data: result };
    } catch (e) {
      if (errorHandler) {
        return errorHandler.recover(e, fallback, { operation: "tryWithFallback" });
      }
      console.error("Operation failed, using fallback:", e.message);
      return { success: true, recovered: true, data: fallback };
    }
  }

  /**
   * Try multiple operations in sequence
   */
  static trySequence(operations, errorHandler = null) {
    const results = [];
    const errors = [];

    for (let i = 0; i < operations.length; i++) {
      try {
        const result = operations[i]();
        results.push({ index: i, success: true, data: result });
      } catch (e) {
        errors.push({ index: i, error: e.message });
        if (errorHandler) {
          errorHandler.handle(e, { 
            operation: `trySequence[${i}]` 
          });
        }
      }
    }

    return {
      completed: results.length,
      failed: errors.length,
      results,
      errors,
      success: errors.length === 0
    };
  }

  /**
   * Try operation with timeout
   */
  static async tryWithTimeout(operation, timeout = 5000, errorHandler = null) {
    return Promise.race([
      Promise.resolve(operation()),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout)
      )
    ]).catch(e => {
      if (errorHandler) {
        return errorHandler.handle(e, { operation: "tryWithTimeout" });
      }
      throw e;
    });
  }
}

module.exports = {
  ErrorHandler,
  Validator,
  GracefulDegradation
};
