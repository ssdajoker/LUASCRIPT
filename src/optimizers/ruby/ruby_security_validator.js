"use strict";

/**
 * Ruby Security Validator - Phase E
 * Static security analysis for Ruby code generation
 * 
 * Checks for:
 * - Code injection (eval, system, exec)
 * - Path traversal vulnerabilities
 * - SQL injection patterns
 * - Command injection
 * - Insecure deserialization (Marshal.load)
 * - Open redirects
 * - XSS vulnerabilities in ERB/HAML
 * - YAML deserialization (YAML.load)
 * - Regex DoS (ReDoS)
 * 
 * Target: 98% security hardening
 */

class RubySecurityValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode !== false,
      allowEval: options.allowEval || false,
      allowSystem: options.allowSystem || false,
      allowMarshal: options.allowMarshal || false,
      maxComplexity: options.maxComplexity || 10,
      ...options,
    };

    this.stats = {
      totalChecks: 0,
      vulnerabilitiesFound: 0,
      criticalIssues: 0,
      warningIssues: 0,
      securityScore: 100,
    };

    this.issues = [];
  }

  /**
   * Validate IR for security issues
   * @param {object} ir - IR to validate
   * @returns {object} Validation result with issues
   */
  validate(ir) {
    this.stats.totalChecks = 0;
    this.stats.vulnerabilitiesFound = 0;
    this.stats.criticalIssues = 0;
    this.stats.warningIssues = 0;
    this.issues = [];

    // Run all security checks
    this.checkCodeInjection(ir);
    this.checkPathTraversal(ir);
    this.checkSQLInjection(ir);
    this.checkCommandInjection(ir);
    this.checkInsecureDeserialization(ir);
    this.checkOpenRedirects(ir);
    this.checkXSSVulnerabilities(ir);
    this.checkRegexDoS(ir);
    this.checkFilePermissions(ir);
    this.checkCryptographicWeakness(ir);

    // Calculate security score
    this.calculateSecurityScore();

    return {
      passed: this.stats.criticalIssues === 0,
      issues: this.issues,
      stats: this.stats,
      securityScore: this.stats.securityScore,
    };
  }

  /**
   * Check for code injection vulnerabilities
   * Dangerous: eval, instance_eval, class_eval, module_eval
   */
  checkCodeInjection(ir) {
    this.stats.totalChecks++;

    const dangerousMethods = ["eval", "instance_eval", "class_eval", "module_eval", "send", "__send__"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);
        
        if (dangerousMethods.includes(methodName)) {
          if (!this.options.allowEval) {
            this.addIssue("critical", "Code Injection", 
              `Dangerous method '${methodName}' detected. Can execute arbitrary code.`,
              node);
            this.stats.criticalIssues++;
          } else {
            this.addIssue("warning", "Code Injection", 
              `Method '${methodName}' allowed but dangerous.`,
              node);
            this.stats.warningIssues++;
          }
          this.stats.vulnerabilitiesFound++;
        }
      }
    });
  }

  /**
   * Check for path traversal vulnerabilities
   */
  checkPathTraversal(ir) {
    this.stats.totalChecks++;

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);
        const fileOps = ["File.open", "File.read", "File.write", "Dir.glob", "Dir.[]"];

        if (fileOps.some(op => methodName.includes(op))) {
          const args = node.arguments || [];
          if (args.length > 0 && this.isUserControlled(args[0])) {
            this.addIssue("critical", "Path Traversal",
              "File operation with user-controlled path detected.",
              node);
            this.stats.criticalIssues++;
            this.stats.vulnerabilitiesFound++;
          }
        }
      }
    });
  }

  /**
   * Check for SQL injection patterns
   */
  checkSQLInjection(ir) {
    this.stats.totalChecks++;

    this.visitNodes(ir, (node) => {
      // Check for string concatenation in SQL queries
      if (node.type === "BinaryExpression" && node.operator === "+") {
        if (this.containsSQLKeywords(node)) {
          this.addIssue("critical", "SQL Injection",
            "String concatenation in SQL query detected. Use parameterized queries.",
            node);
          this.stats.criticalIssues++;
          this.stats.vulnerabilitiesFound++;
        }
      }

      // Check for ActiveRecord find_by_sql with interpolation
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);
        if (methodName.includes("find_by_sql") || methodName.includes("execute")) {
          const args = node.arguments || [];
          if (args.length > 0 && this.hasStringInterpolation(args[0])) {
            this.addIssue("critical", "SQL Injection",
              "SQL query with string interpolation detected.",
              node);
            this.stats.criticalIssues++;
            this.stats.vulnerabilitiesFound++;
          }
        }
      }
    });
  }

  /**
   * Check for command injection
   */
  checkCommandInjection(ir) {
    this.stats.totalChecks++;

    const dangerousCommands = ["system", "exec", "`", "%x", "Open3.capture3"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);

        if (dangerousCommands.some(cmd => methodName.includes(cmd))) {
          if (!this.options.allowSystem) {
            const args = node.arguments || [];
            if (args.length > 0 && this.isUserControlled(args[0])) {
              this.addIssue("critical", "Command Injection",
                "Command execution with user input detected.",
                node);
              this.stats.criticalIssues++;
              this.stats.vulnerabilitiesFound++;
            }
          }
        }
      }
    });
  }

  /**
   * Check for insecure deserialization
   */
  checkInsecureDeserialization(ir) {
    this.stats.totalChecks++;

    const dangerousMethods = ["Marshal.load", "YAML.load", "JSON.parse"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);

        if (dangerousMethods.some(m => methodName.includes(m))) {
          if (!this.options.allowMarshal) {
            const args = node.arguments || [];
            if (args.length > 0 && this.isUserControlled(args[0])) {
              this.addIssue("critical", "Insecure Deserialization",
                "Deserialization of user-controlled data detected. Use safe_load for YAML.",
                node);
              this.stats.criticalIssues++;
              this.stats.vulnerabilitiesFound++;
            }
          }
        }
      }
    });
  }

  /**
   * Check for open redirects
   */
  checkOpenRedirects(ir) {
    this.stats.totalChecks++;

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);

        if (methodName.includes("redirect_to")) {
          const args = node.arguments || [];
          if (args.length > 0 && this.isUserControlled(args[0])) {
            this.addIssue("warning", "Open Redirect",
              "Redirect to user-controlled URL detected.",
              node);
            this.stats.warningIssues++;
            this.stats.vulnerabilitiesFound++;
          }
        }
      }
    });
  }

  /**
   * Check for XSS vulnerabilities in templates
   */
  checkXSSVulnerabilities(ir) {
    this.stats.totalChecks++;

    this.visitNodes(ir, (node) => {
      // Check for html_safe or raw in ERB
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);

        if (methodName.includes("html_safe") || methodName.includes("raw")) {
          const receiver = node.callee && node.callee.object;
          if (receiver && this.isUserControlled(receiver)) {
            this.addIssue("critical", "XSS Vulnerability",
              "User input marked as html_safe without sanitization.",
              node);
            this.stats.criticalIssues++;
            this.stats.vulnerabilitiesFound++;
          }
        }
      }
    });
  }

  /**
   * Check for Regex DoS (ReDoS)
   */
  checkRegexDoS(ir) {
    this.stats.totalChecks++;

    this.visitNodes(ir, (node) => {
      if (node.type === "Literal" && node.value && typeof node.value === "object" && node.value.regex) {
        const pattern = node.value.regex;
        if (this.hasReDoSPattern(pattern)) {
          this.addIssue("warning", "Regex DoS",
            `Potentially catastrophic regex pattern detected: ${pattern}`,
            node);
          this.stats.warningIssues++;
          this.stats.vulnerabilitiesFound++;
        }
      }
    });
  }

  /**
   * Check for insecure file permissions
   */
  checkFilePermissions(ir) {
    this.stats.totalChecks++;

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);

        if (methodName.includes("File.chmod") || methodName.includes("FileUtils.chmod")) {
          const args = node.arguments || [];
          if (args.length > 0 && args[0].type === "Literal") {
            const mode = args[0].value;
            if (typeof mode === "number" && (mode & 0o002) !== 0) {
              this.addIssue("warning", "Insecure File Permissions",
                `World-writable file permission detected: ${mode.toString(8)}`,
                node);
              this.stats.warningIssues++;
              this.stats.vulnerabilitiesFound++;
            }
          }
        }
      }
    });
  }

  /**
   * Check for cryptographic weaknesses
   */
  checkCryptographicWeakness(ir) {
    this.stats.totalChecks++;

    const weakAlgorithms = ["MD5", "SHA1", "DES"];

    this.visitNodes(ir, (node) => {
      if (node.type === "CallExpression") {
        const methodName = this.getMethodName(node);

        weakAlgorithms.forEach(algo => {
          if (methodName.includes(algo)) {
            this.addIssue("warning", "Weak Cryptography",
              `Weak cryptographic algorithm ${algo} detected. Use SHA256+ or bcrypt.`,
              node);
            this.stats.warningIssues++;
            this.stats.vulnerabilitiesFound++;
          }
        });
      }
    });
  }

  /**
   * Helper: Get method name from call expression
   */
  getMethodName(node) {
    if (!node || !node.callee) return "";
    
    if (node.callee.type === "Identifier") {
      return node.callee.name || "";
    }
    
    if (node.callee.type === "MemberExpression") {
      const object = node.callee.object && node.callee.object.name || "";
      const property = node.callee.property && node.callee.property.name || "";
      return `${object}.${property}`;
    }
    
    return "";
  }

  /**
   * Helper: Check if node is user-controlled
   */
  isUserControlled(node) {
    if (!node) return false;
    
    // Check for params[], request., cookies[], session[]
    if (node.type === "MemberExpression") {
      const objectName = node.object && node.object.name;
      return ["params", "request", "cookies", "session"].includes(objectName);
    }
    
    return false;
  }

  /**
   * Helper: Check if string contains SQL keywords
   */
  containsSQLKeywords(node) {
    if (!node) return false;
    
    const sqlKeywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "CREATE"];
    const nodeStr = JSON.stringify(node).toUpperCase();
    
    return sqlKeywords.some(keyword => nodeStr.includes(keyword));
  }

  /**
   * Helper: Check if node has string interpolation
   */
  hasStringInterpolation(node) {
    if (!node) return false;
    return node.type === "TemplateLiteral" || 
           (node.type === "Literal" && typeof node.value === "string" && node.value.includes("#{"));
  }

  /**
   * Helper: Check for ReDoS patterns
   */
  hasReDoSPattern(pattern) {
    // Simplified check for nested quantifiers
    return /(\(.*\*.*\)\+|\(.*\+.*\)\*|\(.*\+.*\)\+)/.test(pattern);
  }

  /**
   * Visit all nodes in tree
   */
  visitNodes(node, callback) {
    if (!node || typeof node !== "object") return;

    callback(node);

    if (Array.isArray(node)) {
      node.forEach(child => this.visitNodes(child, callback));
    } else {
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          this.visitNodes(node[key], callback);
        }
      }
    }
  }

  /**
   * Add security issue
   */
  addIssue(severity, category, message, node) {
    this.issues.push({
      severity,
      category,
      message,
      location: node.loc || "unknown",
      nodeType: node.type,
    });
  }

  /**
   * Calculate security score (0-100)
   */
  calculateSecurityScore() {
    const _totalIssues = this.stats.vulnerabilitiesFound;
    const criticalWeight = 20;
    const warningWeight = 5;

    const deduction = (this.stats.criticalIssues * criticalWeight) + 
                     (this.stats.warningIssues * warningWeight);

    this.stats.securityScore = Math.max(0, 100 - deduction);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      hardeningLevel: this.stats.securityScore >= 98 ? "Excellent" :
        this.stats.securityScore >= 90 ? "Good" :
          this.stats.securityScore >= 80 ? "Fair" : "Poor",
    };
  }
}

module.exports = { RubySecurityValidator };
