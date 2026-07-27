"use strict";

/**
 * PHP V0.4 source-to-canonical-IR target-runtime bridge.
 *
 * This supports a deliberately small PHP function slice with arrays,
 * associative arrays, boolean flow, and break/continue, and executes only
 * emitted targets. Native PHP qualification remains separate because this
 * workspace does not have a `php` runtime on PATH.
 */

const { CLikeToIRCompiler } = require("./c-like-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported PHP input feature: ${feature}`);
}

class PHPToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToCLike(source);
    const compiler = new CLikeToIRCompiler({ language: "php", languageLabel: "PHP" });
    const program = compiler.compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "php",
      phpNativeExecution: "setup-blocked"
    };
    return program;
  }

  validateSource(source) {
    const checks = [
      [/\bnamespace\b|\buse\b|\binclude\b|\brequire\b/, "imports/includes"],
      [/\bclass\b|\btrait\b|\binterface\b/, "object system"],
      [/\basync\b|\bawait\b/, "async"],
      [/\bfunction\s*\(/, "lambdas/closures"],
      [/\btry\b|\bcatch\b|\bthrow\b/, "exceptions"],
      [/\bnew\b/, "object allocation"],
      [/\bforeach\s*\(\s*\[[^\]]*\]\s+as\b/, "foreach over literal arrays"],
      [/\.\s*\$|\$\w+\s*\./, "string concatenation"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(source)) unsupported(feature);
    }
  }

  normalizeToCLike(source) {
    const declared = new Set();
    let foreachIndex = 0;
    const prelude = [];
    let normalized = source
      .replace(/\r\n/g, "\n")
      .replace(/<\?php/g, "")
      .replace(/\?>/g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/#.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\bforeach\s*\(\s*\$([A-Za-z_]\w*)\s+as\s+\$([A-Za-z_]\w*)\s*\)\s*\{/g, (_match, collection, value) => {
        const indexName = `__php_foreach_${foreachIndex++}`;
        declared.add(value);
        return `for (double ${indexName} = 0; ${indexName} < sizeof(${collection}) / sizeof(${collection}[0]); ${indexName} += 1) { double ${value} = ${collection}[${indexName}];`;
      })
      .replace(/\bfunction\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g, (_match, name, params) => {
        const normalizedParams = this.normalizeParameters(params, declared);
        const returnType = name === "main" ? "void" : "double";
        return `${returnType} ${name}(${normalizedParams || "void"})`;
      });

    normalized = normalized.replace(/\$([A-Za-z_]\w*)\s*=\s*\[([^\]]*=>[^\]]*)\]/g, (_match, name, elements) => {
      declared.add(name);
      const assoc = this.parseAssociativeArray(elements, name);
      prelude.push(`struct ${assoc.typeName} {`);
      for (const key of assoc.keys) {
        prelude.push(`  double ${key};`);
      }
      prelude.push("};");
      return `${assoc.typeName} ${name} = {${assoc.values.join(", ")}}`;
    });

    normalized = normalized.replace(/\$([A-Za-z_]\w*)\s*=\s*\[([^\]]*)\]/g, (_match, name, elements) => {
      declared.add(name);
      return `double ${name}[] = {${elements}}`;
    });
    normalized = normalized.replace(/\$([A-Za-z_]\w*)\s*=\s*array\s*\(([^)]*)\)/g, (_match, name, elements) => {
      declared.add(name);
      return `double ${name}[] = {${elements}}`;
    });

    normalized = normalized.replace(/\$([A-Za-z_]\w*)\s*=/g, (_match, name) => {
      if (declared.has(name)) return `${name} =`;
      declared.add(name);
      return `double ${name} =`;
    });

    normalized = normalized
      .replace(/\$([A-Za-z_]\w*)\s*\[\s*["']([A-Za-z_]\w*)["']\s*\]/g, "$1.$2")
      .replace(/\$/g, "")
      .replace(/\bcount\s*\(/g, "sizeof(")
      .replace(/\becho\s+([^;]+);/g, "puts($1);")
      .replace(/\bprint\s+([^;]+);/g, "puts($1);")
      .replace(/\bprint\s*\(/g, "puts(")
      .replace(/\btrue\b/g, "true")
      .replace(/\bfalse\b/g, "false");

    return [...prelude, normalized].join("\n");
  }

  normalizeParameters(params, declared) {
    const trimmed = params.trim();
    if (!trimmed) return "";
    return trimmed.split(",").map((param) => {
      const match = param.trim().match(/^\$([A-Za-z_]\w*)$/);
      if (!match) unsupported(`parameter syntax ${param.trim()}`);
      declared.add(match[1]);
      return `double ${match[1]}`;
    }).join(", ");
  }

  parseAssociativeArray(elements, variableName) {
    const keys = [];
    const values = [];
    for (const entry of this.splitTopLevel(elements, ",")) {
      const arrowIndex = entry.indexOf("=>");
      if (arrowIndex === -1) unsupported(`associative array entry ${entry.trim()}`);
      const key = this.normalizeAssocKey(entry.slice(0, arrowIndex));
      if (keys.includes(key)) unsupported(`duplicate associative array key ${key}`);
      keys.push(key);
      values.push(entry.slice(arrowIndex + 2).trim());
    }
    if (keys.length === 0) unsupported(`empty associative array ${variableName}`);
    return {
      typeName: `__PHPAssoc_${variableName}`,
      keys,
      values
    };
  }

  normalizeAssocKey(rawKey) {
    const key = rawKey.trim();
    const quoted = key.match(/^["']([A-Za-z_]\w*)["']$/);
    if (quoted) return quoted[1];
    unsupported(`associative array key ${key}`);
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
  PHPToIRCompiler
};
