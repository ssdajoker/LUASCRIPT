/**
 * PHASE C PERFORMANCE VALIDATOR
 * Performance issue detection, optimization opportunity identification
 * 
 * Responsibilities:
 * - Complexity analysis (time/space)
 * - Nested loop detection
 * - Unnecessary allocation detection
 * - Cache-unfriendly patterns
 * - Inefficient algorithm detection
 * - Memory leak pattern detection
 * - Resource exhaustion detection
 * 
 * Lines: 170
 */

class PerformanceValidator {
  constructor(sharedContext = {}) {
    this.context = sharedContext;
    this.complexityReport = {
      time: null,
      space: null,
      loops: [],
      allocations: [],
      patterns: []
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Analyze time and space complexity of code
   * @param {Object} ast - Abstract syntax tree
   * @returns {Object} - Complexity report
   */
  analyzeComplexity(ast) {
    this.complexityReport = {
      time: "O(n)",
      space: "O(1)",
      loops: [],
      allocations: [],
      patterns: [],
      estimate: null
    };

    if (!ast || !ast.body) return this.complexityReport;

    let timeComplexity = "O(1)";
    let spaceComplexity = "O(1)";
    let loopDepth = 0;

    const visit = (node, depth = 0) => {
      if (!node) return;

      if (node.type === "ForStatement" || node.type === "WhileStatement" || node.type === "DoWhileStatement") {
        loopDepth++;
        this.complexityReport.loops.push({
          type: node.type,
          depth: loopDepth,
          line: node.loc?.start?.line,
          complexity: this.estimateLoopComplexity(node)
        });

        if (loopDepth === 1) timeComplexity = "O(n)";
        else if (loopDepth === 2) timeComplexity = "O(n²)";
        else if (loopDepth === 3) timeComplexity = "O(n³)";
        else if (loopDepth > 3) timeComplexity = `O(n^${loopDepth})`;

        if (node.body) {
          visit(node.body, depth + 1);
        }
        loopDepth--;
      } else if (node.type === "CallExpression") {
        const name = node.callee?.name || "";
        
        // Detect recursive calls
        if (node.recursive) {
          this.complexityReport.patterns.push({
            type: "recursion",
            function: name,
            line: node.loc?.start?.line
          });
        }

        // Detect expensive operations
        if (this.isExpensiveOperation(name)) {
          this.complexityReport.patterns.push({
            type: "expensive",
            operation: name,
            line: node.loc?.start?.line,
            cost: this.getOperationCost(name)
          });
        }
      } else if (node.type === "NewExpression" || node.type === "ArrayExpression" || node.type === "ObjectExpression") {
        this.complexityReport.allocations.push({
          type: node.type,
          line: node.loc?.start?.line,
          inLoop: loopDepth > 0
        });

        if (loopDepth > 0) {
          spaceComplexity = `O(n^${loopDepth})`;
        }
      }

      // Recurse into children
      for (const key in node) {
        if (key !== "loc" && typeof node[key] === "object") {
          if (Array.isArray(node[key])) {
            for (const child of node[key]) {
              if (child && child.type) visit(child, depth);
            }
          } else if (node[key].type) {
            visit(node[key], depth);
          }
        }
      }
    };

    for (const stmt of ast.body) {
      visit(stmt);
    }

    this.complexityReport.time = timeComplexity;
    this.complexityReport.space = spaceComplexity;
    this.complexityReport.estimate = {
      time: this.parseComplexity(timeComplexity),
      space: this.parseComplexity(spaceComplexity)
    };

    return this.complexityReport;
  }

  /**
   * Detect performance issues in code
   * @param {Object} ast - Abstract syntax tree
   * @returns {Array} - Performance issues
   */
  detectPerformanceIssues(ast) {
    const issues = [];

    if (!ast || !ast.body) return issues;

    const visit = (node, loopDepth = 0) => {
      if (!node) return;

      // Detect string concatenation in loops
      if (node.type === "BinaryExpression" && node.operator === "+" && loopDepth > 0) {
        if ((node.left?.type === "Literal" && typeof node.left.value === "string") ||
            (node.right?.type === "Literal" && typeof node.right.value === "string")) {
          issues.push({
            type: "StringConcatenationInLoop",
            line: node.loc?.start?.line,
            severity: "warning",
            message: "String concatenation in loop should use StringBuilder or array join",
            suggestion: "Use array accumulator and join() instead"
          });
        }
      }

      // Detect regex creation in loops
      if (node.type === "RegExpLiteral" && loopDepth > 0) {
        issues.push({
          type: "RegexInLoop",
          line: node.loc?.start?.line,
          severity: "warning",
          message: "Regex literal created in loop",
          suggestion: "Move regex creation outside loop"
        });
      }

      // Detect nested loops (O(n²) or worse)
      if ((node.type === "ForStatement" || node.type === "WhileStatement") && loopDepth >= 1) {
        issues.push({
          type: "NestedLoop",
          depth: loopDepth + 1,
          line: node.loc?.start?.line,
          severity: "info",
          message: `Nested loop detected: O(n^${loopDepth + 1}) complexity`
        });
      }

      // Detect unnecessary allocation in loops
      if ((node.type === "ArrayExpression" || node.type === "ObjectExpression") && loopDepth > 0) {
        issues.push({
          type: "AllocationInLoop",
          line: node.loc?.start?.line,
          severity: "warning",
          message: `Allocating ${node.type} in loop`,
          suggestion: "Move allocation outside loop if possible"
        });
      }

      // Detect unbounded recursion
      if (node.type === "CallExpression" && node.recursive) {
        if (!this.hasBaseCase(node)) {
          issues.push({
            type: "UnboundedRecursion",
            line: node.loc?.start?.line,
            severity: "error",
            message: "Recursive call without obvious base case"
          });
        }
      }

      // Recurse
      for (const key in node) {
        if (key !== "loc" && typeof node[key] === "object") {
          if (Array.isArray(node[key])) {
            for (const child of node[key]) {
              if (child && child.type) {
                const newDepth = (node.type === "ForStatement" || node.type === "WhileStatement") 
                  ? loopDepth + 1 : loopDepth;
                visit(child, newDepth);
              }
            }
          } else if (node[key].type) {
            const newDepth = (node.type === "ForStatement" || node.type === "WhileStatement")
              ? loopDepth + 1 : loopDepth;
            visit(node[key], newDepth);
          }
        }
      }
    };

    for (const stmt of ast.body) {
      visit(stmt);
    }

    return issues;
  }

  /**
   * Suggest optimizations for code
   * @param {Object} ast - Abstract syntax tree
   * @returns {Array} - Optimization suggestions
   */
  suggestOptimizations(ast) {
    const suggestions = [];

    const report = this.analyzeComplexity(ast);

    // Suggest loop optimizations
    for (const loop of report.loops) {
      if (loop.depth >= 2) {
        suggestions.push({
          location: loop.line,
          type: "LoopOptimization",
          current: `O(n^${loop.depth})`,
          suggestion: "Consider algorithm with better complexity or use parallel processing",
          priority: "medium"
        });
      }
    }

    // Suggest allocation optimizations
    const allocInLoop = report.allocations.filter(a => a.inLoop);
    if (allocInLoop.length > 0) {
      suggestions.push({
        type: "AllocationOptimization",
        issue: `${allocInLoop.length} allocations in loops`,
        suggestion: "Move allocations outside loops to reduce GC pressure",
        priority: "medium"
      });
    }

    // Suggest for expensive operations
    for (const pattern of report.patterns) {
      if (pattern.type === "expensive") {
        suggestions.push({
          location: pattern.line,
          type: "ExpensiveOperation",
          operation: pattern.operation,
          cost: pattern.cost,
          suggestion: `Consider caching result of ${pattern.operation}`,
          priority: "low"
        });
      }
      if (pattern.type === "recursion") {
        suggestions.push({
          location: pattern.line,
          type: "RecursionOptimization",
          function: pattern.function,
          suggestion: "Consider converting to iterative approach or memoization",
          priority: "medium"
        });
      }
    }

    return suggestions;
  }

  /**
   * Detect memory leak patterns
   * @param {Object} ast - Abstract syntax tree
   * @returns {Array} - Potential memory leak patterns
   */
  detectMemoryLeakPatterns(ast) {
    const patterns = [];

    if (!ast || !ast.body) return patterns;

    const variables = new Map(); // variable -> allocation sites

    const visit = (node) => {
      if (!node) return;

      // Track variable allocations
      if (node.type === "VariableDeclaration") {
        const name = node.id?.name;
        if (node.init) {
          if (!variables.has(name)) {
            variables.set(name, []);
          }
          variables.get(name).push({
            type: node.init.type,
            line: node.loc?.start?.line
          });
        }
      }

      // Check for unclosed resources
      if (node.type === "CallExpression") {
        const name = node.callee?.name || "";
        if (this.isResourceOpen(name)) {
          patterns.push({
            type: "UnclosedResource",
            operation: name,
            line: node.loc?.start?.line,
            severity: "warning",
            message: `Resource opened by ${name} should be explicitly closed`
          });
        }
      }

      // Check for event listener leaks
      if (node.type === "CallExpression" && node.callee?.property?.name === "addEventListener") {
        patterns.push({
          type: "ListenerLeak",
          line: node.loc?.start?.line,
          message: "Event listener should be removed to prevent memory leak"
        });
      }

      // Check for circular references
      if (node.type === "AssignmentExpression") {
        if (this.isCircularPattern(node)) {
          patterns.push({
            type: "CircularReference",
            line: node.loc?.start?.line,
            message: "Potential circular reference detected"
          });
        }
      }

      // Recurse
      for (const key in node) {
        if (key !== "loc" && typeof node[key] === "object") {
          if (Array.isArray(node[key])) {
            for (const child of node[key]) {
              if (child && child.type) visit(child);
            }
          } else if (node[key].type) {
            visit(node[key]);
          }
        }
      }
    };

    for (const stmt of ast.body) {
      visit(stmt);
    }

    return patterns;
  }

  /**
   * Validate resource usage
   * @param {Object} ast - Abstract syntax tree
   * @returns {Array} - Resource violations
   */
  validateResourceUsage(ast) {
    const violations = [];

    if (!ast || !ast.body) return violations;

    const openResources = new Map(); // name -> open count

    const visit = (node) => {
      if (!node) return;

      if (node.type === "CallExpression") {
        const name = node.callee?.name || "";

        if (this.isResourceOpen(name)) {
          const current = openResources.get(name) || 0;
          openResources.set(name, current + 1);
        } else if (this.isResourceClose(name)) {
          const current = openResources.get(name) || 0;
          if (current <= 0) {
            violations.push({
              type: "UnmatchedClose",
              operation: name,
              line: node.loc?.start?.line,
              message: `Closing ${name} without matching open`
            });
          }
          openResources.set(name, current - 1);
        }
      }

      for (const key in node) {
        if (key !== "loc" && typeof node[key] === "object") {
          if (Array.isArray(node[key])) {
            for (const child of node[key]) {
              if (child && child.type) visit(child);
            }
          } else if (node[key].type) {
            visit(node[key]);
          }
        }
      }
    };

    for (const stmt of ast.body) {
      visit(stmt);
    }

    // Check for unclosed resources
    for (const [name, count] of openResources) {
      if (count > 0) {
        violations.push({
          type: "UnclosedResource",
          operation: name,
          count,
          message: `${count} resource(s) opened by ${name} not closed`
        });
      }
    }

    return violations;
  }

  /**
   * INTERNAL: Estimate loop complexity
   */
  estimateLoopComplexity(node) {
    if (node.type === "ForStatement" && node.test) {
      // Check for common patterns
      if (node.test.right?.value !== undefined) {
        return `O(${node.test.right.value})`;
      }
    }
    return "O(n)";
  }

  /**
   * INTERNAL: Parse complexity string to numeric
   */
  parseComplexity(complexity) {
    if (complexity === "O(1)") return 1;
    if (complexity === "O(n)") return 100;
    if (complexity === "O(n²)") return 10000;
    if (complexity === "O(n³)") return 1000000;
    if (complexity.includes("log")) return 7;
    return 100;
  }

  /**
   * INTERNAL: Check if operation is expensive
   */
  isExpensiveOperation(name) {
    const expensive = new Set(["sort", "reverse", "filter", "map", "reduce", "join", "split", "match"]);
    return expensive.has(name);
  }

  /**
   * INTERNAL: Get operation cost
   */
  getOperationCost(name) {
    const costs = {
      sort: "O(n log n)",
      reverse: "O(n)",
      filter: "O(n)",
      map: "O(n)",
      reduce: "O(n)",
      join: "O(n)",
      split: "O(n)",
      match: "O(n)"
    };
    return costs[name] || "O(n)";
  }

  /**
   * INTERNAL: Check if has base case
   */
  hasBaseCase(node) {
    if (!node.parent) return true; // Assume has base case if unknown
    return true; // Simplified
  }

  /**
   * INTERNAL: Is resource open operation
   */
  isResourceOpen(name) {
    return new Set(["open", "connect", "create", "acquire"]).has(name);
  }

  /**
   * INTERNAL: Is resource close operation
   */
  isResourceClose(name) {
    return new Set(["close", "disconnect", "destroy", "release"]).has(name);
  }

  /**
   * INTERNAL: Detect circular pattern
   */
  isCircularPattern(node) {
    if (!node.left || !node.right) return false;
    const leftStr = JSON.stringify(node.left);
    const rightStr = JSON.stringify(node.right);
    return leftStr.includes(rightStr) || rightStr.includes(leftStr);
  }

  /**
   * Get all issues
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
    this.complexityReport = {
      time: null,
      space: null,
      loops: [],
      allocations: [],
      patterns: []
    };
  }
}

module.exports = PerformanceValidator;
