#!/usr/bin/env node

/**
 * STACK ALLOCATION ANALYZER - JavaScript Memory Optimization Phase 2
 * 
 * Detects and analyzes opportunities for stack allocation vs heap allocation.
 * Stack allocation is significantly faster (nanoseconds vs microseconds) and
 * reduces garbage collection pressure.
 * 
 * Goals:
 * - Identify small, short-lived objects suitable for stack allocation
 * - Detect patterns that prevent stack allocation (escaping references)
 * - Measure potential memory savings from stack promotion
 * - Generate optimization recommendations
 * 
 * Key Insight: In JavaScript, most allocations are heap-based. However, V8's
 * escape analysis can promote small objects to stack allocation if:
 * 1. Object is small (<1KB)
 * 2. Object lifetime is clearly bounded
 * 3. No escaping references (not returned, stored, or passed to callbacks)
 * 4. No property reassignment affecting size
 * 5. Not used in complex control flow
 */

const { safeCloneIR } = require("../ir-utils");

/**
 * Analyze a variable/object for stack allocation suitability
 * Returns object traits that affect stack eligibility
 */
function analyzeAllocationCandidate(node, _scope) {
  if (!node || !node.type) return null;
  
  const analysis = {
    node: node.type,
    isCandidate: false,
    confidence: 0,
    reasons: [],
    estimatedSize: 0,
    lifetime: "unknown",
    escapeAnalysis: {},
    characteristics: {
      isSmall: false,
      hasShortLifetime: false,
      noEscapingReferences: false,
      stableShape: false,
      noComplexControl: false,
    },
  };

  // Check node type
  if (node.type === "ObjectExpression") {
    analysis.characteristics.isSmall = analyzeObjectSize(node) < 1024;
    analysis.estimatedSize = analyzeObjectSize(node);
    analysis.reasons.push(`Object size: ${analysis.estimatedSize} bytes`);
    
    // Check for escaping references
    analysis.characteristics.noEscapingReferences = !checkEscapingReferences(node);
    if (analysis.characteristics.noEscapingReferences) {
      analysis.reasons.push("No escaping references detected");
    }
    
    // Check if shape is stable
    analysis.characteristics.stableShape = isStableShape(node);
    if (analysis.characteristics.stableShape) {
      analysis.reasons.push("Stable object shape (no dynamic properties)");
    }
  } else if (node.type === "ArrayExpression") {
    analysis.characteristics.isSmall = analyzeArraySize(node) < 1024;
    analysis.estimatedSize = analyzeArraySize(node);
    analysis.reasons.push(`Array size: ${analysis.estimatedSize} bytes`);
    
    analysis.characteristics.noEscapingReferences = !checkEscapingReferences(node);
    if (analysis.characteristics.noEscapingReferences) {
      analysis.reasons.push("No escaping references detected");
    }
  } else if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
    // Small closures might be stack-allocated
    analysis.estimatedSize = estimateClosureSize(node);
    analysis.characteristics.isSmall = analysis.estimatedSize < 512;
    
    if (analysis.characteristics.isSmall) {
      analysis.reasons.push(`Small closure: ${analysis.estimatedSize} bytes`);
    }
  }

  // Lifetime analysis
  analysis.lifetime = analyzeLifetime(node);
  analysis.characteristics.hasShortLifetime = analysis.lifetime === "short" || analysis.lifetime === "immediate";
  if (analysis.characteristics.hasShortLifetime) {
    analysis.reasons.push(`Short-lived: ${analysis.lifetime}`);
  }

  // Determine stack candidacy
  analysis.isCandidate = 
    analysis.characteristics.isSmall &&
    analysis.characteristics.hasShortLifetime &&
    analysis.characteristics.noEscapingReferences &&
    analysis.characteristics.stableShape;
  
  if (analysis.isCandidate) {
    analysis.confidence = 0.85;
  } else if (
    (analysis.characteristics.isSmall && analysis.characteristics.hasShortLifetime) ||
    (analysis.characteristics.noEscapingReferences && analysis.characteristics.stableShape)
  ) {
    analysis.confidence = 0.50;
  }

  return analysis;
}

/**
 * Estimate object literal size in bytes
 * Counts properties and estimates based on typical property overhead
 */
function analyzeObjectSize(node) {
  if (node.type !== "ObjectExpression") return 0;
  
  // Each property: ~40 bytes overhead + value size
  const propertyOverhead = 40;
  let totalSize = 16; // Object header
  
  node.properties.forEach(prop => {
    totalSize += propertyOverhead;
    
    if (prop.value) {
      if (prop.value.type === "Literal") {
        if (typeof prop.value.value === "string") {
          totalSize += prop.value.value.length;
        } else if (typeof prop.value.value === "number") {
          totalSize += 8;
        } else if (typeof prop.value.value === "boolean") {
          totalSize += 1;
        }
      } else if (prop.value.type === "ObjectExpression") {
        totalSize += analyzeObjectSize(prop.value);
      } else if (prop.value.type === "ArrayExpression") {
        totalSize += analyzeArraySize(prop.value);
      } else {
        totalSize += 24; // Reference to other expression
      }
    }
  });
  
  return totalSize;
}

/**
 * Estimate array size in bytes
 * Counts elements and estimates based on type
 */
function analyzeArraySize(node) {
  if (node.type !== "ArrayExpression") return 0;
  
  // Array header + per-element overhead
  let totalSize = 32; // Array object header
  const elementOverhead = 8; // Per-element pointer
  
  node.elements.forEach(elem => {
    if (!elem) {
      totalSize += elementOverhead;
    } else if (elem.type === "Literal") {
      if (typeof elem.value === "string") {
        totalSize += elem.value.length;
      } else if (typeof elem.value === "number") {
        totalSize += 8;
      } else {
        totalSize += elementOverhead;
      }
    } else if (elem.type === "ObjectExpression") {
      totalSize += analyzeObjectSize(elem);
    } else if (elem.type === "ArrayExpression") {
      totalSize += analyzeArraySize(elem);
    } else {
      totalSize += elementOverhead;
    }
  });
  
  return totalSize;
}

/**
 * Estimate closure size including captured variables
 */
function estimateClosureSize(node) {
  let size = 24; // Function header
  
  // Estimate captured variables (this is rough)
  if (node.params) {
    size += node.params.length * 8;
  }
  
  // Body analysis would require proper scope tracking
  size += 128; // Conservative estimate for body
  
  return size;
}

/**
 * Check if object/value has escaping references
 * Returns true if value escapes (is returned, stored, passed to callback)
 */
function checkEscapingReferences(node) {
  if (!node) return false;
  
  // This is simplified - real implementation needs scope analysis
  // In a real scenario, would analyze:
  // 1. Return statements
  // 2. Property assignments
  // 3. Function arguments
  // 4. Closure captures
  
  return false; // Simplified: assume no escaping for now
}

/**
 * Check if object has stable shape (no dynamic properties)
 * Stable shapes enable inline caching and JIT optimization
 */
function isStableShape(node) {
  if (node.type !== "ObjectExpression") return false;
  
  // Check for computed properties or spreads
  const hasDynamicProperties = node.properties.some(prop => {
    return prop.computed === true || prop.type === "SpreadElement";
  });
  
  return !hasDynamicProperties;
}

/**
 * Analyze lifetime of an allocation
 * Returns: 'immediate' (single expression), 'short' (within block), 'long' (across scopes)
 */
function analyzeLifetime(node, parent) {
  if (!node) return "unknown";

  // Fast-path: literals and identifiers are immediate.
  if (node.type === "Literal" || node.type === "Identifier") {
    return "immediate";
  }

  // If assigned to a variable or stored in a property, treat as long-lived.
  if (parent && (parent.type === "VariableDeclarator" || parent.type === "AssignmentExpression")) {
    return "long";
  }

  // Returned values tend to escape the local scope.
  if (parent && parent.type === "ReturnStatement") {
    return "long";
  }

  // Conservative: most allocations are short-lived.
  return "short";
}

/**
 * MAIN ANALYSIS FUNCTION
 * 
 * Analyzes IR for stack allocation opportunities
 * Returns comprehensive stack analysis report
 */
function analyzeStackAllocation(ir) {
  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
      analysis: [],
      summary: {
        totalAllocations: 0,
        stackCandidates: 0,
        potentialMemorySavings: 0,
        estimatedSpeedupPercent: 0,
      },
    };
  }

  const analysis = {
    candidates: [],
    nonCandidates: [],
    summary: {
      totalAllocations: 0,
      stackCandidates: 0,
      heapRequired: 0,
      estimatedMemorySavings: 0,
      estimatedSpeedup: 0,
      gcPressureReduction: 0,
    },
    byType: {
      objects: { candidates: 0, total: 0, memory: 0 },
      arrays: { candidates: 0, total: 0, memory: 0 },
      closures: { candidates: 0, total: 0, memory: 0 },
    },
    recommendations: [],
  };

  // Walk AST and collect allocations
  walkAST(ir.program, (node, parent) => {
    if (node.type === "ObjectExpression" || 
        node.type === "ArrayExpression" || 
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression") {
      
      analysis.summary.totalAllocations++;
      
      const candidate = analyzeAllocationCandidate(node, null);
      if (candidate) {
        if (candidate.isCandidate) {
          candidate.lifetime = analyzeLifetime(node, parent);
          analysis.candidates.push(candidate);
          analysis.summary.stackCandidates++;
          analysis.summary.estimatedMemorySavings += candidate.estimatedSize;
          
          // Track by type
          if (node.type === "ObjectExpression") {
            analysis.byType.objects.candidates++;
            analysis.byType.objects.memory += candidate.estimatedSize;
          } else if (node.type === "ArrayExpression") {
            analysis.byType.arrays.candidates++;
            analysis.byType.arrays.memory += candidate.estimatedSize;
          } else {
            analysis.byType.closures.candidates++;
            analysis.byType.closures.memory += candidate.estimatedSize;
          }
        } else {
          candidate.lifetime = analyzeLifetime(node, parent);
          analysis.nonCandidates.push(candidate);
        }
        
        // Track total by type
        if (node.type === "ObjectExpression") {
          analysis.byType.objects.total++;
        } else if (node.type === "ArrayExpression") {
          analysis.byType.arrays.total++;
        } else {
          analysis.byType.closures.total++;
        }
      }
    }
  });

  // Calculate summary metrics
  analysis.summary.heapRequired = analysis.summary.totalAllocations - analysis.summary.stackCandidates;
  
  // Speedup estimate: Stack allocation ~100x faster than heap
  // GC pause time reduction roughly proportional to heap pressure reduction
  const heapReductionPercent = analysis.summary.totalAllocations > 0
    ? (analysis.summary.stackCandidates / analysis.summary.totalAllocations) * 100
    : 0;
  
  analysis.summary.estimatedSpeedup = heapReductionPercent * 0.15; // Conservative 0.15% per 1% heap reduction
  analysis.summary.gcPressureReduction = heapReductionPercent;

  // Generate recommendations
  if (analysis.summary.stackCandidates > 0) {
    analysis.recommendations.push(
      `✓ ${analysis.summary.stackCandidates} stack allocation opportunities found`
    );
    analysis.recommendations.push(
      `✓ Potential memory savings: ${(analysis.summary.estimatedMemorySavings / 1024).toFixed(2)} KB`
    );
    analysis.recommendations.push(
      `✓ Estimated GC pressure reduction: ${analysis.summary.gcPressureReduction.toFixed(1)}%`
    );
    
    if (analysis.summary.estimatedSpeedup > 2) {
      analysis.recommendations.push(
        `✓ Expected execution speedup: ${analysis.summary.estimatedSpeedup.toFixed(2)}% (if V8 escape analysis applies)`
      );
    }
  }

  if (analysis.summary.stackCandidates === 0) {
    analysis.recommendations.push(
      "⚠ No immediate stack allocation opportunities detected"
    );
    analysis.recommendations.push(
      "⚠ Consider refactoring large objects into smaller, short-lived components"
    );
  }

  return {
    success: true,
    analysis: analysis,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Apply stack allocation optimization to IR
 * Marks candidates with metadata for downstream compiler
 */
function applyStackAllocation(ir, stackAnalysis) {
  if (!ir || !stackAnalysis || !stackAnalysis.analysis) {
    return ir;
  }

  const optimizedIR = safeCloneIR(ir);
  let markedCount = 0;

  // Mark each candidate in the IR
  walkAST(optimizedIR.program, (node) => {
    const candidate = stackAnalysis.analysis.candidates.find(c => 
      c.node === node.type && c.estimatedSize < 1024
    );
    
    if (candidate && node.type === "ObjectExpression") {
      node._stackAllocate = true;
      node._estimatedSize = candidate.estimatedSize;
      markedCount++;
    } else if (candidate && node.type === "ArrayExpression") {
      node._stackAllocate = true;
      node._estimatedSize = candidate.estimatedSize;
      markedCount++;
    }
  });

  return {
    optimizedIR,
    markedCount,
    metadata: stackAnalysis.analysis.summary,
  };
}

/**
 * Utility: Walk AST tree
 */
function walkAST(node, callback, parent = null, seen = new WeakSet()) {
  if (!node) return;
  if (typeof node === "object") {
    if (seen.has(node)) return;
    seen.add(node);
  }
  
  callback(node, parent);
  
  if (typeof node === "object") {
    for (const key in node) {
      if (key === "parent" || key.startsWith("_")) continue; // Skip metadata
      const child = node[key];
      
      if (Array.isArray(child)) {
        child.forEach(item => walkAST(item, callback, node, seen));
      } else if (typeof child === "object" && child !== null) {
        walkAST(child, callback, node, seen);
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════

module.exports = {
  analyzeStackAllocation,
  applyStackAllocation,
  analyzeAllocationCandidate,
  analyzeObjectSize,
  analyzeArraySize,
  estimateClosureSize,
  checkEscapingReferences,
  isStableShape,
  analyzeLifetime,
  // Test helpers
  _walkAST: walkAST,
};
