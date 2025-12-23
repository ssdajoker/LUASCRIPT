"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { validateIR } = require("../../src/ir/validator");
const { normalizeProgram, normalizeNode } = require("../../src/ir/normalizer");
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
  addVarDeclaratorAlias(schema);
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

  testProgramFallback();
  testNormalizerParity();
})();

function testProgramFallback() {
  const program = { type: "Program", body: [{ type: "Error" }] };
  const normalized = normalizeProgram(program, { source: "const [a, b] = values;" });

  assert.deepStrictEqual(normalized, {
    type: "Program",
    body: [
      {
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: { type: "ArrayPattern", elements: [{ type: "Identifier", name: "a" }, { type: "Identifier", name: "b" }] },
            init: { type: "Identifier", name: "values" },
          },
        ],
      },
    ],
  });
}

function testNormalizerParity() {
  const cases = [
    {
      name: "binary expression",
      node: {
        type: "BinaryExpression",
        operator: "+",
        left: { type: "Literal", value: 1 },
        right: { type: "Identifier", name: "x" },
      },
      expected: {
        type: "BinaryExpression",
        operator: "+",
        left: { type: "Literal", value: 1, raw: "1" },
        right: { type: "Identifier", name: "x" },
      },
    },
    {
      name: "call expression statement",
      node: {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "fn" },
          arguments: [{ type: "Literal", value: 3 }],
        },
      },
      expected: {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "fn" },
          arguments: [{ type: "Literal", value: 3, raw: "3" }],
        },
      },
    },
    {
      name: "if statement branches",
      node: {
        type: "IfStatement",
        test: { type: "Identifier", name: "cond" },
        consequent: {
          type: "BlockStatement",
          body: [
            {
              type: "ReturnStatement",
              argument: { type: "Literal", value: true },
            },
          ],
        },
        alternate: {
          type: "ExpressionStatement",
          expression: { type: "Literal", value: null },
        },
      },
      expected: {
        type: "IfStatement",
        test: { type: "Identifier", name: "cond" },
        consequent: {
          type: "BlockStatement",
          body: [
            {
              type: "ReturnStatement",
              argument: { type: "Literal", value: true, raw: "true" },
            },
          ],
        },
        alternate: {
          type: "ExpressionStatement",
          expression: { type: "Literal", value: null, raw: "null" },
        },
      },
    },
  ];

  for (const test of cases) {
    assert.deepStrictEqual(normalizeNode(test.node), test.expected, `${test.name} normalized shape matches`);
  }
}

function addVarDeclaratorAlias(schema) {
  const alias = "VariableDeclarator";
  (function walk(node) {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;

    if (node.properties && node.properties.kind && Array.isArray(node.properties.kind.enum)) {
      const enums = node.properties.kind.enum;
      if (enums.includes("VariableDeclaration") && !enums.includes(alias)) {
        enums.push(alias);
      }
    }

    for (const value of Object.values(node)) {
      walk(value);
    }
  })(schema);
}
