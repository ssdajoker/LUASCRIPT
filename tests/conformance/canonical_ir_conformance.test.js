"use strict";

const assert = require("assert");
const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { CoreLanguageBridge } = require("../../src/compilers/core-language-bridge");
const {
  repoRoot,
  relativePath,
  environmentMetadata,
  supportMatrixTraceability,
  writeJsonReport,
  manifestEvidence
} = require("./report_utils");

const manifestPath = path.join(__dirname, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const bridge = new CoreLanguageBridge();
const reportPath = path.join(repoRoot, "artifacts", "conformance", "canonical-ir-conformance-report.json");
const startedAt = Date.now();
const runtimeCommandsUsed = [];
const allowedSemanticsStatuses = new Set([
  "aligned-current-slice",
  "profile-repaired",
  "target-native-delta",
  "unsupported-diagnostic"
]);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function describeFixture(fixture, suffix) {
  return `${fixture.name}${suffix ? ` ${suffix}` : ""}`;
}

function assertIncludes(output, expected, fixture, target) {
  assert(
    output.includes(expected),
    `${describeFixture(fixture, `-> ${target}`)} missing expected output snippet:\n${expected}\n\nActual output:\n${output}`
  );
}

function assertTargetOutput(fixture, ir, target, expectations) {
  const emitted = bridge.emitFromIR(deepClone(ir), target, fixture.sourceLanguage);
  assert.strictEqual(typeof emitted, "string", describeFixture(fixture, `-> ${target}`));
  assert(emitted.trim().length > 0, describeFixture(fixture, `-> ${target} emitted non-empty output`));

  for (const expected of expectations.includes || []) {
    assertIncludes(emitted, expected, fixture, target);
  }

  for (const unexpected of expectations.excludes || []) {
    assert(
      !emitted.includes(unexpected),
      `${describeFixture(fixture, `-> ${target}`)} contained unexpected output snippet:\n${unexpected}\n\nActual output:\n${emitted}`
    );
  }
}

function assertUnsupportedTarget(fixture, ir, target, expectations) {
  assert.throws(
    () => bridge.emitFromIR(deepClone(ir), target, fixture.sourceLanguage),
    (error) => {
      const message = error && error.message ? error.message : String(error);
      for (const expected of expectations.messageIncludes || []) {
        assert(
          message.includes(expected),
          `${describeFixture(fixture, `-> ${target}`)} missing expected diagnostic snippet:\n${expected}\n\nActual diagnostic:\n${message}`
        );
      }
      return true;
    },
    describeFixture(fixture, `-> ${target} should fail with a deterministic diagnostic`)
  );
}

function compactOutput(value) {
  return (value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map(line => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

function runtimeCandidates(language) {
  if (language === "javascript") {
    return ["node"];
  }
  if (language === "python") {
    return [process.env.PYTHON, "python3", "python"].filter(Boolean);
  }
  throw new Error(`No conformance runtime runner for ${language}`);
}

function runtimeExtension(language) {
  if (language === "javascript") return "js";
  if (language === "python") return "py";
  throw new Error(`No conformance runtime extension for ${language}`);
}

function runRuntime(language, source, label) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "luascript-conformance-"));
  const sourcePath = path.join(tmpDir, `${label}.${runtimeExtension(language)}`);
  fs.writeFileSync(sourcePath, source, "utf8");

  try {
    const candidates = runtimeCandidates(language);
    const attempts = [];
    for (const command of candidates) {
      const result = childProcess.spawnSync(command, [sourcePath], {
        encoding: "utf8",
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8"
        }
      });
      attempts.push({ command, result });
      if (!result.error || result.error.code !== "ENOENT") {
        return { command, result };
      }
    }

    const attempted = attempts.map(attempt => attempt.command).join(", ");
    throw new Error(`No runtime command found for ${language}; tried ${attempted}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function assertRuntimeCheck(fixture, source, language, expectation, label) {
  const { command, result } = runRuntime(language, source, label.replace(/[^A-Za-z0-9_-]/g, "_"));
  runtimeCommandsUsed.push({
    fixture: fixture.name,
    language,
    label,
    command
  });
  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  assert.strictEqual(
    result.status,
    0,
    `${describeFixture(fixture, label)} ${language} runtime via ${command} failed:\n${combined}`
  );

  assert.strictEqual(
    compactOutput(result.stdout),
    expectation.expectedOutput,
    `${describeFixture(fixture, label)} ${language} runtime output mismatch`
  );
}

function assertRuntimeChecks(fixture, ir) {
  const checks = fixture.runtimeChecks || {};
  if (checks.native) {
    assertRuntimeCheck(
      fixture,
      fixture.source,
      fixture.sourceLanguage,
      checks.native,
      "native"
    );
  }

  for (const [target, expectation] of Object.entries(checks.targets || {})) {
    const emitted = bridge.emitFromIR(deepClone(ir), target, fixture.sourceLanguage);
    assertRuntimeCheck(fixture, emitted, target, expectation, `emitted ${target}`);
  }
}

function assertExpectedFailure(fixture) {
  const expectation = fixture.expectedFailure || {};
  const phase = expectation.phase || "compile";
  assert(
    ["compile", "emit"].includes(phase),
    `${fixture.name} expectedFailure phase must be compile or emit`
  );

  assert.throws(
    () => {
      const ir = bridge.compileToIR(fixture.source, fixture.sourceLanguage);
      if (phase === "emit") {
        const target = expectation.targetLanguage || (manifest.defaultTargets && manifest.defaultTargets[0]);
        bridge.emitFromIR(deepClone(ir), target, fixture.sourceLanguage);
      }
    },
    (error) => {
      const message = error && error.message ? error.message : String(error);
      for (const expected of expectation.messageIncludes || []) {
        assert(
          message.includes(expected),
          `${fixture.name} missing expected diagnostic snippet:\n${expected}\n\nActual diagnostic:\n${message}`
        );
      }
      return true;
    },
    `${fixture.name} should fail with an explicit unsupported diagnostic`
  );
}

function validateFixtureMetadata(fixture) {
  if (fixture.semanticsStatus) {
    assert(
      allowedSemanticsStatuses.has(fixture.semanticsStatus),
      `${fixture.name} has known semanticsStatus`
    );
  }
}

function validateManifest() {
  assert.strictEqual(manifest.status, "scoped-skeleton", "manifest keeps scoped skeleton status");
  assert(Array.isArray(manifest.defaultTargets), "manifest declares defaultTargets");
  for (const target of ["lua", "javascript", "luascript", "python"]) {
    assert(manifest.defaultTargets.includes(target), `manifest defaultTargets includes ${target}`);
  }
  assert(Array.isArray(manifest.fixtures) && manifest.fixtures.length >= 3, "manifest has representative fixtures");
  assert(
    manifest.valueSemanticsMatrix && manifest.valueSemanticsMatrix.status === "scoped",
    "manifest declares scoped valueSemanticsMatrix"
  );
  assert(
    Array.isArray(manifest.valueSemanticsMatrix.comparisonTargets) &&
      ["javascript", "lua", "python", "luascript"].every((target) => manifest.valueSemanticsMatrix.comparisonTargets.includes(target)),
    "valueSemanticsMatrix compares JavaScript, Lua, Python, and .ls"
  );
  assert(
    Array.isArray(manifest.valueSemanticsMatrix.unsupportedAsDiagnostics) &&
      ["undefined", "NaN", "Infinity"].every((value) => manifest.valueSemanticsMatrix.unsupportedAsDiagnostics.includes(value)),
    "valueSemanticsMatrix names unsupported special values"
  );
  assert(
    manifest.controlFlowMatrix && manifest.controlFlowMatrix.status === "scoped",
    "manifest declares scoped controlFlowMatrix"
  );
  assert(
    Array.isArray(manifest.controlFlowMatrix.covered) &&
      ["if-else", "while", "numeric-for", "python-range", "break", "continue", "nested-loops", "short-circuiting", "early-returns", "switch", "conditional-expression", "target-specific-lowering"].every((item) => manifest.controlFlowMatrix.covered.includes(item)),
    "controlFlowMatrix covers required control-flow categories"
  );
  assert(
    Array.isArray(manifest.controlFlowMatrix.unsupportedAsDiagnostics) &&
      ["javascript-for-of", "python-continue-source", "javascript-try-catch"].every((value) => manifest.controlFlowMatrix.unsupportedAsDiagnostics.includes(value)),
    "controlFlowMatrix names unsupported control-flow diagnostics"
  );
  assert(
    manifest.functionScopeMatrix && manifest.functionScopeMatrix.status === "scoped",
    "manifest declares scoped functionScopeMatrix"
  );
  assert(
    Array.isArray(manifest.functionScopeMatrix.covered) &&
      [
        "lexical-closures",
        "shadowing",
        "mutation-through-closures",
        "recursion",
        "arity-behavior",
        "nested-functions",
        "return-normalization",
        "unsupported-advanced-function-forms"
      ].every((item) => manifest.functionScopeMatrix.covered.includes(item)),
    "functionScopeMatrix covers required function/scope categories"
  );
  assert(
    Array.isArray(manifest.functionScopeMatrix.unsupportedAsDiagnostics) &&
      ["javascript-async-function", "javascript-generator-function"].every((value) => manifest.functionScopeMatrix.unsupportedAsDiagnostics.includes(value)),
    "functionScopeMatrix names unsupported function diagnostics"
  );
  assert(
    manifest.dataStructureMatrix && manifest.dataStructureMatrix.status === "scoped",
    "manifest declares scoped dataStructureMatrix"
  );
  assert(
    Array.isArray(manifest.dataStructureMatrix.covered) &&
      [
        "array-mutation",
        "object-mutation",
        "nested-reads-writes",
        "length",
        "slicing",
        "membership",
        "iteration",
        "record-fields",
        "object-literals",
        "unsupported-deep-structures"
      ].every((item) => manifest.dataStructureMatrix.covered.includes(item)),
    "dataStructureMatrix covers required data-structure categories"
  );
  assert(
    Array.isArray(manifest.dataStructureMatrix.unsupportedAsDiagnostics) &&
      ["javascript-object-spread", "javascript-destructuring-pattern"].every((value) => manifest.dataStructureMatrix.unsupportedAsDiagnostics.includes(value)),
    "dataStructureMatrix names unsupported data-structure diagnostics"
  );
}

function runFixture(fixture) {
  assert.strictEqual(typeof fixture.name, "string", "fixture has a name");
  assert.strictEqual(typeof fixture.sourceLanguage, "string", `${fixture.name} has a sourceLanguage`);
  assert.strictEqual(typeof fixture.source, "string", `${fixture.name} has source text`);
  assert(Array.isArray(fixture.sections) && fixture.sections.length > 0, `${fixture.name} names spec sections`);
  validateFixtureMetadata(fixture);

  if (fixture.expectedFailure) {
    assertExpectedFailure(fixture);
    return {
      name: fixture.name,
      status: "passed",
      sourceLanguage: fixture.sourceLanguage,
      sections: fixture.sections,
      semanticsStatus: fixture.semanticsStatus || null,
      expectedDiagnostic: true,
      targetChecks: 0,
      unsupportedTargetChecks: 0,
      runtimeChecks: 0
    };
  }

  const ir = bridge.compileToIR(fixture.source, fixture.sourceLanguage);
  assert(ir && ir.kind === "Program", `${fixture.name} compiles to the current legacy object-tree Program IR`);
  assert(Array.isArray(ir.body), `${fixture.name} IR Program has a body array`);

  for (const [target, expectations] of Object.entries(fixture.targets || {})) {
    assertTargetOutput(fixture, ir, target, expectations);
  }

  for (const [target, expectations] of Object.entries(fixture.unsupportedTargets || {})) {
    assertUnsupportedTarget(fixture, ir, target, expectations);
  }

  assertRuntimeChecks(fixture, ir);

  const checks = fixture.runtimeChecks || {};
  return {
    name: fixture.name,
    status: "passed",
    sourceLanguage: fixture.sourceLanguage,
    sections: fixture.sections,
    semanticsStatus: fixture.semanticsStatus || null,
    expectedDiagnostic: false,
    targetChecks: Object.keys(fixture.targets || {}).length,
    unsupportedTargetChecks: Object.keys(fixture.unsupportedTargets || {}).length,
    runtimeChecks: (checks.native ? 1 : 0) + Object.keys(checks.targets || {}).length
  };
}

const targetChecks = manifest.fixtures.reduce((total, fixture) => {
  return total + Object.keys(fixture.targets || {}).length + Object.keys(fixture.unsupportedTargets || {}).length;
}, 0);
const expectedDiagnostics = manifest.fixtures.filter(fixture => fixture.expectedFailure).length;
const runtimeChecks = manifest.fixtures.reduce((total, fixture) => {
  const checks = fixture.runtimeChecks || {};
  return total + (checks.native ? 1 : 0) + Object.keys(checks.targets || {}).length;
}, 0);

const results = [];
const failures = [];

try {
  validateManifest();
} catch (error) {
  failures.push({
    name: "manifest",
    status: "failed",
    message: error && error.message ? error.message : String(error)
  });
}

if (failures.length === 0) {
  for (const fixture of manifest.fixtures) {
    try {
      results.push(runFixture(fixture));
    } catch (error) {
      failures.push({
        name: fixture.name,
        status: "failed",
        message: error && error.message ? error.message : String(error)
      });
      results.push({
        name: fixture.name,
        status: "failed",
        sourceLanguage: fixture.sourceLanguage || null,
        sections: fixture.sections || [],
        semanticsStatus: fixture.semanticsStatus || null,
        expectedDiagnostic: Boolean(fixture.expectedFailure),
        error: error && error.message ? error.message : String(error)
      });
    }
  }
}

const report = {
  schemaVersion: 1,
  kind: "luascript:canonical-ir-conformance",
  command: "npm run test:ir-conformance",
  generatedAt: new Date().toISOString(),
  elapsedMs: Date.now() - startedAt,
  environment: environmentMetadata(),
  manifest: manifestEvidence(manifestPath, manifest, manifest.fixtures.map(fixture => fixture.name)),
  supportMatrixTraceability: supportMatrixTraceability({
    supportRows: [
      "JavaScript input to Lua output",
      "LUASCRIPT `.ls` JS-like syntax plus V0.16 meta layer to Lua/Python/JavaScript/`.ls`",
      "Lua input",
      "Python",
      "Canonical IR conformance"
    ],
    evidenceRole: "Scoped canonical IR conformance skeleton for current stable bridge emitters."
  }),
  summary: {
    total: manifest.fixtures.length,
    passed: results.filter(result => result.status === "passed").length,
    failed: failures.length,
    targetChecks,
    expectedDiagnostics,
    runtimeChecks
  },
  matrices: {
    valueSemantics: manifest.valueSemanticsMatrix,
    controlFlow: manifest.controlFlowMatrix,
    functionScope: manifest.functionScopeMatrix,
    dataStructure: manifest.dataStructureMatrix
  },
  runtimeCommandsUsed,
  results,
  failures
};

writeJsonReport(reportPath, report);

if (failures.length > 0) {
  console.error(`Canonical IR conformance skeleton failed: ${failures.length} failure(s)`);
  console.error(`Conformance report: ${relativePath(reportPath)}`);
  process.exit(1);
}

console.log(
  `Canonical IR conformance skeleton passed: ${manifest.fixtures.length} fixtures, ${targetChecks} target checks, ${expectedDiagnostics} expected diagnostics, ${runtimeChecks} runtime checks`
);
console.log(`Conformance report: ${relativePath(reportPath)}`);
