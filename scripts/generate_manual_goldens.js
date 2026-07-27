"use strict";

const { IRBuilder } = require("../src/ir/builder");
const fs = require("fs");
const path = require("path");

function makeTemplate() {
  const b = new IRBuilder({ schemaVersion: "1.0.0", source: { path: "template_literal.js", hash: null } });
  const name = b.identifier("name", { binding: "name" });
  const msg = b.identifier("msg", { binding: "msg" });
  const q0 = b.literal("hi ", { literalKind: "string", raw: "\"hi \"" });
  const q1 = b.literal("!", { literalKind: "string", raw: "\"!\"" });
  const tmpl = b.templateLiteral([q0.id, q1.id], [name.id]);
  const decl = b.variableDeclaration([b.variableDeclarator(msg.id, tmpl.id, { kind: "const" })], { kind: "const" });
  const ret = b.returnStatement(msg.id);
  const body = b.blockStatement([decl.id, ret.id]);
  b.functionDeclaration("f", [name.id], body.id, { pushToModule: true });
  return b.build();
}

function makeForOf() {
  const b = new IRBuilder({ schemaVersion: "1.0.0", source: { path: "for_of_array.js", hash: null } });
  const arr = b.identifier("arr", { binding: "arr" });
  const s = b.identifier("s", { binding: "s" });
  const zero = b.literal(0, { raw: "0", literalKind: "number" });
  const declS = b.variableDeclaration([b.variableDeclarator(s.id, zero.id, { kind: "let" })], { kind: "let" });
  const v = b.identifier("v", { binding: "v" });
  const sumExpr = b.binaryExpression(s.id, "+", v.id);
  const assign = b.assignmentExpression(s.id, "=", sumExpr.id);
  const assignStmt = b.expressionStatement(assign.id);
  const loopBody = b.blockStatement([assignStmt.id]);
  const forOf = b.forOfStatement(v.id, arr.id, loopBody.id, { leftDeclarationKind: "const" });
  const ret = b.returnStatement(s.id);
  const body = b.blockStatement([declS.id, forOf.id, ret.id]);
  b.functionDeclaration("sum", [arr.id], body.id, { pushToModule: true });
  return b.build();
}

function main() {
  const cases = [
    { name: "template_literal", ir: makeTemplate() },
    { name: "for_of_array", ir: makeForOf() },
  ];

  cases.forEach(({ name, ir }) => {
    const out = path.join(process.cwd(), "tests", "golden_ir", `${name}.json`);
    fs.writeFileSync(out, JSON.stringify(ir, null, 2));
    console.log(`wrote ${out}`);
  });
}

main();
