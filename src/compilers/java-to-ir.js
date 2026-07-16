"use strict";

/**
 * Java V0.4 source-to-canonical-IR compiler.
 *
 * This is a narrow bridge, not a broad Java frontend. It lowers simple static
 * method programs inside one class by normalizing the verified Java slice into
 * the shared C-like parser. The slice includes primitive locals, arrays,
 * indexed reads/writes, loops, conditionals, break/continue, boolean flow,
 * static method calls, math calls, and stdout. Native Java execution is
 * intentionally not claimed here because this workspace has `java` but no
 * usable source compiler layer.
 */

const { CLikeToIRCompiler } = require("./c-like-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Java input feature: ${feature}`);
}

class JavaToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToCLike(source);
    const compiler = new CLikeToIRCompiler({ language: "java", languageLabel: "Java" });
    const program = compiler.compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "java",
      javaNativeExecution: "setup-blocked"
    };
    return program;
  }

  validateSource(source) {
    const classMatches = [...source.matchAll(/\bclass\s+[A-Za-z_][\w]*/g)];
    if (classMatches.length === 0) unsupported("programs without a class declaration");
    if (classMatches.length > 1) unsupported("classes beyond the single top-level container");

    const sourceWithoutAllowedArrayNew = source
      .replace(/\bnew\s+(?:int|double|float|long|short|boolean|String)\s*\[\s*\]\s*\{/g, "{");
    const checks = [
      [/\bpackage\b|\bimport\b/, "imports"],
      [/\binterface\b|\benum\b/, "interfaces/enums"],
      [/\bextends\b|\bimplements\b/, "inheritance"],
      [/\btry\b|\bcatch\b|\bthrow\b/, "exceptions"],
      [/->/, "lambdas"],
      [/@[A-Za-z_]/, "annotations"],
      [/<\s*[A-Za-z_][\w]*(\s*,\s*[A-Za-z_][\w]*)*\s*>/, "generics"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(source)) unsupported(feature);
    }
    if (/\bnew\b/.test(sourceWithoutAllowedArrayNew)) unsupported("object allocation");
  }

  normalizeToCLike(source) {
    const body = this.extractClassBody(source);
    let loopCounter = 0;
    return body
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\b(public|private|protected|static|final)\b\s*/g, "")
      .replace(/\bString\s*\[\]\s+args\b/g, "void")
      .replace(/\bboolean\b/g, "bool")
      .replace(/\bString\b/g, "char*")
      .replace(/\b(int|double|float|long|short|bool|char\*)\s*\[\s*\]\s+([A-Za-z_]\w*)/g, "$1 $2[]")
      .replace(/=\s*new\s+(?:int|double|float|long|short|bool|char\*)\s*\[\s*\]\s*\{/g, "= {")
      .replace(/\bfor\s*\(\s*(int|double|float|long|short)\s+([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)\s*\)\s*\{/g, (_match, type, itemName, arrayName) => {
        const indexName = `__java_i${loopCounter++}`;
        return `for (int ${indexName} = 0; ${indexName} < sizeof(${arrayName}) / sizeof(${arrayName}[0]); ${indexName} = ${indexName} + 1) {\n${type} ${itemName} = ${arrayName}[${indexName}];`;
      })
      .replace(/\b([A-Za-z_]\w*)\s*\.\s*length\s*\(\s*\)/g, "strlen($1)")
      .replace(/\b([A-Za-z_]\w*)\s*\.\s*charAt\s*\(([^)]*)\)/g, "$1[$2]")
      .replace(/\b([A-Za-z_]\w*)\s*\.\s*length\b/g, "sizeof($1) / sizeof($1[0])")
      .replace(/\bSystem\s*\.\s*out\s*\.\s*println\s*\(/g, "puts(")
      .replace(/\bMath\s*\./g, "math.");
  }

  extractClassBody(source) {
    const classMatch = /\bclass\s+[A-Za-z_][\w]*\s*\{/.exec(source);
    if (!classMatch) unsupported("programs without a class declaration");
    const openIndex = source.indexOf("{", classMatch.index);
    const closeIndex = this.findMatchingBrace(source, openIndex);
    return source.slice(openIndex + 1, closeIndex);
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

    unsupported("unterminated class body");
  }
}

module.exports = {
  JavaToIRCompiler
};
