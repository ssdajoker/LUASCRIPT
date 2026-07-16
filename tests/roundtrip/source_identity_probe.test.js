"use strict";

const assert = require("assert");
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const { CoreLanguageBridge } = require("../../src/compilers/core-language-bridge");
const { findCommand } = require("../clarity_canon/runner_utils");
const {
  repoRoot,
  relativePath,
  fileHash,
  hashText,
  environmentMetadata,
  supportMatrixTraceability,
  writeJsonReport,
  manifestEvidence
} = require("../conformance/report_utils");

const manifestPath = path.join(__dirname, "source_identity_manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const reportPath = path.join(repoRoot, "artifacts", "conformance", "source-identity-probe-report.json");
const bridge = new CoreLanguageBridge();
const startedAt = Date.now();
let pythonCommand = null;

const parserOwnedAstNormalizerScript = `
import dataclasses
import json
import sys
from pathlib import Path

payload = json.loads(sys.stdin.read())
repo_root = Path(payload["repoRoot"])
sys.path.insert(0, str(repo_root / "src" / "lexer"))
sys.path.insert(0, str(repo_root / "src" / "parser"))

from enhanced_parser import parse_artifact

def normalize(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list) or isinstance(value, tuple):
        return [normalize(item) for item in value]
    if isinstance(value, set):
        return sorted(normalize(item) for item in value)
    if isinstance(value, dict):
        return {str(key): normalize(value[key]) for key in sorted(value.keys(), key=str)}
    if dataclasses.is_dataclass(value):
        result = {"type": value.__class__.__name__}
        for field in dataclasses.fields(value):
            result[field.name] = normalize(getattr(value, field.name))
        return result
    return str(value)

artifact = parse_artifact(payload["source"], payload["filename"])
normalized = {
    "program": normalize(artifact.program),
    "metaPolicy": normalize(artifact.meta_policy),
    "verifyPolicy": normalize(artifact.verify_policy),
    "featureSlices": sorted(artifact.feature_slices),
}
print(json.dumps(normalized, sort_keys=True, separators=(",", ":")))
`;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeLsSource(source) {
  return String(source || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n");
}

function stableIr(value) {
  if (Array.isArray(value)) {
    return value.map(stableIr);
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      if (["metadata", "loc", "range", "raw", "id"].includes(key)) continue;
      result[key] = stableIr(value[key]);
    }
    return result;
  }
  return value;
}

function getPythonCommand() {
  if (!pythonCommand) {
    pythonCommand = findCommand(["python3", "python"], "Python 3");
  }
  return pythonCommand;
}

function normalizeParserOwnedAst(source, filename) {
  const result = childProcess.spawnSync(
    getPythonCommand(),
    ["-c", parserOwnedAstNormalizerScript],
    {
      cwd: repoRoot,
      encoding: "utf8",
      input: JSON.stringify({
        repoRoot,
        filename,
        source
      }),
      timeout: 30000,
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8"
      }
    }
  );

  if (result.error) {
    throw new Error(`Parser-owned AST normalization failed for ${filename}: ${result.error.message || result.error}`);
  }
  if (result.status !== 0) {
    throw new Error([
      `Parser-owned AST normalization failed for ${filename} with status ${result.status}`,
      (result.stderr || "").trim(),
      (result.stdout || "").trim()
    ].filter(Boolean).join("\n"));
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Parser-owned AST normalization returned invalid JSON for ${filename}: ${error.message}`);
  }
}

function readFixtureSource(fixture) {
  const sourcePath = path.resolve(repoRoot, fixture.sourcePath);
  assert(
    sourcePath.startsWith(repoRoot),
    `${fixture.name} sourcePath must stay inside repo root`
  );
  return {
    sourcePath,
    source: fs.readFileSync(sourcePath, "utf8")
  };
}

function validateManifest() {
  assert.strictEqual(manifest.status, "release-shaped-source-identity-suite");
  assert.strictEqual(manifest.identityKind, "normalized-source-ast-and-ir-with-diagnostic-boundaries");
  assert(Array.isArray(manifest.fixtures) && manifest.fixtures.length >= manifest.minimumFixtures);
  assert(Array.isArray(manifest.requiredCoverage) && manifest.requiredCoverage.length >= 1);
  assert(Array.isArray(manifest.boundaries) && manifest.boundaries.length >= 3);
  assert(
    manifest.bidirectionalityLayerEvidence &&
      manifest.bidirectionalityLayerEvidence.language === "luascript",
    "source identity manifest records .ls bidirectionality layer evidence"
  );
  for (const layer of [
    "emittedLs",
    "structuralIrReparse",
    "normalizedSourceIdentity",
    "normalizedAstIdentity",
    "normalizedIrIdentity",
    "tokenIdentity",
    "runtimeOutputEquivalence",
    "semanticEquivalence"
  ]) {
    assert.strictEqual(
      typeof manifest.bidirectionalityLayerEvidence.layers[layer],
      "string",
      `source identity manifest records ${layer} layer evidence`
    );
  }

  const coverage = new Set();
  for (const fixture of manifest.fixtures) {
    for (const item of fixture.coverage || []) {
      coverage.add(item);
    }
  }
  for (const required of manifest.requiredCoverage) {
    assert(coverage.has(required), `source identity manifest missing required coverage: ${required}`);
  }
}

function runExpectedDiagnosticFixture(fixture) {
  assert.strictEqual(fixture.sourceLanguage, "luascript", `${fixture.name} sourceLanguage is .ls`);
  assert.strictEqual(fixture.targetLanguage, "luascript", `${fixture.name} targetLanguage is .ls`);
  assert.strictEqual(fixture.expectedFailure, true, `${fixture.name} declares expectedFailure`);
  assert.strictEqual(typeof fixture.expectedDiagnosticPattern, "string", `${fixture.name} declares expectedDiagnosticPattern`);

  const { sourcePath, source } = readFixtureSource(fixture);
  try {
    bridge.compileToIR(source, fixture.sourceLanguage);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    assert(
      message.includes(fixture.expectedDiagnosticPattern),
      `${fixture.name} diagnostic mismatch:\nExpected: ${fixture.expectedDiagnosticPattern}\nActual: ${message}`
    );
    return {
      name: fixture.name,
      status: "passed",
      tier: fixture.tier,
      coverage: fixture.coverage || [],
      sourceLanguage: fixture.sourceLanguage,
      targetLanguage: fixture.targetLanguage,
      claim: fixture.claim,
      sourcePath: relativePath(sourcePath),
      sourceSha256: fileHash(sourcePath),
      expectedDiagnosticPattern: fixture.expectedDiagnosticPattern,
      actualDiagnostic: message,
      normalizedSourceIdentity: false,
      normalizedIrIdentity: false,
      tokenLevelTextIdentity: false,
      normalizedAstIdentity: false,
      runtimeOutputEquivalence: false,
      broadSemanticEquivalence: false,
      expectedUnsupportedDiagnostic: true
    };
  }

  throw new Error(`${fixture.name} unexpectedly compiled; expected unsupported diagnostic`);
}

function runIdentityFixture(fixture) {
  assert.strictEqual(fixture.sourceLanguage, "luascript", `${fixture.name} sourceLanguage is .ls`);
  assert.strictEqual(fixture.targetLanguage, "luascript", `${fixture.name} targetLanguage is .ls`);
  assert.strictEqual(typeof fixture.sourcePath, "string", `${fixture.name} declares sourcePath`);
  assert.strictEqual(typeof fixture.claim, "string", `${fixture.name} declares claim`);
  assert.strictEqual(fixture.expectedFailure, undefined, `${fixture.name} is not an expected-failure fixture`);

  const { sourcePath, source } = readFixtureSource(fixture);
  const sourceIr = bridge.compileToIR(source, fixture.sourceLanguage);
  const sourceAst = normalizeParserOwnedAst(source, fixture.sourcePath);
  const emitted = bridge.emitFromIR(deepClone(sourceIr), fixture.targetLanguage, fixture.sourceLanguage);
  const emittedIr = bridge.compileToIR(emitted, fixture.targetLanguage);
  const emittedAst = normalizeParserOwnedAst(emitted, `${fixture.name}.emitted.ls`);

  const normalizedSource = normalizeLsSource(source);
  const normalizedEmitted = normalizeLsSource(emitted);
  const normalizedSourceIdentity = normalizedSource === normalizedEmitted;
  const normalizedIrIdentity = JSON.stringify(stableIr(sourceIr)) === JSON.stringify(stableIr(emittedIr));
  const normalizedSourceAst = JSON.stringify(sourceAst);
  const normalizedEmittedAst = JSON.stringify(emittedAst);
  const normalizedAstIdentity = normalizedSourceAst === normalizedEmittedAst;
  const tokenLevelTextIdentity = source.replace(/\r\n/g, "\n").trim() === emitted.replace(/\r\n/g, "\n").trim();

  for (const expected of fixture.expectedNormalizedIncludes || []) {
    assert(
      normalizedEmitted.includes(expected),
      `${fixture.name} normalized emitted .ls missing expected snippet:\n${expected}\n\nActual:\n${normalizedEmitted}`
    );
  }

  assert.strictEqual(
    normalizedSourceIdentity,
    true,
    `${fixture.name} did not preserve normalized .ls source identity`
  );
  assert.strictEqual(
    normalizedIrIdentity,
    true,
    `${fixture.name} did not preserve normalized current bridge IR identity`
  );
  assert.strictEqual(
    normalizedAstIdentity,
    true,
    `${fixture.name} did not preserve normalized parser-owned AST identity`
  );

  return {
    name: fixture.name,
    status: "passed",
    tier: fixture.tier,
    coverage: fixture.coverage || [],
    sourceLanguage: fixture.sourceLanguage,
    targetLanguage: fixture.targetLanguage,
    claim: fixture.claim,
    sourcePath: relativePath(sourcePath),
    sourceSha256: fileHash(sourcePath),
    emittedSha256: hashText(emitted),
    normalizedSourceSha256: hashText(normalizedSource),
    normalizedEmittedSha256: hashText(normalizedEmitted),
    normalizedIrSha256: hashText(JSON.stringify(stableIr(sourceIr))),
    normalizedEmittedIrSha256: hashText(JSON.stringify(stableIr(emittedIr))),
    normalizedAstSha256: hashText(normalizedSourceAst),
    normalizedEmittedAstSha256: hashText(normalizedEmittedAst),
    normalizedSourceIdentity,
    normalizedIrIdentity,
    tokenLevelTextIdentity,
    normalizedAstIdentity,
    runtimeOutputEquivalence: false,
    expectedUnsupportedDiagnostic: false,
    broadSemanticEquivalence: false
  };
}

function runFixture(fixture) {
  if (fixture.expectedFailure) {
    return runExpectedDiagnosticFixture(fixture);
  }
  return runIdentityFixture(fixture);
}

function countBy(values, key) {
  const counts = {};
  for (const value of values) {
    const countKey = value[key] || "unspecified";
    counts[countKey] = (counts[countKey] || 0) + 1;
  }
  return counts;
}

function coverageCounts(fixtures) {
  const counts = {};
  for (const fixture of fixtures) {
    for (const item of fixture.coverage || []) {
      counts[item] = (counts[item] || 0) + 1;
    }
  }
  return counts;
}

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
        targetLanguage: fixture.targetLanguage || null,
        sourcePath: fixture.sourcePath || null,
        error: error && error.message ? error.message : String(error)
      });
    }
  }
}

const passed = results.filter(result => result.status === "passed").length;
const normalizedSourceIdentity = results.filter(result => result.normalizedSourceIdentity).length;
const normalizedIrIdentity = results.filter(result => result.normalizedIrIdentity).length;
const normalizedAstIdentity = results.filter(result => result.normalizedAstIdentity).length;
const tokenLevelTextIdentity = results.filter(result => result.tokenLevelTextIdentity).length;
const expectedUnsupportedDiagnostics = results.filter(result => result.expectedUnsupportedDiagnostic).length;
const identityFixtures = manifest.fixtures.filter(fixture => !fixture.expectedFailure).length;
const diagnosticFixtures = manifest.fixtures.filter(fixture => fixture.expectedFailure).length;

const report = {
  schemaVersion: 1,
  kind: "luascript:source-identity-probe",
  command: "npm run test:source-identity-probe",
  generatedAt: new Date().toISOString(),
  elapsedMs: Date.now() - startedAt,
  environment: environmentMetadata(),
  manifest: manifestEvidence(manifestPath, manifest, manifest.fixtures.map(fixture => fixture.name)),
  sourceFiles: manifest.fixtures.map(fixture => {
    const sourcePath = path.resolve(repoRoot, fixture.sourcePath);
    return {
      name: fixture.name,
      path: relativePath(sourcePath),
      sha256: fs.existsSync(sourcePath) ? fileHash(sourcePath) : null
    };
  }),
  supportMatrixTraceability: supportMatrixTraceability({
    supportRows: [
      "LUASCRIPT `.ls` JS-like syntax plus V0.16 meta layer to Lua/Python/JavaScript/`.ls`",
      "The first round-trip probe harness"
    ],
    evidenceRole: "Release-shaped .ls source identity suite with positive normalized source, normalized parser-owned AST, and normalized current bridge IR identity fixtures plus separate expected unsupported diagnostics. This is not token-level text identity, broad lossless source recovery, runtime-output equivalence, semantic equivalence, or true omni-language 100% proof."
  }),
  parserOwnedAstIdentity: {
    status: "seeded-normalized-positive-fixtures",
    parser: "src/parser/enhanced_parser.py",
    artifactApi: "parse_artifact(source, filename)",
    comparator: "Normalized parser-owned dataclass AST JSON for source and emitted .ls; token stream and trivia are excluded.",
    commandDependency: pythonCommand || null,
    claimBoundary: "This proves normalized parser-owned AST identity for the positive .ls source-identity fixtures only. It does not prove token-level identity, comment preservation, broad lossless recovery, runtime-output equivalence, or semantic equivalence."
  },
  summary: {
    total: manifest.fixtures.length,
    passed,
    failed: failures.length,
    identityFixtures,
    diagnosticFixtures,
    normalizedSourceIdentity,
    normalizedIrIdentity,
    tokenLevelTextIdentity,
    normalizedAstIdentity,
    runtimeOutputEquivalence: 0,
    expectedUnsupportedDiagnostics,
    broadSemanticEquivalence: 0
  },
  coverageCounts: coverageCounts(manifest.fixtures),
  tierCounts: countBy(manifest.fixtures, "tier"),
  claimTiers: manifest.claimTiers,
  bidirectionalityLayerEvidence: manifest.bidirectionalityLayerEvidence,
  boundaries: manifest.boundaries,
  results,
  failures
};

writeJsonReport(reportPath, report);

if (failures.length === 0) {
  console.log(
    `Source identity probe passed: ${manifest.fixtures.length} fixtures, ${normalizedSourceIdentity} normalized source identity checks, ${normalizedAstIdentity} normalized parser-owned AST identity checks, ${normalizedIrIdentity} normalized IR identity checks, ${expectedUnsupportedDiagnostics} expected unsupported diagnostics`
  );
  console.log(`Source identity report: ${relativePath(reportPath)}`);
} else {
  console.error(`Source identity probe failed: ${failures.length} failure(s)`);
  console.error(`Source identity report: ${relativePath(reportPath)}`);
  process.exit(1);
}
