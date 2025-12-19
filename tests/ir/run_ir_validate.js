"use strict";

const { parseAndLower } = require("../../src/ir/pipeline");
const { validateIR } = require("../../src/ir/validator");

const sample = `
function add(a, b) {
  const result = a + b;
  return result;
}

const square = (n) => n * n;
`;

const ir = parseAndLower(sample, {
  sourcePath: "validate_sample.js",
  metadata: { authoredBy: "ir-validate" },
});

const result = validateIR(ir);
if (!result.ok) {
  console.error("IR validation failed:\n", result.errors.join("\n"));
  process.exitCode = 1;
} else {
  const cfgs = ir.module.metadata.controlFlowGraphs || {};
  console.log("IR validation successful. CFG count:", Object.keys(cfgs).length);
}
