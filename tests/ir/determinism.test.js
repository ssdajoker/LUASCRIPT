"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");

function normalizeIr(ir) {
  // Remove volatile fields that are not semantically relevant
  const clone = JSON.parse(JSON.stringify(ir));
  if (clone?.module?.metadata) {
    delete clone.module.metadata.createdAt;
    delete clone.module.metadata.metaPerf; // timings vary run-to-run
  }
  return clone;
}

(function run() {
  const source = `
    function g(a){ if (a) { return a; } let i=0; while(i<10){ i=i+1; } }
    const f = (n) => n * n;
  `;
  const ir1 = parseAndLower(source, { sourcePath: "determinism.js" });
  const ir2 = parseAndLower(source, { sourcePath: "determinism.js" });

  const n1 = normalizeIr(ir1);
  const n2 = normalizeIr(ir2);

  assert.deepStrictEqual(n1, n2, "IR must be byte-identical after normalizing volatile metadata");
  console.log("Determinism test: PASS");
})();
