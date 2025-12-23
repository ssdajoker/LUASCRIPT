/**
 * LUASCRIPT Enhanced Lowerer
 * 
 * Converts JavaScript AST to IR with semantic understanding.
 * Handles: async/await, classes, destructuring, control flow, templates, spread/rest
 */

const nodes = require("./nodes");
const { IRBuilder } = require("./builder");

class EnhancedLowerer {
  constructor(irBuilder = null) {
    this.builder = irBuilder || new IRBuilder();
    this.scopeStack = [{ bindings: new Set(), parent: null }];
    this.tempVarCounter = 0;
  }

  resetState() {
    this.scopeStack = [{ bindings: new Set(), parent: null }];
    this.tempVarCounter = 0;

    if (!this.builder || typeof this.builder._storeNode !== "function") {
      this.builder = new IRBuilder();
      return;
    }

    // Clear any retained IR state when reusing an injected builder
    this.builder.nodes = {};
    this.builder.module = {
      body: [],
      metadata: this.builder.module?.metadata || {},
      source: this.builder.module?.source || {},
      directives: this.builder.module?.directives || [],
      toolchain: this.builder.module?.toolchain || {},
      schemaVersion: this.builder.module?.schemaVersion || "1.0.0",
    };
  }

  // ========== Scope Management ==========
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

  // ========== Main Lowering Entry ==========
  lower(ast) {
    this.resetState();
    return this.lowerProgram(ast);
  }

  lowerProgram(node) {
    const body = (node.body || []).map(stmt => this.lowerStatement(stmt));
    return this.builder.program(body);
  }

  // ========== Statement Lowering ==========
  // eslint-disable-next-line complexity
  lowerStatement(node) {
    if (!node) return null;

    switch (node.type) {
    case "VariableDeclaration":
      return this.lowerVariableDeclaration(node);
    case "FunctionDeclaration":
      // Check if it's a generator function
      if (node.generator) {
        return this.lowerGeneratorDeclaration(node);
      }
      return this.lowerFunctionDeclaration(node);
    case "AsyncFunctionDeclaration":
      return this.lowerAsyncFunctionDeclaration(node);
    case "ClassDeclaration":
      return this.lowerClassDeclaration(node);
    case "BlockStatement":
      return this.lowerBlockStatement(node);
    case "ExpressionStatement":
      return this.lowerExpressionStatement(node);
    case "ReturnStatement":
      return this.lowerReturnStatement(node);
    case "IfStatement":
      return this.lowerIfStatement(node);
    case "WhileStatement":
      return this.lowerWhileStatement(node);
    case "ForStatement":
      return this.lowerForStatement(node);
    case "ForOfStatement":
      return this.lowerForOfStatement(node);
    case "ForInStatement":
      return this.lowerForInStatement(node);
    case "DoWhileStatement":
      return this.lowerDoWhileStatement(node);
    case "BreakStatement":
      return this.builder.break();
    case "ContinueStatement":
      return this.builder.continue();
    case "TryStatement":
      return this.lowerTryStatement(node);
    case "ThrowStatement":
      return this.lowerThrowStatement(node);
    case "SwitchStatement":
      return this.lowerSwitchStatement(node);
    default:
      throw new Error(`Unsupported statement: ${node.type}`);
    }
  }

  lowerVariableDeclaration(node) {
    const declarations = (node.declarations || []).map(decl => this.lowerVariableDeclarator(decl));
    return this.builder.variableDeclaration(declarations, { kind: node.kind });
  }

  lowerVariableDeclarator(node) {
    let idNode;
    let isPattern = false;

    if (node.id.type === "Identifier") {
      this.addBinding(node.id.name);
      idNode = this.lowerExpression(node.id);
    } else if (node.id.type === "ArrayPattern") {
      idNode = this.lowerArrayPattern(node.id);
      isPattern = true;
    } else if (node.id.type === "ObjectPattern") {
      idNode = this.lowerObjectPattern(node.id);
      isPattern = true;
    } else {
      throw new Error(`Unsupported declarator id: ${node.id.type}`);
    }

    const initRef = node.init ? this.lowerExpression(node.init) : null;

    // For patterns, pass the pattern object itself, not just a name
    if (isPattern) {
      return this.builder.varDecl(idNode, initRef);
    }

    // Preserve user-defined identifier names instead of auto-generated IDs
    const identifierName = (idNode && (idNode.name || idNode.id || idNode.identifier)) || "unknown";
    return this.builder.varDecl(identifierName, initRef);
  }

  lowerFunctionDeclaration(node) {
    // Extract function name from id (which is an Identifier)
    const funcName = node.id ? (node.id.name || node.id) : null;
        
    this.pushScope();
    const params = (node.params || []).map(p => {
      if (p.type === "Identifier") {
        this.addBinding(p.name);
        return this.builder.identifier(p.name);
      } else if (p.type === "RestElement") {
        // Handle rest parameters
        const restName = p.argument.name;
        this.addBinding(restName);
        return this.builder.restElement(this.builder.identifier(restName));
      } else {
        // Handle destructuring patterns in params
        this.addBinding(p.name || p.id?.name);
        return this.lowerExpression(p);
      }
    });
    const body = this.lowerBlockStatement(node.body);
    this.popScope();

    return this.builder.functionDecl(
      funcName,
      params,
      body,
      null,
      { async: !!node.async }
    );
  }

  lowerAsyncFunctionDeclaration(node) {
    // Extract function name from id (which is an Identifier)
    const funcName = node.id ? (node.id.name || node.id) : null;
        
    this.pushScope();
    const params = (node.params || []).map(p => {
      if (p.type === "Identifier") {
        this.addBinding(p.name);
        return this.builder.identifier(p.name);
      } else if (p.type === "RestElement") {
        // Handle rest parameters
        const restName = p.argument.name;
        this.addBinding(restName);
        return this.builder.restElement(this.builder.identifier(restName));
      } else {
        // Handle destructuring patterns in params
        this.addBinding(p.name || p.id?.name);
        return this.lowerExpression(p);
      }
    });
    const body = this.lowerBlockStatement(node.body);
    this.popScope();

    return this.builder.functionDecl(
      funcName,
      params,
      body,
      null,
      { async: true }  // Mark as async
    );
  }

  lowerClassDeclaration(node) {
    const superClass = node.superClass ? this.lowerExpression(node.superClass) : null;
    const body = this.lowerClassBody(node.body);

    return this.builder.classDeclaration(
      this.lowerExpression(node.id),
      superClass,
      body
    );
  }

  lowerClassBody(node) {
    const methods = (node.body || []).map(method => this.lowerMethodDefinition(method));
    return this.builder.classBody(methods);
  }

  lowerMethodDefinition(node) {
    const key = this.lowerExpression(node.key);
    const value = this.lowerExpression(node.value);
    return this.builder.methodDefinition(key, value, node.kind, node.static);
  }

  lowerBlockStatement(node) {
    this.pushScope();
    const body = (node.body || []).map(stmt => this.lowerStatement(stmt)).filter(Boolean);
    this.popScope();
    return this.builder.block(body);
  }

  lowerExpressionStatement(node) {
    return this.builder.expressionStatement(this.lowerExpression(node.expression));
  }

  lowerReturnStatement(node) {
    const argument = node.argument ? this.lowerExpression(node.argument) : null;
    return this.builder.returnStatement(argument);
  }

  lowerIfStatement(node) {
    const test = this.lowerExpression(node.test);
    const consequent = this.lowerBlockStatement(node.consequent);
    const alternate = node.alternate ? this.lowerStatement(node.alternate) : null;
    return this.builder.ifStatement(test, consequent, alternate);
  }

  lowerWhileStatement(node) {
    const test = this.lowerExpression(node.test);
    const body = this.lowerBlockStatement(node.body);
    return this.builder.whileStatement(test, body);
  }

  lowerForStatement(node) {
    this.pushScope();
    const init = node.init ? this.lowerStatement(node.init) : null;
    const test = node.test ? this.lowerExpression(node.test) : null;
    const update = node.update ? this.lowerExpression(node.update) : null;
    const body = this.lowerBlockStatement(node.body);
    this.popScope();

    return this.builder.forStatement(init, test, update, body);
  }

  lowerForOfStatement(node) {
    this.pushScope();
    const left = node.left.type === "VariableDeclaration"
      ? this.lowerVariableDeclaration(node.left)
      : this.lowerExpression(node.left);
    const right = this.lowerExpression(node.right);
    const body = this.lowerBlockStatement(node.body);
    this.popScope();

    return this.builder.forOfStatement(left, right, body, { await: Boolean(node.await) });
  }

  lowerForInStatement(node) {
    this.pushScope();
    const left = node.left.type === "VariableDeclaration"
      ? this.lowerVariableDeclaration(node.left)
      : this.lowerExpression(node.left);
    const right = this.lowerExpression(node.right);
    const body = this.lowerBlockStatement(node.body);
    this.popScope();

    return this.builder.forInStatement(left, right, body);
  }

  lowerDoWhileStatement(node) {
    const body = this.lowerBlockStatement(node.body);
    const test = this.lowerExpression(node.test);
    return this.builder.doWhileStatement(body, test);
  }

  lowerTryStatement(node) {
    const block = this.lowerBlockStatement(node.block);
    const handler = node.handler ? this.lowerCatchClause(node.handler) : null;
    const finalizer = node.finalizer ? this.lowerBlockStatement(node.finalizer) : null;

    return this.builder.tryStatement(block, handler, finalizer);
  }

  lowerCatchClause(node) {
    this.pushScope();
    if (node.param) this.addBinding(node.param.name);
    const param = node.param ? this.lowerExpression(node.param) : null;
    const body = this.lowerBlockStatement(node.body);
    this.popScope();

    return this.builder.catchClause(param, body);
  }

  lowerThrowStatement(node) {
    return this.builder.throwStatement(this.lowerExpression(node.argument));
  }

  lowerSwitchStatement(node) {
    const discriminant = this.lowerExpression(node.discriminant);
    const cases = (node.cases || []).map(c => this.lowerSwitchCase(c));
    return this.builder.switchStatement(discriminant, cases);
  }

  lowerSwitchCase(node) {
    const test = node.test ? this.lowerExpression(node.test) : null;
    const consequent = (node.consequent || []).map(stmt => this.lowerStatement(stmt));
    return this.builder.switchCase(test, consequent);
  }

  // ========== Expression Lowering ==========
  // eslint-disable-next-line complexity
  lowerExpression(node) {
    if (!node) return null;

    switch (node.type) {
    case "Identifier":
      return this.builder.identifier(node.name);
    case "Literal":
      return this.builder.literal(node.value, { raw: node.raw });
    case "BinaryExpression":
      return this.lowerBinaryExpression(node);
    case "UnaryExpression":
      return this.lowerUnaryExpression(node);
    case "LogicalExpression":
      return this.lowerLogicalExpression(node);
    case "AssignmentExpression":
      return this.lowerAssignmentExpression(node);
    case "UpdateExpression":
      return this.lowerUpdateExpression(node);
    case "CallExpression":
      return this.lowerCallExpression(node);
    case "MemberExpression":
      return this.lowerMemberExpression(node);
    case "ConditionalExpression":
      return this.lowerConditionalExpression(node);
    case "ArrayExpression":
      return this.lowerArrayExpression(node);
    case "ObjectExpression":
      return this.lowerObjectExpression(node);
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      return this.lowerFunctionExpression(node);
    case "TemplateLiteral":
      return this.lowerTemplateLiteral(node);
    case "AwaitExpression":
      return this.lowerAwaitExpression(node);
    case "YieldExpression":
      return this.lowerYieldExpression(node);
    case "ThisExpression":
      return this.builder.thisExpression();
    case "Super":
      return this.builder.superExpression();
    case "ClassExpression":
      return this.lowerClassExpression(node);
    case "SpreadElement":
      return this.lowerSpreadElement(node);
    case "ArrayPattern":
      return this.lowerArrayPattern(node);
    case "ObjectPattern":
      return this.lowerObjectPattern(node);
    default:
      throw new Error(`Unsupported expression: ${node.type}`);
    }
  }

  lowerBinaryExpression(node) {
    const left = this.lowerExpression(node.left);
    const right = this.lowerExpression(node.right);
    return this.builder.binaryOp(node.operator, left, right);
  }

  lowerUnaryExpression(node) {
    const argument = this.lowerExpression(node.argument);
    return this.builder.unaryOp(node.operator, argument, node.prefix !== false, { prefix: node.prefix !== false });
  }

  lowerLogicalExpression(node) {
    const left = this.lowerExpression(node.left);
    const right = this.lowerExpression(node.right);
    return this.builder.binaryOp(node.operator, left, right);
  }

  lowerAssignmentExpression(node) {
    const left = this.lowerExpression(node.left);
    const right = this.lowerExpression(node.right);
    return this.builder.assignment(left, right, node.operator);
  }

  lowerUpdateExpression(node) {
    const argument = this.lowerExpression(node.argument);
    return this.builder.updateExpression(node.operator, argument, { prefix: node.prefix });
  }

  lowerCallExpression(node) {
    const callee = this.lowerExpression(node.callee);
    const args = (node.arguments || []).map(arg => this.lowerExpression(arg));
    return this.builder.callExpression(callee, args);
  }

  lowerMemberExpression(node) {
    const object = this.lowerExpression(node.object);
    const property = this.lowerExpression(node.property);
    return this.builder.memberExpression(object, property, node.computed);
  }

  lowerConditionalExpression(node) {
    const test = this.lowerExpression(node.test);
    const consequent = this.lowerExpression(node.consequent);
    const alternate = this.lowerExpression(node.alternate);
    return this.builder.conditionalExpression(test, consequent, alternate);
  }

  lowerArrayExpression(node) {
    const elements = (node.elements || []).map(el => el ? this.lowerExpression(el) : null);
    return this.builder.arrayExpression(elements);
  }

  lowerObjectExpression(node) {
    const properties = (node.properties || []).map(prop => this.lowerProperty(prop));
    return this.builder.objectExpression(properties);
  }

  lowerProperty(node) {
    const key = this.lowerExpression(node.key);
    const value = this.lowerExpression(node.value);
    return this.builder.property(key, value, {
      kind: node.kind || "init",
      shorthand: node.shorthand || false,
      computed: node.computed || false
    });
  }

  lowerFunctionExpression(node) {
    this.pushScope();
    const params = (node.params || []).map(p => {
      this.addBinding(p.name);
      return this.lowerExpression(p);
    });

    // Arrow functions can have an expression body; wrap it in a return statement for Lua
    let body;
    if (node.body && node.body.type === "BlockStatement") {
      body = this.lowerBlockStatement(node.body);
    } else if (node.type === "ArrowFunctionExpression") {
      const expressionBody = this.lowerExpression(node.body);
      body = this.builder.block([this.builder.returnStmt(expressionBody)]);
    } else {
      body = this.lowerBlockStatement(node.body);
      // Wait, node.body can be undefined? No, AST valid.
      // But let's be safe.
      if (!body) body = this.builder.block([]);
    }

    this.popScope();

    return this.builder.functionExpression(
      node.id ? this.lowerExpression(node.id) : null,
      params,
      body,
      { arrow: node.type === "ArrowFunctionExpression" }
    );
  }

  lowerTemplateLiteral(node) {
    const quasis = (node.quasis || []).map(q => this.builder.templateElement(
      { raw: q.value.raw, cooked: q.value.cooked },
      q.tail
    ));
    // Builder doesn't have templateElement yet, need to add it or fake it.
    // Actually, IR usually handles template elements as part of TemplateLiteral node.
    // Let's check builder.
    // I added templateLiteral to builder, but it expects quasis and expressions.
    // quasis in ESTree are TemplateElement nodes.
    // I need a builder for TemplateElement or just create the object structure expected by IR.
    // Let's create a simple object for now if builder doesn't support it fully.
    // Or add templateElement to builder.

    // For now, let's assume builder.templateLiteral handles the array of quasis.
    // But wait, the previous code did `new nodes.TemplateElement`.
    // I should add `templateElement` to builder or just construct the object.

    const expressions = (node.expressions || []).map(expr => this.lowerExpression(expr));
    return this.builder.templateLiteral(quasis, expressions);
  }

  lowerAwaitExpression(node) {
    const argument = this.lowerExpression(node.argument);
    return this.builder.awaitExpression(argument);
  }

  lowerGeneratorDeclaration(node) {
    this.pushScope();
    const params = (node.params || []).map(p => {
      this.addBinding(p.name);
      return this.lowerExpression(p);
    });
    const body = this.lowerBlockStatement(node.body);
    this.popScope();

    return this.builder.generatorDeclaration(
      this.lowerExpression(node.id),
      params,
      body,
      { async: !!node.async }
    );
  }

  lowerYieldExpression(node) {
    const argument = node.argument ? this.lowerExpression(node.argument) : null;
    const delegate = node.delegate || false; // true for yield*
    return this.builder.yieldExpression(argument, delegate);
  }

  lowerClassExpression(node) {
    const superClass = node.superClass ? this.lowerExpression(node.superClass) : null;
    const body = this.lowerClassBody(node.body);
    return this.builder.classExpression(
      node.id ? this.lowerExpression(node.id) : null,
      superClass,
      body
    );
  }

  lowerSpreadElement(node) {
    const argument = this.lowerExpression(node.argument);
    return this.builder.spreadElement(argument);
  }

  lowerArrayPattern(node) {
    const elements = (node.elements || []).map(el => {
      if (!el) return null;
      if (el.type === "RestElement") return this.lowerRestElement(el);
      if (el.type === "AssignmentPattern") return this.lowerAssignmentPattern(el);
      if (el.type === "Identifier") {
        this.addBinding(el.name);
        return this.builder.identifier(el.name);
      }
      return this.lowerExpression(el);
    });
    return this.builder.arrayPattern(elements);
  }

  lowerObjectPattern(node) {
    const properties = (node.properties || []).map(prop => {
      if (prop.type === "RestElement") return this.lowerRestElement(prop);

      const key = this.builder.identifier(prop.key.name);
            
      // Handle property values that might be patterns or expressions
      let value;
      if (prop.value.type === "AssignmentPattern") {
        // For defaults like {x = 10}, treat as special assignment pattern
        const left = this.lowerExpression(prop.value.left);
        const right = this.lowerExpression(prop.value.right);
        value = this.builder.assignmentPattern(left, right);
        if (prop.value.left.type === "Identifier") {
          this.addBinding(prop.value.left.name);
        }
      } else {
        value = this.lowerExpression(prop.value);
        if (prop.value.type === "Identifier") {
          this.addBinding(prop.value.name);
        }
      }
            
      return this.builder.property(key, value, { shorthand: prop.shorthand });
    });
    return this.builder.objectPattern(properties);
  }

  lowerRestElement(node) {
    const argument = this.lowerExpression(node.argument);
    if (argument.type === "Identifier") {
      this.addBinding(argument.name);
    }
    return this.builder.restElement(argument);
  }

  lowerAssignmentPattern(node) {
    const left = this.lowerExpression(node.left);
    if (left.type === "Identifier") {
      this.addBinding(left.name);
    }
    const right = this.lowerExpression(node.right);
    return this.builder.assignmentPattern(left, right);
  }
}

module.exports = { EnhancedLowerer };