// error_reporter.js
// Phase B: Error and Warning Reporting System
// Provides comprehensive error and warning reporting for IR lowering and type checking.

/**
 * Error Severity Levels
 */
const ErrorSeverity = {
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
};

/**
 * Error Categories
 */
const ErrorCategory = {
  TypeMismatch: 'type_mismatch',
  ConstraintViolation: 'constraint_violation',
  SemanticError: 'semantic_error',
  UndefinedReference: 'undefined_reference',
  InvalidOperation: 'invalid_operation',
  UnreachableCode: 'unreachable_code',
  DeprecatedFeature: 'deprecated_feature',
  StyleViolation: 'style_violation',
};

/**
 * Error Reporter
 * - Collects and formats errors and warnings
 * - Provides context and suggestions
 * - Supports multiple output formats
 */
class ErrorReporter {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
  }

  /**
   * Report an error
   * @param {Object} options - Error options
   */
  error(options) {
    const error = this.createReport(ErrorSeverity.Error, options);
    this.errors.push(error);
    return error;
  }

  /**
   * Report a warning
   * @param {Object} options - Warning options
   */
  warning(options) {
    const warning = this.createReport(ErrorSeverity.Warning, options);
    this.warnings.push(warning);
    return warning;
  }

  /**
   * Report an info message
   * @param {Object} options - Info options
   */
  info(options) {
    const info = this.createReport(ErrorSeverity.Info, options);
    this.infos.push(info);
    return info;
  }

  /**
   * Create an error/warning report
   * @param {string} severity - Error severity
   * @param {Object} options - Report options
   * @returns {Object} - Error report
   */
  createReport(severity, options) {
    const {
      category = ErrorCategory.SemanticError,
      message,
      location = null,
      code = null,
      suggestion = null,
      related = [],
    } = options;

    return {
      severity,
      category,
      message,
      location,
      code,
      suggestion,
      related,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all reports by severity
   * @param {string} severity - Severity level
   * @returns {Array} - Array of reports
   */
  getBySeverity(severity) {
    switch (severity) {
      case ErrorSeverity.Error:
        return this.errors;
      case ErrorSeverity.Warning:
        return this.warnings;
      case ErrorSeverity.Info:
        return this.infos;
      default:
        return [];
    }
  }

  /**
   * Get all reports
   * @returns {Array} - All reports
   */
  getAllReports() {
    return [...this.errors, ...this.warnings, ...this.infos];
  }

  /**
   * Check if there are errors
   * @returns {boolean} - True if errors exist
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Check if there are warnings
   * @returns {boolean} - True if warnings exist
   */
  hasWarnings() {
    return this.warnings.length > 0;
  }

  /**
   * Get error count
   * @returns {number} - Number of errors
   */
  getErrorCount() {
    return this.errors.length;
  }

  /**
   * Get warning count
   * @returns {number} - Number of warnings
   */
  getWarningCount() {
    return this.warnings.length;
  }

  /**
   * Format reports for console output
   * @returns {string} - Formatted output
   */
  formatForConsole() {
    const lines = [];

    for (const report of this.getAllReports()) {
      const prefix = this.getSeverityPrefix(report.severity);
      const location = report.location
        ? ` at ${report.location.file}:${report.location.line}:${report.location.column}`
        : '';

      lines.push(`${prefix} [${report.category}]${location}: ${report.message}`);

      if (report.code) {
        lines.push(`  Code: ${report.code}`);
      }

      if (report.suggestion) {
        lines.push(`  Suggestion: ${report.suggestion}`);
      }

      if (report.related.length > 0) {
        lines.push(`  Related:`);
        for (const rel of report.related) {
          lines.push(`    - ${rel}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format reports as JSON
   * @returns {string} - JSON output
   */
  formatAsJSON() {
    return JSON.stringify(
      {
        errors: this.errors,
        warnings: this.warnings,
        infos: this.infos,
        summary: {
          errorCount: this.errors.length,
          warningCount: this.warnings.length,
          infoCount: this.infos.length,
        },
      },
      null,
      2
    );
  }

  /**
   * Get severity prefix for console output
   * @param {string} severity - Severity level
   * @returns {string} - Prefix string
   */
  getSeverityPrefix(severity) {
    switch (severity) {
      case ErrorSeverity.Error:
        return 'ERROR';
      case ErrorSeverity.Warning:
        return 'WARNING';
      case ErrorSeverity.Info:
        return 'INFO';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Clear all reports
   */
  clear() {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
  }

  /**
   * Print summary
   * @returns {string} - Summary string
   */
  getSummary() {
    return `${this.errors.length} error(s), ${this.warnings.length} warning(s), ${this.infos.length} info(s)`;
  }
}

module.exports = { ErrorReporter, ErrorSeverity, ErrorCategory };
