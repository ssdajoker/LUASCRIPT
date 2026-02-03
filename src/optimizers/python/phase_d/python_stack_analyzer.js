"use strict";

/**
 * Stack Analysis for Python - Phase D Memory & Performance
 * Analyzes local variable lifetimes and stack frame allocation
 * 
 * Goals:
 * - Track variable lifetimes in stack frames
 * - Optimize stack frame allocation
 * - Verify O(1) stack operations
 * - Detect stack efficiency issues
 * - Compute escape analysis
 */

class StackFrame {
  constructor(functionName, depth = 0) {
    this.functionName = functionName;
    this.depth = depth;
    this.variables = new Map();  // varName -> VariableInfo
    this.startLine = null;
    this.endLine = null;
    this.children = [];          // Nested function calls
  }

  addVariable(name, info) {
    this.variables.set(name, info);
  }

  hasVariable(name) {
    return this.variables.has(name);
  }

  getVariable(name) {
    return this.variables.get(name);
  }

  getTotalVariableCount() {
    return this.variables.size;
  }

  getEstimatedStackBytes() {
    let total = 0;

    this.variables.forEach(varInfo => {
      total += varInfo.estimatedBytes;
    });

    return total;
  }

  getStats() {
    return {
      functionName: this.functionName,
      depth: this.depth,
      variableCount: this.variables.size,
      estimatedStackBytes: this.getEstimatedStackBytes(),
      variables: Array.from(this.variables.values()).map(v => v.getStats()),
    };
  }
}

class VariableInfo {
  constructor(name, type = null) {
    this.name = name;
    this.type = type;           // 'int', 'float', 'str', 'list', 'object', etc.
    this.firstUseLine = null;
    this.lastUseLine = null;
    this.lifetime = 0;          // Last use - first use (in terms of instruction count)
    this.references = 0;        // How many times used
    this.escapes = false;       // If passed to another function or returned
    this.isParameter = false;
    this.isGlobal = false;
    this.isNonlocal = false;
  }

  setLifespan(firstLine, lastLine) {
    this.firstUseLine = firstLine;
    this.lastUseLine = lastLine;
    this.lifetime = Math.max(0, lastLine - firstLine);
  }

  get estimatedBytes() {
    // Rough memory estimates for common types
    const sizes = {
      "int": 28,
      "float": 24,
      "bool": 28,
      "str": 49 + (0 * 1),  // Add average string size
      "bytes": 33,
      "list": 56,
      "dict": 240,
      "tuple": 40,
      "set": 224,
      "object": 60,
    };

    return sizes[this.type] || 60;
  }

  addReference() {
    this.references++;
  }

  getStats() {
    return {
      name: this.name,
      type: this.type,
      lifetime: this.lifetime,
      references: this.references,
      escapes: this.escapes,
      isParameter: this.isParameter,
      estimatedBytes: this.estimatedBytes,
    };
  }
}

class PythonStackAnalyzer {
  constructor(options = {}) {
    this.options = {
      enableLifetimeTracking: options.enableLifetimeTracking !== false,
      enableEscapeAnalysis: options.enableEscapeAnalysis !== false,
      enableStackProfiling: options.enableStackProfiling !== false,
      maxStackDepth: options.maxStackDepth || 1000,
    };

    this.frames = [];
    this.currentFrame = null;
    this.callStack = [];
    this.stats = {
      totalFunctions: 0,
      maxStackDepth: 0,
      totalVariables: 0,
      escapedVariables: 0,
      peakStackBytes: 0,
      currentStackBytes: 0,
    };
    this.issues = [];
  }

  /**
   * Analyze IR for stack patterns
   */
  analyze(ir) {
    this.frames = [];
    this.callStack = [];
    this.stats = {
      totalFunctions: 0,
      maxStackDepth: 0,
      totalVariables: 0,
      escapedVariables: 0,
      peakStackBytes: 0,
      currentStackBytes: 0,
    };
    this.issues = [];

    this.visitNode(ir);

    return {
      frames: this.frames,
      stats: this.getStats(),
      issues: this.issues,
      recommendations: this.getRecommendations(),
    };
  }

  visitNode(node, depth = 0) {
    if (!node || typeof node !== "object") return;

    // Function entry
    if (node.type === "FunctionDef") {
      this.enterFunction(node, depth);
    }

    // Track assignments and variable uses
    if (node.type === "Assign") {
      this.trackAssignment(node);
    }

    if (node.type === "Name") {
      this.trackVariableUse(node);
    }

    // Track function calls
    if (node.type === "Call") {
      this.trackCall(node);
    }

    // Track returns
    if (node.type === "Return") {
      this.trackReturn(node);
    }

    // Recursively visit children
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && key !== "type") {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.visitNode(child, depth));
        } else if (typeof node[key] === "object") {
          this.visitNode(node[key], depth);
        }
      }
    }

    // Function exit
    if (node.type === "FunctionDef") {
      this.exitFunction();
    }
  }

  enterFunction(node, depth) {
    const frame = new StackFrame(node.name, depth);
    frame.startLine = node.lineno || 0;
    frame.endLine = node.endLine || 0;

    // Add parameters to frame
    if (node.args?.args) {
      node.args.args.forEach(arg => {
        const varName = arg.arg || arg;
        const info = new VariableInfo(varName, null);
        info.isParameter = true;
        frame.addVariable(varName, info);
      });
    }

    this.frames.push(frame);
    this.callStack.push(frame);
    this.currentFrame = frame;

    this.stats.totalFunctions++;
    this.stats.maxStackDepth = Math.max(this.stats.maxStackDepth, this.callStack.length);

    // Check for excessive stack depth
    if (this.callStack.length > this.options.maxStackDepth * 0.8) {
      this.issues.push({
        type: "deep_call_stack",
        severity: "MEDIUM",
        message: `Function ${node.name} has deep call stack (depth: ${this.callStack.length})`,
        location: node.name,
      });
    }
  }

  exitFunction() {
    this.callStack.pop();
    this.currentFrame = this.callStack.length > 0 ? this.callStack[this.callStack.length - 1] : null;
  }

  trackAssignment(node) {
    if (!this.currentFrame) return;

    const targets = node.targets || [];
    targets.forEach(target => {
      if (target.type === "Name") {
        const varName = target.id;
        if (!this.currentFrame.hasVariable(varName)) {
          const info = new VariableInfo(varName, this.inferType(node.value));
          this.currentFrame.addVariable(varName, info);
          this.stats.totalVariables++;
        }

        const info = this.currentFrame.getVariable(varName);
        info.setLifespan(node.lineno || 0, node.endLine || 0);
      }
    });
  }

  trackVariableUse(node) {
    if (!this.currentFrame || node.ctx?.type !== "Load") return;

    const varName = node.id;
    if (this.currentFrame.hasVariable(varName)) {
      const info = this.currentFrame.getVariable(varName);
      info.addReference();
      info.lastUseLine = node.lineno || 0;
    }
  }

  trackCall(node) {
    if (!this.currentFrame) return;

    // Check if variables are passed as arguments (escape)
    const args = node.args || [];
    args.forEach(arg => {
      if (arg.type === "Name" && this.currentFrame.hasVariable(arg.id)) {
        const info = this.currentFrame.getVariable(arg.id);
        info.escapes = true;
        this.stats.escapedVariables++;
      }
    });

    // Check for self-calls (recursion)
    const callName = node.func?.id || node.func?.attr;
    if (callName === this.currentFrame.functionName) {
      this.issues.push({
        type: "recursion",
        severity: "LOW",
        message: `Function ${this.currentFrame.functionName} is recursive`,
        location: this.currentFrame.functionName,
      });
    }
  }

  trackReturn(node) {
    if (!this.currentFrame || !node.value) return;

    // Mark returned variables as escaped
    if (node.value.type === "Name" && this.currentFrame.hasVariable(node.value.id)) {
      const info = this.currentFrame.getVariable(node.value.id);
      info.escapes = true;
      this.stats.escapedVariables++;
    }
  }

  getStats() {
    const stackFrameStats = this.frames.map(f => f.getStats());

    // Calculate peak and average stack usage
    let peakStackBytes = 0;
    let averageStackBytes = 0;

    this.frames.forEach(frame => {
      const stackBytes = frame.getEstimatedStackBytes();
      peakStackBytes = Math.max(peakStackBytes, stackBytes);
      averageStackBytes += stackBytes;
    });

    averageStackBytes /= Math.max(1, this.frames.length);

    return {
      totalFunctions: this.stats.totalFunctions,
      maxStackDepth: this.stats.maxStackDepth,
      totalVariables: this.stats.totalVariables,
      escapedVariables: this.stats.escapedVariables,
      peakStackBytes,
      averageStackBytes: Math.round(averageStackBytes),
      frames: stackFrameStats,
      O1Verified: this.verifyO1Operations(),
    };
  }

  /**
   * Verify that stack operations are O(1)
   */
  verifyO1Operations() {
    const issues = [];

    this.frames.forEach(frame => {
      // Check for unbounded growth
      const varCount = frame.getTotalVariableCount();
      if (varCount > 1000) {
        issues.push({
          type: "unbounded_variable_growth",
          frame: frame.functionName,
          count: varCount,
        });
      }

      // Check for deep nesting
      if (frame.depth > 100) {
        issues.push({
          type: "deep_nesting",
          frame: frame.functionName,
          depth: frame.depth,
        });
      }

      // Check for large stack frames
      const stackBytes = frame.getEstimatedStackBytes();
      if (stackBytes > 100000) {  // 100KB
        issues.push({
          type: "large_stack_frame",
          frame: frame.functionName,
          bytes: stackBytes,
        });
      }
    });

    return {
      isO1: issues.length === 0,
      issues,
    };
  }

  getRecommendations() {
    const recommendations = [];
    const stats = this.getStats();

    if (stats.peakStackBytes > 10000000) {  // 10MB
      recommendations.push({
        severity: "CRITICAL",
        message: "Peak stack usage exceeds 10MB",
        action: "Reduce variable allocations or use generators",
      });
    }

    if (stats.maxStackDepth > 500) {
      recommendations.push({
        severity: "HIGH",
        message: "Maximum stack depth exceeds 500",
        action: "Refactor recursive functions to iterative",
      });
    }

    if (stats.escapedVariables / Math.max(1, stats.totalVariables) > 0.5) {
      recommendations.push({
        severity: "MEDIUM",
        message: "More than 50% of variables escape their scope",
        action: "Consider passing by reference or using closures",
      });
    }

    const o1Check = stats.O1Verified;
    if (!o1Check.isO1) {
      recommendations.push({
        severity: "MEDIUM",
        message: `${o1Check.issues.length} O(1) violations detected`,
        action: "Fix reported stack inefficiencies",
      });
    }

    return recommendations;
  }

  inferType(node) {
    if (!node || typeof node !== "object") return null;

    const typeMap = {
      "Num": "int",
      "Str": "str",
      "List": "list",
      "Dict": "dict",
      "Set": "set",
      "Tuple": "tuple",
      "Constant": this.inferConstantType(node),
      "Call": "object",  // Generic object for now
      "BinOp": "object",
      "Name": null,      // Unknown
    };

    return typeMap[node.type] || null;
  }

  inferConstantType(node) {
    if (typeof node.value === "number") return "int";
    if (typeof node.value === "string") return "str";
    if (typeof node.value === "boolean") return "bool";
    if (node.value === null) return "object";
    return null;
  }

  /**
   * Suggest stack optimizations
   */
  optimizationSuggestions() {
    const suggestions = [];

    this.frames.forEach(frame => {
      const varCount = frame.getTotalVariableCount();
      const stackBytes = frame.getEstimatedStackBytes();

      // Identify unused or short-lived variables
      frame.variables.forEach(varInfo => {
        if (varInfo.references === 1 && varInfo.lifetime < 10) {
          suggestions.push({
            type: "inline_variable",
            frame: frame.functionName,
            variable: varInfo.name,
            reason: "Short-lived with few uses",
          });
        }
      });

      // Identify dead stores
      frame.variables.forEach(varInfo => {
        if (varInfo.references === 0) {
          suggestions.push({
            type: "remove_variable",
            frame: frame.functionName,
            variable: varInfo.name,
            reason: "Unused variable",
          });
        }
      });

      // Suggest variable coalescing
      if (varCount > 50) {
        suggestions.push({
          type: "coalesce_variables",
          frame: frame.functionName,
          count: varCount,
          reason: "High variable count",
        });
      }
    });

    return suggestions;
  }
}

module.exports = { PythonStackAnalyzer, StackFrame, VariableInfo };
