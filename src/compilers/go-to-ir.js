"use strict";

/**
 * Go V0.25 source-to-canonical-IR compiler.
 *
 * This is a narrow Go bridge for beta readiness. It normalizes a small,
 * executable Go subset into the shared C-like frontend, then relies on the
 * existing canonical IR emitters. Native Go execution is intentionally kept as
 * a separate setup-dependent lane.
 */

const { CLikeToIRCompiler } = require("./c-like-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Go input feature: ${feature}`);
}

const TYPE_MAP = new Map([
  ["int", "int"],
  ["float64", "double"],
  ["float32", "float"],
  ["string", "char*"],
  ["bool", "bool"],
  ["void", "void"]
]);

class GoToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToCLike(source);
    const compiler = new CLikeToIRCompiler({ language: "go", languageLabel: "Go" });
    const program = compiler.compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "go",
      goNativeExecution: "setup-dependent"
    };
    return program;
  }

  validateSource(source) {
    const importNames = this.extractImports(source);
    const unsupportedImports = importNames.filter((name) => !["fmt", "math"].includes(name));
    if (unsupportedImports.length > 0) unsupported(`imports outside fmt/math: ${unsupportedImports.join(", ")}`);

    const checks = [
      [/\bgo\s+[A-Za-z_]/, "goroutines"],
      [/\bchan\b|<-/, "channels"],
      [/\bdefer\b/, "defer"],
      [/\bselect\b/, "select"],
      [/\binterface\s*\{/, "interfaces"],
      [/\bmap\s*\[/, "maps"],
      [/\bfunc\s*\(/, "methods/closures"],
      [/\bpanic\s*\(/, "panic/recover"],
      [/\brecover\s*\(/, "panic/recover"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(source)) unsupported(feature);
    }
  }

  extractImports(source) {
    const imports = [];
    for (const match of source.matchAll(/\bimport\s+"([^"]+)"/g)) {
      imports.push(match[1]);
    }
    const blockMatch = source.match(/\bimport\s*\(([\s\S]*?)\)/);
    if (blockMatch) {
      for (const match of blockMatch[1].matchAll(/"([^"]+)"/g)) {
        imports.push(match[1]);
      }
    }
    return imports;
  }

  normalizeToCLike(source) {
    let cleaned = source
      .replace(/^\s*package\s+[A-Za-z_][\w]*\s*$/gm, "")
      .replace(/\bimport\s*\([\s\S]*?\)/g, "")
      .replace(/^\s*import\s+"[^"]+"\s*$/gm, "")
      .replace(/\bfmt\s*\.\s*Println\s*\(/g, "puts(")
      .replace(/\bmath\s*\.\s*([A-Z][A-Za-z0-9_]*)\s*\(/g, (_match, name) => `math.${name[0].toLowerCase()}${name.slice(1)}(`)
      .replace(/\blen\s*\(/g, "strlen(");

    const output = [];
    let rangeCounter = 0;
    let inStruct = false;

    for (const rawLine of cleaned.split(/\r?\n/)) {
      let line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("//")) {
        output.push(line);
        continue;
      }

      const structStart = line.match(/^type\s+([A-Za-z_]\w*)\s+struct\s*\{$/);
      if (structStart) {
        output.push(`struct ${structStart[1]} {`);
        inStruct = true;
        continue;
      }

      if (inStruct) {
        if (line === "}") {
          output.push("};");
          inStruct = false;
          continue;
        }
        const field = line.match(/^([A-Za-z_]\w*)\s+([A-Za-z_]\w*)$/);
        if (!field) unsupported(`struct field syntax: ${line}`);
        output.push(`${this.mapType(field[2])} ${field[1]};`);
        continue;
      }

      const funcLine = this.normalizeFunctionLine(line);
      if (funcLine) {
        output.push(funcLine);
        continue;
      }

      const rangeLine = line.match(/^for\s+(?:_\s*,\s*)?([A-Za-z_]\w*)\s*:=\s*range\s+([A-Za-z_]\w*)\s*\{$/);
      if (rangeLine) {
        const indexName = `__go_i${rangeCounter++}`;
        output.push(`for (int ${indexName} = 0; ${indexName} < sizeof(${rangeLine[2]}) / sizeof(${rangeLine[2]}[0]); ${indexName} = ${indexName} + 1) {`);
        output.push(`auto ${rangeLine[1]} = ${rangeLine[2]}[${indexName}];`);
        continue;
      }

      line = this.normalizeControlLine(line);
      line = this.normalizeDeclarationLine(line);
      line = this.normalizeShortDeclaration(line);
      line = this.normalizeStructLiteral(line);

      if (this.needsSemicolon(line)) {
        line += ";";
      }
      output.push(line);
    }

    return output.join("\n");
  }

  normalizeFunctionLine(line) {
    const match = line.match(/^func\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*([A-Za-z_]\w*)?\s*\{$/);
    if (!match) return null;
    const [, name, params, returnType] = match;
    const normalizedReturn = name === "main" ? "int" : this.mapType(returnType || "void");
    return `${normalizedReturn} ${name}(${this.normalizeParameters(params)}) {`;
  }

  normalizeParameters(params) {
    const trimmed = params.trim();
    if (!trimmed) return "void";
    return trimmed.split(",").map((part) => {
      const pieces = part.trim().split(/\s+/);
      if (pieces.length !== 2) unsupported(`parameter syntax: ${part.trim()}`);
      return `${this.mapType(pieces[1])} ${pieces[0]}`;
    }).join(", ");
  }

  normalizeControlLine(line) {
    let match = line.match(/^if\s+(.+)\s*\{$/);
    if (match) return `if (${match[1]}) {`;
    match = line.match(/^\}\s*else\s+if\s+(.+)\s*\{$/);
    if (match) return `} else if (${match[1]}) {`;
    match = line.match(/^for\s+([A-Za-z_]\w*)\s*:=\s*([^;]+);\s*([^;]+);\s*([^{}]+)\s*\{$/);
    if (match) return `for (int ${match[1]} = ${match[2].trim()}; ${match[3].trim()}; ${match[4].trim()}) {`;
    match = line.match(/^for\s+(.+)\s*\{$/);
    if (match) return `while (${match[1]}) {`;
    return line;
  }

  normalizeDeclarationLine(line) {
    let match = line.match(/^var\s+([A-Za-z_]\w*)\s+\[\]([A-Za-z_]\w*)\s*=\s*\[\]\2\s*\{(.*)\}$/);
    if (match) return `${this.mapType(match[2])} ${match[1]}[] = {${match[3]}}`;

    match = line.match(/^var\s+([A-Za-z_]\w*)\s+([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (match) return `${this.mapType(match[2])} ${match[1]} = ${match[3]}`;

    match = line.match(/^var\s+([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (match) return `auto ${match[1]} = ${match[2]}`;

    return line;
  }

  normalizeShortDeclaration(line) {
    let match = line.match(/^([A-Za-z_]\w*)\s*:=\s*\[\]([A-Za-z_]\w*)\s*\{(.*)\}$/);
    if (match) return `${this.mapType(match[2])} ${match[1]}[] = {${match[3]}}`;

    match = line.match(/^([A-Za-z_]\w*)\s*:=\s*([A-Za-z_]\w*)\s*\{(.*)\}$/);
    if (match) return `${match[2]} ${match[1]} = {${match[3]}}`;

    match = line.match(/^([A-Za-z_]\w*)\s*:=\s*(.+)$/);
    if (match) return `auto ${match[1]} = ${match[2]}`;

    return line;
  }

  normalizeStructLiteral(line) {
    return line.replace(/\b([A-Za-z_]\w*)\s*\{([^{}]*)\}/g, "{$2}");
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
  GoToIRCompiler
};
