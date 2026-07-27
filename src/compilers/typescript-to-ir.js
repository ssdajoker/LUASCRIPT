"use strict";

/**
 * TypeScript V0.25 source-to-canonical-IR compiler.
 *
 * This is intentionally a typed-JS bridge. It accepts runtime-neutral
 * TypeScript annotations/declarations, erases them through the TypeScript
 * compiler API, then lowers the resulting JavaScript through the verified
 * JavaScript-to-IR path. Unsupported TypeScript features fail explicitly.
 */

const ts = require("typescript");
const { JSToIRCompiler } = require("./js-to-ir");

function unsupported(feature) {
  throw new Error(`Unsupported TypeScript input feature: ${feature}`);
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers && node.modifiers.some((modifier) => modifier.kind === kind));
}

class TypeScriptToIRCompiler {
  compile(source) {
    this.validateSource(source);
    const jsCode = this.transpileToJavaScript(source);
    const program = new JSToIRCompiler().compile(jsCode);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "typescript",
      luascriptMeta: {
        targets: {
          lua: {
            adapters: {
              indexing: "zero_based",
              length: "array_length_property",
              string_coercion: "explicit_tostring",
              truthiness: "js_truthy"
            }
          }
        }
      },
      transpiledJavaScript: jsCode
    };
    return program;
  }

  transpileToJavaScript(source) {
    const result = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None,
        removeComments: true,
        strict: true,
        esModuleInterop: false,
        sourceMap: false,
        inlineSourceMap: false,
        inlineSources: false
      }
    });

    const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length > 0) {
      const message = errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join("; ");
      throw new Error(`TypeScript compilation error: ${message}`);
    }

    return result.outputText
      .replace(/^"use strict";\s*/m, "")
      .replace(/\/\/# sourceMappingURL=.*$/m, "")
      .trim();
  }

  validateSource(source) {
    const sourceFile = ts.createSourceFile("input.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    const visit = (node) => {
      if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) unsupported("imports");
      if (ts.isExportDeclaration(node) || ts.isExportAssignment(node) || hasModifier(node, ts.SyntaxKind.ExportKeyword)) {
        unsupported("exports");
      }
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) unsupported("classes");
      if (ts.isEnumDeclaration(node)) unsupported("enums");
      if (ts.isModuleDeclaration(node)) unsupported("namespaces");
      if (node.kind === ts.SyntaxKind.Decorator) unsupported("decorators");
      if (ts.isTryStatement(node) || ts.isThrowStatement(node)) unsupported("exceptions");
      if (ts.isAwaitExpression(node)) unsupported("async functions");
      if (ts.isForOfStatement(node)) unsupported("for-of loops");
      if (ts.isForInStatement(node)) unsupported("for-in loops");

      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
        if (hasModifier(node, ts.SyntaxKind.AsyncKeyword)) unsupported("async functions");
        if (node.asteriskToken) unsupported("generators");
        if (node.typeParameters && node.typeParameters.length > 0) unsupported("generics");
        for (const parameter of node.parameters || []) {
          if (parameter.dotDotDotToken) unsupported("rest parameters");
          if (parameter.questionToken) unsupported("optional parameters");
        }
      }

      if (ts.isCallExpression(node) && node.typeArguments && node.typeArguments.length > 0) {
        unsupported("generic calls");
      }
      if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.typeParameters && node.typeParameters.length > 0) {
        unsupported("generic type declarations");
      }
      if (ts.isInterfaceDeclaration(node) && node.heritageClauses && node.heritageClauses.length > 0) {
        unsupported("interface inheritance");
      }
      if (ts.isVariableDeclaration(node) && node.exclamationToken) {
        unsupported("definite assignment assertions");
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (/\?\./.test(source)) unsupported("optional chaining");
    if (/\?\?/.test(source)) unsupported("nullish coalescing");
  }
}

module.exports = {
  TypeScriptToIRCompiler
};
