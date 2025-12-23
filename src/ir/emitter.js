"use strict";

const NEWLINE = "\n";

class IREmitter {
  constructor(options = {}) {
    this.indentUnit = options.indent || "  ";
    this.options = options;
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
    switch (node.kind) {
    case "VariableDeclaration":
      return this.emitVariableDeclaration(node, context);
    case "ExpressionStatement":
      return this.withIndent(context, (indent) =>
        indent + this.emitExpressionById(node.expression, context) + ""
      );
    case "ArrowFunctionExpression":
      // Emit anonymous arrow function as a local binding to keep valid Lua
      return this.withIndent(context, (indent) =>
        `${indent}local _arrow = ${this.emitArrowFunction(node, context)}`
      );
    case "ReturnStatement":
      return this.withIndent(context, (indent) => {
        const argId = node.value !== undefined ? node.value : node.argument;
        const argument = argId
          ? this.emitExpressionById(argId, context)
          : "";
        return `${indent}return${argument ? " " + argument : ""}`;
      });
    case "IfStatement":
      return this.emitIfStatement(node, context);
    case "WhileStatement":
      return this.emitWhileStatement(node, context);
    case "ForStatement":
      return this.emitForStatement(node, context);
    case "FunctionDeclaration":
      return this.emitFunctionDeclaration(node, context);
    case "ClassDeclaration":
      return this.withIndent(context, (indent) => `${indent}--[[ClassDeclaration not yet supported]]`);
    case "BlockStatement":
      return this.emitBlockById(node.id, context);
    case "TryStatement":
      return this.emitTryStatement(node, context);
    default:
      // Fallback: if this is an expression node at top-level, emit it as a statement
      if (this.isExpressionKind(node.kind)) {
        return this.withIndent(context, (indent) => indent + this.emitExpression(node, context));
      }
      if (node.expression) {
        return this.emitStatement(context.nodes[node.expression], context);
      }
      throw new Error(`Emitter does not support statement kind ${node.kind}`);
    }
  }

  emitTryStatement(node, context) {
    // Strategy:
    // - Wrap try block in a function __tryN and invoke via xpcall to capture traceback
    // - If handler exists, call handler body when error occurs; bind param if provided
    // - If finally exists, always execute after try/catch
    const idSuffix = (node.id || "").replace(/[^A-Za-z0-9_]/g, "");
    const fnName = `__try_${idSuffix || "blk"}`;
    const indent = this.currentIndent(context);

    const tryBody = this.emitBlockById(node.block, context);

    // Build protected function
    let out = `${indent}local function ${fnName}()` + NEWLINE + tryBody + NEWLINE + `${indent}end` + NEWLINE;

    // Error handler wrapper for xpcall to capture traceback
    // Lua's xpcall(handler) passes error to handler; we also attach debug.traceback
    const hasHandler = !!node.handler;
    const hasFinally = !!node.finalizer;
    const handlerNode = hasHandler ? context.nodes[node.handler] : null;
    let catchParam = null;
    let catchBody = null;
    if (handlerNode) {
      // schema: handler { param, body }
      if (handlerNode.param) {
        const p = context.nodes[handlerNode.param];
        if (p && p.kind === "Identifier") catchParam = p.name;
      }
      catchBody = this.emitBlockById(handlerNode.body, context);
    }

    const finallyBody = hasFinally ? this.emitBlockById(node.finalizer, context) : null;

    // xpcall flow
    out += `${indent}local __ok, __err = xpcall(${fnName}, function(e) return e end)` + NEWLINE;
    if (hasHandler) {
      out += `${indent}if (not __ok) then` + NEWLINE;
      if (catchParam) {
        out += `${this.currentIndent({ ...context, indentLevel: (context.indentLevel || 0) + 1 })}local ${catchParam} = __err` + NEWLINE;
      }
      out += catchBody + NEWLINE;
      out += `${indent}end` + NEWLINE;
    }
    if (hasFinally) {
      out += finallyBody + NEWLINE;
    }
    return out.trimEnd();
  }

  emitVariableDeclaration(node, context) {
    const chunks = [];
    for (const declarator of node.declarations) {
      // Handle both old pattern-based and new name-based structures
      let luaName;
      let isPattern = false;
      let patternNames = [];
      
      if (declarator.pattern) {
        // Old structure: declarator.pattern is an ID referencing an Identifier node
        const patternNode = context.nodes[declarator.pattern];
        if (!patternNode || patternNode.kind !== "Identifier") {
          throw new Error("Emitter only supports simple identifier patterns");
        }
        luaName = patternNode.name;
      } else if (typeof declarator.name === "string") {
        // New structure: declarator.name is a direct string
        luaName = declarator.name;
      } else if (declarator.name && context.nodes[declarator.name]) {
        const nameNode = context.nodes[declarator.name];
        if (nameNode.kind === "Identifier") {
          luaName = nameNode.name;
        } else if (nameNode.kind === "ArrayPattern") {
          // Handle array destructuring
          isPattern = true;
          patternNames = this.extractPatternNames(nameNode, context);
        } else if (nameNode.kind === "ObjectPattern") {
          // Handle object destructuring
          isPattern = true;
          patternNames = this.extractPatternNames(nameNode, context);
        } else {
          throw new Error(`Unsupported pattern type: ${nameNode.kind}`);
        }
      } else {
        throw new Error("Emitter unable to extract variable name from declarator");
      }
      
      const initExpr = declarator.init
        ? this.emitExpressionById(declarator.init, context)
        : null;
      const prefix = this.luaDeclarationPrefix(node.declarationKind || declarator.kind);
      
      if (isPattern && patternNames.length > 0) {
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
      } else {
        chunks.push(
          this.withIndent(context, (indent) =>
            `${indent}${prefix}${luaName}${initExpr ? " = " + initExpr : ""}`
          )
        );
      }
    }
    return chunks.join(NEWLINE);
  }

  extractPatternNames(patternNode, context) {
    const names = [];
    if (patternNode.kind === "ArrayPattern") {
      // Extract identifier names from array pattern elements
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
        } else if (elem && elem.kind === "Identifier") {
          names.push(elem.name);
        }
      }
    } else if (patternNode.kind === "ObjectPattern") {
      // Extract property names from object pattern
      for (const prop of (patternNode.properties || [])) {
        if (typeof prop === "string") {
          const propNode = context.nodes[prop];
          if (propNode && propNode.kind === "Property") {
            const valueNode = typeof propNode.value === "string" ? context.nodes[propNode.value] : propNode.value;
            if (valueNode && valueNode.kind === "Identifier") {
              names.push(valueNode.name);
            }
          }
        } else if (prop && prop.value) {
          const valStr = typeof prop.value === "string" ? prop.value : (prop.value.name || "");
          if (valStr) names.push(valStr);
        }
      }
    }
    return names;
  }

  emitIfStatement(node, context) {
    const testId = node.test !== undefined ? node.test : node.condition;
    const consId = node.consequent || node.consequence;
    const altId = node.alternate || node.elseBranch;
    const test = this.emitExpressionById(testId, context);
    const consequent = this.emitBlockById(consId, context);
    const alternate = altId
      ? this.emitBlockById(altId, context)
      : null;

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
    switch (node.kind) {
    case "Identifier":
      return node.name;
    case "Literal":
      return this.emitLiteral(node);
    case "MemberExpression": {
      const object = this.emitExpressionById(node.object, context);
      if (node.computed) {
        const prop = this.emitExpressionById(node.property, context);
        if (node.optional) {
          // Optional chaining: obj?.[prop] -> (obj ~= nil and obj[prop] or nil)
          return `(${object} ~= nil and ${object}[${prop}] or nil)`;
        }
        return `${object}[${prop}]`;
      }
      const propNode = context.nodes[node.property];
      const propName = propNode && propNode.kind === "Identifier" ? propNode.name : this.emitExpressionById(node.property, context);
      if (node.optional) {
        // Optional chaining: obj?.prop -> (obj ~= nil and obj.prop or nil)
        return `(${object} ~= nil and ${object}.${propName} or nil)`;
      }
      return `${object}.${propName}`;
    }
    case "ArrayExpression": {
      const items = (node.elements || []).map((elId) => this.emitExpressionById(elId, context)).join(", ");
      return `{ ${items} }`;
    }
    case "ObjectExpression": {
      const fields = (node.properties || []).map((propId) => this.emitPropertyById(propId, context)).join(", ");
      return `{ ${fields} }`;
    }
    case "BinaryExpression":
    case "LogicalExpression": {
      const operator = this.luaBinaryOperator(node, context);
      const left = this.emitGrouped(node.left, context);
      const right = this.emitGrouped(node.right, context);
      return `${left} ${operator} ${right}`;
    }
    case "AssignmentExpression":
      return `${this.emitExpressionById(node.left, context)} ${this.luaAssignmentOperator(
        node.operator
      )} ${this.emitExpressionById(node.right, context)}`;
    case "UpdateExpression": {
      // Lua lacks ++/--. If used as expression, simulate via IIFE that performs the update and returns correct value.
      const target = this.emitExpressionById(node.argument, context);
      const op = node.operator === "--" ? -1 : 1;
      if (node.prefix) {
        // ++i -> i = i + 1; return i
        return `(function() ${target} = ${target} + ${op}; return ${target} end)()`;
      }
      // i++ -> local _t = i; i = i + 1; return _t
      return `(function() local _t = ${target}; ${target} = ${target} + ${op}; return _t end)()`;
    }
    case "UnaryExpression":
      return `${this.luaUnaryOperator(node.operator)}${this.emitGrouped(node.argument, context)}`;
    case "CallExpression": {
      const callee = this.emitExpressionById(node.callee, context);
      const args = (node.arguments || [])
        .map((argId) => this.emitExpressionById(argId, context))
        .join(", ");
      if (node.optional) {
        // Optional call: fn?.() -> (type(fn) == "function" and fn() or nil)
        return `(type(${callee}) == "function" and ${callee}(${args}) or nil)`;
      }
      return `${callee}(${args})`;
    }
    case "NewExpression": {
      // No 'new' in Lua; best-effort: call callee as a constructor
      const callee = this.emitExpressionById(node.callee, context);
      const args = (node.arguments || [])
        .map((argId) => this.emitExpressionById(argId, context))
        .join(", ");
      return `${callee}(${args}) --[[new]]`;
    }
    case "FunctionDeclaration": {
      return this.emitFunctionExpression(node, context);
    }
    case "ConditionalExpression": {
      // Lua lacks ternary; use (cond) and a or b (note: not identical for falsy a)
      const test = this.emitExpressionById(node.test, context);
      const cons = this.emitExpressionById(node.consequent, context);
      const alt = this.emitExpressionById(node.alternate, context);
      return `((${test}) and (${cons}) or (${alt}))`;
    }
    case "ArrowFunctionExpression":
      return this.emitArrowFunction(node, context);
    case "FunctionExpression":
      return this.emitFunctionExpression(node, context);
    case "BlockStatement":
      return "{ --[[block]] }";
    default:
      throw new Error(`Emitter does not support expression kind ${node.kind}`);
    }
  }

  isExpressionKind(kind) {
    return (
      kind === "Identifier" ||
      kind === "Literal" ||
      kind === "BinaryExpression" ||
      kind === "LogicalExpression" ||
      kind === "AssignmentExpression" ||
      kind === "UnaryExpression" ||
      kind === "UpdateExpression" ||
      kind === "CallExpression" ||
      kind === "MemberExpression" ||
      kind === "NewExpression" ||
      kind === "ConditionalExpression" ||
      kind === "ArrayExpression" ||
      kind === "ObjectExpression" ||
      kind === "ArrowFunctionExpression" ||
      kind === "FunctionExpression" ||
      kind === "FunctionDeclaration"
    );
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
      // Treat string literals (by kind, inferred type, or runtime value) as string-like
      if (node.literalKind === "string") return true;
      if (typeof node.value === "string") return true;
      if (node.type && (node.type.primitiveType === "string" || node.type.type === "string" || node.type.name === "string")) {
        return true;
      }
      return false;
    case "TemplateLiteral":
      return true;
    case "BinaryExpression":
      // If operator is +, recursively check both sides
      if (node.operator === "+") {
        return this.isStringLike(node.left, context, depth + 1) || this.isStringLike(node.right, context, depth + 1);
      }
      return false;
    case "CallExpression": {
      // Check for .toString(), .concat(), String() constructor
      const callee = context.nodes[node.callee];
      if (callee && callee.kind === "MemberExpression") {
        const prop = context.nodes[callee.property];
        if (prop && prop.kind === "Identifier" && (prop.name === "toString" || prop.name === "concat")) {
          return true;
        }
      }
      if (callee && callee.kind === "Identifier" && callee.name === "String") {
        return true;
      }
      return false;
    }
    case "MemberExpression": {
      // String properties like .length on strings
      const obj = context.nodes[node.object];
      if (obj && this.isStringLike(obj, context, depth + 1)) {
        return true;
      }
      return false;
    }
    default:
      return false;
    }
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