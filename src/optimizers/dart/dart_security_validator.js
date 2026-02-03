"use strict";

/**
 * Dart Security Validator - Phase E Security Hardening
 * Validates Dart IR for security vulnerabilities
 * 
 * Checks:
 * 1. Unsafe type casting (as with dynamic)
 * 2. String interpolation vulnerabilities
 * 3. HTTP/Network security (unencrypted endpoints)
 * 4. File operations security
 * 5. Reflection/Mirrors misuse
 * 6. Deserialization safety (fromJson without validation)
 * 7. Stream security (proper subscription cleanup)
 * 8. Future exception handling
 * 9. Null safety violations (! overuse)
 * 10. Cryptography weaknesses
 * 
 * Target: 98% security hardening
 */

class DartSecurityValidator {
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
    this.checkUnsafeTypeCasting(ir);
    this.checkStringInterpolation(ir);
    this.checkNetworkSecurity(ir);
    this.checkFileSecurity(ir);
    this.checkReflectionMisuse(ir);
    this.checkDeserializationSafety(ir);
    this.checkStreamSecurity(ir);
    this.checkFutureSafety(ir);
    this.checkNullSafety(ir);
    this.checkCryptography(ir);

    this.calculateSecurityScore();

    return {
      passed: this.stats.criticalIssues === 0,
      securityScore: this.stats.securityScore,
      issues: this.issues,
      stats: this.stats,
    };
  }

  /**
   * Check 1: Unsafe type casting
   */
  checkUnsafeTypeCasting(ir) {
    this.visitNodes(ir, (node) => {
      // Check 'as' casting to dynamic
      if (node.type === "AsExpression" || node.type === "CastExpression") {
        const targetType = node.targetType || node.type;
        
        if (targetType === "dynamic" || targetType === "Object") {
          this.addIssue({
            type: "unsafe-casting",
            severity: "warning",
            message: "Unsafe cast to dynamic/Object",
            mitigation: "Use pattern matching or type guards instead of dynamic casts.",
          });
        }
      }
    });
  }

  /**
   * Check 2: String interpolation vulnerabilities
   */
  checkStringInterpolation(ir) {
    this.visitNodes(ir, (node) => {
      // Check string interpolation with user input
      if (node.type === "TemplateLiteral" || node.type === "InterpolatedString") {
        const hasUserInput = this.containsUserInput(node);
        
        if (hasUserInput) {
          this.addIssue({
            type: "string-interpolation",
            severity: "warning",
            message: "String interpolation with potential user input",
            mitigation: "Validate and sanitize user input before interpolation.",
          });
        }
      }
    });
  }

  /**
   * Check 3: Network security
   */
  checkNetworkSecurity(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name || (node.callee.property && node.callee.property.name);

        // Check HTTP calls (not HTTPS)
        if (funcName === "get" || funcName === "post" || funcName === "request") {
          const url = node.arguments && node.arguments[0];
          
          if (url && this.isHttpUrl(url)) {
            this.addIssue({
              type: "network-security",
              severity: "critical",
              message: "Unencrypted HTTP request detected",
              mitigation: "Use HTTPS endpoints for all network requests.",
            });
          }
        }

        // Check WebSocket security
        if (funcName === "WebSocket" && this.isHttpUrl(node.arguments && node.arguments[0])) {
          this.addIssue({
            type: "network-security",
            severity: "critical",
            message: "Unencrypted WebSocket connection",
            mitigation: "Use wss:// (WebSocket Secure) instead of ws://",
          });
        }
      }
    });
  }

  /**
   * Check 4: File security
   */
  checkFileSecurity(ir) {
    const fileFunctions = ["readAsString", "readAsBytes", "writeAsString", "writeAsBytes", "delete"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.property || node.callee.name;

        if (fileFunctions.includes(funcName)) {
          // Check if path has user input
          if (this.containsUserInput([node])) {
            this.addIssue({
              type: "file-security",
              severity: "critical",
              message: `File operation with user input: ${funcName}`,
              mitigation: "Validate file paths against whitelist. Never use user input directly.",
            });
          }
        }
      }
    });
  }

  /**
   * Check 5: Reflection/Mirrors misuse
   */
  checkReflectionMisuse(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        if (funcName === "invoke" || funcName === "getField" || funcName === "setField") {
          this.addIssue({
            type: "reflection-misuse",
            severity: "warning",
            message: "Reflection/Mirrors API usage detected",
            mitigation: "Avoid reflection when possible. Use code generation instead.",
          });
        }

        if (funcName === "staticInvoke" && this.containsUserInput(node.arguments)) {
          this.addIssue({
            type: "reflection-misuse",
            severity: "critical",
            message: "Dynamic reflection with user input",
            mitigation: "Never use reflection with user-controlled input.",
          });
        }
      }
    });
  }

  /**
   * Check 6: Deserialization safety
   */
  checkDeserializationSafety(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name || (node.callee.property && node.callee.property.name);

        // Check fromJson without validation
        if (funcName === "fromJson") {
          const hasValidation = this.hasValidation(node);
          
          if (!hasValidation && this.containsUserInput(node.arguments)) {
            this.addIssue({
              type: "deserialization",
              severity: "critical",
              message: "Unsafe deserialization with user input",
              mitigation: "Always validate JSON schema before deserialization.",
            });
          }
        }

        // Check JSON.parse equivalent
        if (funcName === "decode" || funcName === "parse") {
          if (this.containsUserInput(node.arguments)) {
            this.addIssue({
              type: "deserialization",
              severity: "warning",
              message: "JSON parsing of user input",
              mitigation: "Validate JSON structure and content types.",
            });
          }
        }
      }
    });
  }

  /**
   * Check 7: Stream security
   */
  checkStreamSecurity(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name || (node.callee.property && node.callee.property.name);

        // Check stream subscription without cleanup
        if (funcName === "listen" && !this.hasSubscriptionCleanup(node)) {
          this.addIssue({
            type: "stream-security",
            severity: "warning",
            message: "Stream subscription without proper cleanup",
            mitigation: "Use StreamSubscription.cancel() or StreamControllers for cleanup.",
          });
        }

        // Check broadcast stream without caution
        if (funcName === "asBroadcastStream") {
          this.addIssue({
            type: "stream-security",
            severity: "warning",
            message: "Broadcast stream created (multiple listeners)",
            mitigation: "Ensure all listeners are properly managed and cleaned up.",
          });
        }
      }
    });
  }

  /**
   * Check 8: Future exception handling
   */
  checkFutureSafety(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "AwaitExpression" || (node.type === "CallExpression" && this.isFutureCall(node))) {
        // Check if surrounded by try/catch
        if (!this.isInTryCatch(node)) {
          this.addIssue({
            type: "future-safety",
            severity: "warning",
            message: "Async operation without exception handling",
            mitigation: "Wrap futures in try/catch or use .catchError().",
          });
        }
      }
    });
  }

  /**
   * Check 9: Null safety violations
   */
  checkNullSafety(ir) {
    this.visitNodes(ir, (node) => {
      // Check excessive null assertions (!)
      if (node.dartNullAssertion || node.nullAssertionOperator) {
        this.addIssue({
          type: "null-safety",
          severity: "warning",
          message: "Null assertion operator (!) used",
          mitigation: "Prefer null coalescing (??) or proper null checks.",
        });
      }

      // Check unsafe nullable casts
      if (node.type === "MemberExpression" && node.dartNullAssertion && this.containsUserInput([node])) {
        this.addIssue({
          type: "null-safety",
          severity: "critical",
          message: "Null assertion on user input",
          mitigation: "Use null-safe operators (?.) instead of assertions.",
        });
      }
    });
  }

  /**
   * Check 10: Cryptography
   */
  checkCryptography(ir) {
    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression" && node.callee) {
        const funcName = node.callee.name;

        // Check weak algorithms
        if (funcName === "md5" || funcName === "sha1") {
          this.addIssue({
            type: "weak-crypto",
            severity: "critical",
            message: `Weak cryptographic algorithm: ${funcName}`,
            mitigation: "Use SHA-256 or stronger for hashing.",
          });
        }

        // Check hardcoded keys
        if ((funcName === "encrypt" || funcName === "decrypt") && this.hasHardcodedKey(node)) {
          this.addIssue({
            type: "hardcoded-secrets",
            severity: "critical",
            message: "Hardcoded encryption key detected",
            mitigation: "Store keys in secure storage (secure_storage package).",
          });
        }

        // Check random generator use
        if (funcName === "Random") {
          this.addIssue({
            type: "weak-crypto",
            severity: "critical",
            message: "Random used for cryptographic purposes",
            mitigation: "Use dart:developer's SecureRandom for crypto operations.",
          });
        }
      }
    });
  }

  /**
   * Check if URL is HTTP (not HTTPS)
   */
  isHttpUrl(expr) {
    const exprStr = JSON.stringify(expr);
    return exprStr.includes("http://") && !exprStr.includes("https://");
  }

  /**
   * Check if expression contains user input
   */
  containsUserInput(args) {
    if (!args) return false;
    
    const patterns = ["request", "input", "user", "query", "param", "body"];
    const argsStr = JSON.stringify(args);
    
    return patterns.some(pattern => argsStr.toLowerCase().includes(pattern));
  }

  /**
   * Check if expression has validation
   */
  hasValidation(node) {
    const nodeStr = JSON.stringify(node);
    const validationPatterns = ["validate", "check", "assert", "if", "throw"];
    
    return validationPatterns.some(pattern => nodeStr.includes(pattern));
  }

  /**
   * Check if stream has subscription cleanup
   */
  hasSubscriptionCleanup(node) {
    const nodeStr = JSON.stringify(node);
    return nodeStr.includes("cancel") || nodeStr.includes("StreamController") || nodeStr.includes("onCancel");
  }

  /**
   * Check if is Future call
   */
  isFutureCall(node) {
    const funcName = node.callee && node.callee.property;
    return funcName && (funcName.includes("then") || funcName.includes("catchError"));
  }

  /**
   * Check if node is in try/catch
   */
  isInTryCatch(node) {
    // Simplified: check if surrounded by try
    return false; // Would need parent tracking
  }

  /**
   * Check for hardcoded keys
   */
  hasHardcodedKey(node) {
    const nodeStr = JSON.stringify(node);
    const keyPatterns = ["key", "secret", "password", "token"];
    
    return keyPatterns.some(pattern => nodeStr.includes(pattern));
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

module.exports = DartSecurityValidator;
