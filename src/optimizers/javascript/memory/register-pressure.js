#!/usr/bin/env node

/**
 * REGISTER PRESSURE ESTIMATOR - JavaScript Memory Optimization Phase 2
 * 
 * Estimates how many CPU registers are needed to hold live variables
 * and identifies opportunities to reduce register pressure.
 * 
 * High register pressure leads to:
 * - Spill code (saves/restores registers from stack)
 * - Reduced instruction-level parallelism
 * - More cache misses
 * - Lower throughput
 * 
 * Goals:
 * - Estimate live variable count at each program point
 * - Identify pressure peaks
 * - Suggest variable lifetime reduction
 * - Measure potential speedup from register optimization
 * 
 * Modern CPUs have 16-32 general-purpose registers. Code that exceeds
 * this requires expensive spill/reload operations.
 */

/**
 * Analyze a variable node for register usage
 */
function analyzeVariableUsage(varName, _scope) {
  return {
    name: varName,
    uses: [],
    definitions: [],
    liveRangeStart: -1,
    liveRangeEnd: -1,
    liveLength: 0,
    spillCost: 0, // Estimated cost if spilled
    registerCost: 0, // Estimated cost to keep in register
  };
}

/**
 * Compute liveness sets for all variables at each program point
 * Uses classic dataflow analysis: for each basic block, compute IN and OUT sets
 */
function computeLiveness(ir) {
  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
    };
  }

  const blocks = extractBasicBlocks(ir.program);
  const analysis = {
    blocks: blocks,
    liveIn: new Map(),  // Set of live variables at block entry
    liveOut: new Map(), // Set of live variables at block exit
    definitions: new Map(),
    uses: new Map(),
  };

  // Initialize
  blocks.forEach((block, idx) => {
    analysis.liveIn.set(idx, new Set());
    analysis.liveOut.set(idx, new Set());
    analysis.definitions.set(idx, new Set());
    analysis.uses.set(idx, new Set());
  });

  // Compute GEN (used before defined) and KILL (defined)
  blocks.forEach((block, idx) => {
    const gen = new Set();
    const kill = new Set();
    
    walkStatements(block, (node) => {
      // Collect uses (before definitions)
      collectVariables(node, "use", gen, kill);
      // Collect definitions
      collectVariables(node, "def", kill, gen);
    });
    
    analysis.definitions.set(idx, kill);
    analysis.uses.set(idx, gen);
  });

  // Iterate until fixed point
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Process blocks in reverse order (backwards analysis)
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      
      // OUT[B] = union of IN[S] for all successors S
      const newOut = new Set();
      const successors = getBlockSuccessors(block, blocks);
      successors.forEach(succIdx => {
        const succIn = analysis.liveIn.get(succIdx) || new Set();
        succIn.forEach(v => newOut.add(v));
      });
      
      // IN[B] = USE[B] ∪ (OUT[B] - DEF[B])
      const newIn = new Set(analysis.uses.get(i) || new Set());
      const outSet = newOut;
      const defSet = analysis.definitions.get(i) || new Set();
      
      outSet.forEach(v => {
        if (!defSet.has(v)) {
          newIn.add(v);
        }
      });
      
      // Check for changes
      if (!setsEqual(analysis.liveIn.get(i), newIn)) {
        changed = true;
        analysis.liveIn.set(i, newIn);
      }
      if (!setsEqual(analysis.liveOut.get(i), newOut)) {
        changed = true;
        analysis.liveOut.set(i, newOut);
      }
    }
  }

  return {
    success: true,
    analysis,
    iterations,
  };
}

/**
 * Extract basic blocks from IR
 * A basic block is a sequence of instructions with no branches except at end
 */
function extractBasicBlocks(node) {
  const blocks = [];
  let currentBlock = [];

  function processNode(n) {
    if (!n) return;
    
    currentBlock.push(n);
    
    // Branch points - end current block
    if (n.type === "IfStatement" || n.type === "WhileStatement" || 
        n.type === "ForStatement" || n.type === "ReturnStatement") {
      if (currentBlock.length > 0) {
        blocks.push([...currentBlock]);
        currentBlock = [];
      }
    }
    
    // Process children
    if (n.body && Array.isArray(n.body)) {
      n.body.forEach(processNode);
    } else if (n.consequent || n.alternate) {
      if (n.consequent) processNode(n.consequent);
      if (n.alternate) processNode(n.alternate);
    }
  }

  processNode(node);
  
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }
  
  return blocks.filter(b => b.length > 0);
}

/**
 * Collect variables used/defined in a node
 */
function collectVariables(node, type, collection, otherSet) {
  if (!node) return;
  
  if (type === "use") {
    // Variable references
    if (node.type === "Identifier" && !otherSet.has(node.name)) {
      collection.add(node.name);
    } else if (node.type === "MemberExpression") {
      if (node.object.type === "Identifier") {
        collection.add(node.object.name);
      }
    }
  } else if (type === "def") {
    // Variable definitions/assignments
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
      collection.add(node.id.name);
    } else if (node.type === "AssignmentExpression" && node.left.type === "Identifier") {
      collection.add(node.left.name);
    }
  }
}

/**
 * Walk through statements in a block
 */
function walkStatements(block, callback) {
  if (Array.isArray(block)) {
    block.forEach(stmt => {
      if (stmt) callback(stmt);
      if (stmt && stmt.expression) callback(stmt.expression);
    });
  } else {
    callback(block);
  }
}

/**
 * Get successor blocks
 */
function getBlockSuccessors(block, allBlocks) {
  if (!block || block.length === 0) return [];
  
  const lastNode = block[block.length - 1];
  if (!lastNode) return [allBlocks.indexOf(block) + 1].filter(i => i < allBlocks.length);
  
  // This is simplified - would need to track actual control flow
  const currentIdx = allBlocks.indexOf(block);
  if (currentIdx < allBlocks.length - 1) {
    return [currentIdx + 1];
  }
  return [];
}

/**
 * Check if two sets are equal
 */
function setsEqual(s1, s2) {
  if (!s1 && !s2) return true;
  if (!s1 || !s2) return false;
  if (s1.size !== s2.size) return false;
  
  for (let v of s1) {
    if (!s2.has(v)) return false;
  }
  return true;
}

/**
 * MAIN ANALYSIS FUNCTION
 * 
 * Estimates register pressure for the entire IR
 */
function analyzeRegisterPressure(ir) {
  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
      analysis: [],
      summary: {
        avgLiveVariables: 0,
        maxLiveVariables: 0,
        registerPressure: "unknown",
        spillsEstimated: 0,
        optimizationOpportunities: 0,
      },
    };
  }

  const livenessResult = computeLiveness(ir);
  if (!livenessResult.success) {
    return livenessResult;
  }

  const { analysis: liveness } = livenessResult;
  
  const analysis = {
    liveness,
    registerPressure: {
      byBlock: [],
      averageLiveVariables: 0,
      maxLiveVariables: 0,
      peakPressureBlocks: [],
    },
    summary: {
      totalBlocks: liveness.blocks.length,
      highPressureBlocks: 0, // >16 live vars
      criticalPressureBlocks: 0, // >32 live vars
      estimatedSpillOperations: 0,
      estimatedSpillCost: 0,
      opportunities: {
        variableSplitting: 0,
        deadCodeElimination: 0,
        lifetimeReduction: 0,
      },
    },
    recommendations: [],
  };

  // Analyze each block
  const pressures = [];
  
  liveness.blocks.forEach((block, idx) => {
    const liveIn = liveness.liveIn.get(idx) || new Set();
    const liveOut = liveness.liveOut.get(idx) || new Set();
    
    const pressure = {
      blockIndex: idx,
      liveInCount: liveIn.size,
      liveOutCount: liveOut.size,
      maxInBlock: Math.max(liveIn.size, liveOut.size),
      isHighPressure: Math.max(liveIn.size, liveOut.size) > 16,
      isCriticalPressure: Math.max(liveIn.size, liveOut.size) > 32,
      variables: Array.from(liveIn),
    };
    
    pressures.push(pressure);
    analysis.registerPressure.byBlock.push(pressure);
    
    if (pressure.isHighPressure) {
      analysis.summary.highPressureBlocks++;
    }
    if (pressure.isCriticalPressure) {
      analysis.summary.criticalPressureBlocks++;
      analysis.registerPressure.peakPressureBlocks.push(idx);
    }
  });

  // Calculate summary metrics
  const maxLive = Math.max(...pressures.map(p => p.maxInBlock), 0);
  const avgLive = pressures.length > 0 
    ? pressures.reduce((sum, p) => sum + p.maxInBlock, 0) / pressures.length 
    : 0;

  analysis.registerPressure.maxLiveVariables = maxLive;
  analysis.registerPressure.averageLiveVariables = avgLive;

  // Estimate spill costs (modern CPU: 4-6 cycles per spill/reload)
  // Assume 50% overhead for each register beyond 16 available
  if (maxLive > 16) {
    const spillCount = maxLive - 16;
    analysis.summary.estimatedSpillOperations = spillCount * analysis.registerPressure.byBlock.length;
    analysis.summary.estimatedSpillCost = spillCount * 5; // 5 cycles per spill
  }

  // Categorize pressure level
  let pressureLevel = "low";
  if (maxLive > 32) {
    pressureLevel = "critical";
  } else if (maxLive > 16) {
    pressureLevel = "high";
  } else if (maxLive > 8) {
    pressureLevel = "moderate";
  }

  // Generate recommendations
  if (pressureLevel === "critical") {
    analysis.recommendations.push(
      `⚠ CRITICAL: ${maxLive} simultaneous live variables (>2x available registers)`
    );
    analysis.recommendations.push(
      "✓ Variable splitting: Break long-lived variables into smaller chunks"
    );
    analysis.recommendations.push(
      "✓ Lifetime reduction: Move variable definitions closer to first use"
    );
    analysis.recommendations.push(
      "✓ Loop analysis: Extract loop-invariant calculations"
    );
    analysis.summary.opportunities.variableSplitting = Math.ceil((maxLive - 16) / 2);
    analysis.summary.opportunities.lifetimeReduction = Math.ceil((maxLive - 16) / 3);
  } else if (pressureLevel === "high") {
    analysis.recommendations.push(
      `⚠ HIGH: ${maxLive} simultaneous live variables (exceeds 16-register limit)`
    );
    analysis.recommendations.push(
      "✓ Consider variable lifetime optimization (move definitions closer to use)"
    );
    analysis.recommendations.push(
      "✓ Profile to identify hot loops with high pressure"
    );
  } else if (pressureLevel === "moderate") {
    analysis.recommendations.push(
      `✓ Moderate register pressure (${maxLive} simultaneous variables)`
    );
    analysis.recommendations.push(
      "✓ Generally acceptable; monitor for improvement opportunities"
    );
  } else {
    analysis.recommendations.push(
      `✓ Low register pressure (${maxLive} simultaneous variables)`
    );
    analysis.recommendations.push(
      "✓ Efficient register usage; focus on other optimizations"
    );
  }

  if (analysis.summary.estimatedSpillOperations > 100) {
    analysis.recommendations.push(
      `⚠ Estimated ${analysis.summary.estimatedSpillOperations} spill operations (~${(analysis.summary.estimatedSpillCost * analysis.summary.estimatedSpillOperations / 1000).toFixed(0)}K cycles total)`
    );
  }

  return {
    success: true,
    analysis,
    pressureLevel,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Apply register pressure optimization to IR
 * Marks high-pressure variables for special handling
 */
function applyRegisterOptimization(ir, pressureAnalysis) {
  if (!ir || !pressureAnalysis || !pressureAnalysis.analysis) {
    return ir;
  }

  const optimizedIR = JSON.parse(JSON.stringify(ir));
  let optimizedVariables = 0;
  const optimizedVariableNames = new Set();

  // Mark variables in peak pressure blocks for optimization
  pressureAnalysis.analysis.registerPressure.peakPressureBlocks.forEach(blockIdx => {
    const variables = pressureAnalysis.analysis.liveness.liveIn.get(blockIdx);
    if (variables) {
      variables.forEach(varName => {
        // Record optimized variables for downstream compiler hints
        optimizedVariableNames.add(varName);
        optimizedVariables++;
      });
    }
  });

  return {
    optimizedIR,
    optimizedVariables,
    metadata: {
      ...pressureAnalysis.analysis.summary,
      optimizedVariables: Array.from(optimizedVariableNames),
    },
  };
}

// ═════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════

module.exports = {
  analyzeRegisterPressure,
  applyRegisterOptimization,
  computeLiveness,
  extractBasicBlocks,
  collectVariables,
  analyzeVariableUsage,
  // Test helpers
  _walkStatements: walkStatements,
  _getBlockSuccessors: getBlockSuccessors,
  _setsEqual: setsEqual,
};
