#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const { validateIR } = require("../../src/ir/validator");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadSchema() {
  const schemaPath = path.join(__dirname, "..", "..", "docs", "canonical_ir.schema.json");
  return readJson(schemaPath);
}

function listGoldenFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

function main() {
  const goldenDir = path.join(__dirname);
  const files = listGoldenFiles(goldenDir);
  const schema = loadSchema();

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

  let failures = 0;
  files.forEach((file) => {
    const ir = readJson(file);

    const okSchema = validateSchema(ir);
    if (!okSchema) {
      console.error(`Schema validation failed for ${path.basename(file)}:`);
      for (const err of validateSchema.errors) {
        console.error("-", err.instancePath || "/", err.message);
      }
      failures++;
      return;
    }

    const inv = validateIR(ir);
    if (!inv.ok) {
      console.error(`Invariant validation failed for ${path.basename(file)}:`);
      inv.errors.forEach((e) => console.error("-", e));
      failures++;
      return;
    }

    console.log(`✅ ${path.basename(file)}: OK`);
  });

  if (failures > 0) {
    console.error(`Golden IR check failed: ${failures} file(s) invalid`);
    process.exit(1);
  } else {
    console.log("All golden IR files validated successfully.");
  }
}

main();
