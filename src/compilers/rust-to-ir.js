"use strict";

/**
 * Rust V0.25 source-to-canonical-IR compiler.
 *
 * This is a narrow target-runtime bridge for beta readiness. It normalizes a
 * small executable Rust-like slice into the shared C-like frontend, then relies
 * on the existing canonical IR emitters. Native Rust execution remains a
 * setup-dependent lane until rustc is available and strict native fixtures pass.
 */

const { CLikeToIRCompiler } = require("./c-like-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Rust input feature: ${feature}`);
}

const TYPE_MAP = new Map([
  ["i8", "int"],
  ["i16", "int"],
  ["i32", "int"],
  ["i64", "long"],
  ["isize", "int"],
  ["u8", "int"],
  ["u16", "int"],
  ["u32", "int"],
  ["u64", "long"],
  ["usize", "int"],
  ["f32", "float"],
  ["f64", "double"],
  ["bool", "bool"],
  ["String", "char*"],
  ["&str", "char*"],
  ["str", "char*"],
  ["()", "void"]
]);

class RustToIRCompiler {
  constructor() {
    this.structFields = new Map();
    this.currentStruct = null;
  }

  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToCLike(source);
    const compiler = new CLikeToIRCompiler({ language: "rust", languageLabel: "Rust" });
    const program = compiler.compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "rust",
      rustNativeExecution: "setup-dependent"
    };
    return program;
  }

  validateSource(source) {
    const checks = [
      [/^\s*use\s+/m, "use/imports"],
      [/\btrait\s+[A-Za-z_]/, "traits"],
      [/\bimpl\b/, "impl blocks"],
      [/\benum\s+[A-Za-z_]/, "enums"],
      [/\bmatch\s+/, "match expressions"],
      [/\basync\b|\bawait\b/, "async/await"],
      [/\bunsafe\b/, "unsafe blocks"],
      [/\bloop\s*\{/, "loop expressions"],
      [/\bVec\s*</, "Vec"],
      [/\bOption\s*</, "Option"],
      [/\bResult\s*</, "Result"],
      [/\bmod\s+[A-Za-z_]/, "modules"],
      [/\bpub\s+/, "visibility modifiers"],
      [/\bmacro_rules!\b/, "macros"],
      [/\|[^|]*\|/, "closures"],
      [/[A-Za-z_]\w*!\s*\(/, "macros other than println!"],
      [/(^|[^&])&(?:mut\s+)?[A-Za-z_]/, "borrowing/references"],
      [/<[A-Z][A-Za-z0-9_]*(?:\s*,\s*[A-Z][A-Za-z0-9_]*)*>/, "generics"],
      [/\?[;\s)\]}]/, "question-mark error propagation"],
      [/'[A-Za-z_]\w*/, "lifetimes"]
    ];

    const withoutPrintln = source.replace(/\bprintln!\s*\(/g, "println(");
    for (const [pattern, feature] of checks) {
      if (pattern.test(withoutPrintln)) unsupported(feature);
    }
  }

  normalizeToCLike(source) {
    this.structFields = new Map();
    this.currentStruct = null;

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

      const structLine = this.normalizeStructLine(line);
      if (structLine) {
        output.push(structLine);
        continue;
      }

      if (this.currentStruct) {
        const fieldLine = this.normalizeStructField(line);
        output.push(fieldLine);
        continue;
      }

      const functionLine = this.normalizeFunctionLine(line);
      if (functionLine) {
        output.push(functionLine);
        continue;
      }

      const printLine = this.normalizePrintLine(line);
      if (printLine) {
        output.push(`${printLine};`);
        continue;
      }

      const arrayRange = line.match(/^for\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*)\s*\{$/);
      if (arrayRange) {
        const indexName = `__rust_i${rangeCounter++}`;
        output.push(`for (int ${indexName} = 0; ${indexName} < sizeof(${arrayRange[2]}) / sizeof(${arrayRange[2]}[0]); ${indexName} = ${indexName} + 1) {`);
        output.push(`auto ${arrayRange[1]} = ${arrayRange[2]}[${indexName}];`);
        continue;
      }

      const numericRange = line.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+?)\s*\.\.(=)?\s*(.+?)\s*\{$/);
      if (numericRange) {
        const [, name, start, inclusive, end] = numericRange;
        const operator = inclusive ? "<=" : "<";
        output.push(`for (int ${name} = ${start.trim()}; ${name} ${operator} ${end.trim()}; ${name} = ${name} + 1) {`);
        continue;
      }

      line = this.normalizeExpressionSyntax(line);
      line = this.normalizeControlLine(line);
      line = this.normalizeLetLine(line);
      line = this.normalizeStructLiteral(line);

      if (this.needsSemicolon(line)) {
        line += ";";
      }
      output.push(line);
    }

    return output.join("\n");
  }

  normalizeStructLine(line) {
    const start = line.match(/^struct\s+([A-Za-z_]\w*)\s*\{$/);
    if (start) {
      this.currentStruct = start[1];
      this.structFields.set(this.currentStruct, []);
      return `struct ${this.currentStruct} {`;
    }
    return null;
  }

  normalizeStructField(line) {
    if (line === "}") {
      this.currentStruct = null;
      return "};";
    }

    const field = line.match(/^([A-Za-z_]\w*)\s*:\s*([A-Za-z_][\w&]*)\s*,?$/);
    if (!field) unsupported(`struct field syntax: ${line}`);
    const [, name, typeName] = field;
    this.structFields.get(this.currentStruct).push(name);
    return `${this.mapType(typeName)} ${name};`;
  }

  normalizeFunctionLine(line) {
    const match = line.match(/^fn\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*([A-Za-z_][\w&]*|\(\)))?\s*\{$/);
    if (!match) return null;
    const [, name, params, returnType] = match;
    const normalizedReturn = name === "main" ? "int" : this.mapType(returnType || "void");
    return `${normalizedReturn} ${name}(${this.normalizeParameters(params)}) {`;
  }

  normalizeParameters(params) {
    const trimmed = params.trim();
    if (!trimmed) return "void";
    return trimmed.split(",").map((part) => {
      const pieces = part.trim().match(/^([A-Za-z_]\w*)\s*:\s*([A-Za-z_][\w&]*)$/);
      if (!pieces) unsupported(`parameter syntax: ${part.trim()}`);
      return `${this.mapType(pieces[2])} ${pieces[1]}`;
    }).join(", ");
  }

  normalizePrintLine(line) {
    const match = line.match(/^println!\s*\((.*)\)$/);
    if (!match) return null;
    const args = this.splitArgs(match[1]);
    if (args.length === 0 || !/^"/.test(args[0])) {
      unsupported("println! without a literal format string");
    }

    const format = args[0].slice(1, -1);
    const values = args.slice(1);
    const outArgs = [];
    const textParts = format.split(/\{\}/);
    for (let i = 0; i < textParts.length; i++) {
      for (const part of textParts[i].split(/\s+/).filter(Boolean)) {
        outArgs.push(JSON.stringify(part));
      }
      if (i < textParts.length - 1) {
        if (!values[i]) unsupported("println! argument count mismatch");
        outArgs.push(this.normalizeExpressionSyntax(values[i]));
      }
    }
    return `puts(${outArgs.join(", ")})`;
  }

  normalizeExpressionSyntax(line) {
    return line
      .replace(/\b([A-Za-z_]\w*)\.len\(\)/g, "strlen($1)")
      .replace(/\b(\d+(?:\.\d+)?)(?:_f64)?\.sqrt\(\)/g, "math.sqrt($1)");
  }

  normalizeControlLine(line) {
    let match = line.match(/^if\s+(.+)\s*\{$/);
    if (match) return `if (${match[1]}) {`;
    match = line.match(/^\}\s*else\s+if\s+(.+)\s*\{$/);
    if (match) return `} else if (${match[1]}) {`;
    match = line.match(/^while\s+(.+)\s*\{$/);
    if (match) return `while (${match[1]}) {`;
    return line;
  }

  normalizeLetLine(line) {
    let match = line.match(/^let\s+(?:mut\s+)?([A-Za-z_]\w*)\s*(?::\s*\[[A-Za-z_]\w*;\s*\d+\])?\s*=\s*\[(.*)\]$/);
    if (match) return `int ${match[1]}[] = {${match[2]}}`;

    match = line.match(/^let\s+(?:mut\s+)?([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*\{(.+)\}$/);
    if (match && this.structFields.has(match[2])) return `${match[2]} ${match[1]} = ${match[2]} {${match[3]}}`;

    match = line.match(/^let\s+(?:mut\s+)?([A-Za-z_]\w*)\s*:\s*([A-Za-z_][\w&]*)\s*=\s*(.+)$/);
    if (match) return `${this.mapType(match[2])} ${match[1]} = ${match[3]}`;

    match = line.match(/^let\s+(?:mut\s+)?([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (match) return `auto ${match[1]} = ${match[2]}`;

    return line;
  }

  normalizeStructLiteral(line) {
    return line.replace(/\b([A-Za-z_]\w*)\s*\{([^{}]*)\}/g, (match, typeName, body) => {
      if (!this.structFields.has(typeName)) return match;
      const valuesByName = new Map();
      for (const entry of this.splitArgs(body)) {
        const field = entry.match(/^([A-Za-z_]\w*)\s*:\s*(.+)$/);
        if (!field) unsupported(`struct literal syntax: ${entry}`);
        valuesByName.set(field[1], field[2]);
      }
      const orderedValues = this.structFields.get(typeName).map((fieldName) => {
        if (!valuesByName.has(fieldName)) unsupported(`struct literal missing field ${fieldName}`);
        return valuesByName.get(fieldName);
      });
      return `{${orderedValues.join(", ")}}`;
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
    if (!typeName) return "void";
    return TYPE_MAP.get(typeName) || typeName;
  }
}

module.exports = {
  RustToIRCompiler
};
