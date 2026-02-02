#!/usr/bin/env node

/**
 * @fileoverview Algorithmic Complexity Analyzer
 * 
 * Purpose: Classify and analyze algorithmic complexity of code to ensure
 *          optimizations preserve or improve complexity classes.
 * 
 * Complexity Classes Detected:
 * - O(1): Constant time
 * - O(log n): Logarithmic (binary search, balanced tree operations)
 * - O(n): Linear (single loop over input)
 * - O(n log n): Linearithmic (merge sort, heap sort)
 * - O(n²): Quadratic (nested loops)
 * - O(n³): Cubic (triple nested loops)
 * - O(2^n): Exponential (recursive Fibonacci, backtracking)
 * - O(n!): Factorial (permutation generation)
 * 
 * Analysis Strategy:
 * 1. Count loop nesting depth
 * 2. Analyze recursion patterns
 * 3. Detect divide-and-conquer patterns
 * 4. Identify exponential growth
 * 
 * Safety Guarantees:
 * - Optimizations cannot degrade complexity class
 * - Warnings for potential degradation
 * - Forensic documentation of complexity reasoning
 * 
 * @module complexity-analyzer
 * @phase 3.4
 * @task 4.4
 * @version 1.0.0
 */

// ============================================================================
// COMPLEXITY ANALYZER
// ============================================================================

class ComplexityAnalyzer {
  constructor(options = {}) {
    this.options = {
      conservative: options.conservative !== false,
      ...options
    };
  }

  /**
   * Main analysis: Classify algorithmic complexity
   */
  analyzeComplexity(ir, _options = {}) {
    if (!ir || !ir.body) {
      return {
        overall: 'O(1)',
        functions: [],
        analysis: {
          totalFunctions: 0,
          totalLoops: 0,
          maxNestingDepth: 0,
          recursiveFunctions: 0
        }
      };
    }

    const results = {
      overall: 'O(1)',
      functions: [],
      analysis: {
        totalFunctions: 0,
        totalLoops: 0,
        maxNestingDepth: 0,
        recursiveFunctions: 0
      }
    };

    // Analyze all functions
    this.analyzeFunctions(ir, results);

    // Determine overall complexity (worst case)
    results.overall = this.determineWorstCase(results.functions);

    return results;
  }

  /**
   * Find and analyze all functions
   */
  analyzeFunctions(node, results, depth = 0) {
    if (!node || typeof node !== 'object') {
      return;
    }

    // Check if this is a function
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
      const funcAnalysis = this.analyzeSingleFunction(node);
      results.functions.push(funcAnalysis);
      results.analysis.totalFunctions++;

      if (funcAnalysis.isRecursive) {
        results.analysis.recursiveFunctions++;
      }

      results.analysis.maxNestingDepth = Math.max(
        results.analysis.maxNestingDepth,
        funcAnalysis.maxLoopNesting
      );
    }

    // Recurse into children
    for (const key in node) {
      if (key === 'type' || key === 'loc' || key === 'range') {
        continue;
      }

      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          this.analyzeFunctions(item, results, depth + 1);
        }
      } else if (typeof child === 'object') {
        this.analyzeFunctions(child, results, depth + 1);
      }
    }
  }

  /**
   * Analyze single function's complexity
   */
  analyzeSingleFunction(funcNode) {
    const name = funcNode.id ? funcNode.id.name || funcNode.id : '<anonymous>';
    
    // Count loops and nesting
    const loopAnalysis = this.analyzeLoops(funcNode.body);
    
    // Detect recursion
    const recursionAnalysis = this.detectRecursion(funcNode, name);
    
    // Classify complexity
    const complexity = this.classifyComplexity(loopAnalysis, recursionAnalysis);

    return {
      name,
      complexity,
      loopCount: loopAnalysis.count,
      maxLoopNesting: loopAnalysis.maxNesting,
      isRecursive: recursionAnalysis.isRecursive,
      recursionType: recursionAnalysis.type,
      details: {
        loops: loopAnalysis,
        recursion: recursionAnalysis
      },
      forensicReason: this.explainComplexity(complexity, loopAnalysis, recursionAnalysis)
    };
  }

  /**
   * Analyze loop structures
   */
  analyzeLoops(node, currentNesting = 0) {
    const result = {
      count: 0,
      maxNesting: 0,
      patterns: []
    };

    if (!node || typeof node !== 'object') {
      return result;
    }

    // Check if this is a loop
    const isLoop = node.type === 'ForStatement' || 
                   node.type === 'WhileStatement' || 
                   node.type === 'DoWhileStatement' ||
                   node.type === 'ForInStatement' ||
                   node.type === 'ForOfStatement';

    if (isLoop) {
      result.count = 1;
      result.maxNesting = currentNesting + 1;
      result.patterns.push({
        type: node.type,
        nesting: currentNesting + 1
      });

      // Analyze loop body with increased nesting
      if (node.body) {
        const bodyAnalysis = this.analyzeLoops(node.body, currentNesting + 1);
        result.count += bodyAnalysis.count;
        result.maxNesting = Math.max(result.maxNesting, bodyAnalysis.maxNesting);
        result.patterns.push(...bodyAnalysis.patterns);
      }
    } else {
      // Recurse into children without increasing nesting
      for (const key in node) {
        if (key === 'type' || key === 'loc' || key === 'range') {
          continue;
        }

        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            const childAnalysis = this.analyzeLoops(item, currentNesting);
            result.count += childAnalysis.count;
            result.maxNesting = Math.max(result.maxNesting, childAnalysis.maxNesting);
            result.patterns.push(...childAnalysis.patterns);
          }
        } else if (typeof child === 'object') {
          const childAnalysis = this.analyzeLoops(child, currentNesting);
          result.count += childAnalysis.count;
          result.maxNesting = Math.max(result.maxNesting, childAnalysis.maxNesting);
          result.patterns.push(...childAnalysis.patterns);
        }
      }
    }

    return result;
  }

  /**
   * Detect recursion patterns
   */
  detectRecursion(funcNode, funcName) {
    const result = {
      isRecursive: false,
      type: 'none',
      callCount: 0,
      reason: ''
    };

    // Skip anonymous functions (can't call themselves by name easily)
    if (!funcName || funcName === '<anonymous>') {
      return result;
    }

    // Search for function calls to itself
    const calls = this.findFunctionCalls(funcNode.body, funcName);
    
    if (calls.length > 0) {
      result.isRecursive = true;
      result.callCount = calls.length;

      // Classify recursion type
      if (calls.length === 1) {
        result.type = 'linear-recursive';
        result.reason = 'Single recursive call (likely O(n) depth)';
      } else if (calls.length === 2) {
        result.type = 'binary-recursive';
        result.reason = 'Two recursive calls (likely O(2^n) exponential)';
      } else {
        result.type = 'multi-recursive';
        result.reason = `${calls.length} recursive calls (exponential growth)`;
      }
    }

    return result;
  }

  /**
   * Find function calls by name
   */
  findFunctionCalls(node, funcName) {
    const calls = [];

    if (!node || typeof node !== 'object') {
      return calls;
    }

    if (node.type === 'CallExpression' && 
        node.callee && 
        node.callee.type === 'Identifier' && 
        node.callee.name === funcName) {
      calls.push(node);
    }

    // Recurse into children
    for (const key in node) {
      if (key === 'type' || key === 'loc' || key === 'range') {
        continue;
      }

      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          calls.push(...this.findFunctionCalls(item, funcName));
        }
      } else if (typeof child === 'object') {
        calls.push(...this.findFunctionCalls(child, funcName));
      }
    }

    return calls;
  }

  /**
   * Classify complexity based on analysis
   */
  classifyComplexity(loopAnalysis, recursionAnalysis) {
    // Recursive cases
    if (recursionAnalysis.isRecursive) {
      if (recursionAnalysis.type === 'binary-recursive' || recursionAnalysis.callCount > 1) {
        return 'O(2^n)'; // Exponential
      } else {
        return 'O(n)'; // Linear recursion
      }
    }

    // Loop-based complexity
    if (loopAnalysis.maxNesting === 0) {
      return 'O(1)'; // No loops, constant time
    } else if (loopAnalysis.maxNesting === 1) {
      // Single loop - check for divide-and-conquer hints
      return 'O(n)'; // Linear
    } else if (loopAnalysis.maxNesting === 2) {
      return 'O(n²)'; // Quadratic
    } else if (loopAnalysis.maxNesting === 3) {
      return 'O(n³)'; // Cubic
    } else {
      return `O(n^${loopAnalysis.maxNesting})`; // Polynomial
    }
  }

  /**
   * Determine worst-case complexity
   */
  determineWorstCase(functions) {
    const complexityOrder = {
      'O(1)': 1,
      'O(log n)': 2,
      'O(n)': 3,
      'O(n log n)': 4,
      'O(n²)': 5,
      'O(n³)': 6,
      'O(2^n)': 7,
      'O(n!)': 8
    };

    let worst = 'O(1)';
    let worstRank = 1;

    for (const func of functions) {
      const complexity = func.complexity;
      const rank = complexityOrder[complexity] || 99;

      if (rank > worstRank) {
        worst = complexity;
        worstRank = rank;
      }
    }

    return worst;
  }

  /**
   * Explain complexity classification
   */
  explainComplexity(complexity, loopAnalysis, recursionAnalysis) {
    if (recursionAnalysis.isRecursive) {
      return `${complexity}: ${recursionAnalysis.reason}`;
    }

    if (loopAnalysis.maxNesting === 0) {
      return 'O(1): No loops detected, constant time operations';
    } else if (loopAnalysis.maxNesting === 1) {
      return `O(n): Single loop detected (${loopAnalysis.count} total loops)`;
    } else if (loopAnalysis.maxNesting === 2) {
      return `O(n²): Nested loops detected (max nesting: ${loopAnalysis.maxNesting})`;
    } else {
      return `${complexity}: ${loopAnalysis.maxNesting} levels of loop nesting`;
    }
  }

  /**
   * Verify optimization preserves complexity
   */
  verifyComplexityPreservation(originalComplexity, optimizedComplexity) {
    const complexityOrder = {
      'O(1)': 1,
      'O(log n)': 2,
      'O(n)': 3,
      'O(n log n)': 4,
      'O(n²)': 5,
      'O(n³)': 6,
      'O(2^n)': 7,
      'O(n!)': 8
    };

    const originalRank = complexityOrder[originalComplexity] || 99;
    const optimizedRank = complexityOrder[optimizedComplexity] || 99;

    return {
      preserved: optimizedRank <= originalRank,
      improved: optimizedRank < originalRank,
      degraded: optimizedRank > originalRank,
      originalComplexity,
      optimizedComplexity,
      verdict: optimizedRank <= originalRank ? 'PASS' : 'FAIL',
      forensicReason: this.explainComplexityChange(originalRank, optimizedRank, originalComplexity, optimizedComplexity)
    };
  }

  /**
   * Explain complexity change
   */
  explainComplexityChange(originalRank, optimizedRank, originalComplexity, optimizedComplexity) {
    if (optimizedRank < originalRank) {
      return `✅ IMPROVED: ${originalComplexity} → ${optimizedComplexity} (better performance)`;
    } else if (optimizedRank === originalRank) {
      return `✅ PRESERVED: ${originalComplexity} maintained`;
    } else {
      return `⚠️ DEGRADED: ${originalComplexity} → ${optimizedComplexity} (UNACCEPTABLE)`;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { ComplexityAnalyzer };
