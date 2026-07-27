"use strict";

/**
 * PHP Security Validator - Phase E Security Hardening
 * Validates PHP IR for security vulnerabilities
 * 
 * Checks:
 * 1. Code injection (eval, assert, create_function)
 * 2. SQL injection (mysql_query, PDO without params)
 * 3. Command injection (shell_exec, system, exec, passthru)
 * 4. File inclusion (include, require with user input)
 * 5. Path traversal (file operations with user input)
 * 6. XSS (echo without htmlspecialchars)
 * 7. Session fixation (session_id with user input)
 * 8. Insecure deserialization (unserialize)
 * 9. Weak cryptography (md5, sha1 for passwords)
 * 10. Open redirects (header Location with user input)
 * 
 * Target: 98% security hardening
 */

class PHPSecurityValidator {
  constructor(options = {}) {
    this.options = options;
    this.issues = [];
    this.stats = {
      criticalIssues: 0,
      warningIssues: 0,
      securityScore: 100,
    };
  }

  /**
   * Main entry: Validate all security checks
   */
  validate(ir) {
    if (!ir || !ir.nodes) {
      throw new Error("Invalid IR: missing nodes");
    }

    this.issues = [];
    this.stats = {
      criticalIssues: 0,
      warningIssues: 0,
      securityScore: 100,
    };

    // Run all security checks
    this.checkCodeInjection(ir);
    this.checkSQLInjection(ir);
    this.checkCommandInjection(ir);
    this.checkFileInclusion(ir);
    this.checkPathTraversal(ir);
    this.checkXSSVulnerabilities(ir);
    this.checkSessionFixation(ir);
    this.checkInsecureDeserialization(ir);
    this.checkWeakCryptography(ir);
    this.checkOpenRedirects(ir);

    // Calculate security score
    this.calculateSecurityScore();

    return {
      passed: this.stats.criticalIssues === 0,
      securityScore: this.stats.securityScore,
      issues: this.issues,
      stats: this.stats,
    };
  }

  /**
   * Check 1: Code injection vulnerabilities
   */
  checkCodeInjection(ir) {
    const dangerousFunctions = ["eval", "assert", "create_function"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name || (node.callee.property && node.callee.property.name);

        if (dangerousFunctions.includes(funcName)) {
          // Check if argument contains user input
          const hasUserInput = this.containsUserInput(node.arguments);

          this.addIssue({
            type: "code-injection",
            severity: hasUserInput ? "critical" : "warning",
            message: `Dangerous function ${funcName}() detected`,
            location: node.loc || "unknown",
            mitigation: `Avoid ${funcName}(). Use safe alternatives or validate input strictly.`,
          });
        }
      }
    });
  }

  /**
   * Check 2: SQL injection vulnerabilities
   */
  checkSQLInjection(ir) {
    const dangerousFunctions = ["mysql_query", "mysqli_query"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name || (node.callee.property && node.callee.property.name);

        if (dangerousFunctions.includes(funcName)) {
          // Check if query contains concatenation or user input
          const query = node.arguments && node.arguments[0];
          
          if (query && this.containsConcatenation(query)) {
            this.addIssue({
              type: "sql-injection",
              severity: "critical",
              message: `SQL query with string concatenation in ${funcName}()`,
              location: node.loc || "unknown",
              mitigation: "Use prepared statements (PDO or MySQLi) with parameter binding.",
            });
          }
        }

        // Check PDO without prepared statements
        if (funcName === "query" && node.callee.object && node.callee.object.name === "pdo") {
          const query = node.arguments && node.arguments[0];
          
          if (query && this.containsConcatenation(query)) {
            this.addIssue({
              type: "sql-injection",
              severity: "critical",
              message: "PDO query with string concatenation",
              location: node.loc || "unknown",
              mitigation: "Use PDO::prepare() with parameter binding (:param or ?).",
            });
          }
        }
      }
    });
  }

  /**
   * Check 3: Command injection vulnerabilities
   */
  checkCommandInjection(ir) {
    const dangerousFunctions = ["shell_exec", "system", "exec", "passthru", "proc_open", "popen"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        if (dangerousFunctions.includes(funcName)) {
          // Check if command contains user input
          const hasUserInput = this.containsUserInput(node.arguments);

          this.addIssue({
            type: "command-injection",
            severity: hasUserInput ? "critical" : "warning",
            message: `Command execution function ${funcName}() detected`,
            location: node.loc || "unknown",
            mitigation: "Use escapeshellarg() and escapeshellcmd() or avoid shell commands.",
          });
        }
      }

      // Check backtick operator
      if (node.type === "BacktickExpression") {
        this.addIssue({
          type: "command-injection",
          severity: "critical",
          message: "Backtick operator (shell execution) detected",
          location: node.loc || "unknown",
          mitigation: "Avoid backtick operator. Use safe alternatives.",
        });
      }
    });
  }

  /**
   * Check 4: File inclusion vulnerabilities
   */
  checkFileInclusion(ir) {
    const dangerousFunctions = ["include", "require", "include_once", "require_once"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        if (dangerousFunctions.includes(funcName)) {
          // Check if path contains user input
          const hasUserInput = this.containsUserInput(node.arguments);

          if (hasUserInput) {
            this.addIssue({
              type: "file-inclusion",
              severity: "critical",
              message: `File inclusion with user input in ${funcName}()`,
              location: node.loc || "unknown",
              mitigation: "Use whitelist validation for file paths. Never include user-controlled paths.",
            });
          }
        }
      }
    });
  }

  /**
   * Check 5: Path traversal vulnerabilities
   */
  checkPathTraversal(ir) {
    const fileFunctions = ["fopen", "file_get_contents", "file_put_contents", "readfile", "unlink"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        if (fileFunctions.includes(funcName)) {
          // Check if path contains user input or ..
          const path = node.arguments && node.arguments[0];
          
          if (path && this.containsUserInput([path])) {
            this.addIssue({
              type: "path-traversal",
              severity: "critical",
              message: `File operation with user input in ${funcName}()`,
              location: node.loc || "unknown",
              mitigation: "Validate and sanitize file paths. Use basename() and realpath().",
            });
          }

          if (path && this.containsPathTraversal(path)) {
            this.addIssue({
              type: "path-traversal",
              severity: "critical",
              message: `Path traversal pattern (..) detected in ${funcName}()`,
              location: node.loc || "unknown",
              mitigation: "Remove .. from paths. Use realpath() for validation.",
            });
          }
        }
      }
    });
  }

  /**
   * Check 6: XSS vulnerabilities
   */
  checkXSSVulnerabilities(ir) {
    this.visitNodes(ir, (node) => {
      // Check echo/print without sanitization
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        if (funcName === "echo" || funcName === "print") {
          // Check if argument contains user input and no sanitization
          const args = node.arguments || [];
          
          for (const arg of args) {
            if (this.containsUserInput([arg]) && !this.containsSanitization(arg)) {
              this.addIssue({
                type: "xss",
                severity: "critical",
                message: `Unsanitized output with ${funcName}()`,
                location: node.loc || "unknown",
                mitigation: "Use htmlspecialchars() or htmlentities() for output sanitization.",
              });
            }
          }
        }
      }
    });
  }

  /**
   * Check 7: Session fixation vulnerabilities
   */
  checkSessionFixation(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        // Check session_id with user input
        if (funcName === "session_id") {
          const hasUserInput = this.containsUserInput(node.arguments);

          if (hasUserInput) {
            this.addIssue({
              type: "session-fixation",
              severity: "critical",
              message: "session_id() with user input detected",
              location: node.loc || "unknown",
              mitigation: "Never set session ID from user input. Use session_regenerate_id().",
            });
          }
        }

        // Check missing session_regenerate_id after login
        if (funcName === "session_start" && !this.hasSessionRegeneration(ir)) {
          this.addIssue({
            type: "session-fixation",
            severity: "warning",
            message: "session_start() without session_regenerate_id() after login",
            location: node.loc || "unknown",
            mitigation: "Call session_regenerate_id() after successful authentication.",
          });
        }
      }
    });
  }

  /**
   * Check 8: Insecure deserialization
   */
  checkInsecureDeserialization(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        if (funcName === "unserialize") {
          // Check if input contains user data
          const hasUserInput = this.containsUserInput(node.arguments);

          this.addIssue({
            type: "insecure-deserialization",
            severity: hasUserInput ? "critical" : "warning",
            message: "unserialize() detected",
            location: node.loc || "unknown",
            mitigation: "Avoid unserialize() with user input. Use JSON or validate data source.",
          });
        }
      }
    });
  }

  /**
   * Check 9: Weak cryptography
   */
  checkWeakCryptography(ir) {
    const weakFunctions = ["md5", "sha1"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        // Check weak hashing for passwords
        if (weakFunctions.includes(funcName)) {
          // Check if used for password hashing
          const context = this.getExpressionContext(node);
          
          if (context && context.includes("password")) {
            this.addIssue({
              type: "weak-cryptography",
              severity: "critical",
              message: `Weak hashing function ${funcName}() used for passwords`,
              location: node.loc || "unknown",
              mitigation: "Use password_hash() with PASSWORD_ARGON2ID or PASSWORD_BCRYPT.",
            });
          } else {
            this.addIssue({
              type: "weak-cryptography",
              severity: "warning",
              message: `Weak hashing function ${funcName}() detected`,
              location: node.loc || "unknown",
              mitigation: "Use hash() with sha256 or stronger algorithms.",
            });
          }
        }

        // Check password_hash without proper algorithm
        if (funcName === "password_hash") {
          const algo = node.arguments && node.arguments[1];
          
          if (!algo || (algo.type === "Literal" && algo.value === "PASSWORD_DEFAULT")) {
            this.addIssue({
              type: "weak-cryptography",
              severity: "warning",
              message: "password_hash() without explicit algorithm",
              location: node.loc || "unknown",
              mitigation: "Use PASSWORD_ARGON2ID or PASSWORD_BCRYPT explicitly.",
            });
          }
        }
      }
    });
  }

  /**
   * Check 10: Open redirect vulnerabilities
   */
  checkOpenRedirects(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        if (funcName === "header") {
          // Check for Location header with user input
          const arg = node.arguments && node.arguments[0];
          
          if (arg && this.isLocationHeader(arg) && this.containsUserInput([arg])) {
            this.addIssue({
              type: "open-redirect",
              severity: "critical",
              message: "header() Location with user input detected",
              location: node.loc || "unknown",
              mitigation: "Validate redirect URLs against whitelist. Use relative paths only.",
            });
          }
        }
      }
    });
  }

  /**
   * Check if expression contains user input
   */
  containsUserInput(args) {
    if (!args || !Array.isArray(args)) return false;

    const userInputPatterns = [
      "_GET", "_POST", "_REQUEST", "_COOKIE", "_SERVER", "_FILES",
      "request", "input", "param",
    ];

    const argsStr = JSON.stringify(args);
    return userInputPatterns.some(pattern => argsStr.includes(pattern));
  }

  /**
   * Check if expression contains concatenation
   */
  containsConcatenation(expr) {
    if (!expr) return false;
    
    if (expr.type === "BinaryExpression" && (expr.operator === "." || expr.operator === "+")) {
      return true;
    }

    // Recursive check
    const exprStr = JSON.stringify(expr);
    return exprStr.includes("\"operator\":\".\"") || exprStr.includes("\"operator\":\"+\"");
  }

  /**
   * Check if expression contains path traversal
   */
  containsPathTraversal(expr) {
    const exprStr = JSON.stringify(expr);
    return exprStr.includes("..") || exprStr.includes("%2e%2e");
  }

  /**
   * Check if expression contains sanitization
   */
  containsSanitization(expr) {
    const exprStr = JSON.stringify(expr);
    const sanitizeFunctions = ["htmlspecialchars", "htmlentities", "strip_tags", "filter_var"];
    return sanitizeFunctions.some(func => exprStr.includes(func));
  }

  /**
   * Check if header is Location header
   */
  isLocationHeader(expr) {
    const exprStr = JSON.stringify(expr);
    return exprStr.includes("Location:");
  }

  /**
   * Check if IR has session regeneration
   */
  hasSessionRegeneration(ir) {
    let found = false;
    
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee && node.callee.name === "session_regenerate_id") {
        found = true;
      }
    });

    return found;
  }

  /**
   * Get expression context (variable names, etc.)
   */
  getExpressionContext(node) {
    // Simplified: extract context from surrounding 100 chars
    const nodeStr = JSON.stringify(node);
    return nodeStr.substring(0, 100).toLowerCase();
  }

  /**
   * Add security issue
   */
  addIssue(issue) {
    this.issues.push(issue);

    if (issue.severity === "critical") {
      this.stats.criticalIssues++;
    } else {
      this.stats.warningIssues++;
    }
  }

  /**
   * Calculate security score
   */
  calculateSecurityScore() {
    const criticalDeduction = this.stats.criticalIssues * 20;
    const warningDeduction = this.stats.warningIssues * 5;
    
    this.stats.securityScore = Math.max(0, 100 - criticalDeduction - warningDeduction);
  }

  /**
   * Visit all nodes in IR tree
   */
  visitNodes(ir, callback) {
    if (!ir || typeof ir !== "object") return;

    if (ir.type) {
      callback(ir);
    }

    for (const value of Object.values(ir)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          this.visitNodes(item, callback);
        }
      } else if (value && typeof value === "object") {
        this.visitNodes(value, callback);
      }
    }
  }
}

module.exports = PHPSecurityValidator;
