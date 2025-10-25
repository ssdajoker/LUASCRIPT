#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const { parseAndLower } = require("../src/ir/pipeline");
const { validateIR } = require("../src/ir/validator");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadSchema() {
  const schemaPath = path.join(__dirname, "..", "docs", "canonical_ir.schema.json");
  return readJson(schemaPath);
}

function usage() {
  console.log("Usage: ir <file> [--as ir|js]\n\n" +
    "- If a .json is provided (default --as ir), validates JSON against schema and invariants.\n" +
    "- If a .js is provided (or --as js), runs parseAndLower then validates results.\n");
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    usage();
    return;
  }

  const file = path.resolve(process.cwd(), args[0]);
  const asIdx = args.indexOf("--as");
  let as = null;
  if (asIdx !== -1 && args[asIdx + 1]) {
    as = args[asIdx + 1];
  }

  let ir;
  const schema = loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

  if (!fs.existsSync(file)) {
    console.error("No such file:", file);
    process.exit(1);
  }

  const ext = path.extname(file).toLowerCase();
  const mode = as || (ext === ".json" ? "ir" : ext === ".js" ? "js" : "ir");

  try {
    if (mode === "js") {
      const js = fs.readFileSync(file, "utf8");
      ir = parseAndLower(js, { sourcePath: path.basename(file) });
    } else {
      ir = readJson(file);
    }
  } catch (e) {
    console.error("Error preparing IR:", e.message);
    process.exit(1);
  }

  const okSchema = validateSchema(ir);
  if (!okSchema) {
    console.error("Schema validation failed:");
    validateSchema.errors.forEach((err) => console.error("-", err.instancePath || "/", err.message));
    process.exit(1);
  }

  const inv = validateIR(ir);
  if (!inv.ok) {
    console.error("Invariant validation failed:");
    inv.errors.forEach((e) => console.error("-", e));
    process.exit(1);
  }

  console.log("✅ IR OK");
}

main();
