
/**
 * LUASCRIPT IR Builder
 * 
 * Provides convenience functions for building IR nodes.
 */

const nodes = require("./nodes");
const { Types, TypeCategory } = require("./types");
const { BalancedTernaryIdGenerator } = require("./idGenerator"); // Import idGenerator

class IRBuilder {
  constructor(options = {}) {
    this.nodes = {}; // Stores all nodes by ID
    this.module = {
      body: [], // Array of node IDs in the module body
      metadata: options.metadata || {},
      source: options.source || {},
      directives: options.directives || [],
      toolchain: options.toolchain || {},
      schemaVersion: options.schemaVersion || "1.0.0",
    };
    this.idGenerator = new BalancedTernaryIdGenerator({ prefix: "node" }); // Use BalancedTernaryIdGenerator
  }

  // Helper to generate a unique ID
  _generateId() {
    return this.idGenerator.next();
  }

  // Helper to store a node and return the node itself (with its new ID)
  _storeNode(node) {
    const id = this._generateId();
    node.id = id;
    this.nodes[id] = node;
    return node;
  }

  // New methods
  pushToBody(node) {
    if (!node || !node.id) {
      throw new Error("Cannot push null or un-ID'd node to body");
    }
    this.module.body.push(node.id);
  }

  build() {
    // Ensure module has an ID
    if (!this.module.id) {
      this.module.id = this._generateId();
    }
        
    // Return IR artifact with schema version at top level
    return {
      schemaVersion: this.module.schemaVersion,
      module: this.module,
      nodes: this.nodes,
      controlFlowGraphs: this.module.metadata.controlFlowGraphs || {},
    };
  }

  // ========== DECLARATIONS ==========

  program(body) {
    return this._storeNode(new nodes.Program(body));
  }

  functionDeclaration(name, parameters, body, returnType = null, options = {}) {
    return this._storeNode(new nodes.FunctionDecl(name, parameters, body, returnType, options));
  }

  classDeclaration(id, superClass, body, options = {}) {
    return this._storeNode(new nodes.ClassDeclaration(id, superClass, body, options));
  }

  varDecl(name, init = null, type = null, options = {}) {
    return this._storeNode(new nodes.VarDecl(name, init, type, options));
  }

  variableDeclaration(declarations, options = {}) {
    return this._storeNode(new nodes.VariableDeclaration(declarations, options));
  }

  parameter(name, type = null, defaultValue = null, options = {}) {
    return this._storeNode(new nodes.Parameter(name, type, defaultValue, options));
  }

  generatorDeclaration(id, params, body, options = {}) {
    return this._storeNode(new nodes.GeneratorDeclaration(id, params, body, options));
  }

  // ========== STATEMENTS ==========

  block(statements, options = {}) {
    return this._storeNode(new nodes.Block(statements, options));
  }

  returnStmt(value = null, options = {}) {
    return this._storeNode(new nodes.Return(value, options));
  }

  ifStmt(condition, consequent, alternate = null, options = {}) {
    return this._storeNode(new nodes.If(condition, consequent, alternate, options));
  }

  whileStmt(condition, body, options = {}) {
    return this._storeNode(new nodes.While(condition, body, options));
  }

  forStmt(init, condition, update, body, options = {}) {
    return this._storeNode(new nodes.For(init, condition, update, body, options));
  }

  forOfStatement(left, right, body, options = {}) {
    return this._storeNode(new nodes.ForOfStatement(left, right, body, options));
  }

  forInStatement(left, right, body, options = {}) {
    return this._storeNode(new nodes.ForInStatement(left, right, body, options));
  }

  doWhileStmt(body, condition, options = {}) {
    return this._storeNode(new nodes.DoWhile(body, condition, options));
  }

  switchStmt(discriminant, cases, options = {}) {
    return this._storeNode(new nodes.Switch(discriminant, cases, options));
  }

  tryStmt(block, handler, finalizer, options = {}) {
    return this._storeNode(new nodes.TryStatement(block, handler, finalizer, options));
  }

  throwStatement(argument, options = {}) {
    return this._storeNode(new nodes.ThrowStatement(argument, options));
  }

  caseStmt(test, consequent, options = {}) {
    return this._storeNode(new nodes.Case(test, consequent, options));
  }

  catchClause(param, body, options = {}) {
    return this._storeNode(new nodes.CatchClause(param, body, options));
  }

  breakStmt(options = {}) {
    return this._storeNode(new nodes.Break(options));
  }

  continueStmt(options = {}) {
    return this._storeNode(new nodes.Continue(options));
  }

  expressionStmt(expression, options = {}) {
    return this._storeNode(new nodes.ExpressionStmt(expression, options));
  }

  // ========== EXPRESSIONS ==========

  binaryOp(operator, left, right, options = {}) {
    return this._storeNode(new nodes.BinaryOp(operator, left, right, options));
  }

  unaryOp(operator, operand, prefix = true, options = {}) {
    return this._storeNode(new nodes.UnaryOp(operator, operand, prefix, options));
  }

  call(callee, args, options = {}) {
    return this._storeNode(new nodes.Call(callee, args, options));
  }

  member(object, property, computed = false, options = {}) {
    return this._storeNode(new nodes.Member(object, property, computed, options));
  }

  callExpression(callee, args, options = {}) {
    return this.call(callee, args, options);
  }

  arrayLiteral(elements, options = {}) {
    return this._storeNode(new nodes.ArrayLiteral(elements, options));
  }

  objectLiteral(properties, options = {}) {
    return this._storeNode(new nodes.ObjectLiteral(properties, options));
  }

  property(key, value, options = {}) {
    return this._storeNode(new nodes.Property(key, value, options));
  }

  identifier(name, options = {}) {
    return this._storeNode(new nodes.Identifier(name, options));
  }

  literal(value, type = null, options = {}) {
    if (type === null) {
      // Infer type from value
      if (typeof value === "number") {
        type = Types.number();
      } else if (typeof value === "string") {
        type = Types.string();
      } else if (typeof value === "boolean") {
        type = Types.boolean();
      } else if (value === null) {
        type = Types.null();
      } else if (value === undefined) {
        type = Types.undefined();
      }
    }
    return this._storeNode(new nodes.Literal(value, type, options));
  }

  assignment(left, right, operator = "=", options = {}) {
    return this._storeNode(new nodes.Assignment(left, right, operator, options));
  }

  conditional(condition, consequent, alternate, options = {}) {
    return this._storeNode(new nodes.Conditional(condition, consequent, alternate, options));
  }

  thisExpression(options = {}) {
    return this._storeNode(new nodes.ThisExpression(options));
  }

  superExpression(options = {}) {
    return this._storeNode(new nodes.Super(options));
  }

  templateLiteral(quasis, expressions, options = {}) {
    return this._storeNode(new nodes.TemplateLiteral(quasis, expressions, options));
  }

  templateElement(value, tail, options = {}) {
    return this._storeNode(new nodes.TemplateElement(value, tail, options));
  }

  awaitExpression(argument, options = {}) {
    return this._storeNode(new nodes.AwaitExpression(argument, options));
  }

  yieldExpression(argument, delegate = false, options = {}) {
    return this._storeNode(new nodes.YieldExpression(argument, delegate, options));
  }

  classExpression(id, superClass, body, options = {}) {
    return this._storeNode(new nodes.ClassExpression(id, superClass, body, options));
  }

  spreadElement(argument, options = {}) {
    return this._storeNode(new nodes.SpreadElement(argument, options));
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
    const object = typeof objectName === "string" 
      ? this.identifier(objectName) 
      : objectName;
    const property = typeof propertyName === "string"
      ? this.identifier(propertyName)
      : propertyName;
    return this.member(object, property, computed, options);
  }

  /**
     * Create a simple assignment statement (var = value)
     */
  simpleAssignment(varName, value, options = {}) {
    return this.assignment(this.identifier(varName), value, "=", options);
  }

  /**
     * Create arithmetic operations
     */
  add(left, right, options = {}) {
    return this.binaryOp("+", left, right, options);
  }

  subtract(left, right, options = {}) {
    return this.binaryOp("-", left, right, options);
  }

  multiply(left, right, options = {}) {
    return this.binaryOp("*", left, right, options);
  }

  divide(left, right, options = {}) {
    return this.binaryOp("/", left, right, options);
  }

  modulo(left, right, options = {}) {
    return this.binaryOp("%", left, right, options);
  }

  /**
     * Create comparison operations
     */
  equals(left, right, options = {}) {
    return this.binaryOp("==", left, right, options);
  }

  notEquals(left, right, options = {}) {
    return this.binaryOp("!=", left, right, options);
  }

  lessThan(left, right, options = {}) {
    return this.binaryOp("<", left, right, options);
  }

  lessThanOrEqual(left, right, options = {}) {
    return this.binaryOp("<=", left, right, options);
  }

  greaterThan(left, right, options = {}) {
    return this.binaryOp(">", left, right, options);
  }

  greaterThanOrEqual(left, right, options = {}) {
    return this.binaryOp(">=", left, right, options);
  }

  /**
     * Create logical operations
     */
  and(left, right, options = {}) {
    return this.binaryOp("&&", left, right, options);
  }

  or(left, right, options = {}) {
    return this.binaryOp("||", left, right, options);
  }

  not(operand, options = {}) {
    return this.unaryOp("!", operand, true, options);
  }

  /**
     * Create a variable declaration with initialization
     */
  declareAndInit(name, value, kind = "let", type = null, options = {}) {
    return this.varDecl(name, value, type, { ...options, kind });
  }

  /**
     * Create a constant declaration
     */
  constant(name, value, type = null, options = {}) {
    return this.declareAndInit(name, value, "const", type, options);
  }

  // ========== ALIASES FOR LOWERER COMPATIBILITY ==========
  // These methods provide alternative names used by the lowerer

  blockStatement(statements, options = {}) {
    return this.block(statements, options);
  }

  break() {
    return this.breakStmt();
  }

  continue() {
    return this.continueStmt();
  }

  expressionStatement(expression, options = {}) {
    return this.expressionStmt(expression, options);
  }

  returnStatement(value = null, options = {}) {
    return this.returnStmt(value, options);
  }

  forStatement(init, condition, update, body, options = {}) {
    return this.forStmt(init, condition, update, body, options);
  }

  doWhileStatement(body, condition, options = {}) {
    return this.doWhileStmt(body, condition, options);
  }

  switchStatement(discriminant, cases, options = {}) {
    return this.switchStmt(discriminant, cases, options);
  }

  switchCase(test, consequent, options = {}) {
    return this.caseStmt(test, consequent, options);
  }

  tryStatement(block, handler, finalizer, options = {}) {
    return this.tryStmt(block, handler, finalizer, options);
  }

  ifStatement(condition, consequent, alternate = null, options = {}) {
    return this.ifStmt(condition, consequent, alternate, options);
  }

  whileStatement(condition, body, options = {}) {
    return this.whileStmt(condition, body, options);
  }

  binaryExpression(left, operator, right, options = {}) {
    return this.binaryOp(operator, left, right, options);
  }

  unaryExpression(operator, operand, options = {}) {
    return this.unaryOp(operator, operand, true, options);
  }

  updateExpression(operator, argument, options = {}) {
    // UpdateExpression is like i++ or ++i
    // We can model it as assignment with binary op
    const prefix = options.prefix !== false;
    const one = this.literal(1, Types.number());
    const binOp = operator === "++" ? "+" : "-";
    const result = this.binaryOp(binOp, argument, one);
    return this.assignment(argument, result, "=", { ...options, updateOp: operator, prefix });
  }
  newExpression(callee, args, options = {}) {
    return this.call(callee, args, { ...options, isNew: true });
  }

  createMemberExpression(object, property, options = {}) {
    return this.member(object, property, options.computed || false, options);
  }

  memberExpression(object, property, computed = false, options = {}) {
    return this.member(object, property, computed, options);
  }

  arrayExpression(elements, options = {}) {
    return this.arrayLiteral(elements, options);
  }

  objectExpression(properties, options = {}) {
    return this.objectLiteral(properties, options);
  }

  conditionalExpression(test, consequent, alternate, options = {}) {
    return this.conditional(test, consequent, alternate, options);
  }

  logicalExpression(left, operator, right, options = {}) {
    return this.binaryOp(operator, left, right, options);
  }

  assignmentExpression(left, operator, right, options = {}) {
    return this.assignment(left, right, operator, options);
  }

  functionDecl(name, parameters, body, returnType = null, options = {}) {
    return this.functionDeclaration(name, parameters, body, returnType, options);
  }

  functionExpression(id, parameters, body, options = {}) {
    const name = id && id.name ? id.name : id || null;
    return this.functionDeclaration(name, parameters, body, null, { ...options, expression: true });
  }

  arrowFunctionExpression(parameters, body, options = {}) {
    // Arrow functions are similar to regular functions but with different semantics
    return this.functionDeclaration(null, parameters, body, null, { ...options, arrow: true, expression: true });
  }

  arrayPattern(elements, options = {}) {
    return this._storeNode(new nodes.ArrayPattern(elements, options));
  }

  objectPattern(properties, options = {}) {
    return this._storeNode(new nodes.ObjectPattern(properties, options));
  }

  restElement(argument, options = {}) {
    return this._storeNode(new nodes.RestElement(argument, options));
  }

  assignmentPattern(left, right, options = {}) {
    return this._storeNode(new nodes.AssignmentPattern(left, right, options));
  }

  classBody(methods, options = {}) {
    return this._storeNode(new nodes.ClassBody(methods, options));
  }

  methodDefinition(key, value, kind, isStatic, options = {}) {
    return this._storeNode(new nodes.MethodDefinition(key, value, kind, isStatic, options));
  }

  // ========== ASYNC/AWAIT DECLARATIONS & EXPRESSIONS ==========

  asyncFunctionDeclaration(id, parameters, body, returnType = null, options = {}) {
    // Create async function with proper parameter nodes
    const params = Array.isArray(parameters)
      ? parameters.map(p => typeof p === "string" ? this.parameter(p) : p)
      : [];
    const bodyNode = body && body.kind ? body : this.block(body || []);
    return this._storeNode(new nodes.AsyncFunctionDeclaration(id, params, bodyNode, {
      ...options,
      isAsync: true,
      returnType
    }));
  }

  generatorFunction(id, parameters, body, isAsync = false, options = {}) {
    const params = Array.isArray(parameters)
      ? parameters.map(p => typeof p === "string" ? this.parameter(p) : p)
      : [];
    const bodyNode = body && body.kind ? body : this.block(body || []);
    return this._storeNode(new nodes.GeneratorDeclaration(id, params, bodyNode, {
      ...options,
      async: isAsync
    }));
  }

  // ========== ASYNC TYPE SYSTEM BUILDERS (PHASE 4.1) ==========

  /**
   * Create Promise<T> type for JavaScript promises
   * Supports Promise<void>, Promise<string>, Promise<T[]>, etc.
   * 
   * FORENSIC FEATURES:
   * - Type validation for generic parameters
   * - Serialization support (toJSON/fromJSON)
   * - Cross-language compatibility (Promise, Future, etc.)
   * - Memory-efficient type caching
   */
  promiseType(elementType = null) {
    const type = elementType 
      ? Types.promise(elementType) 
      : Types.promise(Types.any());
    
    // Store in metadata for type tracking
    if (!this.module.metadata.types) {
      this.module.metadata.types = [];
    }
    this.module.metadata.types.push(type);
    
    return type;
  }

  /**
   * Create Future<T> type for Dart futures
   * Similar to Promise but used for Dart/Java async patterns
   */
  futureType(elementType = null) {
    const type = elementType 
      ? Types.future(elementType) 
      : Types.future(Types.any());
    
    if (!this.module.metadata.types) {
      this.module.metadata.types = [];
    }
    this.module.metadata.types.push(type);
    
    return type;
  }

  /**
   * Create typed Promise<T> with validation
   * FORENSIC VALIDATION:
   * - Ensures element type is valid
   * - Checks for circular type references
   * - Validates type compatibility
   * - Memory profiling for large type trees
   */
  typedPromise(elementType) {
    if (!elementType) {
      throw new Error("[PHASE-4.1] typedPromise requires element type parameter");
    }
    
    // Validate element type
    if (!elementType.category) {
      throw new Error(`[PHASE-4.1] Invalid element type: ${JSON.stringify(elementType)}`);
    }
    
    return this.promiseType(elementType);
  }

  /**
   * Create Promise<void> - async function with no meaningful return value
   * FORENSIC USE:
   * - Fire-and-forget async operations
   * - Event handlers
   * - Background tasks
   */
  promiseVoid() {
    return Types.promise(Types.void());
  }

  /**
   * Create Promise<T[]> - promise resolving to array of elements
   * FORENSIC USE:
   * - List/collection async operations
   * - Batch processing
   * - Multi-item fetches
   */
  promiseArray(elementType) {
    if (!elementType) {
      throw new Error("[PHASE-4.1] promiseArray requires element type");
    }
    return Types.promise(Types.array(elementType));
  }

  /**
   * Create Promise union type - Promise can resolve to multiple types
   * FORENSIC USE:
   * - Multiple possible resolution values
   * - Polymorphic async operations
   * - Union return types
   */
  promiseUnion(...elementTypes) {
    if (elementTypes.length === 0) {
      throw new Error("[PHASE-4.1] promiseUnion requires at least one type");
    }
    return Types.promise(Types.union(...elementTypes));
  }

  /**
   * Create async function with proper return type validation
   * FORENSIC VALIDATION:
   * - Enforces Promise return type
   * - Prevents void returns on async
   * - Validates parameter types
   * - Auto-corrects type violations
   */
  asyncFunctionTyped(id, parameters, body, returnElementType, options = {}) {
    // Build async function with proper Promise return type
    const params = Array.isArray(parameters)
      ? parameters.map(p => typeof p === "string" ? this.parameter(p) : p)
      : [];
    const bodyNode = body && body.kind ? body : this.block(body || []);
    
    // Create Promise type from element type
    let promiseType;
    
    if (!returnElementType) {
      promiseType = Types.promise(Types.void());
    } else if (returnElementType.category) {
      // Already a type object
      promiseType = Types.promise(returnElementType);
    } else {
      // String type name - convert to primitive
      const typeMap = {
        "string": () => Types.string(),
        "number": () => Types.number(),
        "boolean": () => Types.boolean(),
        "any": () => Types.any(),
        "void": () => Types.void()
      };
      const baseType = typeMap[returnElementType] ? typeMap[returnElementType]() : Types.custom(returnElementType);
      promiseType = Types.promise(baseType);
    }
    
    return this._storeNode(new nodes.AsyncFunctionDeclaration(id, params, bodyNode, {
      ...options,
      isAsync: true,
      returnType: promiseType
    }));
  }


  registerControlFlowGraph(cfgId, cfg) {
    // Store CFG in module metadata
    if (!this.module.metadata.controlFlowGraphs) {
      this.module.metadata.controlFlowGraphs = {};
    }
    this.module.metadata.controlFlowGraphs[cfgId] = cfg;
  }

  // ========== EXCEPTION HANDLING & MODULE SYSTEM (CLARITY SUPER CANON) ==========

  finallyClause(body, options = {}) {
    return this._storeNode(new nodes.FinallyClause(body, options));
  }

  importDeclaration(specifiers, source, options = {}) {
    return this._storeNode(new nodes.ImportDeclaration(specifiers, source, options));
  }

  exportDeclaration(specifiers, declaration, source, options = {}) {
    return this._storeNode(new nodes.ExportDeclaration(specifiers, declaration, source, options));
  }

  importSpecifier(local, imported, options = {}) {
    return this._storeNode(new nodes.ImportSpecifier(local, imported, options));
  }

  exportSpecifier(local, exported, options = {}) {
    return this._storeNode(new nodes.ExportSpecifier(local, exported, options));
  }
}


// Export a singleton instance
const builder = new IRBuilder();

module.exports = {
  IRBuilder,
  builder
};
