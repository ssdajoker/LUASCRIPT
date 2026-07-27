"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const runAll = !args.has("--math") && !args.has("--luascript");
const runMath = runAll || args.has("--math");
const runLuaScript = runAll || args.has("--luascript");

const failures = [];
const passed = [];
const bidirectionalityLayerLanguages = ["javascript", "luascript", "python", "lua"];
const bidirectionalityLayerKeys = [
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

function relPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function readText(relativePath) {
  return fs.readFileSync(relPath(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function check(condition, message) {
  if (condition) {
    passed.push(message);
  } else {
    failures.push(message);
  }
}

function checkFile(relativePath) {
  check(fs.existsSync(relPath(relativePath)), `file exists: ${relativePath}`);
}

function checkIncludes(relativePath, expected, label = expected) {
  const text = readText(relativePath);
  check(text.includes(expected), `${relativePath} contains ${label}`);
}

function checkPattern(relativePath, pattern, label = String(pattern)) {
  const text = readText(relativePath);
  check(pattern.test(text), `${relativePath} matches ${label}`);
}

function entryByName(entries, name) {
  return entries.find((entry) => entry.name === name);
}

function checkManifestEntry(entries, name, manifestLabel, predicate, detail) {
  const entry = entryByName(entries, name);
  check(Boolean(entry), `${manifestLabel} has ${name}`);
  if (entry && predicate) {
    check(predicate(entry), `${manifestLabel} ${name}: ${detail}`);
  }
  return entry;
}

function checkPackageMetadata() {
  const pkg = readJson("package.json");
  const scripts = pkg.scripts || {};
  const pythonManifest = readJson("tests/language_completion/manifests/python.json");
  const luaManifest = readJson("tests/language_completion/manifests/lua.json");
  const luaInputManifest = readJson("tests/lua_input/manifest.json");
  const edgeMatrixManifest = readJson("tests/edge_matrix/manifest.json");
  const sourceIdentityManifest = readJson("tests/roundtrip/source_identity_manifest.json");

  check(scripts["claims:check"] === "node scripts/claims_check.js",
    "package.json exposes npm run claims:check");
  check(scripts["claims:math"] === "node scripts/claims_check.js --math",
    "package.json exposes npm run claims:math");
  check(scripts["claims:luascript"] === "node scripts/claims_check.js --luascript",
    "package.json exposes npm run claims:luascript");
  check(scripts["beta:readiness"] === "node scripts/beta_readiness.js",
    "package.json exposes npm run beta:readiness");
  check(Boolean(scripts["beta:preflight:serial"]) && Boolean(scripts["beta:preflight"]),
    "package.json exposes both serial and orchestrated beta preflight gates");
  check(
    scripts["beta:preflight"] === "node scripts/beta_gate_runner.js preflight" &&
    scripts["beta:preflight:serial"] &&
    scripts["beta:preflight:serial"].includes("claims:check"),
    "package.json beta:preflight uses the orchestrated runner and retains claims verification in serial form"
  );

  check(pythonManifest.supportSlice === "python-v1.3-sequence-slices-small-programs",
    "Python manifest names V1.3 sequence-slice support slice");
  checkManifestEntry(
    pythonManifest.fixtures,
    "sequence_slice_access",
    "Python language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/python/sequence_slice_access.py" &&
      fixture.expectedOutput === "py_slice uaS 3 4 8",
    "covers bounded sequence slices"
  );
  checkManifestEntry(
    pythonManifest.fixtures,
    "unsupported_slice_step",
    "Python language manifest",
    (fixture) => fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported Python input feature: slice steps",
    "keeps slice steps unsupported"
  );
  checkManifestEntry(
    pythonManifest.fixtures,
    "unsupported_slice_assignment",
    "Python language manifest",
    (fixture) => fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported Python input feature: slice assignment",
    "keeps slice assignment unsupported"
  );
  checkIncludes("tests/language_completion/fixtures/python/sequence_slice_access.py", "word[1:4]",
    "Python bounded string slice fixture");
  checkIncludes("tests/language_completion/fixtures/python/sequence_slice_access.py", "numbers[1:4]",
    "Python bounded list slice fixture");

  check(luaManifest.supportSlice === "lua-input-v2.1-table-index-python-target-small-programs",
    "Lua manifest names V2.1 table-index Python-target support slice");
  check(Array.isArray(luaManifest.targets) && luaManifest.targets.includes("python"),
    "Lua manifest targets emitted Python");
  check(luaInputManifest.supportSlice === "lua-input-v2.1",
    "Lua input manifest names V2.1 support slice");
  check(Array.isArray(luaInputManifest.requiredTargets) && luaInputManifest.requiredTargets.includes("python"),
    "Lua input manifest requires Python target");
  checkManifestEntry(
    luaManifest.fixtures,
    "table_index_read_write",
    "Lua language manifest",
    (fixture) => fixture.source === "tests/lua_input/fixtures/table_index_read_write.lua" &&
      fixture.expectedOutput === "lua_index 3 9 8",
    "covers table index read/write"
  );
  checkManifestEntry(
    luaInputManifest.fixtures,
    "table_index_read_write",
    "Lua input manifest",
    (fixture) => fixture.source === "tests/lua_input/fixtures/table_index_read_write.lua" &&
      fixture.expectedOutput === "lua_index 3 9 8",
    "covers table index read/write"
  );
  check(Boolean(scripts["beta:full:serial"]) && Boolean(scripts["beta:full"]),
    "package.json exposes both serial and orchestrated full beta gates");
  check(
    scripts["beta:full"] === "node scripts/beta_gate_runner.js full" &&
    scripts["beta:full:serial"] &&
    scripts["beta:full:serial"].includes("clarity:dogfood") &&
    scripts["beta:full:serial"].includes("clarity:canon") &&
    scripts["beta:full:serial"].includes("npm test"),
    "package.json exposes a full beta acceptance gate with both orchestrated and serial forms"
  );
  check(
    Boolean(scripts["language:implemented:native"]) &&
    Boolean(scripts["language:implemented:targets"]) &&
    scripts["language:implemented:bidirectional"] === "npm run language:implemented:native && npm run language:implemented:targets",
    "package.json exposes split implemented-language gates plus the aggregate bidirectional gate"
  );
  check(scripts["language:implemented:native"] &&
    scripts["language:implemented:native"].includes("language:typescript:bidirectional"),
  "package.json implemented native gate includes TypeScript");
  check(scripts["language:implemented:targets"] &&
    scripts["language:implemented:targets"].includes("language:go:ir-targets"),
  "package.json implemented target-runtime gate includes Go target-runtime lane");
  check(scripts["language:implemented:targets"] &&
    scripts["language:implemented:targets"].includes("language:rust:ir-targets"),
  "package.json implemented target-runtime gate includes Rust target-runtime lane");
  check(scripts["language:implemented:targets"] &&
    scripts["language:implemented:targets"].includes("language:kotlin:ir-targets"),
  "package.json implemented target-runtime gate includes Kotlin target-runtime lane");
  check(scripts["language:typescript:bidirectional"] === "node tests/language_completion/bidirectional_harness.js typescript",
    "package.json exposes TypeScript bidirectional gate");
  check(scripts["language:go:ir-targets"] === "node tests/language_completion/bidirectional_harness.js go",
    "package.json exposes Go target-runtime gate");
  check(scripts["language:rust:ir-targets"] === "node tests/language_completion/bidirectional_harness.js rust",
    "package.json exposes Rust target-runtime gate");
  check(scripts["language:kotlin:ir-targets"] === "node tests/language_completion/bidirectional_harness.js kotlin",
    "package.json exposes Kotlin target-runtime gate");
  check(scripts["language:implemented:targets"] &&
    scripts["language:implemented:targets"].includes("language:gleam:ir-targets"),
  "package.json implemented target-runtime gate includes Gleam lane");
  check(scripts["test:ir-conformance"] === "node tests/conformance/canonical_ir_conformance.test.js",
    "package.json exposes npm run test:ir-conformance");
  check(scripts["test:schema-artifact-map"] === "node tests/conformance/schema_artifact_mapping.test.js",
    "package.json exposes npm run test:schema-artifact-map");
  check(scripts["test:edge-matrix"] === "node tests/edge_matrix/edge_case_matrix.test.js",
    "package.json exposes npm run test:edge-matrix");
  check(scripts["test:unsupported-diagnostics"] === "node tests/ir/unsupported_diagnostics.test.js",
    "package.json exposes npm run test:unsupported-diagnostics");
  check(scripts["test:roundtrip-probe"] === "node tests/roundtrip/roundtrip_probe.test.js",
    "package.json exposes npm run test:roundtrip-probe");
  check(scripts["test:source-identity-probe"] === "node tests/roundtrip/source_identity_probe.test.js",
    "package.json exposes npm run test:source-identity-probe");
  check(pkg.version === "0.1.0-beta.0", "package.json uses pre-production beta v0.1 package version");
  check(pkg.name === "luascript", "package.json keeps canonical package name");
  check(pkg.main === "src/unified_luascript.js", "package.json keeps current package entrypoint");
  check(!Object.prototype.hasOwnProperty.call(pkg, "exports"),
    "package.json has no package exports map for no-release freeze candidate");
  check(!Object.prototype.hasOwnProperty.call(pkg, "bin"),
    "package.json has no npm bin for no-release freeze candidate");
  check(pkg.engines && pkg.engines.node === ">=14.0.0", "package.json declares current Node runtime floor");
  check(Array.isArray(pkg.files) &&
    ["src/", "test/", "README.md", "LICENSE"].every((entry) => pkg.files.includes(entry)),
  "package.json exposes the current beta package file surface");
  check(pkg.luascript && pkg.luascript.releaseTrack === "pre-production beta",
    "package.json declares LUASCRIPT release track as pre-production beta");
  check(pkg.luascript && pkg.luascript.version === pkg.version,
    "package.json package version and luascript metadata version stay aligned");
  check(pkg.luascript && Array.isArray(pkg.luascript.verifiedSlices) &&
    pkg.luascript.verifiedSlices.includes("Lua input V2.1 table-index Python-target small-program slice"),
  "package.json names Lua input V2.1 verified slice");
  check(pkg.luascript && Array.isArray(pkg.luascript.verifiedSlices) &&
    pkg.luascript.verifiedSlices.includes("Python V1.3 sequence-slices small-program slice"),
  "package.json names Python V1.3 verified slice");

  checkFile("tests/conformance/schema_artifact_mapping.test.js");
  checkIncludes("tests/conformance/schema_artifact_mapping.test.js", "dual-surface-transition",
    "schema artifact mapping harness records dual-surface transition decision");
  checkIncludes("tests/conformance/schema_artifact_mapping.test.js", "schema-artifact-mapping-report.json",
    "schema artifact mapping harness writes durable report");
  checkIncludes("tests/conformance/schema_artifact_mapping.test.js", "This report proves schema-valid derived artifacts for current positive conformance fixtures only.",
    "schema artifact mapping harness keeps scoped boundary");
  checkIncludes("tests/conformance/schema_artifact_mapping.test.js", "It does not choose the release IR surface, change compiler output, promote broad source identity, or close canonical 1.0.",
    "schema artifact mapping harness no-release-surface boundary");

  const edgeMatrixCases = new Set((edgeMatrixManifest.cases || []).map((entry) => entry.id));
  checkFile("tests/edge_matrix/manifest.json");
  checkFile("tests/edge_matrix/edge_case_matrix.test.js");
  check(edgeMatrixManifest.name === "canonical-edge-case-matrix-v0",
    "edge-case matrix manifest keeps canonical name");
  check(edgeMatrixManifest.status === "scoped-25",
    "edge-case matrix manifest keeps scoped-25 status");
  check((edgeMatrixManifest.cases || []).length === 25,
    "edge-case matrix manifest has 25 scoped cases");
  for (const category of ["value", "control", "scope", "data", "errors", "target-specific", "unsupported-diagnostics"]) {
    const categoryCount = (edgeMatrixManifest.cases || []).filter((entry) => entry.category === category).length;
    check(Array.isArray(edgeMatrixManifest.requiredCategories) &&
      edgeMatrixManifest.requiredCategories.includes(category),
    `edge-case matrix manifest requires ${category}`);
    check(categoryCount >= 3,
      `edge-case matrix manifest has at least three ${category} cases`);
  }
  check(edgeMatrixCases.has("value-template-literal-concat"),
    "edge-case matrix seeds plain template literal value case");
  check(edgeMatrixCases.has("control-short-circuit-side-effects"),
    "edge-case matrix seeds short-circuit side-effect case");
  check(edgeMatrixCases.has("scope-recursive-function"),
    "edge-case matrix seeds recursive function scope case");
  check(edgeMatrixCases.has("data-python-bounded-sequence-slices"),
    "edge-case matrix seeds Python bounded sequence slices");
  check(edgeMatrixCases.has("data-luascript-portable-length-slice-mutation"),
    "edge-case matrix seeds .ls portable length/slice data case");
  check(edgeMatrixCases.has("errors-python-index-runtime-diagnostic"),
    "edge-case matrix seeds Python index runtime diagnostic");
  check(edgeMatrixCases.has("target-specific-lua-one-based-index-repair"),
    "edge-case matrix seeds Lua one-based index target repair");
  check(edgeMatrixCases.has("target-specific-luascript-portable-truthiness"),
    "edge-case matrix seeds .ls portable truthiness target repair");
  check(edgeMatrixCases.has("unsupported-diagnostics-python-slice-step"),
    "edge-case matrix seeds Python slice-step diagnostic");
  checkIncludes("tests/edge_matrix/edge_case_matrix.test.js", "manifestEvidence(manifestPath, manifest, manifest.cases.map(item => item.id))",
    "edge-case matrix report includes manifest and case hashes");
  checkIncludes("tests/edge_matrix/edge_case_matrix.test.js", "supportMatrixTraceability",
    "edge-case matrix report includes support-matrix traceability");
  checkIncludes("tests/edge_matrix/edge_case_matrix.test.js", "categoryCounts",
    "edge-case matrix report includes category counts");
  checkFile("tests/roundtrip/source_identity_manifest.json");
  checkFile("tests/roundtrip/source_identity_probe.test.js");
  check(sourceIdentityManifest.status === "release-shaped-source-identity-suite",
    "source identity manifest keeps release-shaped status");
  check(sourceIdentityManifest.identityKind === "normalized-source-ast-and-ir-with-diagnostic-boundaries",
    "source identity manifest keeps normalized source/AST/IR identity with diagnostic boundaries");
  check((sourceIdentityManifest.fixtures || []).length === 15,
    "source identity manifest has 15 scoped fixtures");
  check((sourceIdentityManifest.fixtures || []).filter((fixture) => fixture.tier === "normalized-source-and-ir-identity").length === 12,
    "source identity manifest has 12 positive identity fixtures");
  check((sourceIdentityManifest.fixtures || []).filter((fixture) => fixture.expectedFailure === true).length === 3,
    "source identity manifest has 3 expected unsupported diagnostics");
  check(sourceIdentityManifest.bidirectionalityLayerEvidence &&
    sourceIdentityManifest.bidirectionalityLayerEvidence.language === "luascript",
  "source identity manifest records .ls bidirectionality layer evidence");
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
    check(sourceIdentityManifest.bidirectionalityLayerEvidence &&
      sourceIdentityManifest.bidirectionalityLayerEvidence.layers &&
      typeof sourceIdentityManifest.bidirectionalityLayerEvidence.layers[layer] === "string",
    `source identity manifest records ${layer} layer evidence`);
  }
  check(sourceIdentityManifest.bidirectionalityLayerEvidence &&
    sourceIdentityManifest.bidirectionalityLayerEvidence.layers &&
    sourceIdentityManifest.bidirectionalityLayerEvidence.layers.tokenIdentity === "measured-non-gating",
  "source identity manifest keeps token identity measured non-gating");
  for (const category of [
    "bindings",
    "expressions",
    "functions",
    "conditionals",
    "loops",
    "arrays",
    "objects",
    "indexing",
    "slicing",
    "profile-blocks",
    "repair-blocks",
    "verify-blocks",
    "unsupported-diagnostics"
  ]) {
    check(Array.isArray(sourceIdentityManifest.requiredCoverage) &&
      sourceIdentityManifest.requiredCoverage.includes(category),
    `source identity manifest requires ${category}`);
    check((sourceIdentityManifest.fixtures || []).some((fixture) => (fixture.coverage || []).includes(category)),
      `source identity manifest covers ${category}`);
  }
  checkManifestEntry(
    sourceIdentityManifest.fixtures,
    "ls_arithmetic_bindings_identity",
    "source identity manifest",
    (fixture) => fixture.sourcePath === "tests/language_completion/fixtures/luascript/arithmetic_locals.ls",
    "covers arithmetic/bindings .ls identity"
  );
  checkManifestEntry(
    sourceIdentityManifest.fixtures,
    "ls_functions_conditionals_identity",
    "source identity manifest",
    (fixture) => fixture.sourcePath === "tests/language_completion/fixtures/luascript/functions_conditionals.ls",
    "covers functions/conditionals .ls identity"
  );
  checkManifestEntry(
    sourceIdentityManifest.fixtures,
    "ls_profile_portable_slice_identity",
    "source identity manifest",
    (fixture) => fixture.sourcePath === "tests/language_completion/fixtures/luascript/ring3_portable_semantics_index_length_slice.ls",
    "covers portable semantics index/length/slice .ls identity"
  );
  checkManifestEntry(
    sourceIdentityManifest.fixtures,
    "ls_repair_block_identity",
    "source identity manifest",
    (fixture) => fixture.sourcePath === "tests/roundtrip/fixtures/ls_repair_block_identity.ls" &&
      (fixture.coverage || []).includes("repair-blocks") &&
      (fixture.coverage || []).includes("verify-blocks"),
    "covers repair and verify block source identity"
  );
  checkManifestEntry(
    sourceIdentityManifest.fixtures,
    "ls_verify_block_identity",
    "source identity manifest",
    (fixture) => fixture.sourcePath === "tests/roundtrip/fixtures/ls_verify_block_identity.ls" &&
      (fixture.coverage || []).includes("verify-blocks"),
    "covers verify block source identity"
  );
  checkManifestEntry(
    sourceIdentityManifest.fixtures,
    "ls_unsupported_throw_diagnostic",
    "source identity manifest",
    (fixture) => fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript exception flow: throw statements",
    "keeps throw diagnostic separate from source identity"
  );
  checkIncludes("src/compilers/ir-to-ls.js", "emitVerifyBlock",
    "IR-to-LS generator preserves verify blocks");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "expectedUnsupportedDiagnostics",
    "source identity report counts expected diagnostics separately");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "coverageCounts",
    "source identity report includes coverage counts");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "tierCounts",
    "source identity report includes tier counts");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "bidirectionalityLayerEvidence",
    "source identity report includes bidirectionality layer evidence");
  checkIncludes("tests/language_completion/bidirectional_harness.js", "stripTopLevelLuascriptVerifyBlocks",
    "language completion harness excludes preserved .ls verify blocks from self-verification assertions");
  const canonManifest = readJson("tests/clarity_canon/manifest.json");
  check(Boolean(entryByName(canonManifest.strictCanonScripts || [], "beta_readiness")),
    "strict Clarity canon includes beta readiness gate");
  check(scripts["test:evidence"] &&
    scripts["test:evidence"].includes("validateEvidenceStatic"),
  "package.json exposes npm run test:evidence");
  check(!Object.prototype.hasOwnProperty.call(scripts, "test:victory"),
    "package.json does not expose test:victory");

  const packageText = JSON.stringify(pkg, null, 2);
  const stalePatterns = [
    /VICTORY ACHIEVED/i,
    /VICTORY VALIDATION/i,
    /\$1,000,000/,
    /\$1M/i,
    /100%\s+COMPLETE/i,
    /Complete JavaScript-to-Lua transpiler/i,
    /million-dollar/i,
    /million dollar/i,
    /Prize Target/i,
    /CRUNCH MODE/i,
    /MULTI-TEAM/i,
    /Tony Yoka/i,
    /PS2\/PS3/i,
    /Steve Jobs/i,
    /Donald Knuth/i,
    /Phase 1-6.*95%/i,
    /Phase 1 COMPLETE/i,
    /Optimization Implementation.*COMPLETE/i,
    /100%\s+bidirectional\s+round-trip/i,
    /100%\s+round-trip\s+support/i,
    /zero\s+data\s+loss\s+guarantee/i,
    /zero\s+data\s+loss\s+guarantees/i,
    /all\s+240\s+translation\s+pairs/i,
    /full\s+round-trip\s+capability/i,
    /lossless\s+source\s+recovery\s+guaranteed/i,
    /complete\s+bidirectional\s+translation\s+support/i,
    /test:victory/i,
    /validateVictory/i,
    /VictoryValidator/i,
    /victoryAchieved/i,
    /legacyThresholdMet/i,
    /Legacy phase scores/i,
    /validatePhase12/i
  ];

  for (const pattern of stalePatterns) {
    check(!pattern.test(packageText), `package.json avoids stale claim ${pattern}`);
  }

  const activeClaimFiles = [
    "README.md",
    "PROJECT_STATUS.md",
    "docs/INDEX.md",
    "docs/BETA_RELEASE_HANDOFF_V0_1.md",
    "docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md",
    "docs/LUASCRIPT_DENALI_SOLOIST_LEDGER.md",
    "docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md",
    "docs/LUASCRIPT_1_0_EXIT_CRITERIA.md",
    "docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md",
    "docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md",
    "docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md",
    "docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md",
    "docs/LUASCRIPT_MEGA_PLAN.md",
    "docs/LANGUAGE_SUPPORT_MATRIX.md",
    "docs/LANGUAGE_COMPLETION_RULES.md",
    "docs/LUASCRIPT_LIVING_META_LANGUAGE.md",
    "docs/LUASCRIPT_META_LANGUAGE_V0.md",
    "docs/LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md",
    "docs/quick-start/README.md",
    "docs/architecture/README.md",
    "docs/reference/README.md",
    "docs/canonical_ir_spec.md",
    "docs/VERSIONING.md",
    "docs/ir/ARCHITECTURE.md",
    "docs/ir/USAGE_GUIDE.md",
    "tests/conformance/manifest.json",
    "tests/conformance/canonical_ir_conformance.test.js",
    "tests/conformance/report_utils.js",
    "tests/edge_matrix/manifest.json",
    "tests/edge_matrix/edge_case_matrix.test.js",
    "tests/roundtrip/manifest.json",
    "tests/roundtrip/roundtrip_probe.test.js",
    "tests/roundtrip/source_identity_manifest.json",
    "tests/roundtrip/source_identity_probe.test.js",
    "tests/ir/unsupported_diagnostics.test.js",
    "docs/OLD LUASCRIPT DOCS/README.md",
    "src/unified_luascript.js",
    "src/core_transpiler.js",
    "src/index.js",
    "src/phase6_production_deployment.js",
    "src/transpiler.js",
    "src/transpiler_multilang.js",
    "test/test_perfect_parser_phase1.js",
    "test/test_unified_system.js",
    "test/test_phase1_6_comprehensive.js"
  ];

  for (const relativePath of activeClaimFiles) {
    const text = readText(relativePath);
    for (const pattern of stalePatterns) {
      check(!pattern.test(text), `${relativePath} avoids stale claim ${pattern}`);
    }
  }

  checkIncludes("README.md", "Canonical `1.0` Package And Runtime Expectations",
    "README package/runtime expectations section");
  checkIncludes("README.md", "docs/INDEX.md](docs/INDEX.md) is the canonical active-docs map",
    "README active docs map boundary");
  checkIncludes("README.md", "Reference boundary: [docs/reference/README.md](docs/reference/README.md)",
    "README reference boundary link");
  checkIncludes("README.md", "Canonical IR spec: [docs/canonical_ir_spec.md](docs/canonical_ir_spec.md)",
    "README canonical IR support link");
  checkIncludes("README.md", "Canonical IR semantics inventory: [docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md](docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md)",
    "README canonical IR semantics inventory link");
  checkIncludes("README.md", "Canonical IR semantics spec v0: [docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md](docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md)",
    "README canonical IR semantics spec v0 link");
  checkIncludes("README.md", "Bidirectionality terminology is defined by [docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md)",
    "README bidirectionality contract link");
  checkIncludes("README.md", "Language depth accession rules live in [docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md)",
    "README language accession rules link");
  checkIncludes("README.md", "Public API and runtime expectations for real `1.0` are defined by [docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)",
    "README public API runtime contract link");
  checkIncludes("README.md", "It names package entrypoints, root exports, CLI/API surface, Node/runtime expectations, package files, semver policy, compatibility policy, and release-action boundaries for real `1.0`.",
    "README public API runtime boundary");
  checkIncludes("README.md", "The 2026-07-16 no-release Denali freeze candidate records current truth only.",
    "README no-release freeze candidate");
  checkIncludes("README.md", "The package has no declared `exports` map, no npm `bin`, and no global CLI contract",
    "README no-exports no-bin boundary");
  checkIncludes("README.md", "Root-level `runtime/` helpers exist for local Lua examples/tests but are outside the current package `files` promise.",
    "README root runtime package-files boundary");
  checkIncludes("README.md", "the package version stays `0.1.0-beta.0`",
    "README no-bump package version boundary");
  checkIncludes("README.md", "Certification-style evidence is organized by [docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md)",
    "README conformance evidence binder link");
  checkIncludes("README.md", "the remaining source-preserving/certification climb now lives in [docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md)",
    "README Big Remaining Climb ledger link");
  checkIncludes("README.md", "Current forward motion lives in [docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md): new proof layers, schema-valid IR surface reconciliation, final API/runtime freeze, compatibility seal, and release-grade evidence generation.",
    "README current route points to Big Remaining Climb");
  checkIncludes("README.md", "both passed on 2026-06-19 and were refreshed green on 2026-07-14",
    "README beta gate refresh date");
  checkIncludes("README.md", "Language broadening now follows [docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md): manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry must be `MET` or explicitly `EXCLUDED` before a slice can be promoted.",
    "README language accession boundary");
  checkIncludes("README.md", "`Bidirectional` is a named-slice verification term, not a blanket claim of universal translation, lossless source recovery, round-trip source identity, or complete semantic equivalence.",
    "README bidirectionality boundary");
  checkIncludes("README.md", "The first narrow round-trip probe is `npm run test:roundtrip-probe`.",
    "README round-trip probe boundary");
  checkIncludes("README.md", "The source-preserving `.ls` suite is `npm run test:source-identity-probe`: it now covers 15 fixtures, with 12 positive normalized `.ls` source identity, normalized parser-owned AST identity, and normalized IR identity checks plus 3 separate expected unsupported diagnostics.",
    "README source identity suite boundary");
  checkIncludes("README.md", "Canonical IR conformance, value-semantics matrix, control-flow matrix, function/scope matrix, and data-structure matrix: `npm run test:ir-conformance`",
    "README canonical IR conformance gate");
  checkIncludes("README.md", "Scoped 25-case edge-case matrix generator for value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics: `npm run test:edge-matrix`",
    "README edge-case matrix gate");
  checkIncludes("README.md", "Unsupported diagnostics certification for named unsupported JavaScript, `.ls`, Python, Lua, core-fallback, and target-emitter failures: `npm run test:unsupported-diagnostics`",
    "README unsupported diagnostics certification gate");
  checkIncludes("README.md", "Round-trip probe harness for tiny structural IR reparse and runtime-output equivalence cases: `npm run test:roundtrip-probe`",
    "README round-trip probe command");
  checkIncludes("README.md", "Durable conformance reports are written under `artifacts/conformance/`: `canonical-ir-conformance-report.json`, `roundtrip-probe-report.json`, `source-identity-probe-report.json`, and `unsupported-diagnostics-report.json`.",
    "README durable conformance report paths");
  checkIncludes("README.md", "Target-runtime IR lanes are useful evidence for emitted behavior, but they do not replace native runtime qualification",
    "README native runtime qualification boundary");
  checkIncludes("PROJECT_STATUS.md", "The active-docs map is [docs/INDEX.md](docs/INDEX.md)",
    "PROJECT_STATUS active docs map");
  checkIncludes("PROJECT_STATUS.md", "The current package/runtime expectation is also explicitly named",
    "PROJECT_STATUS package/runtime route");
  checkIncludes("PROJECT_STATUS.md", "docs/LUASCRIPT_1_0_EXIT_CRITERIA.md",
    "PROJECT_STATUS exit criteria charter link");
  checkIncludes("PROJECT_STATUS.md", "the bidirectionality contract is [docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md)",
    "PROJECT_STATUS bidirectionality contract link");
  checkIncludes("PROJECT_STATUS.md", "the language depth accession rules are [docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md)",
    "PROJECT_STATUS language accession rules link");
  checkIncludes("PROJECT_STATUS.md", "the public API/runtime contract is [docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)",
    "PROJECT_STATUS public API runtime contract link");
  checkIncludes("PROJECT_STATUS.md", "the conformance evidence binder is [docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md)",
    "PROJECT_STATUS conformance evidence binder link");
  checkIncludes("PROJECT_STATUS.md", "the Big Remaining Climb master ledger is [docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md)",
    "PROJECT_STATUS Big Remaining Climb ledger link");
  checkIncludes("PROJECT_STATUS.md", "The current next route is [docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md): new proof layers, schema-valid IR surface reconciliation, final API/runtime freeze, compatibility seal, and release-grade evidence generation.",
    "PROJECT_STATUS current route points to Big Remaining Climb");
  checkIncludes("PROJECT_STATUS.md", "`npm run beta:preflight` and `npm run beta:full` both passed on 2026-06-19 and were refreshed green on 2026-07-14",
    "PROJECT_STATUS beta gate refresh date");
  checkIncludes("PROJECT_STATUS.md", "is the active contract draft for root exports, CLI/API surface, runtime files, npm scripts, package files, semver policy, compatibility policy, and release-action boundaries.",
    "PROJECT_STATUS public API runtime boundary");
  checkIncludes("PROJECT_STATUS.md", "The 2026-07-16 no-release Denali freeze candidate keeps that package truth unchanged: no package `exports` map, no declared npm `bin`, no global CLI contract, no package version bump, no tag, and no publish action.",
    "PROJECT_STATUS no-release freeze candidate");
  checkIncludes("PROJECT_STATUS.md", "Root package import remains the only candidate public import surface; direct `node src/index.js` command handling is not public CLI.",
    "PROJECT_STATUS package import and CLI boundary");
  checkIncludes("PROJECT_STATUS.md", "Root-level `runtime/` helpers are repo-local for current Lua examples/tests and are outside the package `files` promise",
    "PROJECT_STATUS root runtime package-files boundary");
  checkIncludes("PROJECT_STATUS.md", "The bidirectionality contract is now explicit.",
    "PROJECT_STATUS bidirectionality contract section");
  checkIncludes("PROJECT_STATUS.md", "native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, round-trip source identity, and semantic equivalence",
    "PROJECT_STATUS bidirectionality layers");
  checkIncludes("PROJECT_STATUS.md", "The first round-trip probe harness is `npm run test:roundtrip-probe`",
    "PROJECT_STATUS round-trip probe harness");
  checkIncludes("PROJECT_STATUS.md", "Structural IR reparse means source -> current bridge IR -> emitted target -> current bridge IR preserves normalized IR after generated IDs and metadata are removed.",
    "PROJECT_STATUS structural reparse definition");
  checkIncludes("PROJECT_STATUS.md", "Runtime-output equivalence means source runtime and emitted target runtime agree on stdout for a fixture; it is not round-trip source identity or broad semantic equivalence.",
    "PROJECT_STATUS runtime equivalence boundary");
  checkIncludes("PROJECT_STATUS.md", "The round-trip manifest/report now records bidirectionality layer evidence for JavaScript, `.ls`, Python, and Lua.",
    "PROJECT_STATUS bidirectionality layer evidence map");
  checkIncludes("PROJECT_STATUS.md", "structural IR reparse is seeded for JavaScript, `.ls`, and Python but not claimed for Lua",
    "PROJECT_STATUS Lua structural reparse boundary");
  checkIncludes("PROJECT_STATUS.md", "The source-preserving `.ls` suite is `npm run test:source-identity-probe`, backed by `tests/roundtrip/source_identity_manifest.json` and `tests/roundtrip/source_identity_probe.test.js`.",
    "PROJECT_STATUS source identity suite");
  checkIncludes("PROJECT_STATUS.md", "Token-level text identity is reported but not required, and runtime-output equivalence, broad lossless source recovery, and broad semantic equivalence remain open.",
    "PROJECT_STATUS source identity boundary");
  checkIncludes("PROJECT_STATUS.md", "Language depth accession rules now define how any language slice can broaden after beta.",
    "PROJECT_STATUS language accession route");
  checkIncludes("PROJECT_STATUS.md", "its first filled candidate checklist is TypeScript V0.25 to V0.30 typed-JS depth, and that candidate is not promoted.",
    "PROJECT_STATUS TypeScript accession candidate boundary");
  checkIncludes("PROJECT_STATUS.md", "docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md",
    "PROJECT_STATUS canonical IR semantics inventory link");
  checkIncludes("PROJECT_STATUS.md", "docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md",
    "PROJECT_STATUS canonical IR semantics spec v0 link");
  checkIncludes("PROJECT_STATUS.md", "The first canonical IR conformance skeleton is `npm run test:ir-conformance`",
    "PROJECT_STATUS canonical IR conformance skeleton");
  checkIncludes("PROJECT_STATUS.md", "The first manifest-driven edge-case matrix generator is `npm run test:edge-matrix`",
    "PROJECT_STATUS edge-case matrix generator");
  checkIncludes("PROJECT_STATUS.md", "It now classifies 25 scoped edge cases by value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics",
    "PROJECT_STATUS edge-case category list");
  checkIncludes("PROJECT_STATUS.md", "The unsupported diagnostics certification gate is `npm run test:unsupported-diagnostics`.",
    "PROJECT_STATUS unsupported diagnostics certification gate");
  checkIncludes("PROJECT_STATUS.md", "It now verifies 21 named diagnostics across JavaScript source",
    "PROJECT_STATUS unsupported diagnostics expanded catalog");
  checkIncludes("PROJECT_STATUS.md", "while the `.ls` actual-program compiler route carries the named `throw` diagnostic through `unsupported_throw_diagnostic`.",
    "PROJECT_STATUS actual-program unsupported diagnostics route");
  checkIncludes("PROJECT_STATUS.md", "It organizes gates, generated reports, conformance suites, support matrix traceability, known unsupported areas, compatibility policy, release checklist, and reproducibility steps.",
    "PROJECT_STATUS conformance evidence binder scope");
  checkIncludes("PROJECT_STATUS.md", "Both are certification-style evidence structure only: not ISO certification, not third-party certification, and not a claim of true omni-language completion.",
    "PROJECT_STATUS conformance evidence binder boundary");
  checkIncludes("PROJECT_STATUS.md", "the JS/.ls/Python/Lua bidirectionality layer map is report-backed. The next executable slice is a real new proof layer",
    "PROJECT_STATUS source identity suite sealed");
  checkIncludes("PROJECT_STATUS.md", "Durable conformance reports are now written under `artifacts/conformance/`: `canonical-ir-conformance-report.json`, `roundtrip-probe-report.json`, `source-identity-probe-report.json`, and `unsupported-diagnostics-report.json`.",
    "PROJECT_STATUS durable conformance report paths");
  checkIncludes("PROJECT_STATUS.md", "`npm run stubs:check` continues to classify explicit unsupported diagnostics as intentional runtime diagnostics while preserving `must-fix` findings for fake implementation bodies.",
    "PROJECT_STATUS diagnostics versus stubs boundary");
  checkIncludes("PROJECT_STATUS.md", "It now includes a scoped value-semantics matrix for numbers, strings, booleans, null/nil/None equivalents, arrays, objects/records, truthiness, equality, coercion, and indexing across JavaScript, Lua, Python, and `.ls` emitted behavior.",
    "PROJECT_STATUS value semantics matrix");
  checkIncludes("PROJECT_STATUS.md", "It also includes a scoped control-flow matrix for if/else, while, numeric for, Python range lowering, break, continue, nested loops, short-circuiting, early returns, switch, conditional expressions, and target-specific lowering across emitted JavaScript/Lua/Python/`.ls`, with native/emitted runtime checks for JavaScript and Python and fail-closed diagnostics for JavaScript `for-of`, JavaScript `try/catch`, JavaScript tagged template literals, and Python source `continue`.",
    "PROJECT_STATUS control flow matrix");
  checkIncludes("PROJECT_STATUS.md", "The function/scope matrix adds lexical closures, shadowing, mutation through closures, recursion, nested functions, return normalization, explicit arity target-delta evidence, and fail-closed async/generator diagnostics across the current emitted JavaScript/Lua/Python/`.ls` surface, with JavaScript/Python runtime checks where claimed.",
    "PROJECT_STATUS function scope matrix");
  checkIncludes("PROJECT_STATUS.md", "The data-structure matrix adds array/object mutation, nested reads/writes, `.length`, slicing, membership, Python list iteration, Lua table record fields, object literals, and fail-closed JavaScript object-spread/destructuring diagnostics, with JavaScript/Python runtime checks only where those paths currently pass.",
    "PROJECT_STATUS data structure matrix");
  checkIncludes("README.md", "JavaScript source now has targeted Ring 3 footholds beyond V1 Ring 2: plain template literals, zero-based index/length, and a narrow branch-depth slice for return-only `switch` statements plus conditional expressions.",
    "README JavaScript Ring 3 branch-depth boundary");
  checkIncludes("PROJECT_STATUS.md", "A separate JavaScript Ring 3 branch-depth foothold covers return-only `switch` statements plus conditional expressions through `ring3_switch_conditional`",
    "PROJECT_STATUS JavaScript Ring 3 branch-depth boundary");
  checkIncludes("PROJECT_STATUS.md", "`npm run test:roundtrip-probe` passes the narrow round-trip probe harness",
    "PROJECT_STATUS round-trip probe health");
  checkIncludes("PROJECT_STATUS.md", "not a certification suite or `1.0` promotion",
    "PROJECT_STATUS conformance boundary");
  checkIncludes("PROJECT_STATUS.md", "[docs/quick-start/README.md](docs/quick-start/README.md), [docs/architecture/README.md](docs/architecture/README.md), and [docs/reference/README.md](docs/reference/README.md)",
    "PROJECT_STATUS package/runtime doc trio");
  checkIncludes("docs/INDEX.md", "This page is the canonical active-docs map",
    "documentation index active-docs map");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_1_0_EXIT_CRITERIA.md",
    "documentation index exit criteria charter");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md",
    "documentation index bidirectionality contract");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_LANGUAGE_ACCESSION_RULES.md",
    "documentation index language accession rules");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md",
    "documentation index public API runtime contract");
  checkIncludes("docs/INDEX.md", "Public API/runtime contract: [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md) defines package entrypoints, root exports, CLI/API surface, Node/runtime expectations, package files, semver policy, compatibility policy, and release-action boundaries for real `1.0`; its 2026-07-16 no-release freeze candidate records no package `exports` map, no npm `bin`, no global CLI, root-level `runtime/` outside package `files`, and no version bump or publish action.",
    "documentation index public API runtime boundary");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md",
    "documentation index conformance evidence binder");
  checkIncludes("docs/INDEX.md", "Conformance evidence binder: [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md) organizes gates, reports, conformance suites, support matrix traceability, known unsupported areas, compatibility policy, release checklist, and reproducibility steps without claiming ISO certification.",
    "documentation index conformance evidence binder boundary");
  checkFile("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md",
    "documentation index conformance evidence bundle index");
  checkIncludes("README.md", "[docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md)",
    "README conformance evidence bundle index link");
  checkIncludes("PROJECT_STATUS.md", "release-shaped conformance evidence bundle index is [docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md)",
    "PROJECT_STATUS conformance evidence bundle index link");
  checkIncludes("docs/INDEX.md", "Conformance evidence bundle index: [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) cross-links beta gates, language gates, Clarity dogfood/canon/super-canon evidence, IR conformance, edge matrix, round-trip probe, source identity probe, unsupported diagnostics, actual programs, support matrix, compatibility policy, report paths, fixture/hash expectations, known unsupported areas, and reproducibility steps as certification-style evidence, not certification.",
    "documentation index conformance evidence bundle boundary");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md",
    "documentation index Big Remaining Climb ledger");
  checkIncludes("docs/INDEX.md", "Big Remaining Climb master ledger: [LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md) tracks language-depth coverage, formal IR semantics, edge-case expansion, source-preserving round-trip proof, public API/runtime stabilization, conformance tests, compatibility rules, and certification-grade evidence.",
    "documentation index Big Remaining Climb boundary");
  checkIncludes("docs/INDEX.md", "Bidirectionality contract: [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md) separates native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, round-trip source identity, and semantic equivalence.",
    "documentation index bidirectionality layer list");
  checkIncludes("docs/INDEX.md", "Language depth accession rules: [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md) requires manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry before a language slice broadens.",
    "documentation index language accession boundary");
  checkIncludes("scripts/archive_audit.js", "\"LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md\"",
    "archive audit whitelist includes bidirectionality contract");
  checkIncludes("scripts/archive_audit.js", "\"LUASCRIPT_LANGUAGE_ACCESSION_RULES.md\"",
    "archive audit whitelist includes language accession rules");
  checkIncludes("scripts/archive_audit.js", "\"LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md\"",
    "archive audit whitelist includes public API runtime contract");
  checkIncludes("scripts/archive_audit.js", "\"LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md\"",
    "archive audit whitelist includes conformance evidence binder");
  checkIncludes("scripts/archive_audit.js", "\"LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md\"",
    "archive audit whitelist includes conformance evidence bundle index");
  checkIncludes("scripts/archive_audit.js", "\"LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md\"",
    "archive audit whitelist includes Big Remaining Climb ledger");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md",
    "documentation index canonical IR semantics inventory");
  checkIncludes("docs/INDEX.md", "LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md",
    "documentation index canonical IR semantics spec v0");
  checkIncludes("docs/INDEX.md", "Native language gates are listed in [Language Completion Rules](LANGUAGE_COMPLETION_RULES.md)",
    "documentation index gate boundary");
  checkIncludes("docs/INDEX.md", "Canonical IR conformance, value-semantics matrix, control-flow matrix, function/scope matrix, and data-structure matrix: `npm run test:ir-conformance`, using `tests/conformance/manifest.json`",
    "documentation index conformance gate");
  checkIncludes("docs/INDEX.md", "Edge-case matrix generator: `npm run test:edge-matrix`, using `tests/edge_matrix/manifest.json` for seeded value, control, scope, data, errors, target-specific behavior, and unsupported-diagnostic cases.",
    "documentation index edge-case matrix gate");
  checkIncludes("docs/INDEX.md", "Unsupported diagnostics certification: `npm run test:unsupported-diagnostics`, using `tests/ir/unsupported_diagnostics.test.js` for named JavaScript, `.ls`, Python, Lua, core-fallback, and target-emitter unsupported failures.",
    "documentation index unsupported diagnostics certification gate");
  checkIncludes("docs/INDEX.md", "Round-trip probe harness: `npm run test:roundtrip-probe`, using `tests/roundtrip/manifest.json` for tiny structural IR reparse and runtime-output equivalence checks.",
    "documentation index round-trip probe gate");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Scoped beta v0.1: a useful, non-strict pre-production beta handoff for named slices",
    "exit criteria beta separation");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Denali canonical `1.0`: a stable language/toolchain release where named support claims",
    "exit criteria Denali 1.0 separation");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "True omni-language 100%: the larger universal-IR, bidirectional, edge-case-exhaustive, certification-grade vision",
    "exit criteria omni-language separation");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`1.0-IR-SEMANTICS`",
    "exit criteria IR semantics criterion");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`1.0-BIDIRECTIONALITY`",
    "exit criteria bidirectionality criterion");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`1.0-PUBLIC-API-RUNTIME`",
    "exit criteria public API runtime criterion");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Package entrypoints, root exports, CLI/API surface, Node floor, runtime files, npm scripts, package files, semver policy, compatibility policy, and release-action boundaries are written and checked",
    "exit criteria public API runtime measurable condition");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Status: active contract draft; no-release freeze candidate prepared",
    "public API runtime contract status");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "This document defines the public API and runtime expectations for real LUASCRIPT `1.0`.",
    "public API runtime contract purpose");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "No package version, source API, compiler behavior, language syntax, or runtime behavior changes by this document alone.",
    "public API runtime no behavior change boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Declared npm `bin`: none.",
    "public API runtime bin boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Declared package `exports` map: none.",
    "public API runtime exports boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "The current root module exports these names:",
    "public API runtime root exports list");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "`UnifiedLuaScript`",
    "public API runtime UnifiedLuaScript export");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "`AgenticIDE`",
    "public API runtime AgenticIDE export");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "`src/index.js` has a direct `node src/index.js` command interface, but it is not the package root entrypoint and is not declared as an npm `bin`; this candidate does not freeze it as the public CLI.",
    "public API runtime CLI boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "root-level `runtime/` remains outside the current publish file promise",
    "public API runtime package file boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Release-script caveat: `version:bump` and `release:*` are release-action tools, not readiness checks.",
    "public API runtime release-script caveat");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "## No-Release Freeze Candidate Audit",
    "public API runtime no-release audit section");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Pre-`1.0` releases may change public API, CLI, package file layout, language slices, and runtime expectations when the change is documented and claims checks are updated.",
    "public API runtime semver pre-1.0 boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Compatibility applies only to documented public surfaces and named supported slices:",
    "public API runtime compatibility boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Release actions are deliberate operations, not documentation side effects.",
    "public API runtime release action boundary");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "confirm the evidence structure in [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md)",
    "public API runtime release evidence binder link");
  checkIncludes("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md", "Root package import strategy is frozen or deliberately changed with migration notes.",
    "public API runtime exit checklist");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "no package `exports` map is currently declared, so no subpath import is frozen by the no-release candidate",
    "conformance evidence binder exports boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "root-level `runtime/` helpers are repo-local under the current package `files` surface until release review includes or explicitly excludes them",
    "conformance evidence binder root runtime boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Layered bidirectionality without overclaim",
    "exit criteria layered bidirectionality boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`npm run test:roundtrip-probe`",
    "exit criteria round-trip probe gate");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Every bidirectional claim must name which layer is proven: native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, structural IR reparse, normalized source identity, token identity, round-trip source identity, or semantic equivalence.",
    "exit criteria bidirectionality measurement rule");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "The first round-trip probe harness, `npm run test:roundtrip-probe`, can provide tiny structural IR reparse evidence, runtime-output equivalence evidence, and JS/.ls/Python/Lua layer accounting, but it does not by itself promote broad round-trip source identity.",
    "exit criteria round-trip probe boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "The source identity harness, `npm run test:source-identity-probe`, currently proves normalized `.ls` source identity, normalized parser-owned AST identity, and normalized current bridge IR identity for 12 positive named fixtures and separately verifies 3 expected unsupported diagnostics.",
    "exit criteria source identity boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Round-trip source identity and semantic equivalence remain `OPEN` unless a current fixture explicitly proves the named slice.",
    "exit criteria round-trip and semantics boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`1.0-RUNTIME-GATES`",
    "exit criteria runtime criterion");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`1.0-LANGUAGE-ACCESSION`",
    "exit criteria language accession criterion");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Every language slice broadening must pass [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md): manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry.",
    "exit criteria language accession measurement rule");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`1.0-CONFORMANCE`",
    "exit criteria conformance criterion");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "[LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md)",
    "exit criteria conformance evidence binder link");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Every conformance or certification-style claim must route through [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md) and remain explicit about current evidence gaps.",
    "exit criteria conformance evidence binder measurement rule");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "A doc claims ISO certification, third-party certification, or certification-grade completeness while the evidence binder still marks current conformance as scoped.",
    "exit criteria certification overclaim blocker");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`npm run test:ir-conformance`",
    "exit criteria conformance gate");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`artifacts/conformance/canonical-ir-conformance-report.json`",
    "exit criteria canonical IR durable report");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`npm run test:schema-artifact-map`",
    "exit criteria schema artifact mapping gate");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`artifacts/conformance/schema-artifact-mapping-report.json`",
    "exit criteria schema artifact durable report");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`artifacts/conformance/roundtrip-probe-report.json`",
    "exit criteria roundtrip durable report");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`artifacts/conformance/source-identity-probe-report.json`",
    "exit criteria source identity durable report");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`artifacts/conformance/unsupported-diagnostics-report.json`",
    "exit criteria unsupported diagnostics durable report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "Status: active evidence binder",
    "conformance evidence binder status");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "[LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md): release-shaped conformance evidence bundle index",
    "conformance evidence binder bundle index link");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "This binder is a certification-style evidence structure for LUASCRIPT.",
    "conformance evidence binder purpose");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "It is not ISO certification, third-party certification, production certification, or a claim that LUASCRIPT has reached the user's true omni-language 100% summit.",
    "conformance evidence binder non-certification boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "Current conformance, edge-case, and round-trip suites are scoped skeletons.",
    "conformance evidence binder scoped suite boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "## Gate Families",
    "conformance evidence binder gate families");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "## Report And Artifact Index",
    "conformance evidence binder report index");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "The release-shaped bundle map is [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md). It is certification-style evidence, not certification",
    "conformance evidence binder bundle map boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "Status: active evidence bundle index",
    "conformance evidence bundle index status");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "This is a release-shaped conformance evidence bundle index for LUASCRIPT. It is certification-style evidence, not certification",
    "conformance evidence bundle index non-certification boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "beta gates, language gates, Clarity dogfood/canon/super-canon evidence, IR conformance, schema artifact mapping, edge matrix, round-trip probe, source identity probe, unsupported diagnostics, actual programs, support matrix, compatibility policy",
    "conformance evidence bundle index lane coverage");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "Fixture/hash expectations mean report-level manifest hashes, fixture or case hashes, pass/fail summaries, environment metadata, and support-matrix traceability",
    "conformance evidence bundle index fixture hash expectations");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/beta_readiness.json`",
    "conformance evidence bundle beta readiness report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/language_completion/*-report.json`",
    "conformance evidence bundle language reports");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/clarity_canon/dogfood-report.json`",
    "conformance evidence bundle dogfood report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/conformance/canonical-ir-conformance-report.json`",
    "conformance evidence bundle canonical IR report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/conformance/schema-artifact-mapping-report.json`",
    "conformance evidence bundle schema artifact mapping report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "| Schema artifact mapping | `npm run test:schema-artifact-map` |",
    "conformance evidence bundle schema artifact mapping lane");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "Dual-surface transition evidence; not release IR surface selection, not compiler-output change",
    "conformance evidence bundle schema artifact boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/edge_matrix/edge-case-matrix-report.json`",
    "conformance evidence bundle edge matrix report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/conformance/roundtrip-probe-report.json`",
    "conformance evidence bundle roundtrip report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/conformance/source-identity-probe-report.json`",
    "conformance evidence bundle source identity report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "`artifacts/conformance/unsupported-diagnostics-report.json`",
    "conformance evidence bundle unsupported diagnostics report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "## Known Unsupported Areas",
    "conformance evidence bundle known unsupported areas");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md", "No version bump, tag, publish, GitHub release, changelog seal, artifact signing",
    "conformance evidence bundle no release action boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/beta_readiness.json`",
    "conformance evidence binder beta readiness artifact");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/language_completion/*-report.json`",
    "conformance evidence binder language report artifacts");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/edge_matrix/edge-case-matrix-report.json`",
    "conformance evidence binder edge report artifact");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/conformance/canonical-ir-conformance-report.json`",
    "conformance evidence binder canonical IR report artifact");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/conformance/schema-artifact-mapping-report.json`",
    "conformance evidence binder schema artifact mapping report artifact");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "| Schema artifact mapping | `npm run test:schema-artifact-map` |",
    "conformance evidence binder schema artifact mapping gate family");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "21 positive conformance fixtures produce derived schema-valid canonical IR v1 artifacts; 11 expected diagnostics remain separate",
    "conformance evidence binder schema artifact mapping suite count");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/conformance/roundtrip-probe-report.json`",
    "conformance evidence binder roundtrip report artifact");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/conformance/source-identity-probe-report.json`",
    "conformance evidence binder source identity report artifact");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "`artifacts/conformance/unsupported-diagnostics-report.json`",
    "conformance evidence binder unsupported diagnostics report artifact");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "32 fixtures across value semantics, literals, bindings, scope, control flow, functions, calls, arrays/objects, errors, unsupported nodes, determinism, and target obligations, now mapped to named v1 evidence rules or documented gaps",
    "conformance evidence binder conformance fixture count");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "32 manifest fixtures mapped to named IR semantic rules or documented gaps",
    "conformance evidence binder v1 evidence mapping boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "25 scoped cases across value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics",
    "conformance evidence binder edge fixture count");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "21 named unsupported diagnostics for stable current JavaScript, `.ls`, Python, Lua, core fallback, and target-emitter failures",
    "conformance evidence binder unsupported diagnostics count");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "6 probes separating structural IR reparse and runtime-output equivalence",
    "conformance evidence binder roundtrip fixture count");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "JS/.ls/Python/Lua layer map recorded",
    "conformance evidence binder layer map scope");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "15 `.ls` fixtures: 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, and 3 expected unsupported diagnostics",
    "conformance evidence binder source identity fixture count");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "token identity is measured but non-gating",
    "conformance evidence binder token identity boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "26 language/target manifests for named native and target-runtime slices",
    "conformance evidence binder language manifest count");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "Durable local report closure: `npm run test:ir-conformance`, `npm run test:schema-artifact-map`, `npm run test:roundtrip-probe`, `npm run test:source-identity-probe`, and `npm run test:unsupported-diagnostics` now write standalone JSON reports under `artifacts/conformance/`",
    "conformance evidence binder durable report closure");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "not runtime-output equivalence, broad lossless recovery, or broad semantic equivalence",
    "conformance evidence binder source-preserving boundary");
  checkIncludes("tests/conformance/report_utils.js", "environmentMetadata",
    "conformance report helper records environment metadata");
  checkIncludes("tests/conformance/report_utils.js", "supportMatrixTraceability",
    "conformance report helper records support matrix traceability");
  checkIncludes("tests/conformance/canonical_ir_conformance.test.js", "canonical-ir-conformance-report.json",
    "canonical IR conformance harness writes durable report");
  checkIncludes("tests/roundtrip/roundtrip_probe.test.js", "roundtrip-probe-report.json",
    "round-trip harness writes durable report");
  checkIncludes("tests/roundtrip/roundtrip_probe.test.js", "sourcePreservingRoundTrip: 0",
    "round-trip report preserves source identity boundary");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "source-identity-probe-report.json",
    "source identity harness writes durable report");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "normalizedSourceIdentity",
    "source identity harness records normalized source identity");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "parserOwnedAstIdentity",
    "source identity harness records parser-owned AST identity policy");
  checkIncludes("tests/roundtrip/source_identity_probe.test.js", "normalizeParserOwnedAst",
    "source identity harness normalizes parser-owned AST artifacts");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "unsupported-diagnostics-report.json",
    "unsupported diagnostics harness writes durable report");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "Unsupported features should fail closed through named diagnostics or remain documented exclusions.",
    "conformance evidence binder unsupported boundary");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "## Reproducibility Steps",
    "conformance evidence binder reproducibility steps");
  checkIncludes("docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md", "A passing local run is evidence for the current named slices only; it is not ISO certification or true omni-language completion.",
    "conformance evidence binder reproducibility boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "npm run test:edge-matrix",
    "exit criteria edge-case matrix gate");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "npm run test:unsupported-diagnostics",
    "exit criteria unsupported diagnostics gate");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "value-semantics matrix",
    "exit criteria value semantics evidence");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "v1 evidence map for all 32 current conformance fixtures",
    "exit criteria IR semantics v1 evidence map boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "control-flow matrix",
    "exit criteria control flow evidence");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "function/scope matrix",
    "exit criteria function scope evidence");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "data-structure matrix",
    "exit criteria data structure evidence");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Every `1.0` support claim must name a slice, profile, fixture set, gate, and doc location",
    "exit criteria measurement rule");
  checkIncludes("docs/BETA_RELEASE_HANDOFF_V0_1.md", "The first package/runtime expectation slice is now named",
    "beta handoff package/runtime route");
  checkIncludes("docs/LUASCRIPT_MEGA_PLAN.md", "First canonical `1.0` package/runtime expectations",
    "mega plan package/runtime expectations");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Canonical `1.0` first-pass boundaries",
    "support matrix package/runtime boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The active-docs map is [INDEX.md](INDEX.md)",
    "support matrix active docs map");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Language depth accession follows [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md).",
    "support matrix language accession link");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The first scoped 25-case edge-case matrix generator is `npm run test:edge-matrix`.",
    "support matrix edge-case matrix boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The release-shaped `.ls` source identity suite is `npm run test:source-identity-probe`.",
    "support matrix source identity suite boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "JavaScript `for-of`, `try/catch`, `throw`, tagged template literals, rest parameters, async functions, generator functions, object spread, and destructuring patterns remain explicit named unsupported diagnostics",
    "support matrix named unsupported JavaScript boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The unsupported diagnostics certification gate is `npm run test:unsupported-diagnostics`. It currently verifies 21 named current failures across JavaScript source, `.ls` source/meta repair, Python source, Lua source, the active JavaScript core fallback, and JavaScript/Lua target emitters.",
    "support matrix unsupported diagnostics expanded catalog");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Any row promotion or slice broadening must have manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry marked `MET` or explicitly `EXCLUDED` with rationale",
    "support matrix language accession boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The conformance control-flow matrix additionally covers JavaScript if/else, while, numeric for, nested loops, break/continue, short-circuiting, early returns, switch statements, conditional expressions, emitted JavaScript/Lua/Python/`.ls` snippets, and JavaScript/Python runtime checks.",
    "support matrix JavaScript control-flow boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The conformance function/scope matrix covers lexical closures, shadowing, mutation through closures, recursion, nested functions, return normalization, emitted JavaScript/Lua/Python/`.ls` snippets, and JavaScript/Python runtime checks.",
    "support matrix JavaScript function scope boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The data-structure matrix covers JavaScript nested array/object mutation, object literals, record fields, and emitted JavaScript/Python runtime checks for that slice. JavaScript `for-of`, `try/catch`, `throw`, tagged template literals, rest parameters, async functions, generator functions, object spread, and destructuring patterns remain explicit named unsupported diagnostics in these matrices",
    "support matrix JavaScript data structure boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Targeted Ring 3 footholds cover plain template literals, zero-based index/length, and return-only `switch` statements with conditional expressions",
    "support matrix JavaScript Ring 3 foothold boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The data-structure matrix now adds a portable `.ls` length/slice/mutation fixture with emitted JavaScript/Python runtime checks",
    "support matrix LUASCRIPT data structure boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Lua one-based computed table indexes now lower to Python zero-based indexes for the named slice.",
    "support matrix Lua data structure boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The conformance control-flow matrix adds Python range lowering to emitted JavaScript/Lua/Python/`.ls` snippets plus Python/JavaScript runtime checks, while Python source `continue` remains an explicit unsupported diagnostic in this slice",
    "support matrix Python control-flow boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The function/scope matrix adds emitted-Python runtime checks for closure mutation, shadowing, recursion, nested functions, and return normalization; extra JavaScript call arguments remain a target-native delta because emitted Python preserves strict Python arity",
    "support matrix Python function scope boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The data-structure matrix adds native/emitted JavaScript/Python runtime checks for Python list/dict mutation, membership, nested reads/writes, list iteration, and length",
    "support matrix Python data structure boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Python V1.3 covers V1.2 plus bounded sequence slices through `sequence_slice_access.py`",
    "support matrix Python V1.3 bounded slice boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "Lua input is verified for its current V2.1 small-program slice",
    "language completion Lua V2.1 boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "Python is verified for its current V1.3 small-program slice",
    "language completion Python V1.3 boundary");
  checkIncludes("README.md", "Python source now has a V1.3 bounded sequence-slice foothold",
    "README Python V1.3 bounded slice boundary");
  checkIncludes("README.md", "Lua input now has a V2.1 table-index Python-target foothold",
    "README Lua V2.1 Python target boundary");
  checkIncludes("PROJECT_STATUS.md", "Lua input V2.1 qualification gate",
    "PROJECT_STATUS Lua V2.1 boundary");
  checkIncludes("PROJECT_STATUS.md", "Python V1.3 sequence-slice slice",
    "PROJECT_STATUS Python V1.3 boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Control Flow Matrix",
    "Denali ledger control flow matrix entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Lua and `.ls` runtime equivalence are not proven by this matrix because this local verification environment does not provide a Lua runtime on PATH.",
    "Denali ledger control flow runtime boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Function And Scope Matrix",
    "Denali ledger function scope matrix entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Data Structure Depth Pass",
    "Denali ledger data structure matrix entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Bidirectionality Definition Pass",
    "Denali ledger bidirectionality definition entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Round-trip source identity remains `MISSING EVIDENCE`",
    "Denali ledger round-trip boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Semantic equivalence remains `PARTIAL`",
    "Denali ledger semantic equivalence boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Round-Trip Probe Harness",
    "Denali ledger round-trip probe entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "JavaScript -> JavaScript, JavaScript -> emitted `.ls`, `.ls` -> JavaScript, and Python -> Python can pass structural IR reparse",
    "Denali ledger structural round-trip finding");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Runtime-output equivalence is useful behavioral evidence, but it is not full semantic equivalence.",
    "Denali ledger runtime-output equivalence boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Language Depth Accession Rules",
    "Denali ledger language accession entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "The TypeScript checklist is a candidate route only. TypeScript remains partial V0.25",
    "Denali ledger TypeScript accession candidate boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Python And Lua Depth Expansion Slice",
    "Denali ledger Python and Lua depth entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Edge-Case Matrix Generator",
    "Denali ledger edge-case matrix entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Added `tests/edge_matrix/manifest.json` as `canonical-edge-case-matrix-v0`.",
    "Denali ledger edge-case matrix manifest boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Unsupported Diagnostics Certification Pass",
    "Denali ledger unsupported diagnostics certification entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Replaced generic JavaScript bridge diagnostics for `for-of`, `throw`, `try/catch/finally`, tagged template literals, and unsupported parameter patterns with named diagnostics.",
    "Denali ledger named JavaScript diagnostics boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Unsupported Diagnostics Deepening For `.ls`/Python/Lua/JS",
    "Denali ledger expanded unsupported diagnostics entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "`npm run test:unsupported-diagnostics` | PASS: 21/21 named diagnostics",
    "Denali ledger expanded unsupported diagnostics verification seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Python V1.3 is still a small-program slice, not full Python.",
    "Denali ledger Python V1.3 boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Lua V2.1 is still a small-program slice, not full Lua.",
    "Denali ledger Lua V2.1 boundary");
  checkFile("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "Status: active contract",
    "language accession rules status");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "No accession may broaden a support claim unless every required row is `MET` or explicitly `EXCLUDED` with rationale.",
    "language accession no-promotion rule");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "manifest",
    "language accession manifest gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "parser coverage",
    "language accession parser coverage gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "lowering",
    "language accession lowering gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "emitter",
    "language accession emitter gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "native runtime",
    "language accession native runtime gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "target runtime",
    "language accession target runtime gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "docs",
    "language accession docs gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "support matrix",
    "language accession support matrix gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "claims check",
    "language accession claims check gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "Denali ledger entry",
    "language accession Denali ledger gate");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "## Checklist Template",
    "language accession checklist template");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "## Candidate Checklist: TypeScript V0.25 To V0.30 Typed-JS Depth",
    "language accession TypeScript candidate checklist");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "Candidate status: not promoted",
    "language accession TypeScript candidate not promoted");
  checkIncludes("docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md", "npm run language:typescript:bidirectional",
    "language accession TypeScript gate command");
  checkFile("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "Status: active contract",
    "bidirectionality contract status");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "Current `language:<name>:bidirectional` scripts are language-completion harness gates.",
    "bidirectionality contract harness boundary");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Native execution |",
    "bidirectionality contract native execution layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Source-to-IR |",
    "bidirectionality contract source-to-IR layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| IR-to-target |",
    "bidirectionality contract IR-to-target layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Target-runtime |",
    "bidirectionality contract target-runtime layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Emitted `.ls` |",
    "bidirectionality contract emitted .ls layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Round-trip source identity |",
    "bidirectionality contract round-trip layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Token identity |",
    "bidirectionality contract token identity layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Semantic equivalence |",
    "bidirectionality contract semantic equivalence layer");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "It does not mean:",
    "bidirectionality contract non-claim list");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "Canonical `1.0` cannot use an unqualified `bidirectional` claim.",
    "bidirectionality contract 1.0 exit rule");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "## Current Round-Trip Probe Harness",
    "bidirectionality contract round-trip probe section");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "`structural-ir-reparse`: source -> current bridge IR -> emitted target -> current bridge IR",
    "bidirectionality contract structural reparse definition");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "`runtime-output-equivalence`: source runtime and emitted target runtime must produce the same stdout",
    "bidirectionality contract runtime-output equivalence definition");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "## Current JS/.ls/Python/Lua Layer Map",
    "bidirectionality contract four-language layer map");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "| Lua | `PROVEN` named slice via `npm run language:lua:bidirectional`",
    "bidirectionality contract Lua layer row");
  checkIncludes("docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md", "`NOT CLAIMED` by the current round-trip probe",
    "bidirectionality contract Lua structural reparse boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "## Package/Runtime Boundary",
    "language completion package/runtime boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "## Bidirectionality Contract",
    "language completion bidirectionality contract section");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "Current `language:<name>:bidirectional` gates are manifest-backed slice gates",
    "language completion bidirectional gate boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "`npm run test:roundtrip-probe` is the first tiny harness for this boundary.",
    "language completion round-trip probe boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "Runtime-output equivalence is not a source identity claim.",
    "language completion runtime-output equivalence boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "## Language Depth Accession",
    "language completion language accession section");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "Accession requires manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry",
    "language completion accession gate list");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "`PARTIAL` accession evidence can identify a foothold, but it cannot raise a language tier.",
    "language completion partial accession boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "npm run language:elm:bidirectional",
    "language completion Elm native gate");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "npm run language:gleam:bidirectional",
    "language completion Gleam native gate");
  checkIncludes("docs/quick-start/README.md", "## Package And Runtime Contract",
    "quick-start package/runtime contract");
  checkIncludes("docs/architecture/README.md", "Architecture And Runtime Boundaries",
    "architecture active boundary page");
  checkIncludes("docs/architecture/README.md", "Bidirectionality is a layered evidence contract, not a broad architecture claim.",
    "architecture bidirectionality boundary");
  checkIncludes("docs/reference/README.md", "Reference Boundary",
    "reference boundary page");
  checkIncludes("docs/reference/README.md", "A `bidirectional` script name is not a lossless round-trip or full semantic-equivalence guarantee",
    "reference bidirectionality boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Bidirectionality terms follow [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md): native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, round-trip source identity, and semantic equivalence are separate claim layers.",
    "support matrix bidirectionality layer boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The first round-trip probe harness is `npm run test:roundtrip-probe`.",
    "support matrix round-trip probe boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "It does not promote any row to full round-trip source identity or broad semantic equivalence.",
    "support matrix round-trip no-promotion boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "The round-trip manifest/report now records a JS/.ls/Python/Lua bidirectionality layer map.",
    "support matrix bidirectionality layer map");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Lua structural IR reparse remains not claimed; only `.ls` has normalized source identity evidence",
    "support matrix layer map boundaries");
  checkIncludes("docs/canonical_ir_spec.md", "IR schema support reference, not a LUASCRIPT package/runtime `1.0` release claim",
    "canonical IR support-reference boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "The current language-completion bridge uses the legacy object-tree IR surface, not only the consolidated schema artifact.",
    "canonical IR inventory bridge boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "Current 1.0 semantics blocker: the live parser/lowerer path can pass lightweight invariants while failing the published JSON Schema enum",
    "canonical IR inventory schema mismatch boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "The latest published schema enum in `docs/canonical_ir.schema.json` contains 40 node kinds",
    "canonical IR inventory schema enum count");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "No runtime, compiler, lowerer, emitter, schema, or package API behavior was changed by this inventory pass.",
    "canonical IR inventory no behavior change boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "Conformance skeleton: `npm run test:ir-conformance` uses `tests/conformance/manifest.json`",
    "canonical IR inventory conformance skeleton");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "The current value matrix covers numbers, strings, booleans, null/nil/None equivalents, arrays, objects/records, truthiness, equality, coercion, indexing, `.ls` portable-profile repairs, and fail-closed diagnostics for `undefined`, `NaN`, and `Infinity`.",
    "canonical IR inventory value semantics matrix");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "The current control-flow matrix covers if/else, while, numeric for, Python range lowering, break, continue, nested loops, short-circuiting, early returns, switch, conditional expressions, target-specific lowering, JavaScript/Python native and emitted runtime checks, and fail-closed diagnostics for JavaScript `for-of`, JavaScript `try/catch`, JavaScript tagged template literals, and Python source `continue`",
    "canonical IR inventory control flow matrix");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "The current function/scope matrix covers lexical closures, shadowing, mutation through closures, recursion, nested functions, return normalization, JavaScript/Python native and emitted runtime checks, fail-closed diagnostics for JavaScript async/generator functions, and an explicit extra-arity target-native delta.",
    "canonical IR inventory function scope matrix");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md", "The current data-structure matrix covers array/object mutation, nested reads/writes, length, slicing, membership, Python list iteration, Lua table record fields, object literals, JavaScript/Python runtime checks where those paths pass, fail-closed diagnostics for JavaScript object spread and destructuring, and an explicit Lua-source table-indexing-to-Python target delta.",
    "canonical IR inventory data structure matrix");
  checkFile("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "Status: active v0 draft",
    "canonical IR semantics spec v0 status");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "This is the first formal semantics draft for the LUASCRIPT canonical IR.",
    "canonical IR semantics spec v0 identity");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "This is the first formal semantics draft for the LUASCRIPT canonical IR. It is not canonical `1.0`",
    "canonical IR semantics spec v0 not 1.0 boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "The release canonical IR surface is not yet chosen.",
    "canonical IR semantics spec v0 surface boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "Bidirectional claims must identify the proven layer: native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, round-trip source identity, or semantic equivalence.",
    "canonical IR semantics spec v0 bidirectionality boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`npm run test:roundtrip-probe` adds tiny structural IR reparse and runtime-output equivalence probes",
    "canonical IR semantics spec v0 round-trip probe boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "The current round-trip probe harness is `tests/roundtrip/manifest.json` plus `tests/roundtrip/roundtrip_probe.test.js`, exposed as `npm run test:roundtrip-probe`.",
    "canonical IR semantics spec v0 round-trip probe section");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "Every semantics section below is tied to current evidence or marked `MISSING EVIDENCE`.",
    "canonical IR semantics spec v0 evidence boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "No runtime, compiler, lowerer, emitter, schema, or package API behavior is changed by this spec draft.",
    "canonical IR semantics spec v0 no behavior change boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "Unsupported nodes must fail closed.",
    "canonical IR semantics spec v0 unsupported node boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "Target emitters must either preserve the profile value model or emit a deterministic unsupported diagnostic.",
    "canonical IR semantics spec v0 target obligation boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "The current conformance skeleton is `tests/conformance/manifest.json` plus `tests/conformance/canonical_ir_conformance.test.js`",
    "canonical IR semantics spec v0 conformance skeleton");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It compares scoped value semantics across JavaScript, Lua, Python, and `.ls` emitted behavior",
    "canonical IR semantics spec v0 value semantics matrix");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It compares scoped control-flow lowering across JavaScript, Lua, Python, and `.ls` emitted behavior: if/else, while, numeric for, Python range lowering, break, continue, nested loops, short-circuiting, early returns, switch, conditional expressions, and target-specific lowering.",
    "canonical IR semantics spec v0 control flow matrix");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It executes native and emitted JavaScript/Python runtime checks for the scoped control-flow fixtures where local runtimes are available.",
    "canonical IR semantics spec v0 control flow runtime checks");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It compares scoped function/scope behavior across JavaScript, Lua, Python, and `.ls` emitted behavior",
    "canonical IR semantics spec v0 function scope matrix");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It executes native and emitted JavaScript/Python runtime checks for the scoped function/scope fixtures where local runtimes are available.",
    "canonical IR semantics spec v0 function scope runtime checks");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It compares scoped data-structure behavior across JavaScript, Lua, Python, and `.ls` emitted behavior",
    "canonical IR semantics spec v0 data structure matrix");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It executes native and emitted JavaScript/Python runtime checks for the scoped data-structure fixtures where local runtimes are available and where the current target path actually passes.",
    "canonical IR semantics spec v0 data structure runtime checks");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It asserts fail-closed unsupported diagnostics for `undefined`, `NaN`, and `Infinity`",
    "canonical IR semantics spec v0 special value diagnostics");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It asserts fail-closed unsupported diagnostics for JavaScript `for-of`, JavaScript `try/catch`, JavaScript tagged template literals, and Python source `continue`",
    "canonical IR semantics spec v0 control flow diagnostics");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It asserts fail-closed unsupported diagnostics for JavaScript async and generator functions",
    "canonical IR semantics spec v0 function form diagnostics");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It asserts fail-closed unsupported diagnostics for JavaScript object spread and destructuring patterns",
    "canonical IR semantics spec v0 data structure diagnostics");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "It is a scoped skeleton, not a certification suite.",
    "canonical IR semantics spec v0 conformance boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "## V1 Evidence Mapping Draft",
    "canonical IR semantics spec v1 evidence map section");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "maps every current `tests/conformance/manifest.json` fixture to a named semantic rule or a documented gap",
    "canonical IR semantics spec v1 fixture mapping boundary");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-VAL-001`",
    "canonical IR semantics spec v1 value rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-LIT-001`",
    "canonical IR semantics spec v1 literal rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-BIND-001`",
    "canonical IR semantics spec v1 binding rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-SCOPE-001`",
    "canonical IR semantics spec v1 scope rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-CF-001`",
    "canonical IR semantics spec v1 control-flow rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-FN-001`",
    "canonical IR semantics spec v1 function rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-CALL-001`",
    "canonical IR semantics spec v1 call rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-ARR-OBJ-001`",
    "canonical IR semantics spec v1 arrays objects rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-ERR-001`",
    "canonical IR semantics spec v1 error rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-UNSUP-001`",
    "canonical IR semantics spec v1 unsupported rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-DET-001`",
    "canonical IR semantics spec v1 determinism rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "`IR-TGT-001`",
    "canonical IR semantics spec v1 target obligation rule");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "The 2026-07-27 schema-artifact mapping pass adds `npm run test:schema-artifact-map`.",
    "canonical IR semantics spec schema artifact mapping route");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "21/21 positive conformance fixtures",
    "canonical IR semantics spec schema artifact positive fixture count");
  checkIncludes("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md", "dual-surface transition evidence route",
    "canonical IR semantics spec schema artifact boundary");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript value semantic",
    "JavaScript bridge special value diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript control flow: for-of loops",
    "JavaScript bridge named for-of diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript exception flow: try/catch/finally",
    "JavaScript bridge named try/catch diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript exception flow: throw statements",
    "JavaScript bridge named throw diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript template literal form: tagged template literals",
    "JavaScript bridge named tagged-template diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript parameter pattern",
    "JavaScript bridge named parameter diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript function form",
    "JavaScript bridge function form diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript object spread",
    "JavaScript bridge object spread diagnostic");
  checkIncludes("src/compilers/js-to-ir.js", "Unsupported JavaScript variable declarator pattern",
    "JavaScript bridge destructuring diagnostic");
  checkIncludes("src/core_transpiler.js", "Unsupported JavaScript exception flow: throw statements",
    "JavaScript core transpiler named throw diagnostic");
  checkIncludes("src/transpiler/enhanced_transpiler.py", "Unsupported JavaScript exception flow: throw statements",
    "LUASCRIPT enhanced transpiler named throw diagnostic");
  checkIncludes("src/compilers/ir-to-js.js", "Unsupported JavaScript output IR node kind",
    "JavaScript emitter target-specific unsupported IR diagnostic");
  checkIncludes("src/compilers/ir-to-lua.js", "Unsupported Lua output IR node kind",
    "Lua emitter target-specific unsupported IR diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported JavaScript exception flow: throw statements",
    "unsupported diagnostics test certifies named throw diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported JavaScript object spread",
    "unsupported diagnostics test certifies JavaScript object spread diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported JavaScript variable declarator pattern: ObjectPattern",
    "unsupported diagnostics test certifies JavaScript destructuring diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", ".ls for-of syntax must fail with the named JS-like control-flow diagnostic",
    "unsupported diagnostics test certifies .ls for-of diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported repair strategy for indexing: one_based",
    "unsupported diagnostics test certifies .ls repair diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported Python input feature: slice steps",
    "unsupported diagnostics test certifies Python slice-step diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported Lua input feature: complex table keys",
    "unsupported diagnostics test certifies Lua complex-key diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Core transpiler fallback must fail with a named JavaScript throw diagnostic",
    "unsupported diagnostics test certifies core fallback named throw diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported JavaScript output IR node kind: ImaginaryNode",
    "unsupported diagnostics test certifies JavaScript output diagnostic");
  checkIncludes("tests/ir/unsupported_diagnostics.test.js", "Unsupported Lua output IR node kind: ImaginaryNode",
    "unsupported diagnostics test certifies Lua output diagnostic");
  checkIncludes("tests/clarity_canon/stub_inventory_manifest.json", "\"classification\": \"intentional-runtime-diagnostic\"",
    "stub inventory distinguishes intentional diagnostics from must-fix stubs");
  checkFile("tests/conformance/manifest.json");
  checkFile("tests/conformance/canonical_ir_conformance.test.js");
  checkFile("tests/roundtrip/manifest.json");
  checkFile("tests/roundtrip/roundtrip_probe.test.js");
  const conformanceManifest = readJson("tests/conformance/manifest.json");
  const canonicalIrSemanticsSpec = readText("docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md");
  check(conformanceManifest.status === "scoped-skeleton",
    "conformance manifest keeps scoped skeleton status");
  check(Array.isArray(conformanceManifest.defaultTargets) &&
    conformanceManifest.defaultTargets.length === 4 &&
    ["lua", "javascript", "luascript", "python"].every((target) => conformanceManifest.defaultTargets.includes(target)),
  "conformance manifest targets current stable bridge emitters");
  check(conformanceManifest.valueSemanticsMatrix &&
    conformanceManifest.valueSemanticsMatrix.status === "scoped" &&
    ["javascript", "lua", "python", "luascript"].every((target) => conformanceManifest.valueSemanticsMatrix.comparisonTargets.includes(target)),
  "conformance manifest has scoped JavaScript/Lua/Python/.ls value semantics matrix");
  check(conformanceManifest.valueSemanticsMatrix &&
    ["numbers", "strings", "booleans", "null-nil-none", "arrays", "objects-records", "truthiness", "equality", "coercion", "indexing"].every((item) => conformanceManifest.valueSemanticsMatrix.covered.includes(item)),
  "conformance manifest value matrix covers required value categories");
  check(conformanceManifest.valueSemanticsMatrix &&
    ["undefined", "NaN", "Infinity"].every((item) => conformanceManifest.valueSemanticsMatrix.unsupportedAsDiagnostics.includes(item)),
  "conformance manifest names unsupported special values");
  check(conformanceManifest.controlFlowMatrix &&
    conformanceManifest.controlFlowMatrix.status === "scoped" &&
    ["javascript", "lua", "python", "luascript"].every((target) => conformanceManifest.controlFlowMatrix.comparisonTargets.includes(target)),
  "conformance manifest has scoped JavaScript/Lua/Python/.ls control flow matrix");
  check(conformanceManifest.controlFlowMatrix &&
    ["javascript", "python"].every((target) => conformanceManifest.controlFlowMatrix.runtimeTargets.includes(target)),
  "conformance manifest control flow matrix has JavaScript/Python runtime checks");
  check(conformanceManifest.controlFlowMatrix &&
    ["if-else", "while", "numeric-for", "python-range", "break", "continue", "nested-loops", "short-circuiting", "early-returns", "switch", "conditional-expression", "target-specific-lowering"].every((item) => conformanceManifest.controlFlowMatrix.covered.includes(item)),
  "conformance manifest control flow matrix covers required categories");
  check(conformanceManifest.controlFlowMatrix &&
    ["javascript-for-of", "python-continue-source", "javascript-try-catch", "javascript-tagged-template"].every((item) => conformanceManifest.controlFlowMatrix.unsupportedAsDiagnostics.includes(item)),
  "conformance manifest names unsupported control flow values");
  check(conformanceManifest.functionScopeMatrix &&
    conformanceManifest.functionScopeMatrix.status === "scoped" &&
    ["javascript", "lua", "python", "luascript"].every((target) => conformanceManifest.functionScopeMatrix.comparisonTargets.includes(target)),
  "conformance manifest has scoped JavaScript/Lua/Python/.ls function scope matrix");
  check(conformanceManifest.functionScopeMatrix &&
    ["javascript", "python"].every((target) => conformanceManifest.functionScopeMatrix.runtimeTargets.includes(target)),
  "conformance manifest function scope matrix has JavaScript/Python runtime checks");
  check(conformanceManifest.functionScopeMatrix &&
    ["lexical-closures", "shadowing", "mutation-through-closures", "recursion", "arity-behavior", "nested-functions", "return-normalization", "unsupported-advanced-function-forms"].every((item) => conformanceManifest.functionScopeMatrix.covered.includes(item)),
  "conformance manifest function scope matrix covers required categories");
  check(conformanceManifest.functionScopeMatrix &&
    ["javascript-async-function", "javascript-generator-function"].every((item) => conformanceManifest.functionScopeMatrix.unsupportedAsDiagnostics.includes(item)),
  "conformance manifest names unsupported function form values");
  check(conformanceManifest.dataStructureMatrix &&
    conformanceManifest.dataStructureMatrix.status === "scoped" &&
    ["javascript", "lua", "python", "luascript"].every((target) => conformanceManifest.dataStructureMatrix.comparisonTargets.includes(target)),
  "conformance manifest has scoped JavaScript/Lua/Python/.ls data structure matrix");
  check(conformanceManifest.dataStructureMatrix &&
    ["javascript", "python"].every((target) => conformanceManifest.dataStructureMatrix.runtimeTargets.includes(target)),
  "conformance manifest data structure matrix has JavaScript/Python runtime checks");
  check(conformanceManifest.dataStructureMatrix &&
    ["array-mutation", "object-mutation", "nested-reads-writes", "length", "slicing", "membership", "iteration", "record-fields", "object-literals", "unsupported-deep-structures"].every((item) => conformanceManifest.dataStructureMatrix.covered.includes(item)),
  "conformance manifest data structure matrix covers required categories");
  check(conformanceManifest.dataStructureMatrix &&
    ["javascript-object-spread", "javascript-destructuring-pattern"].every((item) => conformanceManifest.dataStructureMatrix.unsupportedAsDiagnostics.includes(item)),
  "conformance manifest names unsupported data structure values");
  for (const fixture of conformanceManifest.fixtures || []) {
    check(canonicalIrSemanticsSpec.includes(`| \`${fixture.name}\` |`),
      `canonical IR semantics v1 evidence map includes ${fixture.name}`);
  }
  checkManifestEntry(conformanceManifest.fixtures, "values_bindings_control_flow", "conformance manifest",
    (fixture) => Array.isArray(fixture.sections) && fixture.sections.includes("control-flow") &&
      fixture.targets && fixture.targets.lua && fixture.targets.python,
    "covers values, bindings, and control flow");
  checkManifestEntry(conformanceManifest.fixtures, "functions_calls_arrays_objects", "conformance manifest",
    (fixture) => Array.isArray(fixture.sections) && fixture.sections.includes("objects-arrays") &&
      fixture.targets && fixture.targets.javascript && fixture.targets.luascript,
    "covers functions, calls, arrays, and objects");
  checkManifestEntry(conformanceManifest.fixtures, "primitive_values_null_equivalents", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sections.includes("null-nil-none") &&
      fixture.targets.lua.includes.includes("local empty = nil") &&
      fixture.targets.python.includes.includes("empty = None"),
    "covers primitive values and null equivalents");
  checkManifestEntry(conformanceManifest.fixtures, "arrays_objects_records_indexing", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sections.includes("objects-records") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("__ls_set_index")) &&
      fixture.targets.python.includes.some((snippet) => snippet.includes("record[\"first\"]")),
    "covers arrays, records, and indexing");
  checkManifestEntry(conformanceManifest.fixtures, "truthiness_target_native_delta", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "target-native-delta" &&
      fixture.sections.includes("truthiness") &&
      fixture.targets.lua.includes.includes("if zero then") &&
      fixture.targets.python.includes.includes("if zero:"),
    "records raw truthiness target-native delta");
  checkManifestEntry(conformanceManifest.fixtures, "equality_and_coercion_target_delta", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "target-native-delta" &&
      fixture.sections.includes("equality") &&
      fixture.sections.includes("coercion") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("tostring")) &&
      fixture.targets.python.includes.includes("text = (\"v\" + a)"),
    "records equality and coercion target-native delta");
  checkManifestEntry(conformanceManifest.fixtures, "portable_value_semantics_profile", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "profile-repaired" &&
      fixture.sourceLanguage === "luascript" &&
      fixture.source.includes("portable_semantics_v1") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("__ls_truthy")) &&
      fixture.targets.python.includes.some((snippet) => snippet.includes("__ls_add")),
    "covers portable value semantics repairs");
  checkManifestEntry(conformanceManifest.fixtures, "control_flow_nested_break_continue_early_return", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sections.includes("early-returns") &&
      fixture.sections.includes("nested-loops") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("goto __continue_")) &&
      fixture.targets.python.includes.includes("return (total + inner)") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput === "control_matrix 12" &&
      fixture.runtimeChecks.targets.javascript.expectedOutput === "control_matrix 12" &&
      fixture.runtimeChecks.targets.python.expectedOutput === "control_matrix 12",
    "covers nested break/continue early return runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "short_circuit_side_effects", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sections.includes("short-circuiting") &&
      fixture.targets.lua.includes.includes("if (false and bump()) then") &&
      fixture.targets.python.includes.includes("elif (True or bump()):") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput === "short_circuit 2",
    "covers short-circuit control flow runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "control_javascript_switch_conditional", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sourceLanguage === "javascript" &&
      fixture.sections.includes("switch") &&
      fixture.sections.includes("conditional-expression") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("local __switch_")) &&
      fixture.targets.javascript.includes.includes("switch (value)") &&
      fixture.targets.luascript.includes.includes("switch (value)") &&
      fixture.unsupportedTargets.python.messageIncludes.includes("Unsupported IR node kind for Python emission: SwitchStatement") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput === "js_switch_conditional one two many" &&
      fixture.runtimeChecks.targets.javascript.expectedOutput === "js_switch_conditional one two many",
    "covers JavaScript switch plus conditional-expression branch depth");
  checkManifestEntry(conformanceManifest.fixtures, "python_range_forward_control_flow", "conformance manifest",
    (fixture) => fixture.sourceLanguage === "python" &&
      fixture.sections.includes("python-range") &&
      fixture.targets.javascript.includes.some((snippet) => snippet.includes("for (let value = 1")) &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput === "py_range_forward 10",
    "covers Python positive range control flow");
  checkManifestEntry(conformanceManifest.fixtures, "python_range_negative_step_control_flow", "conformance manifest",
    (fixture) => fixture.sourceLanguage === "python" &&
      fixture.sections.includes("python-range") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("value = (value + - 2)")) &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput === "py_range_step 9",
    "covers Python negative step range control flow");
  checkManifestEntry(conformanceManifest.fixtures, "function_scope_closure_shadow_mutation", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sections.includes("lexical-closures") &&
      fixture.sections.includes("mutation-through-closures") &&
      fixture.targets.python.includes.includes("nonlocal value") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput === "closure_scope 5 10 10 100" &&
      fixture.runtimeChecks.targets.python.expectedOutput === "closure_scope 5 10 10 100",
    "covers closure shadow mutation function scope runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "function_recursion_return_normalization", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sections.includes("recursion") &&
      fixture.sections.includes("return-normalization") &&
      fixture.targets.lua.includes.includes("return") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.targets.javascript.expectedOutput === "function_returns 120 7 undefined" &&
      fixture.runtimeChecks.targets.python.expectedOutput === "function_returns 120 7 None",
    "covers recursion and return normalization runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "function_extra_arity_target_delta", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "target-native-delta" &&
      fixture.sections.includes("arity-behavior") &&
      fixture.targets.python.includes.includes("__ls_print(\"arity_extra\", first(9, 10))") &&
      fixture.notes.includes("target-native delta"),
    "records function extra arity target-native delta");
  checkManifestEntry(conformanceManifest.fixtures, "data_nested_js_arrays_objects_records", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sections.includes("nested-reads-writes") &&
      fixture.sections.includes("object-mutation") &&
      fixture.targets.python.includes.includes("rows[0][\"points\"] = (rows[0][\"points\"] + 1)") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput === "js_nested_structures Ada 8 true" &&
      fixture.runtimeChecks.targets.python.expectedOutput === "js_nested_structures Ada 8 True",
    "covers JavaScript nested data structure runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "data_luascript_portable_length_slice_mutation", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "profile-repaired" &&
      fixture.sourceLanguage === "luascript" &&
      fixture.sections.includes("slicing") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("__ls_slice")) &&
      fixture.targets.python.includes.includes("__ls_set_index(values, 2, __ls_add(__ls_index(values, 2), len(values)))") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.targets.javascript.expectedOutput === "ls_data_structures Ada 10 4 2" &&
      fixture.runtimeChecks.targets.python.expectedOutput === "ls_data_structures Ada 10 4 2",
    "covers LUASCRIPT portable length slice mutation runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "data_python_list_dict_membership_mutation", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sourceLanguage === "python" &&
      fixture.sections.includes("membership") &&
      fixture.sections.includes("nested-reads-writes") &&
      fixture.targets.javascript.includes.some((snippet) => snippet.includes("__py_in_key")) &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.native.expectedOutput.includes("py_dict_mutation Ada 7 dict_ok") &&
      fixture.runtimeChecks.targets.javascript.expectedOutput.includes("py_list_mutation 3 2 5 membership_ok"),
    "covers Python list dict membership mutation runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "data_python_list_iteration_length", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "aligned-current-slice" &&
      fixture.sourceLanguage === "python" &&
      fixture.sections.includes("iteration") &&
      fixture.sections.includes("length") &&
      fixture.targets.lua.includes.some((snippet) => snippet.includes("__py_len")) &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.targets.python.expectedOutput === "py_for_list 9 3",
    "covers Python list iteration length runtime checks");
  checkManifestEntry(conformanceManifest.fixtures, "data_lua_table_record_fields", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "target-native-delta" &&
      fixture.sourceLanguage === "lua" &&
      fixture.sections.includes("record-fields") &&
      fixture.targets.javascript.includes.includes("profile.scores[1] = (profile.scores[1] + 3);") &&
      fixture.runtimeChecks &&
      fixture.runtimeChecks.targets.javascript.expectedOutput === "lua_table_record Lua 7" &&
      fixture.notes.includes("Python runtime is not claimed"),
    "records Lua table record field target delta");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_target_diagnostic", "conformance manifest",
    (fixture) => fixture.unsupportedTargets && fixture.unsupportedTargets.sql &&
      fixture.unsupportedTargets.sql.messageIncludes &&
      fixture.unsupportedTargets.sql.messageIncludes.includes("Unsupported target language: sql"),
    "covers unsupported target diagnostic");
  for (const [name, value] of [
    ["unsupported_undefined_value_semantic", "undefined"],
    ["unsupported_nan_value_semantic", "NaN"],
    ["unsupported_infinity_value_semantic", "Infinity"]
  ]) {
    checkManifestEntry(conformanceManifest.fixtures, name, "conformance manifest",
      (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
        fixture.expectedFailure &&
        fixture.expectedFailure.phase === "compile" &&
        fixture.expectedFailure.messageIncludes.includes(`Unsupported JavaScript value semantic: ${value}`),
      `fails closed for ${value}`);
  }
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_js_for_of_control_flow", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported JavaScript control flow: for-of loops"),
    "fails closed for JavaScript for-of");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_python_continue_control_flow", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported Python input feature: continue statements"),
    "fails closed for Python source continue");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_js_try_catch_control_flow", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported JavaScript exception flow: try/catch/finally"),
    "fails closed for JavaScript try/catch");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_js_tagged_template_control_flow", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported JavaScript template literal form: tagged template literals"),
    "fails closed for JavaScript tagged template literals");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_js_async_function_scope", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported JavaScript function form: async functions"),
    "fails closed for JavaScript async functions");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_js_generator_function_scope", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported JavaScript function form: generator functions"),
    "fails closed for JavaScript generator functions");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_js_object_spread_structure", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported JavaScript object spread"),
    "fails closed for JavaScript object spread");
  checkManifestEntry(conformanceManifest.fixtures, "unsupported_js_destructuring_structure", "conformance manifest",
    (fixture) => fixture.semanticsStatus === "unsupported-diagnostic" &&
      fixture.expectedFailure &&
      fixture.expectedFailure.messageIncludes.includes("Unsupported JavaScript variable declarator pattern: ObjectPattern"),
    "fails closed for JavaScript destructuring patterns");
  const roundTripManifest = readJson("tests/roundtrip/manifest.json");
  check(roundTripManifest.status === "scoped-round-trip-probe",
    "round-trip manifest keeps scoped probe status");
  check(Array.isArray(roundTripManifest.modes) &&
    ["structural-ir-reparse", "runtime-output-equivalence"].every((mode) => roundTripManifest.modes.includes(mode)),
  "round-trip manifest declares structural and runtime-output modes");
  check(roundTripManifest.languageLayerEvidence &&
    roundTripManifest.languageLayerEvidence.languages,
  "round-trip manifest records bidirectionality layer evidence");
  check(roundTripManifest.languageLayerEvidence &&
    JSON.stringify(roundTripManifest.languageLayerEvidence.requiredLayers) === JSON.stringify(bidirectionalityLayerKeys),
  "round-trip manifest keeps required bidirectionality layer keys");
  for (const language of bidirectionalityLayerLanguages) {
    const entry = roundTripManifest.languageLayerEvidence &&
      roundTripManifest.languageLayerEvidence.languages &&
      roundTripManifest.languageLayerEvidence.languages[language];
    check(Boolean(entry), `round-trip manifest records ${language} layer evidence`);
    check(entry && typeof entry.languageGate === "string" && entry.languageGate.includes(`language:${language}:bidirectional`),
      `round-trip manifest ${language} layer evidence names language gate`);
    check(entry && typeof entry.report === "string",
      `round-trip manifest ${language} layer evidence names report`);
    for (const layer of bidirectionalityLayerKeys) {
      check(entry && entry.layers && typeof entry.layers[layer] === "string",
        `round-trip manifest ${language} records ${layer}`);
    }
    check(entry && Array.isArray(entry.evidence) && entry.evidence.length >= 1,
      `round-trip manifest ${language} layer evidence lists evidence`);
    check(entry && Array.isArray(entry.boundaries) && entry.boundaries.length >= 1,
      `round-trip manifest ${language} layer evidence lists boundaries`);
  }
  check(roundTripManifest.languageLayerEvidence.languages.lua.layers.structuralIrReparse === "not-claimed",
    "round-trip manifest keeps Lua structural IR reparse unclaimed");
  check(roundTripManifest.languageLayerEvidence.languages.luascript.layers.tokenIdentity === "measured-non-gating",
    "round-trip manifest keeps .ls token identity measured non-gating");
  checkManifestEntry(roundTripManifest.fixtures, "javascript_to_javascript_structural_ir", "round-trip manifest",
    (fixture) => fixture.mode === "structural-ir-reparse" &&
      fixture.sourceLanguage === "javascript" &&
      fixture.targetLanguage === "javascript" &&
      fixture.notes.includes("not source formatting identity"),
    "covers JavaScript structural IR reparse");
  checkManifestEntry(roundTripManifest.fixtures, "javascript_to_luascript_structural_ir", "round-trip manifest",
    (fixture) => fixture.mode === "structural-ir-reparse" &&
      fixture.targetLanguage === "luascript" &&
      fixture.notes.includes("emitted .ls"),
    "covers emitted .ls structural IR reparse");
  checkManifestEntry(roundTripManifest.fixtures, "luascript_to_javascript_structural_ir", "round-trip manifest",
    (fixture) => fixture.mode === "structural-ir-reparse" &&
      fixture.sourceLanguage === "luascript" &&
      fixture.targetLanguage === "javascript",
    "covers LUASCRIPT to JavaScript structural IR reparse");
  checkManifestEntry(roundTripManifest.fixtures, "python_to_python_structural_ir", "round-trip manifest",
    (fixture) => fixture.mode === "structural-ir-reparse" &&
      fixture.sourceLanguage === "python" &&
      fixture.targetLanguage === "python",
    "covers Python structural IR reparse");
  checkManifestEntry(roundTripManifest.fixtures, "javascript_to_python_runtime_output", "round-trip manifest",
    (fixture) => fixture.mode === "runtime-output-equivalence" &&
      fixture.expectedOutput === "rt_js_py 5" &&
      fixture.notes.includes("runtime-output equivalence only"),
    "covers JavaScript to Python runtime-output equivalence");
  checkManifestEntry(roundTripManifest.fixtures, "python_to_javascript_runtime_output", "round-trip manifest",
    (fixture) => fixture.mode === "runtime-output-equivalence" &&
      fixture.expectedOutput === "rt_py_js 9" &&
      fixture.notes.includes("not IR identity"),
    "covers Python to JavaScript runtime-output equivalence");
  checkIncludes("tests/roundtrip/roundtrip_probe.test.js", "stableIr",
    "round-trip harness normalizes IR");
  checkIncludes("tests/roundtrip/roundtrip_probe.test.js", "[\"metadata\", \"loc\", \"range\", \"raw\", \"id\"]",
    "round-trip harness drops generated metadata and ids");
  checkIncludes("tests/roundtrip/roundtrip_probe.test.js", "Round-trip probe harness passed:",
    "round-trip harness summary output");
  checkIncludes("tests/roundtrip/roundtrip_probe.test.js", "languageLayerEvidence",
    "round-trip report writes bidirectionality layer evidence");
  checkIncludes("docs/ir/ARCHITECTURE.md", "Status: IR support reference",
    "IR architecture support-reference boundary");
  checkIncludes("docs/ir/USAGE_GUIDE.md", "Examples here are illustrative unless they are covered by current manifests",
    "IR usage support-reference boundary");
  checkIncludes("docs/OLD LUASCRIPT DOCS/README.md", "Nothing here is a current guidance document",
    "archive root is archive-only");
}

function checkMathematicalClaims() {
  const actual = readJson("tests/actual_programs/manifest.json").programs;
  const clarity = readJson("tests/clarity_canon/manifest.json").dogfoodFixtures;
  const examplesIntegration = readText("tests/examples_integration.test.js");

  const mathEntries = [
    {
      name: "mathematical_notation_core",
      source: "examples/mathematical_notation_core.ls"
    }
  ];

  for (let index = 1; index <= 18; index++) {
    mathEntries.push({
      name: `mathematical_notation_rehab_v${index}`,
      source: `examples/mathematical_notation_rehab_v${index}.ls`
    });
  }

  for (const item of mathEntries) {
    checkFile(item.source);
    checkManifestEntry(
      actual,
      item.name,
      "actual-program manifest",
      (entry) => entry.source === item.source && Array.isArray(entry.expectedOutputIncludes) &&
        entry.expectedOutputIncludes.length > 0,
      "has source and strict output includes"
    );
    checkManifestEntry(
      clarity,
      `actual_${item.name}`,
      "clarity dogfood manifest",
      (entry) => entry.source === item.source && Array.isArray(entry.expectedOutputIncludes) &&
        entry.expectedOutputIncludes.length > 0,
      "has source and strict output includes"
    );
    check(examplesIntegration.includes(item.source), `examples integration includes ${item.source}`);
  }

  const unsupportedMath = [
    "unsupported_math_binder_glyph_placement",
    "unsupported_math_binder_missing_upper",
    "unsupported_math_limit_start_value",
    "unsupported_math_integral_missing_differential",
    "unsupported_math_integral_bare_missing_differential",
    "unsupported_math_cross_dimension",
    "unsupported_math_unit_add_dimension",
    "unsupported_math_unit_operator_dimension",
    "unsupported_math_matrix_dimensions",
    "unsupported_math_symbolic_unknown_formula",
    "unsupported_math_symbolic_dimension_mismatch",
    "unsupported_math_symbolic_derivative_function",
    "unsupported_math_frequency_response_parameters",
    "unsupported_math_rlc_positive_values",
    "unsupported_math_frequency_sweep_count",
    "unsupported_math_response_crossing_missing"
  ];

  for (const name of unsupportedMath) {
    checkManifestEntry(
      actual,
      name,
      "actual-program manifest",
      (entry) => Boolean(entry.expectedFailure || entry.expectedRuntimeFailure) &&
        Boolean((entry.expectedFailurePatterns || entry.expectedRuntimeFailurePatterns || []).length),
      "has explicit expected diagnostic"
    );
    checkManifestEntry(
      clarity,
      `actual_${name}`,
      "clarity dogfood manifest",
      (entry) => Boolean(entry.expectedFailure || entry.expectedRuntimeFailure) &&
        Boolean((entry.expectedFailurePatterns || entry.expectedRuntimeFailurePatterns || []).length),
      "has explicit expected diagnostic"
    );
  }

  const runtime = readText("runtime/core/enhanced_runtime.lua");
  const runtimeSnippets = [
    "function _LS.math.matrix",
    "function _LS.math.transpose",
    "function _LS.math.matmul",
    "function _LS.math.matrix_vector",
    "function _LS.math.determinant2",
    "function _LS.math.solve2",
    "function _LS.math.identity",
    "function _LS.math.trace",
    "function _LS.math.lorentz_force",
    "function _LS.math.sym",
    "function _LS.math.symbolic_simplify",
    "function _LS.math.solve_linear",
    "function _LS.math.solve_linear_system",
    "function _LS.math.solution_get",
    "function _LS.math.symbolic_dimension_format",
    "function _LS.math.symbolic_assert_dimensions",
    "function _LS.math.physics_dimensions",
    "function _LS.math.symbolic_substitute",
    "function _LS.math.symbolic_derivative",
    "function _LS.math.symbolic_sin",
    "function _LS.math.symbolic_impedance_C",
    "function _LS.math.rc_lowpass_transfer",
    "function _LS.math.rl_lowpass_transfer",
    "function _LS.math.frequency_response",
    "function _LS.math.response_magnitude",
    "function _LS.math.frequency_sweep",
    "function _LS.math.frequency_response_sweep",
    "function _LS.math.response_peak",
    "function _LS.math.response_crossing_frequency",
    "function _LS.math.rc_cutoff_frequency",
    "function _LS.math.rlc_resonant_frequency",
    "function _LS.math.rlc_series_impedance",
    "function _LS.math.physics_formula",
    "function _LS.math.formula_render",
    "unit_metatable.__add",
    "unit_metatable.__mul",
    "unit_metatable.__div",
    "unit_metatable.__pow"
  ];
  for (const snippet of runtimeSnippets) {
    check(runtime.includes(snippet), `runtime math support contains ${snippet}`);
  }

  const transpiler = readText("src/transpiler/enhanced_transpiler.py");
  const transpilerSnippets = [
    "'matrix': '_LS.math.matrix'",
    "'transpose': '_LS.math.transpose'",
    "'matmul': '_LS.math.matmul'",
    "'matrix_vector': '_LS.math.matrix_vector'",
    "'determinant2': '_LS.math.determinant2'",
    "'solve2': '_LS.math.solve2'",
    "'identity': '_LS.math.identity'",
    "'trace': '_LS.math.trace'",
    "'lorentz_force': '_LS.math.lorentz_force'",
    "'sym': '_LS.math.sym'",
    "'symbolic_simplify': '_LS.math.symbolic_simplify'",
    "'solve_linear': '_LS.math.solve_linear'",
    "'solve_linear_system': '_LS.math.solve_linear_system'",
    "'solution_get': '_LS.math.solution_get'",
    "'symbolic_dimension_format': '_LS.math.symbolic_dimension_format'",
    "'symbolic_assert_dimensions': '_LS.math.symbolic_assert_dimensions'",
    "'physics_dimensions': '_LS.math.physics_dimensions'",
    "'symbolic_substitute': '_LS.math.symbolic_substitute'",
    "'symbolic_derivative': '_LS.math.symbolic_derivative'",
    "'symbolic_sin': '_LS.math.symbolic_sin'",
    "'symbolic_impedance_C': '_LS.math.symbolic_impedance_C'",
    "'rc_lowpass_transfer': '_LS.math.rc_lowpass_transfer'",
    "'rl_lowpass_transfer': '_LS.math.rl_lowpass_transfer'",
    "'frequency_response': '_LS.math.frequency_response'",
    "'response_magnitude': '_LS.math.response_magnitude'",
    "'frequency_sweep': '_LS.math.frequency_sweep'",
    "'frequency_response_sweep': '_LS.math.frequency_response_sweep'",
    "'response_peak': '_LS.math.response_peak'",
    "'response_crossing_frequency': '_LS.math.response_crossing_frequency'",
    "'rc_cutoff_frequency': '_LS.math.rc_cutoff_frequency'",
    "'rlc_resonant_frequency': '_LS.math.rlc_resonant_frequency'",
    "'rlc_series_impedance': '_LS.math.rlc_series_impedance'",
    "'physics_formula': '_LS.math.physics_formula'",
    "'formula_render': '_LS.math.formula_render'"
  ];
  for (const snippet of transpilerSnippets) {
    check(transpiler.includes(snippet), `transpiler maps ${snippet}`);
  }

  checkIncludes("README.md", "mathematical_notation_rehab_v18.ls", "V18 math example");
  checkIncludes("PROJECT_STATUS.md", "mathematical_notation_rehab_v18.ls", "V18 math status");
  checkIncludes("docs/LUASCRIPT_MEGA_PLAN.md", "V18 covers swept frequency-response", "V18 roadmap boundary");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Mathematical notation core/rehab V18", "V18 support matrix row");
  checkIncludes("docs/LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md", "full symbolic physics/EE manipulation remains future work",
    "math doc conservative boundary");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "beta:readiness", "beta readiness gate documented");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "TypeScript", "TypeScript support matrix row");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Go", "Go support matrix row");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Rust", "Rust support matrix row");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Kotlin", "Kotlin support matrix row");
}

function checkLuaScriptClaims() {
  const pkg = readJson("package.json");
  const manifest = readJson("tests/language_completion/manifests/luascript.json");
  const javascriptManifest = readJson("tests/language_completion/manifests/javascript.json");
  const clarity = readJson("tests/clarity_canon/manifest.json").dogfoodFixtures;

  check(manifest.status === "qualified", "LUASCRIPT manifest status is qualified for its named slice");
  check((manifest.supportSlice || "").includes("v0.16"), "LUASCRIPT manifest names V0.16 meta slice");
  check((manifest.supportSlice || "").includes("ring2"), "LUASCRIPT manifest names Ring 2 slice");
  check(Array.isArray(manifest.targets) && manifest.targets.includes("lua") &&
    manifest.targets.includes("javascript") && manifest.targets.includes("luascript"),
  "LUASCRIPT manifest has lua/javascript/luascript targets");

  const requiredFixtures = [
    "arithmetic_locals",
    "functions_conditionals",
    "while_loop",
    "numeric_for",
    "object_mutation",
    "ring2_lexical_scope_closure",
    "ring2_nested_object_state",
    "ring2_numeric_nested_loops",
    "ring2_break_continue",
    "ring2_short_circuit_state",
    "meta_noop_baseline",
    "meta_resolve_continue",
    "meta_verify_stdout",
    "meta_verify_lua_emission",
    "meta_verify_target_emission",
    "meta_verify_target_runtime",
    "meta_verify_target_runtime_failure",
    "meta_policy_assertions",
    "meta_cross_target_policy_assertions",
    "meta_python_truthiness_adapter",
    "meta_python_index_length_slice_adapter",
    "meta_string_coercion_adapter",
    "meta_capability_negotiation",
    "meta_semantic_adapters",
    "meta_repair_block",
    "meta_multiple_returns_adapter",
    "meta_multiple_returns_repair",
    "meta_identity_contract_portable_slice",
    "meta_profile_forbidden_present",
    "meta_implicit_profile_forbidden_present"
  ];

  for (const name of requiredFixtures) {
    checkManifestEntry(
      manifest.fixtures,
      name,
      "LUASCRIPT language manifest",
      (fixture) => typeof fixture.source === "string" && fs.existsSync(relPath(fixture.source)),
      "source exists"
    );
  }

  checkManifestEntry(
    javascriptManifest.fixtures,
    "ring3_switch_conditional",
    "JavaScript language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/javascript/ring3_switch_conditional.js" &&
      Array.isArray(fixture.targets) &&
      fixture.targets.includes("lua") &&
      fixture.targets.includes("javascript") &&
      !fixture.targets.includes("luascript") &&
      fixture.expectedOutput === "ring3_switch_conditional one two many",
    "covers Ring 3 switch plus conditional-expression branch depth"
  );
  checkManifestEntry(
    javascriptManifest.fixtures,
    "unsupported_throw",
    "JavaScript language manifest",
    (fixture) => fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript exception flow: throw statements",
    "fails closed for JavaScript throw"
  );
  checkManifestEntry(
    javascriptManifest.fixtures,
    "unsupported_try_catch",
    "JavaScript language manifest",
    (fixture) => fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript exception flow: try/catch/finally",
    "fails closed for JavaScript try/catch"
  );
  checkManifestEntry(
    javascriptManifest.fixtures,
    "unsupported_tagged_template",
    "JavaScript language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/javascript/unsupported_tagged_template.js" &&
      fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript template literal form: tagged template literals",
    "fails closed for JavaScript tagged template literals"
  );
  checkManifestEntry(
    javascriptManifest.fixtures,
    "unsupported_object_spread",
    "JavaScript language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/javascript/unsupported_object_spread.js" &&
      fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript object spread",
    "fails closed for JavaScript object spread"
  );
  checkManifestEntry(
    javascriptManifest.fixtures,
    "unsupported_destructuring",
    "JavaScript language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/javascript/unsupported_destructuring.js" &&
      fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript variable declarator pattern: ObjectPattern",
    "fails closed for JavaScript destructuring"
  );

  checkManifestEntry(
    manifest.fixtures,
    "meta_identity_contract_portable_slice",
    "LUASCRIPT language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls" &&
      Array.isArray(fixture.targets) &&
      ["lua", "javascript", "luascript", "python"].every((target) => fixture.targets.includes(target)),
    "covers portable .ls identity contract across current targets"
  );
  checkIncludes("tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls", 'feature "meta-profiles";',
    "identity contract asserts meta profile feature");
  checkIncludes("tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls", 'feature "repair-blocks";',
    "identity contract asserts repair block feature");
  checkIncludes("tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls", 'no_feature "try-catch";',
    "identity contract excludes try/catch");
  checkIncludes("tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls", 'profile "portable_v1";',
    "identity contract asserts portable_v1 profile");
  checkIncludes("tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls", 'implicit_profile "portable_semantics_v1";',
    "identity contract asserts implicit portable semantics baseline");
  checkIncludes("tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls", 'ls_repair "indexing=zero_based";',
    "identity contract asserts emitted .ls repair identity via profile policy");

  const dogfoodMetaFixtures = [
    "meta_resolve_continue",
    "meta_verify_stdout",
    "meta_verify_lua_emission",
    "meta_verify_target_emission",
    "meta_verify_target_runtime",
    "meta_verify_target_runtime_failure",
    "meta_policy_assertions",
    "meta_cross_target_policy_assertions",
    "meta_python_truthiness_adapter",
    "meta_python_index_length_slice_adapter",
    "meta_string_coercion_adapter",
    "meta_capability_negotiation",
    "meta_semantic_adapters",
    "meta_repair_block",
    "meta_multiple_returns_adapter",
    "meta_multiple_returns_repair",
    "meta_identity_contract_portable_slice",
    "meta_profile_forbidden_present",
    "meta_implicit_profile_forbidden_present"
  ];

  for (const name of dogfoodMetaFixtures) {
    checkManifestEntry(
      clarity,
      `luascript_${name}`,
      "clarity dogfood manifest",
      (fixture) => typeof fixture.source === "string" && fs.existsSync(relPath(fixture.source)),
      "source exists"
    );
  }

  checkManifestEntry(
    clarity,
    "luascript_meta_identity_contract_portable_slice",
    "clarity dogfood manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls" &&
      Array.isArray(fixture.tags) &&
      fixture.tags.includes("identity-contract") &&
      fixture.tags.includes("portable-semantics") &&
      Array.isArray(fixture.expectedOutputIncludes) &&
      fixture.expectedOutputIncludes.includes("identity_contract\tb\t4\tbc\tlist_truthy\tzero_false\tcount=3\tAda\t3\t2\t8\tdone"),
    "dogfoods the portable .ls identity contract"
  );

  const expectedFailures = [
    "meta_forbid_prototype",
    "meta_js_forbid_prototype",
    "meta_unsupported_adapter",
    "meta_policy_assertion_missing",
    "meta_cross_target_policy_missing",
    "meta_verify_diagnostic",
    "meta_diagnose_async",
    "meta_unknown_target",
    "meta_unknown_resolver",
    "meta_unknown_strategy",
    "meta_resolve_continue_missing_requires",
    "meta_forbid_goto_continue",
    "meta_profile_forbidden_present",
    "meta_implicit_profile_forbidden_present",
    "meta_unknown_repair_feature",
    "meta_unknown_repair_strategy",
    "unsupported_throw",
    "unsupported_for_of",
    "unsupported_try_catch"
  ];

  for (const name of expectedFailures) {
    checkManifestEntry(
      manifest.fixtures,
      name,
      "LUASCRIPT language manifest",
      (fixture) => fixture.expectedFailure === true,
      "is marked expected failure"
    );
  }

  checkManifestEntry(
    manifest.fixtures,
    "unsupported_throw",
    "LUASCRIPT language manifest",
    (fixture) => fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript exception flow: throw statements",
    "uses named throw diagnostic"
  );
  checkManifestEntry(
    manifest.fixtures,
    "unsupported_for_of",
    "LUASCRIPT language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/luascript/unsupported_for_of.ls" &&
      fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript control flow: for-of loops",
    "uses named for-of diagnostic"
  );
  checkManifestEntry(
    manifest.fixtures,
    "unsupported_try_catch",
    "LUASCRIPT language manifest",
    (fixture) => fixture.source === "tests/language_completion/fixtures/luascript/unsupported_try_catch.ls" &&
      fixture.expectedFailure === true &&
      fixture.expectedDiagnosticPattern === "Unsupported JavaScript exception flow: try/catch/finally",
    "uses named try/catch diagnostic"
  );

  check(Boolean(pkg.scripts["test:luascript-meta"]), "package.json exposes npm run test:luascript-meta");
  check(Boolean(pkg.scripts["language:luascript:bidirectional"]), "package.json exposes LUASCRIPT bidirectional gate");
  check(Boolean(pkg.scripts["clarity:dogfood"]), "package.json exposes clarity dogfood gate");

  checkIncludes("README.md", "LUASCRIPT `.ls` V0.16 meta-language gate", "README V0.16 meta gate");
  checkIncludes("README.md", "Current supported `.ls` profile set", "README supported .ls profile set");
  checkIncludes("README.md", "The identity-contract fixture `meta_identity_contract_portable_slice.ls` now combines existing `portable_v1` plus `portable_semantics_v1` profiles",
    "README identity contract boundary");
  checkIncludes("README.md", "Example Boundary Map", "README example boundary map");
  checkIncludes("PROJECT_STATUS.md", "LuaScript `.ls` V0.16 meta fixtures", "PROJECT_STATUS V0.16 details");
  checkIncludes("PROJECT_STATUS.md", "The current `.ls` identity is now explicitly named", "PROJECT_STATUS .ls identity");
  checkIncludes("PROJECT_STATUS.md", "`meta_identity_contract_portable_slice.ls` composes only the existing `portable_v1` and `portable_semantics_v1` profiles",
    "PROJECT_STATUS identity contract boundary");
  checkIncludes("PROJECT_STATUS.md", "For the first canonical `1.0` pass, keep the example boundary map narrow",
    "PROJECT_STATUS example boundary map");
  checkIncludes("docs/LUASCRIPT_META_LANGUAGE_V0.md", "Status: active V0.16 slice", "meta doc V0.16 status");
  checkIncludes("docs/LUASCRIPT_META_LANGUAGE_V0.md", "Current supported `.ls` profile set", "meta doc supported profile set");
  checkIncludes("docs/LUASCRIPT_META_LANGUAGE_V0.md", "not yet a full distinct general-purpose spec",
    "meta doc conservative boundary");
  checkIncludes("docs/LUASCRIPT_META_LANGUAGE_V0.md", "`meta_identity_contract_portable_slice.ls` is the current identity-contract fixture for the V0.16 lane.",
    "meta doc identity contract fixture");
  checkIncludes("docs/LUASCRIPT_META_LANGUAGE_V0.md", "Emitted `.ls` repair identity is verified through profile policy plus `ls_repair` assertions, not through `repair { target luascript { ... } }` in this slice.",
    "meta doc emitted .ls repair boundary");
  checkIncludes("docs/LUASCRIPT_META_LANGUAGE_V0.md", "Meta-language examples count as supported examples only when a current manifest",
    "meta doc example support boundary");
  checkIncludes("docs/LUASCRIPT_LIVING_META_LANGUAGE.md", "Current supported `.ls` profile set",
    "living meta supported profile set");
  checkIncludes("docs/LUASCRIPT_LIVING_META_LANGUAGE.md", "`meta_identity_contract_portable_slice.ls` composes only `portable_v1` plus `portable_semantics_v1`",
    "living meta identity contract fixture");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "`meta_identity_contract_portable_slice.ls` now composes only those supported profiles",
    "support matrix identity contract fixture");
  checkIncludes("docs/LANGUAGE_COMPLETION_RULES.md", "`.ls` also has a V0.16 identity-contract fixture, `meta_identity_contract_portable_slice.ls`",
    "language completion rules identity contract boundary");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "`meta_identity_contract_portable_slice.ls`",
    "exit criteria identity contract fixture");
  checkIncludes("docs/LUASCRIPT_LIVING_META_LANGUAGE.md", "Canonical `1.0` package/runtime and example boundaries",
    "living meta package/runtime example boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_SOLOIST_LEDGER.md", "still short of the full language vision",
    "Denali ledger conservative boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - `.ls` Depth Expansion Slice",
    "Denali 1.0 ledger .ls depth route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Emitted `.ls` repair identity is currently profile-policy and `verify` evidence, not native `repair { target luascript { ... } }` syntax support.",
    "Denali 1.0 ledger emitted .ls repair boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Public API And Runtime Contract Pass",
    "Denali 1.0 ledger public API runtime route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "This pass did not bump `package.json` from `0.1.0-beta.0`.",
    "Denali 1.0 ledger public API runtime no-bump boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-16 - No-Release Public API Runtime Freeze Candidate",
    "Denali 1.0 ledger no-release freeze candidate entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "No package version, compiler API, runtime API, language syntax, package `bin`, package `exports` map, tag, publish, GitHub release, changelog seal, or artifact signing changed.",
    "Denali 1.0 ledger no-release action boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Conformance Evidence Binder",
    "Denali 1.0 ledger conformance evidence binder route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "This is certification-style evidence organization, not ISO certification, third-party certification, production certification, or true omni-language 100% completion.",
    "Denali 1.0 ledger conformance evidence binder boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Penultimate Denali Readiness Audit",
    "Denali 1.0 ledger penultimate readiness audit entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Denali canonical `1.0` audit estimate: 72% done / 28% remaining.",
    "Denali 1.0 readiness percentage boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "True omni-language 100% audit estimate: 6% done / 94% remaining.",
    "true omni-language readiness percentage boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-16 - Denali Release-Candidate Audit And Handoff Verdict",
    "Denali 1.0 release-candidate audit entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Denali canonical `1.0` RC estimate: 78% done / 22% remaining.",
    "Denali 1.0 release-candidate percentage boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "True omni-language 100% RC estimate: 7% done / 93% remaining.",
    "true omni-language release-candidate percentage boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "The current Denali ledger cannot close as a canonical `1.0` release ledger.",
    "Denali 1.0 handoff verdict");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "## 2026-07-16 Release-Candidate Audit",
    "exit criteria release-candidate audit section");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "Release-candidate audit verdict: Denali canonical `1.0` is **78% done / 22% remaining**.",
    "exit criteria Denali release-candidate percentage");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "The user's true omni-language 100% summit is **7% done / 93% remaining**.",
    "exit criteria true omni-language release-candidate percentage");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "The Denali ledger cannot close as a canonical `1.0` release ledger yet; it must hand off to the Big Remaining Climb route",
    "exit criteria Denali handoff verdict");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "| `1.0-DOCS` | `MET` for current active-doc integrity, `OPEN` for release docs |",
    "exit criteria docs MET/open RC status");
  checkIncludes("docs/LUASCRIPT_1_0_EXIT_CRITERIA.md", "| `1.0-LANGUAGE-ACCESSION` | `MET` for accession contract, `OPEN` for future promotions |",
    "exit criteria accession MET/open RC status");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Durable Conformance Reports And Big Remaining Climb Handoff",
    "Denali 1.0 ledger durable reports handoff entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Source-preserving round-trip proof remains 0; current round-trip evidence is structural IR reparse plus runtime-output equivalence only.",
    "Denali 1.0 ledger source-preserving proof boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Next route: implement `npm run test:source-identity-probe`.",
    "Denali 1.0 ledger next source identity route");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-14 - Source Identity Probe Seed And Summit Closure Path",
    "Denali 1.0 ledger source identity seed entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "`npm run test:source-identity-probe` | PASS: 3 fixtures, 3 normalized source identity checks, 3 normalized IR identity checks; report written",
    "Denali 1.0 ledger source identity verification seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Token-level text identity count is 0.",
    "Denali 1.0 ledger token identity boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-15 - Edge-Case Matrix Expansion To 25",
    "Denali 1.0 ledger 25-case edge matrix entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "`npm run test:edge-matrix` | PASS: 25/25 scoped cases; report written",
    "Denali 1.0 ledger 25-case edge matrix verification seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "JavaScript plain template literal interpolation with a numeric value currently fails in emitted Python",
    "Denali 1.0 ledger edge matrix template-literal boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-15 - Source Identity Suite Expansion To 15",
    "Denali 1.0 ledger 15-fixture source identity entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "`npm run test:source-identity-probe` | PASS: 15 fixtures, 12 normalized source identity checks, 12 normalized IR identity checks, 3 expected unsupported diagnostics; report written",
    "Denali 1.0 ledger 15-fixture source identity verification seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Parser-owned normalized AST identity remains open until a parser-owned normalized AST artifact is exposed.",
    "Denali 1.0 ledger parser-owned AST boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-15 - Normalized Parser-Owned AST Identity Route",
    "Denali 1.0 ledger parser-owned AST identity route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "`npm run test:source-identity-probe` | PASS: 15 fixtures, 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, 3 expected unsupported diagnostics; report written",
    "Denali 1.0 ledger parser-owned AST identity verification seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-15 - Canonical IR Semantics V1 Evidence Mapping",
    "Denali 1.0 ledger IR semantics v1 evidence route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Current conformance fixtures mapped | PASS: 32/32",
    "Denali 1.0 ledger IR semantics fixture mapping seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Schema-valid fixture artifacts for every conformance fixture remain open.",
    "Denali 1.0 ledger IR semantics schema-valid gap");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-27 - Schema-Valid Conformance Artifact Mapping",
    "Denali 1.0 ledger schema artifact mapping route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "21/21 positive conformance fixtures produced schema-valid derived artifacts; 11 expected diagnostics preserved",
    "Denali 1.0 ledger schema artifact verification seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "VariableDeclarator->VariableDeclaration",
    "Denali 1.0 ledger schema artifact alias evidence");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "78f8cb23636bd10d807168dbb06a26da26cf8908a62a66873d91474d843703ff",
    "Denali 1.0 ledger schema hash");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-16 - Bidirectionality Layer Evidence Map",
    "Denali 1.0 ledger bidirectionality layer evidence route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "`npm run language:luascript:bidirectional` | PASS: 75/75 language fixtures; `test:luascript-meta` passed; `test:actual-programs` passed",
    "Denali 1.0 ledger .ls language gate verification seal");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Lua structural IR reparse remains a next proof-layer candidate.",
    "Denali 1.0 ledger Lua structural reparse boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "c7f9b561e5e891773e4d32e2900204c568d4c764b399f6d6f4841d7184dbe096",
    "Denali 1.0 ledger roundtrip layer manifest hash");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "### 2026-07-16 - Release-Shaped Conformance Evidence Bundle Index",
    "Denali 1.0 ledger evidence bundle index route entry");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "Added [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) as the active release-shaped evidence bundle index.",
    "Denali 1.0 ledger evidence bundle index doc link");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "This is certification-style evidence navigation, not certification.",
    "Denali 1.0 ledger evidence bundle non-certification boundary");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "manifest SHA-256 `0f551a2076df5e6a6319dcab93600bff73213476351a3fd63ea732a5a597b780`",
    "Denali 1.0 ledger IR conformance manifest hash");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "manifest SHA-256 `79adf4eff8a2cc0b8e4699bf2d69c345e3398da5a01400d122d27151e7e4588d`",
    "Denali 1.0 ledger edge matrix manifest hash");
  checkIncludes("docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md", "test file SHA-256 `1ec1c8ab3b8ea81e3da8f7a80cceb95d41e3de6efc9afc27b929a229babeb17b`",
    "Denali 1.0 ledger unsupported diagnostics test hash");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Status: active master ledger",
    "Big Remaining Climb ledger status");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Denali canonical `1.0` is estimated at 78% done, while the user's true omni-language 100% summit is estimated at 7% done.",
    "Big Remaining Climb release-candidate percentage summary");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "| Denali canonical `1.0` | 78% done / 22% remaining |",
    "Big Remaining Climb Denali release-candidate table estimate");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "| True omni-language 100% | 7% done / 93% remaining |",
    "Big Remaining Climb true omni-language release-candidate table estimate");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Denali release-candidate audit: SEALED for verdict; OPEN for release closure.",
    "Big Remaining Climb release-candidate audit sealed/open route");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "RC route seal: the 2026-07-16 Denali release-candidate audit is SEALED for verdict and OPEN for release closure.",
    "Big Remaining Climb release-candidate route seal");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "`npm run test:unsupported-diagnostics` passes 21 named diagnostics and writes `artifacts/conformance/unsupported-diagnostics-report.json`.",
    "Big Remaining Climb unsupported diagnostics current count");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Current round-trip evidence now includes structural IR reparse, runtime-output equivalence, and a release-shaped 15-fixture `.ls` source identity suite",
    "Big Remaining Climb source-preserving boundary");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Source-preserving round-trip suite: SEALED",
    "Big Remaining Climb source identity sealed");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Edge-case matrix expansion: SEALED",
    "Big Remaining Climb edge matrix sealed");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Schema-valid conformance artifact mapping: SEALED for derived dual-surface evidence; OPEN for final release IR surface.",
    "Big Remaining Climb schema-valid route sealed/open");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "`npm run test:schema-artifact-map` passes 21/21 positive derived schema-artifact mappings",
    "Big Remaining Climb schema artifact current count");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Add the next real proof layer: Lua structural IR reparse or a second normalized source-identity lane, without broad language claims",
    "Big Remaining Climb bidirectionality next route cleanup");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "The IR semantics v1 evidence route is now sealed; broad lossless recovery remains a later climb.",
    "Big Remaining Climb source identity next route cleanup");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "IR semantics v1 evidence pass: SEALED",
    "Big Remaining Climb IR semantics v1 evidence sealed");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Conformance evidence bundle index: SEALED for document index; OPEN for one-command generated bundle.",
    "Big Remaining Climb conformance evidence bundle index sealed");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Second route seal: [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) is now the release-shaped evidence navigation layer.",
    "Big Remaining Climb second route seal");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "c7f9b561e5e891773e4d32e2900204c568d4c764b399f6d6f4841d7184dbe096",
    "Big Remaining Climb roundtrip layer manifest hash");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "0280f940b1004e9e2602217ddd6135e5dd3a28a27152c8eb547c1666498c9272",
    "Big Remaining Climb source identity layer manifest hash");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Next route after this ledger: add a real new proof layer, preferably a tiny Lua structural IR reparse probe or a second normalized source-identity lane, then choose the final release IR surface or formalize the dual-surface compatibility bridge.",
    "Big Remaining Climb next route seal");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "## Loose-End Closure Pass",
    "Big Remaining Climb loose-end closure section");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "100% of started post-beta/Denali/Big Remaining Climb routes in this ledger are sealed at their scoped route level.",
    "Big Remaining Climb started routes sealed percentage");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "The unsealed items below are explicitly future routes, not abandoned started work.",
    "Big Remaining Climb future-route boundary");
  checkIncludes("docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md", "Future routes not yet started:",
    "Big Remaining Climb future routes list");
  checkIncludes("docs/LUASCRIPT_MEGA_PLAN.md", "Current `.ls` identity is deliberately narrow",
    "mega plan .ls identity boundary");
  checkIncludes("docs/LUASCRIPT_MEGA_PLAN.md", "First-pass example boundaries for canonical `1.0` should stay inside named evidence",
    "mega plan example boundary");
  checkPattern("docs/LANGUAGE_SUPPORT_MATRIX.md", /LUASCRIPT `\.ls` JS-like syntax plus V0\.16 meta layer/,
    "support matrix V0.16 row");
  checkIncludes("docs/LANGUAGE_SUPPORT_MATRIX.md", "Current supported `.ls` profile set",
    "support matrix supported profile set");
}

try {
  checkPackageMetadata();
  if (runMath) checkMathematicalClaims();
  if (runLuaScript) checkLuaScriptClaims();
} catch (error) {
  failures.push(error.stack || error.message);
}

for (const message of passed) {
  console.log(`ok - ${message}`);
}

if (failures.length > 0) {
  console.error("\nClaim verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Claim verification passed (${passed.length} checks).`);
