"use strict";

/**
 * Elm V0.4 source-to-canonical-IR target-runtime bridge.
 *
 * This is a narrow expression-oriented lane for evidence gathering. It accepts
 * simple Elm-style top-level definitions and lowers them by normalizing into
 * the existing JavaScript-to-IR compiler. Native Elm execution is intentionally
 * not claimed because this workspace has no `elm` runtime on PATH.
 */

const { JSToIRCompiler } = require("./js-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Elm input feature: ${feature}`);
}

class ElmToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToJavaScript(source);
    const program = new JSToIRCompiler().compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "elm",
      elmNativeExecution: "setup-blocked"
    };
    return program;
  }

  validateSource(source) {
    const checks = [
      [/\bmodule\b|\bimport\b|\bexposing\b/, "modules/imports"],
      [/\bport\b|\bsubscription\b|\bCmd\b|\bSub\b/, "ports/effects"],
      [/\btype\s+/, "custom types"],
      [/\bcase\b|\bof\b/, "case expressions"],
      [/\\\s*[A-Za-z_]/, "lambdas"],
      [/::/, "list cons/pattern matching"],
      [/\{[^}\n]*=/, "records/record update"],
      [/\|>/, "pipelines"],
      [/\blet\s+.+\s+in\s+.+->/, "let-bound functions"],
      [/\bHtml\b|\bBrowser\b/, "application/runtime packages"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(source)) unsupported(feature);
    }
  }

  normalizeToJavaScript(source) {
    this.usesSumHelper = false;
    this.helperId = 0;
    const definitions = this.parseDefinitions(source);
    this.constantDefinitions = new Map(
      definitions
        .filter(definition => definition.name !== "main" && definition.params.length === 0)
        .map(definition => [definition.name, definition.expression])
    );
    this.functionNames = new Set(
      definitions
        .filter(definition => definition.params.length > 0)
        .map(definition => definition.name)
    );

    const output = [];
    for (const definition of definitions) {
      this.appendDefinition(output, definition);
    }
    if (this.usesSumHelper) {
      output.unshift(this.sumHelper());
    }
    return output.join("\n");
  }

  parseDefinitions(source) {
    return source
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.replace(/--.*$/, "").trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^([a-z][A-Za-z0-9_]*)\s*([^=]*?)\s*=\s*(.+)$/);
        if (!match) unsupported(`definition ${line}`);
        const [, name, paramsText, expression] = match;
        const params = paramsText.trim() ? paramsText.trim().split(/\s+/) : [];
        for (const param of params) {
          if (!/^[a-z][A-Za-z0-9_]*$/.test(param)) unsupported(`parameter ${param}`);
        }
        return { name, params, expression };
      });
  }

  appendDefinition(output, definition) {
    if (definition.name === "main") {
      if (definition.params.length > 0) unsupported("main with parameters");
      for (const statement of definition.expression.split(";").map(part => part.trim()).filter(Boolean)) {
        output.push(this.normalizeMainStatement(statement));
      }
      return;
    }

    if (definition.params.length > 0) {
      output.push(`function ${definition.name}(${definition.params.join(", ")}) {`);
      const letExpression = this.parseLetExpression(definition.expression);
      if (letExpression) {
        for (const binding of letExpression.bindings) {
          output.push(`  const ${binding.name} = ${this.normalizeExpression(binding.expression)};`);
        }
        output.push(`  return ${this.normalizeExpression(letExpression.body)};`);
      } else {
        output.push(`  return ${this.normalizeExpression(definition.expression)};`);
      }
      output.push("}");
      return;
    }

    const letExpression = this.parseLetExpression(definition.expression);
    if (letExpression) {
      const helperName = `__elm_let_${definition.name}_${this.helperId++}`;
      output.push(`function ${helperName}() {`);
      for (const binding of letExpression.bindings) {
        output.push(`  const ${binding.name} = ${this.normalizeExpression(binding.expression)};`);
      }
      output.push(`  return ${this.normalizeExpression(letExpression.body)};`);
      output.push("}");
      output.push(`const ${definition.name} = ${helperName}();`);
      return;
    }

    output.push(`const ${definition.name} = ${this.normalizeExpression(definition.expression)};`);
  }

  normalizeMainStatement(statement) {
    const print = statement.match(/^print\s+(.+)$/);
    if (!print) unsupported(`main statement ${statement}`);
    return `console.log(${this.normalizeExpression(print[1])});`;
  }

  normalizeExpression(expression) {
    const current = this.stripOuterParens(expression.trim())
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false");

    const ifMatch = current.match(/^if\s+(.+)\s+then\s+(.+)\s+else\s+(.+)$/);
    if (ifMatch) {
      return `(${this.normalizeExpression(ifMatch[1])} ? ${this.normalizeExpression(ifMatch[2])} : ${this.normalizeExpression(ifMatch[3])})`;
    }

    const letExpression = this.parseLetExpression(current);
    if (letExpression) {
      unsupported("nested let expressions outside definition bodies");
    }

    const sumMatch = current.match(/^sum\s+(.+)$/);
    if (sumMatch) {
      const literalItems = this.parseListLiteral(sumMatch[1]);
      if (literalItems) {
        return literalItems.map(item => this.normalizeExpression(item)).join(" + ");
      }
      this.usesSumHelper = true;
      return `__elm_sum(${this.normalizeExpression(sumMatch[1])})`;
    }

    return this.renderElmNode(this.parseElmExpression(current));
  }

  parseLetExpression(expression) {
    const current = this.stripOuterParens(expression.trim());
    if (!current.startsWith("let ")) return null;
    const inIndex = this.findTopLevelKeyword(current, "in", 4);
    if (inIndex === -1) unsupported("let expressions without in");

    const bindingsText = current.slice(4, inIndex).trim();
    const body = current.slice(inIndex + 2).trim();
    if (!bindingsText || !body) unsupported("malformed let expression");

    const bindings = this.splitSemicolonStatements(bindingsText).map((binding) => {
      const match = binding.match(/^([a-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if (!match) unsupported(`let binding ${binding}`);
      return { name: match[1], expression: match[2] };
    });
    return { bindings, body };
  }

  splitSemicolonStatements(text) {
    return this.splitDelimited(text, ";");
  }

  parseElmExpression(expression) {
    const parser = {
      tokens: this.tokenizeExpression(expression),
      index: 0
    };
    const node = this.parseElmBinary(parser, 0);
    if (parser.index !== parser.tokens.length) {
      unsupported(`expression token ${parser.tokens[parser.index].value}`);
    }
    return node;
  }

  tokenizeExpression(expression) {
    const tokens = [];
    let index = 0;

    while (index < expression.length) {
      const char = expression[index];
      if (/\s/.test(char)) {
        index++;
        continue;
      }
      if (char === "\"" || char === "'") {
        const quote = char;
        let current = quote;
        index++;
        while (index < expression.length) {
          current += expression[index];
          if (expression[index] === quote && expression[index - 1] !== "\\") {
            index++;
            break;
          }
          index++;
        }
        tokens.push({ type: "string", value: current });
        continue;
      }
      const twoChar = expression.slice(index, index + 2);
      if (["&&", "||", "==", "/=", "!=", "<=", ">=", "++"].includes(twoChar)) {
        tokens.push({ type: "operator", value: twoChar });
        index += 2;
        continue;
      }
      if ("()+-*/%<>,[]".includes(char)) {
        tokens.push({ type: char === "," ? "comma" : "operator", value: char });
        index++;
        continue;
      }
      const number = expression.slice(index).match(/^\d+(?:\.\d+)?/);
      if (number) {
        tokens.push({ type: "number", value: number[0] });
        index += number[0].length;
        continue;
      }
      const identifier = expression.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (identifier) {
        tokens.push({ type: "identifier", value: identifier[0] });
        index += identifier[0].length;
        continue;
      }
      unsupported(`expression character ${char}`);
    }

    return tokens;
  }

  parseElmBinary(parser, minPrecedence) {
    let left = this.parseElmApplication(parser);

    while (parser.index < parser.tokens.length) {
      const token = parser.tokens[parser.index];
      const precedence = this.elmPrecedence(token.value);
      if (precedence < minPrecedence) break;
      parser.index++;
      const right = this.parseElmBinary(parser, precedence + 1);
      left = { type: "binary", operator: token.value, left, right };
    }

    return left;
  }

  parseElmApplication(parser) {
    let expression = this.parseElmPrefix(parser);

    while (this.canCallElmNode(expression) && this.nextStartsElmArgument(parser)) {
      const args = [];
      do {
        args.push(this.parseElmPrefix(parser));
      } while (this.nextStartsElmArgument(parser));
      expression = { type: "call", callee: expression, args };
    }

    return expression;
  }

  parseElmPrefix(parser) {
    const token = parser.tokens[parser.index];
    if (!token) unsupported("empty expression");
    if (token.type === "identifier" && token.value === "not") {
      parser.index++;
      return { type: "unary", operator: "!", argument: this.parseElmPrefix(parser) };
    }
    if (token.value === "-") {
      parser.index++;
      return { type: "unary", operator: "-", argument: this.parseElmPrefix(parser) };
    }
    return this.parseElmPrimary(parser);
  }

  parseElmPrimary(parser) {
    const token = parser.tokens[parser.index++];
    if (!token) unsupported("empty expression");

    if (token.type === "number" || token.type === "string") {
      return { type: "raw", value: token.value };
    }
    if (token.type === "identifier") {
      if (token.value === "true" || token.value === "false") {
        return { type: "raw", value: token.value };
      }
      return { type: "identifier", name: token.value };
    }
    if (token.value === "(") {
      const expression = this.parseElmBinary(parser, 0);
      this.expectElmToken(parser, ")");
      return expression;
    }
    if (token.value === "[") {
      const elements = [];
      if (!this.peekElmToken(parser, "]")) {
        do {
          elements.push(this.parseElmBinary(parser, 0));
        } while (this.consumeElmToken(parser, ","));
      }
      this.expectElmToken(parser, "]");
      return { type: "array", elements };
    }

    unsupported(`expression token ${token.value}`);
  }

  canCallElmNode(node) {
    if (!node || node.type !== "identifier") return false;
    return this.functionNames.has(node.name) || node.name === "at" || node.name === "sum" || node.name === "length";
  }

  nextStartsElmArgument(parser) {
    const token = parser.tokens[parser.index];
    if (!token) return false;
    if (token.type === "number" || token.type === "string") return true;
    if (token.type === "identifier") return !["then", "else", "in"].includes(token.value);
    return token.value === "(" || token.value === "[";
  }

  elmPrecedence(operator) {
    return {
      "||": 1,
      "&&": 2,
      "==": 3,
      "!=": 3,
      "/=": 3,
      "<": 3,
      ">": 3,
      "<=": 3,
      ">=": 3,
      "+": 4,
      "-": 4,
      "*": 5,
      "/": 5,
      "%": 5,
      "++": 4
    }[operator] || -1;
  }

  expectElmToken(parser, value) {
    if (!this.consumeElmToken(parser, value)) unsupported(`expected ${value}`);
  }

  consumeElmToken(parser, value) {
    if (this.peekElmToken(parser, value)) {
      parser.index++;
      return true;
    }
    return false;
  }

  peekElmToken(parser, value) {
    const token = parser.tokens[parser.index];
    return Boolean(token && token.value === value);
  }

  renderElmNode(node) {
    if (node.type === "raw") return node.value;
    if (node.type === "identifier") return node.name;
    if (node.type === "array") {
      return `[${node.elements.map(element => this.renderElmNode(element)).join(", ")}]`;
    }
    if (node.type === "unary") {
      return `(${node.operator}${this.renderElmNode(node.argument)})`;
    }
    if (node.type === "binary") {
      const operator = node.operator === "/=" ? "!=" : node.operator === "++" ? "+" : node.operator;
      return `(${this.renderElmNode(node.left)} ${operator} ${this.renderElmNode(node.right)})`;
    }
    if (node.type === "call") {
      const callee = this.renderElmNode(node.callee);
      if (callee === "sum") {
        return this.renderElmSumCall(node.args);
      }
      if (callee === "at") {
        return this.renderElmAtCall(node.args);
      }
      if (callee === "length") {
        return this.renderElmLengthCall(node.args);
      }
      return `${callee}(${node.args.map(arg => this.renderElmNode(arg)).join(", ")})`;
    }
    unsupported(`expression node ${node.type}`);
  }

  renderElmSumCall(args) {
    if (args.length !== 1) unsupported("sum arity");
    const [values] = args;
    if (values.type === "array") {
      return values.elements.map(element => this.renderElmNode(element)).join(" + ");
    }
    this.usesSumHelper = true;
    return `__elm_sum(${this.renderElmNode(values)})`;
  }

  renderElmAtCall(args) {
    if (args.length !== 2) unsupported("at arity");
    const [indexNode, valuesNode] = args;
    if (indexNode.type !== "raw" || !/^\d+$/.test(indexNode.value)) {
      unsupported("dynamic list indexing");
    }
    if (valuesNode.type !== "array") {
      unsupported("non-literal list indexing");
    }
    const index = Number(indexNode.value);
    if (index < 0 || index >= valuesNode.elements.length) {
      unsupported("out-of-range list indexing");
    }
    return this.renderElmNode(valuesNode.elements[index]);
  }

  renderElmLengthCall(args) {
    if (args.length !== 1) unsupported("length arity");
    const [value] = args;
    if (value.type === "array") return String(value.elements.length);
    if (value.type === "raw" && /^["']/.test(value.value)) return String(value.value.slice(1, -1).length);
    if (value.type === "identifier" && this.constantDefinitions.has(value.name)) {
      const constant = this.constantDefinitions.get(value.name).trim();
      const literalItems = this.parseListLiteral(constant);
      if (literalItems) return String(literalItems.length);
      if (/^["']/.test(constant)) return String(constant.slice(1, -1).length);
    }
    unsupported("dynamic length");
  }

  findTopLevelKeyword(text, keyword, startIndex = 0) {
    let depth = 0;
    let quote = null;
    for (let index = startIndex; index < text.length; index++) {
      const char = text[index];
      if (quote) {
        if (char === quote && text[index - 1] !== "\\") quote = null;
        continue;
      }
      if (char === "\"" || char === "'") {
        quote = char;
        continue;
      }
      if (char === "(" || char === "[") depth++;
      if (char === ")" || char === "]") depth--;
      if (depth === 0 && text.slice(index, index + keyword.length) === keyword) {
        const before = text[index - 1] || "";
        const after = text[index + keyword.length] || "";
        if (!/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after)) return index;
      }
    }
    return -1;
  }

  parseListLiteral(expression) {
    const current = expression.trim();
    if (!current.startsWith("[") || !current.endsWith("]")) return null;
    return this.splitCommaArguments(current.slice(1, -1));
  }

  splitCommaArguments(text) {
    return this.splitDelimited(text, ",");
  }

  splitDelimited(text, delimiter) {
    const args = [];
    let current = "";
    let depth = 0;
    let quote = null;

    for (const char of text.trim()) {
      if (quote) {
        current += char;
        if (char === quote) quote = null;
        continue;
      }
      if (char === "\"" || char === "'") {
        quote = char;
        current += char;
        continue;
      }
      if (char === "(" || char === "[") depth++;
      if (char === ")" || char === "]") depth--;
      if (char === delimiter && depth === 0) {
        if (current.trim()) args.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  }

  splitCallArguments(text) {
    const args = [];
    let current = "";
    let depth = 0;
    let quote = null;

    for (const char of text.trim()) {
      if (quote) {
        current += char;
        if (char === quote) quote = null;
        continue;
      }
      if (char === "\"" || char === "'") {
        quote = char;
        current += char;
        continue;
      }
      if (char === "(" || char === "[") depth++;
      if (char === ")" || char === "]") depth--;
      if (/\s/.test(char) && depth === 0) {
        if (current.trim()) args.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  }

  stripOuterParens(expression) {
    if (!expression.startsWith("(") || !expression.endsWith(")")) return expression;
    let depth = 0;
    for (let index = 0; index < expression.length; index++) {
      if (expression[index] === "(") depth++;
      if (expression[index] === ")") depth--;
      if (depth === 0 && index < expression.length - 1) return expression;
    }
    return expression.slice(1, -1).trim();
  }

  sumHelper() {
    return [
      "function __elm_sum(values) {",
      "  let total = 0;",
      "  for (let i = 0; i < values.length; i = i + 1) {",
      "    total = total + values[i];",
      "  }",
      "  return total;",
      "}"
    ].join("\n");
  }

}

module.exports = {
  ElmToIRCompiler
};
