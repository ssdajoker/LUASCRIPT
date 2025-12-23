"use strict";

const { LuaScriptParser } = require("../phase1_core_parser");
// Fallback types (not strictly required by normalizer once we parse)
// const { MemoryManager } = require("../parser");

const { IRLowerer } = require("./lowerer");
const { normalizeProgram } = require("./normalizer");

function assertStringSource(jsSource) {
  if (typeof jsSource !== "string") {
    throw new Error("parseAndLower expects a JavaScript source string");
  }
}

function captureStage(action) {
  const start = process.hrtime.bigint();
  const result = action();
  const end = process.hrtime.bigint();

  return { result, start, end };
}

function buildLowererOptions(options) {
  const {
    sourcePath = null,
    sourceHash = null,
    directives = [],
    metadata = {},
    toolchain = {},
    schemaVersion = "1.0.0",
    functionMeta = {},
  } = options;
  const validate = options.validate !== false;

  return {
    sourcePath,
    sourceHash,
    directives,
    metadata,
    toolchain: {
      parser: "phase1_core_parser@1.0.0",
      normalizer: "ir-normalizer@1.0.0",
      lowerer: "ir-lowerer@1.0.0",
      ...toolchain,
    },
    schemaVersion,
    validate,
    functionMeta,
  };
}

function attachMetaPerf(ir, timings) {
  const toMs = (a, b) => Number(b - a) / 1e6;
  const nodeCount = ir.nodes ? Object.keys(ir.nodes).length : 0;

  ir.module.metadata = ir.module.metadata || {};
  ir.module.metadata.metaPerf = {
    parseMs: toMs(timings.parse.start, timings.parse.end),
    normalizeMs: toMs(timings.normalize.start, timings.normalize.end),
    lowerMs: toMs(timings.lower.start, timings.lower.end),
    totalMs: toMs(timings.parse.start, timings.lower.end),
    nodeCount,
  };
}

function parseAndLower(jsSource, options = {}) {
  assertStringSource(jsSource);

  const parser = new LuaScriptParser(jsSource, options.parser || {});
  const parseTiming = captureStage(() => parser.parse());

  const normalized = captureStage(() =>
    normalizeProgram(parseTiming.result, { ...(options.normalizer || {}), source: jsSource })
  );

  const lowerer = new IRLowerer(buildLowererOptions(options));
  const lowered = captureStage(() => lowerer.lowerProgram(normalized.result));

  attachMetaPerf(lowered.result, {
    parse: parseTiming,
    normalize: normalized,
    lower: lowered,
  });

  return lowered.result;
}

module.exports = {
  parseAndLower,
};
