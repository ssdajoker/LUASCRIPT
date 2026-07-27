"use strict";

const { IRBuilder } = require("./builder");
const { normalizeProgram } = require("./normalizer");
const { LoopLowerer } = require("./loop_lowerer");
const { TryLowerer } = require("./try_lowerer");
const { ClassLowerer } = require("./class_lowerer");
const { createStatementDispatch } = require("./statement_dispatch");

class IRLowerer {
  constructor(options = {}) {
    const {
      sourcePath = null,
      sourceHash = null,
      directives = [],
      metadata = {},
      toolchain = {},
      schemaVersion = "1.0.0",
    } = options;

    this.options = options;
    this.builder = new IRBuilder({
      schemaVersion,
      source: { path: sourcePath, hash: sourceHash },
      directives,
      metadata,
      toolchain,
    });

    this.loopLowerer = new LoopLowerer(this);
    this.tryLowerer = new TryLowerer(this);
    this.classLowerer = new ClassLowerer(this);
    this.statementDispatch = createStatementDispatch(this);
    this.destructuringIndex = 0;

    // Scope management for enhanced lowering (async/generators/classes)
    this.scopeStack = [{ bindings: new Set(), parent: null }];
    this.tempVarCounter = 0;
  }

  // ========== Scope Management (Enhanced) ==========
  pushScope() {
    this.scopeStack.push({ bindings: new Set(), parent: this.scopeStack[this.scopeStack.length - 1] });
  }

  popScope() {
    this.scopeStack.pop();
  }

  getCurrentScope() {
    return this.scopeStack[this.scopeStack.length - 1];
  }

  addBinding(name) {
    this.getCurrentScope().bindings.add(name);
  }

  hasBinding(name) {
    let scope = this.getCurrentScope();
    while (scope) {
      if (scope.bindings.has(name)) return true;
      scope = scope.parent;
    }
    return false;
  }

  createTempVar(prefix = "__tmp") {
    return `${prefix}_${++this.tempVarCounter}`;
  }

  resetEnhancedState() {
    this.scopeStack = [{ bindings: new Set(), parent: null }];
    this.tempVarCounter = 0;
  }

  lowerProgram(programNode) {
    const normalized = normalizeProgram(programNode);

    normalized.body.forEach((statement) => {
      this.lowerStatement(statement, { pushToBody: true });
    });

    return this.builder.build({ validate: this.options.validate !== false });
  }

  lowerStatement(node, context = {}) {
    if (!node) {
      return null;
    }

    const shouldPush = Boolean(context.pushToBody);
    const handler = this.statementDispatch[node.type];

    if (handler) {
      const lowered = handler.lower(node, { ...context, pushToBody: shouldPush });
      if (handler.pushToBody && shouldPush && lowered) {
        this.builder.pushToBody(lowered);
      }
      return lowered;
    }

    const lowered = this.lowerExpressionAsStatement(node);
    if (shouldPush && lowered) {
      this.builder.pushToBody(lowered);
    }
    return lowered;
  }

  lowerBlockStatement(node) {
    const statementIds = [];
    (node.body || []).forEach((statement) => {
      const lowered = this.lowerStatement(statement, { pushToBody: false });
      if (lowered) {
        statementIds.push(lowered.id);
      }
    });
    return this.builder.blockStatement(statementIds);
  }

  lowerVariableDeclaration(node) {
    const declarations = [];
    const extraStatements = [];
    node.declarations.forEach((decl) => {
      const initRef = decl.init ? this.lowerExpression(decl.init) : null;
      
      // Handle different pattern types for id
      if (decl.id.type === "Identifier") {
        declarations.push(this.builder.varDecl(decl.id.name, initRef, null, {
          kind: node.kind,
        }));
      } else if (decl.id.type === "ArrayPattern") {
        const tempName = `_destructure_${++this.destructuringIndex}`;
        const tempVar = this.builder.varDecl(tempName, initRef, null, { kind: node.kind });
        declarations.push(tempVar);
        const tempId = this.builder.identifier(tempName).id;
        this.lowerArrayPatternBindings(decl.id, tempId, declarations, node.kind, extraStatements);
      } else if (decl.id.type === "ObjectPattern") {
        const tempName = `_destructure_${++this.destructuringIndex}`;
        const tempVar = this.builder.varDecl(tempName, initRef, null, { kind: node.kind });
        declarations.push(tempVar);
        const tempId = this.builder.identifier(tempName).id;
        this.lowerObjectPatternBindings(decl.id, tempId, declarations, node.kind, extraStatements);
      } else {
        throw new Error(`Unsupported declarator id type: ${decl.id.type}`);
      }
    });

    const varDecl = this.builder.variableDeclaration(declarations, { kind: node.kind });
    if (extraStatements.length > 0) {
      const statementIds = [varDecl.id, ...extraStatements.map(stmt => stmt.id)];
      return this.builder.blockStatement(statementIds);
    }

    return varDecl;
  }

  lowerDestructuringDefault(memberId, defaultValueId) {
    const nilId = this.builder.literal(null).id;
    const testId = this.builder.binaryExpression(memberId, "!=", nilId).id;
    return this.builder.conditionalExpression(testId, memberId, defaultValueId).id;
  }

  lowerArrayPatternBindings(pattern, sourceId, declarations, kind, extraStatements = []) {
    const elements = pattern.elements || [];
    elements.forEach((el, index) => {
      if (!el) return;

      if (el.type === "RestElement") {
        const restArg = el.argument;
        if (restArg && restArg.type === "Identifier") {
          const restName = restArg.name;
          const restId = this.builder.identifier(restName).id;
          const emptyArrayId = this.builder.arrayExpression([]).id;
          declarations.push(this.builder.varDecl(restName, emptyArrayId, null, { kind }));

          const startIndexId = this.builder.literal(index + 1).id;
          const loopIndexName = this.createTempVar("__rest_i");
          const loopIndexId = this.builder.identifier(loopIndexName).id;
          const initVar = this.builder.varDecl(loopIndexName, startIndexId, null, { kind });
          const initDecl = this.builder.variableDeclaration([initVar], { kind });

          const lengthPropId = this.builder.identifier("length").id;
          const lengthId = this.builder.memberExpression(sourceId, lengthPropId, false).id;
          const conditionId = this.builder.binaryExpression(loopIndexId, "<=", lengthId).id;
          const updateId = this.builder.updateExpression("++", loopIndexId, { prefix: false }).id;

          const tableId = this.builder.identifier("table").id;
          const insertId = this.builder.identifier("insert").id;
          const insertFnId = this.builder.memberExpression(tableId, insertId, false).id;
          const valueId = this.builder.memberExpression(sourceId, loopIndexId, true).id;
          const callId = this.builder.callExpression(insertFnId, [restId, valueId]).id;
          const callStmt = this.builder.expressionStatement(callId);
          const bodyBlock = this.builder.blockStatement([callStmt.id]);

          const forStmt = this.builder.forStatement(initDecl.id, conditionId, updateId, bodyBlock.id);
          extraStatements.push(forStmt);
        }
        return;
      }

      const indexId = this.builder.literal(index + 1).id;
      const memberId = this.builder.memberExpression(sourceId, indexId, true).id;

      if (el.type === "Identifier") {
        declarations.push(this.builder.varDecl(el.name, memberId, null, { kind }));
        return;
      }

      if (el.type === "AssignmentPattern") {
        if (el.left && el.left.type === "Identifier") {
          const defaultValueId = this.lowerExpression(el.right);
          const initId = this.lowerDestructuringDefault(memberId, defaultValueId);
          declarations.push(this.builder.varDecl(el.left.name, initId, null, { kind }));
        }
        return;
      }

      if (el.type === "ArrayPattern" || el.type === "ObjectPattern") {
        const tempName = `_nested_${++this.destructuringIndex}`;
        declarations.push(this.builder.varDecl(tempName, memberId, null, { kind }));
        const tempId = this.builder.identifier(tempName).id;
        if (el.type === "ArrayPattern") {
          this.lowerArrayPatternBindings(el, tempId, declarations, kind, extraStatements);
        } else {
          this.lowerObjectPatternBindings(el, tempId, declarations, kind, extraStatements);
        }
      }
    });
  }

  lowerObjectPatternBindings(pattern, sourceId, declarations, kind, extraStatements = []) {
    const properties = pattern.properties || [];
    properties.forEach((prop) => {
      if (!prop) return;

      if (prop.type === "RestElement") {
        const restArg = prop.argument;
        if (restArg && restArg.type === "Identifier") {
          declarations.push(this.builder.varDecl(restArg.name, sourceId, null, { kind }));
        }
        return;
      }

      if (prop.type !== "Property") {
        return;
      }

      const keyNode = prop.key;
      let keyId;
      let computed = Boolean(prop.computed);
      if (computed) {
        keyId = this.lowerExpression(keyNode);
      } else if (keyNode && keyNode.type === "Identifier") {
        keyId = this.lowerIdentifier(keyNode).id;
      } else if (keyNode && keyNode.type === "Literal") {
        keyId = this.builder.literal(keyNode.value).id;
        computed = true;
      } else {
        keyId = this.lowerExpression(keyNode);
        computed = true;
      }

      const memberId = this.builder.memberExpression(sourceId, keyId, computed).id;
      const valueNode = prop.value;

      if (valueNode.type === "Identifier") {
        declarations.push(this.builder.varDecl(valueNode.name, memberId, null, { kind }));
        return;
      }

      if (valueNode.type === "AssignmentPattern") {
        if (valueNode.left && valueNode.left.type === "Identifier") {
          const defaultValueId = this.lowerExpression(valueNode.right);
          const initId = this.lowerDestructuringDefault(memberId, defaultValueId);
          declarations.push(this.builder.varDecl(valueNode.left.name, initId, null, { kind }));
        }
        return;
      }

      if (valueNode.type === "ArrayPattern" || valueNode.type === "ObjectPattern") {
        const tempName = `_nested_${++this.destructuringIndex}`;
        declarations.push(this.builder.varDecl(tempName, memberId, null, { kind }));
        const tempId = this.builder.identifier(tempName).id;
        if (valueNode.type === "ArrayPattern") {
          this.lowerArrayPatternBindings(valueNode, tempId, declarations, kind, extraStatements);
        } else {
          this.lowerObjectPatternBindings(valueNode, tempId, declarations, kind, extraStatements);
        }
      }
    });
  }

  lowerExpressionStatement(node) {
    const expressionId = this.lowerExpression(node.expression);
    return this.builder.expressionStatement(expressionId);
  }

  lowerReturnStatement(node) {
    const argumentRef = node.argument ? this.lowerExpression(node.argument) : null;
    return this.builder.returnStatement(argumentRef);
  }

  lowerThrowStatement(node) {
    const argumentRef = node.argument ? this.lowerExpression(node.argument) : null;
    return this.builder.throwStatement(argumentRef);
  }

  lowerIfStatement(node) {
    // Check if test expression contains pattern assignment
    const patternInfo = this.detectIfPatternAssignment(node.test);
   
    if (patternInfo) {
      // Handle if-statement with pattern destructuring
      return this.lowerIfStatementWithPattern(node, patternInfo);
    }
   
    // Standard if-statement (no pattern)
    const testRef = this.lowerExpression(node.test);
    const consequent = this.ensureBlock(node.consequent);
    const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;

    return this.builder.ifStatement(
      testRef,
      consequent.id,
      alternate ? alternate.id : null
    );
  }

  /**
    * Detect if test expression is an assignment with pattern left-hand side
    * Supports: [x, y] = data, {x} = data, logical ops, negation
    */
  detectIfPatternAssignment(expr) {
    if (!expr) return null;
   
    // Simple case: ([x, y] = data) or ({x} = data)
    if (expr.type === "AssignmentExpression") {
      const left = expr.left;
      if (left && (left.type === "ArrayPattern" || left.type === "ObjectPattern")) {
        return {
          pattern: left,
          value: expr.right,
          operator: expr.operator,
          isSimple: true
        };
      }
    }
   
    // Logical operators: data && ({x} = data)
    if (expr.type === "LogicalExpression") {
      const rightPattern = this.detectIfPatternAssignment(expr.right);
      if (rightPattern) {
        return {
          ...rightPattern,
          isSimple: false,
          logicalOp: expr.operator,
          logicalLeft: expr.left
        };
      }
      // Also check left side for OR: ({x} = d1) || ({x} = d2)
      const leftPattern = this.detectIfPatternAssignment(expr.left);
      if (leftPattern) {
        return {
          ...leftPattern,
          isSimple: false,
          logicalOp: expr.operator,
          logicalRight: expr.right
        };
      }
    }
   
    // Negation: !([x] = arr)
    if (expr.type === "UnaryExpression" && expr.operator === "!") {
      const innerPattern = this.detectIfPatternAssignment(expr.argument);
      if (innerPattern) {
        return {
          ...innerPattern,
          isSimple: false,
          negated: true
        };
      }
    }
   
    return null;
  }

  /**
    * Lower if-statement with pattern destructuring in test condition
    */
  lowerIfStatementWithPattern(node, patternInfo) {
    // Handle simple patterns: if ([x, y] = data) { ... }
    if (patternInfo.isSimple) {
      // Step 1: Lower the RHS value to get the data source
      const valueRef = this.lowerExpression(patternInfo.value);
     
      // Step 2: Create temp variable to hold the assigned value
      const tempVarName = this.createTempVar("_if_val");
      const tempVarNode = { type: "Identifier", name: tempVarName };
     
      // Step 3: Lower the temp variable
      const tempRef = this.lowerExpression(tempVarNode);
     
      // Step 4: Create assignment: tempVar = value
      const assignStmt = this.builder.assignment(tempRef, valueRef);
     
      // Step 5: Extract pattern bindings from temp variable
      const bindings = this.extractPatternBindings(patternInfo.pattern, tempVarNode);
     
      // Step 6: Lower all binding statements
      const bindingStmts = bindings.map(binding => this.lowerStatement(binding));
     
      // Step 7: Modify consequent to include bindings at start
      const consequent = this.ensureBlock(node.consequent);
      const modifiedConsequent = this.builder.blockStatement([
        assignStmt,
        ...bindingStmts,
        ...consequent.statements
      ]);
     
      // Step 8: Use temp variable as test condition (preserves truthiness)
      const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;
     
      return this.builder.ifStatement(
        tempRef,
        modifiedConsequent.id,
        alternate ? alternate.id : null
      );
    }
   
    // Handle complex patterns (logical ops, negation)
    return this.lowerComplexIfPattern(node, patternInfo);
  }

  /**
    * Extract variable bindings from pattern destructuring
    * Converts pattern into variable declarations
    */
  extractPatternBindings(pattern, sourceExpr) {
    const bindings = [];
   
    if (!pattern) return bindings;
   
    if (pattern.type === "ArrayPattern") {
      const elements = pattern.elements || [];
      elements.forEach((element, index) => {
        if (!element) return; // Skip holes
       
        if (element.type === "Identifier") {
          // Simple: x = source[0]
          const memberExpr = {
            type: "MemberExpression",
            object: sourceExpr,
            property: { type: "Literal", value: index },
            computed: true
          };
         
          const binding = {
            type: "VariableDeclaration",
            declarations: [{
              type: "VariableDeclarator",
              id: element,
              init: memberExpr
            }],
            kind: "const"
          };
          bindings.push(binding);
        } else if (element.type === "RestElement") {
          // Rest: ...rest = source.slice(index)
          const sliceCall = {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: sourceExpr,
              property: { type: "Identifier", name: "slice" },
              computed: false
            },
            arguments: [{ type: "Literal", value: index }]
          };
         
          const binding = {
            type: "VariableDeclaration",
            declarations: [{
              type: "VariableDeclarator",
              id: element.argument,
              init: sliceCall
            }],
            kind: "const"
          };
          bindings.push(binding);
        } else if (element.type === "AssignmentPattern") {
          // Default: a = 10 => const a = source[0] !== undefined ? source[0] : 10
          const memberExpr = {
            type: "MemberExpression",
            object: sourceExpr,
            property: { type: "Literal", value: index },
            computed: true
          };
         
          const conditionalExpr = {
            type: "ConditionalExpression",
            test: {
              type: "BinaryExpression",
              left: memberExpr,
              operator: "!==",
              right: { type: "Identifier", name: "undefined" }
            },
            consequent: memberExpr,
            alternate: element.right
          };
         
          const binding = {
            type: "VariableDeclaration",
            declarations: [{
              type: "VariableDeclarator",
              id: element.left,
              init: conditionalExpr
            }],
            kind: "const"
          };
          bindings.push(binding);
        } else {
          // Nested pattern - recurse
          const memberExpr = {
            type: "MemberExpression",
            object: sourceExpr,
            property: { type: "Literal", value: index },
            computed: true
          };
          const nested = this.extractPatternBindings(element, memberExpr);
          bindings.push(...nested);
        }
      });
    } else if (pattern.type === "ObjectPattern") {
      const properties = pattern.properties || [];
      properties.forEach(prop => {
        if (prop.type === "RestElement") {
          // Object rest: {...rest}
          // For now, skip - advanced feature
          return;
        }
       
        const _key = prop.key.name || prop.key.value;
        const value = prop.value;
       
        if (value.type === "Identifier") {
          // Simple: {x} or {x: a}
          const memberExpr = {
            type: "MemberExpression",
            object: sourceExpr,
            property: prop.key,
            computed: false
          };
         
          const binding = {
            type: "VariableDeclaration",
            declarations: [{
              type: "VariableDeclarator",
              id: value,
              init: memberExpr
            }],
            kind: "const"
          };
          bindings.push(binding);
        } else if (value.type === "AssignmentPattern") {
          // Default: {x = 10}
          const memberExpr = {
            type: "MemberExpression",
            object: sourceExpr,
            property: prop.key,
            computed: false
          };
         
          const conditionalExpr = {
            type: "ConditionalExpression",
            test: {
              type: "BinaryExpression",
              left: memberExpr,
              operator: "!==",
              right: { type: "Identifier", name: "undefined" }
            },
            consequent: memberExpr,
            alternate: value.right
          };
         
          const binding = {
            type: "VariableDeclaration",
            declarations: [{
              type: "VariableDeclarator",
              id: value.left,
              init: conditionalExpr
            }],
            kind: "const"
          };
          bindings.push(binding);
        } else {
          // Nested pattern - recurse
          const memberExpr = {
            type: "MemberExpression",
            object: sourceExpr,
            property: prop.key,
            computed: false
          };
          const nested = this.extractPatternBindings(value, memberExpr);
          bindings.push(...nested);
        }
      });
    }
   
    return bindings;
  }

  /**
    * Handle complex if-patterns with logical operators or negation
    */
  lowerComplexIfPattern(node, patternInfo) {
    // Handle logical AND: if (data && ({x} = data))
    if (patternInfo.logicalOp === "&&") {
      const leftRef = this.lowerExpression(patternInfo.logicalLeft);
     
      // Create inner if with pattern
      const innerIfNode = {
        type: "IfStatement",
        test: {
          type: "AssignmentExpression",
          left: patternInfo.pattern,
          right: patternInfo.value,
          operator: "="
        },
        consequent: node.consequent,
        alternate: null
      };
     
      const innerIf = this.lowerIfStatementWithPattern(
        innerIfNode,
        { ...patternInfo, isSimple: true }
      );
     
      // Wrap in outer if for left condition
      const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;
     
      return this.builder.ifStatement(
        leftRef,
        innerIf.id,
        alternate ? alternate.id : null
      );
    }
   
    // Handle logical OR: if (({x} = d1) || ({x} = d2))
    if (patternInfo.logicalOp === "||") {
      // Lower left pattern assignment
      const leftIfNode = {
        type: "IfStatement",
        test: {
          type: "AssignmentExpression",
          left: patternInfo.pattern,
          right: patternInfo.value,
          operator: "="
        },
        consequent: node.consequent,
        alternate: {
          type: "IfStatement",
          test: patternInfo.logicalRight,
          consequent: node.consequent,
          alternate: node.alternate
        }
      };
     
      return this.lowerIfStatementWithPattern(
        leftIfNode,
        { ...patternInfo, isSimple: true }
      );
    }
   
    // Handle negation: if (!([x] = arr))
    if (patternInfo.negated) {
      // Create if with pattern, then negate result
      const valueRef = this.lowerExpression(patternInfo.value);
      const tempVarName = this.createTempVar("_if_neg");
      const tempVarNode = { type: "Identifier", name: tempVarName };
      const tempRef = this.lowerExpression(tempVarNode);
     
      const assignStmt = this.builder.assignment(tempRef, valueRef);
      const negatedTest = this.builder.unaryExpression("!", tempRef);
     
      const bindings = this.extractPatternBindings(patternInfo.pattern, tempVarNode);
      const bindingStmts = bindings.map(binding => this.lowerStatement(binding));
     
      // For negation, bindings should still be available if pattern is valid
      // But condition checks for falsy result
      const consequent = this.ensureBlock(node.consequent);
      const modifiedConsequent = this.builder.blockStatement([
        assignStmt,
        ...bindingStmts,
        ...consequent.statements
      ]);
     
      const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;
     
      return this.builder.ifStatement(
        negatedTest.id,
        modifiedConsequent.id,
        alternate ? alternate.id : null
      );
    }
   
    // Fallback to standard lowering
    const testRef = this.lowerExpression(node.test);
    const consequent = this.ensureBlock(node.consequent);
    const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;
   
    return this.builder.ifStatement(
      testRef,
      consequent.id,
      alternate ? alternate.id : null
    );
  }

  lowerWhileStatement(node) {
    return this.loopLowerer.lowerWhileStatement(node);
  }

  lowerSwitchStatement(node) {
    // Lower switch to if/elseif/else chain with fall-through semantics.
    const discRef = this.lowerExpression(node.discriminant);
    const cases = node.cases || [];
    const buildCaseBlock = (conseq) => this.ensureBlock({ type: "BlockStatement", body: conseq });

    const collectFallthroughStatements = (startIndex) => {
      const collected = [];
      for (let i = startIndex; i < cases.length; i++) {
        const conseq = cases[i].consequent || [];
        for (const stmt of conseq) {
          if (stmt && stmt.type === "BreakStatement" && !stmt.label) {
            return collected;
          }
          collected.push(stmt);
        }
      }
      return collected;
    };

    const casePairs = [];
    let defaultBlock = null;

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      if (!c.test) {
        const stmts = collectFallthroughStatements(i);
        defaultBlock = buildCaseBlock(stmts);
        continue;
      }
      const rightRef = this.lowerExpression(c.test);
      const eqRef = this.builder.binaryExpression(discRef, "===", rightRef).id;
      const stmts = collectFallthroughStatements(i);
      const blk = buildCaseBlock(stmts);
      casePairs.push({ testRef: eqRef, block: blk });
    }

    if (casePairs.length === 0) {
      return defaultBlock ? this.builder.blockStatement(defaultBlock.statements) : this.builder.blockStatement([]);
    }

    const buildIfChain = (index) => {
      const { testRef, block } = casePairs[index];
      const consequentRef = block.id;
      const alt = (index + 1 < casePairs.length)
        ? buildIfChain(index + 1)
        : (defaultBlock ? defaultBlock.id : null);
      return this.builder.ifStatement(testRef, consequentRef, alt);
    };

    return buildIfChain(0);
  }

  lowerClassDeclaration(node, { pushToBody } = {}) {
    return this.classLowerer.lowerClassDeclaration(node, { pushToBody });
  }

  lowerFunctionDeclaration(node, { pushToBody } = {}) {
    const { params: paramIds, prelude: preludeStatements } = this.lowerFunctionParams(node.params || []);

    const normalizedBody = this.normalizeBlockForFunction(node.body);
    
    const bodyBlock = this.lowerBlockStatement(normalizedBody);

    if (preludeStatements.length > 0) {
      this.prependStatementsToBlock(bodyBlock, preludeStatements);
    }

    const cfgInfo = this.createFunctionCfg(bodyBlock);

    const meta = Object.assign({}, this.options.functionMeta || {}, {
      auditTags: ["knuth:awaiting-proof"],
      cfg: {
        id: cfgInfo.cfgId,
        entry: cfgInfo.entryBlockId,
        exit: cfgInfo.exitBlockId,
      },
    });

    const fn = this.builder.functionDeclaration(
      node.id?.name,
      paramIds,
      bodyBlock.id,
      null,
      {
        meta,
        async: Boolean(node.async),
        generator: Boolean(node.generator),
        pushToModule: pushToBody !== false,
      }
    );

    if (pushToBody !== false) {
      this.builder.pushToBody(fn);
    }

    return fn;
  }

  // eslint-disable-next-line complexity
  lowerExpression(node) {
    if (!node) {
      return null;
    }

    switch (node.type) {
    case "Identifier": {
      return this.lowerIdentifier(node).id;
    }
    case "Literal": {
      return this.builder.literal(node.value, { raw: node.raw }).id;
    }
    case "BinaryExpression": {
      const left = this.lowerExpression(node.left);
      const right = this.lowerExpression(node.right);
      return this.builder.binaryExpression(left, node.operator, right).id;
    }
    case "LogicalExpression": {
      const left = this.lowerExpression(node.left);
      const right = this.lowerExpression(node.right);
      return this.builder.logicalExpression(left, node.operator, right).id;
    }
    case "AssignmentExpression": {
      const left = this.lowerExpression(node.left);
      const right = this.lowerExpression(node.right);
      return this.builder.assignmentExpression(left, node.operator, right).id;
    }
    case "UnaryExpression": {
      const argument = this.lowerExpression(node.argument);
      return this.builder.unaryExpression(node.operator, argument).id;
    }
    case "UpdateExpression": {
      const argument = this.lowerExpression(node.argument);
      return this.builder.updateExpression(node.operator, argument, { prefix: Boolean(node.prefix) }).id;
    }
    case "CallExpression": {
      const callee = this.lowerExpression(node.callee);
      const args = (node.arguments || []).map((arg) => this.lowerExpression(arg));
      return this.builder.callExpression(callee, args, { optional: Boolean(node.optional) }).id;
    }
    case "NewExpression": {
      const callee = this.lowerExpression(node.callee);
      const args = (node.arguments || []).map((arg) => this.lowerExpression(arg));
      return this.builder.newExpression(callee, args).id;
    }
    case "MemberExpression": {
      const objectRef = this.lowerExpression(node.object);
      const propertyRef = this.lowerExpression(node.property);
      return this.builder.memberExpression(objectRef, propertyRef, Boolean(node.computed), { optional: Boolean(node.optional) }).id;
    }
    case "ArrayExpression": {
      const elements = [];
      for (const el of (node.elements || [])) {
        if (el === null) {
          // Sparse array element - skip nulls
          continue;
        } else if (el.type === "SpreadElement") {
          // Handle spread element: ...expr
          const spreadRef = this.lowerExpression(el.argument);
          // Mark as spread for emitter to handle
          elements.push({ spreadRef, isSpread: true });
        } else {
          const ref = this.lowerExpression(el);
          elements.push(ref);
        }
      }
      
      // If no spreads, use simple array expression
      const hasSpread = elements.some(el => typeof el === "object" && el.isSpread);
      if (!hasSpread) {
        const simpleElements = elements.filter(el => el);
        return this.builder.arrayExpression(simpleElements).id;
      }
      
      // Handle spreads by concatenating arrays
      let result = null;
      for (const el of elements) {
        if (typeof el === "object" && el.isSpread) {
          if (result === null) {
            result = el.spreadRef;
          } else {
            // Concatenate arrays: result = result.concat(spread)
            result = this.builder.callExpression(
              this.builder.memberExpression(result, this.builder.identifier("concat"), false).id,
              [el.spreadRef]
            ).id;
          }
        } else {
          const arrayId = this.builder.arrayExpression([el]).id;
          if (result === null) {
            result = arrayId;
          } else {
            result = this.builder.callExpression(
              this.builder.memberExpression(result, this.builder.identifier("concat"), false).id,
              [arrayId]
            ).id;
          }
        }
      }
      return result || this.builder.arrayExpression([]).id;
    }
    case "ObjectExpression": {
      const props = [];
      const spreadProps = [];
      
      for (const p of (node.properties || [])) {
        if (p.type === "SpreadElement") {
          // Handle spread property: {...obj}
          spreadProps.push(this.lowerExpression(p.argument));
        } else {
          const key = this.lowerExpression(p.key);
          const value = this.lowerExpression(p.value);
          props.push(this.builder.property(key, value, { propertyKind: p.kind || "init", computed: Boolean(p.computed), shorthand: Boolean(p.shorthand) }));
        }
      }
      
      // If no spreads, use simple object expression
      if (spreadProps.length === 0) {
        const propIds = props.map((pr) => pr.id);
        return this.builder.objectExpression(propIds).id;
      }
      
      // Handle spreads: merge base object with spreads
      let result = null;
      
      // First, create base object with non-spread properties
      if (props.length > 0) {
        result = this.builder.objectExpression(props.map(p => p.id)).id;
      }
      
      // Then merge each spread
      for (const spreadRef of spreadProps) {
        if (result === null) {
          result = spreadRef;
        } else {
          // Merge objects using Object.assign
          result = this.builder.callExpression(
            this.builder.memberExpression(
              this.builder.identifier("Object"),
              this.builder.identifier("assign"),
              false
            ).id,
            [result, spreadRef]
          ).id;
        }
      }
      
      return result || this.builder.objectExpression([]).id;
    }
    case "ConditionalExpression": {
      const test = this.lowerExpression(node.test);
      const cons = this.lowerExpression(node.consequent);
      const alt = this.lowerExpression(node.alternate);
      return this.builder.conditionalExpression(test, cons, alt).id;
    }
    case "ArrowFunctionExpression": {
      return this.lowerArrowFunctionExpression(node).id;
    }
    case "FunctionExpression": {
      return this.lowerFunctionExpression(node).id;
    }
    case "Error": {
      // Gracefully lower parser error nodes to a nil literal to keep pipeline moving
      return this.builder.literal(null).id;
    }
    case "FunctionDeclaration": {
      const functionNode = this.lowerFunctionDeclaration(node, {
        pushToBody: false,
      });
      return functionNode.id;
    }
    case "ExpressionStatement": {
      return this.lowerExpression(node.expression);
    }
    case "ArrayPattern": {
      return this.lowerArrayPattern(node).id;
    }
    case "ObjectPattern": {
      return this.lowerObjectPattern(node).id;
    }
    case "RestElement": {
      return this.lowerRestElement(node).id;
    }
    case "AssignmentPattern": {
      return this.lowerAssignmentPattern(node).id;
    }
    case "AwaitExpression": {
      return this.lowerAwaitExpression(node);
    }
    case "YieldExpression": {
      return this.lowerYieldExpression(node);
    }
    case "ThisExpression": {
      return this.builder.thisExpression().id;
    }
    case "SpreadElement": {
      const argument = this.lowerExpression(node.argument);
      return this.builder.spreadElement(argument).id;
    }
    case "TemplateLiteral": {
      // Template literals: `Hello ${name}!`
      // Convert to string concatenation: "Hello " .. name .. "!"
      if (!node.expressions || node.expressions.length === 0) {
        // Simple template literal with no expressions
        const str = node.quasis[0].value.cooked || node.quasis[0].value.raw;
        return this.builder.literal(str).id;
      }

      // Build concatenation: quasi[0] + expr[0] + quasi[1] + expr[1] + ... + quasi[n]
      let result = null;
      for (let i = 0; i < node.quasis.length; i++) {
        const quasi = node.quasis[i];
        const quasiValue = quasi.value.cooked || quasi.value.raw;
        
        if (quasiValue) {
          const quasiLit = this.builder.literal(quasiValue).id;
          result = result ? this.builder.binaryExpression(result, "..", quasiLit).id : quasiLit;
        }
        
        if (i < node.expressions.length) {
          const exprId = this.lowerExpression(node.expressions[i]);
          result = result ? this.builder.binaryExpression(result, "..", exprId).id : exprId;
        }
      }
      return result;
    }
    default: {
      throw new Error(`Lowerer does not yet support expression type ${node.type}`);
    }
    }
  }

  lowerExpressionAsStatement(node) {
    const exprId = this.lowerExpression(node);
    return this.builder.expressionStatement(exprId);
  }

  lowerArrayPattern(node) {
    const elements = (node.elements || []).map((el) => 
      el ? this.lowerExpression(el) : null
    );
    return this.builder.arrayPattern(elements);
  }

  lowerObjectPattern(node) {
    const properties = (node.properties || []).map((prop) => {
      const key = this.lowerExpression(prop.key);
      const value = this.lowerExpression(prop.value);
      return this.builder.property(key, value, { 
        propertyKind: prop.kind || "init",
        computed: Boolean(prop.computed),
        shorthand: Boolean(prop.shorthand)
      }).id;
    });
    return this.builder.objectPattern(properties);
  }

  lowerRestElement(node) {
    const argument = this.lowerExpression(node.argument);
    return this.builder.restElement(argument);
  }

  lowerAssignmentPattern(node) {
    const left = this.lowerExpression(node.left);
    const right = this.lowerExpression(node.right);
    return this.builder.assignmentPattern(left, right);
  }

  lowerTryStatement(node) {
    return this.tryLowerer.lowerTryStatement(node);
  }

  lowerArrowFunctionExpression(node) {
    const { params: paramIds, prelude: preludeStatements } = this.lowerFunctionParams(node.params || []);

    let bodyBlock;

    if (node.body && node.body.type === "BlockStatement") {
      bodyBlock = this.lowerBlockStatement(node.body);
      if (preludeStatements.length > 0) {
        this.prependStatementsToBlock(bodyBlock, preludeStatements);
      }
    } else if (node.body) {
      const valueId = this.lowerExpression(node.body);
      const returnNode = this.builder.returnStatement(valueId);
      const statements = preludeStatements.length > 0
        ? [...preludeStatements, returnNode.id]
        : [returnNode.id];
      bodyBlock = this.builder.blockStatement(statements);
    } else {
      bodyBlock = this.builder.blockStatement(preludeStatements);
    }

    return this.builder.arrowFunctionExpression(paramIds, bodyBlock.id, {
      async: node.async,
    });
  }

  lowerFunctionExpression(node) {
    // Handle optional name (anonymous functions have id: null)
    const name = node.id ? this.lowerIdentifier(node.id, { binding: node.id.name }).name : null;
    const { params: paramIds, prelude: preludeStatements } = this.lowerFunctionParams(node.params || []);

    const bodyBlock = this.lowerBlockStatement(
      this.normalizeBlockForFunction(node.body)
    );

    if (preludeStatements.length > 0) {
      this.prependStatementsToBlock(bodyBlock, preludeStatements);
    }

    return this.builder.functionExpression(
      name,
      paramIds,
      bodyBlock.id,
      {
        async: Boolean(node.async),
        generator: Boolean(node.generator),
      }
    );
  }

  lowerFunctionParams(params = []) {
    const paramIds = [];
    const preludeStatements = [];
    let sawRest = false;

    params.forEach((param) => {
      if (!param) return;

      if (param.type === "Identifier") {
        paramIds.push(this.builder.parameter(param.name).id);
        return;
      }

      if (param.type === "AssignmentPattern") {
        if (!param.left || param.left.type !== "Identifier") {
          throw new Error("Default parameters only support identifiers in this lowering pass");
        }
        const paramName = param.left.name;
        paramIds.push(this.builder.parameter(paramName).id);

        const paramId = this.builder.identifier(paramName).id;
        const nilId = this.builder.literal(null).id;
        const testId = this.builder.binaryExpression(paramId, "==", nilId).id;
        const defaultValueId = this.lowerExpression(param.right);
        const assignId = this.builder.assignmentExpression(paramId, "=", defaultValueId).id;
        const assignStmt = this.builder.expressionStatement(assignId);
        const consequent = this.builder.blockStatement([assignStmt.id]);
        const ifNode = this.builder.ifStatement(testId, consequent.id, null);
        preludeStatements.push(ifNode.id);
        return;
      }

      if (param.type === "RestElement") {
        if (sawRest) {
          throw new Error("Multiple rest parameters are not allowed");
        }
        sawRest = true;
        const arg = param.argument;
        if (!arg || arg.type !== "Identifier") {
          throw new Error("Rest parameter must be an identifier");
        }

        paramIds.push(this.builder.parameter("...").id);

        const varargsId = this.builder.identifier("...").id;
        const arrayId = this.builder.arrayExpression([varargsId]).id;
        const decl = this.builder.varDecl(arg.name, arrayId, null, { kind: "let" });
        const declStmt = this.builder.variableDeclaration([decl], { kind: "let" });
        preludeStatements.push(declStmt.id);
        return;
      }

      if (param.type === "ArrayPattern" || param.type === "ObjectPattern") {
        const fallbackName = `__pattern_${++this.destructuringIndex}`;
        paramIds.push(this.builder.parameter(fallbackName).id);
        const sourceId = this.builder.identifier(fallbackName).id;
        const decls = [];
        if (param.type === "ArrayPattern") {
          this.lowerArrayPatternBindings(param, sourceId, decls, "let");
        } else {
          this.lowerObjectPatternBindings(param, sourceId, decls, "let");
        }
        if (decls.length > 0) {
          const declStmt = this.builder.variableDeclaration(decls, { kind: "let" });
          preludeStatements.push(declStmt.id);
        }
        return;
      }

      if (param.type === "Error") {
        const fallbackName = `__error_param_${++this.destructuringIndex}`;
        paramIds.push(this.builder.parameter(fallbackName).id);
        return;
      }

      throw new Error(`Unsupported param type in Function: ${param.type}`);
    });

    return { params: paramIds, prelude: preludeStatements };
  }

  prependStatementsToBlock(blockNode, statementIds) {
    if (!blockNode || !Array.isArray(blockNode.statements)) {
      return;
    }
    blockNode.statements = [...statementIds, ...blockNode.statements];
  }

  lowerIdentifier(node, { binding } = {}) {
    if (!node || node.type !== "Identifier") {
      throw new Error("Expected Identifier node");
    }

    return this.builder.identifier(node.name, {
      binding: binding || node.name,
    });
  }

  ensureBlock(node) {
    if (!node) {
      return this.builder.blockStatement([]);
    }

    if (node.type === "BlockStatement") {
      return this.lowerBlockStatement(node);
    }

    const statement = this.lowerStatement(node, { pushToBody: false });
    return this.builder.blockStatement([statement.id]);
  }

  normalizeBlockForFunction(node) {
    if (!node) {
      return { type: "BlockStatement", body: [] };
    }
    if (node.type === "BlockStatement") {
      return node;
    }
    return {
      type: "BlockStatement",
      body: [node],
    };
  }

  createFunctionCfg(bodyNode) {
    const cfgId = this.builder.idGenerator.next("cfg");
    const entryBlockId = this.builder.idGenerator.next("bb");
    const exitBlockId = this.builder.idGenerator.next("bb");

    // Handle both IR nodes (with .statements) and AST nodes (with .body)
    const blockStatements = bodyNode?.statements || bodyNode?.body || [];
    if (!bodyNode || (bodyNode.statements === undefined && bodyNode.body === undefined)) {
      console.warn("Warning: createFunctionCfg received invalid bodyNode:", bodyNode);
    }

    const cfg = {
      id: cfgId,
      blocks: [
        {
          id: entryBlockId,
          kind: "entry",
          statements: blockStatements,
        },
        {
          id: exitBlockId,
          kind: "exit",
          statements: [],
        },
      ],
      successors: {
        [entryBlockId]: [exitBlockId],
        [exitBlockId]: [],
      },
      predecessors: {
        [entryBlockId]: [],
        [exitBlockId]: [entryBlockId],
      },
    };

    this.builder.registerControlFlowGraph(cfgId, cfg);

    return { cfgId, entryBlockId, exitBlockId };
  }

  // ========== Enhanced Methods (Async/Generators/Classes with Scope) ==========

  /**
   * Lower async function declarations with scope tracking
   */
  lowerAsyncFunctionDeclaration(node, { pushToBody } = {}) {
    const funcName = node.id ? node.id.name : null;
    
    this.pushScope();
    const params = (node.params || []).map((param) => {
      if (param.type === "Identifier") {
        this.addBinding(param.name);
        return this.lowerIdentifier(param, { binding: param.name }).id;
      }
      if (param.type === "RestElement") {
        const restName = param.argument.name;
        this.addBinding(restName);
        return this.builder.restElement(this.lowerIdentifier(param.argument, { binding: restName }).id).id;
      }
      // Destructuring patterns in params
      if (param.type === "AssignmentPattern") {
        this.addBinding(param.left.name);
        return this.lowerAssignmentPattern(param).id;
      }
      this.addBinding(param.name);
      return this.lowerExpression(param);
    });

    const bodyBlock = this.lowerBlockStatement(this.normalizeBlockForFunction(node.body));
    this.popScope();

    const cfgInfo = this.createFunctionCfg(bodyBlock);
    const meta = Object.assign({}, this.options.functionMeta || {}, {
      auditTags: ["knuth:awaiting-proof"],
      cfg: {
        id: cfgInfo.cfgId,
        entry: cfgInfo.entryBlockId,
        exit: cfgInfo.exitBlockId,
      },
    });

    const fn = this.builder.functionDeclaration(
      funcName,
      params,
      bodyBlock.id,
      null,
      {
        meta,
        async: true,
        pushToModule: pushToBody !== false,
      }
    );

    if (pushToBody !== false) {
      this.builder.pushToBody(fn);
    }

    return fn;
  }

  /**
   * Lower generator function declarations with yield support
   */
  lowerGeneratorDeclaration(node, { pushToBody } = {}) {
    const funcName = node.id ? node.id.name : null;
    
    this.pushScope();
    const params = (node.params || []).map((param) => {
      if (param.type === "Identifier") {
        this.addBinding(param.name);
        return this.lowerIdentifier(param, { binding: param.name }).id;
      }
      if (param.type === "RestElement") {
        const restName = param.argument.name;
        this.addBinding(restName);
        return this.builder.restElement(this.lowerIdentifier(param.argument, { binding: restName }).id).id;
      }
      this.addBinding(param.name);
      return this.lowerExpression(param);
    });

    const bodyBlock = this.lowerBlockStatement(this.normalizeBlockForFunction(node.body));
    this.popScope();

    const cfgInfo = this.createFunctionCfg(bodyBlock);
    const meta = Object.assign({}, this.options.functionMeta || {}, {
      auditTags: ["knuth:generator-support"],
      cfg: {
        id: cfgInfo.cfgId,
        entry: cfgInfo.entryBlockId,
        exit: cfgInfo.exitBlockId,
      },
    });

    const fn = this.builder.functionDeclaration(
      funcName,
      params,
      bodyBlock.id,
      null,
      {
        meta,
        generator: true,
        pushToModule: pushToBody !== false,
      }
    );

    if (pushToBody !== false) {
      this.builder.pushToBody(fn);
    }

    return fn;
  }

  /**
   * Lower yield expressions (used in generators)
   */
  lowerYieldExpression(node) {
    const argument = node.argument ? this.lowerExpression(node.argument) : null;
    const delegate = Boolean(node.delegate); // true for yield*
    return this.builder.yieldExpression(argument, delegate, { delegate }).id;
  }

  /**
   * Lower await expressions (used in async functions)
   */
  lowerAwaitExpression(node) {
    const argument = this.lowerExpression(node.argument);
    return this.builder.awaitExpression(argument).id;
  }

  lowerThisExpression(_node) {
    return this.builder.thisExpression();
  }

  lowerSpreadElement(node) {
    const argument = node.argument ? this.lowerExpression(node.argument) : null;
    return this.builder.spreadElement(argument);
  }
}

function lowerToIR(programNode, options = {}) {
  const lowerer = new IRLowerer(options);
  return lowerer.lowerProgram(programNode);
}

module.exports = {
  IRLowerer,
  lowerToIR,
};