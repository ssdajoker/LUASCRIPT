/**
 * Example Third-Party Extensions
 * 
 * These examples demonstrate best practices for building LUASCRIPT extensions.
 * All examples are fully compatible with the Extension API v1.0.0
 * 
 * Usage: npm install luascript-examples
 */

const {
  IRTransform,
  IRVisitor,
  OptimizationPass,
  LoweringPass,
} = require('../../src/extensions/api');

// ============================================================================
// Example 1: Simple Dead Code Elimination (Optimization)
// ============================================================================

class DeadCodeEliminationPass extends OptimizationPass {
  constructor() {
    super({
      name: 'dead-code-elimination',
      version: '1.0.0',
      priority: 150,
      tags: ['optimization', 'perf-critical'],
      config: {
        aggressive: false, // Disable aggressive removal by default
      },
    });
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: 'Eliminates unreachable and unused code segments',
      inputTypes: ['Statement', 'Expression'],
      outputTypes: ['Statement', 'Expression'],
      details: {
        removes: ['dead blocks after return/throw', 'unused variables', 'empty statements'],
        preserves: ['semantic behavior', 'side effects'],
      },
    };
  }

  getInputTypes() {
    return ['VariableDeclaration', 'Statement', 'Block'];
  }

  transform(node, context = {}) {
    this.statistics.nodesProcessed++;

    // Skip null nodes
    if (!node) return null;

    // Check for definitely unreachable code
    if (node.type === 'Statement' && context.unreachable) {
      this.statistics.optimizationsApplied++;
      this.statistics.bytesReduced += this.estimateSize(node);
      return null; // Remove this node
    }

    // Remove unused variable declarations
    if (node.type === 'VariableDeclaration' && node.unused) {
      this.statistics.optimizationsApplied++;
      this.statistics.bytesReduced += this.estimateSize(node);
      return null;
    }

    // Mark statements after return as unreachable
    if (node.type === 'Block' && node.statements) {
      let foundReturn = false;
      node.statements = node.statements.filter((stmt, idx) => {
        if (foundReturn) {
          this.statistics.optimizationsApplied++;
          return false; // Filter out
        }
        if (stmt.type === 'ReturnStatement' || stmt.type === 'ThrowStatement') {
          foundReturn = true;
        }
        return true;
      });
    }

    return node;
  }

  estimateSize(node) {
    // Rough estimation for demo purposes
    const json = JSON.stringify(node);
    return Math.ceil(json.length / 2);
  }

  validate(original, transformed) {
    // Ensure we didn't accidentally break semantics
    return {
      valid: transformed === null || transformed.type === original.type,
      errors: [],
    };
  }
}

// ============================================================================
// Example 2: Visitor-Based Inlining Transform
// ============================================================================

class InlineSimpleFunctionsTransform extends IRVisitor {
  constructor() {
    super({
      name: 'inline-simple-functions',
      version: '1.0.0',
      priority: 120,
      tags: ['optimization', 'inlining'],
    });
    this.inlinedCount = 0;
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: 'Inlines simple one-liner functions at call sites',
      inputTypes: ['FunctionCall'],
      outputTypes: ['Expression'],
      notes: 'Only inlines functions with single return statement',
    };
  }

  onEnter(node, context = {}) {
    // Try to inline function calls
    if (node.type === 'FunctionCall' && this.isSimpleFunction(node.callee)) {
      const inlined = this.inlineFunction(node);
      if (inlined) {
        this.inlinedCount++;
        return inlined;
      }
    }

    return null; // Keep original
  }

  isSimpleFunction(func) {
    if (!func || func.type !== 'FunctionExpression') return false;
    if (!func.body || func.body.length !== 1) return false;

    const stmt = func.body[0];
    return stmt.type === 'ReturnStatement';
  }

  inlineFunction(callNode) {
    try {
      const func = callNode.callee;
      const returnStmt = func.body[0];

      // Map arguments to parameters
      const paramMap = {};
      for (let i = 0; i < func.params.length; i++) {
        paramMap[func.params[i].name] = callNode.arguments[i];
      }

      // Replace parameters in return expression
      return this.replaceParameters(returnStmt.value, paramMap);
    } catch (error) {
      return null; // Can't inline, keep original
    }
  }

  replaceParameters(expr, paramMap) {
    if (!expr) return null;

    if (expr.type === 'Identifier' && paramMap[expr.name]) {
      return { ...paramMap[expr.name] };
    }

    if (expr.children) {
      expr.children = expr.children.map(child =>
        this.replaceParameters(child, paramMap)
      );
    }

    return expr;
  }

  getStatistics() {
    return {
      inlinedFunctions: this.inlinedCount,
    };
  }
}

// ============================================================================
// Example 3: Lowering Pass for Complex Expressions
// ============================================================================

class LowerChainedComparisonsPass extends LoweringPass {
  constructor() {
    super({
      name: 'lower-chained-comparisons',
      version: '1.0.0',
      priority: 200,
      tags: ['lowering', 'canonicalization'],
    });
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: 'Lowers chained comparisons to binary operations',
      inputTypes: ['ChainedComparison'],
      outputTypes: ['BinaryOp'],
      example: 'a < b < c  →  (a < b) && (b < c)',
    };
  }

  getInputTypes() {
    return ['ChainedComparison'];
  }

  transform(node) {
    if (node.type !== 'ChainedComparison') return node;

    // Convert: a < b < c  to  (a < b) && (b < c)
    const comparisons = node.comparisons; // Array of {left, op, right}
    if (comparisons.length < 2) return node;

    let result = {
      type: 'BinaryOp',
      operator: comparisons[0].op,
      left: comparisons[0].left,
      right: comparisons[0].right,
    };

    for (let i = 1; i < comparisons.length; i++) {
      result = {
        type: 'BinaryOp',
        operator: '&&',
        left: result,
        right: {
          type: 'BinaryOp',
          operator: comparisons[i].op,
          left: comparisons[i].left,
          right: comparisons[i].right,
        },
      };
    }

    return result;
  }

  validate(original, transformed) {
    if (!transformed || transformed.type !== 'BinaryOp') {
      return {
        valid: false,
        errors: ['Output must be BinaryOp'],
      };
    }

    return {
      valid: true,
      errors: [],
    };
  }
}

// ============================================================================
// Example 4: Analysis Transform (Read-Only)
// ============================================================================

class VariableUsageAnalysisTransform extends IRVisitor {
  constructor() {
    super({
      name: 'variable-usage-analysis',
      version: '1.0.0',
      priority: 10, // Run early
      tags: ['analysis', 'read-only'],
      config: {
        trackTypes: true,
        trackAssignments: true,
      },
    });

    this.variables = new Map(); // name -> {declarations, uses, assignments}
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: 'Analyzes variable usage patterns',
      inputTypes: ['Program'],
      outputTypes: ['Program'], // Doesn't modify tree
      sideEffects: true, // Builds analysis data
    };
  }

  onEnter(node) {
    if (node.type === 'VariableDeclaration') {
      if (!this.variables.has(node.name)) {
        this.variables.set(node.name, {
          declarations: 0,
          uses: 0,
          assignments: 0,
          types: new Set(),
        });
      }
      this.variables.get(node.name).declarations++;
    }

    if (node.type === 'Identifier') {
      if (!this.variables.has(node.name)) {
        this.variables.set(node.name, {
          declarations: 0,
          uses: 0,
          assignments: 0,
          types: new Set(),
        });
      }
      this.variables.get(node.name).uses++;
    }

    if (node.type === 'Assignment') {
      if (!this.variables.has(node.target.name)) {
        this.variables.set(node.target.name, {
          declarations: 0,
          uses: 0,
          assignments: 0,
          types: new Set(),
        });
      }
      this.variables.get(node.target.name).assignments++;
    }

    return null; // Don't modify
  }

  transform(node) {
    // Run analysis then return unchanged
    this.visit(node);
    return node;
  }

  getAnalysis() {
    return Object.fromEntries(this.variables);
  }

  getUnusedVariables() {
    const unused = [];
    for (const [name, info] of this.variables) {
      if (info.declarations > 0 && info.uses === 0) {
        unused.push(name);
      }
    }
    return unused;
  }
}

// ============================================================================
// Example 5: Complex Multi-Pass Optimization
// ============================================================================

class ConstantPropagationPass extends OptimizationPass {
  constructor() {
    super({
      name: 'constant-propagation',
      version: '1.0.0',
      priority: 110,
      tags: ['optimization', 'perf-sensitive'],
    });

    this.constants = new Map(); // name -> value
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: 'Propagates constant values and replaces with literals',
      inputTypes: ['Expression', 'Statement'],
      outputTypes: ['Expression', 'Statement'],
      complexity: 'O(n) for single pass, typically run multiple times',
    };
  }

  transform(node, context = {}) {
    this.statistics.nodesProcessed++;

    // Track constant assignments
    if (node.type === 'VariableDeclaration' && this.isConstant(node.initializer)) {
      this.constants.set(node.name, node.initializer.value);
    }

    // Replace identifier with constant
    if (node.type === 'Identifier' && this.constants.has(node.name)) {
      this.statistics.optimizationsApplied++;
      return {
        type: 'Literal',
        value: this.constants.get(node.name),
      };
    }

    return node;
  }

  isConstant(expr) {
    if (!expr) return false;
    return expr.type === 'Literal' || (expr.type === 'Identifier' && this.constants.has(expr.name));
  }

  validate(original, transformed) {
    // Ensure value is correct type
    if (transformed.type === 'Literal') {
      return {
        valid: transformed.value !== undefined,
        errors: [],
      };
    }
    return { valid: true, errors: [] };
  }
}

// ============================================================================
// Export all examples
// ============================================================================

module.exports = {
  DeadCodeEliminationPass,
  InlineSimpleFunctionsTransform,
  LowerChainedComparisonsPass,
  VariableUsageAnalysisTransform,
  ConstantPropagationPass,

  // Helper to load all examples
  getAllExamples() {
    return [
      new DeadCodeEliminationPass(),
      new InlineSimpleFunctionsTransform(),
      new LowerChainedComparisonsPass(),
      new VariableUsageAnalysisTransform(),
      new ConstantPropagationPass(),
    ];
  },

  // Helper to register all
  registerAll(registry) {
    this.getAllExamples().forEach(ex => registry.register(ex));
  },
};
