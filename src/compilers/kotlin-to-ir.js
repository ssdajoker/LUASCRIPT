"use strict";

/**
 * Kotlin V0.25 source-to-canonical-IR compiler.
 *
 * This is a narrow target-runtime bridge for beta readiness. It normalizes a
 * small executable Kotlin subset into the shared C-like frontend, then relies
 * on canonical IR emitters. Native Kotlin execution remains setup-dependent
 * until kotlinc is available and strict native fixtures pass.
 */

const { CLikeToIRCompiler } = require("./c-like-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Kotlin input feature: ${feature}`);
}

const TYPE_MAP = new Map([
  ["Int", "int"],
  ["Long", "long"],
  ["Double", "double"],
  ["Float", "float"],
  ["Boolean", "bool"],
  ["String", "char*"],
  ["Char", "char"],
  ["Unit", "void"]
]);

class KotlinToIRCompiler {
  constructor() {
    this.dataClassFields = new Map();
  }

  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToCLike(source);
    const compiler = new CLikeToIRCompiler({ language: "kotlin", languageLabel: "Kotlin" });
    const program = compiler.compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "kotlin",
      kotlinNativeExecution: "setup-dependent"
    };
    return program;
  }

  validateSource(source) {
    const sourceWithoutDataClasses = source.replace(/\bdata\s+class\s+[A-Za-z_]\w*\s*\([^)]*\)/g, "");
    const checks = [
      [/^\s*package\s+/m, "packages"],
      [/^\s*import\s+/m, "imports"],
      [/\bclass\s+[A-Za-z_]/, "classes beyond data-class records"],
      [/\binterface\s+[A-Za-z_]/, "interfaces"],
      [/\benum\s+class\b/, "enums"],
      [/\bsealed\s+class\b/, "sealed classes"],
      [/\bobject\s+[A-Za-z_]/, "objects"],
      [/\bwhen\s*\(/, "when expressions"],
      [/\btry\b|\bcatch\b|\bthrow\b/, "exceptions"],
      [/\bsuspend\s+fun\b|\bcoroutine\b/, "coroutines"],
      [/->/, "lambdas"],
      [/<[A-Z][A-Za-z0-9_]*(?:\s*,\s*[A-Z][A-Za-z0-9_]*)*>/, "generics"],
      [/\?\./, "safe calls"],
      [/\?:/, "elvis operator"],
      [/[A-Za-z_]\w*\s*:\s*[A-Za-z_]\w*\?/, "nullable types"],
      [/\b(listOf|mutableListOf|mapOf|mutableMapOf|setOf)\s*\(/, "collections beyond primitive arrays"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(sourceWithoutDataClasses)) unsupported(feature);
    }
  }

  normalizeToCLike(source) {
    this.dataClassFields = new Map();
    const output = [];
    let rangeCounter = 0;

    for (const rawLine of source.split(/\r?\n/)) {
      let line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("//")) {
        output.push(line);
        continue;
      }

      line = line.replace(/;$/, "").trim();

      const dataClassLine = this.normalizeDataClassLine(line);
      if (dataClassLine) {
        output.push(...dataClassLine);
        continue;
      }

      const functionLine = this.normalizeFunctionLine(line);
      if (functionLine) {
        output.push(functionLine);
        continue;
      }

      line = this.normalizeExpressionSyntax(line);

      const arrayFor = line.match(/^for\s*\(\s*([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*)\s*\)\s*\{$/);
      if (arrayFor) {
        const indexName = `__kotlin_i${rangeCounter++}`;
        output.push(`for (int ${indexName} = 0; ${indexName} < sizeof(${arrayFor[2]}) / sizeof(${arrayFor[2]}[0]); ${indexName} = ${indexName} + 1) {`);
        output.push(`auto ${arrayFor[1]} = ${arrayFor[2]}[${indexName}];`);
        continue;
      }

      const numericUntil = line.match(/^for\s*\(\s*([A-Za-z_]\w*)\s+in\s+(.+?)\s+until\s+(.+?)\s*\)\s*\{$/);
      if (numericUntil) {
        const [, name, start, end] = numericUntil;
        output.push(`for (int ${name} = ${start.trim()}; ${name} < ${end.trim()}; ${name} = ${name} + 1) {`);
        continue;
      }

      const numericRange = line.match(/^for\s*\(\s*([A-Za-z_]\w*)\s+in\s+(.+?)\s*\.\.\s*(.+?)\s*\)\s*\{$/);
      if (numericRange) {
        const [, name, start, end] = numericRange;
        output.push(`for (int ${name} = ${start.trim()}; ${name} <= ${end.trim()}; ${name} = ${name} + 1) {`);
        continue;
      }

      line = this.normalizeVariableLine(line);
      line = this.normalizeDataClassCall(line);

      if (this.needsSemicolon(line)) {
        line += ";";
      }
      output.push(line);
    }

    return output.join("\n");
  }

  normalizeDataClassLine(line) {
    const match = line.match(/^data\s+class\s+([A-Za-z_]\w*)\s*\((.*)\)$/);
    if (!match) return null;
    const [, name, params] = match;
    const fields = this.splitArgs(params).map((part) => {
      const field = part.trim().match(/^(?:val|var)\s+([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)$/);
      if (!field) unsupported(`data class field syntax: ${part.trim()}`);
      return { name: field[1], type: this.mapType(field[2]) };
    });
    this.dataClassFields.set(name, fields.map((field) => field.name));
    return [
      `struct ${name} {`,
      ...fields.map((field) => `${field.type} ${field.name};`),
      "};"
    ];
  }

  normalizeFunctionLine(line) {
    const match = line.match(/^fun\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?::\s*([A-Za-z_]\w*))?\s*\{$/);
    if (!match) return null;
    const [, name, params, returnType] = match;
    const normalizedReturn = name === "main" ? "int" : this.mapType(returnType || "Unit");
    return `${normalizedReturn} ${name}(${this.normalizeParameters(params)}) {`;
  }

  normalizeParameters(params) {
    const trimmed = params.trim();
    if (!trimmed) return "void";
    return this.splitArgs(trimmed).map((part) => {
      const match = part.match(/^([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)$/);
      if (!match) unsupported(`parameter syntax: ${part}`);
      return `${this.mapType(match[2])} ${match[1]}`;
    }).join(", ");
  }

  normalizeExpressionSyntax(line) {
    return line
      .replace(/\bprintln\s*\(/g, "puts(")
      .replace(/\bMath\s*\.\s*([A-Za-z_]\w*)\s*\(/g, "math.$1(")
      .replace(/\b([A-Za-z_]\w*)\.size\b/g, "strlen($1)")
      .replace(/\b([A-Za-z_]\w*)\.length\b/g, "strlen($1)");
  }

  normalizeVariableLine(line) {
    let match = line.match(/^(?:val|var)\s+([A-Za-z_]\w*)\s*=\s*intArrayOf\s*\((.*)\)$/);
    if (match) return `int ${match[1]}[] = {${match[2]}}`;

    match = line.match(/^(?:val|var)\s+([A-Za-z_]\w*)\s*=\s*doubleArrayOf\s*\((.*)\)$/);
    if (match) return `double ${match[1]}[] = {${match[2]}}`;

    match = line.match(/^(?:val|var)\s+([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*\((.*)\)$/);
    if (match && this.dataClassFields.has(match[2])) {
      return `${match[2]} ${match[1]} = {${match[3]}}`;
    }

    match = line.match(/^(?:val|var)\s+([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (match) return `${this.mapType(match[2])} ${match[1]} = ${match[3]}`;

    match = line.match(/^(?:val|var)\s+([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (match) return `auto ${match[1]} = ${match[2]}`;

    return line;
  }

  normalizeDataClassCall(line) {
    return line.replace(/\b([A-Za-z_]\w*)\s*\(([^()]*)\)/g, (match, name, args) => {
      if (!this.dataClassFields.has(name)) return match;
      return `{${args}}`;
    });
  }

  splitArgs(value) {
    const args = [];
    let current = "";
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (const char of value) {
      if (quote) {
        current += char;
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

  needsSemicolon(line) {
    return !line.endsWith(";") &&
      line !== "}" &&
      !line.endsWith("{") &&
      !/^(if|for|while)\b/.test(line) &&
      line !== "else";
  }

  mapType(typeName) {
    return TYPE_MAP.get(typeName) || typeName || "void";
  }
}

module.exports = {
  KotlinToIRCompiler
};
