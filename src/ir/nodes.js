
/**
 * LUASCRIPT IR Node Definitions
 * 
 * Defines all node types for the canonical Intermediate Representation.
 */


/**
 * Node Categories
 */
const NodeCategory = {
  // Declarations
  PROGRAM: "Program",
  FUNCTION_DECL: "FunctionDeclaration",
  VAR_DECL: "VariableDeclarator", // Deprecated: use VARIABLE_DECLARATION (kept as alias for backward compatibility)
  VARIABLE_DECLARATION: "VariableDeclaration",
  PARAMETER: "Parameter",
    
  // Statements
  BLOCK: "BlockStatement",
  RETURN: "ReturnStatement",
  IF: "IfStatement",
  WHILE: "WhileStatement",
  FOR: "ForStatement",
  DO_WHILE: "DoWhileStatement",
  SWITCH: "SwitchStatement",
  CASE: "SwitchCase",
  BREAK: "BreakStatement",
  CONTINUE: "ContinueStatement",
  EXPRESSION_STMT: "ExpressionStatement",
  TRY: "TryStatement",
  CATCH: "CatchClause",
  THROW: "ThrowStatement",
  FOR_OF: "ForOfStatement",
  FOR_IN: "ForInStatement",
    
  // Async/Await
  ASYNC_FUNCTION: "AsyncFunctionDeclaration",
  AWAIT: "AwaitExpression",
    
  // Generators
  GENERATOR_FUNCTION: "GeneratorDeclaration",
  YIELD: "YieldExpression",
    
  // Classes
  CLASS_DECL: "ClassDeclaration",
  CLASS_EXPR: "ClassExpression",
  METHOD_DEF: "MethodDefinition",
  CLASS_BODY: "ClassBody",
  SUPER: "Super",
  THIS: "ThisExpression",
    
  // Expressions
  BINARY_OP: "BinaryExpression",
  UNARY_OP: "UnaryExpression",
  CALL: "CallExpression",
  MEMBER: "MemberExpression",
  ARRAY_LITERAL: "ArrayExpression",
  OBJECT_LITERAL: "ObjectExpression",
  IDENTIFIER: "Identifier",
  LITERAL: "Literal",
  ASSIGNMENT: "AssignmentExpression",
  CONDITIONAL: "ConditionalExpression",
  TEMPLATE_LITERAL: "TemplateLiteral",
  TEMPLATE_ELEMENT: "TemplateElement",
  TAGGED_TEMPLATE: "TaggedTemplateExpression",
    
  // Patterns
  ARRAY_PATTERN: "ArrayPattern",
  OBJECT_PATTERN: "ObjectPattern",
  REST_ELEMENT: "RestElement",
  ASSIGNMENT_PATTERN: "AssignmentPattern",
  SPREAD_ELEMENT: "SpreadElement",
    
  // Special
  PROPERTY: "Property"
};

let fromJsonHandlers;

function toJsonValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(toJsonValue);
  return typeof value.toJSON === "function" ? value.toJSON() : value;
}

/**
 * Base Node class
 */
class IRNode {
  constructor(kind, options = {}) {
    this.kind = kind;
    this.loc = options.loc || null; // Source location
    this.metadata = options.metadata || {};
  }

  toJSON() {
    const json = { kind: this.kind };
        
    if (this.loc) json.loc = this.loc;
    if (Object.keys(this.metadata).length > 0) json.metadata = this.metadata;
        
    return json;
  }

  static fromJSON(json) {
    if (json === null || json === undefined) {
      throw new Error("Invalid IR JSON: expected a non-null object");
    }

    if (typeof json !== "object") {
      throw new Error(`Invalid IR JSON: expected an object but received ${typeof json}`);
    }

    if (!Object.prototype.hasOwnProperty.call(json, "kind")) {
      throw new Error("Invalid IR JSON: missing 'kind' property");
    }

    // Factory method to reconstruct nodes from JSON
    switch (json.kind) {
    case NodeCategory.PROGRAM:
      return Program.fromJSON(json);
    case NodeCategory.FUNCTION_DECL:
      return FunctionDecl.fromJSON(json);
    case NodeCategory.VAR_DECL:
      return VarDecl.fromJSON(json);
    case NodeCategory.VARIABLE_DECLARATION: // Add this case
      return VariableDeclaration.fromJSON(json);
    case NodeCategory.PARAMETER:
      return Parameter.fromJSON(json);
    case NodeCategory.BLOCK:
      return Block.fromJSON(json);
    case NodeCategory.RETURN:
      return Return.fromJSON(json);
    case NodeCategory.IF:
      return If.fromJSON(json);
    case NodeCategory.WHILE:
      return While.fromJSON(json);
    case NodeCategory.FOR:
      return For.fromJSON(json);
    case NodeCategory.DO_WHILE:
      return DoWhile.fromJSON(json);
    case NodeCategory.SWITCH:
      return Switch.fromJSON(json);
    case NodeCategory.CASE:
      return Case.fromJSON(json);
    case NodeCategory.BREAK:
      return Break.fromJSON(json);
    case NodeCategory.CONTINUE:
      return Continue.fromJSON(json);
    case NodeCategory.EXPRESSION_STMT:
      return ExpressionStmt.fromJSON(json);
    case NodeCategory.TRY:
      return TryStatement.fromJSON(json);
    case NodeCategory.CATCH:
      return CatchClause.fromJSON(json);
    case NodeCategory.THROW:
      return ThrowStatement.fromJSON(json);
    case NodeCategory.FOR_OF:
      return ForOfStatement.fromJSON(json);
    case NodeCategory.FOR_IN:
      return ForInStatement.fromJSON(json);
    case NodeCategory.ASYNC_FUNCTION:
      return AsyncFunctionDeclaration.fromJSON(json);
    case NodeCategory.AWAIT:
      return AwaitExpression.fromJSON(json);
    case NodeCategory.GENERATOR_FUNCTION:
      return GeneratorDeclaration.fromJSON(json);
    case NodeCategory.YIELD:
      return YieldExpression.fromJSON(json);
    case NodeCategory.CLASS_DECL:
      return ClassDeclaration.fromJSON(json);
    case NodeCategory.CLASS_EXPR:
      return ClassExpression.fromJSON(json);
    case NodeCategory.METHOD_DEF:
      return MethodDefinition.fromJSON(json);
    case NodeCategory.CLASS_BODY:
      return ClassBody.fromJSON(json);
    case NodeCategory.BINARY_OP:
      return BinaryOp.fromJSON(json);
    case NodeCategory.UNARY_OP:
      return UnaryOp.fromJSON(json);
    case NodeCategory.CALL:
      return Call.fromJSON(json);
    case NodeCategory.MEMBER:
      return Member.fromJSON(json);
    case NodeCategory.ARRAY_LITERAL:
      return ArrayLiteral.fromJSON(json);
    case NodeCategory.OBJECT_LITERAL:
      return ObjectLiteral.fromJSON(json);
    case NodeCategory.IDENTIFIER:
      return Identifier.fromJSON(json);
    case NodeCategory.LITERAL:
      return Literal.fromJSON(json);
    case NodeCategory.ASSIGNMENT:
      return Assignment.fromJSON(json);
    case NodeCategory.CONDITIONAL:
      return Conditional.fromJSON(json);
    case NodeCategory.PROPERTY:
      return Property.fromJSON(json);
    case NodeCategory.ARRAY_PATTERN:
      return ArrayPattern.fromJSON(json);
    case NodeCategory.OBJECT_PATTERN:
      return ObjectPattern.fromJSON(json);
    case NodeCategory.REST_ELEMENT:
      return RestElement.fromJSON(json);
    case NodeCategory.ASSIGNMENT_PATTERN:
      return AssignmentPattern.fromJSON(json);
    case NodeCategory.TAGGED_TEMPLATE:
      return TaggedTemplateExpression.fromJSON(json);
    case NodeCategory.TEMPLATE_LITERAL:
      return TemplateLiteral.fromJSON(json);
    case NodeCategory.TEMPLATE_ELEMENT:
      return TemplateElement.fromJSON(json);
    case NodeCategory.SPREAD_ELEMENT:
      return SpreadElement.fromJSON(json);
    case NodeCategory.SUPER:
      return Super.fromJSON(json);
    case NodeCategory.THIS:
      return ThisExpression.fromJSON(json);
    default:
      throw new Error(`No fromJSON handler registered for node kind: ${json.kind}`);
    }
  }
}

// ========== DECLARATIONS ==========

class Program extends IRNode {
  constructor(body, options = {}) {
    super(NodeCategory.PROGRAM, options);
    this.body = body; // Array of statements
  }

  toJSON() {
    return {
      ...super.toJSON(),
      body: this.body.map(stmt => toJsonValue(stmt))
    };
  }

  static fromJSON(json) {
    return new Program(
      json.body.map(stmt => IRNode.fromJSON(stmt)),
      json
    );
  }
}

class FunctionDecl extends IRNode {
  constructor(name, parameters, body, returnType = null, options = {}) {
    super(NodeCategory.FUNCTION_DECL, options);
    this.name = name;
    this.parameters = parameters; // Array of Parameter nodes
    this.body = body; // Block node
    this.returnType = returnType;
    this.async = options.async || false; // Add async property
    this.arrow = Boolean(options.arrow);
    this.expression = Boolean(options.expression);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      parameters: this.parameters.map(p => toJsonValue(p)),
      body: toJsonValue(this.body),
      returnType: toJsonValue(this.returnType),
      async: this.async, // Serialize async property
      arrow: this.arrow,
      expression: this.expression
    };
  }

  static fromJSON(json) {
    return new FunctionDecl(
      json.name,
      json.parameters.map(p => IRNode.fromJSON(p)),
      IRNode.fromJSON(json.body),
      json.returnType ? require("./types").Type.fromJSON(json.returnType) : null,
      { ...json, async: json.async, arrow: json.arrow, expression: json.expression } // Deserialize async property
    );
  }
}

class VarDecl extends IRNode {
  constructor(name, init = null, type = null, options = {}) {
    super(NodeCategory.VAR_DECL, options);
    this.name = name;
    this.init = init; // Expression node or null
    this.type = type; // Type or null
    this.varKind = options.kind || "let"; // 'let', 'const', 'var'
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      init: toJsonValue(this.init),
      type: toJsonValue(this.type),
      varKind: this.varKind
    };
  }

  static fromJSON(json) {
    return new VarDecl(
      json.name,
      json.init ? IRNode.fromJSON(json.init) : null,
      json.type ? require("./types").Type.fromJSON(json.type) : null,
      { ...json, kind: json.varKind }
    );
  }
}

class VariableDeclaration extends IRNode {
  constructor(declarations, options = {}) {
    super(NodeCategory.VARIABLE_DECLARATION, options);
    this.declarations = declarations; // Array of VarDecl nodes
    this.declarationKind = options.kind || "let"; // 'let', 'const', 'var' - renamed from kind to avoid collision
  }

  toJSON() {
    return {
      ...super.toJSON(),
      declarations: this.declarations.map(decl => decl.toJSON()),
      declarationKind: this.declarationKind
    };
  }

  static fromJSON(json) {
    return new VariableDeclaration(
      json.declarations.map(decl => IRNode.fromJSON(decl)),
      { kind: json.declarationKind }
    );
  }
}

class Parameter extends IRNode {
  constructor(name, type = null, defaultValue = null, options = {}) {
    super(NodeCategory.PARAMETER, options);
    this.name = name;
    this.type = type;
    this.defaultValue = defaultValue;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      type: this.type ? this.type.toJSON() : null,
      defaultValue: this.defaultValue ? this.defaultValue.toJSON() : null
    };
  }

  static fromJSON(json) {
    return new Parameter(
      json.name,
      json.type ? require("./types").Type.fromJSON(json.type) : null,
      json.defaultValue ? IRNode.fromJSON(json.defaultValue) : null,
      json
    );
  }
}

// ========== STATEMENTS ==========

class Block extends IRNode {
  constructor(statements, options = {}) {
    super(NodeCategory.BLOCK, options);
    this.statements = statements;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      statements: this.statements.map(stmt => (stmt && typeof stmt.toJSON === "function" ? stmt.toJSON() : stmt))
    };
  }

  static fromJSON(json) {
    return new Block(
      json.statements.map(stmt => IRNode.fromJSON(stmt)),
      json
    );
  }
}

class Return extends IRNode {
  constructor(value = null, options = {}) {
    super(NodeCategory.RETURN, options);
    this.value = value;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value
        ? (typeof this.value.toJSON === "function" ? this.value.toJSON() : this.value)
        : null
    };
  }

  static fromJSON(json) {
    return new Return(
      json.value ? IRNode.fromJSON(json.value) : null,
      json
    );
  }
}

class If extends IRNode {
  constructor(condition, consequent, alternate = null, options = {}) {
    super(NodeCategory.IF, options);
    this.condition = condition;
    this.consequent = consequent; // Block or statement
    this.alternate = alternate; // Block, If, or null
  }

  toJSON() {
    return {
      ...super.toJSON(),
      condition: toJsonValue(this.condition),
      consequent: toJsonValue(this.consequent),
      alternate: toJsonValue(this.alternate)
    };
  }

  static fromJSON(json) {
    return new If(
      IRNode.fromJSON(json.condition),
      IRNode.fromJSON(json.consequent),
      json.alternate ? IRNode.fromJSON(json.alternate) : null,
      json
    );
  }
}

class While extends IRNode {
  constructor(condition, body, options = {}) {
    super(NodeCategory.WHILE, options);
    this.condition = condition;
    this.body = body;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      condition: toJsonValue(this.condition),
      body: toJsonValue(this.body)
    };
  }

  static fromJSON(json) {
    return new While(
      IRNode.fromJSON(json.condition),
      IRNode.fromJSON(json.body),
      json
    );
  }
}

class For extends IRNode {
  constructor(init, condition, update, body, options = {}) {
    super(NodeCategory.FOR, options);
    this.init = init; // VarDecl, Assignment, or null
    this.condition = condition; // Expression or null
    this.update = update; // Expression or null
    this.body = body;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      init: toJsonValue(this.init),
      condition: toJsonValue(this.condition),
      update: toJsonValue(this.update),
      body: toJsonValue(this.body)
    };
  }

  static fromJSON(json) {
    return new For(
      json.init ? IRNode.fromJSON(json.init) : null,
      json.condition ? IRNode.fromJSON(json.condition) : null,
      json.update ? IRNode.fromJSON(json.update) : null,
      IRNode.fromJSON(json.body),
      json
    );
  }
}

class DoWhile extends IRNode {
  constructor(body, condition, options = {}) {
    super(NodeCategory.DO_WHILE, options);
    this.body = body;
    this.condition = condition;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      body: toJsonValue(this.body),
      condition: toJsonValue(this.condition)
    };
  }

  static fromJSON(json) {
    return new DoWhile(
      IRNode.fromJSON(json.body),
      IRNode.fromJSON(json.condition),
      json
    );
  }
}

class Switch extends IRNode {
  constructor(discriminant, cases, options = {}) {
    super(NodeCategory.SWITCH, options);
    this.discriminant = discriminant;
    this.cases = cases; // Array of Case nodes
  }

  toJSON() {
    return {
      ...super.toJSON(),
      discriminant: toJsonValue(this.discriminant),
      cases: this.cases.map(c => toJsonValue(c))
    };
  }

  static fromJSON(json) {
    return new Switch(
      IRNode.fromJSON(json.discriminant),
      json.cases.map(c => IRNode.fromJSON(c)),
      json
    );
  }
}

class Case extends IRNode {
  constructor(test, consequent, options = {}) {
    super(NodeCategory.CASE, options);
    this.test = test; // Expression or null (for default)
    this.consequent = consequent; // Array of statements
  }

  toJSON() {
    return {
      ...super.toJSON(),
      test: toJsonValue(this.test),
      consequent: this.consequent.map(stmt => toJsonValue(stmt))
    };
  }

  static fromJSON(json) {
    return new Case(
      json.test ? IRNode.fromJSON(json.test) : null,
      json.consequent.map(stmt => IRNode.fromJSON(stmt)),
      json
    );
  }
}

class Break extends IRNode {
  constructor(options = {}) {
    super(NodeCategory.BREAK, options);
  }

  static fromJSON(json) {
    return new Break(json);
  }
}

class Continue extends IRNode {
  constructor(options = {}) {
    super(NodeCategory.CONTINUE, options);
  }

  static fromJSON(json) {
    return new Continue(json);
  }
}

class ExpressionStmt extends IRNode {
  constructor(expression, options = {}) {
    super(NodeCategory.EXPRESSION_STMT, options);
    this.expression = expression;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      expression: toJsonValue(this.expression)
    };
  }

  static fromJSON(json) {
    return new ExpressionStmt(
      IRNode.fromJSON(json.expression),
      json
    );
  }
}

// ========== EXPRESSIONS ==========

class BinaryOp extends IRNode {
  constructor(operator, left, right, options = {}) {
    super(NodeCategory.BINARY_OP, options);
    this.operator = operator; // +, -, *, /, %, ==, !=, <, >, <=, >=, &&, ||, etc.
    this.left = left;
    this.right = right;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operator: this.operator,
      left: toJsonValue(this.left),
      right: toJsonValue(this.right)
    };
  }

  static fromJSON(json) {
    return new BinaryOp(
      json.operator,
      IRNode.fromJSON(json.left),
      IRNode.fromJSON(json.right),
      json
    );
  }
}

class UnaryOp extends IRNode {
  constructor(operator, operand, prefix = true, options = {}) {
    super(NodeCategory.UNARY_OP, options);
    this.operator = operator; // +, -, !, ~, ++, --, typeof, etc.
    this.operand = operand;
    this.prefix = prefix;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operator: this.operator,
      operand: toJsonValue(this.operand),
      prefix: this.prefix
    };
  }

  static fromJSON(json) {
    return new UnaryOp(
      json.operator,
      IRNode.fromJSON(json.operand),
      json.prefix,
      json
    );
  }
}

class Call extends IRNode {
  constructor(callee, args, options = {}) {
    super(NodeCategory.CALL, options);
    this.callee = callee; // Identifier or Member
    this.args = args; // Array of expressions
    this.optional = options.optional || false;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      callee: toJsonValue(this.callee),
      args: this.args.map(arg => toJsonValue(arg)),
      optional: this.optional
    };
  }

  static fromJSON(json) {
    return new Call(
      IRNode.fromJSON(json.callee),
      json.args.map(arg => IRNode.fromJSON(arg)),
      json
    );
  }
}

class Member extends IRNode {
  constructor(object, property, computed = false, options = {}) {
    super(NodeCategory.MEMBER, options);
    this.object = object;
    this.property = property;
    this.computed = computed; // true for obj[prop], false for obj.prop
    this.optional = options.optional || false;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      object: toJsonValue(this.object),
      property: toJsonValue(this.property),
      computed: this.computed,
      optional: this.optional
    };
  }

  static fromJSON(json) {
    return new Member(
      IRNode.fromJSON(json.object),
      IRNode.fromJSON(json.property),
      json.computed,
      json
    );
  }
}

class ArrayLiteral extends IRNode {
  constructor(elements, options = {}) {
    super(NodeCategory.ARRAY_LITERAL, options);
    this.elements = elements; // Array of expressions
  }

  toJSON() {
    return {
      ...super.toJSON(),
      elements: this.elements.map(el => toJsonValue(el))
    };
  }

  static fromJSON(json) {
    return new ArrayLiteral(
      json.elements.map(el => el ? IRNode.fromJSON(el) : null),
      json
    );
  }
}

class ObjectLiteral extends IRNode {
  constructor(properties, options = {}) {
    super(NodeCategory.OBJECT_LITERAL, options);
    this.properties = properties; // Array of Property nodes
  }

  toJSON() {
    return {
      ...super.toJSON(),
      properties: this.properties.map(prop => toJsonValue(prop))
    };
  }

  static fromJSON(json) {
    return new ObjectLiteral(
      json.properties.map(prop => IRNode.fromJSON(prop)),
      json
    );
  }
}

class Property extends IRNode {
  constructor(key, value, options = {}) {
    super(NodeCategory.PROPERTY, options);
    this.key = key; // Identifier or Literal
    this.value = value; // Expression
  }

  toJSON() {
    return {
      ...super.toJSON(),
      key: toJsonValue(this.key),
      value: toJsonValue(this.value)
    };
  }

  static fromJSON(json) {
    return new Property(
      IRNode.fromJSON(json.key),
      IRNode.fromJSON(json.value),
      json
    );
  }
}

class Identifier extends IRNode {
  constructor(name, options = {}) {
    super(NodeCategory.IDENTIFIER, options);
    this.name = name;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name
    };
  }

  static fromJSON(json) {
    return new Identifier(json.name, json);
  }
}

class Literal extends IRNode {
  constructor(value, type = null, options = {}) {
    super(NodeCategory.LITERAL, options);
    this.value = value;
    this.type = type;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value,
      type: toJsonValue(this.type)
    };
  }

  static fromJSON(json) {
    return new Literal(
      json.value,
      json.type ? require("./types").Type.fromJSON(json.type) : null,
      json
    );
  }
}

class Assignment extends IRNode {
  constructor(left, right, operator = "=", options = {}) {
    super(NodeCategory.ASSIGNMENT, options);
    this.left = left; // Identifier or Member
    this.right = right; // Expression
    this.operator = operator; // =, +=, -=, *=, /=, etc.
  }

  toJSON() {
    return {
      ...super.toJSON(),
      left: toJsonValue(this.left),
      right: toJsonValue(this.right),
      operator: this.operator
    };
  }

  static fromJSON(json) {
    return new Assignment(
      IRNode.fromJSON(json.left),
      IRNode.fromJSON(json.right),
      json.operator,
      json
    );
  }
}

class Conditional extends IRNode {
  constructor(condition, consequent, alternate, options = {}) {
    super(NodeCategory.CONDITIONAL, options);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      condition: toJsonValue(this.condition),
      consequent: toJsonValue(this.consequent),
      alternate: toJsonValue(this.alternate)
    };
  }

  static fromJSON(json) {
    return new Conditional(
      IRNode.fromJSON(json.condition),
      IRNode.fromJSON(json.consequent),
      IRNode.fromJSON(json.alternate),
      json
    );
  }
}

// Pattern nodes for destructuring
class ArrayPattern extends IRNode {
  constructor(elements, options = {}) {
    super(NodeCategory.ARRAY_PATTERN, options);
    this.elements = elements; // Array of pattern elements (can be null for holes)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      elements: this.elements
    };
  }

  static fromJSON(json) {
    return new ArrayPattern(json.elements, json);
  }
}

class ObjectPattern extends IRNode {
  constructor(properties, options = {}) {
    super(NodeCategory.OBJECT_PATTERN, options);
    this.properties = properties; // Array of Property nodes
  }

  toJSON() {
    return {
      ...super.toJSON(),
      properties: this.properties
    };
  }

  static fromJSON(json) {
    return new ObjectPattern(json.properties, json);
  }
}

class RestElement extends IRNode {
  constructor(argument, options = {}) {
    super(NodeCategory.REST_ELEMENT, options);
    this.argument = argument; // Pattern or Identifier
  }

  toJSON() {
    return {
      ...super.toJSON(),
      argument: this.argument
    };
  }

  static fromJSON(json) {
    return new RestElement(json.argument, json);
  }
}

class AssignmentPattern extends IRNode {
  constructor(left, right, options = {}) {
    super(NodeCategory.ASSIGNMENT_PATTERN, options);
    this.left = left; // Pattern or Identifier
    this.right = right; // Expression (default value)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      left: this.left,
      right: this.right
    };
  }

  static fromJSON(json) {
    return new AssignmentPattern(json.left, json.right, json);
  }
}

// ========== NEW NODES: Async/Await/Classes/Control Flow ==========

class AsyncFunctionDeclaration extends IRNode {
  constructor(id, params, body, options = {}) {
    super(NodeCategory.ASYNC_FUNCTION, options);
    this.id = id;
    this.params = params;
    this.body = body;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      id: this.id,
      params: this.params,
      body: this.body
    };
  }

  static fromJSON(json) {
    return new AsyncFunctionDeclaration(json.id, json.params, json.body, json);
  }
}

class AwaitExpression extends IRNode {
  constructor(argument, options = {}) {
    super(NodeCategory.AWAIT, options);
    this.argument = argument;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      argument: this.argument
    };
  }

  static fromJSON(json) {
    return new AwaitExpression(json.argument, json);
  }
}

class GeneratorDeclaration extends IRNode {
  constructor(id, params, body, options = {}) {
    super(NodeCategory.GENERATOR_FUNCTION, options);
    this.id = id;
    this.params = params;
    this.body = body;
    this.async = options.async || false;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      id: this.id,
      params: this.params,
      body: this.body,
      async: this.async
    };
  }

  static fromJSON(json) {
    return new GeneratorDeclaration(json.id, json.params, json.body, json);
  }
}

class YieldExpression extends IRNode {
  constructor(argument, delegate = false, options = {}) {
    super(NodeCategory.YIELD, options);
    this.argument = argument;
    this.delegate = delegate; // true for yield*
  }

  toJSON() {
    return {
      ...super.toJSON(),
      argument: this.argument,
      delegate: this.delegate
    };
  }

  static fromJSON(json) {
    return new YieldExpression(json.argument, json.delegate, json);
  }
}

class ClassDeclaration extends IRNode {
  constructor(id, superClass, body, options = {}) {
    super(NodeCategory.CLASS_DECL, options);
    this.id = id;
    this.superClass = superClass || null;
    this.body = body;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      id: this.id,
      superClass: this.superClass,
      body: this.body
    };
  }

  static fromJSON(json) {
    return new ClassDeclaration(json.id, json.superClass, json.body, json);
  }
}

class ClassExpression extends IRNode {
  constructor(id, superClass, body, options = {}) {
    super(NodeCategory.CLASS_EXPR, options);
    this.id = id || null;
    this.superClass = superClass || null;
    this.body = body;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      id: this.id,
      superClass: this.superClass,
      body: this.body
    };
  }

  static fromJSON(json) {
    return new ClassExpression(json.id, json.superClass, json.body, json);
  }
}

class MethodDefinition extends IRNode {
  constructor(key, value, kind, isStatic = false, options = {}) {
    super(NodeCategory.METHOD_DEF, options);
    this.key = key; // Identifier
    this.value = value; // FunctionExpression
    this.kind = kind; // 'constructor', 'method', 'get', 'set'
    this.static = isStatic;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      key: this.key,
      value: this.value,
      kind: this.kind,
      static: this.static
    };
  }

  static fromJSON(json) {
    return new MethodDefinition(json.key, json.value, json.kind, json.static, json);
  }
}

class ClassBody extends IRNode {
  constructor(body, options = {}) {
    super(NodeCategory.CLASS_BODY, options);
    this.body = body; // Array of MethodDefinition
  }

  toJSON() {
    return {
      ...super.toJSON(),
      body: this.body
    };
  }

  static fromJSON(json) {
    return new ClassBody(json.body, json);
  }
}

class TryStatement extends IRNode {
  constructor(block, handler, finalizer, options = {}) {
    super(NodeCategory.TRY, options);
    this.block = block; // BlockStatement
    this.handler = handler || null; // CatchClause
    this.finalizer = finalizer || null; // BlockStatement
  }

  toJSON() {
    return {
      ...super.toJSON(),
      block: this.block,
      handler: this.handler,
      finalizer: this.finalizer
    };
  }

  static fromJSON(json) {
    return new TryStatement(json.block, json.handler, json.finalizer, json);
  }
}

class CatchClause extends IRNode {
  constructor(param, body, options = {}) {
    super(NodeCategory.CATCH, options);
    this.param = param; // Identifier
    this.body = body; // BlockStatement
  }

  toJSON() {
    return {
      ...super.toJSON(),
      param: this.param,
      body: this.body
    };
  }

  static fromJSON(json) {
    return new CatchClause(json.param, json.body, json);
  }
}

class ThrowStatement extends IRNode {
  constructor(argument, options = {}) {
    super(NodeCategory.THROW, options);
    this.argument = argument;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      argument: this.argument
    };
  }

  static fromJSON(json) {
    return new ThrowStatement(json.argument, json);
  }
}

class ForOfStatement extends IRNode {
  constructor(left, right, body, options = {}) {
    super(NodeCategory.FOR_OF, options);
    this.left = left; // VariableDeclaration or Pattern
    this.right = right; // Expression (iterable)
    this.body = body; // BlockStatement
    this.await = Boolean(options.await);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      left: this.left,
      right: this.right,
      body: this.body,
      await: this.await
    };
  }

  static fromJSON(json) {
    return new ForOfStatement(json.left, json.right, json.body, json);
  }
}

class ForInStatement extends IRNode {
  constructor(left, right, body, options = {}) {
    super(NodeCategory.FOR_IN, options);
    this.left = left;
    this.right = right;
    this.body = body;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      left: this.left,
      right: this.right,
      body: this.body
    };
  }

  static fromJSON(json) {
    return new ForInStatement(json.left, json.right, json.body, json);
  }
}


class TaggedTemplateExpression extends IRNode {
  constructor(tag, quasi, options = {}) {
    super(NodeCategory.TAGGED_TEMPLATE, options);
    this.tag = tag;
    this.quasi = quasi;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      tag: toJsonValue(this.tag),
      quasi: toJsonValue(this.quasi)
    };
  }

  static fromJSON(json) {
    return new TaggedTemplateExpression(
      IRNode.fromJSON(json.tag),
      IRNode.fromJSON(json.quasi),
      json
    );
  }
}


class TemplateLiteral extends IRNode {
  constructor(quasis, expressions, options = {}) {
    super(NodeCategory.TEMPLATE_LITERAL, options);
    this.quasis = quasis; // Array of TemplateElement
    this.expressions = expressions; // Array of Expression
  }

  toJSON() {
    return {
      ...super.toJSON(),
      quasis: this.quasis,
      expressions: this.expressions
    };
  }

  static fromJSON(json) {
    return new TemplateLiteral(json.quasis, json.expressions, json);
  }
}

class TemplateElement extends IRNode {
  constructor(value, tail = false, options = {}) {
    super(NodeCategory.TEMPLATE_ELEMENT, options);
    this.value = value; // { raw, cooked }
    this.tail = tail;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value,
      tail: this.tail
    };
  }

  static fromJSON(json) {
    return new TemplateElement(json.value, json.tail, json);
  }
}

class SpreadElement extends IRNode {
  constructor(argument, options = {}) {
    super(NodeCategory.SPREAD_ELEMENT, options);
    this.argument = argument;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      argument: this.argument
    };
  }

  static fromJSON(json) {
    return new SpreadElement(json.argument, json);
  }
}

class Super extends IRNode {
  constructor(options = {}) {
    super(NodeCategory.SUPER, options);
  }

  toJSON() {
    return super.toJSON();
  }

  static fromJSON(json) {
    return new Super(json);
  }
}

class ThisExpression extends IRNode {
  constructor(options = {}) {
    super(NodeCategory.THIS, options);
  }

  toJSON() {
    return super.toJSON();
  }

  static fromJSON(json) {
    return new ThisExpression(json);
  }
}

fromJsonHandlers = Object.freeze({
  [NodeCategory.PROGRAM]: Program.fromJSON,
  [NodeCategory.FUNCTION_DECL]: FunctionDecl.fromJSON,
  [NodeCategory.VAR_DECL]: VarDecl.fromJSON,
  [NodeCategory.VARIABLE_DECLARATION]: VariableDeclaration.fromJSON,
  [NodeCategory.PARAMETER]: Parameter.fromJSON,
  [NodeCategory.BLOCK]: Block.fromJSON,
  [NodeCategory.RETURN]: Return.fromJSON,
  [NodeCategory.IF]: If.fromJSON,
  [NodeCategory.WHILE]: While.fromJSON,
  [NodeCategory.FOR]: For.fromJSON,
  [NodeCategory.DO_WHILE]: DoWhile.fromJSON,
  [NodeCategory.SWITCH]: Switch.fromJSON,
  [NodeCategory.CASE]: Case.fromJSON,
  [NodeCategory.BREAK]: Break.fromJSON,
  [NodeCategory.CONTINUE]: Continue.fromJSON,
  [NodeCategory.EXPRESSION_STMT]: ExpressionStmt.fromJSON,
  [NodeCategory.TRY]: TryStatement.fromJSON,
  [NodeCategory.CATCH]: CatchClause.fromJSON,
  [NodeCategory.THROW]: ThrowStatement.fromJSON,
  [NodeCategory.FOR_OF]: ForOfStatement.fromJSON,
  [NodeCategory.FOR_IN]: ForInStatement.fromJSON,
  [NodeCategory.ASYNC_FUNCTION]: AsyncFunctionDeclaration.fromJSON,
  [NodeCategory.AWAIT]: AwaitExpression.fromJSON,
  [NodeCategory.GENERATOR_FUNCTION]: GeneratorDeclaration.fromJSON,
  [NodeCategory.YIELD]: YieldExpression.fromJSON,
  [NodeCategory.CLASS_DECL]: ClassDeclaration.fromJSON,
  [NodeCategory.CLASS_EXPR]: ClassExpression.fromJSON,
  [NodeCategory.METHOD_DEF]: MethodDefinition.fromJSON,
  [NodeCategory.CLASS_BODY]: ClassBody.fromJSON,
  [NodeCategory.SUPER]: Super.fromJSON,
  [NodeCategory.THIS]: ThisExpression.fromJSON,
  [NodeCategory.BINARY_OP]: BinaryOp.fromJSON,
  [NodeCategory.UNARY_OP]: UnaryOp.fromJSON,
  [NodeCategory.CALL]: Call.fromJSON,
  [NodeCategory.MEMBER]: Member.fromJSON,
  [NodeCategory.ARRAY_LITERAL]: ArrayLiteral.fromJSON,
  [NodeCategory.OBJECT_LITERAL]: ObjectLiteral.fromJSON,
  [NodeCategory.IDENTIFIER]: Identifier.fromJSON,
  [NodeCategory.LITERAL]: Literal.fromJSON,
  [NodeCategory.ASSIGNMENT]: Assignment.fromJSON,
  [NodeCategory.CONDITIONAL]: Conditional.fromJSON,
  [NodeCategory.TEMPLATE_LITERAL]: TemplateLiteral.fromJSON,
  [NodeCategory.TEMPLATE_ELEMENT]: TemplateElement.fromJSON,
  [NodeCategory.TAGGED_TEMPLATE]: TaggedTemplateExpression.fromJSON,
  [NodeCategory.ARRAY_PATTERN]: ArrayPattern.fromJSON,
  [NodeCategory.OBJECT_PATTERN]: ObjectPattern.fromJSON,
  [NodeCategory.REST_ELEMENT]: RestElement.fromJSON,
  [NodeCategory.ASSIGNMENT_PATTERN]: AssignmentPattern.fromJSON,
  [NodeCategory.SPREAD_ELEMENT]: SpreadElement.fromJSON,
  [NodeCategory.PROPERTY]: Property.fromJSON
});

IRNode.fromJsonHandlers = fromJsonHandlers;

module.exports = {
  NodeCategory,
  IRNode,
  fromJsonHandlers,
  Program,
  FunctionDecl,
  VarDecl,
  VariableDeclaration,
  Parameter,
  Block,
  Return,
  If,
  While,
  For,
  DoWhile,
  Switch,
  Case,
  Break,
  Continue,
  ExpressionStmt,
  BinaryOp,
  UnaryOp,
  Call,
  Member,
  ArrayLiteral,
  ObjectLiteral,
  Identifier,
  Literal,
  Assignment,
  Conditional,
  Property,
  ArrayPattern,
  ObjectPattern,
  RestElement,
  AssignmentPattern,
  AsyncFunctionDeclaration,
  AwaitExpression,
  GeneratorDeclaration,
  YieldExpression,
  ClassDeclaration,
  ClassExpression,
  MethodDefinition,
  ClassBody,
  TryStatement,
  CatchClause,
  ThrowStatement,
  ForOfStatement,
  ForInStatement,
  TemplateLiteral,
  TemplateElement,
  SpreadElement,
  Super,
  ThisExpression
};