
/**
 * LUASCRIPT IR Validator
 * 
 * Validates IR nodes for correctness and type consistency.
 */

const { NodeCategory } = require("../nodes");

const NODE_HANDLERS = buildNodeHandlerMap();

class ValidationError extends Error {
  constructor(message, node) {
    super(message);
    this.name = "ValidationError";
    this.node = node;
  }
}

class IRValidator {
  constructor(options = {}) {
    this.options = {
      strictTypes: options.strictTypes !== false,
      allowImplicitConversions: options.allowImplicitConversions !== false,
      ...options
    };
    this.nodeHandlers = NODE_HANDLERS;
    this.errors = [];
    this.warnings = [];
  }

  /**
     * Validate an IR node and its children
     */
  validate(node) {
    this.errors = [];
    this.warnings = [];

    try {
      this.visitNode(node);
    } catch (error) {
      if (error instanceof ValidationError) {
        this.errors.push(error);
      } else {
        throw error;
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
     * Visit a node and validate it
     */
  visitNode(node) {
    if (!node || !node.kind) {
      throw new ValidationError("Invalid node: missing kind", node);
    }

    const handler = this.nodeHandlers.get(node.kind);
    if (!handler) {
      throw new ValidationError(`Unknown node kind: ${node.kind}`, node);
    }

    return handler.call(this, node);
  }

  // ========== VALIDATION METHODS ==========

  validateProgram(node) {
    if (!Array.isArray(node.body)) {
      throw new ValidationError("Program body must be an array", node);
    }
    node.body.forEach(stmt => this.visitNode(stmt));
    return true;
  }

  validateFunctionDecl(node) {
    // Allow anonymous functions (name can be null or undefined)
    if (node.name !== undefined && node.name !== null && typeof node.name !== "string") {
      throw new ValidationError("Function name must be a string when provided", node);
    }
    if (!Array.isArray(node.parameters)) {
      throw new ValidationError("Function parameters must be an array", node);
    }
    node.parameters.forEach(param => this.visitNode(param));
    this.visitNode(node.body);
    return true;
  }

  validateVarDecl(node) {
    if (!node.name || typeof node.name !== "string") {
      throw new ValidationError("Variable declaration must have a name", node);
    }
    if (node.init) {
      this.visitNode(node.init);
    }
    return true;
  }

  validateParameter(node) {
    if (!node.name || typeof node.name !== "string") {
      throw new ValidationError("Parameter must have a name", node);
    }
    if (node.defaultValue) {
      this.visitNode(node.defaultValue);
    }
    return true;
  }

  validateBlock(node) {
    if (!Array.isArray(node.statements)) {
      throw new ValidationError("Block statements must be an array", node);
    }
    node.statements.forEach(stmt => this.visitNode(stmt));
    return true;
  }

  validateReturn(node) {
    if (node.value) {
      this.visitNode(node.value);
    }
    return true;
  }

  validateIf(node) {
    this.visitNode(node.condition);
    this.visitNode(node.consequent);
    if (node.alternate) {
      this.visitNode(node.alternate);
    }
    return true;
  }

  validateWhile(node) {
    this.visitNode(node.condition);
    this.visitNode(node.body);
    return true;
  }

  validateFor(node) {
    if (node.init) this.visitNode(node.init);
    if (node.condition) this.visitNode(node.condition);
    if (node.update) this.visitNode(node.update);
    this.visitNode(node.body);
    return true;
  }

  validateSwitch(node) {
    this.visitNode(node.discriminant);
    if (!Array.isArray(node.cases)) {
      throw new ValidationError("Switch cases must be an array", node);
    }
    node.cases.forEach(c => this.visitNode(c));
    return true;
  }

  validateCase(node) {
    if (node.test) {
      this.visitNode(node.test);
    }
    if (!Array.isArray(node.consequent)) {
      throw new ValidationError("Case consequent must be an array", node);
    }
    node.consequent.forEach(stmt => this.visitNode(stmt));
    return true;
  }

  validateExpressionStmt(node) {
    this.visitNode(node.expression);
    return true;
  }

  validateBinaryOp(node) {
    if (!node.operator) {
      throw new ValidationError("Binary operation must have an operator", node);
    }
    this.visitNode(node.left);
    this.visitNode(node.right);
    return true;
  }

  validateUnaryOp(node) {
    if (!node.operator) {
      throw new ValidationError("Unary operation must have an operator", node);
    }
    this.visitNode(node.operand);
    return true;
  }

  validateCall(node) {
    this.visitNode(node.callee);
    if (!Array.isArray(node.args)) {
      throw new ValidationError("Call arguments must be an array", node);
    }
    node.args.forEach(arg => this.visitNode(arg));
    return true;
  }

  validateMember(node) {
    this.visitNode(node.object);
    this.visitNode(node.property);
    return true;
  }

  validateArrayLiteral(node) {
    if (!Array.isArray(node.elements)) {
      throw new ValidationError("Array elements must be an array", node);
    }
    node.elements.forEach(el => {
      if (el) this.visitNode(el);
    });
    return true;
  }

  validateObjectLiteral(node) {
    if (!Array.isArray(node.properties)) {
      throw new ValidationError("Object properties must be an array", node);
    }
    node.properties.forEach(prop => this.visitNode(prop));
    return true;
  }

  validateProperty(node) {
    this.visitNode(node.key);
    this.visitNode(node.value);
    return true;
  }

  validateIdentifier(node) {
    if (!node.name || typeof node.name !== "string") {
      throw new ValidationError("Identifier must have a name", node);
    }
    return true;
  }
}

"use strict";

const { encodeBalancedTernary } = require("../idGenerator");

/**
 * Lightweight structural validator for canonical IR artifacts.
 * Not a full JSON schema implementation, but enforces the invariants we care about today.
 */
function validateIR(ir) {
  const errors = [];

  if (!isRootValid(ir, errors)) {
    return { ok: false, errors };
  }

  const nodes = ir.nodes || {};

  validateModule(ir, nodes, errors);
  validateNodes(nodes, errors);
  validateMetaPerf(ir, errors);
  validateControlFlowGraphs(ir, nodes, errors);

  return { ok: errors.length === 0, errors };
}

function isRootValid(ir, errors) {
  if (!ir || typeof ir !== "object") {
    errors.push("IR root must be an object");
    return false;
  }

  if (!ir.schemaVersion) {
    errors.push("schemaVersion missing");
  }

  if (!ir.module || typeof ir.module !== "object") {
    errors.push("module missing");
    return false;
  }

  return true;
}

function validateModule(ir, nodes, errors) {
  const moduleBody = ir.module.body || [];

  if (!Array.isArray(moduleBody)) {
    errors.push("module.body must be an array");
  }

  if (typeof ir.module.id !== "string") {
    errors.push("module.id must be a string");
  } else if (!isBalancedTernaryIdentifier(ir.module.id)) {
    errors.push(`module.id is not balanced-ternary encoded: ${ir.module.id}`);
  }

  moduleBody.forEach((nodeId, idx) => {
    if (typeof nodeId !== "string") {
      errors.push(`module.body[${idx}] must be a string`);
      return;
    }
    if (!nodes[nodeId]) {
      errors.push(`module.body[${idx}] references missing node ${nodeId}`);
    }
  });
}

function validateNodes(nodes, errors) {
  const allowedKinds = getAllowedKinds();
  const allowedBinaryOperators = getAllowedBinaryOperators();
  const allowedUnaryOperators = getAllowedUnaryOperators();
  const allowedUpdateOperators = new Set(["++", "--"]);

  Object.entries(nodes).forEach(([nodeId, node]) => {
    if (!node.kind || !allowedKinds.has(node.kind)) {
      errors.push(`Node ${nodeId} has invalid or missing kind: ${node.kind}`);
    }

    validateOperators(nodeId, node, {
      allowedBinaryOperators,
      allowedUnaryOperators,
      allowedUpdateOperators,
      errors
    });

    validateSpan(nodeId, node, errors);
    validateNodeMetadata(nodeId, node, nodes, errors);
  });
}

function getAllowedKinds() {
  return new Set([
    "Identifier",
    "Literal",
    "BinaryExpression",
    "LogicalExpression",
    "AssignmentExpression",
    "UpdateExpression",
    "ConditionalExpression",
    "UnaryExpression",
    "CallExpression",
    "MemberExpression",
    "NewExpression",
    "ArrayExpression",
    "ObjectExpression",
    "Property",
    "BlockStatement",
    "IfStatement",
    "SwitchStatement",
    "SwitchCase",
    "WhileStatement",
    "DoWhileStatement",
    "ForStatement",
    "ForOfStatement",
    "ForInStatement",
    "ReturnStatement",
    "BreakStatement",
    "ContinueStatement",
    "ExpressionStatement",
    "Program",
    "FunctionDeclaration",
    "VariableDeclaration",
    "VariableDeclarator",
    "TryStatement",
    "CatchClause",
    "ThrowStatement",
    "AwaitExpression"
  ]);
}

function getAllowedBinaryOperators() {
  return new Set([
    "+", "-", "*", "/", "%", "**",
    "&", "|", "^", "<<", ">>", ">>>",
    "&&", "||", "??",
    "==", "!=", "===", "!==",
    "<", ">", "<=", ">=",
    "instanceof", "in"
  ]);
}

function getAllowedUnaryOperators() {
  return new Set([
    "-", "+", "!", "~", "typeof", "void", "delete", "await"
  ]);
}

function validateOperators(nodeId, node, operatorRules) {
  const { allowedBinaryOperators, allowedUnaryOperators, allowedUpdateOperators, errors } = operatorRules;

  if (node.kind === "BinaryExpression" && node.operator && !allowedBinaryOperators.has(node.operator)) {
    errors.push(`Node ${nodeId} BinaryExpression has unsupported operator: ${node.operator}`);
  }

  if (node.kind === "UnaryExpression" && node.operator && !allowedUnaryOperators.has(node.operator)) {
    errors.push(`Node ${nodeId} UnaryExpression has unsupported operator: ${node.operator}`);
  }

  if (node.kind === "UpdateExpression" && node.operator && !allowedUpdateOperators.has(node.operator)) {
    errors.push(`Node ${nodeId} UpdateExpression has unsupported operator: ${node.operator}`);
  }
}

function validateSpan(nodeId, node, errors) {
  if (node.span === null || node.span === undefined) {
    return;
  }

  const s = node.span;
  const hasStartEnd = s.start && s.end;
  const hasValidNumbers = hasStartEnd &&
    isFiniteNumber(s.start.line) && isFiniteNumber(s.start.column) && isFiniteNumber(s.start.offset) &&
    isFiniteNumber(s.end.line) && isFiniteNumber(s.end.column) && isFiniteNumber(s.end.offset);

  if (!hasStartEnd) {
    errors.push(`Node ${nodeId} has malformed span (missing start/end)`);
  } else if (!hasValidNumbers) {
    errors.push(`Node ${nodeId} has invalid span numbers`);
  }
}

function validateNodeMetadata(nodeId, node, nodes, errors) {
  if (node.kind === "FunctionDeclaration" &&
      node.meta &&
      node.meta.cfg !== null &&
      node.meta.cfg !== undefined &&
      typeof node.meta.cfg !== "object") {
  if (node.kind === "FunctionDeclaration" && node.meta && node.meta.cfg !== null && node.meta.cfg !== undefined && typeof node.meta.cfg !== "object") {
    errors.push(`Node ${nodeId} FunctionDeclaration meta.cfg must be an object when present`);
  }

  if (node.kind !== "VariableDeclaration" || !Array.isArray(node.declarations)) {
    return;
  }

  const declKind = node.declarationKind || null;

  node.declarations.forEach((d, i) => {
    const declNode = nodes[d.id || d];
    if (declNode && declNode.kind && declNode.kind !== "VariableDeclarator") {
      errors.push(`VariableDeclaration ${nodeId} declarations[${i}].kind should be VariableDeclarator, got ${declNode.kind}`);
    }
    if (declNode && declNode.varKind && declKind && declNode.varKind !== declKind) {
      errors.push(`VariableDeclaration ${nodeId} declarations[${i}].varKind (${declNode.varKind}) does not match declarationKind (${declKind})`);
    }
  });
}

function validateMetaPerf(ir, errors) {
  if (!ir.module || !ir.module.metadata || !ir.module.metadata.metaPerf) {
    return;
  }

  const mp = ir.module.metadata.metaPerf;
  ["parseMs", "normalizeMs", "lowerMs", "totalMs", "nodeCount"].forEach((k) => {
    if (typeof mp[k] !== "number") {
      errors.push(`module.metadata.metaPerf.${k} must be a number`);
    }
  });
}

function validateControlFlowGraphs(ir, nodes, errors) {
  const cfgs = ir.controlFlowGraphs;
  if (!cfgs) {
    return;
  }

  Object.entries(nodes).forEach(([nodeId, node]) => {
    validateFunctionCfg(nodeId, node, cfgs, nodes, errors);
  });
}

function validateFunctionCfg(nodeId, node, cfgs, nodes, errors) {
  if (!hasControlFlowInfo(node)) {
    return;
  }

  const cfgShape = resolveCfgGraph(nodeId, node, cfgs, errors);
  if (!cfgShape) {
    return;
  }

  const { entry, exit, blockIds, graph } = cfgShape;
  validateEntryExitIds(nodeId, entry, exit, blockIds, errors);

  if (!entry) {
    return;
  }

  const entryBlock = (graph.blocks || []).find((b) => b.id === entry);
  const bodyStatements = getFunctionBodyStatements(node, nodes);
  if (!bodyStatements) {
    return;
  }

  const entryStatements = (entryBlock && entryBlock.statements) || [];
  const bodySet = new Set(bodyStatements);
  const allReachable = entryStatements.every((s) => bodySet.has(s));
  if (!allReachable) {
    errors.push(`Function ${nodeId} cfg.entry statements must be subset of function body statements`);
  }
}

function hasControlFlowInfo(node) {
  return node.kind === "FunctionDeclaration" && node.meta && node.meta.cfg;
}

function resolveCfgGraph(nodeId, node, cfgs, errors) {
  const { id: cfgId, entry, exit } = node.meta.cfg;
  const graph = cfgs[cfgId];
  if (!cfgId || !graph) {
    errors.push(`Function ${nodeId} references missing CFG ${cfgId}`);
    return null;
  }

  const blockIds = new Set((graph.blocks || []).map((b) => b.id));
  return { entry, exit, blockIds, graph };
}

function validateEntryExitIds(nodeId, entry, exit, blockIds, errors) {
  if (entry && !blockIds.has(entry)) {
    errors.push(`Function ${nodeId} cfg.entry ${entry} not in CFG`);
  }
  if (exit && !blockIds.has(exit)) {
    errors.push(`Function ${nodeId} cfg.exit ${exit} not in CFG`);
  }
}

function getFunctionBodyStatements(node, nodes) {
  const bodyRef = node.body;
  if (!bodyRef || !nodes[bodyRef] || nodes[bodyRef].kind !== "BlockStatement") {
    return null;
  }

  const statements = nodes[bodyRef].statements || [];
  return Array.isArray(statements) ? statements : null;
}

function buildNodeHandlerMap() {
  return new Map([
    [NodeCategory.PROGRAM, function handleProgram(node) { return this.validateProgram(node); }],
    [NodeCategory.FUNCTION_DECL, function handleFunctionDecl(node) { return this.validateFunctionDecl(node); }],
    [NodeCategory.VAR_DECL, function handleVarDecl(node) { return this.validateVarDecl(node); }],
    [NodeCategory.PARAMETER, function handleParameter(node) { return this.validateParameter(node); }],
    [NodeCategory.BLOCK, function handleBlock(node) { return this.validateBlock(node); }],
    [NodeCategory.RETURN, function handleReturn(node) { return this.validateReturn(node); }],
    [NodeCategory.IF, function handleIf(node) { return this.validateIf(node); }],
    [NodeCategory.WHILE, function handleWhile(node) { return this.validateWhile(node); }],
    [NodeCategory.DO_WHILE, function handleDoWhile(node) { return this.validateWhile(node); }],
    [NodeCategory.FOR, function handleFor(node) { return this.validateFor(node); }],
    [NodeCategory.SWITCH, function handleSwitch(node) { return this.validateSwitch(node); }],
    [NodeCategory.CASE, function handleCase(node) { return this.validateCase(node); }],
    [NodeCategory.BREAK, () => true],
    [NodeCategory.CONTINUE, () => true],
    [NodeCategory.EXPRESSION_STMT, function handleExpressionStmt(node) { return this.validateExpressionStmt(node); }],
    [NodeCategory.BINARY_OP, function handleBinaryOp(node) { return this.validateBinaryOp(node); }],
    [NodeCategory.UNARY_OP, function handleUnaryOp(node) { return this.validateUnaryOp(node); }],
    [NodeCategory.CALL, function handleCall(node) { return this.validateCall(node); }],
    [NodeCategory.MEMBER, function handleMember(node) { return this.validateMember(node); }],
    [NodeCategory.ARRAY_LITERAL, function handleArrayLiteral(node) { return this.validateArrayLiteral(node); }],
    [NodeCategory.OBJECT_LITERAL, function handleObjectLiteral(node) { return this.validateObjectLiteral(node); }],
    [NodeCategory.PROPERTY, function handleProperty(node) { return this.validateProperty(node); }],
    [NodeCategory.IDENTIFIER, function handleIdentifier(node) { return this.validateIdentifier(node); }],
    [NodeCategory.LITERAL, function handleLiteral(node) { return this.validateLiteral(node); }],
    [NodeCategory.ASSIGNMENT, function handleAssignment(node) { return this.validateAssignment(node); }],
    [NodeCategory.CONDITIONAL, function handleConditional(node) { return this.validateConditional(node); }]
  ]);
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Checks whether an identifier follows the PREFIX_digits pattern with balanced ternary digits.
 */
function isBalancedTernaryIdentifier(identifier) {
  if (typeof identifier !== "string" || !identifier.includes("_")) {
    return false;
  }
  const [prefix, digits] = identifier.split("_");
  if (!prefix || !digits) {
    return false;
  }
  return /^[T01]+$/.test(digits);
}

// Exported for testing convenience.
function decodeBalancedTernaryString(encoded) {
  let value = 0;
  for (let i = 0; i < encoded.length; i += 1) {
    const digit = encoded[i];
    value *= 3;
    if (digit === "1") {
      value += 1;
    } else if (digit === "T") {
      value -= 1;
    } else if (digit !== "0") {
      throw new Error(`Invalid balanced ternary digit: ${digit}`);
    }
  }
  return value;
}

module.exports = {
  IRValidator,
  validateIR,
  isBalancedTernaryIdentifier,
  decodeBalancedTernaryString,
  encodeBalancedTernary,
};
