"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  buildReleaseEvidenceBundle,
  canonicalJson,
  collectEmbeddedHashReferences,
  sha256Buffer,
  sha256Canonical,
  validateHashReferences,
  writeReleaseEvidenceBundle
} = require("../../scripts/generate_release_evidence_bundle");

function writeText(root, relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, "utf8");
}

function writeJson(root, relativePath, value) {
  writeText(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function fileHash(root, relativePath) {
  return sha256Buffer(fs.readFileSync(path.join(root, relativePath)));
}

function makePassingReport(root, reportPath, inputPath, extra = {}) {
  writeJson(root, reportPath, {
    schemaVersion: 1,
    kind: extra.kind || "test:passing-report",
    generatedAt: "2026-01-01T00:00:00.000Z",
    input: {
      path: inputPath,
      sha256: fileHash(root, inputPath)
    },
    summary: {
      total: 1,
      passed: 1,
      failed: 0
    },
    results: [
      {
        name: "one",
        status: "passed"
      }
    ],
    failures: []
  });
}

function makeFixtureRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "luascript-evidence-"));

  writeJson(root, "package.json", {
    name: "luascript-fixture",
    version: "0.1.0-beta.0",
    engines: { node: ">=14.17.0" }
  });
  writeText(
    root,
    "scripts/generate_release_evidence_bundle.js",
    "\"use strict\";\n"
  );
  writeText(
    root,
    "tests/release_evidence/release_evidence_bundle.test.js",
    "\"use strict\";\n"
  );

  writeText(root, "tests/language_completion/fixtures/demo/demo.ls", "let x = 1;\n");
  writeJson(root, "tests/language_completion/manifests/demo.json", {
    schemaVersion: 1,
    language: "demo",
    supportSlice: "demo-v1",
    fixtures: [
      {
        name: "demo",
        source: "tests/language_completion/fixtures/demo/demo.ls"
      }
    ]
  });
  const demoManifestHash = fileHash(
    root,
    "tests/language_completion/manifests/demo.json"
  );
  const demoSourceHash = fileHash(
    root,
    "tests/language_completion/fixtures/demo/demo.ls"
  );
  const demoManifest = JSON.parse(
    fs.readFileSync(
      path.join(root, "tests/language_completion/manifests/demo.json"),
      "utf8"
    )
  );
  const demoManifestEntryHash = sha256Buffer(
    Buffer.from(JSON.stringify(demoManifest.fixtures[0]), "utf8")
  );
  writeText(root, "src/demo-implementation.js", "\"use strict\";\n");
  writeJson(root, "artifacts/language_completion/demo-report.json", {
    schemaVersion: 2,
    kind: "language:bidirectional",
    language: "demo",
    supportSlice: "demo-v1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    manifest: {
      path: "tests/language_completion/manifests/demo.json",
      sha256: demoManifestHash,
      version: 1,
      supportSlice: "demo-v1",
      fixtureCount: 1,
      fixtures: [
        {
          name: "demo",
          source: "tests/language_completion/fixtures/demo/demo.ls",
          manifestEntrySha256: demoManifestEntryHash,
          sourceSha256: demoSourceHash,
          sizeBytes: fs.statSync(
            path.join(root, "tests/language_completion/fixtures/demo/demo.ls")
          ).size
        }
      ]
    },
    implementationEvidence: [
      {
        path: "src/demo-implementation.js",
        sha256: fileHash(root, "src/demo-implementation.js")
      }
    ],
    runtimeEvidence: [
      {
        name: "node",
        command: "node",
        probe: {
          args: ["--version"],
          status: 0,
          signal: null,
          stdout: "vfixture",
          stderr: "",
          error: null
        }
      }
    ],
    environment: {
      node: "vfixture",
      platform: "fixture",
      arch: "fixture",
      runtimeTimeoutMs: 1
    },
    supportMatrixTraceability: {
      supportMatrix: "fixture"
    },
    summary: { total: 1, passed: 1, failed: 0 },
    results: [
      {
        name: "demo",
        source: "tests/language_completion/fixtures/demo/demo.ls",
        sourceSha256: demoSourceHash,
        status: "passed"
      }
    ],
    failures: []
  });

  writeText(root, "tests/clarity_canon/canon_harness.js", "\"use strict\";\n");
  writeJson(root, "tests/clarity_canon/manifest.json", { cases: [] });
  writeJson(root, "artifacts/clarity_canon/canon-report.json", {
    schemaVersion: 1,
    kind: "clarity:canon",
    generatedAt: "not-a-timestamp",
    summary: { total: 1, passed: 1, failed: 0 },
    results: [],
    failures: []
  });
  writeJson(root, "artifacts/clarity_canon/canon-fast-report.json", {
    schemaVersion: 1,
    kind: "clarity:canon",
    generatedAt: "not-a-timestamp",
    summary: { total: 1, passed: 1, failed: 0 },
    results: [],
    failures: []
  });

  writeText(root, "tests/actual_programs/fixtures/hello.ls", "print(\"hello\");\n");
  writeJson(root, "tests/actual_programs/manifest.json", {
    programs: [
      {
        name: "hello",
        source: "tests/actual_programs/fixtures/hello.ls",
        expectedOutputIncludes: ["hello"]
      }
    ]
  });
  writeText(root, "tests/actual_programs.test.js", "\"use strict\";\n");
  writeJson(root, "artifacts/conformance/actual-programs-report.json", {
    schemaVersion: 1,
    kind: "luascript:actual-programs:repository-legacy",
    generatedAt: "2026-01-01T00:00:00.000Z",
    boundary: {
      packageCompatibilityClaimed: false
    },
    inputs: {
      manifest: {
        path: "tests/actual_programs/manifest.json",
        sha256: fileHash(root, "tests/actual_programs/manifest.json")
      },
      harness: {
        path: "tests/actual_programs.test.js",
        sha256: fileHash(root, "tests/actual_programs.test.js")
      }
    },
    summary: {
      total: 1,
      passed: 1,
      failed: 0,
      notRun: 0,
      positiveRuntime: 1,
      expectedCompileDiagnostic: 0,
      expectedRuntimeDiagnostic: 0
    },
    results: [
      {
        name: "hello",
        source: "tests/actual_programs/fixtures/hello.ls",
        sourceSha256: fileHash(
          root,
          "tests/actual_programs/fixtures/hello.ls"
        ),
        classification: "positive-runtime",
        status: "passed"
      }
    ],
    failures: []
  });
  writeJson(root, "artifacts/clarity_canon/dogfood-report.json", {
    schemaVersion: 1,
    kind: "clarity:dogfood",
    generatedAt: "2026-01-01T00:00:00.000Z",
    summary: { total: 1, passed: 1, failed: 0 },
    results: [
      {
        name: "actual_hello",
        source: "tests/actual_programs/fixtures/hello.ls",
        tags: ["actual-program"],
        status: "passed"
      }
    ],
    failures: []
  });

  for (const source of [
    "src/parser/enhanced_parser.py",
    "src/transpiler/enhanced_transpiler.py",
    "tests/clarity_canon/runner_utils.js",
    "tests/parser_ownership.test.js"
  ]) {
    writeText(root, source, `fixture ${source}\n`);
  }

  writeText(root, "tests/conformance/input.json", "{}\n");
  for (const reportPath of [
    "artifacts/conformance/canonical-ir-conformance-report.json",
    "artifacts/conformance/denali-compatibility-matrix-report.json",
    "artifacts/conformance/dual-surface-compatibility-bridge-report.json",
    "artifacts/edge_matrix/edge-case-matrix-report.json",
    "artifacts/conformance/public-api-runtime-package-report.json",
    "artifacts/conformance/roundtrip-probe-report.json",
    "artifacts/conformance/schema-artifact-mapping-report.json",
    "artifacts/conformance/source-identity-probe-report.json",
    "artifacts/conformance/unsupported-diagnostics-report.json"
  ]) {
    makePassingReport(root, reportPath, "tests/conformance/input.json");
  }

  return root;
}

function fixtureSpec() {
  return {
    bundleImplementationSources: [
      "scripts/generate_release_evidence_bundle.js",
      "tests/release_evidence/release_evidence_bundle.test.js"
    ],
    clarityReports: [
      {
        id: "clarity:canon",
        path: "artifacts/clarity_canon/canon-report.json",
        inputs: [
          "tests/clarity_canon/canon_harness.js",
          "tests/clarity_canon/manifest.json"
        ]
      },
      {
        id: "clarity:canon-fast",
        path: "artifacts/clarity_canon/canon-fast-report.json",
        required: false,
        inputs: [
          "tests/clarity_canon/canon_harness.js",
          "tests/clarity_canon/manifest.json"
        ]
      }
    ],
    reportLanes: [
      {
        id: "conformance:canonical-ir",
        path: "artifacts/conformance/canonical-ir-conformance-report.json"
      },
      {
        id: "conformance:denali-compatibility-matrix",
        path: "artifacts/conformance/denali-compatibility-matrix-report.json"
      },
      {
        id: "conformance:dual-surface-compatibility",
        path:
          "artifacts/conformance/dual-surface-compatibility-bridge-report.json"
      },
      {
        id: "conformance:edge-case-matrix",
        path: "artifacts/edge_matrix/edge-case-matrix-report.json"
      },
      {
        id: "conformance:public-package",
        path: "artifacts/conformance/public-api-runtime-package-report.json"
      },
      {
        id: "conformance:roundtrip",
        path: "artifacts/conformance/roundtrip-probe-report.json"
      },
      {
        id: "conformance:schema-artifact-mapping",
        path: "artifacts/conformance/schema-artifact-mapping-report.json"
      },
      {
        id: "conformance:source-identity",
        path: "artifacts/conformance/source-identity-probe-report.json"
      },
      {
        id: "conformance:unsupported-diagnostics",
        path: "artifacts/conformance/unsupported-diagnostics-report.json"
      }
    ],
    languageManifestDirectory: "tests/language_completion/manifests",
    languageReportDirectory: "artifacts/language_completion",
    actualPrograms: {
      manifestPath: "tests/actual_programs/manifest.json",
      testPath: "tests/actual_programs.test.js",
      reportPath: "artifacts/conformance/actual-programs-report.json",
      dogfoodReportPath: "artifacts/clarity_canon/dogfood-report.json"
    },
    parserOwnership: {
      reportPath: "artifacts/conformance/parser-ownership-report.json",
      sources: [
        "src/parser/enhanced_parser.py",
        "src/transpiler/enhanced_transpiler.py",
        "tests/clarity_canon/runner_utils.js",
        "tests/parser_ownership.test.js"
      ],
      relatedReportPath:
        "artifacts/conformance/source-identity-probe-report.json"
    }
  };
}

function testCanonicalization() {
  assert.strictEqual(
    canonicalJson({ z: 1, a: { d: 4, b: 2 }, list: [{ y: 2, x: 1 }] }),
    canonicalJson({ list: [{ x: 1, y: 2 }], a: { b: 2, d: 4 }, z: 1 })
  );
  assert.strictEqual(
    sha256Canonical({ z: 1, a: 2 }),
    sha256Canonical({ a: 2, z: 1 })
  );
}

function testBundleDeterminismAndBlockers() {
  const root = makeFixtureRepository();
  try {
    const options = {
      repoRoot: root,
      inventorySpec: fixtureSpec(),
      environment: {
        node: "fixture-node",
        platform: "fixture-platform",
        arch: "fixture-arch",
        repositoryRoot: "."
      }
    };
    const first = buildReleaseEvidenceBundle({
      ...options,
      generatedAt: "2026-01-01T00:00:00.000Z"
    });
    const second = buildReleaseEvidenceBundle({
      ...options,
      generatedAt: "2026-01-02T00:00:00.000Z"
    });

    assert.notStrictEqual(first.generatedAt, second.generatedAt);
    assert.strictEqual(
      first.contentIdentity.evidenceSetSha256,
      second.contentIdentity.evidenceSetSha256
    );
    assert.strictEqual(
      first.contentIdentity.bundlePayloadSha256,
      second.contentIdentity.bundlePayloadSha256
    );
    assert.deepStrictEqual(
      first.evidence.map((entry) => entry.id),
      [...first.evidence.map((entry) => entry.id)].sort()
    );
    assert.strictEqual(
      first.evidence.find(
        (entry) => entry.id === "release-evidence-generator"
      ).state,
      "passing"
    );

    const language = first.evidence.find(
      (entry) => entry.id === "language:demo"
    );
    assert.strictEqual(language.state, "passing");
    assert.strictEqual(language.binding.status, "verified");
    assert(language.binding.referenceCount >= 2);

    const clarity = first.evidence.find(
      (entry) => entry.id === "clarity:canon"
    );
    assert.strictEqual(clarity.state, "unbound");
    assert(
      first.blockers.some(
        (entry) =>
          entry.evidenceId === "clarity:canon" &&
          entry.code === "UNBOUND_INPUT_PROVENANCE"
      )
    );
    const informationalClarity = first.evidence.find(
      (entry) => entry.id === "clarity:canon-fast"
    );
    assert.strictEqual(informationalClarity.required, false);
    assert.strictEqual(informationalClarity.state, "unbound");
    assert(
      first.warnings.some(
        (entry) =>
          entry.evidenceId === "clarity:canon-fast" &&
          entry.code === "UNBOUND_INPUT_PROVENANCE" &&
          entry.severity === "informational-warning"
      )
    );
    assert(
      !first.blockers.some(
        (entry) => entry.evidenceId === "clarity:canon-fast"
      )
    );
    assert.strictEqual(first.summary.informationalEvidenceEntries, 1);
    assert.strictEqual(first.summary.informationalWarnings, 1);

    const settledInputTime = new Date(Date.now() - 60000);
    for (const inputPath of [
      "tests/clarity_canon/canon_harness.js",
      "tests/clarity_canon/manifest.json"
    ]) {
      fs.utimesSync(
        path.join(root, inputPath),
        settledInputTime,
        settledInputTime
      );
    }
    writeJson(root, "artifacts/clarity_canon/canon-report.json", {
      schemaVersion: 1,
      kind: "clarity:canon",
      generatedAt: new Date().toISOString(),
      summary: { total: 1, passed: 1, failed: 0 },
      results: [],
      failures: []
    });
    const refreshedClarity = buildReleaseEvidenceBundle({
      ...options,
      generatedAt: "2026-01-02T06:00:00.000Z"
    });
    const refreshedCanon = refreshedClarity.evidence.find(
      (entry) => entry.id === "clarity:canon"
    );
    assert.strictEqual(refreshedCanon.state, "passing");
    assert.strictEqual(
      refreshedCanon.binding.status,
      "verified-by-input-mtime"
    );
    assert(
      !refreshedClarity.blockers.some(
        (entry) => entry.evidenceId === "clarity:canon"
      )
    );

    writeJson(root, "artifacts/clarity_canon/canon-report.json", {
      schemaVersion: 1,
      kind: "clarity:canon",
      generatedAt: new Date(Date.now() + 60000).toISOString(),
      summary: { total: 1, passed: 1, failed: 0 },
      results: [],
      failures: []
    });
    const futureDatedClarity = buildReleaseEvidenceBundle({
      ...options,
      generatedAt: "2026-01-02T09:00:00.000Z"
    });
    const futureDatedCanon = futureDatedClarity.evidence.find(
      (entry) => entry.id === "clarity:canon"
    );
    assert.strictEqual(futureDatedCanon.state, "unbound");
    assert.strictEqual(
      futureDatedCanon.binding.freshnessFallback.status,
      "unverifiable"
    );
    assert(
      futureDatedClarity.blockers.some(
        (entry) =>
          entry.evidenceId === "clarity:canon" &&
          entry.code === "UNBOUND_INPUT_PROVENANCE"
      )
    );

    const actualPrograms = first.evidence.find(
      (entry) => entry.id === "actual-programs"
    );
    assert.strictEqual(actualPrograms.state, "passing");
    assert.strictEqual(actualPrograms.summary.manifestPrograms, 1);
    assert.strictEqual(actualPrograms.summary.matchedResults, 1);
    assert.strictEqual(actualPrograms.summary.sourceHashBound, 1);

    const parserOwnership = first.evidence.find(
      (entry) => entry.id === "parser-ownership"
    );
    assert.strictEqual(parserOwnership.state, "missing");
    assert(
      first.blockers.some(
        (entry) =>
          entry.evidenceId === "parser-ownership" &&
          entry.code === "MISSING_EVIDENCE_REPORT"
      )
    );

    const outputPath =
      "artifacts/release_evidence/test-denali-release-evidence-bundle.json";
    const written = writeReleaseEvidenceBundle(first, outputPath, root);
    assert.strictEqual(written, outputPath);
    const onDisk = JSON.parse(
      fs.readFileSync(path.join(root, outputPath), "utf8")
    );
    assert.deepStrictEqual(onDisk, first);
    assert.strictEqual(
      onDisk.contentIdentity.evidenceSetSha256,
      first.contentIdentity.evidenceSetSha256
    );
    assert.strictEqual(
      onDisk.contentIdentity.evidenceSetSha256,
      sha256Canonical({
        policy: onDisk.policy,
        evidence: onDisk.evidence,
        blockers: onDisk.blockers,
        warnings: onDisk.warnings,
        summary: onDisk.summary
      })
    );
    assert.strictEqual(
      onDisk.contentIdentity.bundlePayloadSha256,
      sha256Canonical({
        schemaVersion: onDisk.schemaVersion,
        kind: onDisk.kind,
        command: onDisk.command,
        environment: onDisk.environment,
        policy: onDisk.policy,
        evidence: onDisk.evidence,
        blockers: onDisk.blockers,
        warnings: onDisk.warnings,
        summary: onDisk.summary
      })
    );

    makePassingReport(
      root,
      "artifacts/conformance/roundtrip-probe-report.json",
      "tests/conformance/input.json",
      { kind: "test:refreshed-passing-report" }
    );
    const stalePersistedBindings = validateHashReferences(
      root,
      collectEmbeddedHashReferences(onDisk)
    );
    assert(
      stalePersistedBindings.some(
        (entry) =>
          entry.path ===
            "artifacts/conformance/roundtrip-probe-report.json" &&
          entry.status === "mismatch"
      )
    );
    const liveCandidate = buildReleaseEvidenceBundle({
      ...options,
      generatedAt: "2026-01-02T09:30:00.000Z"
    });
    const liveCandidateBindings = validateHashReferences(
      root,
      collectEmbeddedHashReferences(liveCandidate)
    );
    assert(liveCandidateBindings.length > 0);
    assert(
      liveCandidateBindings.every((entry) => entry.status === "verified")
    );

    writeJson(
      root,
      "artifacts/conformance/denali-compatibility-matrix-report.json",
      {
        schemaVersion: 1,
        kind: "test:failing-compatibility-report",
        generatedAt: "2026-01-01T00:00:00.000Z",
        input: {
          path: "tests/conformance/input.json",
          sha256: fileHash(root, "tests/conformance/input.json")
        },
        summary: { total: 1, passed: 0, failed: 1 },
        results: [{ name: "one", status: "failed" }],
        failures: [{ name: "one" }]
      }
    );
    const failing = buildReleaseEvidenceBundle({
      ...options,
      generatedAt: "2026-01-02T12:00:00.000Z"
    });
    assert.strictEqual(
      failing.evidence.find(
        (entry) => entry.id === "conformance:denali-compatibility-matrix"
      ).state,
      "failing"
    );
    assert(
      failing.blockers.some(
        (entry) =>
          entry.evidenceId ===
            "conformance:denali-compatibility-matrix" &&
          entry.code === "FAILING_EVIDENCE_REPORT"
      )
    );
    makePassingReport(
      root,
      "artifacts/conformance/denali-compatibility-matrix-report.json",
      "tests/conformance/input.json"
    );

    writeText(
      root,
      "tests/language_completion/fixtures/demo/demo.ls",
      "let x = 2;\n"
    );
    const stale = buildReleaseEvidenceBundle({
      ...options,
      generatedAt: "2026-01-03T00:00:00.000Z"
    });
    const staleLanguage = stale.evidence.find(
      (entry) => entry.id === "language:demo"
    );
    assert.strictEqual(staleLanguage.state, "stale");
    assert(
      stale.blockers.some(
        (entry) =>
          entry.evidenceId === "language:demo" &&
          entry.code === "STALE_HASH_BINDING"
      )
    );
    assert.notStrictEqual(
      stale.contentIdentity.evidenceSetSha256,
      first.contentIdentity.evidenceSetSha256
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function main() {
  testCanonicalization();
  testBundleDeterminismAndBlockers();
  console.log("Release evidence bundle tests passed");
}

main();
