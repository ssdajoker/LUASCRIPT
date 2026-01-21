
/**
 * LUASCRIPT IR Validator
 * 
 * Validates IR nodes for correctness and type consistency.
 */

const { NodeCategory } = require("./nodes");

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

    switch (node.kind) {
    case NodeCategory.PROGRAM:
      return this.validateProgram(node);
    case NodeCategory.FUNCTION_DECL:
      return this.validateFunctionDecl(node);
    case NodeCategory.VAR_DECL:
      return this.validateVarDecl(node);
    case NodeCategory.VARIABLE_DECLARATION:
      return this.validateVariableDeclaration(node);
    case NodeCategory.PARAMETER:
      return this.validateParameter(node);
    case NodeCategory.BLOCK:
      return this.validateBlock(node);
    case NodeCategory.RETURN:
      return this.validateReturn(node);
    case NodeCategory.IF:
      return this.validateIf(node);
    case NodeCategory.WHILE:
    case NodeCategory.DO_WHILE:
      return this.validateWhile(node);
    case NodeCategory.FOR:
      return this.validateFor(node);
    case NodeCategory.FOR_OF:
      return this.validateForOf(node);
    case NodeCategory.FOR_IN:
      return this.validateForIn(node);
    case NodeCategory.SWITCH:
      return this.validateSwitch(node);
    case NodeCategory.CASE:
      return this.validateCase(node);
    case NodeCategory.BREAK:
    case NodeCategory.CONTINUE:
      return true; // Always valid
    case NodeCategory.EXPRESSION_STMT:
      return this.validateExpressionStmt(node);
    case NodeCategory.BINARY_OP:
      return this.validateBinaryOp(node);
    case NodeCategory.UNARY_OP:
      return this.validateUnaryOp(node);
    case NodeCategory.CALL:
      return this.validateCall(node);
    case NodeCategory.MEMBER:
      return this.validateMember(node);
    case NodeCategory.ARRAY_LITERAL:
      return this.validateArrayLiteral(node);
    case NodeCategory.OBJECT_LITERAL:
      return this.validateObjectLiteral(node);
    case NodeCategory.PROPERTY:
      return this.validateProperty(node);
    case NodeCategory.IDENTIFIER:
      return this.validateIdentifier(node);
    case NodeCategory.LITERAL:
      return this.validateLiteral(node);
    case NodeCategory.ASSIGNMENT:
      return this.validateAssignment(node);
    case NodeCategory.CONDITIONAL:
      return this.validateConditional(node);
    case NodeCategory.TRY:
      return this.validateTryStatement(node);
    case NodeCategory.CATCH:
      return this.validateCatchClause(node);
    case NodeCategory.THROW:
      return this.validateThrowStatement(node);
    case NodeCategory.CLASS_DECL:
      return this.validateClassDeclaration(node);
    case NodeCategory.CLASS_BODY:
      return this.validateClassBody(node);
    case NodeCategory.METHOD_DEF:
      return this.validateMethodDefinition(node);
    case NodeCategory.TEMPLATE_LITERAL:
      return this.validateTemplateLiteral(node);
    case NodeCategory.TEMPLATE_ELEMENT:
      return this.validateTemplateElement(node);
    case NodeCategory.SPREAD_ELEMENT:
      return this.validateSpreadElement(node);
    case NodeCategory.AWAIT:
      return this.validateAwaitExpression(node);
    case NodeCategory.YIELD:
      return this.validateYieldExpression(node);
    case NodeCategory.THIS:
    case NodeCategory.SUPER:
      return true;
    case NodeCategory.ARRAY_PATTERN:
      return this.validateArrayPattern(node);
    case NodeCategory.OBJECT_PATTERN:
      return this.validateObjectPattern(node);
    case NodeCategory.REST_ELEMENT:
      return this.validateRestElement(node);
    case NodeCategory.ASSIGNMENT_PATTERN:
      return this.validateAssignmentPattern(node);
    case NodeCategory.GENERATOR_FUNCTION:
      return this.validateGeneratorDeclaration(node);
    case NodeCategory.ASYNC_FUNCTION:
      return this.validateAsyncFunctionDeclaration(node);
    default:
      throw new ValidationError(`Unknown node kind: ${node.kind}`, node);
    }
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
    // Support Identifier or Pattern as name
    if (node.name && typeof node.name === "object") {
      this.visitNode(node.name);
    } else if (!node.name || typeof node.name !== "string") {
      throw new ValidationError("Variable declaration must have a name", node);
    }
    if (node.init) {
      this.visitNode(node.init);
    }
    return true;
  }

  validateVariableDeclaration(node) {
    if (!Array.isArray(node.declarations)) {
      throw new ValidationError("VariableDeclaration declarations must be an array", node);
    }
    node.declarations.forEach(decl => this.visitNode(decl));
    return true;
  }

  validateParameter(node) {
    if (node.name && typeof node.name === "object") {
      this.visitNode(node.name); // Pattern
    } else if (!node.name || typeof node.name !== "string") {
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

  validateForOf(node) {
    this.visitNode(node.left);
    this.visitNode(node.right);
    this.visitNode(node.body);
    return true;
  }

  validateForIn(node) {
    this.visitNode(node.left);
    this.visitNode(node.right);
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

  validateLiteral(_node) {
    return true;
  }

  validateAssignment(node) {
    this.visitNode(node.left);
    this.visitNode(node.right);
    return true;
  }

  validateConditional(node) {
    this.visitNode(node.condition);
    this.visitNode(node.consequent);
    this.visitNode(node.alternate);
    return true;
  }

  validateTryStatement(node) {
    this.visitNode(node.block);
    if (node.handler) this.visitNode(node.handler);
    if (node.finalizer) this.visitNode(node.finalizer);
    return true;
  }

  validateCatchClause(node) {
    if (node.param) this.visitNode(node.param);
    this.visitNode(node.body);
    return true;
  }

  validateThrowStatement(node) {
    this.visitNode(node.argument);
    return true;
  }

  validateClassDeclaration(node) {
    if (node.id) this.visitNode(node.id);
    if (node.superClass) this.visitNode(node.superClass);
    this.visitNode(node.body);
    return true;
  }

  validateClassBody(node) {
    if (!Array.isArray(node.body)) throw new ValidationError("Class body must be array", node);
    node.body.forEach(m => this.visitNode(m));
    return true;
  }

  validateMethodDefinition(node) {
    this.visitNode(node.key);
    this.visitNode(node.value);
    return true;
  }

  validateTemplateLiteral(node) {
    node.quasis.forEach(q => this.visitNode(q));
    node.expressions.forEach(e => this.visitNode(e));
    return true;
  }

  validateTemplateElement(_node) {
    return true;
  }

  validateSpreadElement(node) {
    this.visitNode(node.argument);
    return true;
  }

  validateAwaitExpression(node) {
    this.visitNode(node.argument);
    return true;
  }

  validateYieldExpression(node) {
    if (node.argument) this.visitNode(node.argument);
    return true;
  }

  validateArrayPattern(node) {
    node.elements.forEach(el => {
      if (el) this.visitNode(el);
    });
    return true;
  }

  validateObjectPattern(node) {
    node.properties.forEach(p => this.visitNode(p));
    return true;
  }

  validateRestElement(node) {
    this.visitNode(node.argument);
    return true;
  }

  validateAssignmentPattern(node) {
    this.visitNode(node.left);
    this.visitNode(node.right);
    return true;
  }

  validateGeneratorDeclaration(node) {
    return this.validateFunctionDecl(node);
  }

  validateAsyncFunctionDeclaration(node) {
    return this.validateFunctionDecl(node);
  }
}

"use strict";

const { encodeBalancedTernary } = require("./idGenerator");

/**
 * Lightweight structural validator for canonical IR artifacts.
 * Not a full JSON schema implementation, but enforces the invariants we care about today.
 */
 
function validateIR(ir) {
  const errors = [];

  if (!ir || typeof ir !== "object") {
    return { ok: false, errors: ["IR root must be an object"] };
  }

  if (!ir.schemaVersion) {
    errors.push("schemaVersion missing");
  }

  if (!ir.module || typeof ir.module !== "object") {
    errors.push("module missing");
    return { ok: false, errors };
  }

  const moduleBody = ir.module.body || [];
  const nodes = ir.nodes || {};

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

  // Allowed node kinds (keep permissive; extend as spec evolves)
  const allowedKinds = new Set([
    "Identifier",
    "Literal",
    "BinaryExpression",
    "LogicalExpression",
    "AssignmentExpression",
    "UpdateExpression",
    "ConditionalExpression",
    "CallExpression",
    "MemberExpression",
    "NewExpression",
    "ArrayExpression",
    "ObjectExpression",
    "TemplateLiteral",
    "ArrowFunctionExpression",
    "FunctionDeclaration",
    "FunctionExpression",
    "VariableDeclaration",
    "VariableDeclarator",
    "BlockStatement",
    "ExpressionStatement",
    "ReturnStatement",
    "IfStatement",
    "SwitchStatement",
    "SwitchCase",
    "ForStatement",
    "ForOfStatement",
    "WhileStatement",
    "DoWhileStatement",
    "BreakStatement",
    "ContinueStatement",
    "ThrowStatement",
    "TryStatement",
    "ImportDeclaration",
    "ExportDeclaration",
    "ClassDeclaration",
    "ClassBody",
    "MethodDefinition",
    "Property",
    "ObjectPattern",
    "ArrayPattern",
    "RestElement",
    "AssignmentPattern",
    "ProgramComment",
    "Parameter",
    "UnaryExpression",
    "TemplateElement",
    "SpreadElement",
    "AwaitExpression",
    "YieldExpression",
    "ThisExpression",
    "Super",
    "ClassExpression",
    "CatchClause",
    "GeneratorDeclaration",
    "AsyncFunctionDeclaration",
    "ForInStatement"
  ]);

  // Validate nodes
   
  Object.entries(nodes).forEach(([nodeId, node]) => {
    if (!isBalancedTernaryIdentifier(nodeId)) {
      errors.push(`Node id ${nodeId} is not balanced-ternary encoded`);
    }
    if (!node.kind || typeof node.kind !== "string") {
      errors.push(`Node ${nodeId} missing kind`);
    } else if (!allowedKinds.has(node.kind)) {
      // Do not hard-fail unknown kinds yet; record a soft error
      errors.push(`Node ${nodeId} has unknown kind ${node.kind}`);
    }

    // Basic span shape validation (if present)
    if (node.span !== null && node.span !== undefined) {
      const s = node.span;
      if (!s.start || !s.end) {
        errors.push(`Node ${nodeId} has malformed span (missing start/end)`);
      } else if (!isFiniteNumber(s.start.line) || !isFiniteNumber(s.start.column) || !isFiniteNumber(s.start.offset) ||
                 !isFiniteNumber(s.end.line)   || !isFiniteNumber(s.end.column)   || !isFiniteNumber(s.end.offset)) {
        errors.push(`Node ${nodeId} has invalid span numbers`);
      }
    }

    // Validate FunctionDeclaration meta.cfg shape when present
    if (node.kind === "FunctionDeclaration" &&
        node.meta &&
        node.meta.cfg !== null &&
        node.meta.cfg !== undefined &&
        typeof node.meta.cfg !== "object") {
    if (node.kind === "FunctionDeclaration" && node.meta && node.meta.cfg !== null && node.meta.cfg !== undefined && typeof node.meta.cfg !== "object") {
      errors.push(`Node ${nodeId} FunctionDeclaration meta.cfg must be an object when present`);
    }

    // VariableDeclaration: declarations[] should be VariableDeclarator nodes
    if (node.kind === "VariableDeclaration") {
      const declKind = node.declarationKind || null;
      if (Array.isArray(node.declarations)) {
        node.declarations.forEach((d, i) => {
          const declNode = nodes[d.id || d];

          // Check varKind matches parent declarationKind if present
          if (declNode && declNode.varKind && declKind && declNode.varKind !== declKind) {
            errors.push(`VariableDeclaration ${nodeId} declarations[${i}].varKind (${declNode.varKind}) does not match declarationKind (${declKind})`);
          }
        });
      }
    }
  });

  // Optional: validate metaPerf if present
  if (ir.module && ir.module.metadata && ir.module.metadata.metaPerf) {
    const mp = ir.module.metadata.metaPerf;
     
    ["parseMs", "normalizeMs", "lowerMs", "totalMs", "nodeCount"].forEach((k) => {
      if (typeof mp[k] !== "number") {
        errors.push(`module.metadata.metaPerf.${k} must be a number`);
      }
    });
  }

  // Optional: Validate CFG linkage if controlFlowGraphs present
  const cfgs = ir.controlFlowGraphs || null;
  if (cfgs) {
     
    Object.entries(nodes).forEach(([nodeId, node]) => {
      if (node.kind === "FunctionDeclaration" && node.meta && node.meta.cfg) {
        const { id: cfgId, entry, exit } = node.meta.cfg;
        if (!cfgId || !cfgs[cfgId]) {
          errors.push(`Function ${nodeId} references missing CFG ${cfgId}`);
        } else {
          const graph = cfgs[cfgId];
          const blockIds = new Set((graph.blocks || []).map((b) => b.id));
          if (entry && !blockIds.has(entry)) errors.push(`Function ${nodeId} cfg.entry ${entry} not in CFG`);
          if (exit && !blockIds.has(exit)) errors.push(`Function ${nodeId} cfg.exit ${exit} not in CFG`);

          // If function has a body pointing to a BlockStatement, ensure CFG entry block statements are a subset
          if (entry) {
            const entryBlock = (graph.blocks || []).find((b) => b.id === entry);
            const bodyRef = node.body;
            if (bodyRef && nodes[bodyRef] && nodes[bodyRef].kind === "BlockStatement") {
              const bodyStatements = nodes[bodyRef].statements || [];
              const entryStatements = (entryBlock && entryBlock.statements) || [];
              // Require entry statements to be a subset of function body statements (order not enforced here)
              const bodySet = new Set(Array.isArray(bodyStatements) ? bodyStatements : []);
              const allReachable = (Array.isArray(entryStatements) ? entryStatements : []).every((s) => bodySet.has(s));
              if (!allReachable) {
                errors.push(`Function ${nodeId} cfg.entry statements must be subset of function body statements`);
              }
            }
          }
        }
      }
    });
  }

  return { ok: errors.length === 0, errors };
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
module.exports = require("./validators/validator");
