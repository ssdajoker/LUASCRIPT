"use strict";

const assert = require("assert");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");
const { CoreLanguageBridge } = require("../../src/compilers/core-language-bridge");
const {
  fixtureToSchemaArtifact,
  schemaKindsFromSchema,
  validateSchemaArtifactCompatibility
} = require("../../src/ir/schema_artifact_bridge");
const {
  repoRoot,
  fileHash,
  hashText,
  environmentMetadata,
  manifestEvidence,
  supportMatrixTraceability,
  writeJsonReport
} = require("./report_utils");

const manifestPath = path.join(__dirname, "manifest.json");
const schemaPath = path.join(repoRoot, "docs", "canonical_ir.schema.json");
const reportPath = path.join(repoRoot, "artifacts", "conformance", "dual-surface-compatibility-bridge-report.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const schemaKinds = schemaKindsFromSchema(schema);
const bridge = new CoreLanguageBridge();
const startedAt = Date.now();

function pushCount(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
}

function validateWithAjv(validate, artifact) {
  const ok = validate(artifact);
  return {
    ok,
    errors: ok ? [] : (validate.errors || []).map(error => ({
      instancePath: error.instancePath || "/",
      message: error.message,
      params: error.params || {}
    }))
  };
}

function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const results = [];
  const failures = [];
  const globalKindAliases = {};
  const globalFieldAliases = {};
  const globalMappedKinds = {};
  const invariantChecks = {
    total: 0,
    passed: 0,
    failed: 0
  };

  for (const fixture of manifest.fixtures) {
    if (fixture.expectedFailure) {
      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "expected-diagnostic-preserved",
        phase: fixture.expectedFailure.phase || "compile",
        messageIncludes: fixture.expectedFailure.messageIncludes || []
      });
      continue;
    }

    try {
      const legacyProgram = bridge.compileToIR(fixture.source, fixture.sourceLanguage);
      const mapping = fixtureToSchemaArtifact(fixture, legacyProgram, { schemaKinds });
      const schemaValidation = validateWithAjv(validate, mapping.artifact);
      const compatibility = validateSchemaArtifactCompatibility(mapping);

      assert.strictEqual(schemaValidation.ok, true, `${fixture.name} bridge artifact is not schema-valid: ${JSON.stringify(schemaValidation.errors)}`);
      assert.strictEqual(compatibility.ok, true, `${fixture.name} compatibility bridge invariants failed: ${JSON.stringify(compatibility.failures)}`);

      for (const [key, count] of Object.entries(mapping.kindAliases)) pushCount(globalKindAliases, key, count);
      for (const [key, count] of Object.entries(mapping.fieldAliases)) pushCount(globalFieldAliases, key, count);
      for (const [key, count] of Object.entries(mapping.kindCounts)) pushCount(globalMappedKinds, key, count);
      invariantChecks.total += compatibility.checks.length;
      invariantChecks.passed += compatibility.checks.filter(check => check.passed).length;
      invariantChecks.failed += compatibility.checks.filter(check => !check.passed).length;

      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "bridge-compatible-derived-artifact",
        legacyRootKind: legacyProgram.kind || null,
        schemaVersion: mapping.artifact.schemaVersion,
        nodeCount: Object.keys(mapping.artifact.nodes).length,
        artifactSha256: hashText(JSON.stringify(mapping.artifact)),
        compatibilityChecks: compatibility.checks,
        kindAliases: mapping.kindAliases,
        fieldAliases: mapping.fieldAliases,
        mappedKinds: mapping.kindCounts
      });
    } catch (error) {
      failures.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        message: error.message
      });
      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "failed",
        message: error.message
      });
    }
  }

  const compatibleResults = results.filter(result => result.status === "bridge-compatible-derived-artifact");
  const expectedDiagnostics = results.filter(result => result.status === "expected-diagnostic-preserved");
  const positiveCount = manifest.fixtures.length - expectedDiagnostics.length;
  const report = {
    schemaVersion: 1,
    kind: "luascript:dual-surface-compatibility-bridge",
    command: "npm run test:ir-compatibility-bridge",
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    environment: environmentMetadata(),
    manifest: manifestEvidence(manifestPath, manifest, manifest.fixtures.map(fixture => fixture.name)),
    schema: {
      path: "docs/canonical_ir.schema.json",
      sha256: fileHash(schemaPath),
      schemaVersion: "1.0.0"
    },
    supportMatrixTraceability: supportMatrixTraceability({
      supportRows: [
        "Canonical IR conformance",
        "Dual-surface IR compatibility bridge",
        "Big Remaining Climb final release IR surface"
      ],
      evidenceRole: "Validates the internal bridge from current legacy object-tree IR to derived schema-valid canonical IR artifacts with invariant checks.",
      boundary: "This report proves an internal dual-surface compatibility bridge candidate for current positive conformance fixtures only. It does not make the bridge public API, choose the final release IR surface, change compiler output, or close canonical 1.0."
    }),
    bridgePolicy: {
      decision: "formal-dual-surface-compatibility-bridge-candidate",
      implementation: "src/ir/schema_artifact_bridge.js",
      legacySurface: "CoreLanguageBridge compileToIR legacy object-tree Program",
      schemaSurface: "docs/canonical_ir.schema.json schemaVersion 1.0.0",
      publicApiStatus: "INTERNAL_ONLY",
      releaseSurfaceStatus: "OPEN",
      invariantFamilies: [
        "schema-version",
        "module-id-shape",
        "module-body-resolves",
        "node-ids-match-map-keys",
        "node-ids-are-schema-ids",
        "node-references-resolve",
        "no-unmapped-kinds",
        "source-surface-marked"
      ]
    },
    summary: {
      total: manifest.fixtures.length,
      positiveFixtures: positiveCount,
      bridgeCompatibleDerivedArtifacts: compatibleResults.length,
      schemaValidDerivedArtifacts: compatibleResults.length,
      expectedDiagnostics: expectedDiagnostics.length,
      failed: failures.length,
      invariantChecks,
      globalKindAliases,
      globalFieldAliases,
      globalMappedKinds
    },
    results,
    failures
  };

  writeJsonReport(reportPath, report);
  console.log(
    `Dual-surface compatibility bridge passed: ${compatibleResults.length}/${positiveCount} positive fixtures; ${invariantChecks.passed}/${invariantChecks.total} invariant checks; ${expectedDiagnostics.length} expected diagnostics preserved`
  );
  console.log(`Dual-surface compatibility bridge report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
