"use strict";

/**
 * Dart V0.4 source-to-canonical-IR target-runtime bridge.
 *
 * The slice intentionally covers simple top-level Dart functions, locals,
 * list literals, loops, conditionals, boolean flow, break/continue, math calls,
 * and print output. Native Dart execution remains separate because this
 * workspace has no `dart` runtime on PATH.
 */

const { CLikeToIRCompiler } = require("./c-like-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported Dart input feature: ${feature}`);
}

class DartToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const normalized = this.normalizeToCLike(source);
    const compiler = new CLikeToIRCompiler({ language: "dart", languageLabel: "Dart" });
    const program = compiler.compile(normalized);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "dart",
      dartNativeExecution: "setup-blocked"
    };
    return program;
  }

  validateSource(source) {
    const sourceWithoutSupportedListTypes = source.replace(
      /\b(?:final\s+|const\s+)?List\s*<\s*(?:double|int|num)\s*>/g,
      "List"
    );
    const checks = [
      [/\bimport\b|\blibrary\b|\bpart\b|\bexport\b/, "imports/libraries"],
      [/\bclass\b|\bmixin\b|\benum\b|\bextension\b/, "object system"],
      [/\basync\b|\bawait\b|\byield\b/, "async/generators"],
      [/\btry\b|\bcatch\b|\bthrow\b|\brethrow\b/, "exceptions"],
      [/\bswitch\b/, "switch statements"],
      [/\bnew\b/, "object allocation"],
      [/<\s*[A-Za-z_][\w]*(\s*,\s*[A-Za-z_][\w]*)*\s*>/, "generic type arguments"],
      [/\?\?|\?\.|\.\./, "null-safety/cascade operators"],
      [/=>|=\s*\([^)]*\)\s*\{[^}]*\}/, "lambdas/closures"]
    ];

    for (const [pattern, feature] of checks) {
      if (pattern.test(sourceWithoutSupportedListTypes)) unsupported(feature);
    }
  }

  normalizeToCLike(source) {
    let forEachIndex = 0;
    return source
      .replace(/\r\n/g, "\n")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\bString\b/g, "char*")
      .replace(/\bnum\b/g, "double")
      .replace(/\b(?:final\s+|const\s+)?List\s*<\s*(?:double|int|num)\s*>\s+([A-Za-z_]\w*)\s*=\s*\[([^\]]*)\]/g, "double $1[] = {$2}")
      .replace(/\bfinal\s+([A-Za-z_]\w*)\s*=\s*\[([^\]]*)\]/g, "double $1[] = {$2}")
      .replace(/\bconst\s+([A-Za-z_]\w*)\s*=\s*\[([^\]]*)\]/g, "double $1[] = {$2}")
      .replace(/\bvar\s+([A-Za-z_]\w*)\s*=\s*\[([^\]]*)\]/g, "double $1[] = {$2}")
      .replace(/\bfinal\s+([A-Za-z_]\w*)\s*=/g, "double $1 =")
      .replace(/\bconst\s+([A-Za-z_]\w*)\s*=/g, "double $1 =")
      .replace(/\bvar\s+([A-Za-z_]\w*)\s*=/g, "double $1 =")
      .replace(/\bfor\s*\(\s*(?:final|var|int|double|num)\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*)\s*\)\s*\{/g, (_match, itemName, listName) => {
        const indexName = `__dart_i${forEachIndex++}`;
        return `for (double ${indexName} = 0; ${indexName} < sizeof(${listName}) / sizeof(${listName}[0]); ${indexName} += 1) {\ndouble ${itemName} = ${listName}[${indexName}];`;
      })
      .replace(/\bfor\s*\(\s*var\s+/g, "for (double ")
      .replace(/\bprint\s*\(/g, "puts(")
      .replace(/\b([A-Za-z_]\w*)\s*\.\s*length\b/g, "sizeof($1) / sizeof($1[0])");
  }
}

module.exports = {
  DartToIRCompiler
};
