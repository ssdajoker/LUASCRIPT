#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { emitLuaFromIR } = require("../../src/ir/emitter");

function listGoldenFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

function main() {
  const goldenDir = path.join(__dirname, "..", "..", "tests", "golden_ir");
  const files = listGoldenFiles(goldenDir);
  let failures = 0;
  let skipped = 0;

  files.forEach((file) => {
    const ir = JSON.parse(fs.readFileSync(file, "utf8"));
    try {
      // Handle empty modules (no body): treat as successful no-op emission
      if (!ir.module || !Array.isArray(ir.module.body) || ir.module.body.length === 0) {
        console.log(`✅ Emitted ${path.basename(file)} (0 bytes, empty module)`);
        return;
      }
      // Only skip if we find kinds that remain unsupported by emitter
      const unsupportedKinds = new Set([/* currently none after TryStatement support */]);
      const shouldSkip = Object.values(ir.nodes).some((n) => unsupportedKinds.has(n.kind));
      if (shouldSkip) { console.log(`⚠️  Skipping emit for ${path.basename(file)} (unsupported kind)`); skipped++; return; }
      const code = emitLuaFromIR(ir);
      if (typeof code !== "string") {
        throw new Error("Emitter returned non-string code");
      }
      console.log(`✅ Emitted ${path.basename(file)} (${code.length} bytes)`);
    } catch (e) {
      console.error(`❌ Emitter failed for ${path.basename(file)}:`, e.message);
      failures++;
    }
  });

  if (failures > 0) process.exit(1);
  // no strict skip failure: empty modules are treated as success
}

main();
