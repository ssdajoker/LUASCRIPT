"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { validateIR } = require("../../src/ir/validator");
const path = require("path");
const fs = require("fs");
const Ajv = require("ajv");

// A simple JS sample covering function + block + binary
const sample = `
function f(a, b) {
  const x = a + b;
  return x;
}
`;

(function run() {
  const ir = parseAndLower(sample, { sourcePath: "normalizer_smoke.js" });
  // Invariants
  const result = validateIR(ir);
  if (!result.ok) {
    console.error("Normalizer smoke validation failed:\n", result.errors.join("\n"));
    process.exit(1);
  }
  // JSON Schema validation
  const schemaPath = path.join(__dirname, "..", "..", "docs", "canonical_ir.schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const ok = validate(ir);
  if (!ok) {
    console.error("AJV schema validation failed:");
    for (const err of validate.errors) {
      console.error("-", err.instancePath || "/", err.message);
    }
    process.exit(1);
  }
  // Minimal shape assertions
  assert(ir && ir.module && Array.isArray(ir.module.body), "IR module body exists");
  console.log("Normalizer smoke test: PASS. Nodes:", Object.keys(ir.nodes || {}).length);
})();
