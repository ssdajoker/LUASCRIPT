"use strict";

/**
 * Gleam V0.4 source-to-canonical-IR target-runtime bridge.
 *
 * This narrow lane accepts simple top-level `fn` definitions, `let` bindings,
 * expression returns, if-expressions, list literals, and print calls. Native
 * Gleam execution is not claimed because this workspace has no `gleam`
 * runtime on PATH.
 */

const { JSToIRCompiler } = require("./js-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Gleam input feature: ${feature}`);
}

class GleamToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToJavaScript(source);
    const program = new JSToIRCompiler().compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "gleam",
      gleamNativeExecution: "setup-blocked"
    };
    return program;
  }

  validateSource(source) {
    const checks = [
      [/\bimport\b|\bexternal\b/, "imports/externals"],
      [/\btype\b|\bopaque\b/, "custom types"],
      [/\bcase\b/, "case expressions"],
      [/\buse\b/, "use expressions"],
      [/\bfn\s*\(/, "anonymous functions"],
      [/\blet\s+[[(#]/, "pattern matching"],
      [/\btodo\b|\bpanic\b/, "panic/todo"],
      [/\|>/, "pipelines"],
      [/\bResult\b|\bOk\b|\bError\b/, "result types"],
      [/\brecord\b|#\(/, "records/tuples"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(source)) unsupported(feature);
    }
  }

  normalizeToJavaScript(source) {
    this.usesSumHelper = false;
    const functions = this.parseFunctions(source);
    this.functionNames = new Set(functions.map(fn => fn.name));

    const output = [];
    for (const fn of functions) {
      this.appendFunction(output, fn);
    }
    if (this.usesSumHelper) {
      output.unshift(this.sumHelper());
    }
    if (this.functionNames.has("main")) {
      output.push("main();");
    }
    return output.join("\n");
  }

  parseFunctions(source) {
    const functions = [];
    const pattern = /\b(?:pub\s+)?fn\s+([a-z][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{/g;
    let match;

    while ((match = pattern.exec(source)) !== null) {
      const openIndex = source.indexOf("{", match.index);
      const closeIndex = this.findMatchingBrace(source, openIndex);
      const params = match[2].trim()
        ? match[2].split(",").map(param => param.trim())
        : [];
      for (const param of params) {
        if (!/^[a-z][A-Za-z0-9_]*$/.test(param)) unsupported(`parameter ${param}`);
      }
      functions.push({
        name: match[1],
        params,
        body: source.slice(openIndex + 1, closeIndex)
      });
      pattern.lastIndex = closeIndex + 1;
    }

    if (functions.length === 0) unsupported("programs without fn definitions");
    return functions;
  }

  findMatchingBrace(source, openIndex) {
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (let index = openIndex; index < source.length; index++) {
      const char = source[index];
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }

      if (char === "\"" || char === "'") {
        quote = char;
        continue;
      }
      if (char === "{") depth++;
      if (char === "}") {
        depth--;
        if (depth === 0) return index;
      }
    }

    unsupported("unterminated function body");
  }

  appendFunction(output, fn) {
    output.push(`function ${fn.name}(${fn.params.join(", ")}) {`);
    const statements = this.parseBodyStatements(fn.body);
    const previousLocalConstants = this.localConstants;
    this.localConstants = new Map();
    for (let index = 0; index < statements.length; index++) {
      const statement = statements[index];
      const isLast = index === statements.length - 1;
      output.push(`  ${this.normalizeStatement(statement, isLast, fn.name)}`);
    }
    this.localConstants = previousLocalConstants;
    output.push("}");
  }

  parseBodyStatements(body) {
    return body
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.replace(/\/\/.*$/, "").trim())
      .filter(Boolean);
  }

  normalizeStatement(statement, isLast, functionName) {
    const letMatch = statement.match(/^let\s+([a-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (letMatch) {
      this.localConstants.set(letMatch[1], letMatch[2].trim());
      return `let ${letMatch[1]} = ${this.normalizeExpression(letMatch[2])};`;
    }

    const printMatch = statement.match(/^print\s*\((.*)\)$/);
    if (printMatch) {
      return `console.log(${this.normalizeArguments(printMatch[1])});`;
    }

    if (statement === "Nil" || statement === "nil") {
      return functionName === "main" ? "return null;" : "return null;";
    }

    if (isLast || functionName !== "main") {
      return `return ${this.normalizeExpression(statement)};`;
    }

    return `${this.normalizeExpression(statement)};`;
  }

  normalizeArguments(args) {
    return this.splitCommaArguments(args).map(arg => this.normalizeExpression(arg)).join(", ");
  }

  normalizeExpression(expression) {
    const current = expression.trim();
    const ifMatch = current.match(/^if\s+(.+)\s*\{\s*(.+)\s*\}\s*else\s*\{\s*(.+)\s*\}$/);
    if (ifMatch) {
      return `(${this.normalizeExpression(ifMatch[1])} ? ${this.normalizeExpression(ifMatch[2])} : ${this.normalizeExpression(ifMatch[3])})`;
    }

    const sumMatch = current.match(/^list_sum\s*\((.*)\)$/);
    if (sumMatch) {
      const literalItems = this.parseListLiteral(sumMatch[1]);
      if (literalItems) {
        return literalItems.map(item => this.normalizeExpression(item)).join(" + ");
      }
      this.usesSumHelper = true;
      return `__gleam_sum(${this.normalizeExpression(sumMatch[1])})`;
    }

    const listAtMatch = current.match(/^list_at\s*\((.*)\)$/);
    if (listAtMatch) {
      const args = this.splitCommaArguments(listAtMatch[1]);
      if (args.length !== 2) unsupported("list_at arity");
      const literalItems = this.parseListLiteral(args[0]);
      if (!literalItems) unsupported("dynamic list indexing");
      if (!/^\d+$/.test(args[1].trim())) unsupported("dynamic list index");
      const index = Number(args[1].trim());
      if (index < 0 || index >= literalItems.length) unsupported("out-of-range list indexing");
      return this.normalizeExpression(literalItems[index]);
    }

    const lengthMatch = current.match(/^(list_length|string_length)\s*\((.*)\)$/);
    if (lengthMatch) {
      const [, helper, rawArgs] = lengthMatch;
      const args = this.splitCommaArguments(rawArgs);
      if (args.length !== 1) unsupported(`${helper} arity`);
      const literalItems = this.parseListLiteral(args[0]);
      if (helper === "list_length") {
        if (literalItems) return String(literalItems.length);
        if (this.localConstants && this.localConstants.has(args[0].trim())) {
          const constantItems = this.parseListLiteral(this.localConstants.get(args[0].trim()));
          if (constantItems) return String(constantItems.length);
        }
        unsupported("dynamic list_length");
      }
      const value = args[0].trim();
      if (/^["']/.test(value)) return String(value.slice(1, -1).length);
      if (this.localConstants && this.localConstants.has(value)) {
        const constant = this.localConstants.get(value);
        if (/^["']/.test(constant)) return String(constant.slice(1, -1).length);
      }
      unsupported("dynamic string_length");
    }

    return current
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNil\b/g, "null");
  }

  parseListLiteral(expression) {
    const current = expression.trim();
    if (!current.startsWith("[") || !current.endsWith("]")) return null;
    return this.splitCommaArguments(current.slice(1, -1));
  }

  splitCommaArguments(text) {
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
      if (char === "(" || char === "[" || char === "{") depth++;
      if (char === ")" || char === "]" || char === "}") depth--;
      if (char === "," && depth === 0) {
        args.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  }

  sumHelper() {
    return [
      "function __gleam_sum(values) {",
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
  GleamToIRCompiler
};
