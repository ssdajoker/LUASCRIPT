"use strict";

/**
 * Phase E Security Integration
 * Integrates security validator into the quality gate pipeline
 */

const PythonSecurityValidator = require("../quality/python_security_validator.js");

class PythonPhaseESecurityIntegration {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      failOnCritical: options.failOnCritical !== false,
      failOnHigh: options.failOnHigh === true,
      warnOnMedium: options.warnOnMedium !== false,
      warnOnLow: options.warnOnLow === true,
      verbose: options.verbose || false,
      ...options,
    };
    
    this.validator = new PythonSecurityValidator({
      strictMode: this.options.failOnCritical,
      maxIssues: 100,
    });
    
    this.report = null;
  }

  /**
   * Run security gate for Phase E
   */
  runSecurityGate(code, options = {}) {
    if (!this.options.enabled) {
      return {
        passed: true,
        skipped: true,
        reason: "Security gate disabled",
      };
    }

    try {
      // Validate code for security issues
      this.report = this.validator.validate(code);

      // Determine if gate passes/fails based on configuration
      const gateResult = this.evaluateGate(this.report);

      return {
        passed: gateResult.passed,
        severity: this.report.severity,
        issues: this.report.issues,
        summary: this.report.summary,
        warnings: gateResult.warnings,
        blockers: gateResult.blockers,
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        errorType: "SecurityValidationError",
      };
    }
  }

  /**
   * Evaluate if security gate passes or fails
   */
  evaluateGate(report) {
    const passed = this._shouldPass(report);
    const warnings = this._generateWarnings(report);
    const blockers = this._generateBlockers(report);

    return {
      passed,
      warnings,
      blockers,
    };
  }

  /**
   * Determine if gate should pass
   */
  _shouldPass(report) {
    // Fail on CRITICAL issues always
    if (this.options.failOnCritical && report.counts.critical > 0) {
      return false;
    }

    // Fail on HIGH issues if configured
    if (this.options.failOnHigh && report.counts.high > 0) {
      return false;
    }

    return true;
  }

  /**
   * Generate warning messages
   */
  _generateWarnings(report) {
    const warnings = [];

    if (this.options.warnOnMedium && report.counts.medium > 0) {
      warnings.push({
        type: "MEDIUM_ISSUES",
        count: report.counts.medium,
        message: `${report.counts.medium} medium-severity security issues detected`,
      });
    }

    if (this.options.warnOnLow && report.counts.low > 0) {
      warnings.push({
        type: "LOW_ISSUES",
        count: report.counts.low,
        message: `${report.counts.low} low-severity security issues detected`,
      });
    }

    return warnings;
  }

  /**
   * Generate blocker messages
   */
  _generateBlockers(report) {
    const blockers = [];

    if (report.counts.critical > 0) {
      blockers.push({
        type: "CRITICAL_ISSUES",
        count: report.counts.critical,
        message: `BLOCKING: ${report.counts.critical} critical-severity security issues detected`,
      });
    }

    if (this.options.failOnHigh && report.counts.high > 0) {
      blockers.push({
        type: "HIGH_ISSUES",
        count: report.counts.high,
        message: `BLOCKING: ${report.counts.high} high-severity security issues detected`,
      });
    }

    return blockers;
  }

  /**
   * Get formatted security report for display
   */
  getFormattedReport() {
    if (!this.report) {
      return "No security validation performed";
    }

    return this.validator.formatReport(this.report);
  }

  /**
   * Get security metrics for Phase E reporting
   */
  getMetrics() {
    if (!this.report) {
      return null;
    }

    return {
      securityStatus: this.report.valid ? "PASS" : "FAIL",
      overallSeverity: this.report.severity,
      issueCount: {
        critical: this.report.counts.critical,
        high: this.report.counts.high,
        medium: this.report.counts.medium,
        low: this.report.counts.low,
        total: this.report.counts.total,
      },
      topIssues: this.report.issues.slice(0, 5),
    };
  }

  /**
   * Generate security report for build pipeline
   */
  generatePipelineReport() {
    if (!this.report) {
      return {
        gate: "SECURITY",
        status: "SKIPPED",
        reason: "No validation performed",
      };
    }

    const gateResult = this.evaluateGate(this.report);

    return {
      gate: "SECURITY",
      status: gateResult.passed ? "PASS" : "FAIL",
      severity: this.report.severity,
      metrics: this.getMetrics(),
      issues: this.report.issues,
      warnings: gateResult.warnings,
      blockers: gateResult.blockers,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get security report for CI/CD integration
   */
  getCICDReport() {
    const report = this.generatePipelineReport();

    return {
      ...report,
      format: "SARIF", // Security Analysis Results Format
      tool: "PythonSecurityValidator",
      version: "1.0.0",
      runs: [{
        tool: {
          driver: {
            name: "Python Security Validator",
            version: "1.0.0",
          },
        },
        results: this.report.issues.map(issue => ({
          ruleId: issue.type,
          level: issue.severity.toLowerCase(),
          message: {
            text: issue.message,
          },
          locations: [{
            physicalLocation: {
              artifactLocation: {
                uri: "python-code",
              },
              region: {
                startLine: issue.location.line,
              },
            },
          }],
          properties: {
            description: issue.description,
            remediation: issue.remediation,
            cwe: issue.cwe,
          },
        })),
      }],
    };
  }

  /**
   * Reset validator state
   */
  reset() {
    this.report = null;
  }
}

module.exports = { PythonPhaseESecurityIntegration };
