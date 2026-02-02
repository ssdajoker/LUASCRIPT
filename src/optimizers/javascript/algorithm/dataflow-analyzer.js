#!/usr/bin/env node

/**
 * @fileoverview Dataflow Analysis for Loop Invariant Motion
 * 
 * Purpose: Foundation for Phase 3.4 optimization decisions - tracks variable
 * definitions, uses, and mutations accurately across the AST.
 * 
 * Provides:
 * - Definition-use chains for all variables
 * - Mutation tracking within loops
 * - Variable liveness analysis
 * - Scope-aware variable resolution
 * 
 * Forensic Note: This module implements conservative dataflow analysis.
 * When in doubt about safety, we classify as unsafe (NO optimization).
 * 
 * @module dataflow-analyzer
 * @phase 3.4
 * @task 4.1
 * @version 1.0.0
 */

// ============================================================================
// DATA STRUCTURES
// ============================================================================

class DataflowAnalysis {
  constructor() {
    // Variable name → Set of definition locations
    this.definitions = new Map();
    
    // Variable name → Set of use locations
    this.uses = new Map();
    
    // Variables mutated in current scope
    this.mutations = new Set();
    
    // Scope chain for variable resolution
    this.scopes = [new Map()]; // Stack of scope maps
    
    // Loop boundaries for context
    this.loopContext = null;
    
    // Results summary
    this.summary = {
      totalDefinitions: 0,
      totalUses: 0,
      totalMutations: 0,
      scopeDepth: 0
    };
  }

  /**
   * Enter a new scope
   */
  enterScope() {
    this.scopes.push(new Map());
    this.summary.scopeDepth = Math.max(this.summary.scopeDepth, this.scopes.length);
  }

  /**
   * Exit current scope
   */
  exitScope() {
    if (this.scopes.length > 1) {
      this.scopes.pop();
    }
  }

  /**
   * Get current scope
   */
  currentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  /**
   * Resolve variable in scope chain
   */
  resolveVariable(name) {
    // Search from innermost to outermost scope
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return {
          scope: i,
          definition: this.scopes[i].get(name)
        };
      }
    }
    return null; // Not found - assume global
  }

  /**
   * Record variable definition
   */
  recordDefinition(name, location, node) {
    if (!this.definitions.has(name)) {
      this.definitions.set(name, new Set());
    }
    this.definitions.get(name).add(location);
    
    // Add to current scope
    this.currentScope().set(name, { location, node });
    
    this.summary.totalDefinitions++;
  }

  /**
   * Record variable use
   */
  recordUse(name, location) {
    if (!this.uses.has(name)) {
      this.uses.set(name, new Set());
    }
    this.uses.get(name).add(location);
    
    this.summary.totalUses++;
  }

  /**
   * Record variable mutation
   */
  recordMutation(name, _location) {
    this.mutations.add(name);
    this.summary.totalMutations++;
  }

  /**
   * Check if variable is defined outside loop
   */
  isDefinedOutsideLoop(name, loopStart, loopEnd) {
    if (!this.definitions.has(name)) {
      return true; // Assume global/external
    }

    const defs = Array.from(this.definitions.get(name));
    return defs.every(loc => loc < loopStart || loc > loopEnd);
  }

  /**
   * Check if variable is mutated in loop
   */
  isMutatedInLoop(name) {
    return this.mutations.has(name);
  }
}

// ============================================================================
// DATAFLOW ANALYZER
// ============================================================================

class DataflowAnalyzer {
  constructor() {
    this.currentLocation = 0;
  }

  /**
   * Main entry point: Analyze AST for dataflow
   */
  analyzeDataflow(ast) {
    const analysis = new DataflowAnalysis();
    
    if (!ast || !ast.body) {
      return analysis;
    }

    this.currentLocation = 0;
    this.walkNode(ast, analysis);

    return analysis;
  }

  /**
   * Walk AST node recursively
   */
  walkNode(node, analysis) {
    if (!node || typeof node !== "object") {
      return;
    }

    this.currentLocation++;

    switch (node.type) {
    case "Program":
      this.walkProgram(node, analysis);
      break;
      
    case "VariableDeclaration":
      this.walkVariableDeclaration(node, analysis);
      break;
      
    case "Identifier":
      this.walkIdentifier(node, analysis);
      break;
      
    case "AssignmentExpression":
      this.walkAssignmentExpression(node, analysis);
      break;
      
    case "UpdateExpression":
      this.walkUpdateExpression(node, analysis);
      break;
      
    case "BinaryExpression":
    case "LogicalExpression":
      this.walkBinaryExpression(node, analysis);
      break;
      
    case "CallExpression":
      this.walkCallExpression(node, analysis);
      break;
      
    case "MemberExpression":
      this.walkMemberExpression(node, analysis);
      break;
      
    case "ForStatement":
      this.walkForStatement(node, analysis);
      break;
      
    case "WhileStatement":
    case "DoWhileStatement":
      this.walkWhileStatement(node, analysis);
      break;
      
    case "IfStatement":
      this.walkIfStatement(node, analysis);
      break;
      
    case "BlockStatement":
      this.walkBlockStatement(node, analysis);
      break;
      
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      this.walkFunction(node, analysis);
      break;
      
    case "ReturnStatement":
      this.walkReturnStatement(node, analysis);
      break;
      
    case "ExpressionStatement":
      this.walkExpressionStatement(node, analysis);
      break;
      
    default:
      // Walk children for unknown node types
      this.walkChildren(node, analysis);
    }
  }

  /**
   * Walk Program node
   */
  walkProgram(node, analysis) {
    for (const stmt of node.body) {
      this.walkNode(stmt, analysis);
    }
  }

  /**
   * Walk VariableDeclaration node
   */
  walkVariableDeclaration(node, analysis) {
    const name = node.id || (node.declarations && node.declarations[0]?.id?.name);
    if (name) {
      analysis.recordDefinition(name, this.currentLocation, node);
      
      // Walk initializer for uses
      if (node.init) {
        this.walkNode(node.init, analysis);
      }
    }
  }

  /**
   * Walk Identifier node (use)
   */
  walkIdentifier(node, analysis) {
    if (node.name) {
      analysis.recordUse(node.name, this.currentLocation);
    }
  }

  /**
   * Walk AssignmentExpression node
   */
  walkAssignmentExpression(node, analysis) {
    // Left side is a mutation
    if (node.left && node.left.type === "Identifier") {
      analysis.recordMutation(node.left.name, this.currentLocation);
    }
    
    // Right side contains uses
    this.walkNode(node.right, analysis);
  }

  /**
   * Walk UpdateExpression node (++, --)
   */
  walkUpdateExpression(node, analysis) {
    if (node.argument && node.argument.type === "Identifier") {
      analysis.recordMutation(node.argument.name, this.currentLocation);
      analysis.recordUse(node.argument.name, this.currentLocation);
    }
  }

  /**
   * Walk BinaryExpression node
   */
  walkBinaryExpression(node, analysis) {
    this.walkNode(node.left, analysis);
    this.walkNode(node.right, analysis);
  }

  /**
   * Walk CallExpression node
   */
  walkCallExpression(node, analysis) {
    this.walkNode(node.callee, analysis);
    
    if (node.arguments) {
      for (const arg of node.arguments) {
        this.walkNode(arg, analysis);
      }
    }
  }

  /**
   * Walk MemberExpression node
   */
  walkMemberExpression(node, analysis) {
    // Walk object (e.g., arr in arr.length)
    if (typeof node.object === "object") {
      this.walkNode(node.object, analysis);
    } else if (typeof node.object === "string") {
      // Handle simplified AST
      analysis.recordUse(node.object, this.currentLocation);
    }
    
    // Property is typically not a use (arr.length - length is property name)
    // But in computed access (arr[i]), i is a use
    if (node.computed && node.property) {
      this.walkNode(node.property, analysis);
    }
  }

  /**
   * Walk ForStatement node
   */
  walkForStatement(node, analysis) {
    analysis.enterScope();
    
    // Store loop context
    const loopStart = this.currentLocation;
    
    // Init: walk once before loop
    if (node.init) {
      this.walkNode(node.init, analysis);
    }
    
    // Test condition
    if (node.test) {
      this.walkNode(node.test, analysis);
    }
    
    // Save previous loop context
    const prevLoopContext = analysis.loopContext;
    analysis.loopContext = {
      start: loopStart,
      end: null, // Will be set after walking body
      mutations: new Set()
    };
    
    // Body: walk and track mutations
    if (node.body) {
      const beforeMutations = new Set(analysis.mutations);
      this.walkNode(node.body, analysis);
      const afterMutations = new Set(analysis.mutations);
      
      // Track mutations that happened in loop
      for (const mut of afterMutations) {
        if (!beforeMutations.has(mut)) {
          analysis.loopContext.mutations.add(mut);
        }
      }
    }
    
    analysis.loopContext.end = this.currentLocation;
    
    // Update: walk after body
    if (node.update) {
      this.walkNode(node.update, analysis);
    }
    
    // Restore previous loop context
    analysis.loopContext = prevLoopContext;
    
    analysis.exitScope();
  }

  /**
   * Walk WhileStatement node
   */
  walkWhileStatement(node, analysis) {
    analysis.enterScope();
    
    const loopStart = this.currentLocation;
    
    if (node.test) {
      this.walkNode(node.test, analysis);
    }
    
    const prevLoopContext = analysis.loopContext;
    analysis.loopContext = {
      start: loopStart,
      end: null,
      mutations: new Set()
    };
    
    if (node.body) {
      this.walkNode(node.body, analysis);
    }
    
    analysis.loopContext.end = this.currentLocation;
    analysis.loopContext = prevLoopContext;
    
    analysis.exitScope();
  }

  /**
   * Walk IfStatement node
   */
  walkIfStatement(node, analysis) {
    this.walkNode(node.test, analysis);
    this.walkNode(node.consequent, analysis);
    
    if (node.alternate) {
      this.walkNode(node.alternate, analysis);
    }
  }

  /**
   * Walk BlockStatement node
   */
  walkBlockStatement(node, analysis) {
    if (node.body) {
      for (const stmt of node.body) {
        this.walkNode(stmt, analysis);
      }
    }
  }

  /**
   * Walk Function node
   */
  walkFunction(node, analysis) {
    analysis.enterScope();
    
    // Parameters are definitions
    if (node.params) {
      for (const param of node.params) {
        if (param.type === "Identifier") {
          analysis.recordDefinition(param.name, this.currentLocation, param);
        }
      }
    }
    
    // Walk body
    if (node.body) {
      this.walkNode(node.body, analysis);
    }
    
    analysis.exitScope();
  }

  /**
   * Walk ReturnStatement node
   */
  walkReturnStatement(node, analysis) {
    if (node.argument) {
      this.walkNode(node.argument, analysis);
    }
  }

  /**
   * Walk ExpressionStatement node
   */
  walkExpressionStatement(node, analysis) {
    if (node.expression) {
      this.walkNode(node.expression, analysis);
    }
  }

  /**
   * Walk all children of unknown node
   */
  walkChildren(node, analysis) {
    for (const key in node) {
      if (key === "type" || key === "loc" || key === "range") {
        continue;
      }
      
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (typeof item === "object") {
            this.walkNode(item, analysis);
          }
        }
      } else if (typeof child === "object") {
        this.walkNode(child, analysis);
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  DataflowAnalyzer,
  DataflowAnalysis
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Dataflow Analyzer for Loop Invariant Motion
============================================

Usage: node dataflow-analyzer.js <ast-file.json>

Analyzes JavaScript AST for:
- Variable definitions (where variables are assigned)
- Variable uses (where variables are read)
- Variable mutations (where variables change)
- Scope information

Output: JSON with dataflow analysis results
`);
    process.exit(0);
  }

  const fs = require("fs");
  const astFile = args[0];
  
  if (!fs.existsSync(astFile)) {
    console.error(`Error: File not found: ${astFile}`);
    process.exit(1);
  }

  const ast = JSON.parse(fs.readFileSync(astFile, "utf8"));
  const analyzer = new DataflowAnalyzer();
  const analysis = analyzer.analyzeDataflow(ast);

  console.log(JSON.stringify({
    summary: analysis.summary,
    definitions: Array.from(analysis.definitions.entries()).map(([name, locs]) => ({
      variable: name,
      locations: Array.from(locs)
    })),
    uses: Array.from(analysis.uses.entries()).map(([name, locs]) => ({
      variable: name,
      locations: Array.from(locs)
    })),
    mutations: Array.from(analysis.mutations)
  }, null, 2));
}
