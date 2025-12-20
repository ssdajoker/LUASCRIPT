
/**
 * LUASCRIPT IR Builder
 * 
 * Provides convenience functions for building IR nodes.
 */

const nodes = require('./nodes');
const { Types } = require('./types');

class IRBuilder {
    constructor() {
        this.nodeStack = [];
    }

    // ========== DECLARATIONS ==========

    program(body) {
        return new nodes.Program(body);
    }

    functionDecl(name, parameters, body, returnType = null, options = {}) {
        return new nodes.FunctionDecl(name, parameters, body, returnType, options);
    }

    varDecl(name, init = null, type = null, options = {}) {
        return new nodes.VarDecl(name, init, type, options);
    }

    parameter(name, type = null, defaultValue = null, options = {}) {
        return new nodes.Parameter(name, type, defaultValue, options);
    }

    // ========== STATEMENTS ==========

    blockStmt(statements, options = {}) {
        return new nodes.Block(statements, options);
    }

    returnStmt(value = null, options = {}) {
        return new nodes.Return(value, options);
    }

    ifStmt(condition, consequent, alternate = null, options = {}) {
        return new nodes.If(condition, consequent, alternate, options);
    }

    whileStmt(condition, body, options = {}) {
        return new nodes.While(condition, body, options);
    }

    forStmt(init, condition, update, body, options = {}) {
        return new nodes.For(init, condition, update, body, options);
    }

    doWhileStmt(body, condition, options = {}) {
        return new nodes.DoWhile(body, condition, options);
    }

    switchStmt(discriminant, cases, options = {}) {
        return new nodes.Switch(discriminant, cases, options);
    }

    caseStmt(test, consequent, options = {}) {
        return new nodes.Case(test, consequent, options);
    }

    breakStmt(options = {}) {
        return new nodes.Break(options);
    }

    continueStmt(options = {}) {
        return new nodes.Continue(options);
    }

    expressionStmt(expression, options = {}) {
        return new nodes.ExpressionStmt(expression, options);
    }

    // ========== EXPRESSIONS ==========

    binaryOp(operator, left, right, options = {}) {
        return new nodes.BinaryOp(operator, left, right, options);
    }

    unaryOp(operator, operand, prefix = true, options = {}) {
        return new nodes.UnaryOp(operator, operand, prefix, options);
    }

    call(callee, args, options = {}) {
        return new nodes.Call(callee, args, options);
    }

    member(object, property, computed = false, options = {}) {
        return new nodes.Member(object, property, computed, options);
    }

    arrayLiteral(elements, options = {}) {
        return new nodes.ArrayLiteral(elements, options);
    }

    objectLiteral(properties, options = {}) {
        return new nodes.ObjectLiteral(properties, options);
    }

    property(key, value, options = {}) {
        return new nodes.Property(key, value, options);
    }

    identifier(name, options = {}) {
        return new nodes.Identifier(name, options);
    }

    literal(value, type = null, options = {}) {
        if (type === null) {
            // Infer type from value
            if (typeof value === 'number') {
                type = Types.number();
            } else if (typeof value === 'string') {
                type = Types.string();
            } else if (typeof value === 'boolean') {
                type = Types.boolean();
            } else if (value === null) {
                type = Types.null();
            } else if (value === undefined) {
                type = Types.undefined();
            }
        }
        return new nodes.Literal(value, type, options);
    }

    assignment(left, right, operator = '=', options = {}) {
        return new nodes.Assignment(left, right, operator, options);
    }

    conditional(condition, consequent, alternate, options = {}) {
        return new nodes.Conditional(condition, consequent, alternate, options);
    }

    // ========== HELPER METHODS ==========

    /**
     * Create a function call with named arguments
     */
    namedCall(functionName, args, options = {}) {
        return this.call(this.identifier(functionName), args, options);
    }

    /**
     * Create a member access (obj.prop or obj[prop])
     */
    memberAccess(objectName, propertyName, computed = false, options = {}) {
        const object = typeof objectName === 'string' 
            ? this.identifier(objectName) 
            : objectName;
        const property = typeof propertyName === 'string'
            ? this.identifier(propertyName)
            : propertyName;
        return this.member(object, property, computed, options);
    }

    /**
     * Create a simple assignment statement (var = value)
     */
    simpleAssignment(varName, value, options = {}) {
        return this.assignment(this.identifier(varName), value, '=', options);
    }

    /**
     * Create arithmetic operations
     */
    add(left, right, options = {}) {
        return this.binaryOp('+', left, right, options);
    }

    subtract(left, right, options = {}) {
        return this.binaryOp('-', left, right, options);
    }

    multiply(left, right, options = {}) {
        return this.binaryOp('*', left, right, options);
    }

    divide(left, right, options = {}) {
        return this.binaryOp('/', left, right, options);
    }

    modulo(left, right, options = {}) {
        return this.binaryOp('%', left, right, options);
    }

    /**
     * Create comparison operations
     */
    equals(left, right, options = {}) {
        return this.binaryOp('==', left, right, options);
    }

    notEquals(left, right, options = {}) {
        return this.binaryOp('!=', left, right, options);
    }

    lessThan(left, right, options = {}) {
        return this.binaryOp('<', left, right, options);
    }

    lessThanOrEqual(left, right, options = {}) {
        return this.binaryOp('<=', left, right, options);
    }

    greaterThan(left, right, options = {}) {
        return this.binaryOp('>', left, right, options);
    }

    greaterThanOrEqual(left, right, options = {}) {
        return this.binaryOp('>=', left, right, options);
    }

    /**
     * Create logical operations
     */
    and(left, right, options = {}) {
        return this.binaryOp('&&', left, right, options);
    }

    or(left, right, options = {}) {
        return this.binaryOp('||', left, right, options);
    }

    not(operand, options = {}) {
        return this.unaryOp('!', operand, true, options);
    }

    /**
     * Create a variable declaration with initialization
     */
    declareAndInit(name, value, kind = 'let', type = null, options = {}) {
        return this.varDecl(name, value, type, { ...options, kind });
    }

    /**
     * Create a constant declaration
     */
    constant(name, value, type = null, options = {}) {
        return this.declareAndInit(name, value, 'const', type, options);
    }
  constructor(options = {}) {
    const {
      schemaVersion = "1.0.0",
      moduleId,
      source = { path: null, hash: null },
      directives = [],
      metadata = {},
      exports = { type: "named", entries: [] },
      toolchain = {},
      idPrefix = "id",
    } = options;

    this.schemaVersion = schemaVersion;
    this.idGenerator = new BalancedTernaryIdGenerator({ prefix: idPrefix });
    this.nodeFactory = new IRNodeFactory({ idGenerator: this.idGenerator });

    this.module = {
      schemaVersion: this.schemaVersion,
      module: {
        id: moduleId || this.idGenerator.next("mod"),
        source,
        directives: [...directives],
        body: [],
        exports,
        metadata: Object.assign(
          {
            authoredBy: metadata.authoredBy || "ir-builder",
            createdAt: metadata.createdAt || new Date().toISOString(),
            toolchain,
          },
          metadata
        ),
      },
      nodes: {},
      controlFlowGraphs: {},
    };
  }

  addDirective(directive) {
    this.module.module.directives.push(directive);
    return this;
  }

  addExport(entry) {
    this.module.module.exports.entries.push(entry);
    return this;
  }

  /**
   * Registers a node and returns it.
   */
  registerNode(node) {
    if (!node || !node.id) {
      throw new Error("Node must have an id");
    }
    this.module.nodes[node.id] = node;
    return node;
  }

  /**
   * Adds a node id to the module body (top-level order).
   */
  pushToBody(node) {
    this.module.module.body.push(node.id);
    return node;
  }

  /**
   * Creates and registers an identifier.
   */
  identifier(name, options) {
    return this.registerNode(this.nodeFactory.createIdentifier(name, options));
  }

  literal(value, options) {
    return this.registerNode(this.nodeFactory.createLiteral(value, options));
  }

  binaryExpression(leftRef, operator, rightRef, options) {
    return this.registerNode(
      this.nodeFactory.createBinaryExpression(leftRef, operator, rightRef, options)
    );
  }

  logicalExpression(leftRef, operator, rightRef, options) {
    return this.registerNode(
      this.nodeFactory.createLogicalExpression(leftRef, operator, rightRef, options)
    );
  }

  assignmentExpression(leftRef, operator, rightRef, options) {
    return this.registerNode(
      this.nodeFactory.createAssignmentExpression(leftRef, operator, rightRef, options)
    );
  }

  variableDeclaration(declarations, options) {
    const normalizedOptions = options || {};
    return this.registerNode(
      this.nodeFactory.createVariableDeclaration(declarations, {
        declarationKind: normalizedOptions.kind || normalizedOptions.declarationKind,
        span: normalizedOptions.span,
        meta: normalizedOptions.meta,
      })
    );
  }

  variableDeclarator(patternRef, initRef, options) {
    return this.nodeFactory.createVariableDeclarator(patternRef, initRef, options);
  }

  blockStatement(statementRefs, options) {
    return this.registerNode(
      this.nodeFactory.createBlockStatement(statementRefs, options)
    );
  }

  expressionStatement(expressionRef, options) {
    return this.registerNode(
      this.nodeFactory.createExpressionStatement(expressionRef, options)
    );
  }

  returnStatement(argumentRef, options) {
    return this.registerNode(
      this.nodeFactory.createReturnStatement(argumentRef, options)
    );
  }

  breakStatement(options) {
    return this.registerNode(
      this.nodeFactory.createBreakStatement(options)
    );
  }

  continueStatement(options) {
    return this.registerNode(
      this.nodeFactory.createContinueStatement(options)
    );
  }

  ifStatement(testRef, consequentRef, alternateRef, options) {
    return this.registerNode(
      this.nodeFactory.createIfStatement(testRef, consequentRef, alternateRef, options)
    );
  }

  whileStatement(testRef, bodyRef, options) {
    return this.registerNode(
      this.nodeFactory.createWhileStatement(testRef, bodyRef, options)
    );
  }

  arrowFunctionExpression(params, bodyRef, options) {
    return this.registerNode(
      this.nodeFactory.createArrowFunctionExpression(params, bodyRef, options)
    );
  }

  callExpression(calleeRef, argumentRefs, options) {
    return this.registerNode(
      this.nodeFactory.createCallExpression(calleeRef, argumentRefs, options)
    );
  }

  createMemberExpression(objectRef, propertyRef, options) {
    return this.registerNode(
      this.nodeFactory.createMemberExpression(objectRef, propertyRef, options)
    );
  }

  tryStatement(blockRef, handler, finalizerRef, options) {
    return this.registerNode(
      this.nodeFactory.createTryStatement(blockRef, handler, finalizerRef, options)
    );
  }

  unaryExpression(operator, argumentRef, options) {
    return this.registerNode(
      this.nodeFactory.createUnaryExpression(operator, argumentRef, options)
    );
  }

  updateExpression(operator, argumentRef, options) {
    return this.registerNode(
      this.nodeFactory.createUpdateExpression(operator, argumentRef, options)
    );
  }

  conditionalExpression(testRef, consequentRef, alternateRef, options) {
    return this.registerNode(
      this.nodeFactory.createConditionalExpression(testRef, consequentRef, alternateRef, options)
    );
  }

  newExpression(calleeRef, argumentRefs, options) {
    return this.registerNode(
      this.nodeFactory.createNewExpression(calleeRef, argumentRefs, options)
    );
  }

  arrayExpression(elementRefs, options) {
    return this.registerNode(
      this.nodeFactory.createArrayExpression(elementRefs, options)
    );
  }

  property(keyRef, valueRef, options) {
    return this.registerNode(
      this.nodeFactory.createProperty(keyRef, valueRef, options)
    );
  }

  objectExpression(propertyRefs, options) {
    return this.registerNode(
      this.nodeFactory.createObjectExpression(propertyRefs, options)
    );
  }

  functionDeclaration(name, params, bodyRef, options = {}) {
    const { pushToModule = true, meta = {} } = options;
    const node = this.registerNode(
      this.nodeFactory.createFunctionDeclaration(name, params, bodyRef, {
        ...options,
        meta,
      })
    );
    if (pushToModule) {
      return this.pushToBody(node);
    }
    return node;
  }

  functionExpression(name, params, bodyRef, options = {}) {
    return this.registerNode(
      this.nodeFactory.createFunctionExpression(name, params, bodyRef, options)
    );
  }

  /**
   * Records a control-flow graph for a given function.
   */
  registerControlFlowGraph(cfgId, cfg) {
    this.module.controlFlowGraphs[cfgId] = cfg;
    return this;
  }

  /**
   * Finalizes the IR artifact and optionally validates it.
   */
  build({ validate = true } = {}) {
    if (validate) {
      const result = validateIR(this.module);
      if (!result.ok) {
        const formatted = result.errors.join("\n");
        throw new Error(`IR validation failed:\n${formatted}`);
      }
    }
    return this.module;
  }
}

// Export a singleton instance
const builder = new IRBuilder();

module.exports = {
    IRBuilder,
    builder
};
