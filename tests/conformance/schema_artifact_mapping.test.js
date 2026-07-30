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
  validateSchemaArtifactCompatibility,
  validateReleaseIrSurfaceMapping,
  RELEASE_IR_SURFACE_CONTRACT
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
const reportPath = path.join(repoRoot, "artifacts", "conformance", "schema-artifact-mapping-report.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const schemaKinds = schemaKindsFromSchema(schema);
const bridge = new CoreLanguageBridge();
const startedAt = Date.now();

function pushCount(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
}

function validateArtifact(validate, artifact) {
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
  const invariantTotals = {
    total: 0,
    passed: 0,
    failed: 0
  };
  const releaseContractTotals = {
    total: 0,
    passed: 0,
    failed: 0
  };

  for (const fixture of manifest.fixtures) {
    if (fixture.expectedFailure) {
      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "expected-diagnostic",
        phase: fixture.expectedFailure.phase || "compile",
        messageIncludes: fixture.expectedFailure.messageIncludes || []
      });
      continue;
    }

    try {
      const legacyProgram = bridge.compileToIR(fixture.source, fixture.sourceLanguage);
      const mapping = fixtureToSchemaArtifact(fixture, legacyProgram, { schemaKinds });
      const validation = validateArtifact(validate, mapping.artifact);
      const compatibility = validateSchemaArtifactCompatibility(mapping);
      const releaseContract = validateReleaseIrSurfaceMapping(mapping);

      assert.strictEqual(validation.ok, true, `${fixture.name} derived schema artifact is schema-valid: ${JSON.stringify(validation.errors)}`);
      assert.strictEqual(compatibility.ok, true, `${fixture.name} bridge invariants failed: ${JSON.stringify(compatibility.failures)}`);
      assert.strictEqual(releaseContract.ok, true, `${fixture.name} release IR contract checks failed: ${JSON.stringify(releaseContract.failures)}`);

      for (const [key, count] of Object.entries(mapping.kindAliases)) pushCount(globalKindAliases, key, count);
      for (const [key, count] of Object.entries(mapping.fieldAliases)) pushCount(globalFieldAliases, key, count);
      for (const [key, count] of Object.entries(mapping.kindCounts)) pushCount(globalMappedKinds, key, count);
      invariantTotals.total += compatibility.checks.length;
      invariantTotals.passed += compatibility.checks.filter(check => check.passed).length;
      invariantTotals.failed += compatibility.checks.filter(check => !check.passed).length;
      releaseContractTotals.total += releaseContract.checks.length;
      releaseContractTotals.passed += releaseContract.checks.filter(check => check.passed).length;
      releaseContractTotals.failed += releaseContract.checks.filter(check => !check.passed).length;

      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "schema-valid-derived-artifact",
        legacyRootKind: legacyProgram.kind || null,
        schemaVersion: mapping.artifact.schemaVersion,
        moduleBodyCount: mapping.artifact.module.body.length,
        nodeCount: Object.keys(mapping.artifact.nodes).length,
        artifactSha256: hashText(JSON.stringify(mapping.artifact)),
        compatibilityChecks: compatibility.checks,
        releaseContractChecks: releaseContract.checks,
        kindCounts: mapping.kindCounts,
        kindAliases: mapping.kindAliases,
        fieldAliases: mapping.fieldAliases,
        unmappedKinds: mapping.unmappedKinds
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

  const positiveResults = results.filter(result => result.status !== "expected-diagnostic");
  const schemaValidResults = results.filter(result => result.status === "schema-valid-derived-artifact");
  const expectedDiagnostics = results.filter(result => result.status === "expected-diagnostic");
  const report = {
    schemaVersion: 1,
    kind: "luascript:schema-artifact-mapping",
    command: "npm run test:schema-artifact-map",
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    environment: environmentMetadata(),
    manifest: manifestEvidence(manifestPath, manifest, manifest.fixtures.map(fixture => fixture.name)),
    schema: {
      path: "docs/canonical_ir.schema.json",
      sha256: fileHash(schemaPath),
      schemaVersion: "1.0.0"
    },
    governingContract: {
      path: "docs/LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md",
      sha256: fileHash(path.join(repoRoot, "docs", "LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md"))
    },
    implementationEvidence: [
      "src/compilers/core-language-bridge.js",
      "src/ir/release_ir_surface_contract.js",
      "src/ir/schema_artifact_bridge.js",
      "tests/conformance/schema_artifact_mapping.test.js"
    ].map(relativePath => ({
      path: relativePath,
      sha256: fileHash(path.join(repoRoot, relativePath))
    })),
    supportMatrixTraceability: supportMatrixTraceability({
      supportRows: [
        "Canonical IR conformance",
        "Denali 1.0 IR semantics",
        "Big Remaining Climb schema-valid conformance artifact mapping"
      ],
      evidenceRole: "Maps current legacy object-tree conformance IR to the chosen versioned canonical artifact surface and records declared compatibility encodings.",
      boundary: "This report proves derived artifacts for current positive conformance fixtures only. It does not change compiler output or package API, provide reverse conversion, prove semantic equivalence or source preservation, promote broad source identity, or release canonical 1.0."
    }),
    transitionPolicy: {
      contractVersion: RELEASE_IR_SURFACE_CONTRACT.contractVersion,
      decision: RELEASE_IR_SURFACE_CONTRACT.decision,
      direction: RELEASE_IR_SURFACE_CONTRACT.direction,
      legacySurface: RELEASE_IR_SURFACE_CONTRACT.surfaces.operational,
      schemaSurface: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical,
      releaseSurfaceStatus: "CHOSEN_VERSIONED_ONE_WAY_DUAL_SURFACE",
      notes: [
        "The current compiler bridge continues to emit legacy object-tree IR for active emitters.",
        "The reusable internal bridge derives schema-valid artifacts without changing compiler, runtime, or package APIs.",
        "The canonical projection is one-way and is not a semantic-equivalence, source-preservation, or reverse-conversion claim."
      ]
    },
    summary: {
      total: manifest.fixtures.length,
      positiveFixtures: positiveResults.length,
      schemaValidDerivedArtifacts: schemaValidResults.length,
      expectedDiagnostics: expectedDiagnostics.length,
      failed: failures.length,
      invariantChecks: invariantTotals,
      releaseContractChecks: releaseContractTotals,
      globalKindAliases,
      globalFieldAliases,
      globalMappedKinds
    },
    results,
    failures
  };

  writeJsonReport(reportPath, report);
  console.log(
    `Schema artifact mapping passed: ${schemaValidResults.length}/${positiveResults.length} positive conformance fixtures produced schema-valid derived artifacts; ${expectedDiagnostics.length} expected diagnostics preserved; ${invariantTotals.passed}/${invariantTotals.total} bridge invariants; ${releaseContractTotals.passed}/${releaseContractTotals.total} release-contract checks`
  );
  console.log(`Schema artifact mapping report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
