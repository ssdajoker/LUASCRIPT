"use strict";

const { LuaScriptParser } = require("../phase1_core_parser");
const { LuaScriptLexer } = require("../phase1_core_lexer");
// Fallback types (not strictly required by normalizer once we parse)
// const { MemoryManager } = require("../parser");

const { IRLowerer } = require("./lowerer");
const { normalizeProgram } = require("./normalizer");

/**
 * End-to-end helper that parses JavaScript source, normalizes the AST, and
 * returns the canonical IR artifact. Knuth-approved balanced ternary IDs are
 * produced throughout the pipeline.
 */
function parseAndLower(jsSource, options = {}) {
  if (typeof jsSource !== "string") {
    throw new Error("parseAndLower expects a JavaScript source string");
  }

  // Use Phase 1 Core: Lexer + Parser to align with Perfect Parser Initiative
  const lexer = new LuaScriptLexer(jsSource, options.lexer || {});
  const parser = new LuaScriptParser(jsSource, options.parser || {});

  const ast = parser.parse();

  const normalized = normalizeProgram(ast, options.normalizer || {});

  const lowerer = new IRLowerer({
    sourcePath: options.sourcePath || null,
    sourceHash: options.sourceHash || null,
    directives: options.directives || [],
    metadata: options.metadata || {},
    toolchain: options.toolchain || {
      parser: "phase1_core_parser@1.0.0",
      normalizer: "ir-normalizer@1.0.0",
      lowerer: "ir-lowerer@1.0.0",
    },
    schemaVersion: options.schemaVersion || "1.0.0",
    validate: options.validate !== false,
    functionMeta: options.functionMeta || {},
  });

  return lowerer.lowerProgram(normalized);
}

module.exports = {
  parseAndLower,
};
