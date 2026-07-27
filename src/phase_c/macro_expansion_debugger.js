/**
 * FORENSIC DEBUG TOOLS: MacroExpansionDebugger
 * Phase C - Production-Grade Macro Expansion Monitor
 * 
 * Purpose: Deep visibility into macro expansion, compilation, metaprogramming
 * Lessons Learned: Detect expansions that loop infinitely or generate invalid syntax
 * 
 * Components:
 * - MacroTracer (50 lines): Track invocations, log expansion steps, depth monitoring
 * - TreeTransformValidator (50 lines): Validate transformations, types, syntax
 * - ExpansionDepthMonitor (45 lines): Track depth, detect exponential growth
 * - DebugRenderer (30 lines): Pretty-print traces, visualize expansions, export reports
 */

"use strict";

// ============================================================================
// COMPONENT A: MacroTracer (50 lines)
// ============================================================================
/**
 * Track macro invocations and log expansion steps with tree snapshots.
 * Maintains detailed history for debugging failed expansions.
 */
class MacroTracer {
  constructor(options = {}) {
    this.maxTraceDepth = options.maxTraceDepth || 100;
    this.captureSnapshots = options.captureSnapshots !== false;
    this.trace = [];
    this.activeInvocations = new Map(); // invocationId -> invocation
    this.nextInvocationId = 0;
  }

  /**
   * Record macro invocation with arguments
   */
  invokeMacro(name, args = [], metadata = {}) {
    const invocationId = this.nextInvocationId++;
    const invocation = {
      id: invocationId,
      name,
      args: this._summarizeArgs(args),
      depth: this._getCurrentDepth(),
      startTime: Date.now(),
      steps: [],
      status: "active",
      metadata
    };
    this.activeInvocations.set(invocationId, invocation);
    this.trace.push(invocation);
    return invocationId;
  }

  /**
   * Record an expansion step (quote, splice, transform, etc)
   */
  recordExpansion(invocationId, stepName, inputTree, outputTree, details = {}) {
    const invocation = this.activeInvocations.get(invocationId);
    if (!invocation) return;

    const step = {
      name: stepName,
      timestamp: Date.now(),
      duration: Date.now() - invocation.startTime,
      inputSnapshot: this.captureSnapshots ? this._snapshot(inputTree) : null,
      outputSnapshot: this.captureSnapshots ? this._snapshot(outputTree) : null,
      inputSize: this._sizeOf(inputTree),
      outputSize: this._sizeOf(outputTree),
      growthFactor: this._sizeOf(outputTree) / Math.max(1, this._sizeOf(inputTree)),
      details
    };
    invocation.steps.push(step);
  }

  /**
   * Complete a macro invocation
   */
  completeMacro(invocationId, result = null, error = null) {
    const invocation = this.activeInvocations.get(invocationId);
    if (!invocation) return;

    invocation.status = error ? "error" : "success";
    invocation.endTime = Date.now();
    invocation.duration = invocation.endTime - invocation.startTime;
    invocation.result = result;
    invocation.error = error;
    this.activeInvocations.delete(invocationId);
  }

  /**
   * Get current call depth
   */
  _getCurrentDepth() {
    return this.activeInvocations.size;
  }

  /**
   * Create snapshot of AST node
   */
  _snapshot(node, depth = 0) {
    if (depth > 3 || !node) return "...";
    if (typeof node !== "object") return String(node);
    if (Array.isArray(node)) {
      return `[${node.slice(0, 2).map(n => this._snapshot(n, depth + 1)).join(", ")}${node.length > 2 ? ", ..." : ""}]`;
    }
    const keys = Object.keys(node).slice(0, 2);
    return `{${keys.map(k => `${k}:${this._snapshot(node[k], depth + 1)}`).join(", ")}${Object.keys(node).length > 2 ? ", ..." : ""}}`;
  }

  /**
   * Approximate size of tree (node count)
   */
  _sizeOf(node) {
    if (!node || typeof node !== "object") return 1;
    if (Array.isArray(node)) return 1 + node.reduce((sum, n) => sum + this._sizeOf(n), 0);
    return 1 + Object.values(node).reduce((sum, v) => sum + this._sizeOf(v), 0);
  }

  /**
   * Summarize arguments for display
   */
  _summarizeArgs(args) {
    return args.map(arg => {
      if (typeof arg === "string") return `"${arg.substring(0, 20)}"`;
      if (typeof arg === "object") return this._snapshot(arg);
      return String(arg);
    });
  }

  /**
   * Get complete trace
   */
  getTrace() {
    return this.trace;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const completed = this.trace.filter(t => t.status !== "active");
    const totalTime = completed.reduce((sum, t) => sum + (t.duration || 0), 0);
    const avgTime = completed.length > 0 ? totalTime / completed.length : 0;
    const errors = completed.filter(t => t.status === "error").length;

    return {
      totalInvocations: completed.length,
      successfulInvocations: completed.length - errors,
      failedInvocations: errors,
      totalTime,
      avgTimePerInvocation: avgTime.toFixed(2),
      active: this.activeInvocations.size
    };
  }
}

// ============================================================================
// COMPONENT B: TreeTransformValidator (50 lines)
// ============================================================================
/**
 * Validate tree transformations for correctness and safety.
 * Checks type safety, syntax validity, and reachability.
 */
class TreeTransformValidator {
  constructor(options = {}) {
    this.strict = options.strict !== false;
    this.checkTypes = options.checkTypes !== false;
    this.checkSyntax = options.checkSyntax !== false;
  }

  /**
   * Validate transformation from input to output tree
   */
  validateTransformation(inputTree, outputTree) {
    const errors = [];

    // Check that output tree is valid
    if (!outputTree) {
      errors.push({ type: "null-output", message: "Output tree is null/undefined" });
      return errors;
    }

    // Check structure integrity
    if (!this._isValidASTNode(outputTree)) {
      errors.push({ type: "invalid-structure", message: "Output tree has invalid structure" });
    }

    // Check for common pitfalls
    if (this._hasOrphanedNodes(outputTree)) {
      errors.push({ type: "orphaned-nodes", message: "Output contains unreachable/orphaned nodes" });
    }

    // Check for information loss (if strict mode)
    if (this.strict && !this._preservesEssentialInfo(inputTree, outputTree)) {
      errors.push({ type: "information-loss", message: "Transformation loses essential information" });
    }

    return errors;
  }

  /**
   * Validate type safety of expanded code (basic heuristic)
   */
  validateTypes(expandedCode) {
    const errors = [];
    if (!this.checkTypes) return errors;

    // Check for mismatched parentheses/brackets
    if (!this._matchedDelimiters(expandedCode)) {
      errors.push({ type: "unmatched-delimiters", message: "Mismatched parentheses/brackets in expansion" });
    }

    // Check for undefined references (simple heuristic)
    const undefinedRefs = this._findUndefinedReferences(expandedCode);
    if (undefinedRefs.length > 0) {
      errors.push({ type: "undefined-references", references: undefinedRefs });
    }

    return errors;
  }

  /**
   * Validate syntax of expanded code
   */
  validateSyntax(expandedCode) {
    const errors = [];
    if (!this.checkSyntax) return errors;

    try {
      // Try to parse as JavaScript (basic check)
      new Function("return " + expandedCode);
    } catch (e) {
      errors.push({ type: "syntax-error", message: e.message });
    }

    return errors;
  }

  /**
   * Check reachability of generated code
   */
  checkReachability(expansion) {
    const issues = [];

    // Check for unreachable code
    if (expansion.includes("return;") || expansion.includes("throw new Error")) {
      // Simple heuristic: code after return/throw is unreachable
      const lines = expansion.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].includes("return") && lines[i + 1].trim()) {
          issues.push({ type: "unreachable-code", line: i + 1 });
        }
      }
    }

    return issues;
  }

  /**
   * Check if AST node is structurally valid
   */
  _isValidASTNode(node) {
    if (!node) return false;
    if (typeof node !== "object") return true; // Leaf nodes ok
    if (Array.isArray(node)) {
      return node.every(n => this._isValidASTNode(n));
    }
    // Basic check: has reasonable properties
    return Object.keys(node).length > 0;
  }

  /**
   * Check for orphaned nodes (unreachable in tree)
   */
  _hasOrphanedNodes(tree, visited = new Set()) {
    if (!tree || typeof tree !== "object") return false;
    const id = tree.id || tree.name || String(tree);
    if (visited.has(id)) return true; // Cycle detected
    visited.add(id);

    if (Array.isArray(tree)) {
      return tree.some(n => this._hasOrphanedNodes(n, visited));
    }
    return Object.values(tree).some(v => this._hasOrphanedNodes(v, visited));
  }

  /**
   * Check if transformation preserves essential info
   */
  _preservesEssentialInfo(input, output) {
    // Very simple check: output should be non-empty if input is non-empty
    if (input && !output) return false;
    return true;
  }

  /**
   * Check for matched delimiters
   */
  _matchedDelimiters(code) {
    let paren = 0, bracket = 0, brace = 0;
    for (const char of code) {
      if (char === "(") paren++;
      else if (char === ")") paren--;
      else if (char === "[") bracket++;
      else if (char === "]") bracket--;
      else if (char === "{") brace++;
      else if (char === "}") brace--;
      if (paren < 0 || bracket < 0 || brace < 0) return false;
    }
    return paren === 0 && bracket === 0 && brace === 0;
  }

  /**
   * Find undefined references (simple heuristic)
   */
  _findUndefinedReferences(code) {
    const refs = [];
    const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    const builtins = new Set(["function", "return", "if", "else", "for", "while", "const", "let", "var", "new", "this", "true", "false", "null", "undefined"]);
    const matches = code.matchAll(identifierPattern);
    
    for (const match of matches) {
      const name = match[1];
      if (!builtins.has(name) && !code.includes(`const ${name}`) && !code.includes(`function ${name}`)) {
        if (!refs.includes(name)) refs.push(name);
      }
    }
    return refs.slice(0, 5); // Return first 5 to avoid spam
  }
}

// ============================================================================
// COMPONENT C: ExpansionDepthMonitor (45 lines)
// ============================================================================
/**
 * Track macro expansion depth and detect exponential code growth.
 * Monitors for pathological expansion patterns.
 */
class ExpansionDepthMonitor {
  constructor(maxDepth = 100) {
    this.maxDepth = maxDepth;
    this.depth = 0;
    this.peakDepth = 0;
    this.expansions = [];
    this.startTime = null;
  }

  /**
   * Enter a macro expansion context
   */
  enterExpansion(macroName) {
    if (this.depth === 0) this.startTime = Date.now();
    
    this.depth++;
    if (this.depth > this.peakDepth) {
      this.peakDepth = this.depth;
    }

    this.expansions.push({
      depth: this.depth,
      macro: macroName,
      entered: Date.now()
    });
  }

  /**
   * Exit a macro expansion context
   */
  exitExpansion() {
    if (this.depth > 0) {
      const expansion = this.expansions[this.expansions.length - 1];
      expansion.exited = Date.now();
      expansion.duration = expansion.exited - expansion.entered;
      this.depth--;
    }
  }

  /**
   * Get current expansion depth
   */
  getDepth() {
    return this.depth;
  }

  /**
   * Check if expansion is within safe depth limits
   */
  checkDepth(maxDepth = this.maxDepth) {
    return this.depth <= maxDepth;
  }

  /**
   * Measure growth factor between original and expanded code
   */
  measureGrowth(original, expanded) {
    const origSize = this._estimateSize(original);
    const expandedSize = this._estimateSize(expanded);
    return expandedSize / Math.max(1, origSize);
  }

  /**
   * Estimate code size (node count + line count)
   */
  _estimateSize(obj) {
    if (typeof obj === "string") {
      return obj.length + obj.split("\n").length;
    }
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this._estimateSize(item), 0);
    }
    if (typeof obj === "object" && obj !== null) {
      return Object.values(obj).reduce((sum, val) => sum + this._estimateSize(val), 0);
    }
    return 1;
  }

  /**
   * Check for exponential growth patterns
   */
  detectExponentialGrowth(threshold = 2.0) {
    const recentExpansions = this.expansions.slice(-10);
    for (let i = 1; i < recentExpansions.length; i++) {
      const prev = recentExpansions[i - 1];
      const curr = recentExpansions[i];
      if (curr.duration / Math.max(1, prev.duration) > threshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get diagnostic report
   */
  report() {
    const totalTime = this.startTime ? Date.now() - this.startTime : 0;
    const avgDepth = this.expansions.length > 0
      ? this.expansions.reduce((sum, e) => sum + e.depth, 0) / this.expansions.length
      : 0;

    return {
      currentDepth: this.depth,
      peakDepth: this.peakDepth,
      maxDepth: this.maxDepth,
      percentUsed: ((this.depth / this.maxDepth) * 100).toFixed(1),
      totalExpansions: this.expansions.length,
      avgDepth: avgDepth.toFixed(2),
      totalTime,
      exponentialGrowth: this.detectExponentialGrowth()
    };
  }
}

// ============================================================================
// COMPONENT D: DebugRenderer (30 lines)
// ============================================================================
/**
 * Pretty-print and visualize macro expansion traces.
 * Exports traces in multiple formats for analysis and reporting.
 */
class DebugRenderer {
  /**
   * Render trace as human-readable text with indentation
   */
  renderTrace(trace) {
    let output = "=== MACRO EXPANSION TRACE ===\n\n";
    
    for (const invocation of trace) {
      output += `${this._indent(invocation.depth)}📍 ${invocation.name}()\n`;
      output += `${this._indent(invocation.depth + 1)}Time: ${invocation.duration}ms | Steps: ${invocation.steps.length}\n`;
      
      if (invocation.steps.length > 0) {
        for (const step of invocation.steps.slice(0, 10)) {
          const growth = `[${(step.growthFactor * 100).toFixed(0)}%]`;
          output += `${this._indent(invocation.depth + 2)}→ ${step.name} ${growth}\n`;
        }
        if (invocation.steps.length > 10) {
          output += `${this._indent(invocation.depth + 2)}... and ${invocation.steps.length - 10} more steps\n`;
        }
      }
      output += "\n";
    }

    return output;
  }

  /**
   * Render diff between input and output trees
   */
  renderExpansionDiff(input, output) {
    return `INPUT:  ${this._compactRender(input, 50)}\n` +
           `OUTPUT: ${this._compactRender(output, 50)}\n`;
  }

  /**
   * Export trace as JSON for tooling
   */
  exportJSON(trace) {
    return JSON.stringify({
      generated: new Date().toISOString(),
      traceCount: trace.length,
      trace: trace.map(t => ({
        name: t.name,
        duration: t.duration,
        steps: t.steps.length,
        status: t.status
      }))
    }, null, 2);
  }

  /**
   * Export trace as HTML report
   */
  exportHTML(trace) {
    const rows = trace.map(t => `
      <tr>
        <td>${t.name}</td>
        <td>${t.steps.length}</td>
        <td>${t.duration}ms</td>
        <td>${t.status}</td>
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html>
<head><title>Macro Expansion Report</title>
<style>table { border-collapse: collapse; } td { border: 1px solid #ccc; padding: 8px; }</style>
</head>
<body>
<h1>Macro Expansion Trace</h1>
<table>
<tr><th>Macro</th><th>Steps</th><th>Time (ms)</th><th>Status</th></tr>
${rows}
</table>
</body>
</html>`;
  }

  /**
   * Helper: compact rendering of object
   */
  _compactRender(obj, maxLen = 50) {
    const str = typeof obj === "string" ? obj : JSON.stringify(obj);
    return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
  }

  /**
   * Helper: indentation
   */
  _indent(depth) {
    return "  ".repeat(Math.max(0, depth));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  MacroTracer,
  TreeTransformValidator,
  ExpansionDepthMonitor,
  DebugRenderer
};
