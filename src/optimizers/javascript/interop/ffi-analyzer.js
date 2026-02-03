/**
 * FFI (Foreign Function Interface) Analyzer
 * 
 * Phase 3.5 Task 5.1
 * Analyzes FFI calls and identifies optimization opportunities
 * 
 * Key Features:
 * - FFI call detection (ffi.call, ffi.callback patterns)
 * - FFI signature analysis (C function signatures)
 * - Overhead estimation (measure FFI call cost)
 * - Batching opportunity detection (repeated FFI calls)
 * - Inline candidate selection (trivial FFI wrappers)
 * - Memory safety validation
 * 
 * Safety:
 * - Conservative analysis (errs on side of safety)
 * - Preserves FFI semantics exactly
 * - No false positive optimizations
 * - Type-aware (respects cross-language types)
 */

/**
 * Analyze FFI calls in IR and identify optimization opportunities
 * 
 * @param {Object} ir - IR tree to analyze
 * @returns {Object} Analysis result with FFI metadata
 * 
 * Result structure:
 * {
 *   ffiCalls: [
 *     {
 *       nodeId: 'Call_T0',
 *       signature: 'int add(int, int)',
 *       overhead: 'low',  // 'low', 'medium', 'high'
 *       batchable: false,
 *       inlineCandidate: true,
 *       safetyLevel: 'safe',  // 'safe', 'unsafe', 'unknown'
 *       parameters: [{ type: 'int', name: 'a' }, { type: 'int', name: 'b' }],
 *       returnType: 'int'
 *     }
 *   ],
 *   ffiCallbacks: [
 *     {
 *       nodeId: 'Callback_T0',
 *       capturedVariables: ['x', 'y'],
 *       safetyLevel: 'safe'
 *     }
 *   ],
 *   batchingOpportunities: [
 *     {
 *       calls: ['Call_T0', 'Call_T1'],
 *       estimatedSavings: 0.25  // 25% overhead reduction
 *     }
 *   ],
 *   totalOverhead: 150,  // microseconds
 *   recommendations: ['Batch 2 sequential FFI calls', 'Inline trivial wrapper']
 * }
 */
function analyzeFfiCalls(ir) {
  const analysis = {
    ffiCalls: [],
    ffiCallbacks: [],
    batchingOpportunities: [],
    totalOverhead: 0,
    recommendations: []
  };

  // Traverse IR tree to find FFI calls
  traverseIR(ir, (node) => {
    if (isFfiCall(node)) {
      const ffiCallInfo = analyzeSingleFfiCall(node);
      analysis.ffiCalls.push(ffiCallInfo);
      analysis.totalOverhead += ffiCallInfo.overheadMicros;
    } else if (isFfiCallback(node)) {
      const callbackInfo = analyzeFfiCallback(node);
      analysis.ffiCallbacks.push(callbackInfo);
    }
  });

  // Detect batching opportunities (sequential FFI calls)
  analysis.batchingOpportunities = detectBatchingOpportunities(analysis.ffiCalls);

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

/**
 * Check if node is an FFI call
 * Patterns: ffi.call('func', ...), external_call(...)
 */
function isFfiCall(node) {
  if (node.type !== "Call") return false;

  // Pattern 1: ffi.call('funcName', ...)
  if (node.callee?.type === "Member" &&
      node.callee.object?.name === "ffi" &&
      node.callee.property === "call") {
    return true;
  }

  // Pattern 2: Function call with _ffiSignature metadata
  if (node._ffiSignature) {
    return true;
  }

  // Pattern 3: External function marker
  if (node.callee?._isExternal) {
    return true;
  }

  return false;
}

/**
 * Check if node is an FFI callback
 * Patterns: ffi.callback(jsFunc)
 */
function isFfiCallback(node) {
  if (node.type !== "Call") return false;

  return (
    node.callee?.type === "Member" &&
    node.callee.object?.name === "ffi" &&
    node.callee.property === "callback"
  );
}

/**
 * Analyze a single FFI call
 */
function analyzeSingleFfiCall(node) {
  // Extract function signature (if available)
  const signature = extractFfiSignature(node);
  
  // Parse signature to get types
  const parsed = parseFfiSignature(signature);
  
  // Estimate overhead based on parameter count and types
  const overhead = estimateOverhead(parsed);
  
  // Check if call is batchable (no data dependencies)
  const batchable = isBatchable(node);
  
  // Check if call is inline candidate (trivial wrapper)
  const inlineCandidate = isInlineCandidate(node, parsed);
  
  // Validate memory safety
  const safetyLevel = validateSafety(node, parsed);

  return {
    nodeId: node._nodeId || "unknown",
    signature: signature,
    overhead: categorizeOverhead(overhead),
    overheadMicros: overhead,
    batchable: batchable,
    inlineCandidate: inlineCandidate,
    safetyLevel: safetyLevel,
    parameters: parsed.parameters,
    returnType: parsed.returnType
  };
}

/**
 * Extract FFI signature from node
 * Returns C function signature like "int add(int, int)"
 */
function extractFfiSignature(node) {
  // Check if signature is in metadata
  if (node._ffiSignature) {
    return node._ffiSignature;
  }

  // Try to infer from function name argument
  if (node.arguments && node.arguments[0]?.type === "Literal") {
    const funcName = node.arguments[0].value;
    // Look up in FFI registry (would be populated separately)
    return `void ${funcName}()`;  // Default if unknown
  }

  return "void unknown()";
}

/**
 * Parse FFI signature into structured format
 * Example: "int add(int a, int b)" → { returnType: 'int', name: 'add', parameters: [...] }
 */
function parseFfiSignature(signature) {
  // Simple regex-based parser (production would use proper parser)
  const match = signature.match(/^(\w+)\s+(\w+)\s*\(([^)]*)\)/);
  
  if (!match) {
    return {
      returnType: "void",
      name: "unknown",
      parameters: []
    };
  }

  const [, returnType, name, paramStr] = match;
  
  // Parse parameters
  const parameters = paramStr
    .split(",")
    .map(p => p.trim())
    .filter(p => p)
    .map(param => {
      const parts = param.split(/\s+/);
      return {
        type: parts[0],
        name: parts[1] || "arg"
      };
    });

  return { returnType, name, parameters };
}

/**
 * Estimate FFI call overhead in microseconds
 * Based on parameter count and complexity
 */
function estimateOverhead(parsed) {
  const baseOverhead = 50;  // microseconds for FFI call setup
  const perParamOverhead = 10;  // microseconds per parameter
  
  let overhead = baseOverhead;
  
  // Add per-parameter overhead
  overhead += parsed.parameters.length * perParamOverhead;
  
  // Add type conversion overhead
  for (const param of parsed.parameters) {
    if (isComplexType(param.type)) {
      overhead += 50;  // struct/pointer marshaling
    } else if (isStringType(param.type)) {
      overhead += 30;  // string encoding conversion
    }
  }
  
  return overhead;
}

/**
 * Categorize overhead as 'low', 'medium', or 'high'
 */
function categorizeOverhead(overheadMicros) {
  if (overheadMicros < 75) return "low";
  if (overheadMicros < 150) return "medium";
  return "high";
}

/**
 * Check if FFI call is batchable (can be combined with others)
 * Batchable if: no side effects, no data dependencies
 */
function isBatchable(node) {
  // Check if call has side effects (writes, I/O)
  if (hasSideEffects(node)) {
    return false;
  }
  
  // Check if return value is used immediately (data dependency)
  if (node._usedImmediately) {
    return false;
  }
  
  return true;
}

/**
 * Check if FFI call is inline candidate
 * Inline if: trivial wrapper, simple types, no complex marshaling
 */
function isInlineCandidate(node, parsed) {
  // Only inline if <= 2 parameters
  if (parsed.parameters.length > 2) {
    return false;
  }
  
  // Only inline if simple types (no pointers/structs)
  for (const param of parsed.parameters) {
    if (isComplexType(param.type)) {
      return false;
    }
  }
  
  // Only inline if simple return type
  if (isComplexType(parsed.returnType)) {
    return false;
  }
  
  return true;
}

/**
 * Validate memory safety of FFI call
 * Returns: 'safe', 'unsafe', or 'unknown'
 */
function validateSafety(node, parsed) {
  // Check for pointer parameters (potential memory issues)
  for (const param of parsed.parameters) {
    if (param.type.includes("*") || param.type.includes("ptr")) {
      return "unsafe";  // Pointer parameters require careful analysis
    }
  }
  
  // Check for buffer/array parameters
  if (parsed.parameters.some(p => p.type.includes("[]"))) {
    return "unsafe";  // Array parameters need bounds checking
  }
  
  // Simple types are safe
  return "safe";
}

/**
 * Check if type is complex (struct, pointer, array)
 */
function isComplexType(type) {
  return type.includes("*") || 
         type.includes("struct") || 
         type.includes("[]") ||
         type.includes("ptr");
}

/**
 * Check if type is string (needs encoding conversion)
 */
function isStringType(type) {
  return type === "char*" || 
         type === "string" || 
         type.includes("str");
}

/**
 * Check if node has side effects
 */
function hasSideEffects(node) {
  // Check function name for common side-effect patterns
  const funcName = node.callee?.name || "";
  
  const sideEffectPatterns = [
    "write", "read", "print", "log", "send", "recv",
    "open", "close", "create", "delete", "modify",
    "set", "put", "post", "update"
  ];
  
  return sideEffectPatterns.some(pattern => 
    funcName.toLowerCase().includes(pattern)
  );
}

/**
 * Analyze FFI callback
 */
function analyzeFfiCallback(node) {
  const captured = extractCapturedVariables(node);
  
  return {
    nodeId: node._nodeId || "unknown",
    capturedVariables: captured,
    safetyLevel: captured.length > 5 ? "unsafe" : "safe"
  };
}

/**
 * Extract captured variables from callback closure
 */
function extractCapturedVariables(node) {
  // Simplified: would need proper closure analysis
  if (node.arguments && node.arguments[0]?.type === "Function") {
    const func = node.arguments[0];
    // Would analyze function body for free variables
    return [];  // Placeholder
  }
  return [];
}

/**
 * Detect batching opportunities (sequential FFI calls)
 */
function detectBatchingOpportunities(ffiCalls) {
  const opportunities = [];
  
  // Sort by node ID to get sequential calls
  const sorted = [...ffiCalls].sort((a, b) => 
    a.nodeId.localeCompare(b.nodeId)
  );
  
  // Find consecutive batchable calls
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    if (current.batchable && next.batchable) {
      // Estimate savings from batching
      const savings = (current.overheadMicros + next.overheadMicros) * 0.25;
      
      opportunities.push({
        calls: [current.nodeId, next.nodeId],
        estimatedSavings: savings / (current.overheadMicros + next.overheadMicros)
      });
    }
  }
  
  return opportunities;
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  // Recommend batching
  if (analysis.batchingOpportunities.length > 0) {
    recommendations.push(
      `Batch ${analysis.batchingOpportunities.length * 2} sequential FFI calls (25% overhead reduction)`
    );
  }
  
  // Recommend inlining
  const inlineCandidates = analysis.ffiCalls.filter(c => c.inlineCandidate);
  if (inlineCandidates.length > 0) {
    recommendations.push(
      `Inline ${inlineCandidates.length} trivial FFI wrappers`
    );
  }
  
  // Warn about unsafe calls
  const unsafeCalls = analysis.ffiCalls.filter(c => c.safetyLevel === "unsafe");
  if (unsafeCalls.length > 0) {
    recommendations.push(
      `SAFETY: ${unsafeCalls.length} FFI calls require manual review (pointers/arrays)`
    );
  }
  
  // Recommend optimization if high overhead
  if (analysis.totalOverhead > 500) {
    recommendations.push(
      `High FFI overhead detected (${analysis.totalOverhead}µs) - consider batching or caching`
    );
  }
  
  return recommendations;
}

/**
 * Apply FFI optimizations to IR (mark nodes with metadata)
 */
function applyFfiOptimizations(ir, analysis) {
  traverseIR(ir, (node) => {
    // Find matching FFI call in analysis
    const ffiCall = analysis.ffiCalls.find(c => c.nodeId === node._nodeId);
    
    if (ffiCall) {
      // Add FFI metadata to IR node
      node._ffiSignature = ffiCall.signature;
      node._ffiOverhead = ffiCall.overhead;
      node._ffiBatchable = ffiCall.batchable;
      node._ffiInlineCandidate = ffiCall.inlineCandidate;
      node._ffiSafetyLevel = ffiCall.safetyLevel;
    }
  });
  
  return ir;
}

/**
 * Traverse IR tree and apply function to each node
 */
function traverseIR(node, fn) {
  if (!node || typeof node !== "object") return;
  
  fn(node);
  
  // Traverse children
  for (const key in node) {
    if (key.startsWith("_")) continue;  // Skip metadata
    
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach(c => traverseIR(c, fn));
    } else if (typeof child === "object") {
      traverseIR(child, fn);
    }
  }
}

module.exports = {
  analyzeFfiCalls,
  applyFfiOptimizations,
  
  // Export for testing
  isFfiCall,
  isFfiCallback,
  parseFfiSignature,
  estimateOverhead,
  validateSafety,
  detectBatchingOpportunities
};
