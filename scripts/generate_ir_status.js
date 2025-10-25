#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { parseAndLower } = require("../src/ir/pipeline");
const { validateIR } = require("../src/ir/validator");

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function main() {
  const sample = `
export function add(a, b) {
  const result = a + b;
  return result;
}
`;

  let statusMd = `# Canonical IR Status\n\n`;
  try {
    const ir = parseAndLower(sample, { sourcePath: "sample_add.js" });
    const res = validateIR(ir);
    if (!res.ok) {
      statusMd += `❌ Validation failed with ${res.errors.length} error(s):\n\n`;
      statusMd += res.errors.map(e => `- ${e}`).join("\n");
    } else {
      const nodes = ir.nodes ? Object.keys(ir.nodes).length : 0;
      const cfgCount = ir.controlFlowGraphs ? Object.keys(ir.controlFlowGraphs).length : 0;
      statusMd += `✅ Validation passed\n\n`;
      statusMd += `- Nodes: ${nodes}\n`;
      statusMd += `- CFGs: ${cfgCount}\n`;
      statusMd += `- Module ID: ${ir.module && ir.module.id}\n`;
    }
  } catch (err) {
    statusMd += `💥 Exception during IR validation: ${err && err.message}`;
  }

  const out = path.join(process.cwd(), "reports", "canonical_ir_status.md");
  write(out, statusMd + "\n");
  console.log(`IR status written to ${out}`);
}

main();
