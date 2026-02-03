"use strict";

/**
 * Python Security Validator - Phase E Quality Gate
 * 
 * Analyzes Python code for security vulnerabilities and dangerous patterns.
 * Integrates with Phase E quality verification as a security gate.
 * 
 * Security Categories:
 * - CRITICAL: Code execution, eval/exec, dynamic imports
 * - HIGH: Dangerous built-ins, unsafe file operations
 * - MEDIUM: Insecure patterns, resource exhaustion
 * - LOW: Code style, best practices
 */

class PythonSecurityValidator {
  constructor(options = {}) {
    this.options = {
      severity: options.severity || "CRITICAL", // Minimum severity to report
      maxIssues: options.maxIssues || 100,
      strictMode: options.strictMode !== false,
      ...options,
    };
    
    this.issues = [];
    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize security patterns to detect
   */
  initializePatterns() {
    return {
      // CRITICAL: Code Execution
      eval: {
        pattern: /\beval\s*\(/g,
        severity: "CRITICAL",
        message: "eval() allows arbitrary code execution",
        description: "eval() is extremely dangerous and should never be used",
        remediation: "Use ast.literal_eval() or json.loads() for safe parsing",
        cwe: "CWE-95: Improper Neutralization of Directives",
      },
      exec: {
        pattern: /\bexec\s*\(/g,
        severity: "CRITICAL",
        message: "exec() allows arbitrary code execution",
        description: "exec() can execute arbitrary Python code",
        remediation: "Avoid dynamic code execution; use safer alternatives",
        cwe: "CWE-95",
      },
      compile: {
        pattern: /\bcompile\s*\(/g,
        severity: "CRITICAL",
        message: "compile() with user input is dangerous",
        description: "compile() can compile arbitrary code from user input",
        remediation: "Validate and sanitize all input before compilation",
        cwe: "CWE-95",
      },

      // CRITICAL: Dynamic Imports
      __import__: {
        pattern: /\b__import__\s*\(/g,
        severity: "CRITICAL",
        message: "__import__() allows dynamic module loading",
        description: "__import__() can load arbitrary modules",
        remediation: "Use importlib.import_module() with strict validation",
        cwe: "CWE-95",
      },
      importlib_import_module: {
        pattern: /importlib\s*\.\s*import_module\s*\(/g,
        severity: "CRITICAL",
        message: "importlib.import_module() with user input is dangerous",
        description: "Dynamic imports can load malicious modules",
        remediation: "Maintain whitelist of allowed modules",
        cwe: "CWE-95",
      },

      // HIGH: Dangerous Built-ins
      globals: {
        pattern: /\bglobals\s*\(\s*\)/g,
        severity: "HIGH",
        message: "globals() access can modify global state",
        description: "Accessing globals() allows modification of global variables",
        remediation: "Use proper scoping instead of globals()",
        cwe: "CWE-95",
      },
      locals: {
        pattern: /\blocals\s*\(\s*\)/g,
        severity: "HIGH",
        message: "locals() access can be unreliable",
        description: "locals() behavior is unpredictable in different contexts",
        remediation: "Use explicit variable passing instead of locals()",
        cwe: "CWE-95",
      },
      vars: {
        pattern: /\bvars\s*\(/g,
        severity: "HIGH",
        message: "vars() returns object dictionary",
        description: "vars() provides access to object internals",
        remediation: "Use getattr() for specific attributes",
        cwe: "CWE-95",
      },
      getattr_dynamic: {
        pattern: /getattr\s*\(\s*[^,]+\s*,\s*(?:input|request|environ|sys\.argv)/g,
        severity: "HIGH",
        message: "getattr() with user input can access arbitrary attributes",
        description: "Dynamic attribute access can expose internal properties",
        remediation: "Use whitelist of allowed attributes",
        cwe: "CWE-95",
      },
      setattr: {
        pattern: /\bsetattr\s*\(/g,
        severity: "HIGH",
        message: "setattr() can modify object state",
        description: "setattr() allows arbitrary attribute assignment",
        remediation: "Use defined properties or setters instead",
        cwe: "CWE-95",
      },
      delattr: {
        pattern: /\bdelattr\s*\(/g,
        severity: "HIGH",
        message: "delattr() can delete critical attributes",
        description: "delattr() removes object attributes",
        remediation: "Use explicit deletion methods if needed",
        cwe: "CWE-95",
      },

      // HIGH: Unsafe File Operations
      open_unsafe: {
        pattern: /open\s*\(\s*[a-zA-Z_]\w*/g,
        severity: "HIGH",
        message: "open() with user-provided filename is unsafe",
        description: "Path traversal attacks possible",
        remediation: "Validate and sanitize file paths; use pathlib.Path.resolve()",
        cwe: "CWE-22: Improper Limitation of a Pathname",
      },
      pickle_load: {
        pattern: /pickle\s*\.\s*load\s*\(/g,
        severity: "HIGH",
        message: "pickle.load() can execute arbitrary code",
        description: "Unpickling untrusted data is dangerous",
        remediation: "Use json or other safe serialization formats",
        cwe: "CWE-502: Deserialization of Untrusted Data",
      },
      subprocess_shell: {
        pattern: /subprocess\s*\.\s*(?:call|run|check_output|Popen)\s*\(\s*(?:command|cmd)\s*,\s*shell\s*=\s*True/g,
        severity: "HIGH",
        message: "subprocess with shell=True is dangerous",
        description: "Shell injection attacks possible",
        remediation: "Use shell=False and pass arguments as list",
        cwe: "CWE-78: Improper Neutralization of Special Elements used in an OS Command",
      },
      os_system: {
        pattern: /\bos\s*\.\s*system\s*\(/g,
        severity: "HIGH",
        message: "os.system() is vulnerable to shell injection",
        description: "os.system() passes commands to shell",
        remediation: "Use subprocess.run() with shell=False",
        cwe: "CWE-78",
      },

      // MEDIUM: SQL Injection
      sql_string_format: {
        pattern: /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)[^;]*%\s*\(/gi,
        severity: "MEDIUM",
        message: "SQL string formatting detected - SQL injection risk",
        description: "SQL queries constructed with string formatting",
        remediation: "Use parameterized queries with placeholders",
        cwe: "CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
      },
      sql_f_string: {
        pattern: /f\s*['"]\s*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN).*\{/g,
        severity: "MEDIUM",
        message: "SQL in f-string - SQL injection risk",
        description: "F-string interpolation into SQL queries",
        remediation: "Use database driver parameterized queries",
        cwe: "CWE-89",
      },

      // MEDIUM: Weak Cryptography
      md5: {
        pattern: /hashlib\s*\.\s*md5\s*\(/gi,
        severity: "MEDIUM",
        message: "MD5 is cryptographically broken",
        description: "MD5 should not be used for security",
        remediation: "Use SHA-256 or stronger: hashlib.sha256()",
        cwe: "CWE-327: Use of a Broken or Risky Cryptographic Algorithm",
      },
      sha1: {
        pattern: /hashlib\s*\.\s*sha1\s*\(/gi,
        severity: "MEDIUM",
        message: "SHA-1 is considered weak",
        description: "SHA-1 collision vulnerabilities exist",
        remediation: "Use SHA-256 or stronger hash",
        cwe: "CWE-327",
      },
      random_seed: {
        pattern: /random\s*\.\s*seed\s*\(\s*(?:time|datetime)/gi,
        severity: "MEDIUM",
        message: "Weak random seed from time",
        description: "Using time for seeding is predictable",
        remediation: "Use os.urandom() or secrets module",
        cwe: "CWE-338: Use of Cryptographically Weak PRNG",
      },

      // MEDIUM: Resource Exhaustion
      infinite_loop: {
        pattern: /while\s+True\s*:|while\s+1\s*:|for\s+\w+\s+in\s+iter\s*\(\s*int\s*,\s*1\s*\)/g,
        severity: "MEDIUM",
        message: "Potential infinite loop detected",
        description: "Infinite loops can cause DoS",
        remediation: "Use loop limits or timeouts",
        cwe: "CWE-835: Loop with Unreachable Exit Condition",
      },
      unbounded_recursion: {
        pattern: /def\s+\w+\s*\([^)]*\):[^}]*return\s+\w+\s*\([^)]*\)/g,
        severity: "MEDIUM",
        message: "Recursive function without visible base case",
        description: "Could cause stack overflow",
        remediation: "Ensure base cases are present and reachable",
        cwe: "CWE-674: Uncontrolled Recursion",
      },

      // LOW: Insecure Patterns
      hardcoded_secrets: {
        pattern: /(?:password|secret|api_key|token|key)\s*=\s*['"]/gi,
        severity: "LOW",
        message: "Hardcoded secret/password detected",
        description: "Secrets should not be in source code",
        remediation: "Use environment variables or secret management",
        cwe: "CWE-798: Use of Hard-Coded Credentials",
      },
      debug_mode: {
        pattern: /debug\s*=\s*True|DEBUG\s*=\s*True/gi,
        severity: "LOW",
        message: "Debug mode enabled",
        description: "Debug mode exposes sensitive information",
        remediation: "Disable debug in production",
        cwe: "CWE-215: Information Exposure Through Debug Information",
      },
      print_sensitive: {
        pattern: /print\s*\(\s*f\s*['"]/gi,
        severity: "LOW",
        message: "Potential sensitive data in print statement",
        description: "Secrets printed to stdout/logs",
        remediation: "Remove sensitive data from output",
        cwe: "CWE-532: Insertion of Sensitive Information into Log File",
      },
    };
  }

  /**
   * Validate Python code for security issues
   */
  validate(code) {
    this.issues = [];
    
    if (!code || typeof code !== "string") {
      return {
        valid: true,
        issues: [],
        severity: "NONE",
      };
    }

    // Check each pattern
    for (const [patternName, patternDef] of Object.entries(this.patterns)) {
      this.checkPattern(code, patternName, patternDef);
    }

    // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW)
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    this.issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Limit issues
    this.issues = this.issues.slice(0, this.options.maxIssues);

    return this.getReport();
  }

  /**
   * Check a single security pattern
   */
  checkPattern(code, patternName, patternDef) {
    // Reset global regex lastIndex to prevent infinite loops
    const regex = patternDef.pattern;
    regex.lastIndex = 0;
    
    let match;
    let maxMatches = 0; // Prevent infinite loop
    
    while ((match = regex.exec(code)) !== null && maxMatches < 100) {
      const line = code.substring(0, match.index).split("\n").length;
      const column = match.index - code.lastIndexOf("\n", match.index);
      
      this.issues.push({
        type: patternName,
        severity: patternDef.severity,
        message: patternDef.message,
        description: patternDef.description,
        remediation: patternDef.remediation,
        cwe: patternDef.cwe,
        location: {
          line,
          column,
          match: match[0].trim(),
        },
      });
      
      maxMatches++;
      
      // Prevent infinite loop on zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
    
    regex.lastIndex = 0; // Reset for next pattern
  }

  /**
   * Generate security report
   */
  getReport() {
    const criticalCount = this.issues.filter(i => i.severity === "CRITICAL").length;
    const highCount = this.issues.filter(i => i.severity === "HIGH").length;
    const mediumCount = this.issues.filter(i => i.severity === "MEDIUM").length;
    const lowCount = this.issues.filter(i => i.severity === "LOW").length;

    let overallSeverity = "PASS";
    if (criticalCount > 0) overallSeverity = "CRITICAL";
    else if (highCount > 0) overallSeverity = "HIGH";
    else if (mediumCount > 0) overallSeverity = "MEDIUM";
    else if (lowCount > 0) overallSeverity = "LOW";

    const isValid = overallSeverity === "PASS" || 
                    (this.options.strictMode === false && overallSeverity !== "CRITICAL");

    return {
      valid: isValid,
      severity: overallSeverity,
      issues: this.issues,
      counts: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        total: this.issues.length,
      },
      summary: {
        criticalIssues: criticalCount,
        highIssues: highCount,
        mediumIssues: mediumCount,
        lowIssues: lowCount,
        totalIssues: this.issues.length,
        status: isValid ? "PASS" : "FAIL",
      },
    };
  }

  /**
   * Get human-readable security report
   */
  formatReport(report) {
    let output = "\n=== PYTHON SECURITY VALIDATION REPORT ===\n\n";
    
    output += `Status: ${report.valid ? "✅ PASS" : "❌ FAIL"}\n`;
    output += `Overall Severity: ${report.severity}\n\n`;
    
    output += "Issue Counts:\n";
    output += `  CRITICAL: ${report.counts.critical}\n`;
    output += `  HIGH:     ${report.counts.high}\n`;
    output += `  MEDIUM:   ${report.counts.medium}\n`;
    output += `  LOW:      ${report.counts.low}\n`;
    output += `  TOTAL:    ${report.counts.total}\n\n`;

    if (report.issues.length > 0) {
      output += "Issues:\n";
      report.issues.forEach((issue, index) => {
        output += `\n${index + 1}. [${issue.severity}] ${issue.message}\n`;
        output += `   Type: ${issue.type}\n`;
        output += `   Line: ${issue.location.line}, Column: ${issue.location.column}\n`;
        output += `   Match: ${issue.location.match}\n`;
        output += `   Description: ${issue.description}\n`;
        output += `   Remediation: ${issue.remediation}\n`;
        output += `   CWE: ${issue.cwe}\n`;
      });
    } else {
      output += "No security issues detected!\n";
    }

    return output;
  }
}

module.exports = PythonSecurityValidator;
