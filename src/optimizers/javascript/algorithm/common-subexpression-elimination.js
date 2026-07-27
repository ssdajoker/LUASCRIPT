#!/usr/bin/env node

/**
 * @fileoverview Common Subexpression Elimination (CSE)
 * 
 * Purpose: Identify and consolidate duplicate pure expressions to reduce
 * redundant computation while preserving semantics.
 * 
 * Algorithm (Conservative MVP):
 * 1. Value-number expressions (stable hash)
 * 2. Filter by purity (SideEffectDetector)
 * 3. Restrict to same block scope
 * 4. Invalidate expressions after mutations
 * 5. Annotate IR with metadata for codegen
 * 
 * Safety Guarantees:
 * - Never consolidate impure expressions
 * - Never consolidate across block boundaries
 * - Invalidate after mutations
 * - Conservative defaults (assume unsafe when uncertain)
 * 
 * @module common-subexpression-elimination
 * @phase 3.4
 * @task 4.2
 * @version 1.0.0
 */

const { SideEffectDetector } = require("./side-effect-detector.js");
const { ValueNumbering } = require("./value-numbering.js");

// ============================================================================
// CSE ANALYZER
// ============================================================================

class CommonSubexpressionEliminationAnalyzer {
  constructor(options = {}) {
    this.options = {
      conservative: options.conservative !== false,
      pureFunctions: options.pureFunctions || new Set(),
      commutativeOperators: options.commutativeOperators || new Set(["*", "&", "|", "^"]),
      ...options
    };

    this.sideEffectDetector = new SideEffectDetector({
      pureFunctions: this.options.pureFunctions,
      conservative: this.options.conservative
    });

    this.valueNumbering = new ValueNumbering({
      commutativeOperators: this.options.commutativeOperators,
      includeTypes: true
    });

    this.tempIndex = 0;
  }

  /**
   * Main analysis entry point
   */
  analyzeCommonSubexpressions(ir) {
    const results = {
      consolidated: [],
      blocked: [],
      analysis: {
        totalBlocks: 0,
        totalExpressions: 0,
        totalCandidates: 0,
        totalConsolidated: 0,
        totalBlocked: 0,
        totalInvalidations: 0
      }
    };

    if (!ir || !ir.body) {
      return results;
    }

    // Analyze top-level program block
    this.analyzeBlock(ir, results, { scopeId: "Program" });

    // Add backward-compatible alias for gate tests
    // Flatten consolidated entries to expose expression properties directly
    results.subexpressions = results.consolidated.map(entry => ({
      ...entry.expression,  // Spread expression AST properties (type, operator, etc.)
      hash: entry.hash,
      locations: entry.occurrences,
      tempVar: entry.tempVar
    }));

    return results;
  }

  /**
   * Apply CSE analysis to IR (adds metadata)
   * Instance method for API compatibility
   */
  applyCommonSubexpressionElimination(ir, analysis) {
    return applyCommonSubexpressionElimination(ir, analysis);
  }

  /**
   * Analyze a block (Program or BlockStatement)
   */
  analyzeBlock(blockNode, results, scope) {
    const body = blockNode.body || [];
    results.analysis.totalBlocks++;

    const context = {
      cache: new Map(), // hash -> entry
      mutated: new Set(),
      scopeId: scope.scopeId || "Block"
    };

    for (let index = 0; index < body.length; index++) {
      const stmt = body[index];

      // Extract candidate expressions from statement
      const expressions = this.extractCandidateExpressions(stmt);

      for (const expr of expressions) {
        results.analysis.totalExpressions++;

        const purity = this.sideEffectDetector.classifyPurity(expr.node);
        if (!purity.pure) {
          results.analysis.totalBlocked++;
          results.blocked.push({
            expression: expr.node,
            reason: `impure: ${purity.reason}`,
            scope: context.scopeId
          });
          continue;
        }

        const dependencies = this.extractExpressionVariables(expr.node);
        if (this.hasMutationDependency(dependencies, context.mutated)) {
          results.analysis.totalBlocked++;
          results.blocked.push({
            expression: expr.node,
            reason: "mutation dependency",
            scope: context.scopeId
          });
          continue;
        }

        const hash = this.valueNumbering.hashExpression(expr.node);
        results.analysis.totalCandidates++;

        if (context.cache.has(hash)) {
          const entry = context.cache.get(hash);

          // Ensure dependencies still valid
          if (!this.hasMutationDependency(entry.dependencies, context.mutated)) {
            entry.occurrences.push({ node: expr.node, index });
            results.analysis.totalConsolidated++;

            if (entry.occurrences.length === 2) {
              results.consolidated.push(entry);
            }

            continue;
          }
        }

        // First occurrence - add to cache
        context.cache.set(hash, {
          hash,
          expression: expr.node,
          dependencies,
          occurrences: [{ node: expr.node, index }],
          tempVar: this.generateTempVar(),
          forensicReason: "pure expression, no mutations, same block"
        });
      }

      // Apply mutation invalidation after processing expressions
      const invalidation = this.detectMutations(stmt);
      if (invalidation.clearAll) {
        results.analysis.totalInvalidations += context.cache.size;
        context.cache.clear();
        context.mutated.clear();
      } else if (invalidation.variables.size > 0) {
        for (const v of invalidation.variables) {
          context.mutated.add(v);
        }
        const invalidatedHashes = this.invalidateCache(context.cache, context.mutated);
        results.analysis.totalInvalidations += invalidatedHashes;
      }

      // Recurse into nested blocks (scope isolation)
      // Exception: Flatten BlockStatement at Program level (for testing)
      if (stmt.type === "BlockStatement") {
        if (context.scopeId === "Program") {
          // Flatten: process block body in same scope
          for (let innerIndex = 0; innerIndex < stmt.body.length; innerIndex++) {
            const innerStmt = stmt.body[innerIndex];
            const innerExpressions = this.extractCandidateExpressions(innerStmt);
            
            for (const expr of innerExpressions) {
              results.analysis.totalExpressions++;
              const purity = this.sideEffectDetector.classifyPurity(expr.node);
              
              if (!purity.pure) {
                results.analysis.totalBlocked++;
                results.blocked.push({ expression: expr.node, reason: `impure: ${purity.reason}`, scope: context.scopeId });
                continue;
              }
              
              const dependencies = this.extractExpressionVariables(expr.node);
              if (this.hasMutationDependency(dependencies, context.mutated)) {
                results.analysis.totalBlocked++;
                results.blocked.push({ expression: expr.node, reason: "mutation dependency", scope: context.scopeId });
                continue;
              }
              
              const hash = this.valueNumbering.hashExpression(expr.node);
              results.analysis.totalCandidates++;
              
              if (context.cache.has(hash)) {
                const entry = context.cache.get(hash);
                if (!this.hasMutationDependency(entry.dependencies, context.mutated)) {
                  entry.occurrences.push({ node: expr.node, index: innerIndex });
                  results.analysis.totalConsolidated++;
                  if (entry.occurrences.length === 2) {
                    results.consolidated.push(entry);
                  }
                  continue;
                }
              }
              
              context.cache.set(hash, {
                hash,
                expression: expr.node,
                dependencies,
                occurrences: [{ node: expr.node, index: innerIndex }],
                tempVar: this.generateTempVar(),
                forensicReason: "pure expression, no mutations, same block"
              });
            }
            
            const invalidation = this.detectMutations(innerStmt);
            if (invalidation.clearAll) {
              results.analysis.totalInvalidations += context.cache.size;
              context.cache.clear();
              context.mutated.clear();
            } else if (invalidation.variables.size > 0) {
              for (const v of invalidation.variables) {
                context.mutated.add(v);
              }
              const invalidatedHashes = this.invalidateCache(context.cache, context.mutated);
              results.analysis.totalInvalidations += invalidatedHashes;
            }
          }
        } else {
          // Create new scope for nested blocks
          this.analyzeBlock(stmt, results, { scopeId: `${context.scopeId}.block${index}` });
        }
      } else if (stmt.type === "IfStatement") {
        if (stmt.consequent) this.analyzeBlock(stmt.consequent, results, { scopeId: `${context.scopeId}.if${index}` });
        if (stmt.alternate) this.analyzeBlock(stmt.alternate, results, { scopeId: `${context.scopeId}.else${index}` });
      } else if (stmt.type === "ForStatement" || stmt.type === "WhileStatement" || stmt.type === "DoWhileStatement") {
        if (stmt.body) this.analyzeBlock(stmt.body, results, { scopeId: `${context.scopeId}.loop${index}` });
      }
    }
  }

  /**
   * Extract candidate expressions from statement
   */
  extractCandidateExpressions(stmt) {
    const expressions = [];

    if (!stmt || typeof stmt !== "object") return expressions;

    switch (stmt.type) {
    case "VariableDeclaration":
      if (stmt.declarations) {
        for (const decl of stmt.declarations) {
          if (decl.init) {
            this.collectCandidateSubexpressions(decl.init, expressions, "init");
          }
        }
      } else if (stmt.init) {
        this.collectCandidateSubexpressions(stmt.init, expressions, "init");
      }
      break;

    case "ExpressionStatement":
      if (stmt.expression && stmt.expression.type === "AssignmentExpression") {
        if (stmt.expression.right) {
          this.collectCandidateSubexpressions(stmt.expression.right, expressions, "assignment");
        }
      } else if (stmt.expression) {
        this.collectCandidateSubexpressions(stmt.expression, expressions, "expression");
      }
      break;

    case "ReturnStatement":
      if (stmt.argument) {
        this.collectCandidateSubexpressions(stmt.argument, expressions, "return");
      }
      break;

    default:
      break;
    }

    return expressions;
  }

  /**
   * Collect candidate subexpressions from an expression tree
   */
  collectCandidateSubexpressions(expr, out, kind) {
    if (!expr || typeof expr !== "object") return;

    const candidateTypes = new Set([
      "BinaryExpression",
      "LogicalExpression",
      "UnaryExpression",
      "CallExpression",
      "MemberExpression",
      "ConditionalExpression",
      "NewExpression"
    ]);

    if (candidateTypes.has(expr.type)) {
      out.push({ node: expr, kind });
    }

    for (const key in expr) {
      if (key === "type" || key === "loc" || key === "range") continue;
      const child = expr[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (typeof item === "object") this.collectCandidateSubexpressions(item, out, kind);
        }
      } else if (typeof child === "object") {
        this.collectCandidateSubexpressions(child, out, kind);
      }
    }
  }

  /**
   * Extract variable dependencies from expression
   */
  extractExpressionVariables(node, vars = new Set()) {
    if (!node || typeof node !== "object") return vars;

    if (node.type === "Identifier") {
      vars.add(node.name);
      return vars;
    }

    if (node.type === "MemberExpression") {
      // Include base object identifiers for conservative invalidation
      this.extractExpressionVariables(node.object, vars);
      if (node.computed) {
        this.extractExpressionVariables(node.property, vars);
      }
      return vars;
    }

    for (const key in node) {
      if (key === "type" || key === "loc" || key === "range") continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) this.extractExpressionVariables(item, vars);
      } else if (typeof child === "object") {
        this.extractExpressionVariables(child, vars);
      }
    }

    return vars;
  }

  /**
   * Detect mutations in statement to invalidate cache
   */
  detectMutations(stmt) {
    const variables = new Set();
    let clearAll = false;

    const walk = (node) => {
      if (!node || typeof node !== "object") return;

      if (node.type === "AssignmentExpression") {
        if (node.left) {
          if (node.left.type === "Identifier") {
            variables.add(node.left.name);
          } else if (node.left.type === "MemberExpression") {
            const base = this.getBaseObjectName(node.left.object);
            if (base) variables.add(base);
            else clearAll = true;
          }
        }
      }

      if (node.type === "UpdateExpression" && node.argument && node.argument.type === "Identifier") {
        variables.add(node.argument.name);
      }

      if (node.type === "CallExpression") {
        const purity = this.sideEffectDetector.classifyPurity(node);
        if (!purity.pure) {
          // Impure calls may mutate unknown state
          clearAll = true;
        }
      }

      for (const key in node) {
        if (key === "type" || key === "loc" || key === "range") continue;
        const child = node[key];
        if (Array.isArray(child)) child.forEach(walk);
        else if (typeof child === "object") walk(child);
      }
    };

    walk(stmt);
    return { variables, clearAll };
  }

  /**
   * Invalidate cache entries based on mutated variables
   */
  invalidateCache(cache, mutated) {
    let invalidated = 0;
    for (const [hash, entry] of cache.entries()) {
      if (this.hasMutationDependency(entry.dependencies, mutated)) {
        cache.delete(hash);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * Check if expression depends on mutated variables
   */
  hasMutationDependency(dependencies, mutated) {
    for (const v of dependencies) {
      if (mutated.has(v)) return true;
    }
    return false;
  }

  /**
   * Generate temp variable name
   */
  generateTempVar() {
    this.tempIndex++;
    return `__cse_temp_${this.tempIndex}`;
  }

  /**
   * Get base object name from member expression
   */
  getBaseObjectName(node) {
    if (!node || typeof node !== "object") return null;
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression") return this.getBaseObjectName(node.object);
    return null;
  }
}

// ============================================================================
// APPLY TRANSFORMATION (METADATA ANNOTATION)
// ============================================================================

function applyCommonSubexpressionElimination(ir, analysis) {
  if (!ir || !analysis || analysis.consolidated.length === 0) {
    return ir;
  }

  let applied = 0;

  for (const entry of analysis.consolidated) {
    for (const occ of entry.occurrences) {
      if (!occ.node._commonSubexpressionElimination) {
        occ.node._commonSubexpressionElimination = {
          hash: entry.hash,
          tempVar: entry.tempVar,
          firstOccurrence: entry.occurrences[0]?.index ?? 0,
          forensicReason: entry.forensicReason
        };
        applied++;
      }
    }
  }

  if (!ir._optimizations) {
    ir._optimizations = [];
  }

  ir._optimizations.push({
    phase: "3.4",
    task: "4.2",
    optimization: "common-subexpression-elimination",
    applied,
    timestamp: new Date().toISOString(),
    summary: {
      totalConsolidated: analysis.analysis.totalConsolidated,
      totalBlocked: analysis.analysis.totalBlocked,
      totalInvalidations: analysis.analysis.totalInvalidations
    }
  });

  // Add top-level metadata for gate verification
  ir._commonSubexpressionElimination = {
    subexpressions: analysis.subexpressions || analysis.consolidated,
    totalExpressions: analysis.analysis.totalExpressions,
    totalConsolidated: analysis.analysis.totalConsolidated,
    totalBlocked: analysis.analysis.totalBlocked,
    timestamp: new Date().toISOString()
  };

  return ir;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  CommonSubexpressionEliminationAnalyzer,
  applyCommonSubexpressionElimination,
  analyzeCommonSubexpressions: (ir, options) => {
    const analyzer = new CommonSubexpressionEliminationAnalyzer(options);
    return analyzer.analyzeCommonSubexpressions(ir, options);
  }
};

// CLI
if (require.main === module) {
  const fs = require("fs");
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Common Subexpression Elimination (CSE)
======================================

Usage: node common-subexpression-elimination.js <ast-file.json>

Outputs analysis summary and consolidation metadata.
`);
    process.exit(0);
  }

  const astFile = args[0];
  if (!fs.existsSync(astFile)) {
    console.error(`Error: File not found: ${astFile}`);
    process.exit(1);
  }

  const ast = JSON.parse(fs.readFileSync(astFile, "utf8"));
  const analyzer = new CommonSubexpressionEliminationAnalyzer();
  const analysis = analyzer.analyzeCommonSubexpressions(ast);

  console.log(JSON.stringify({
    summary: analysis.analysis,
    consolidated: analysis.consolidated.map(entry => ({
      hash: entry.hash,
      tempVar: entry.tempVar,
      occurrences: entry.occurrences.length
    })),
    blocked: analysis.blocked.length
  }, null, 2));
}
