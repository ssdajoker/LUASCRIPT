/**
 * Property-based fuzz coverage using fast-check.
 * Generates random JavaScript snippets, lowers to IR, validates, and ensures deterministic emission.
 */

const assert = require('assert');
const fc = require('fast-check');
const { parseAndLower } = require('../../src/ir/pipeline');
const { validateIR } = require('../../src/ir/validator');
const { emitLuaFromIR } = require('../../src/ir/emitter');

const defaultRuns = Number(process.env.FUZZ_RUNS || 40);

function identifierArb() {
  return fc.stringOf(fc.char().filter((c) => /[a-zA-Z_]/.test(c)), { minLength: 1, maxLength: 6 });
}

function literalArb() {
  return fc.oneof(
    fc.integer({ min: -1000, max: 1000 }),
    fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
    fc.boolean(),
    fc.string({ maxLength: 8 }).map((s) => JSON.stringify(s))
  );
}

function binaryExpressionArb() {
  const opArb = fc.constantFrom('+', '-', '*', '/', '%');
  return fc.tuple(identifierArb(), opArb, literalArb()).map(([id, op, lit]) => `${id} ${op} ${lit}`);
}

function varStatementArb() {
  return fc.tuple(fc.constantFrom('const', 'let', 'var'), identifierArb(), literalArb()).map(
    ([kind, id, lit]) => `${kind} ${id} = ${lit};`
  );
}

function functionArb() {
  return fc
    .tuple(identifierArb(), identifierArb(), binaryExpressionArb())
    .map(([name, param, expression]) => `function ${name}(${param}) { return ${expression}; }`);
}

function asyncArb() {
  return fc
    .tuple(identifierArb(), literalArb())
    .map(([fn, lit]) => `async function ${fn}() { const value = ${lit}; return value; }`);
}

function programFrom(statements) {
  return statements.join('\n');
}

function runProperty(name, property) {
  try {
    fc.assert(property, { numRuns: defaultRuns });
    console.log(`  PASS ${name}`);
  } catch (error) {
    console.log(`  FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

console.log('\nProperty-Based Fuzz Suite (fast-check)\n');

// Var declarations and simple arithmetic expressions should lower and validate.
runProperty(
  'variable declarations lower and validate',
  fc.property(
    fc.array(varStatementArb(), { minLength: 1, maxLength: 6 }),
    (statements) => {
      const source = programFrom(statements);
      const ir = parseAndLower(source);
      const validation = validateIR(ir);
      assert.strictEqual(validation.ok, true);
      assert.ok(Object.keys(ir.nodes || {}).length > 0);
    }
  )
);

// Function bodies using random arithmetic should emit deterministically.
runProperty(
  'functions emit deterministically',
  fc.property(fc.array(functionArb(), { minLength: 1, maxLength: 4 }), (functions) => {
    const source = programFrom(functions);
    const irA = parseAndLower(source);
    const irB = parseAndLower(source);
    assert.strictEqual(validateIR(irA).ok, true);
    assert.strictEqual(validateIR(irB).ok, true);
    const emittedA = emitLuaFromIR(irA);
    const emittedB = emitLuaFromIR(irB);
    assert.strictEqual(emittedA, emittedB);
  })
);

// Mixed declarations plus inline expressions.
runProperty(
  'mixed declarations stay within emitter coverage',
  fc.property(
    fc.array(fc.oneof(varStatementArb(), functionArb(), binaryExpressionArb().map((expr) => `${expr};`)), {
      minLength: 2,
      maxLength: 8,
    }),
    (statements) => {
      const source = programFrom(statements);
      const ir = parseAndLower(source);
      const emitted = emitLuaFromIR(ir);
      assert.ok(emitted.length > 0, 'Emitter returned empty output');
    }
  )
);

// Async wrappers should still validate even when combined with sync code.
runProperty(
  'async wrappers validate',
  fc.property(
    fc.array(fc.oneof(asyncArb(), varStatementArb()), { minLength: 1, maxLength: 4 }),
    (statements) => {
      const source = programFrom(statements);
      const ir = parseAndLower(source);
      const validation = validateIR(ir);
      assert.strictEqual(validation.ok, true);
    }
  )
);

// Simple control flow with generated guards.
runProperty(
  'generated guards survive lowering',
  fc.property(
    fc.array(identifierArb(), { minLength: 1, maxLength: 3 }),
    fc.integer({ min: 1, max: 5 }),
    (ids, limit) => {
      const guards = ids.map((id, idx) => `if (${id} > ${idx}) { ${id} = ${idx}; }`).join('\n');
      const loop = `for (let i = 0; i < ${limit}; i++) { ${guards} }`;
      const source = `${ids.map((id) => `let ${id} = ${limit};`).join('\n')}\n${loop}`;
      const ir = parseAndLower(source);
      assert.strictEqual(validateIR(ir).ok, true);
      assert.ok(Object.keys(ir.nodes || {}).length > 0);
    }
  )
);

console.log(`\nConfigured runs per property: ${defaultRuns}`);
