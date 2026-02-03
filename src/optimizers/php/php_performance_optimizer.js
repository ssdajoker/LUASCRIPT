"use strict";

/**
 * PHP Performance Optimizer - Phase C Speed Optimization
 * Applies speed-focused optimizations to PHP canonical IR
 * 
 * Optimizations:
 * 1. Dead code elimination (after return/throw/break/continue)
 * 2. Constant folding (PHP operators: ., ===, !==, etc.)
 * 3. Loop optimization (foreach unrolling, loop invariant code motion)
 * 4. String optimization (concatenation optimization)
 * 5. Array optimization (isset/empty checks)
 * 6. Function call optimization (inline small functions)
 * 
 * Target: 30-50% speed improvement
 */

class PHPPerformanceOptimizer {
  constructor(options = {}) {
    this.options = options;
    this.stats = {
      deadCodeRemoved: 0,
      constantsFolded: 0,
      loopsOptimized: 0,
      stringsOptimized: 0,
      arraysOptimized: 0,
      functionsInlined: 0,
    };
  }

  /**
   * Main entry: Apply all optimizations
   */
  optimize(ir) {
    if (!ir || !ir.nodes) {
      throw new Error("Invalid IR: missing nodes");
    }

    this.stats = {
      deadCodeRemoved: 0,
      constantsFolded: 0,
      loopsOptimized: 0,
      stringsOptimized: 0,
      arraysOptimized: 0,
      functionsInlined: 0,
    };

    let optimized = JSON.parse(JSON.stringify(ir));

    // Pass 1: Dead code elimination
    optimized = this.eliminateDeadCode(optimized);

    // Pass 2: Constant folding
    optimized = this.foldConstants(optimized);

    // Pass 3: Loop optimization
    optimized = this.optimizeLoops(optimized);

    // Pass 4: String optimization
    optimized = this.optimizeStrings(optimized);

    // Pass 5: Array optimization
    optimized = this.optimizeArrays(optimized);

    // Pass 6: Function call optimization
    optimized = this.optimizeFunctionCalls(optimized);

    // Update metadata
    if (optimized.module) {
      optimized.module.phase = "C";
      optimized.module.optimized = true;
    }

    optimized.optimizationStats = this.stats;

    return optimized;
  }

  /**
   * Pass 1: Dead code elimination
   * Remove unreachable code after control flow terminators
   */
  eliminateDeadCode(ir) {
    const optimized = JSON.parse(JSON.stringify(ir));

    this.visitNodeArrays(optimized, (nodes, parent, key) => {
      const reachableCode = [];
      let foundTerminator = false;

      // Use for loop instead of forEach (Ruby bug lesson)
      for (const node of nodes) {
        // Skip dead code after terminator
        if (foundTerminator && node.type !== "FunctionDeclaration" && node.type !== "ClassDeclaration") {
          this.stats.deadCodeRemoved++;
          continue;
        }

        // Check if node is a terminator
        if (this.isControlFlowTerminator(node)) {
          foundTerminator = true;
          reachableCode.push(node);
          continue;
        }

        // Remove unused variables
        if (node.type === "VariableDeclaration" && !this.isVariableUsed(node, nodes)) {
          if (!this.hasSideEffects(node)) {
            this.stats.deadCodeRemoved++;
            continue;
          }
        }

        reachableCode.push(node);
      }

      // Replace array with reachable code
      if (reachableCode.length < nodes.length) {
        parent[key] = reachableCode;
      }
    });

    return optimized;
  }

  /**
   * Pass 2: Constant folding
   * Evaluate constant expressions at compile time
   */
  foldConstants(ir) {
    const optimized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(optimized, (node, parent, key) => {
      // Fold binary expressions
      if (node.type === "BinaryExpression" && this.isConstantExpression(node)) {
        const folded = this.evaluateConstantExpression(node);
        if (folded !== null && parent && key) {
          parent[key] = {
            type: "Literal",
            value: folded,
            foldedFrom: node.operator,
          };
          this.stats.constantsFolded++;
        }
      }

      // Fold unary expressions
      if (node.type === "UnaryExpression" && this.isConstantExpression(node.argument)) {
        const folded = this.evaluateUnaryExpression(node);
        if (folded !== null && parent && key) {
          parent[key] = {
            type: "Literal",
            value: folded,
            foldedFrom: node.operator,
          };
          this.stats.constantsFolded++;
        }
      }

      // Fold logical expressions
      if (node.type === "LogicalExpression") {
        const folded = this.evaluateLogicalExpression(node);
        if (folded !== null && parent && key) {
          parent[key] = folded;
          this.stats.constantsFolded++;
        }
      }
    });

    return optimized;
  }

  /**
   * Pass 3: Loop optimization
   * Unroll small loops and hoist invariant code
   */
  optimizeLoops(ir) {
    const optimized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(optimized, (node, parent, key) => {
      // Unroll foreach loops with small arrays
      if ((node.type === "ForInStatement" || node.type === "ForEachStatement") && this.canUnrollLoop(node)) {
        const unrolled = this.unrollLoop(node);
        if (unrolled && parent && key) {
          parent[key] = unrolled;
          this.stats.loopsOptimized++;
        }
      }

      // Hoist loop-invariant code
      if (node.type === "WhileStatement" || node.type === "ForStatement") {
        const hoisted = this.hoistLoopInvariantCode(node);
        if (hoisted && parent && key) {
          parent[key] = hoisted;
          this.stats.loopsOptimized++;
        }
      }
    });

    return optimized;
  }

  /**
   * Pass 4: String optimization
   * Optimize string concatenation and operations
   */
  optimizeStrings(ir) {
    const optimized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(optimized, (node, parent, key) => {
      // Optimize string concatenation chains
      if (node.type === "BinaryExpression" && (node.operator === "." || node.phpConcatenation)) {
        const concatenated = this.concatenateStrings(node);
        if (concatenated && parent && key) {
          parent[key] = concatenated;
          this.stats.stringsOptimized++;
        }
      }

      // Optimize empty string checks
      if (node.type === "BinaryExpression" && node.operator === "===" && this.isEmptyStringCheck(node)) {
        parent[key] = this.optimizeEmptyStringCheck(node);
        this.stats.stringsOptimized++;
      }
    });

    return optimized;
  }

  /**
   * Pass 5: Array optimization
   * Optimize array operations and checks
   */
  optimizeArrays(ir) {
    const optimized = JSON.parse(JSON.stringify(ir));

    this.visitNodes(optimized, (node, parent, key) => {
      // Optimize isset() checks
      if (node.type === "CallExpression" && node.phpBuiltin === "isset") {
        const optimizedCheck = this.optimizeIssetCheck(node);
        if (optimizedCheck && parent && key) {
          parent[key] = optimizedCheck;
          this.stats.arraysOptimized++;
        }
      }

      // Optimize empty() checks
      if (node.type === "CallExpression" && node.phpBuiltin === "empty") {
        const optimizedCheck = this.optimizeEmptyCheck(node);
        if (optimizedCheck && parent && key) {
          parent[key] = optimizedCheck;
          this.stats.arraysOptimized++;
        }
      }

      // Optimize array access patterns
      if (node.type === "MemberExpression" && node.canonicalArrayAccess) {
        const optimizedAccess = this.optimizeArrayAccess(node);
        if (optimizedAccess && parent && key) {
          parent[key] = optimizedAccess;
          this.stats.arraysOptimized++;
        }
      }
    });

    return optimized;
  }

  /**
   * Pass 6: Function call optimization
   * Inline small functions
   */
  optimizeFunctionCalls(ir) {
    const optimized = JSON.parse(JSON.stringify(ir));

    // Build function map
    const functionMap = this.buildFunctionMap(optimized);

    this.visitNodes(optimized, (node, parent, key) => {
      if (node.type === "CallExpression" && node.callee && node.callee.name) {
        const funcName = node.callee.name;
        const funcDef = functionMap.get(funcName);

        if (funcDef && this.shouldInlineFunction(funcDef)) {
          const inlined = this.inlineFunction(node, funcDef);
          if (inlined && parent && key) {
            parent[key] = inlined;
            this.stats.functionsInlined++;
          }
        }
      }
    });

    return optimized;
  }

  /**
   * Check if node is a control flow terminator
   */
  isControlFlowTerminator(node) {
    return (
      node.type === "ReturnStatement" ||
      node.type === "ThrowStatement" ||
      node.type === "BreakStatement" ||
      node.type === "ContinueStatement"
    );
  }

  /**
   * Check if variable is used elsewhere
   */
  isVariableUsed(varNode, nodes) {
    // Simplified check - assumes used if name appears in other nodes
    const varName = varNode.declarations && varNode.declarations[0] && varNode.declarations[0].id && varNode.declarations[0].id.name;
    if (!varName) return true; // Conservative: assume used if can't determine

    const usages = nodes.filter(n => {
      const str = JSON.stringify(n);
      return str.includes(varName) && n !== varNode;
    });

    return usages.length > 0;
  }

  /**
   * Check if node has side effects
   */
  hasSideEffects(node) {
    if (node.type === "CallExpression") return true;
    if (node.type === "NewExpression") return true;
    if (node.type === "AssignmentExpression") return true;
    if (node.type === "UpdateExpression") return true;

    // Check init for variable declarations
    if (node.type === "VariableDeclaration" && node.declarations) {
      return node.declarations.some(decl => decl.init && this.hasSideEffects(decl.init));
    }

    return false;
  }

  /**
   * Check if expression is constant
   */
  isConstantExpression(expr) {
    if (!expr) return false;
    if (expr.type === "Literal") return true;

    if (expr.type === "BinaryExpression" || expr.type === "LogicalExpression") {
      return this.isConstantExpression(expr.left) && this.isConstantExpression(expr.right);
    }

    if (expr.type === "UnaryExpression") {
      return this.isConstantExpression(expr.argument);
    }

    return false;
  }

  /**
   * Evaluate constant binary expression
   */
  evaluateConstantExpression(node) {
    if (!this.isConstantExpression(node.left) || !this.isConstantExpression(node.right)) {
      return null;
    }

    const left = node.left.value;
    const right = node.right.value;
    const op = node.operator;

    try {
      switch (op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return right !== 0 ? left / right : null;
      case "%":
        return left % right;
      case "**":
        return left ** right;
      case ".": // PHP concatenation
        return String(left) + String(right);
      case "==":
        // eslint-disable-next-line eqeqeq
        return left == right;
      case "!=":
        // eslint-disable-next-line eqeqeq
        return left != right;
      case "===":
        return left === right;
      case "!==":
        return left !== right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      case "&&":
        return left && right;
      case "||":
        return left || right;
      default:
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Evaluate constant unary expression
   */
  evaluateUnaryExpression(node) {
    if (!this.isConstantExpression(node.argument)) {
      return null;
    }

    const arg = node.argument.value;
    const op = node.operator;

    switch (op) {
    case "!":
      return !arg;
    case "-":
      return -arg;
    case "+":
      return +arg;
    case "~":
      return ~arg;
    default:
      return null;
    }
  }

  /**
   * Evaluate logical expression (short-circuit)
   */
  evaluateLogicalExpression(node) {
    if (node.operator === "&&" && this.isConstantExpression(node.left)) {
      // Short-circuit: false && x => false
      if (!node.left.value) {
        return { type: "Literal", value: false };
      }
      // Short-circuit: true && x => x
      return node.right;
    }

    if (node.operator === "||" && this.isConstantExpression(node.left)) {
      // Short-circuit: true || x => true
      if (node.left.value) {
        return { type: "Literal", value: true };
      }
      // Short-circuit: false || x => x
      return node.right;
    }

    return null;
  }

  /**
   * Check if loop can be unrolled
   */
  canUnrollLoop(node) {
    // Unroll if iterating over small literal array
    if (node.right && node.right.type === "ArrayExpression") {
      const elements = node.right.elements || [];
      return elements.length > 0 && elements.length <= 4; // Unroll up to 4 iterations
    }
    return false;
  }

  /**
   * Unroll loop
   */
  unrollLoop(node) {
    if (!this.canUnrollLoop(node)) return null;

    const elements = node.right.elements;
    const body = node.body;
    const variable = node.left;

    const unrolledStatements = [];

    for (const element of elements) {
      // Clone body and substitute variable
      const iterationBody = JSON.parse(JSON.stringify(body));
      this.substituteVariable(iterationBody, variable, element);
      unrolledStatements.push(iterationBody);
    }

    return {
      type: "BlockStatement",
      body: unrolledStatements,
      unrolled: true,
    };
  }

  /**
   * Substitute variable in AST
   */
  substituteVariable(ast, variable, value) {
    this.visitNodes(ast, (node, parent, key) => {
      if (node.type === "Identifier" && node.name === variable.name) {
        parent[key] = value;
      }
    });
  }

  /**
   * Hoist loop-invariant code
   */
  hoistLoopInvariantCode(node) {
    // Simplified: hoist declarations that don't reference loop variable
    const body = node.body;
    if (!body || !body.body || !Array.isArray(body.body)) return null;

    const hoisted = [];
    const remaining = [];

    for (const stmt of body.body) {
      if (this.isLoopInvariant(stmt, node)) {
        hoisted.push(stmt);
      } else {
        remaining.push(stmt);
      }
    }

    if (hoisted.length === 0) return null;

    return {
      type: "BlockStatement",
      body: [
        ...hoisted,
        {
          ...node,
          body: {
            type: "BlockStatement",
            body: remaining,
          },
        },
      ],
    };
  }

  /**
   * Check if statement is loop-invariant
   */
  isLoopInvariant(stmt, loopNode) {
    // Simplified: check if statement references loop variable
    const stmtStr = JSON.stringify(stmt);
    
    // Get loop variable name
    let loopVar = null;
    if (loopNode.type === "ForStatement" && loopNode.init) {
      loopVar = loopNode.init.declarations && loopNode.init.declarations[0] && loopNode.init.declarations[0].id && loopNode.init.declarations[0].id.name;
    }

    return loopVar && !stmtStr.includes(loopVar);
  }

  /**
   * Concatenate string literals
   */
  concatenateStrings(node) {
    if (!this.isConstantExpression(node.left) || !this.isConstantExpression(node.right)) {
      return null;
    }

    const leftVal = String(node.left.value);
    const rightVal = String(node.right.value);

    return {
      type: "Literal",
      value: leftVal + rightVal,
      concatenated: true,
    };
  }

  /**
   * Check if expression is empty string check
   */
  isEmptyStringCheck(node) {
    return (
      (node.left.type === "Literal" && node.left.value === "") ||
      (node.right.type === "Literal" && node.right.value === "")
    );
  }

  /**
   * Optimize empty string check
   */
  optimizeEmptyStringCheck(node) {
    // $str === "" => empty($str)
    const variable = node.left.type === "Identifier" ? node.left : node.right;
    return {
      type: "UnaryExpression",
      operator: "!",
      argument: variable,
    };
  }

  /**
   * Optimize isset() check
   */
  optimizeIssetCheck(node) {
    // isset($var) => $var !== null && $var !== undefined
    const arg = node.arguments && node.arguments[0];
    if (!arg) return null;

    return {
      type: "LogicalExpression",
      operator: "&&",
      left: {
        type: "BinaryExpression",
        operator: "!==",
        left: arg,
        right: { type: "Literal", value: null },
      },
      right: {
        type: "BinaryExpression",
        operator: "!==",
        left: arg,
        right: { type: "Identifier", name: "undefined" },
      },
    };
  }

  /**
   * Optimize empty() check
   */
  optimizeEmptyCheck(node) {
    // empty($var) => !$var
    const arg = node.arguments && node.arguments[0];
    if (!arg) return null;

    return {
      type: "UnaryExpression",
      operator: "!",
      argument: arg,
    };
  }

  /**
   * Optimize array access
   */
  optimizeArrayAccess(node) {
    // Constant propagation for array access
    if (node.property && node.property.type === "Literal") {
      return {
        ...node,
        constantIndex: true,
      };
    }
    return null;
  }

  /**
   * Build function map
   */
  buildFunctionMap(ir) {
    const map = new Map();

    this.visitNodes(ir, (node) => {
      if (node.type === "FunctionDeclaration" && node.name) {
        map.set(node.name, node);
      }
    });

    return map;
  }

  /**
   * Check if function should be inlined
   */
  shouldInlineFunction(funcDef) {
    // Inline if body has <= 2 statements
    const body = funcDef.body;
    if (!body || !Array.isArray(body)) return false;
    return body.length <= 2;
  }

  /**
   * Inline function
   */
  inlineFunction(callNode, funcDef) {
    // Simplified inlining: replace call with function body
    const body = funcDef.body;
    const args = callNode.arguments || [];
    const params = funcDef.params || [];

    // Clone body
    const inlinedBody = JSON.parse(JSON.stringify(body));

    // Substitute parameters with arguments
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const arg = args[i];
      if (param && arg) {
        this.substituteVariable(inlinedBody, param, arg);
      }
    }

    return {
      type: "BlockStatement",
      body: inlinedBody,
      inlined: true,
    };
  }

  /**
   * Visit all nodes in IR tree
   */
  visitNodes(ir, callback, parent = null, key = null) {
    if (!ir || typeof ir !== "object") return;

    if (ir.type) {
      callback(ir, parent, key);
    }

    for (const [childKey, childValue] of Object.entries(ir)) {
      if (Array.isArray(childValue)) {
        for (let i = 0; i < childValue.length; i++) {
          this.visitNodes(childValue[i], callback, ir, childKey);
        }
      } else if (childValue && typeof childValue === "object") {
        this.visitNodes(childValue, callback, ir, childKey);
      }
    }
  }

  /**
   * Visit node arrays (for DCE)
   */
  visitNodeArrays(ir, callback) {
    if (!ir || typeof ir !== "object") return;

    for (const [key, value] of Object.entries(ir)) {
      if (Array.isArray(value) && value.length > 0 && value[0] && value[0].type) {
        callback(value, ir, key);
      }
      
      if (typeof value === "object") {
        this.visitNodeArrays(value, callback);
      }
    }
  }
}

module.exports = PHPPerformanceOptimizer;
