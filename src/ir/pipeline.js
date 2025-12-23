"use strict";

const { LuaScriptParser } = require("../phase1_core_parser");
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
    const t0 = process.hrtime.bigint();
    const parser = new LuaScriptParser(jsSource, options.parser || {});
    const ast = parser.parse();
    const t1 = process.hrtime.bigint();

    const normalized = normalizeProgram(ast, { ...(options.normalizer || {}), source: jsSource });
    const t2 = process.hrtime.bigint();

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
    const t3 = process.hrtime.bigint();
    const ir = lowerer.lowerProgram(normalized);
    const t4 = process.hrtime.bigint();

    // Attach meta.perf metrics as per spec’s guidance
    const toMs = (a, b) => Number(b - a) / 1e6;
    const nodeCount = ir.nodes ? Object.keys(ir.nodes).length : 0;
    ir.module.metadata = ir.module.metadata || {};
    ir.module.metadata.metaPerf = {
        parseMs: toMs(t0, t1),
        normalizeMs: toMs(t1, t2),
        lowerMs: toMs(t3, t4),
        totalMs: toMs(t0, t4),
        nodeCount,
    };

    return ir;
}

module.exports = {
    parseAndLower,
};