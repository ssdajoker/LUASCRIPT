"use strict";

/**
 * Ruby V0.4 source-to-canonical-IR target-runtime bridge.
 *
 * This is a narrow Ruby frontend for evidence gathering. It lowers simple
 * method-oriented Ruby, arrays, simple hash objects, inclusive ranges, boolean
 * flow, and break/next into the shared C-like slice, then executes emitted
 * targets. Native Ruby execution remains separate because this workspace does
 * not have a `ruby` runtime on PATH.
 */

const { CLikeToIRCompiler } = require("./c-like-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Ruby input feature: ${feature}`);
}

class RubyToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToCLike(source);
    const compiler = new CLikeToIRCompiler({ language: "ruby", languageLabel: "Ruby" });
    const program = compiler.compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "ruby",
      rubyNativeExecution: "setup-blocked"
    };
    return program;
  }

  validateSource(source) {
    const checks = [
      [/\brequire\b|\bload\b/, "imports"],
      [/\bclass\b|\bmodule\b/, "object system"],
      [/\bbegin\b|\brescue\b|\bensure\b|\braise\b/, "exceptions"],
      [/\byield\b|\bProc\b|\blambda\b|->/, "blocks/lambdas"],
      [/\.\.\./, "exclusive ranges"],
      [/[A-Za-z_]\w*\s*\{[^}]*\|/, "block methods"],
      [/#\{/, "string interpolation"],
      [/\.\s*(map|select|each|reduce|inject)\b/, "Enumerable methods"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(source)) unsupported(feature);
    }
  }

  normalizeToCLike(source) {
    this.declared = new Set();
    this.hashTypes = new Map();
    this.loopCounter = 0;

    const lines = source
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.replace(/#.*$/, "").trim())
      .filter(Boolean);

    const prelude = [];
    const output = [];
    for (const line of lines) {
      this.appendNormalizedLine(output, line, prelude);
    }

    return [...prelude, ...output].join("\n");
  }

  appendNormalizedLine(output, line, prelude) {
    const functionMatch = line.match(/^def\s+([A-Za-z_]\w*)\s*(?:\(([^)]*)\))?$/);
    if (functionMatch) {
      const [, name, params = ""] = functionMatch;
      const returnType = name === "main" ? "void" : "double";
      output.push(`${returnType} ${name}(${this.normalizeParameters(params) || "void"}) {`);
      return;
    }

    const forMatch = line.match(/^for\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*)$/);
    if (forMatch) {
      const [, itemName, listName] = forMatch;
      const indexName = `__ruby_i${this.loopCounter++}`;
      this.declared.add(itemName);
      output.push(`for (int ${indexName} = 0; ${indexName} < sizeof(${listName}) / sizeof(${listName}[0]); ${indexName} = ${indexName} + 1) {`);
      output.push(`double ${itemName} = ${listName}[${indexName}];`);
      return;
    }

    const rangeForMatch = line.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+)\.\.(.+)$/);
    if (rangeForMatch) {
      const [, itemName, rawStart, rawEnd] = rangeForMatch;
      this.declared.add(itemName);
      output.push(`for (double ${itemName} = ${this.normalizeExpression(rawStart)}; ${itemName} <= ${this.normalizeExpression(rawEnd)}; ${itemName} = ${itemName} + 1) {`);
      return;
    }

    const ifMatch = line.match(/^if\s+(.+)$/);
    if (ifMatch) {
      output.push(`if (${this.normalizeExpression(ifMatch[1])}) {`);
      return;
    }

    const elsifMatch = line.match(/^elsif\s+(.+)$/);
    if (elsifMatch) {
      output.push(`} else if (${this.normalizeExpression(elsifMatch[1])}) {`);
      return;
    }

    if (line === "else") {
      output.push("} else {");
      return;
    }

    const whileMatch = line.match(/^while\s+(.+)$/);
    if (whileMatch) {
      output.push(`while (${this.normalizeExpression(whileMatch[1])}) {`);
      return;
    }

    if (line === "end") {
      output.push("}");
      return;
    }

    if (line === "break" || line === "next") {
      output.push(line === "next" ? "continue;" : "break;");
      return;
    }

    const returnMatch = line.match(/^return(?:\s+(.+))?$/);
    if (returnMatch) {
      output.push(returnMatch[1] ? `return ${this.normalizeExpression(returnMatch[1])};` : "return;");
      return;
    }

    const putsMatch = line.match(/^puts(?:\s+|\()(.+)\)?$/);
    if (putsMatch) {
      output.push(`puts(${this.normalizeArguments(putsMatch[1])});`);
      return;
    }

    const indexedAssignmentMatch = line.match(/^([A-Za-z_]\w*)\s*(\[[^\]]+\])\s*=\s*(.+)$/);
    if (indexedAssignmentMatch) {
      const [, name, indexExpression, rawValue] = indexedAssignmentMatch;
      output.push(`${name}${this.normalizeHashOrArrayIndex(indexExpression)} = ${this.normalizeExpression(rawValue)};`);
      return;
    }

    const assignmentMatch = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      const [, name, rawValue] = assignmentMatch;
      if (this.declared.has(name)) {
        output.push(`${name} = ${this.normalizeExpression(rawValue)};`);
        return;
      }

      this.declared.add(name);
      if (this.isHashLiteral(rawValue)) {
        const hash = this.parseHashLiteral(rawValue, name);
        const typeName = `__RubyHash_${name}`;
        if (!this.hashTypes.has(typeName)) {
          this.hashTypes.set(typeName, hash.keys);
          prelude.push(`struct ${typeName} {`);
          for (const key of hash.keys) {
            prelude.push(`  double ${key};`);
          }
          prelude.push("};");
        }
        output.push(`${typeName} ${name} = {${hash.values.join(", ")}};`);
      } else if (/^\[.*\]$/.test(rawValue.trim())) {
        output.push(`double ${name}[] = ${this.normalizeExpression(rawValue)};`);
      } else {
        output.push(`double ${name} = ${this.normalizeExpression(rawValue)};`);
      }
      return;
    }

    const callMatch = line.match(/^([A-Za-z_]\w*)\s*\((.*)\)$/);
    if (callMatch) {
      output.push(`${callMatch[1]}(${this.normalizeArguments(callMatch[2])});`);
      return;
    }

    unsupported(`statement ${line}`);
  }

  normalizeParameters(params) {
    const trimmed = params.trim();
    if (!trimmed) return "";
    return trimmed.split(",").map((param) => {
      const name = param.trim();
      if (!/^[A-Za-z_]\w*$/.test(name)) unsupported(`parameter syntax ${name}`);
      this.declared.add(name);
      return `double ${name}`;
    }).join(", ");
  }

  normalizeArguments(args) {
    return args.split(",").map(arg => this.normalizeExpression(arg.trim())).join(", ");
  }

  normalizeExpression(expression) {
    const trimmed = expression.trim();
    if (this.isHashLiteral(trimmed)) unsupported("hash literals outside simple assignment");
    return trimmed
      .trim()
      .replace(/\band\b/g, "&&")
      .replace(/\bor\b/g, "||")
      .replace(/\bnot\b/g, "!")
      .replace(/\bnil\b/g, "NULL")
      .replace(/\b([A-Za-z_]\w*)\s*\.\s*(?:length|size)\b/g, "$1.size()")
      .replace(/\b([A-Za-z_]\w*)\s*\[\s*(:?[A-Za-z_]\w*|"[A-Za-z_]\w*"|'[A-Za-z_]\w*')\s*\]/g, (_match, name, rawKey) => {
        if (rawKey.startsWith(":") || rawKey.startsWith("\"") || rawKey.startsWith("'")) {
          return `${name}.${this.normalizeHashKey(rawKey)}`;
        }
        return `${name}[${rawKey}]`;
      })
      .replace(/^\[(.*)\]$/, "{$1}");
  }

  normalizeHashOrArrayIndex(indexExpression) {
    const rawKey = indexExpression.slice(1, -1).trim();
    if (/^:?[A-Za-z_]\w*$/.test(rawKey) || /^["'][A-Za-z_]\w*["']$/.test(rawKey)) {
      if (rawKey.startsWith(":") || rawKey.startsWith("\"") || rawKey.startsWith("'")) {
        return `.${this.normalizeHashKey(rawKey)}`;
      }
    }
    return `[${this.normalizeExpression(rawKey)}]`;
  }

  isHashLiteral(value) {
    const trimmed = value.trim();
    return /^\{[\s\S]*\}$/.test(trimmed) && /=>|[A-Za-z_]\w*\s*:/.test(trimmed);
  }

  parseHashLiteral(value, variableName) {
    const body = value.trim().slice(1, -1).trim();
    if (!body) unsupported("empty hash literals");
    const keys = [];
    const values = [];
    for (const entry of this.splitTopLevel(body, ",")) {
      const pair = this.splitHashEntry(entry);
      if (!pair) unsupported(`hash entry syntax ${entry.trim()}`);
      const key = this.normalizeHashKey(pair.key.trim());
      if (keys.includes(key)) unsupported(`duplicate hash key ${key}`);
      keys.push(key);
      values.push(this.normalizeExpression(pair.value.trim()));
    }
    if (keys.length === 0) unsupported(`empty hash literal for ${variableName}`);
    return { keys, values };
  }

  splitHashEntry(entry) {
    const rocketIndex = entry.indexOf("=>");
    if (rocketIndex !== -1) {
      return {
        key: entry.slice(0, rocketIndex),
        value: entry.slice(rocketIndex + 2)
      };
    }
    const colonMatch = entry.match(/^\s*([A-Za-z_]\w*)\s*:\s*([\s\S]+)$/);
    if (colonMatch) {
      return { key: colonMatch[1], value: colonMatch[2] };
    }
    return null;
  }

  normalizeHashKey(rawKey) {
    const trimmed = rawKey.trim();
    const symbol = trimmed.match(/^:([A-Za-z_]\w*)$/);
    if (symbol) return symbol[1];
    const quoted = trimmed.match(/^["']([A-Za-z_]\w*)["']$/);
    if (quoted) return quoted[1];
    if (/^[A-Za-z_]\w*$/.test(trimmed)) return trimmed;
    unsupported(`hash key ${trimmed}`);
  }

  splitTopLevel(value, delimiter) {
    const parts = [];
    let start = 0;
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (let index = 0; index < value.length; index++) {
      const char = value[index];
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
      if (char === "[" || char === "{" || char === "(") depth++;
      if (char === "]" || char === "}" || char === ")") depth--;
      if (char === delimiter && depth === 0) {
        parts.push(value.slice(start, index));
        start = index + 1;
      }
    }

    parts.push(value.slice(start));
    return parts.map(part => part.trim()).filter(Boolean);
  }
}

module.exports = {
  RubyToIRCompiler
};
