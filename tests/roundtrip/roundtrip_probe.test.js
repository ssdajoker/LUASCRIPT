"use strict";

const assert = require("assert");
const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { CoreLanguageBridge } = require("../../src/compilers/core-language-bridge");
const {
  relativePath,
  environmentMetadata,
  supportMatrixTraceability,
  writeJsonReport,
  manifestEvidence
} = require("../conformance/report_utils");

const repoRoot = path.resolve(__dirname, "..", "..");
const manifestPath = path.join(__dirname, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const bridge = new CoreLanguageBridge();
const reportPath = path.join(repoRoot, "artifacts", "conformance", "roundtrip-probe-report.json");
const startedAt = Date.now();
const runtimeCommandsUsed = [];

const supportedModes = new Set([
  "structural-ir-reparse",
  "runtime-output-equivalence"
]);
const requiredLayerEvidenceLanguages = ["javascript", "luascript", "python", "lua"];
const requiredLayerEvidenceKeys = [
  "nativeExecution",
  "sourceToIR",
  "irToTarget",
  "targetRuntime",
  "emittedLs",
  "structuralIrReparse",
  "normalizedSourceIdentity",
  "tokenIdentity",
  "semanticEquivalence"
];

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
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

function stableIr(value, preserveMetadata = false) {
  if (Array.isArray(value)) {
    return value.map(item => stableIr(item, preserveMetadata));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      if (["loc", "range", "raw", "id"].includes(key)) continue;
      if (key === "metadata" && !preserveMetadata) continue;
      result[key] = stableIr(value[key], preserveMetadata);
    }
    return result;
  }
  return value;
}

function runtimeCandidates(language) {
  if (language === "javascript") return ["node"];
  if (language === "python") return [process.env.PYTHON, "python3", "python"].filter(Boolean);
  throw new Error(`No round-trip probe runtime runner for ${language}`);
}

function runtimeExtension(language) {
  if (language === "javascript") return "js";
  if (language === "python") return "py";
  throw new Error(`No round-trip probe runtime extension for ${language}`);
}

function runRuntime(language, source, label) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "luascript-roundtrip-"));
  const sourcePath = path.join(tempDir, `${label}.${runtimeExtension(language)}`);

  try {
    fs.writeFileSync(sourcePath, source, "utf8");
    const attempts = [];

    for (const command of runtimeCandidates(language)) {
      const result = childProcess.spawnSync(command, [sourcePath], {
        cwd: repoRoot,
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
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertTargetIncludes(fixture, emitted) {
  for (const expected of fixture.expectedTargetIncludes || []) {
    assert(
      emitted.includes(expected),
      `${fixture.name} emitted ${fixture.targetLanguage} missing expected snippet:\n${expected}\n\nActual:\n${emitted}`
    );
  }
}

function assertRuntimePassed(fixture, language, source, expectedOutput, label) {
  const { command, result } = runRuntime(language, source, label.replace(/[^A-Za-z0-9_-]/g, "_"));
  runtimeCommandsUsed.push({
    fixture: fixture.name,
    language,
    label,
    command
  });
  const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`;
  assert.strictEqual(
    result.status,
    0,
    `${fixture.name} ${label} ${language} runtime via ${command} failed:\n${combinedOutput}`
  );
  assert.strictEqual(
    compactOutput(result.stdout),
    expectedOutput,
    `${fixture.name} ${label} ${language} runtime output mismatch`
  );
}

function runStructuralIrReparse(fixture, sourceIr, emitted) {
  const reparsedIr = bridge.compileToIR(emitted, fixture.targetLanguage);
  const preserveMetadata = fixture.sourceLanguage === fixture.targetLanguage;
  const normalizationPolicy = preserveMetadata
    ? "same-language-preserve-metadata"
    : "cross-language-exclude-source-specific-metadata";
  assert.deepStrictEqual(
    stableIr(reparsedIr, preserveMetadata),
    stableIr(sourceIr, preserveMetadata),
    `${fixture.name} did not preserve normalized current bridge IR after emitted ${fixture.targetLanguage} reparse`
  );
  return {
    normalizationPolicy,
    ignoredFields: preserveMetadata
      ? ["loc", "range", "raw", "id"]
      : ["metadata", "loc", "range", "raw", "id"]
  };
}

function runRuntimeOutputEquivalence(fixture, emitted) {
  assert(
    fixture.expectedOutput,
    `${fixture.name} runtime-output-equivalence fixture must declare expectedOutput`
  );
  assertRuntimePassed(
    fixture,
    fixture.sourceLanguage,
    fixture.source,
    fixture.expectedOutput,
    "source"
  );
  assertRuntimePassed(
    fixture,
    fixture.targetLanguage,
    emitted,
    fixture.expectedOutput,
    "emitted-target"
  );
}

function validateManifest() {
  assert.strictEqual(manifest.status, "scoped-round-trip-probe", "manifest keeps scoped round-trip probe status");
  assert(Array.isArray(manifest.modes), "manifest declares modes");
  for (const mode of supportedModes) {
    assert(manifest.modes.includes(mode), `manifest mode list includes ${mode}`);
  }
  assert(Array.isArray(manifest.fixtures) && manifest.fixtures.length >= 3, "manifest has tiny representative fixtures");
  assert(
    manifest.languageLayerEvidence && manifest.languageLayerEvidence.languages,
    "manifest records per-language bidirectionality layer evidence"
  );
  assert.deepStrictEqual(
    manifest.languageLayerEvidence.requiredLayers,
    requiredLayerEvidenceKeys,
    "manifest required layer evidence keys stay stable"
  );
  for (const language of requiredLayerEvidenceLanguages) {
    const entry = manifest.languageLayerEvidence.languages[language];
    assert(entry, `manifest records ${language} bidirectionality layer evidence`);
    assert.strictEqual(typeof entry.languageGate, "string", `${language} layer evidence names a language gate`);
    assert.strictEqual(typeof entry.report, "string", `${language} layer evidence names a report`);
    assert(entry.layers && typeof entry.layers === "object", `${language} layer evidence has layers`);
    for (const layer of requiredLayerEvidenceKeys) {
      assert.strictEqual(typeof entry.layers[layer], "string", `${language} layer evidence records ${layer}`);
    }
    assert(Array.isArray(entry.evidence) && entry.evidence.length >= 1, `${language} layer evidence lists evidence`);
    assert(Array.isArray(entry.boundaries) && entry.boundaries.length >= 1, `${language} layer evidence lists boundaries`);
  }
}

function runFixture(fixture) {
  assert.strictEqual(typeof fixture.name, "string", "fixture has a name");
  assert(supportedModes.has(fixture.mode), `${fixture.name} uses a supported mode`);
  assert.strictEqual(typeof fixture.sourceLanguage, "string", `${fixture.name} declares sourceLanguage`);
  assert.strictEqual(typeof fixture.targetLanguage, "string", `${fixture.name} declares targetLanguage`);
  assert.strictEqual(typeof fixture.source, "string", `${fixture.name} declares source`);
  assert.strictEqual(typeof fixture.notes, "string", `${fixture.name} documents the claim boundary`);

  const sourceIr = bridge.compileToIR(fixture.source, fixture.sourceLanguage);
  assert(sourceIr && sourceIr.kind === "Program", `${fixture.name} source compiles to Program IR`);

  const emitted = bridge.emitFromIR(deepClone(sourceIr), fixture.targetLanguage, fixture.sourceLanguage);
  assert.strictEqual(typeof emitted, "string", `${fixture.name} emits ${fixture.targetLanguage} source`);
  assert(emitted.trim().length > 0, `${fixture.name} emits non-empty ${fixture.targetLanguage} source`);
  assertTargetIncludes(fixture, emitted);

  if (fixture.mode === "structural-ir-reparse") {
    const normalization = runStructuralIrReparse(fixture, sourceIr, emitted);
    return {
      name: fixture.name,
      status: "passed",
      mode: fixture.mode,
      sourceLanguage: fixture.sourceLanguage,
      targetLanguage: fixture.targetLanguage,
      claim: "structural IR reparse",
      normalization,
      sourcePreservingRoundTrip: false,
      notes: fixture.notes
    };
  }

  runRuntimeOutputEquivalence(fixture, emitted);
  return {
    name: fixture.name,
    status: "passed",
    mode: fixture.mode,
    sourceLanguage: fixture.sourceLanguage,
    targetLanguage: fixture.targetLanguage,
    claim: "runtime-output equivalence",
    sourcePreservingRoundTrip: false,
    notes: fixture.notes
  };
}

const structuralCount = manifest.fixtures.filter(fixture => fixture.mode === "structural-ir-reparse").length;
const behavioralCount = manifest.fixtures.filter(fixture => fixture.mode === "runtime-output-equivalence").length;
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
        mode: fixture.mode || null,
        sourceLanguage: fixture.sourceLanguage || null,
        targetLanguage: fixture.targetLanguage || null,
        sourcePreservingRoundTrip: false,
        error: error && error.message ? error.message : String(error)
      });
    }
  }
}

const report = {
  schemaVersion: 1,
  kind: "luascript:roundtrip-probe",
  command: "npm run test:roundtrip-probe",
  generatedAt: new Date().toISOString(),
  elapsedMs: Date.now() - startedAt,
  environment: environmentMetadata(),
  manifest: manifestEvidence(manifestPath, manifest, manifest.fixtures.map(fixture => fixture.name)),
  supportMatrixTraceability: supportMatrixTraceability({
    supportRows: [
      "The first round-trip probe harness",
      "JavaScript input to Lua output",
      "LUASCRIPT `.ls` JS-like syntax plus V0.16 meta layer to Lua/Python/JavaScript/`.ls`",
      "Lua input",
      "Python"
    ],
    evidenceRole: "Scoped structural IR reparse and runtime-output equivalence probe plus JS/.ls/Python/Lua layer-evidence map. This is not source-preserving round-trip proof."
  }),
  languageLayerEvidence: manifest.languageLayerEvidence,
  summary: {
    total: manifest.fixtures.length,
    passed: results.filter(result => result.status === "passed").length,
    failed: failures.length,
    structuralIrReparse: structuralCount,
    runtimeOutputEquivalence: behavioralCount,
    sourcePreservingRoundTrip: 0
  },
  runtimeCommandsUsed,
  results,
  failures
};

writeJsonReport(reportPath, report);

if (failures.length === 0) {
  console.log(
    `Round-trip probe harness passed: ${manifest.fixtures.length} fixtures, ${structuralCount} structural IR reparse checks, ${behavioralCount} runtime-output equivalence checks`
  );
  console.log(`Round-trip probe report: ${relativePath(reportPath)}`);
} else {
  console.error(`Round-trip probe harness failed: ${failures.length} failure(s)`);
  console.error(`Round-trip probe report: ${relativePath(reportPath)}`);
  process.exit(1);
}
