"use strict";

const NEWLINE = "\n";
const EXPRESSION_KINDS = new Set([
  "Identifier",
  "Literal",
  "BinaryExpression",
  "LogicalExpression",
  "AssignmentExpression",
  "UnaryExpression",
  "UpdateExpression",
  "CallExpression",
  "MemberExpression",
  "NewExpression",
  "ConditionalExpression",
  "ArrayExpression",
  "ObjectExpression",
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration"
]);

class IREmitter {
  constructor(options = {}) {
    this.indentUnit = options.indent || "  ";
    this.options = options;
    this.statementDispatch = this.createStatementDispatch();
  }

  createStatementDispatch() {
    return {
      VariableDeclaration: (node, context) => this.emitVariableDeclaration(node, context),
      ExpressionStatement: (node, context) => this.emitExpressionStatement(node, context),
      ArrowFunctionExpression: (node, context) => this.emitArrowFunctionStatement(node, context),
      ReturnStatement: (node, context) => this.emitReturnStatement(node, context),
      IfStatement: (node, context) => this.emitIfStatement(node, context),
      WhileStatement: (node, context) => this.emitWhileStatement(node, context),
      ForStatement: (node, context) => this.emitForStatement(node, context),
      FunctionDeclaration: (node, context) => this.emitFunctionDeclaration(node, context),
      ClassDeclaration: (node, context) => this.emitClassDeclaration(node, context),
      BlockStatement: (node, context) => this.emitBlockStatement(node, context),
      TryStatement: (node, context) => this.emitTryStatement(node, context),
    };
  }

  emit(irModule) {
    if (!irModule || !irModule.module || !irModule.nodes) {
      throw new Error("Invalid IR module passed to emitter");
    }

    const context = {
      nodes: irModule.nodes,
      indentLevel: 0,
    };

    const chunks = [];

    for (const nodeId of irModule.module.body) {
      const node = context.nodes[nodeId];
      if (!node) {
        throw new Error(`Missing node ${nodeId} referenced in module body`);
      }
      const emitted = this.emitStatement(node, context);
      if (emitted) {
        chunks.push(emitted.trimEnd());
      }
    }

    return chunks.join(NEWLINE + NEWLINE);
  }

  emitStatement(node, context) {
    const emitter = this.statementDispatch[node.kind];
    if (emitter) {
      return emitter(node, context);
    }

    // Fallback: if this is an expression node at top-level, emit it as a statement
    if (this.isExpressionKind(node.kind)) {
      return this.emitIndentedLine(context, this.emitExpression(node, context));
    }
    if (node.expression) {
      return this.emitStatement(context.nodes[node.expression], context);
    }
    throw new Error(`Emitter does not support statement kind ${node.kind}`);
  }

  emitExpressionStatement(node, context) {
    return this.emitIndentedLine(context, this.emitExpressionById(node.expression, context));
  }

  emitArrowFunctionStatement(node, context) {
    return this.emitIndentedLine(context, `local _arrow = ${this.emitArrowFunction(node, context)}`);
  }

  emitReturnStatement(node, context) {
    const argId = node.value !== undefined ? node.value : node.argument;
    const argument = argId ? this.emitExpressionById(argId, context) : "";
    return this.emitIndentedLine(context, `return${argument ? " " + argument : ""}`);
  }

  emitClassDeclaration(node, context) {
    return this.emitIndentedLine(context, "--[[ClassDeclaration not yet supported]]");
  }

  emitBlockStatement(node, context) {
    const blockId = node.id !== undefined ? node.id : node;
    return this.emitBlockById(blockId, context);
  }

  emitTryStatement(node, context) {
    const fnName = this.buildTryFunctionName(node);
    const baseIndent = this.currentIndent(context);
    const tryBody = this.emitBlockById(node.block, context);

    const sections = [
      this.buildProtectedTryFunction(fnName, tryBody, baseIndent),
      `${baseIndent}local __ok, __err = xpcall(${fnName}, function(e) return e end)`,
    ];

    const catchSection = node.handler
      ? this.emitCatchSection(node.handler, context, baseIndent)
      : null;
    if (catchSection) {
      sections.push(catchSection);
    }

    const finallySection = node.finalizer
      ? this.emitFinallySection(node.finalizer, context)
      : null;
    if (finallySection) {
      sections.push(finallySection);
    }

    return sections.filter(Boolean).join(NEWLINE).trimEnd();
  }

  buildTryFunctionName(node) {
    const idSuffix = (node.id || "").replace(/[^A-Za-z0-9_]/g, "");
    return `__try_${idSuffix || "blk"}`;
  }

  buildProtectedTryFunction(fnName, tryBody, indent) {
    return `${indent}local function ${fnName}()` + NEWLINE + tryBody + NEWLINE + `${indent}end`;
  }

  emitCatchSection(handlerId, context, baseIndent) {
    const handlerNode = typeof handlerId === "object" ? handlerId : context.nodes[handlerId];
    if (!handlerNode) return null;

    const lines = [`${baseIndent}if (not __ok) then`];
    const binding = this.emitCatchBinding(handlerNode, context);
    if (binding) {
      lines.push(binding);
    }

    const catchBody = this.emitBlockById(handlerNode.body, context);
    if (catchBody) {
      lines.push(catchBody);
    }

    lines.push(`${baseIndent}end`);
    return lines.join(NEWLINE);
  }

  emitCatchBinding(handlerNode, context) {
    const paramName = this.extractCatchParamName(handlerNode, context);
    if (!paramName) return null;
    return this.emitIndentedLine(this.indentContext(context, 1), `local ${paramName} = __err`);
  }

  extractCatchParamName(handlerNode, context) {
    if (!handlerNode.param) return null;
    const paramNode = typeof handlerNode.param === "string" ? context.nodes[handlerNode.param] : handlerNode.param;
    if (paramNode && paramNode.kind === "Identifier") {
      return paramNode.name;
    }
    return null;
  }

  emitFinallySection(finalizerId, context) {
    return this.emitBlockById(finalizerId, context);
  }

  emitVariableDeclaration(node, context) {
    const chunks = [];
    for (const declarator of node.declarations) {
      const { luaName, isPattern, patternNames } = this.resolveDeclaratorName(declarator, context);
      const initExpr = declarator.init
        ? this.emitExpressionById(declarator.init, context)
        : null;
      const prefix = this.luaDeclarationPrefix(node.declarationKind || declarator.kind);

      if (isPattern && patternNames.length > 0) {
        this.emitPatternBindings(prefix, initExpr, patternNames, chunks, context);
        continue;
      }

      const targetName = luaName || (patternNames && patternNames[0]);
      if (!targetName) {
        throw new Error("Emitter unable to extract variable name from declarator");
      }

      chunks.push(
        this.emitIndentedLine(
          context,
          `${prefix}${targetName}${initExpr ? " = " + initExpr : ""}`
        )
      );
    }
    return chunks.join(NEWLINE);
  }

  resolveDeclaratorName(declarator, context) {
    if (declarator.pattern) {
      // Old structure: declarator.pattern is an ID referencing an Identifier node
      const patternNode = context.nodes[declarator.pattern];
      if (!patternNode || patternNode.kind !== "Identifier") {
        throw new Error("Emitter only supports simple identifier patterns");
      }
      return { luaName: patternNode.name, isPattern: false, patternNames: [] };
    }
    if (typeof declarator.name === "string") {
      // New structure: declarator.name is a direct string
      return { luaName: declarator.name, isPattern: false, patternNames: [] };
    }
    if (declarator.name && context.nodes[declarator.name]) {
      const nameNode = context.nodes[declarator.name];
      if (nameNode.kind === "Identifier") {
        return { luaName: nameNode.name, isPattern: false, patternNames: [] };
      }
      if (nameNode.kind === "ArrayPattern" || nameNode.kind === "ObjectPattern") {
        return { luaName: null, isPattern: true, patternNames: this.extractPatternNames(nameNode, context) };
      }
      throw new Error(`Unsupported pattern type: ${nameNode.kind}`);
    }
    throw new Error("Emitter unable to extract variable name from declarator");
  }

  emitPatternBindings(prefix, initExpr, patternNames, chunks, context) {
    // For destructuring: local a, c = arr[1], arr[3] (simplified)
    // Or more accurately: generate temp var and extract pattern elements
    const tempVar = `__tmp${Math.random().toString(36).substr(2, 9)}`;
    chunks.push(
      this.withIndent(context, (indent) =>
        `${indent}${prefix}${tempVar}${initExpr ? " = " + initExpr : ""}`
      )
    );
    // Emit each destructured variable
    for (const varName of patternNames) {
      chunks.push(
        this.withIndent(context, (indent) =>
          `${indent}${prefix}${varName}`
        )
      );
    }
  }

  extractPatternNames(patternNode, context) {
    if (patternNode.kind === "ArrayPattern") {
      return this.extractArrayPatternNames(patternNode, context);
    }
    if (patternNode.kind === "ObjectPattern") {
      return this.extractObjectPatternNames(patternNode, context);
    }
    return [];
  }

  extractArrayPatternNames(patternNode, context) {
    const names = [];
    for (const elem of (patternNode.elements || [])) {
      if (elem === null) {
        // Hole in pattern, skip
        continue;
      }
      if (typeof elem === "string") {
        // elem is an ID, resolve it
        const elemNode = context.nodes[elem];
        if (elemNode && elemNode.kind === "Identifier") {
          names.push(elemNode.name);
        }
        continue;
      }
      if (elem && elem.kind === "Identifier") {
        names.push(elem.name);
      }
    }
    return names;
  }

  extractObjectPatternNames(patternNode, context) {
    const names = [];
    for (const prop of (patternNode.properties || [])) {
      const identifier = this.getObjectPatternIdentifier(prop, context);
      if (identifier) {
        names.push(identifier);
      }
    }
    return names;
  }

  getObjectPatternIdentifier(prop, context) {
    if (typeof prop === "string") {
      return this.getIdentifierFromPropertyNode(context.nodes[prop], context);
    }
    if (!prop || !prop.value) {
      return null;
    }
    return this.getIdentifierName(prop.value, context);
  }

  getIdentifierFromPropertyNode(propNode, context) {
    if (!propNode || propNode.kind !== "Property") {
      return null;
    }
    return this.getIdentifierName(propNode.value, context);
  }

  getIdentifierName(propValue, context) {
    const valueNode = typeof propValue === "string" ? context.nodes[propValue] : propValue;
    if (valueNode && valueNode.kind === "Identifier") {
      return valueNode.name;
    }
    if (valueNode && valueNode.name) {
      return valueNode.name;
    }
    return null;
  }

  emitIfStatement(node, context) {
    const testId = node.test !== undefined ? node.test : node.condition;
    const consId = node.consequent || node.consequence;
    const altId = node.alternate || node.elseBranch;
    const test = this.emitExpressionById(testId, context);
    const consequent = this.emitBlockById(consId, context);
    const alternate = altId ? this.emitBlockById(altId, context) : null;

    let output = `${this.currentIndent(context)}if ${test} then${NEWLINE}${consequent}`;
    if (alternate) {
      output += `${NEWLINE}${this.currentIndent(context)}else${NEWLINE}${alternate}`;
    }
    output += `${NEWLINE}${this.currentIndent(context)}end`;
    return output;
  }

  emitWhileStatement(node, context) {
    const testId = node.test !== undefined ? node.test : node.condition;
    const test = this.emitExpressionById(testId, context);
    const body = this.emitBlockById(node.body, context);
    let output = `${this.currentIndent(context)}while ${test} do${NEWLINE}${body}`;
    output += `${NEWLINE}${this.currentIndent(context)}end`;
    return output;
  }

  emitForStatement(node, context) {
    const lines = [];
    // init can be VariableDeclaration or expression
    if (node.init) {
      const initNode = context.nodes[node.init];
      if (initNode && initNode.kind === "VariableDeclaration") {
        lines.push(this.emitVariableDeclaration(initNode, context));
      } else {
        lines.push(this.withIndent(context, (indent) => indent + this.emitExpressionById(node.init, context)));
      }
    }

    const testId = node.test !== undefined ? node.test : node.condition;
    const test = testId ? this.emitExpressionById(testId, context) : "true";
    let body = this.emitBlockById(node.body, context);

    // Append update at end of loop body
    if (node.update) {
      const updateLine = this.withIndent({ ...context, indentLevel: (context.indentLevel || 0) + 1 }, (indent) =>
        indent + this.emitExpressionById(node.update, context)
      );
      body = body + NEWLINE + updateLine;
    }

    let output = `${this.currentIndent(context)}while ${test} do${NEWLINE}${body}`;
    output += `${NEWLINE}${this.currentIndent(context)}end`;
    lines.push(output);
    return lines.join(NEWLINE);
  }

  emitFunctionDeclaration(node, context) {
    const name = node.name;
    // Handle both node.params (old) and node.parameters (new) naming
    const paramsArray = node.params || node.parameters || [];
    const params = paramsArray
      .map((paramId) => {
        const paramNode = typeof paramId === "string" ? context.nodes[paramId] : paramId;
        if (!paramNode) {
          throw new Error("Parameter node not found in context");
        }
        // Handle both Parameter nodes and plain Identifier nodes
        if (paramNode.kind === "Parameter" || paramNode.kind === "Identifier") {
          return paramNode.name;
        }
        throw new Error(`Unexpected parameter node kind: ${paramNode.kind}`);
      })
      .join(", ");

    const header = `${this.currentIndent(context)}local function ${name}(${params})`;
    let emittedBody;
    
    // Get the body - handle both node.body (ID) and node.body (Block node)
    const bodyId = typeof node.body === "string" ? node.body : (node.body && node.body.id ? node.body.id : node.body);

    if (node.async) {
      // Emit the body for the coroutine, which is one level deeper than the function itself
      const coroutineBody = this.emitBlockById(bodyId, context, {
        indentLevel: (context.indentLevel || 0) + 2, // Body is inside coroutine function, which is inside outer function
      });

      // Assemble the coroutine wrapper
      emittedBody = `${this.currentIndent(context, 1)}return coroutine.create(function()${NEWLINE}` +
                    `${coroutineBody}${this.currentIndent(context, 1)}end)${NEWLINE}`; // Adjusted end indentation and removed extra NEWLINE
    } else {
      // Standard function body
      emittedBody = this.emitBlockById(bodyId, context, {
        indentLevel: (context.indentLevel || 0) + 1,
      });
    }

    return `${header}${NEWLINE}${emittedBody}${NEWLINE}${this.currentIndent(context)}end`;
  }

  emitBlockById(blockId, parentContext, overrides = {}) {
    const blockNode = typeof blockId === "string" ? parentContext.nodes[blockId] : blockId;
    if (!blockNode || blockNode.kind !== "BlockStatement") {
      throw new Error(`Expected BlockStatement for id ${blockId}`);
    }

    const context = Object.assign({}, parentContext, overrides);
    if (overrides.indentLevel !== undefined) {
      context.indentLevel = overrides.indentLevel;
    } else {
      context.indentLevel = parentContext.indentLevel + 1;
    }

    const statements = [];
    for (const statementId of blockNode.statements || []) {
      const statementNode = context.nodes[statementId];
      if (!statementNode) {
        throw new Error(`Missing node ${statementId} referenced in block ${blockId}`);
      }
      statements.push(this.emitStatement(statementNode, context));
    }

    return statements.join(NEWLINE);
  }

  emitExpressionById(nodeId, context) {
    const node = typeof nodeId === "string" ? context.nodes[nodeId] : nodeId;
    if (!node) {
      throw new Error(`Missing node ${nodeId} referenced by expression`);
    }
    return this.emitExpression(node, context);
  }

  emitExpression(node, context) {
    const handler = this.getExpressionHandler(node.kind);
    if (!handler) {
      throw new Error(`Emitter does not support expression kind ${node.kind}`);
    }
    return handler.call(this, node, context);
  }

  getExpressionHandler(kind) {
    return {
      Identifier: (node) => node.name,
      Literal: (node) => this.emitLiteral(node),
      MemberExpression: (node, context) => this.emitMemberExpression(node, context),
      ArrayExpression: (node, context) => this.emitArrayExpression(node, context),
      ObjectExpression: (node, context) => this.emitObjectExpression(node, context),
      BinaryExpression: (node, context) => this.emitBinaryLikeExpression(node, context),
      LogicalExpression: (node, context) => this.emitBinaryLikeExpression(node, context),
      AssignmentExpression: (node, context) => this.emitAssignmentExpression(node, context),
      UpdateExpression: (node, context) => this.emitUpdateExpression(node, context),
      UnaryExpression: (node, context) => this.emitUnaryExpression(node, context),
      CallExpression: (node, context) => this.emitCallExpression(node, context),
      NewExpression: (node, context) => this.emitNewExpression(node, context),
      FunctionDeclaration: (node, context) => this.emitFunctionExpression(node, context),
      ConditionalExpression: (node, context) => this.emitConditionalExpression(node, context),
      ArrowFunctionExpression: (node, context) => this.emitArrowFunction(node, context),
      FunctionExpression: (node, context) => this.emitFunctionExpression(node, context),
      BlockStatement: () => "{ --[[block]] }",
    }[kind];
  }

  emitMemberExpression(node, context) {
    const object = this.emitExpressionById(node.object, context);
    if (node.computed) {
      const prop = this.emitExpressionById(node.property, context);
      if (node.optional) {
        return `(${object} ~= nil and ${object}[${prop}] or nil)`;
      }
      return `${object}[${prop}]`;
    }
    const propNode = context.nodes[node.property];
    const propName = propNode && propNode.kind === "Identifier" ? propNode.name : this.emitExpressionById(node.property, context);
    if (node.optional) {
      return `(${object} ~= nil and ${object}.${propName} or nil)`;
    }
    return `${object}.${propName}`;
  }

  emitArrayExpression(node, context) {
    const items = (node.elements || []).map((elId) => this.emitExpressionById(elId, context)).join(", ");
    return `{ ${items} }`;
  }

  emitObjectExpression(node, context) {
    const fields = (node.properties || []).map((propId) => this.emitPropertyById(propId, context)).join(", ");
    return `{ ${fields} }`;
  }

  emitBinaryLikeExpression(node, context) {
    const operator = this.luaBinaryOperator(node, context);
    const left = this.emitGrouped(node.left, context);
    const right = this.emitGrouped(node.right, context);
    return `${left} ${operator} ${right}`;
  }

  emitAssignmentExpression(node, context) {
    return `${this.emitExpressionById(node.left, context)} ${this.luaAssignmentOperator(node.operator)} ${this.emitExpressionById(node.right, context)}`;
  }

  emitUpdateExpression(node, context) {
    const target = this.emitExpressionById(node.argument, context);
    const op = node.operator === "--" ? -1 : 1;
    if (node.prefix) {
      return `(function() ${target} = ${target} + ${op}; return ${target} end)()`;
    }
    return `(function() local _t = ${target}; ${target} = ${target} + ${op}; return _t end)()`;
  }

  emitUnaryExpression(node, context) {
    return `${this.luaUnaryOperator(node.operator)}${this.emitGrouped(node.argument, context)}`;
  }

  emitCallExpression(node, context) {
    const callee = this.emitExpressionById(node.callee, context);
    const args = (node.arguments || [])
      .map((argId) => this.emitExpressionById(argId, context))
      .join(", ");
    if (node.optional) {
      return `(type(${callee}) == "function" and ${callee}(${args}) or nil)`;
    }
    return `${callee}(${args})`;
  }

  emitNewExpression(node, context) {
    const callee = this.emitExpressionById(node.callee, context);
    const args = (node.arguments || [])
      .map((argId) => this.emitExpressionById(argId, context))
      .join(", ");
    return `${callee}(${args}) --[[new]]`;
  }

  emitConditionalExpression(node, context) {
    const test = this.emitExpressionById(node.test, context);
    const cons = this.emitExpressionById(node.consequent, context);
    const alt = this.emitExpressionById(node.alternate, context);
    return `((${test}) and (${cons}) or (${alt}))`;
  }

  isExpressionKind(kind) {
    return EXPRESSION_KINDS.has(kind);
  }

  emitPropertyById(propId, context) {
    const prop = context.nodes[propId];
    if (!prop || prop.kind !== "Property") {
      throw new Error(`Expected Property node for ${propId}`);
    }
    // key
    const keyNode = context.nodes[prop.key];
    let keyStr;
    if (keyNode && keyNode.kind === "Identifier" && /^[_A-Za-z][_A-Za-z0-9]*$/.test(keyNode.name)) {
      keyStr = keyNode.name;
    } else if (keyNode && keyNode.kind === "Literal" && typeof keyNode.value === "string") {
      keyStr = `[${JSON.stringify(keyNode.value)}]`;
    } else {
      keyStr = `[${this.emitExpressionById(prop.key, context)}]`;
    }
    const valueStr = this.emitExpressionById(prop.value, context);
    if (keyStr.startsWith("[")) {
      return `${keyStr} = ${valueStr}`;
    }
    return `${keyStr} = ${valueStr}`;
  }

  emitArrowFunction(node, context) {
    const params = (node.params || [])
      .map((paramId) => {
        const paramNode = context.nodes[paramId];
        if (!paramNode || paramNode.kind !== "Identifier") {
          throw new Error("Arrow function parameters must be identifiers");
        }
        return paramNode.name;
      })
      .join(", ");

    const body = this.emitBlockById(node.body, context, {
      indentLevel: context.indentLevel + 1,
    });

    return `function(${params})${NEWLINE}${body}${NEWLINE}${this.currentIndent(context)}end`;
  }

  emitFunctionExpression(node, context) {
    const params = (node.params || node.parameters || [])
      .map((paramId) => {
        const paramNode = typeof paramId === "string" ? context.nodes[paramId] : paramId;
        if (!paramNode || paramNode.kind !== "Identifier") {
          throw new Error("Function expression parameters must be identifiers");
        }
        return paramNode.name;
      })
      .join(", ");

    const bodyId = typeof node.body === "string" ? node.body : (node.body && node.body.id ? node.body.id : node.body);
    const body = this.emitBlockById(bodyId, context, {
      indentLevel: (context.indentLevel || 0) + 1,
    });

    // Function expressions are anonymous (or may have a name), emit similar to arrow functions
    return `function(${params})${NEWLINE}${body}${NEWLINE}${this.currentIndent(context)}end`;
  }

  emitLiteral(node) {
    if (node.literalKind === "string" || typeof node.value === "string") {
      return node.raw || JSON.stringify(node.value);
    }
    if (node.literalKind === "boolean") {
      return node.value ? "true" : "false";
    }
    if (node.literalKind === "null") {
      return "nil";
    }
    return typeof node.value === "number" ? String(node.value) : node.raw || "nil";
  }

  emitGrouped(nodeId, context) {
    const expression = this.emitExpressionById(nodeId, context);
    if (this.requiresGrouping(nodeId, context)) {
      return `(${expression})`;
    }
    return expression;
  }

  requiresGrouping(nodeId, context) {
    const node = context.nodes[nodeId];
    if (!node) return false;
    if (node.kind === "BinaryExpression") {
      if (node.operator === "+" && (this.isStringLike(node.left, context) || this.isStringLike(node.right, context))) {
        return false;
      }
      return true;
    }
    return node.kind === "LogicalExpression";
  }

  luaDeclarationPrefix(kind) {
    switch (kind) {
    case "var":
    case "let":
    case "const":
      return "local ";
    default:
      return "local ";
    }
  }

  luaOperator(operator) {
    if (operator === "===" || operator === "==") {
      return "==";
    }
    if (operator === "!==" || operator === "!=") {
      return "~=";
    }
    if (operator === "&&") {
      return "and";
    }
    if (operator === "||") {
      return "or";
    }
    return operator;
  }

  luaBinaryOperator(node, context) {
    if (node.kind === "BinaryExpression" && node.operator === "+") {
      if (this.isStringLike(node.left, context) || this.isStringLike(node.right, context)) {
        return "..";
      }
    }
    // Nullish coalescing operator
    if (node.operator === "??") {
      return "or";
    }
    return this.luaOperator(node.operator);
  }

  isStringLike(nodeOrId, context, depth = 0) {
    if (depth > 10 || !nodeOrId) {
      return false;
    }

    const node = typeof nodeOrId === "object" ? nodeOrId : context.nodes[nodeOrId];
    if (!node) {
      return false;
    }

    switch (node.kind) {
    case "Literal":
      return this.isLiteralString(node);
    case "TemplateLiteral":
      return true;
    case "BinaryExpression":
      return this.isBinaryStringConcat(node, context, depth);
    case "CallExpression":
      return this.isStringyCall(node, context);
    case "MemberExpression":
      return this.isStringyMember(node, context);
    default:
      return false;
    }
  }

  isLiteralString(node) {
      return node.literalKind === "string" || typeof node.value === "string";
  }

  isBinaryStringConcat(node, context, depth) {
      if (node.operator !== "+") return false;
      return this.isStringLike(node.left, context, depth + 1) || this.isStringLike(node.right, context, depth + 1);
  }

  isStringyCall(node, context) {
      // Check for String(x)
      if (node.callee) {
          const callee = context.nodes[node.callee];
          if (callee && callee.kind === "Identifier" && callee.name === "String") {
              return true;
          }
      }
      return false;
  }

  isStringyMember(node, context, depth) {
      // Check for .toString(), .substring(), etc.
      // This is a heuristic
      const prop = context.nodes[node.property];
      if (prop && prop.kind === "Identifier") {
          if (prop.name === "toString" || prop.name === "substring" || prop.name === "toUpperCase" || prop.name === "toLowerCase") {
              return true;
          }
      }
      return false;
    return node.literalKind === "string" || typeof node.value === "string";
  }

  isBinaryStringConcat(node, context, depth = 0) {
    if (node.operator !== "+") return false;
    const nextDepth = depth + 1;
    return this.isStringLike(node.left, context, nextDepth) || this.isStringLike(node.right, context, nextDepth);
  }

  isStringyCall(node, context) {
    if (node.callee) {
      const callee = context.nodes[node.callee];
      if (callee && callee.kind === "Identifier" && callee.name === "String") {
        return true;
      }
    }
    return false;
  }

  isStringyMember(node, context) {
    const prop = context.nodes[node.property];
    if (prop && prop.kind === "Identifier") {
      return prop.name === "toString" || prop.name === "substring" || prop.name === "toUpperCase" || prop.name === "toLowerCase";
    }
    return false;
  }

  luaAssignmentOperator(operator) {
    return operator === "=" ? "=" : operator;
  }

  luaUnaryOperator(operator) {
    if (operator === "!") {
      return "not ";
    }
    return operator;
  }

  indentContext(context, offset = 1) {
    return { ...context, indentLevel: (context.indentLevel || 0) + offset };
  }

  emitIndentedLine(context, line) {
    return this.withIndent(context, (indent) => `${indent}${line}`);
  }

  withIndent(context, factory) {
    const indent = this.currentIndent(context);
    return factory(indent);
  }

  currentIndent(context, offset = 0) {
    return this.indentUnit.repeat((context.indentLevel || 0) + offset);
  }
}

function emitLuaFromIR(irModule, options) {
  const emitter = new IREmitter(options);
  return emitter.emit(irModule);
}

module.exports = {
  IREmitter,
  emitLuaFromIR,
};