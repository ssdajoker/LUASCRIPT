/**
 * IR Consolidation Equivalence Test
 *
 * Builds a small IR twice using different method names/paths and verifies
 * validation and basic structural parity (ignoring IDs).
 */
/* eslint-disable no-unused-vars */

const assert = require('assert');
const { IRBuilder: Builder } = require('../../src/ir/builder');
const { validateIR } = require('../../src/ir/validator');

function normalize(ir) {
  // Drop IDs, keep kinds and basic shapes for comparison
  const norm = {
    schemaVersion: ir.schemaVersion,
    module: { bodyLen: (ir.module.body || []).length },
    kinds: []
  };
  Object.values(ir.nodes || {}).forEach(n => {
    norm.kinds.push(n.kind);
  });
  norm.kinds.sort();
  return norm;
}

function buildVariantA() {
  const b = new Builder();
  const x = b.identifier('x');
  const one = b.literal(1);
  const init = b.assignmentExpression(x.id, '=', one.id);
    const decl = b.varDecl('x', b.literal(1), null, { kind: 'let' });
    const vdecl = b.variableDeclaration([decl], { declarationKind: 'let' });
  b.pushToBody(decl);
  return b.build({ validate: true });
}

function buildVariantB() {
  const b = new Builder();
  const x = b.identifier('x');
  const one = b.literal(1);
  const init = b.assignmentExpression(x.id, '=', one.id);
    const decl = b.varDecl('x', b.literal(1), null, { kind: 'const' });
    const vdecl = b.variableDeclaration([decl], { kind: 'const' });
  b.pushToBody(decl);
  return b.build({ validate: true });
}

function main() {
  const irA = buildVariantA();
  const irB = buildVariantB();

  assert.ok(validateIR(irA).ok, 'Variant A IR should validate');
  const valB = validateIR(irB);
  if (!valB.ok) {
    console.error('Variant B validation errors:\n' + valB.errors.join('\n'));
  }
  assert.ok(valB.ok, 'Variant B IR should validate');

  const na = normalize(irA);
  const nb = normalize(irB);

  assert.strictEqual(na.module.bodyLen, nb.module.bodyLen, 'Module body length should match');
  assert.deepStrictEqual(na.kinds, nb.kinds, 'Node kinds set should match');

  console.log('✅ IR consolidation equivalence holds for sample program');
}

main();
