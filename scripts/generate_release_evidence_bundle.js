"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_PATH =
  "artifacts/release_evidence/denali-release-evidence-bundle.json";
const DEFAULT_COMMAND = "node scripts/generate_release_evidence_bundle.js";

const DEFAULT_INVENTORY_SPEC = Object.freeze({
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
      ],
      freshnessRoots: [
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/clarity_canon"
      ]
    },
    {
      id: "clarity:canon-fast",
      path: "artifacts/clarity_canon/canon-fast-report.json",
      required: false,
      inputs: [
        "tests/clarity_canon/canon_harness.js",
        "tests/clarity_canon/manifest.json"
      ],
      freshnessRoots: [
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/clarity_canon"
      ]
    },
    {
      id: "clarity:canon-heavy",
      path: "artifacts/clarity_canon/canon-heavy-report.json",
      required: false,
      inputs: [
        "tests/clarity_canon/canon_harness.js",
        "tests/clarity_canon/manifest.json"
      ],
      freshnessRoots: [
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/clarity_canon"
      ]
    },
    {
      id: "clarity:canon-languages",
      path: "artifacts/clarity_canon/canon-languages-report.json",
      inputs: [
        "tests/clarity_canon/canon_harness.js",
        "tests/clarity_canon/language_qualification_harness.js",
        "tests/clarity_canon/language_qualification_manifest.json"
      ],
      freshnessRoots: [
        "artifacts/language_completion",
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/clarity_canon",
        "tests/language_completion"
      ]
    },
    {
      id: "clarity:canon-legacy",
      path: "artifacts/clarity_canon/canon-legacy-report.json",
      required: false,
      inputs: [
        "tests/clarity_canon/canon_harness.js",
        "tests/clarity_canon/manifest.json"
      ],
      freshnessRoots: [
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/clarity_canon"
      ]
    },
    {
      id: "clarity:canon-setup-blocked",
      path: "artifacts/clarity_canon/canon-setup-blocked-report.json",
      required: false,
      inputs: [
        "tests/clarity_canon/canon_harness.js",
        "tests/clarity_canon/language_qualification_harness.js",
        "tests/clarity_canon/language_qualification_manifest.json"
      ],
      freshnessRoots: [
        "artifacts/language_completion",
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/clarity_canon",
        "tests/language_completion"
      ]
    },
    {
      id: "clarity:canon-super",
      path: "artifacts/clarity_canon/canon-super-report.json",
      inputs: [
        "tests/clarity_canon/canon_harness.js",
        "tests/clarity_canon/manifest.json"
      ],
      freshnessRoots: [
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/clarity_canon"
      ]
    },
    {
      id: "clarity:dogfood",
      path: "artifacts/clarity_canon/dogfood-report.json",
      inputs: [
        "tests/actual_programs/manifest.json",
        "tests/clarity_canon/dogfood_harness.js"
      ],
      freshnessRoots: [
        "package-lock.json",
        "package.json",
        "runtime",
        "src",
        "tests/actual_programs",
        "tests/clarity_canon"
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
});

function normalizeRelativePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function isInsideRoot(repoRoot, filePath) {
  const relative = path.relative(repoRoot, filePath);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function resolveRepoPath(repoRoot, relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const absolute = path.resolve(repoRoot, normalized);
  if (!isInsideRoot(repoRoot, absolute)) {
    throw new Error(`Evidence path escapes repository root: ${relativePath}`);
  }
  return { normalized, absolute };
}

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      output[key] = canonicalize(value[key]);
    }
    return output;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256Canonical(value) {
  return sha256Buffer(Buffer.from(canonicalJson(value), "utf8"));
}

function snapshotFile(repoRoot, relativePath) {
  let resolved;
  try {
    resolved = resolveRepoPath(repoRoot, relativePath);
  } catch (error) {
    return {
      path: normalizeRelativePath(relativePath),
      exists: false,
      error: String(error.message || error)
    };
  }

  if (!fs.existsSync(resolved.absolute)) {
    return {
      path: resolved.normalized,
      exists: false,
      error: "missing"
    };
  }

  const stat = fs.statSync(resolved.absolute);
  if (!stat.isFile()) {
    return {
      path: resolved.normalized,
      exists: false,
      error: "not-a-file"
    };
  }

  const data = fs.readFileSync(resolved.absolute);
  return {
    path: resolved.normalized,
    exists: true,
    sha256: sha256Buffer(data),
    sizeBytes: data.length
  };
}

function readJsonSnapshot(repoRoot, relativePath) {
  const file = snapshotFile(repoRoot, relativePath);
  if (!file.exists) {
    return { file, value: null, parseError: null };
  }
  try {
    const resolved = resolveRepoPath(repoRoot, relativePath);
    return {
      file,
      value: JSON.parse(fs.readFileSync(resolved.absolute, "utf8")),
      parseError: null
    };
  } catch (error) {
    return {
      file,
      value: null,
      parseError: String(error.message || error)
    };
  }
}

function compactSummary(summary) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return null;
  }
  return canonicalize(summary);
}

function reportFailureState(report) {
  if (!report || typeof report !== "object") {
    return { state: "unverifiable", reason: "report is not an object" };
  }

  const summary = report.summary;
  const failureCount = Array.isArray(report.failures)
    ? report.failures.length
    : 0;
  const blockerCount = Array.isArray(report.blockers)
    ? report.blockers.length
    : 0;
  const failingStatusPattern =
    /^(fail|failed|error|blocked|not[-_ ]?ready|not[-_ ]?run)$/i;
  const resultFailures = Array.isArray(report.results)
    ? report.results.filter((entry) =>
        failingStatusPattern.test(String(entry.status || ""))
      ).length
    : 0;
  const checkFailures = Array.isArray(report.checks)
    ? report.checks.filter(
        (entry) =>
          entry &&
          (entry.passed === false ||
            failingStatusPattern.test(String(entry.status || "")))
      ).length
    : 0;
  const runtimeProbeFailures = Array.isArray(report.runtimeEvidence)
    ? report.runtimeEvidence.filter(
        (entry) =>
          entry &&
          entry.probe &&
          (entry.probe.status !== 0 || entry.probe.error)
      ).length
    : 0;
  const summaryFailed =
    summary && typeof summary.failed === "number" ? summary.failed : null;
  const summaryNotRun =
    summary && typeof summary.notRun === "number" ? summary.notRun : 0;
  const nestedSummaryFailures = [];

  function findNestedFailures(value, location) {
    if (!value || typeof value !== "object") {
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const childLocation = `${location}.${key}`;
      if (
        key === "failed" &&
        typeof child === "number" &&
        child > 0
      ) {
        nestedSummaryFailures.push({
          path: childLocation,
          count: child
        });
      } else if (child && typeof child === "object") {
        findNestedFailures(child, childLocation);
      }
    }
  }
  findNestedFailures(summary, "$.summary");

  if (
    (summaryFailed !== null && summaryFailed > 0) ||
    summaryNotRun > 0 ||
    nestedSummaryFailures.length > 0 ||
    failureCount > 0 ||
    blockerCount > 0 ||
    resultFailures > 0 ||
    checkFailures > 0 ||
    runtimeProbeFailures > 0 ||
    failingStatusPattern.test(String(report.status || ""))
  ) {
    return {
      state: "failing",
      reason: "report contains one or more declared failures",
      summaryFailed,
      summaryNotRun,
      nestedSummaryFailures,
      failureCount,
      blockerCount,
      resultFailures,
      checkFailures,
      runtimeProbeFailures
    };
  }

  if (summaryFailed === 0) {
    return {
      state: "passing",
      reason: "report summary declares zero failures",
      summaryFailed,
      summaryNotRun,
      nestedSummaryFailures,
      failureCount,
      blockerCount,
      resultFailures,
      checkFailures,
      runtimeProbeFailures
    };
  }

  return {
    state: "unverifiable",
    reason: "report has no numeric summary.failed field",
    summaryFailed,
    summaryNotRun,
    nestedSummaryFailures,
    failureCount,
    blockerCount,
    resultFailures,
    checkFailures,
    runtimeProbeFailures
  };
}

function collectEmbeddedHashReferences(report) {
  const references = new Map();

  function addReference(referencePath, expectedSha256, location) {
    if (
      typeof referencePath !== "string" ||
      !/^[a-f0-9]{64}$/i.test(String(expectedSha256 || ""))
    ) {
      return;
    }
    const normalized = normalizeRelativePath(referencePath);
    const key = `${normalized}\u0000${String(expectedSha256).toLowerCase()}`;
    if (!references.has(key)) {
      references.set(key, {
        path: normalized,
        expectedSha256: String(expectedSha256).toLowerCase(),
        locations: []
      });
    }
    references.get(key).locations.push(location || "$");
  }

  function visit(value, location) {
    if (!value || typeof value !== "object") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${location}[${index}]`));
      return;
    }

    addReference(value.path, value.sha256, location);
    addReference(value.source, value.sourceSha256, location);

    for (const key of Object.keys(value).sort()) {
      visit(value[key], `${location}.${key}`);
    }
  }

  visit(report, "$");
  return Array.from(references.values())
    .map((entry) => ({
      ...entry,
      locations: Array.from(new Set(entry.locations)).sort()
    }))
    .sort((left, right) => {
      const pathCompare = left.path.localeCompare(right.path);
      return pathCompare || left.expectedSha256.localeCompare(right.expectedSha256);
    });
}

function validateHashReferences(repoRoot, references) {
  return references.map((reference) => {
    const snapshot = snapshotFile(repoRoot, reference.path);
    if (!snapshot.exists) {
      return {
        ...reference,
        status: "missing",
        actualSha256: null,
        error: snapshot.error
      };
    }
    return {
      ...reference,
      status:
        snapshot.sha256 === reference.expectedSha256 ? "verified" : "mismatch",
      actualSha256: snapshot.sha256,
      sizeBytes: snapshot.sizeBytes
    };
  });
}

function blocker(code, evidenceId, evidencePath, message) {
  return {
    severity: "release-blocking",
    code,
    evidenceId,
    path: normalizeRelativePath(evidencePath),
    message
  };
}

function partitionIssues(issues, required) {
  if (required) {
    return { blockers: issues, warnings: [] };
  }
  return {
    blockers: [],
    warnings: issues.map((entry) => ({
      ...entry,
      severity: "informational-warning"
    }))
  };
}

function reportSnapshot(jsonSnapshot) {
  if (!jsonSnapshot.file.exists) {
    return jsonSnapshot.file;
  }
  if (jsonSnapshot.parseError) {
    return {
      ...jsonSnapshot.file,
      parseError: jsonSnapshot.parseError
    };
  }
  const report = jsonSnapshot.value;
  return {
    ...jsonSnapshot.file,
    schemaVersion:
      Object.prototype.hasOwnProperty.call(report, "schemaVersion")
        ? report.schemaVersion
        : null,
    kind: typeof report.kind === "string" ? report.kind : null,
    generatedAt:
      typeof report.generatedAt === "string" ? report.generatedAt : null,
    declaredStatus:
      typeof report.status === "string" ? report.status : null,
    summary: compactSummary(report.summary),
    failuresCount: Array.isArray(report.failures)
      ? report.failures.length
      : null
  };
}

function resultSourceSnapshots(repoRoot, report) {
  const paths = new Set();
  for (const result of Array.isArray(report && report.results)
    ? report.results
    : []) {
    for (const field of ["script", "source"]) {
      if (
        typeof result[field] === "string" &&
        !path.isAbsolute(result[field])
      ) {
        paths.add(normalizeRelativePath(result[field]));
      }
    }
  }
  return Array.from(paths)
    .sort()
    .map((entry) => snapshotFile(repoRoot, entry));
}

function assessMtimeFreshness(
  repoRoot,
  reportPath,
  reportGeneratedAt,
  inputPaths
) {
  const candidates = new Map();
  const missingInputs = [];
  const precisionToleranceMs = 1;
  const ignoredDirectories = new Set([
    ".git",
    ".pytest_cache",
    "__pycache__",
    "node_modules"
  ]);
  const ignoredFileExtensions = new Set([".pyc", ".pyo"]);

  function visit(relativePath) {
    let resolved;
    try {
      resolved = resolveRepoPath(repoRoot, relativePath);
    } catch (error) {
      missingInputs.push({
        path: normalizeRelativePath(relativePath),
        error: String(error.message || error)
      });
      return;
    }
    if (!fs.existsSync(resolved.absolute)) {
      missingInputs.push({ path: resolved.normalized, error: "missing" });
      return;
    }

    let stat;
    try {
      stat = fs.lstatSync(resolved.absolute);
    } catch (error) {
      missingInputs.push({
        path: resolved.normalized,
        error: String(error.message || error)
      });
      return;
    }
    if (stat.isSymbolicLink()) {
      missingInputs.push({
        path: resolved.normalized,
        error: "symbolic-link-not-followed"
      });
      return;
    }
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(resolved.absolute).sort()) {
        if (!ignoredDirectories.has(child)) {
          visit(`${resolved.normalized}/${child}`);
        }
      }
      return;
    }
    if (!stat.isFile()) {
      return;
    }
    if (ignoredFileExtensions.has(path.extname(resolved.normalized))) {
      return;
    }
    try {
      candidates.set(resolved.normalized, {
        path: resolved.normalized,
        sizeBytes: stat.size,
        sha256: sha256Buffer(fs.readFileSync(resolved.absolute)),
        modifiedAt: new Date(stat.mtimeMs).toISOString(),
        mtimeMs: stat.mtimeMs
      });
    } catch (error) {
      missingInputs.push({
        path: resolved.normalized,
        error: String(error.message || error)
      });
    }
  }

  const inputRoots = Array.from(
    new Set((inputPaths || []).map(normalizeRelativePath))
  ).sort();
  for (const inputPath of inputRoots) {
    visit(inputPath);
  }

  const files = Array.from(candidates.values()).sort((left, right) =>
    left.path.localeCompare(right.path)
  );
  const newest = files.reduce((current, entry) => {
    if (
      !current ||
      entry.mtimeMs > current.mtimeMs ||
      (entry.mtimeMs === current.mtimeMs &&
        entry.path.localeCompare(current.path) < 0)
    ) {
      return entry;
    }
    return current;
  }, null);
  const reportGeneratedAtMs = Date.parse(String(reportGeneratedAt || ""));
  let reportFileMtimeMs = null;
  let reportFileModifiedAt = null;
  try {
    const resolvedReport = resolveRepoPath(repoRoot, reportPath);
    const reportStat = fs.statSync(resolvedReport.absolute);
    reportFileMtimeMs = reportStat.mtimeMs;
    reportFileModifiedAt = new Date(reportStat.mtimeMs).toISOString();
  } catch (error) {
    missingInputs.push({
      path: normalizeRelativePath(reportPath),
      error: `report-mtime-unavailable: ${String(error.message || error)}`
    });
  }
  const inputSet = files.map((entry) => ({
    path: entry.path,
    sizeBytes: entry.sizeBytes,
    sha256: entry.sha256,
    modifiedAt: entry.modifiedAt
  }));
  const inputContentSet = files.map((entry) => ({
    path: entry.path,
    sizeBytes: entry.sizeBytes,
    sha256: entry.sha256
  }));

  let status = "unverifiable";
  let reason = "report generatedAt is missing or invalid";
  if (missingInputs.length > 0) {
    reason = `${missingInputs.length} freshness input(s) could not be inspected`;
  } else if (!newest) {
    reason = "no freshness input files were discovered";
  } else if (
    Number.isFinite(reportGeneratedAtMs) &&
    Number.isFinite(reportFileMtimeMs) &&
    reportGeneratedAtMs > reportFileMtimeMs + precisionToleranceMs
  ) {
    reason =
      "report generatedAt is later than the report file mtime and cannot be trusted as a freshness bound";
  } else if (Number.isFinite(reportGeneratedAtMs)) {
    if (reportGeneratedAtMs + precisionToleranceMs >= newest.mtimeMs) {
      status = "verified-by-input-mtime";
      reason =
        "report generatedAt is at or after the newest required input modification";
    } else {
      status = "stale";
      reason =
        "one or more required inputs were modified after report generatedAt";
    }
  }

  return {
    status,
    reason,
    reportGeneratedAt:
      Number.isFinite(reportGeneratedAtMs)
        ? new Date(reportGeneratedAtMs).toISOString()
        : reportGeneratedAt || null,
    reportFileModifiedAt,
    generatedAtAheadOfReportFileByMs:
      Number.isFinite(reportGeneratedAtMs) &&
      Number.isFinite(reportFileMtimeMs)
        ? Math.max(
            0,
            Math.ceil(
              reportGeneratedAtMs -
                reportFileMtimeMs -
                precisionToleranceMs
            )
          )
        : null,
    newestInput: newest
      ? {
          path: newest.path,
          modifiedAt: newest.modifiedAt,
          newerThanReportByMs: Number.isFinite(reportGeneratedAtMs)
            ? Math.max(
                0,
                Math.ceil(
                  newest.mtimeMs -
                    reportGeneratedAtMs -
                    precisionToleranceMs
                )
              )
            : null
        }
      : null,
    precisionToleranceMs,
    inputRoots,
    inputFiles: files.length,
    inputContentSetSha256: sha256Canonical(inputContentSet),
    inputMetadataSetSha256: sha256Canonical(inputSet),
    assurance:
      "The bundle hash-binds the current input content set, while freshness relies on local generatedAt/file-mtime ordering because the legacy report does not embed those hashes.",
    missingInputs: missingInputs.sort((left, right) =>
      left.path.localeCompare(right.path)
    )
  };
}

function inventoryReport(repoRoot, definition, options = {}) {
  const id = definition.id;
  const required = definition.required !== false;
  const jsonSnapshot = readJsonSnapshot(repoRoot, definition.path);
  const blockers = [];
  const expectedInputs = (definition.inputs || [])
    .map((entry) => snapshotFile(repoRoot, entry))
    .sort((left, right) => left.path.localeCompare(right.path));

  for (const input of expectedInputs) {
    if (!input.exists) {
      blockers.push(
        blocker(
          "MISSING_EVIDENCE_INPUT",
          id,
          input.path,
          `Required input is unavailable: ${input.error || "missing"}`
        )
      );
    }
  }

  if (!jsonSnapshot.file.exists) {
    blockers.push(
      blocker(
        "MISSING_EVIDENCE_REPORT",
        id,
        definition.path,
        "Required durable evidence report is missing"
      )
    );
    return {
      entry: {
        id,
        lane: options.lane || "release-evidence",
        required,
        state: "missing",
        report: reportSnapshot(jsonSnapshot),
        expectedInputs,
        binding: {
          status: "not-evaluated",
          referenceCount: 0,
          verifiedCount: 0,
          mismatchCount: 0,
          missingCount: 0,
          references: []
        }
      },
      ...partitionIssues(blockers, required)
    };
  }

  if (jsonSnapshot.parseError) {
    blockers.push(
      blocker(
        "INVALID_EVIDENCE_JSON",
        id,
        definition.path,
        `Evidence report is not valid JSON: ${jsonSnapshot.parseError}`
      )
    );
    return {
      entry: {
        id,
        lane: options.lane || "release-evidence",
        required,
        state: "invalid",
        report: reportSnapshot(jsonSnapshot),
        expectedInputs,
        binding: {
          status: "not-evaluated",
          referenceCount: 0,
          verifiedCount: 0,
          mismatchCount: 0,
          missingCount: 0,
          references: []
        }
      },
      ...partitionIssues(blockers, required)
    };
  }

  const report = jsonSnapshot.value;
  const reportState = reportFailureState(report);
  const references = validateHashReferences(
    repoRoot,
    collectEmbeddedHashReferences(report)
  );
  const verifiedCount = references.filter(
    (entry) => entry.status === "verified"
  ).length;
  const mismatchCount = references.filter(
    (entry) => entry.status === "mismatch"
  ).length;
  const missingCount = references.filter(
    (entry) => entry.status === "missing"
  ).length;
  const observedInputs = options.captureResultPaths
    ? resultSourceSnapshots(repoRoot, report)
    : [];
  for (const observed of observedInputs) {
    if (!observed.exists) {
      blockers.push(
        blocker(
          "MISSING_EVIDENCE_INPUT",
          id,
          observed.path,
          `Report names an unavailable result input: ${observed.error || "missing"}`
        )
      );
    }
  }
  const freshnessFallback =
    references.length === 0 && options.allowMtimeFreshness
      ? assessMtimeFreshness(
          repoRoot,
          definition.path,
          report.generatedAt,
          [
            ...(definition.inputs || []),
            ...(definition.freshnessRoots || []),
            ...observedInputs.map((entry) => entry.path)
          ]
        )
      : null;
  let bindingStatus =
    mismatchCount > 0 || missingCount > 0
      ? "stale"
      : references.length > 0
        ? "verified"
        : "unverifiable";
  if (freshnessFallback) {
    bindingStatus = freshnessFallback.status;
  }

  if (reportState.state === "failing") {
    blockers.push(
      blocker(
        "FAILING_EVIDENCE_REPORT",
        id,
        definition.path,
        reportState.reason
      )
    );
  } else if (reportState.state === "unverifiable") {
    blockers.push(
      blocker(
        "UNVERIFIABLE_REPORT_RESULT",
        id,
        definition.path,
        reportState.reason
      )
    );
  }

  if (mismatchCount > 0 || missingCount > 0) {
    blockers.push(
      blocker(
        "STALE_HASH_BINDING",
        id,
        definition.path,
        `${mismatchCount} embedded hash reference(s) mismatch and ${missingCount} referenced file(s) are missing`
      )
    );
  } else if (references.length === 0 && options.requireBindings !== false) {
    if (
      freshnessFallback &&
      freshnessFallback.status === "verified-by-input-mtime"
    ) {
      // The legacy report is accepted only through the explicit fail-closed
      // freshness fallback recorded in the bundle.
    } else if (freshnessFallback && freshnessFallback.status === "stale") {
      blockers.push(
        blocker(
          "STALE_MTIME_FRESHNESS",
          id,
          definition.path,
          `${freshnessFallback.reason}; newest input ${freshnessFallback.newestInput.path} is ${freshnessFallback.newestInput.newerThanReportByMs} ms newer`
        )
      );
    } else {
      blockers.push(
        blocker(
          "UNBOUND_INPUT_PROVENANCE",
          id,
          definition.path,
          freshnessFallback
            ? `Report has no embedded hashes and the mtime fallback is unverifiable: ${freshnessFallback.reason}`
            : "Report has no verifiable repository path/SHA-256 bindings to prove it was generated from the current inputs"
        )
      );
    }
  }

  let state = reportState.state;
  if (
    bindingStatus === "stale" ||
    observedInputs.some((entry) => !entry.exists)
  ) {
    state = "stale";
  } else if (
    bindingStatus === "unverifiable" &&
    options.requireBindings !== false &&
    state === "passing"
  ) {
    state = "unbound";
  }

  return {
    entry: {
      id,
      lane: options.lane || "release-evidence",
      required,
      state,
      report: reportSnapshot(jsonSnapshot),
      expectedInputs,
      observedInputs,
      resultAssessment: reportState,
      binding: {
        status: bindingStatus,
        referenceCount: references.length,
        verifiedCount,
        mismatchCount,
        missingCount,
        references,
        freshnessFallback
      }
    },
    ...partitionIssues(blockers, required)
  };
}

function listJsonBasenames(repoRoot, relativeDirectory, suffix) {
  let resolved;
  try {
    resolved = resolveRepoPath(repoRoot, relativeDirectory);
  } catch (_error) {
    return [];
  }
  if (
    !fs.existsSync(resolved.absolute) ||
    !fs.statSync(resolved.absolute).isDirectory()
  ) {
    return [];
  }
  return fs
    .readdirSync(resolved.absolute)
    .filter((entry) => entry.endsWith(suffix))
    .map((entry) => entry.slice(0, -suffix.length))
    .sort();
}

function assessLanguageReportBinding(
  repoRoot,
  name,
  manifestPath,
  reportPath
) {
  const manifestSnapshot = readJsonSnapshot(repoRoot, manifestPath);
  const reportSnapshotValue = readJsonSnapshot(repoRoot, reportPath);
  if (
    !manifestSnapshot.value ||
    !reportSnapshotValue.value ||
    manifestSnapshot.parseError ||
    reportSnapshotValue.parseError
  ) {
    return {
      status: "not-evaluated",
      schemaVersion: null,
      issues: ["manifest or report is unavailable or invalid"]
    };
  }

  const manifest = manifestSnapshot.value;
  const report = reportSnapshotValue.value;
  const schemaVersion = Number(report.schemaVersion || 0);
  const issues = [];
  const manifestFixtures = Array.isArray(manifest.fixtures)
    ? manifest.fixtures
    : [];
  const reportFixtures =
    report.manifest && Array.isArray(report.manifest.fixtures)
      ? report.manifest.fixtures
      : [];
  const results = Array.isArray(report.results) ? report.results : [];
  const reportFixtureMap = new Map(
    reportFixtures.map((entry) => [String(entry.name || ""), entry])
  );
  const resultMap = new Map(
    results.map((entry) => [String(entry.name || ""), entry])
  );

  if (schemaVersion < 2) {
    issues.push(`schemaVersion ${report.schemaVersion || "missing"} is below 2`);
  }
  if (!report.manifest || typeof report.manifest !== "object") {
    issues.push("report.manifest is missing");
  } else {
    if (normalizeRelativePath(report.manifest.path) !== manifestPath) {
      issues.push("report.manifest.path does not name the governing manifest");
    }
    if (report.manifest.sha256 !== manifestSnapshot.file.sha256) {
      issues.push("report.manifest.sha256 does not match the current manifest");
    }
    if (report.manifest.fixtureCount !== manifestFixtures.length) {
      issues.push("report.manifest.fixtureCount disagrees with the manifest");
    }
    if (report.manifest.status !== manifest.status) {
      issues.push("report.manifest.status disagrees with the manifest");
    }
    if (report.manifest.version !== manifest.schemaVersion) {
      issues.push("report.manifest.version disagrees with the manifest");
    }
    if (report.manifest.supportSlice !== manifest.supportSlice) {
      issues.push("report.manifest.supportSlice disagrees with the manifest");
    }
  }
  if (report.language !== manifest.language) {
    issues.push("report.language disagrees with the manifest");
  }
  if (report.supportSlice !== manifest.supportSlice) {
    issues.push("report.supportSlice disagrees with the manifest");
  }
  if (reportFixtures.length !== manifestFixtures.length) {
    issues.push("report manifest fixture coverage is not exact");
  }
  if (results.length !== manifestFixtures.length) {
    issues.push("report result coverage is not exact");
  }
  if (
    new Set(manifestFixtures.map((entry) => String(entry.name || ""))).size !==
    manifestFixtures.length
  ) {
    issues.push("governing manifest fixtures contain duplicate names");
  }
  if (
    new Set(reportFixtures.map((entry) => String(entry.name || ""))).size !==
    reportFixtures.length
  ) {
    issues.push("report manifest fixtures contain duplicate names");
  }
  if (
    new Set(results.map((entry) => String(entry.name || ""))).size !==
    results.length
  ) {
    issues.push("report results contain duplicate names");
  }
  if (
    !report.summary ||
    report.summary.total !== manifestFixtures.length ||
    report.summary.passed !== manifestFixtures.length ||
    report.summary.failed !== 0
  ) {
    issues.push("report summary does not exactly close the manifest fixture set");
  }
  if (
    results.some(
      (entry) => !entry || String(entry.status || "").toLowerCase() !== "passed"
    )
  ) {
    issues.push("one or more language results are not explicitly passed");
  }

  let verifiedFixtureSources = 0;
  let verifiedManifestEntries = 0;
  let verifiedResults = 0;
  for (const fixture of manifestFixtures) {
    const fixtureName = String(fixture.name || "");
    const reportFixture = reportFixtureMap.get(fixtureName);
    const result = resultMap.get(fixtureName);
    const source = snapshotFile(repoRoot, fixture.source);
    const manifestEntrySha256 = sha256Buffer(
      Buffer.from(JSON.stringify(fixture), "utf8")
    );

    if (!reportFixture) {
      issues.push(`fixture ${fixtureName} is absent from report.manifest.fixtures`);
    } else {
      if (normalizeRelativePath(reportFixture.source) !== source.path) {
        issues.push(`fixture ${fixtureName} source path disagrees`);
      }
      if (reportFixture.manifestEntrySha256 !== manifestEntrySha256) {
        issues.push(`fixture ${fixtureName} manifest entry hash disagrees`);
      } else {
        verifiedManifestEntries += 1;
      }
      if (
        !source.exists ||
        reportFixture.sourceSha256 !== source.sha256 ||
        reportFixture.sizeBytes !== source.sizeBytes
      ) {
        issues.push(`fixture ${fixtureName} source hash or size disagrees`);
      } else {
        verifiedFixtureSources += 1;
      }
    }

    if (!result) {
      issues.push(`fixture ${fixtureName} has no result`);
    } else if (
      normalizeRelativePath(result.source) !== source.path ||
      !source.exists ||
      result.sourceSha256 !== source.sha256
    ) {
      issues.push(`fixture ${fixtureName} result source binding disagrees`);
    } else {
      verifiedResults += 1;
    }
  }

  const expectedNames = new Set(
    manifestFixtures.map((entry) => String(entry.name || ""))
  );
  for (const reportFixture of reportFixtures) {
    if (!expectedNames.has(String(reportFixture.name || ""))) {
      issues.push(
        `unexpected report manifest fixture ${String(reportFixture.name || "")}`
      );
    }
  }
  for (const result of results) {
    if (!expectedNames.has(String(result.name || ""))) {
      issues.push(`unexpected report result ${String(result.name || "")}`);
    }
  }

  if (
    !Array.isArray(report.implementationEvidence) ||
    report.implementationEvidence.length === 0
  ) {
    issues.push("implementationEvidence is missing");
  }
  if (
    !Array.isArray(report.runtimeEvidence) ||
    report.runtimeEvidence.length === 0
  ) {
    issues.push("runtimeEvidence is missing");
  } else if (
    report.runtimeEvidence.some(
      (entry) =>
        !entry ||
        !entry.probe ||
        entry.probe.status !== 0 ||
        entry.probe.error
    )
  ) {
    issues.push("one or more runtime version probes did not succeed");
  }
  if (!report.environment || typeof report.environment !== "object") {
    issues.push("environment metadata is missing");
  }
  if (
    !report.supportMatrixTraceability ||
    typeof report.supportMatrixTraceability !== "object"
  ) {
    issues.push("supportMatrixTraceability is missing");
  }

  return {
    status:
      schemaVersion < 2
        ? "unverifiable"
        : issues.length === 0
          ? "verified"
          : "stale",
    schemaVersion: report.schemaVersion || null,
    manifestPathMatches:
      report.manifest &&
      normalizeRelativePath(report.manifest.path) === manifestPath,
    manifestHashMatches:
      report.manifest &&
      report.manifest.sha256 === manifestSnapshot.file.sha256,
    manifestFixtures: manifestFixtures.length,
    reportManifestFixtures: reportFixtures.length,
    results: results.length,
    verifiedManifestEntries,
    verifiedFixtureSources,
    verifiedResults,
    implementationFiles: Array.isArray(report.implementationEvidence)
      ? report.implementationEvidence.length
      : 0,
    runtimeProbes: Array.isArray(report.runtimeEvidence)
      ? report.runtimeEvidence.length
      : 0,
    issues: Array.from(new Set(issues)).sort()
  };
}

function inventoryLanguageReports(repoRoot, spec) {
  const manifestNames = listJsonBasenames(
    repoRoot,
    spec.languageManifestDirectory,
    ".json"
  );
  const reportNames = listJsonBasenames(
    repoRoot,
    spec.languageReportDirectory,
    "-report.json"
  );
  const names = Array.from(new Set([...manifestNames, ...reportNames])).sort();
  const entries = [];
  const blockers = [];
  const warnings = [];

  for (const name of names) {
    const definition = {
      id: `language:${name}`,
      path: `${spec.languageReportDirectory}/${name}-report.json`,
      inputs: [`${spec.languageManifestDirectory}/${name}.json`]
    };
    const result = inventoryReport(repoRoot, definition, {
      lane: "language-completion",
      requireBindings: true
    });
    const languageBinding = assessLanguageReportBinding(
      repoRoot,
      name,
      definition.inputs[0],
      definition.path
    );
    result.entry.languageBinding = languageBinding;

    if (!manifestNames.includes(name)) {
      result.blockers.push(
        blocker(
          "MISSING_LANGUAGE_MANIFEST",
          definition.id,
          definition.inputs[0],
          "A language report exists without its governing manifest"
        )
      );
      result.entry.state = "missing";
    }
    if (!reportNames.includes(name)) {
      result.entry.state = "missing";
    } else if (languageBinding.status === "stale") {
      result.entry.state = "stale";
      result.blockers.push(
        blocker(
          "STALE_LANGUAGE_REPORT_BINDING",
          definition.id,
          definition.path,
          `${languageBinding.issues.length} language report provenance or coverage check(s) failed`
        )
      );
    }
    entries.push(result.entry);
    blockers.push(...result.blockers);
    warnings.push(...result.warnings);
  }

  if (names.length === 0) {
    blockers.push(
      blocker(
        "MISSING_LANGUAGE_INVENTORY",
        "language:*",
        spec.languageManifestDirectory,
        "No language manifests or reports were discovered"
      )
    );
  }

  return { entries, blockers, warnings };
}

function classifyActualProgram(program) {
  if (program && program.expectedFailure) {
    return "expected-compile-diagnostic";
  }
  if (program && program.expectedRuntimeFailure) {
    return "expected-runtime-diagnostic";
  }
  return "positive-runtime";
}

function inventoryActualPrograms(repoRoot, spec) {
  const id = "actual-programs";
  const manifestSnapshot = readJsonSnapshot(repoRoot, spec.manifestPath);
  const primaryInventory = inventoryReport(
    repoRoot,
    {
      id,
      path: spec.reportPath,
      inputs: [spec.manifestPath, spec.testPath]
    },
    {
      lane: "actual-programs",
      requireBindings: true
    }
  );
  const reportJson = readJsonSnapshot(repoRoot, spec.reportPath);
  const dogfoodSnapshot = readJsonSnapshot(repoRoot, spec.dogfoodReportPath);
  const blockers = [...primaryInventory.blockers];

  if (!manifestSnapshot.file.exists) {
    blockers.push(
      blocker(
        "MISSING_EVIDENCE_MANIFEST",
        id,
        spec.manifestPath,
        "Actual-program manifest is missing"
      )
    );
  } else if (manifestSnapshot.parseError) {
    blockers.push(
      blocker(
        "INVALID_EVIDENCE_JSON",
        id,
        spec.manifestPath,
        `Actual-program manifest is invalid JSON: ${manifestSnapshot.parseError}`
      )
    );
  }

  const manifestPrograms =
    manifestSnapshot.value && Array.isArray(manifestSnapshot.value.programs)
      ? manifestSnapshot.value.programs
      : [];
  const primaryResults =
    reportJson.value && Array.isArray(reportJson.value.results)
      ? reportJson.value.results
      : [];
  const resultByName = new Map();
  for (const entry of primaryResults) {
    if (entry && typeof entry.name === "string") {
      resultByName.set(entry.name, entry);
      if (entry.name.startsWith("actual_")) {
        resultByName.set(entry.name.slice("actual_".length), entry);
      }
    }
  }

  const programs = manifestPrograms
    .map((program) => {
      const result =
        resultByName.get(String(program.name || "")) ||
        resultByName.get(`actual_${program.name}`) ||
        null;
      const source = snapshotFile(repoRoot, program.source);
      return {
        name: String(program.name || ""),
        classification: classifyActualProgram(program),
        source,
        result: result
          ? {
              name: result.name,
              source:
                typeof result.source === "string"
                  ? normalizeRelativePath(result.source)
                  : null,
              status:
                typeof result.status === "string" ? result.status : null,
              sourceHashBound:
                source.exists && result.sourceSha256 === source.sha256
            }
          : null
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const missingSources = programs.filter((entry) => !entry.source.exists);
  const missingResults = programs.filter((entry) => !entry.result);
  const failingResults = programs.filter(
    (entry) =>
      entry.result &&
      !/^passed$/i.test(String(entry.result.status || ""))
  );
  const mismatchedSources = programs.filter(
    (entry) =>
      entry.result &&
      (entry.result.source !== entry.source.path ||
        !entry.result.sourceHashBound)
  );
  const sourceHashBound = programs.filter(
    (entry) => entry.result && entry.result.sourceHashBound
  ).length;

  if (missingSources.length > 0) {
    blockers.push(
      blocker(
        "MISSING_EVIDENCE_INPUT",
        id,
        spec.manifestPath,
        `${missingSources.length} manifest source file(s) are missing`
      )
    );
  }
  if (missingResults.length > 0 || failingResults.length > 0) {
    blockers.push(
      blocker(
        "FAILING_EVIDENCE_REPORT",
        id,
        spec.dogfoodReportPath,
        `${missingResults.length} actual-program result(s) are missing and ${failingResults.length} are not passing`
      )
    );
  }
  if (mismatchedSources.length > 0) {
    blockers.push(
      blocker(
        "STALE_ACTUAL_PROGRAM_BINDING",
        id,
        spec.reportPath,
        `${mismatchedSources.length} first-class result source path or SHA-256 binding(s) disagree with the current manifest`
      )
    );
  }
  const uniqueResultNames = new Set(
    primaryResults.map((entry) => String((entry && entry.name) || ""))
  );
  if (
    primaryResults.length !== programs.length ||
    uniqueResultNames.size !== primaryResults.length
  ) {
    blockers.push(
      blocker(
        "ACTUAL_PROGRAM_COVERAGE_MISMATCH",
        id,
        spec.reportPath,
        `First-class report has ${primaryResults.length} result(s) for ${programs.length} manifest program(s), with ${primaryResults.length - uniqueResultNames.size} duplicate name(s)`
      )
    );
  }
  const actualContractIssues = [];
  const actualReport = reportJson.value;
  if (actualReport) {
    if (actualReport.kind !== "luascript:actual-programs:repository-legacy") {
      actualContractIssues.push("report kind is not the repository-legacy actual-program contract");
    }
    if (
      !actualReport.boundary ||
      actualReport.boundary.packageCompatibilityClaimed !== false
    ) {
      actualContractIssues.push("packageCompatibilityClaimed is not explicitly false");
    }
    const inputManifest =
      actualReport.inputs && actualReport.inputs.manifest;
    const inputHarness =
      actualReport.inputs && actualReport.inputs.harness;
    if (
      !inputManifest ||
      normalizeRelativePath(inputManifest.path) !== spec.manifestPath ||
      inputManifest.sha256 !== manifestSnapshot.file.sha256
    ) {
      actualContractIssues.push("report inputs do not bind the exact current manifest");
    }
    const currentHarness = snapshotFile(repoRoot, spec.testPath);
    if (
      !inputHarness ||
      normalizeRelativePath(inputHarness.path) !== spec.testPath ||
      inputHarness.sha256 !== currentHarness.sha256
    ) {
      actualContractIssues.push("report inputs do not bind the exact current harness");
    }
    const manifestOrder = manifestPrograms.map((entry) =>
      String(entry.name || "")
    );
    const resultOrder = primaryResults.map((entry) =>
      String((entry && entry.name) || "").replace(/^actual_/, "")
    );
    if (JSON.stringify(resultOrder) !== JSON.stringify(manifestOrder)) {
      actualContractIssues.push("result order does not exactly match manifest order");
    }
    if (
      !actualReport.summary ||
      actualReport.summary.total !== programs.length ||
      actualReport.summary.passed !== programs.length ||
      actualReport.summary.failed !== 0 ||
      actualReport.summary.notRun !== 0
    ) {
      actualContractIssues.push("summary does not exactly close the manifest program set");
    }
    const expectedClassifications = {
      "positive-runtime": manifestPrograms.filter(
        (entry) => classifyActualProgram(entry) === "positive-runtime"
      ).length,
      "expected-compile-diagnostic": manifestPrograms.filter(
        (entry) =>
          classifyActualProgram(entry) === "expected-compile-diagnostic"
      ).length,
      "expected-runtime-diagnostic": manifestPrograms.filter(
        (entry) =>
          classifyActualProgram(entry) === "expected-runtime-diagnostic"
      ).length
    };
    if (
      actualReport.summary &&
      (actualReport.summary.positiveRuntime !==
        expectedClassifications["positive-runtime"] ||
        actualReport.summary.expectedCompileDiagnostic !==
          expectedClassifications["expected-compile-diagnostic"] ||
        actualReport.summary.expectedRuntimeDiagnostic !==
          expectedClassifications["expected-runtime-diagnostic"])
    ) {
      actualContractIssues.push("classification totals disagree with the manifest");
    }
    if (
      manifestPrograms.some((program) => {
        const result =
          resultByName.get(String(program.name || "")) ||
          resultByName.get(`actual_${program.name}`);
        return (
          !result ||
          result.classification !== classifyActualProgram(program) ||
          String(result.status || "").toLowerCase() !== "passed"
        );
      })
    ) {
      actualContractIssues.push("one or more result classifications or statuses disagree");
    }
  }
  if (actualContractIssues.length > 0) {
    blockers.push(
      blocker(
        "ACTUAL_PROGRAM_REPORT_CONTRACT_MISMATCH",
        id,
        spec.reportPath,
        `${actualContractIssues.length} actual-program report contract check(s) failed`
      )
    );
  }

  let state = primaryInventory.entry.state;
  if (
    !manifestSnapshot.file.exists ||
    manifestSnapshot.parseError
  ) {
    state = "missing";
  } else if (
    missingSources.length > 0 ||
    mismatchedSources.length > 0 ||
    primaryResults.length !== programs.length ||
    uniqueResultNames.size !== primaryResults.length
  ) {
    state = "stale";
  } else if (actualContractIssues.length > 0) {
    state = "stale";
  } else if (
    state !== "missing" &&
    (missingResults.length > 0 || failingResults.length > 0)
  ) {
    state = "failing";
  } else if (
    state === "passing" &&
    programs.length > 0 &&
    sourceHashBound === programs.length
  ) {
    state = "passing";
  }

  return {
    entry: {
      id,
      lane: "actual-programs",
      required: true,
      state,
      manifest: reportSnapshot(manifestSnapshot),
      executableGate: snapshotFile(repoRoot, spec.testPath),
      executionReport: reportSnapshot(reportJson),
      reportBinding: primaryInventory.entry.binding,
      resultAssessment: primaryInventory.entry.resultAssessment || null,
      contractAssessment: {
        status:
          actualContractIssues.length === 0 && actualReport
            ? "verified"
            : actualReport
              ? "stale"
              : "not-evaluated",
        issues: actualContractIssues.sort()
      },
      legacyDogfoodSupplement: {
        report: reportSnapshot(dogfoodSnapshot),
        boundary:
          "Legacy dogfood evidence is inventoried for traceability only; the first-class actual-program report is the release-binding source."
      },
      summary: {
        manifestPrograms: programs.length,
        sourceFilesPresent: programs.length - missingSources.length,
        matchedResults: programs.length - missingResults.length,
        passingResults:
          programs.length - missingResults.length - failingResults.length,
        sourceHashBound
      },
      programs
    },
    blockers,
    warnings: primaryInventory.warnings
  };
}

function inventoryParserOwnership(repoRoot, spec) {
  const id = "parser-ownership";
  const reportResult = inventoryReport(
    repoRoot,
    {
      id,
      path: spec.reportPath,
      inputs: spec.sources
    },
    {
      lane: "parser-ownership",
      requireBindings: true
    }
  );
  const relatedReport = snapshotFile(repoRoot, spec.relatedReportPath);
  const reportJson = readJsonSnapshot(repoRoot, spec.reportPath);
  const parserContractIssues = [];
  if (reportJson.value) {
    const report = reportJson.value;
    const results = Array.isArray(report.results) ? report.results : [];
    const names = results.map((entry) => String((entry && entry.name) || ""));
    if (report.kind !== "luascript:parser-ownership") {
      parserContractIssues.push("report kind is not the parser-ownership contract");
    }
    if (
      !report.boundary ||
      report.boundary.packageCompatibilityClaimed !== false
    ) {
      parserContractIssues.push("packageCompatibilityClaimed is not explicitly false");
    }
    if (
      !report.inputs ||
      !report.inputs.harness ||
      normalizeRelativePath(report.inputs.harness.path) !==
        "tests/parser_ownership.test.js" ||
      report.inputs.harness.sha256 !==
        snapshotFile(repoRoot, "tests/parser_ownership.test.js").sha256
    ) {
      parserContractIssues.push("report inputs do not bind the exact current harness");
    }
    if (new Set(names).size !== names.length) {
      parserContractIssues.push("parser-ownership result names are not unique");
    }
    if (
      results.some(
        (entry) =>
          !entry || String(entry.status || "").toLowerCase() !== "passed"
      )
    ) {
      parserContractIssues.push("one or more parser-ownership results are not passed");
    }
    if (
      !report.summary ||
      report.summary.total !== results.length ||
      report.summary.passed !== results.length ||
      report.summary.failed !== 0 ||
      report.summary.notRun !== 0
    ) {
      parserContractIssues.push("summary does not exactly close the result set");
    }
    const referencedPaths = new Set(
      collectEmbeddedHashReferences(report).map((entry) => entry.path)
    );
    const unboundRequiredSources = spec.sources.filter(
      (sourcePath) => !referencedPaths.has(normalizeRelativePath(sourcePath))
    );
    if (unboundRequiredSources.length > 0) {
      parserContractIssues.push(
        `${unboundRequiredSources.length} required parser source(s) lack embedded hashes`
      );
    }
  }
  if (parserContractIssues.length > 0) {
    reportResult.blockers.push(
      blocker(
        "PARSER_OWNERSHIP_REPORT_CONTRACT_MISMATCH",
        id,
        spec.reportPath,
        `${parserContractIssues.length} parser-ownership report contract check(s) failed`
      )
    );
    reportResult.entry.state = "stale";
  }
  reportResult.entry.contractAssessment = {
    status:
      parserContractIssues.length === 0 && reportJson.value
        ? "verified"
        : reportJson.value
          ? "stale"
          : "not-evaluated",
    issues: parserContractIssues.sort()
  };
  reportResult.entry.relatedEvidence = {
    id: "conformance:source-identity",
    report: relatedReport,
    boundary:
      "The source-identity report includes normalized parser-owned AST evidence, but it is not a durable execution report for tests/parser_ownership.test.js."
  };
  return reportResult;
}

function environmentMetadata(repoRoot, override) {
  if (override) {
    return canonicalize(override);
  }
  let packageMetadata = null;
  const packageSnapshot = readJsonSnapshot(repoRoot, "package.json");
  const lockSnapshot = readJsonSnapshot(repoRoot, "package-lock.json");
  if (packageSnapshot.value) {
    packageMetadata = {
      name: packageSnapshot.value.name || null,
      version: packageSnapshot.value.version || null,
      nodeEngine:
        packageSnapshot.value.engines &&
        packageSnapshot.value.engines.node
          ? packageSnapshot.value.engines.node
          : null,
      sha256: packageSnapshot.file.sha256,
      lockfileVersion:
        lockSnapshot.value &&
        Object.prototype.hasOwnProperty.call(
          lockSnapshot.value,
          "lockfileVersion"
        )
          ? lockSnapshot.value.lockfileVersion
          : null,
      lockfileSha256: lockSnapshot.file.exists
        ? lockSnapshot.file.sha256
        : null
    };
  }
  const npmUserAgent = process.env.npm_config_user_agent || null;
  const npmVersionMatch = npmUserAgent
    ? String(npmUserAgent).match(/(?:^|\s)npm\/([^\s]+)/)
    : null;
  return {
    node: process.version,
    npm: {
      version: npmVersionMatch ? npmVersionMatch[1] : null,
      userAgent: npmUserAgent
    },
    platform: process.platform,
    arch: process.arch,
    os: {
      type: os.type(),
      release: os.release()
    },
    repositoryRoot: ".",
    generatedBy: "scripts/generate_release_evidence_bundle.js",
    package: packageMetadata
  };
}

function sortBlockers(blockers) {
  return blockers
    .map(canonicalize)
    .sort((left, right) => {
      const leftKey = [
        left.severity,
        left.code,
        left.evidenceId,
        left.path,
        left.message
      ].join("\u0000");
      const rightKey = [
        right.severity,
        right.code,
        right.evidenceId,
        right.path,
        right.message
      ].join("\u0000");
      return leftKey.localeCompare(rightKey);
    });
}

function summarizeEvidence(entries, blockers, warnings) {
  const states = {};
  const requiredStates = {};
  const informationalStates = {};
  for (const entry of entries) {
    states[entry.state] = (states[entry.state] || 0) + 1;
    const target = entry.required ? requiredStates : informationalStates;
    target[entry.state] = (target[entry.state] || 0) + 1;
  }
  return {
    releaseReady: blockers.length === 0,
    evidenceEntries: entries.length,
    requiredEvidenceEntries: entries.filter((entry) => entry.required).length,
    informationalEvidenceEntries: entries.filter((entry) => !entry.required)
      .length,
    states: canonicalize(states),
    requiredStates: canonicalize(requiredStates),
    informationalStates: canonicalize(informationalStates),
    releaseBlockingIssues: blockers.length,
    informationalWarnings: warnings.length
  };
}

function inventorySourceSet(repoRoot, id, lane, sourcePaths) {
  const sources = (sourcePaths || [])
    .map((entry) => snapshotFile(repoRoot, entry))
    .sort((left, right) => left.path.localeCompare(right.path));
  const missing = sources.filter((entry) => !entry.exists);
  return {
    entry: {
      id,
      lane,
      required: true,
      state: missing.length === 0 ? "passing" : "missing",
      sources
    },
    blockers: missing.map((entry) =>
      blocker(
        "MISSING_EVIDENCE_INPUT",
        id,
        entry.path,
        `Bundle implementation source is unavailable: ${entry.error || "missing"}`
      )
    ),
    warnings: []
  };
}

function buildReleaseEvidenceBundle(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
  const spec = options.inventorySpec || DEFAULT_INVENTORY_SPEC;
  const entries = [];
  const blockers = [];
  const warnings = [];

  const implementationResult = inventorySourceSet(
    repoRoot,
    "release-evidence-generator",
    "bundle-integrity",
    spec.bundleImplementationSources
  );
  entries.push(implementationResult.entry);
  blockers.push(...implementationResult.blockers);
  warnings.push(...implementationResult.warnings);

  for (const definition of [...spec.clarityReports].sort((left, right) =>
    left.id.localeCompare(right.id)
  )) {
    const result = inventoryReport(repoRoot, definition, {
      lane: "clarity",
      requireBindings: true,
      captureResultPaths: true,
      allowMtimeFreshness: true
    });
    entries.push(result.entry);
    blockers.push(...result.blockers);
    warnings.push(...result.warnings);
  }

  const languageResult = inventoryLanguageReports(repoRoot, spec);
  entries.push(...languageResult.entries);
  blockers.push(...languageResult.blockers);
  warnings.push(...languageResult.warnings);

  const actualProgramsResult = inventoryActualPrograms(
    repoRoot,
    spec.actualPrograms
  );
  entries.push(actualProgramsResult.entry);
  blockers.push(...actualProgramsResult.blockers);
  warnings.push(...actualProgramsResult.warnings);

  const parserOwnershipResult = inventoryParserOwnership(
    repoRoot,
    spec.parserOwnership
  );
  entries.push(parserOwnershipResult.entry);
  blockers.push(...parserOwnershipResult.blockers);
  warnings.push(...parserOwnershipResult.warnings);

  for (const definition of [...spec.reportLanes].sort((left, right) =>
    left.id.localeCompare(right.id)
  )) {
    const result = inventoryReport(repoRoot, definition, {
      lane: "conformance",
      requireBindings: true
    });
    entries.push(result.entry);
    blockers.push(...result.blockers);
    warnings.push(...result.warnings);
  }

  entries.sort((left, right) => left.id.localeCompare(right.id));
  const sortedBlockers = sortBlockers(blockers);
  const sortedWarnings = sortBlockers(warnings);
  const summary = summarizeEvidence(entries, sortedBlockers, sortedWarnings);
  const policy = {
    releaseActionBoundary:
      "This generator inventories existing evidence only. It does not run gates, mutate source evidence, bump versions, tag, publish, commit, push, or create a release.",
    passPolicy:
      "Release-ready requires every required report to exist, parse, declare zero failures, and validate every embedded repository path/SHA-256 reference. A required legacy Clarity report without embedded hashes must pass the explicit generatedAt-versus-required-input-mtime fallback; otherwise unbound provenance remains release-blocking.",
    informationalPolicy:
      "Diagnostic and shard-only evidence is inventoried and hash-bound when available, but its missing, stale, unbound, or failing state is recorded as an informational warning rather than a release blocker.",
    stalenessPolicy:
      "Hash-bearing reports are stale only on embedded repository path/SHA-256 mismatch or missing references. Hashless Clarity reports use a fail-closed fallback requiring report generatedAt to be at or after every declared freshness input mtime; no arbitrary age threshold is used.",
    ordering:
      "Evidence entries are sorted by id; blockers and warnings by severity/code/evidenceId/path/message; file references by path and expected SHA-256.",
    canonicalization:
      "SHA-256 over UTF-8 JSON after recursively sorting object keys while preserving already-defined array order.",
    generatedAtExclusion:
      "Only the bundle's top-level generatedAt and contentIdentity fields are excluded from identity inputs; timestamps embedded in inventoried reports remain hash-bound evidence."
  };
  const environment = environmentMetadata(repoRoot, options.environment);
  const command = options.command || DEFAULT_COMMAND;
  const generatedAt =
    options.generatedAt === undefined
      ? new Date().toISOString()
      : String(options.generatedAt);

  const evidenceIdentityInput = {
    policy,
    evidence: entries,
    blockers: sortedBlockers,
    warnings: sortedWarnings,
    summary
  };
  const bundleIdentityInput = {
    schemaVersion: 1,
    kind: "luascript:denali-release-evidence-bundle",
    command,
    environment,
    ...evidenceIdentityInput
  };

  return {
    schemaVersion: 1,
    kind: "luascript:denali-release-evidence-bundle",
    command,
    generatedAt,
    environment,
    policy,
    contentIdentity: {
      algorithm: "sha256",
      canonicalization: policy.canonicalization,
      excludes: ["generatedAt", "contentIdentity"],
      evidenceSetSha256: sha256Canonical(evidenceIdentityInput),
      bundlePayloadSha256: sha256Canonical(bundleIdentityInput)
    },
    evidence: entries,
    blockers: sortedBlockers,
    warnings: sortedWarnings,
    summary
  };
}

function writeReleaseEvidenceBundle(report, outputPath, repoRoot = DEFAULT_REPO_ROOT) {
  const resolved = resolveRepoPath(repoRoot, outputPath || DEFAULT_OUTPUT_PATH);
  fs.mkdirSync(path.dirname(resolved.absolute), { recursive: true });
  fs.writeFileSync(
    resolved.absolute,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  return resolved.normalized;
}

function parseArguments(argv) {
  const options = {
    outputPath: DEFAULT_OUTPUT_PATH,
    stdout: false,
    requireReady: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--stdout") {
      options.stdout = true;
    } else if (argument === "--require-ready") {
      options.requireReady = true;
    } else if (argument === "--output") {
      index += 1;
      if (!argv[index]) {
        throw new Error("--output requires a repository-relative path");
      }
      options.outputPath = argv[index];
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function main() {
  const cli = parseArguments(process.argv.slice(2));
  const commandParts = [DEFAULT_COMMAND];
  if (cli.outputPath !== DEFAULT_OUTPUT_PATH) {
    commandParts.push("--output", JSON.stringify(cli.outputPath));
  }
  if (cli.stdout) {
    commandParts.push("--stdout");
  }
  if (cli.requireReady) {
    commandParts.push("--require-ready");
  }
  const report = buildReleaseEvidenceBundle({
    command: commandParts.join(" ")
  });
  if (cli.stdout) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const output = writeReleaseEvidenceBundle(report, cli.outputPath);
    console.log(`Release evidence bundle: ${output}`);
    console.log(
      `Evidence identity: ${report.contentIdentity.evidenceSetSha256}`
    );
    console.log(
      `Release blockers: ${report.summary.releaseBlockingIssues}`
    );
    console.log(
      `Informational warnings: ${report.summary.informationalWarnings}`
    );
  }
  if (cli.requireReady && !report.summary.releaseReady) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_COMMAND,
  DEFAULT_INVENTORY_SPEC,
  DEFAULT_OUTPUT_PATH,
  buildReleaseEvidenceBundle,
  canonicalJson,
  collectEmbeddedHashReferences,
  inventoryReport,
  sha256Buffer,
  sha256Canonical,
  snapshotFile,
  validateHashReferences,
  writeReleaseEvidenceBundle
};
