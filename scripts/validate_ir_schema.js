#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const { IRBuilder } = require("../src/ir/builder");

function readJson(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return JSON.parse(text);
}

function loadSchema() {
  const schemaPath = path.join(__dirname, "..", "docs", "canonical_ir.schema.json");
  return readJson(schemaPath);
}

function main() {
  const args = process.argv.slice(2);
  const schema = loadSchema();

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  let ir;
  if (args[0]) {
    const filePath = path.resolve(process.cwd(), args[0]);
    ir = readJson(filePath);
  } else {
    // Generate a small IR via IRBuilder as a smoke check (decoupled from parser/normalizer)
    const b = new IRBuilder({ schemaVersion: "1.0.0", metadata: { authoredBy: "schema-validator" } });
    const a = b.identifier("a");
    const bParam = b.identifier("b");
    const sum = b.binaryExpression(a.id, "+", bParam.id);
    const ret = b.returnStatement(sum.id);
    const block = b.blockStatement([ret.id]);
    const fn = b.functionDeclaration("add", [a.id, bParam.id], block.id, { meta: {} });
    // pushToBody happened in functionDeclaration; we can finalize
    ir = b.build({ validate: false });
  }

  const ok = validate(ir);
  if (!ok) {
    console.error("Schema validation failed with", validate.errors.length, "error(s):");
    for (const err of validate.errors) {
      console.error("-", err.instancePath || "/", err.message, JSON.stringify(err.params || {}));
    }
    process.exitCode = 1;
    return;
  }

  console.log("Schema validation passed.");
}

main();
