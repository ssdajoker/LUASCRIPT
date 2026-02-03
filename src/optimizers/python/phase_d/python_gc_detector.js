"use strict";

/**
 * GC Pattern Detection for Python - Phase D
 * Analyzes Python code to identify garbage collection triggers and patterns
 * 
 * Goals:
 * - Detect reference cycles
 * - Identify GC-triggering operations
 * - Track object lifetimes
 * - Recommend escape analysis integration points
 * - Estimate GC pressure
 */

class GCPattern {
  constructor(type, location = {}) {
    this.type = type;           // 'cycle', 'container_mutation', 'exception', 'closure', 'generator'
    this.location = location;   // { file, line, column, function }
    this.severity = this.calculateSeverity(type);
    this.count = 1;
    this.instances = [];
  }

  calculateSeverity(type) {
    const severities = {
      "cycle": "HIGH",
      "container_mutation": "MEDIUM",
      "exception": "MEDIUM",
      "closure": "LOW",
      "generator": "LOW",
      "circular_import": "HIGH",
      "large_allocation": "MEDIUM",
      "unbounded_growth": "HIGH",
    };
    return severities[type] || "UNKNOWN";
  }

  addInstance(instance) {
    this.instances.push(instance);
    this.count++;
  }

  getStats() {
    return {
      type: this.type,
      severity: this.severity,
      count: this.count,
      locations: this.instances.map(i => i.location),
    };
  }
}

class ReferenceGraph {
  constructor() {
    this.nodes = new Map();      // variable -> set of variables it references
    this.inverseGraph = new Map(); // variable -> set of variables that reference it
  }

  addReference(source, target) {
    if (!this.nodes.has(source)) {
      this.nodes.set(source, new Set());
    }
    this.nodes.get(source).add(target);

    if (!this.inverseGraph.has(target)) {
      this.inverseGraph.set(target, new Set());
    }
    this.inverseGraph.get(target).add(source);
  }

  findCycles() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (node, path) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = this.nodes.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  hasPath(source, target) {
    if (!this.nodes.has(source)) return false;

    const visited = new Set();
    const queue = [source];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === target) return true;

      if (!visited.has(current)) {
        visited.add(current);
        const neighbors = this.nodes.get(current) || new Set();
        queue.push(...neighbors);
      }
    }

    return false;
  }

  getMutualReferences() {
    const mutual = [];
    
    for (const [source, targets] of this.nodes.entries()) {
      for (const target of targets) {
        if (this.nodes.get(target)?.has(source)) {
          mutual.push([source, target]);
        }
      }
    }

    return mutual;
  }
}

class PythonGCDetector {
  constructor(options = {}) {
    this.options = {
      enableCycleDetection: options.enableCycleDetection !== false,
      enableContainerTracking: options.enableContainerTracking !== false,
      enableClosureAnalysis: options.enableClosureAnalysis !== false,
      enableEscapeAnalysis: options.enableEscapeAnalysis !== false,
    };

    this.patterns = [];
    this.referenceGraph = new ReferenceGraph();
    this.stats = {
      totalPatterns: 0,
      patterns: {},
    };
  }

  /**
   * Analyze IR for GC patterns
   */
  analyze(ir) {
    this.patterns = [];
    this.referenceGraph = new ReferenceGraph();

    this.visitNode(ir);
    this.postProcessPatterns();

    return {
      patterns: this.patterns,
      cycles: this.findCycles(),
      stats: this.getStats(),
      recommendations: this.getRecommendations(),
    };
  }

  visitNode(node, context = {}) {
    if (!node || typeof node !== "object") return;

    // Detect cycles
    if (this.options.enableCycleDetection) {
      this.detectCycles(node, context);
    }

    // Track container mutations
    if (this.options.enableContainerTracking) {
      this.trackContainerMutations(node, context);
    }

    // Analyze closures
    if (this.options.enableClosureAnalysis) {
      this.analyzeClosures(node, context);
    }

    // Analyze escaping references
    if (this.options.enableEscapeAnalysis) {
      this.analyzeEscape(node, context);
    }

    // Recursively visit children
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && key !== "type") {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.visitNode(child, context));
        } else if (typeof node[key] === "object") {
          this.visitNode(node[key], context);
        }
      }
    }
  }

  detectCycles(node, context) {
    // Detect reference cycles: a = b; b = a
    if (node.type === "Assign") {
      const targets = node.targets || [];
      const value = node.value;

      targets.forEach(target => {
        if (target.type === "Name") {
          // Check if value references target
          if (this.containsReference(value, target.id)) {
            this.addPattern(new GCPattern("cycle", {
              ...context,
              kind: "direct_cycle",
              variable: target.id,
            }));
          }
        }
      });
    }

    // Detect container cycles: list.append(list), dict[key] = dict
    if (node.type === "Expr" && node.value?.type === "Call") {
      const call = node.value;
      if (call.func?.attr === "append" || call.func?.attr === "extend") {
        const container = call.func?.value?.id;
        const arg = call.args?.[0]?.id;
        if (container && arg && this.isSameOrAlias(container, arg)) {
          this.addPattern(new GCPattern("cycle", {
            ...context,
            kind: "container_self_reference",
            container,
          }));
        }
      }
    }

    // Detect circular imports
    if (node.type === "Import" || node.type === "ImportFrom") {
      this.addPattern(new GCPattern("circular_import", {
        ...context,
        module: node.module,
      }));
    }
  }

  trackContainerMutations(node, context) {
    // Track list/dict/set mutations that trigger GC
    if (node.type === "Call") {
      const funcName = node.func?.attr;
      
      if (["append", "extend", "insert", "remove", "pop", "clear"].includes(funcName)) {
        this.addPattern(new GCPattern("container_mutation", {
          ...context,
          method: funcName,
          container: node.func?.value?.id,
        }));
      }
    }

    // Track large allocations
    if (node.type === "Call" && (node.func?.id === "list" || node.func?.id === "dict")) {
      const sizeArg = node.args?.[0];
      if (sizeArg?.type === "Num" && sizeArg.value > 10000) {
        this.addPattern(new GCPattern("large_allocation", {
          ...context,
          size: sizeArg.value,
        }));
      }
    }
  }

  analyzeClosures(node, context) {
    // Detect closures that capture references
    if (node.type === "FunctionDef" || node.type === "Lambda") {
      const freeVars = this.extractFreeVariables(node);
      
      if (freeVars.length > 0) {
        this.addPattern(new GCPattern("closure", {
          ...context,
          function: node.name || "lambda",
          freeVars,
        }));
      }
    }

    // Detect generators
    if (node.type === "FunctionDef") {
      if (this.containsYield(node)) {
        this.addPattern(new GCPattern("generator", {
          ...context,
          function: node.name,
        }));
      }
    }
  }

  analyzeEscape(node, context) {
    // Analyze if object references escape local scope
    if (node.type === "Return") {
      const returnValue = node.value;
      if (returnValue?.type === "Name") {
        this.addPattern(new GCPattern("escape", {
          ...context,
          variable: returnValue.id,
          escapeType: "return",
        }));
      }
    }

    // Track unbounded growth (e.g., while True: list.append())
    if (node.type === "While" && node.test?.type === "Constant" && node.test.value === true) {
      if (this.containsContainerGrowth(node.body)) {
        this.addPattern(new GCPattern("unbounded_growth", {
          ...context,
          loop: "infinite_while",
        }));
      }
    }

    // Track global variable mutations
    if (node.type === "Global") {
      this.addPattern(new GCPattern("escape", {
        ...context,
        variables: node.names,
        escapeType: "global_mutation",
      }));
    }
  }

  postProcessPatterns() {
    // Aggregate and deduplicate patterns
    const patternMap = new Map();

    this.patterns.forEach(pattern => {
      const key = `${pattern.type}-${JSON.stringify(pattern.location)}`;
      if (patternMap.has(key)) {
        patternMap.get(key).addInstance(pattern);
      } else {
        patternMap.set(key, pattern);
      }
    });

    this.patterns = Array.from(patternMap.values());
    
    // Update stats
    this.stats.totalPatterns = this.patterns.length;
    this.stats.patterns = {};
    this.patterns.forEach(p => {
      this.stats.patterns[p.type] = (this.stats.patterns[p.type] || 0) + 1;
    });
  }

  findCycles() {
    const cycles = this.referenceGraph.findCycles();
    return cycles.map(cycle => ({
      variables: cycle,
      length: cycle.length,
    }));
  }

  getStats() {
    const bySeverity = {
      "HIGH": 0,
      "MEDIUM": 0,
      "LOW": 0,
    };

    this.patterns.forEach(p => {
      bySeverity[p.severity]++;
    });

    return {
      total: this.patterns.length,
      bySeverity,
      patterns: this.stats.patterns,
    };
  }

  getRecommendations() {
    const recommendations = [];
    const stats = this.getStats();

    if (stats.bySeverity["HIGH"] > 5) {
      recommendations.push({
        severity: "CRITICAL",
        message: "High number of GC-triggering patterns detected",
        action: "Consider redesigning object allocation strategy",
      });
    }

    if (stats.patterns["cycle"] && stats.patterns["cycle"] > 3) {
      recommendations.push({
        severity: "HIGH",
        message: "Multiple reference cycles detected",
        action: "Use weakref module to break cycles",
      });
    }

    if (stats.patterns["unbounded_growth"]) {
      recommendations.push({
        severity: "HIGH",
        message: "Unbounded growth patterns detected",
        action: "Implement cleanup or use generators instead",
      });
    }

    if (stats.patterns["large_allocation"] && stats.patterns["large_allocation"] > 1) {
      recommendations.push({
        severity: "MEDIUM",
        message: "Multiple large allocations detected",
        action: "Use object pooling or streaming",
      });
    }

    if (stats.patterns["closure"] && stats.patterns["closure"] > 10) {
      recommendations.push({
        severity: "MEDIUM",
        message: "Many closures detected",
        action: "Consider using classes instead of closures",
      });
    }

    return recommendations;
  }

  // Helper methods
  containsReference(node, varName, visited = new Set()) {
    if (!node || typeof node !== "object" || visited.has(node)) return false;
    visited.add(node);

    if (node.type === "Name" && node.id === varName) return true;

    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && key !== "type") {
        if (Array.isArray(node[key])) {
          if (node[key].some(child => this.containsReference(child, varName, visited))) {
            return true;
          }
        } else if (typeof node[key] === "object") {
          if (this.containsReference(node[key], varName, visited)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isSameOrAlias(var1, var2) {
    // Simple check - in a full implementation, would use alias analysis
    return var1 === var2;
  }

  extractFreeVariables(node) {
    // Extract variables used but not defined in this scope
    const defined = new Set();
    const used = new Set();

    this.collectDefinitions(node, defined);
    this.collectReferences(node, used);

    return Array.from(used).filter(v => !defined.has(v));
  }

  collectDefinitions(node, set) {
    if (!node || typeof node !== "object") return;

    if (node.type === "Assign") {
      node.targets?.forEach(t => {
        if (t.type === "Name") set.add(t.id);
      });
    }

    if (node.type === "FunctionDef" || node.type === "Lambda") {
      node.args?.args?.forEach(arg => set.add(arg.arg || arg));
    }

    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && key !== "type") {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.collectDefinitions(child, set));
        } else if (typeof node[key] === "object") {
          this.collectDefinitions(node[key], set);
        }
      }
    }
  }

  collectReferences(node, set) {
    if (!node || typeof node !== "object") return;

    if (node.type === "Name" && node.id) {
      set.add(node.id);
    }

    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && key !== "type") {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.collectReferences(child, set));
        } else if (typeof node[key] === "object") {
          this.collectReferences(node[key], set);
        }
      }
    }
  }

  containsYield(node) {
    if (!node || typeof node !== "object") return false;

    if (node.type === "Yield" || node.type === "YieldFrom") return true;

    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && key !== "type") {
        if (Array.isArray(node[key])) {
          if (node[key].some(child => this.containsYield(child))) return true;
        } else if (typeof node[key] === "object") {
          if (this.containsYield(node[key])) return true;
        }
      }
    }

    return false;
  }

  containsContainerGrowth(nodes) {
    if (!Array.isArray(nodes)) return false;

    return nodes.some(node => {
      if (!node || typeof node !== "object") return false;

      if (node.type === "Expr" && node.value?.type === "Call") {
        const call = node.value;
        if (["append", "extend", "add"].includes(call.func?.attr)) {
          return true;
        }
      }

      return this.containsContainerGrowth([node]);
    });
  }

  addPattern(pattern) {
    this.patterns.push(pattern);
  }
}

module.exports = { PythonGCDetector, GCPattern, ReferenceGraph };
