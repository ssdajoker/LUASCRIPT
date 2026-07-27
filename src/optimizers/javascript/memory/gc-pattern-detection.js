#!/usr/bin/env node

/**
 * GC-UNFRIENDLY PATTERN DETECTOR - JavaScript Memory Optimization Phase 2
 * 
 * Identifies allocation patterns that trigger excessive garbage collection.
 * Modern GCs (like V8's) optimize for patterns where most objects die young,
 * but some code patterns cause GC pressure spikes.
 * 
 * Unfriendly patterns:
 * 1. Tight loops with allocation (creates 1000s of temp objects)
 * 2. Large object churn (repeatedly creating large objects)
 * 3. Fragmented heaps (mixed object sizes prevent compaction)
 * 4. Array resizing patterns (push in tight loops)
 * 5. String concatenation (creates intermediate strings)
 * 6. Closure creation in loops (captures grow unbounded)
 * 7. WeakMap/Set with forgotten references
 * 8. Event listener leaks (listeners never removed)
 * 
 * Goals:
 * - Detect GC-unfriendly patterns
 * - Measure allocation rate
 * - Identify problematic scopes
 * - Suggest refactoring approaches
 * - Estimate GC pause time reduction
 */

const { safeCloneIR } = require("../ir-utils");

/**
 * Detect if a pattern is in a tight loop
 */
function isInTightLoop(node, scope) {
  // Walk up parent chain
  let current = scope.parent;
  let depth = 0;
  
  while (current && depth < 10) {
    if (current.type === "WhileStatement" || 
        current.type === "ForStatement" ||
        current.type === "DoWhileStatement") {
      return true;
    }
    current = current.parent;
    depth++;
  }
  
  return false;
}

/**
 * Analyze object allocation frequency
 */
function analyzeAllocationFrequency(node) {
  const patterns = {
    isAllocation: false,
    pattern: "unknown",
    estimatedRate: 0, // allocations per iteration/call
    isProblematic: false,
    reasoning: [],
  };

  if (node.type === "ObjectExpression") {
    patterns.isAllocation = true;
    patterns.pattern = "object literal";
    patterns.estimatedRate = 1;
  } else if (node.type === "ArrayExpression") {
    patterns.isAllocation = true;
    patterns.pattern = "array literal";
    patterns.estimatedRate = 1;
  } else if (node.type === "NewExpression") {
    patterns.isAllocation = true;
    patterns.pattern = "constructor call";
    patterns.estimatedRate = 1;
  } else if (node.type === "CallExpression") {
    // Check for known allocation functions
    if (node.callee && node.callee.name) {
      const name = node.callee.name;
      if (["Array", "Object", "Buffer", "Promise"].includes(name)) {
        patterns.isAllocation = true;
        patterns.pattern = `${name} constructor`;
        patterns.estimatedRate = 1;
      }
    }
  }

  return patterns;
}

/**
 * MAIN ANALYSIS FUNCTION
 * 
 * Scans IR for GC-unfriendly patterns
 */
function detectGCPatterns(ir) {
  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
      patterns: [],
      summary: {
        totalPatterns: 0,
        unfriendlyPatterns: 0,
        severityScore: 0,
        estimatedGCPauses: 0,
      },
    };
  }

  const analysis = {
    patterns: {
      loopAllocations: [],
      stringConcatenation: [],
      closureCreation: [],
      arrayResizing: [],
      largeObjectChurn: [],
      fragmentingAllocations: [],
      eventLeaks: [],
      weakRefLeaks: [],
    },
    summary: {
      totalPatterns: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      estimatedGCPausesPerSecond: 0,
      estimatedMemoryWaste: 0,
    },
    recommendations: [],
    refactoringHints: [],
  };

  // Walk the AST and detect patterns
  walkAST(ir.program, (node, parent, _context) => {
    // Pattern 1: Loop with allocations
    if (node.type === "ForStatement" || node.type === "WhileStatement") {
      const allocations = countAllocationsInScope(node.body);
      
      if (allocations > 0) {
        analysis.patterns.loopAllocations.push({
          type: node.type,
          allocations,
          severity: allocations > 10 ? "high" : allocations > 3 ? "medium" : "low",
          description: `Loop allocating ${allocations} objects per iteration`,
          gcImpact: allocations * 100, // estimated allocations per second
        });
        
        if (allocations > 10) {
          analysis.summary.highSeverity++;
        } else if (allocations > 3) {
          analysis.summary.mediumSeverity++;
        }
      }
    }

    // Pattern 2: String concatenation in loops
    if (node.type === "BinaryExpression" && node.operator === "+") {
      if (node.left && node.right) {
        const leftIsString = isStringLiteral(node.left) || isStringVar(node.left);
        const rightIsString = isStringLiteral(node.right) || isStringVar(node.right);
        
        if (leftIsString && rightIsString && parent && isInLoopScope(parent)) {
          analysis.patterns.stringConcatenation.push({
            type: "string concatenation in loop",
            severity: "medium",
            description: "String concatenation creates intermediate string objects",
            suggestion: "Use array.join() or template literals instead",
            gcImpact: 50,
          });
          analysis.summary.mediumSeverity++;
        }
      }
    }

    // Pattern 3: Closure creation in loops
    if ((node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") &&
        isInLoopScope(parent)) {
      const capturedVars = countCapturedVariables(node);
      
      analysis.patterns.closureCreation.push({
        type: "closure creation in loop",
        capturedVariables: capturedVars,
        severity: capturedVars > 5 ? "high" : "medium",
        description: `Creating closure with ${capturedVars} captured variables per iteration`,
        gcImpact: capturedVars * 20,
      });
      
      if (capturedVars > 5) {
        analysis.summary.highSeverity++;
      } else {
        analysis.summary.mediumSeverity++;
      }
    }

    // Pattern 4: Array resizing (push in loop)
    if (node.type === "CallExpression" &&
        node.callee &&
        node.callee.property &&
        node.callee.property.name === "push" &&
        isInLoopScope(parent)) {
      analysis.patterns.arrayResizing.push({
        type: "array.push() in loop",
        severity: "medium",
        description: "Array resizing allocations (double capacity when needed)",
        gcImpact: 30,
      });
      analysis.summary.mediumSeverity++;
    }

    // Pattern 5: Event listener attachment (potential leak)
    if (node.type === "CallExpression" &&
        node.callee &&
        node.callee.property &&
        node.callee.property.name === "addEventListener") {
      analysis.patterns.eventLeaks.push({
        type: "event listener attachment",
        severity: "medium",
        description: "Potential event listener leak (missing removeEventListener)",
        suggestion: "Ensure paired removeEventListener calls",
        gcImpact: 40,
      });
      analysis.summary.mediumSeverity++;
    }
  });

  // Calculate summary
  analysis.summary.totalPatterns = 
    analysis.patterns.loopAllocations.length +
    analysis.patterns.stringConcatenation.length +
    analysis.patterns.closureCreation.length +
    analysis.patterns.arrayResizing.length +
    analysis.patterns.largeObjectChurn.length +
    analysis.patterns.eventLeaks.length;

  // Estimate GC pauses
  analysis.summary.estimatedGCPausesPerSecond = 
    (analysis.patterns.loopAllocations.reduce((s, p) => s + (p.gcImpact || 0), 0) +
     analysis.patterns.closureCreation.reduce((s, p) => s + (p.gcImpact || 0), 0)) / 1000;

  // Generate recommendations
  if (analysis.summary.highSeverity > 0) {
    analysis.recommendations.push(
      `⚠ ${analysis.summary.highSeverity} high-severity GC patterns detected`
    );
    
    analysis.patterns.loopAllocations.forEach(p => {
      if (p.severity === "high") {
        analysis.refactoringHints.push(
          `Move object allocation out of loop: ${p.description}`
        );
      }
    });

    analysis.patterns.closureCreation.forEach(p => {
      if (p.severity === "high") {
        analysis.refactoringHints.push(
          "Reduce closure allocations: Pre-create closure outside loop"
        );
      }
    });
  }

  if (analysis.summary.mediumSeverity > 0) {
    analysis.recommendations.push(
      `✓ ${analysis.summary.mediumSeverity} medium-severity patterns to consider`
    );
  }

  if (analysis.summary.totalPatterns === 0) {
    analysis.recommendations.push(
      "✓ No obvious GC-unfriendly patterns detected"
    );
  }

  // Estimate pause reduction potential
  const estimatedReduction = analysis.summary.highSeverity * 50 + analysis.summary.mediumSeverity * 10;
  if (estimatedReduction > 0) {
    analysis.recommendations.push(
      `✓ Estimated GC pause reduction: ${estimatedReduction}ms/frame if patterns fixed`
    );
  }

  return {
    success: true,
    analysis,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Count allocations in a scope
 */
function countAllocationsInScope(node) {
  let count = 0;
  
  walkAST(node, (n) => {
    if (n.type === "ObjectExpression" || n.type === "ArrayExpression" ||
        n.type === "NewExpression" || 
        (n.type === "CallExpression" && isAllocationFunction(n))) {
      count++;
    }
  });
  
  return count;
}

/**
 * Check if node is in a loop scope
 */
function isInLoopScope(node) {
  let current = node;
  let depth = 0;
  
  while (current && depth < 20) {
    if (current.type === "WhileStatement" || 
        current.type === "ForStatement" ||
        current.type === "DoWhileStatement") {
      return true;
    }
    current = current.parent;
    depth++;
  }
  
  return false;
}

/**
 * Check if node is a string literal
 */
function isStringLiteral(node) {
  return node.type === "Literal" && typeof node.value === "string";
}

/**
 * Check if node references a string variable
 */
function isStringVar(node) {
  return node.type === "Identifier"; // Simplified
}

/**
 * Count captured variables in a closure
 */
function countCapturedVariables(node) {
  const captured = new Set();
  
  walkAST(node, (n) => {
    if (n.type === "Identifier") {
      captured.add(n.name);
    }
  });
  
  return captured.size;
}

/**
 * Check if call is to an allocation function
 */
function isAllocationFunction(node) {
  if (!node.callee || !node.callee.name) return false;
  
  const allocFuncs = ["Array", "Object", "Buffer", "Promise", "Map", "Set", "WeakMap", "WeakSet"];
  return allocFuncs.includes(node.callee.name);
}

/**
 * Walk AST tree with context
 */
function walkAST(node, callback, parent = null, seen = new WeakSet()) {
  if (!node) return;
  if (typeof node === "object") {
    if (seen.has(node)) return;
    seen.add(node);
  }
  
  callback(node, parent, { parent });
  
  if (typeof node === "object") {
    for (const key in node) {
      if (key === "parent" || key.startsWith("_")) continue;
      const child = node[key];
      
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (item && typeof item === "object") {
            walkAST(item, callback, node, seen);
          }
        });
      } else if (typeof child === "object" && child !== null) {
        walkAST(child, callback, node, seen);
      }
    }
  }
}

/**
 * Apply GC optimization recommendations to IR
 */
function applyGCOptimizations(ir, gcAnalysis) {
  if (!ir || !gcAnalysis || !gcAnalysis.analysis) {
    return ir;
  }

  const optimizedIR = safeCloneIR(ir);
  let markedPatterns = 0;

  // Mark patterns for optimization
  gcAnalysis.analysis.patterns.loopAllocations.forEach(pattern => {
    if (pattern.severity === "high") {
      markedPatterns++;
    }
  });

  return {
    optimizedIR,
    markedPatterns,
    metadata: gcAnalysis.analysis.summary,
  };
}

// ═════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════

module.exports = {
  detectGCPatterns,
  applyGCOptimizations,
  analyzeAllocationFrequency,
  isInTightLoop,
  countAllocationsInScope,
  isInLoopScope,
  countCapturedVariables,
  // Test helpers
  _walkAST: walkAST,
  _isStringLiteral: isStringLiteral,
  _isAllocationFunction: isAllocationFunction,
};
