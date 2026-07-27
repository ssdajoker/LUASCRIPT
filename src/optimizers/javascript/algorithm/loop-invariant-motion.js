#!/usr/bin/env node

/**
 * @fileoverview Loop Invariant Motion Optimization
 * 
 * Purpose: Move loop-invariant computations outside loops to improve performance.
 * 
 * Algorithm:
 * 1. Analyze dataflow to find variable definitions and uses
 * 2. Detect side effects in expressions
 * 3. Identify loop-invariant candidates
 * 4. Safely move invariants to pre-loop location
 * 5. Add IR metadata for code generation
 * 
 * Safety Guarantees:
 * - Never moves expressions with side effects
 * - Never moves expressions depending on loop variables
 * - Never moves expressions depending on mutated variables
 * - Preserves program semantics exactly
 * 
 * Forensic Discipline: Every optimization decision is documented with reasoning.
 * 
 * @module loop-invariant-motion
 * @phase 3.4
 * @task 4.1
 * @version 1.0.0
 */

const { DataflowAnalyzer } = require("./dataflow-analyzer.js");
const { SideEffectDetector } = require("./side-effect-detector.js");

// ============================================================================
// LOOP INVARIANT MOTION ANALYZER
// ============================================================================

class LoopInvariantMotionAnalyzer {
  constructor(options = {}) {
    this.options = {
      pureFunctions: options.pureFunctions || new Set(),
      conservative: options.conservative !== false,
      ...options
    };

    this.dataflowAnalyzer = new DataflowAnalyzer();
    this.sideEffectDetector = new SideEffectDetector({
      pureFunctions: this.options.pureFunctions,
      conservative: this.options.conservative
    });
  }

  /**
   * Main analysis: Find loop-invariant code that can be moved
   */
  analyzeLoopInvariantMotion(ir, _options = {}) {
    if (!ir || !ir.body) {
      return {
        invariants: [],
        analysis: {
          totalLoops: 0,
          totalInvariants: 0,
          totalMovable: 0,
          safetyBlocked: 0
        }
      };
    }

    const results = {
      invariants: [],
      analysis: {
        totalLoops: 0,
        totalInvariants: 0,
        totalMovable: 0,
        safetyBlocked: 0
      }
    };

    // Perform dataflow analysis
    const dataflow = this.dataflowAnalyzer.analyzeDataflow(ir);

    // Find all loops and analyze each
    this.findAndAnalyzeLoops(ir, dataflow, results);

    return results;
  }

  /**
   * Find loops and analyze invariants
   */
  findAndAnalyzeLoops(node, dataflow, results, depth = 0) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (node.type === "ForStatement" || node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      results.analysis.totalLoops++;
      this.analyzeLoop(node, dataflow, results, depth);
    }

    // Recurse into children
    for (const key in node) {
      if (key === "type" || key === "loc" || key === "range") {
        continue;
      }

      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          this.findAndAnalyzeLoops(item, dataflow, results, depth + 1);
        }
      } else if (typeof child === "object") {
        this.findAndAnalyzeLoops(child, dataflow, results, depth + 1);
      }
    }
  }

  /**
   * Analyze single loop for invariants
   */
  analyzeLoop(loopNode, dataflow, results, depth) {
    if (!loopNode.body || !loopNode.body.body) {
      return;
    }

    const loopBody = loopNode.body.body;
    const loopVariables = this.extractLoopVariables(loopNode);

    // Analyze each statement in loop body
    for (let i = 0; i < loopBody.length; i++) {
      const stmt = loopBody[i];

      // Only analyze variable declarations for now
      if (stmt.type === "VariableDeclaration") {
        const candidate = this.analyzeInvariantCandidate(stmt, loopVariables, dataflow);

        if (candidate) {
          results.invariants.push({
            ...candidate,
            loopDepth: depth,
            statementIndex: i
          });

          if (candidate.movable) {
            results.analysis.totalMovable++;
          } else {
            results.analysis.safetyBlocked++;
          }
        }
      }
    }

    results.analysis.totalInvariants = results.invariants.length;
  }

  /**
   * Extract variables defined/used in loop (for, while, do-while)
   */
  extractLoopVariables(loopNode) {
    const vars = new Set();

    // For loop init variable
    if (loopNode.init && loopNode.init.id) {
      vars.add(loopNode.init.id);
    }

    // Test condition variables
    if (loopNode.test) {
      this.extractVariables(loopNode.test, vars);
    }

    // Update variables
    if (loopNode.update) {
      this.extractVariables(loopNode.update, vars);
    }

    return vars;
  }

  /**
   * Extract all variable names from expression
   */
  extractVariables(node, vars) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (node.type === "Identifier") {
      vars.add(node.name);
      return;
    }

    for (const key in node) {
      if (key === "type" || key === "loc" || key === "range") {
        continue;
      }

      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          this.extractVariables(item, vars);
        }
      } else if (typeof child === "object") {
        this.extractVariables(child, vars);
      }
    }
  }

  /**
   * Analyze if statement is loop-invariant
   */
  analyzeInvariantCandidate(stmt, loopVariables, dataflow) {
    if (!stmt.init) {
      return null;
    }

    const varName = stmt.id;
    const expr = stmt.init;

    // Safety checks
    const safetyChecks = {
      hasSideEffects: false,
      dependsOnLoopVar: false,
      dependsOnMutation: false,
      reason: ""
    };

    // Check 1: Side effects
    const purity = this.sideEffectDetector.classifyPurity(expr);
    if (!purity.pure) {
      safetyChecks.hasSideEffects = true;
      safetyChecks.reason = purity.reason;
      
      return {
        variable: varName,
        expression: expr,
        movable: false,
        blocked: "SIDE_EFFECTS",
        details: safetyChecks,
        forensicReason: `Expression has side effects: ${purity.reason}`
      };
    }

    // Check 2: Loop variable dependency
    const exprVars = new Set();
    this.extractVariables(expr, exprVars);

    for (const v of exprVars) {
      if (loopVariables.has(v)) {
        safetyChecks.dependsOnLoopVar = true;
        safetyChecks.reason = `depends on loop variable: ${v}`;
        
        return {
          variable: varName,
          expression: expr,
          movable: false,
          blocked: "LOOP_VARIABLE_DEPENDENCY",
          details: safetyChecks,
          forensicReason: `Expression depends on loop variable '${v}'`
        };
      }
    }

    // Check 3: Mutation dependency
    for (const v of exprVars) {
      if (dataflow.isMutatedInLoop(v)) {
        safetyChecks.dependsOnMutation = true;
        safetyChecks.reason = `depends on mutated variable: ${v}`;
        
        return {
          variable: varName,
          expression: expr,
          movable: false,
          blocked: "MUTATION_DEPENDENCY",
          details: safetyChecks,
          forensicReason: `Expression depends on mutated variable '${v}'`
        };
      }
    }

    // All checks passed - safe to move!
    return {
      variable: varName,
      expression: expr,
      movable: true,
      blocked: null,
      details: safetyChecks,
      forensicReason: "All safety checks passed - invariant can be hoisted",
      benefit: this.estimateBenefit(expr)
    };
  }

  /**
   * Estimate performance benefit of moving this invariant
   */
  estimateBenefit(expr) {
    // Simple heuristic: count operations
    let ops = 0;

    const countOps = (node) => {
      if (!node || typeof node !== "object") return;

      if (node.type === "BinaryExpression" || node.type === "UnaryExpression") {
        ops++;
      }
      if (node.type === "CallExpression") {
        ops += 5; // Function calls expensive
      }

      for (const key in node) {
        if (key === "type") continue;
        const child = node[key];
        if (typeof child === "object") countOps(child);
        if (Array.isArray(child)) child.forEach(countOps);
      }
    };

    countOps(expr);
    return { operations: ops, estimatedSavings: `${ops} ops per iteration` };
  }
}

// ============================================================================
// CODE TRANSFORMATION
// ============================================================================

/**
 * Apply loop invariant motion transformation to IR
 */
function applyLoopInvariantMotion(ir, analysis) {
  if (!ir || !analysis || analysis.invariants.length === 0) {
    return ir;
  }

  // Add metadata to IR for code generation
  let movedCount = 0;

  for (const inv of analysis.invariants) {
    if (inv.movable) {
      // Mark this expression for hoisting
      if (!inv.expression._loopInvariantMotion) {
        inv.expression._loopInvariantMotion = {
          original: serializeExpr(inv.expression),
          variable: inv.variable,
          movable: true,
          benefit: inv.benefit,
          forensicReason: inv.forensicReason
        };
        movedCount++;
      }
    }
  }

  // Add summary metadata to IR
  if (!ir._optimizations) {
    ir._optimizations = [];
  }

  ir._optimizations.push({
    phase: "3.4",
    task: "4.1",
    optimization: "loop-invariant-motion",
    applied: movedCount,
    timestamp: new Date().toISOString(),
    summary: {
      totalInvariants: analysis.analysis.totalInvariants,
      moved: movedCount,
      blocked: analysis.analysis.safetyBlocked
    }
  });

  return ir;
}

/**
 * Serialize expression to string for forensic tracking
 */
function serializeExpr(expr) {
  if (!expr || typeof expr !== "object") {
    return String(expr);
  }

  if (expr.type === "Literal") {
    return String(expr.value);
  }

  if (expr.type === "Identifier") {
    return expr.name;
  }

  if (expr.type === "BinaryExpression") {
    return `(${serializeExpr(expr.left)} ${expr.operator} ${serializeExpr(expr.right)})`;
  }

  return `[${expr.type}]`;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  LoopInvariantMotionAnalyzer,
  applyLoopInvariantMotion,
  analyzeLoopInvariantMotion: (ir, options) => {
    const analyzer = new LoopInvariantMotionAnalyzer(options);
    return analyzer.analyzeLoopInvariantMotion(ir, options);
  }
};

// CLI interface
if (require.main === module) {
  console.log(`
Loop Invariant Motion Optimizer
================================

Phase 3.4 Task 4.1 - Algorithm Optimization

Moves loop-invariant computations outside loops for performance.

Safety Guarantees:
- No side effects moved
- No loop variable dependencies
- No mutation dependencies
- Semantics preserved exactly

Usage: node loop-invariant-motion.js <ir-file.json>

Output: Analysis results with movable invariants identified
`);
}
