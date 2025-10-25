#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { parseAndLower } = require("../src/ir/pipeline");
const { validateIR } = require("../src/ir/validator");

function usage() {
  console.log("Usage: node scripts/generate_golden_from_js.js <name> [jsFile|-]\n\n" +
              "- <name>: output file name (without .json) under tests/golden_ir\n" +
              "- [jsFile|-]: path to JS sample file. If '-' or omitted, read from stdin.\n");
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

async function main() {
  const [, , name, jsFile] = process.argv;
  if (!name) {
    usage();
    process.exit(2);
  }

  let source = "";
  if (!jsFile || jsFile === "-") {
    source = await readStdin();
  } else {
    source = fs.readFileSync(jsFile, "utf8");
  }

  if (!source.trim()) {
    console.error("No source provided");
    process.exit(2);
  }

  const ir = parseAndLower(source, { sourcePath: jsFile || `${name}.js` });

  const result = validateIR(ir);
  if (!result.ok) {
    console.error("IR validation failed:\n" + result.errors.join("\n"));
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "tests", "golden_ir");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(ir, null, 2));
  console.log(`Wrote golden: ${outFile}`);
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
