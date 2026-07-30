# LUASCRIPT Public API And Runtime Contract

Status: active tested stable Denali v1.0.1 contract
Last updated: 2026-07-30
Track: Denali canonical `1.0`

This document defines the public API and runtime expectations for stable
LUASCRIPT Denali v1.0.1. It freezes only the named package surfaces and tested
support slices; it does not broaden language, platform, or certification claims.

## Scope

- The current package is `luascript` at `1.0.1`.
- The current release track is stable Denali.
- The release changes package identity and release state only; it does not add language syntax, package `bin`, package `exports`, or a global CLI.
- The 2026-07-29 package bearing repairs clean-consumer importability, package metadata, `enableAll` behavior, and status-version alignment without adding a root export or claiming `1.0`.
- Canonical `1.0` can ship only after the exit criteria in [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md) are met or explicitly excluded with rationale.

## Package Identity And Entry Points

Current package metadata:

- Package name: `luascript`.
- Current package version: `1.0.1`.
- Root module entrypoint: `src/unified_luascript.js`.
- Declared package `exports` map: none.
- Declared npm `bin`: none.
- Node engine floor: `>=14.17.0`.
- Current package file list: `src/`, `test/`, `examples/package/`, `README.md`, and `LICENSE`.
- Runtime dependencies: `acorn`, `esprima`, `luaparse`, and exact `typescript@5.9.3`.
- Repository metadata: `https://github.com/ssdajoker/LUASCRIPT`.

The stable Denali release preserves the root-package import surface:
`require("luascript")` resolves through `package.json#main` to
`src/unified_luascript.js`. There is no package `exports` map, so no subpath
import is public. The current root module exports these names:

- `UnifiedLuaScript`
- `CoreTranspiler`
- `RuntimeSystem`
- `AdvancedFeatures`
- `PerformanceTools`
- `AgenticIDE`

For this no-release candidate, those six root export names are the only candidate public exports. `UnifiedLuaScript` currently exposes constructor options plus instance methods `initializeComponents`, `transpile`, `transpileSource`, `execute`, `transpileAndExecute`, `profile`, `benchmark`, `optimize`, `createProject`, `openFile`, `getCodeCompletion`, `startDebugging`, `transformWithOOP`, `transformWithPatterns`, `transformWithTypes`, `getSystemStatus`, `getPerformanceReport`, `validateEvidence`, `clearCaches`, and `shutdown`, plus static helpers `createDevelopment`, `createProduction`, `createEnterprise`, and `validateEvidenceStatic`. `enableAll: false` is a master disable and initializes zero components. `getSystemStatus().version` is sourced from the live package version rather than a future-version literal. Those names and two behaviors are tested candidate inventory, not a behavior-complete `1.0` guarantee. Deep imports from `src/`, `src/index.js`, compiler internals, test helpers, and generated artifacts are not public API unless a future contract names them.

## CLI Surface

LUASCRIPT does not currently declare a package `bin`. The current command surface is npm-script based:

- `npm start` and `npm run dev` execute `node src/unified_luascript.js`.
- `npm run build` is a readiness smoke, not a production bundle.
- `npm run verify`, `npm run status:check`, `npm run claims:check`, `npm run stubs:check`, and `npm run archive:audit` are operational evidence gates.
- `npm run beta:*`, `npm run clarity:*`, `npm run test:*`, and `npm run language:*` are verification surfaces for named slices and reports.
- `src/index.js` has a direct `node src/index.js` command interface, but it is not the package root entrypoint and is not declared as an npm `bin`; this candidate does not freeze it as the public CLI.

Stable Denali CLI stance: no global CLI binary is part of the public contract, and npm scripts remain the supported local workflow. Adding a package `bin`, promoting `src/index.js`, or adding command semantics is a compatibility-impacting release decision requiring tests, docs, migration notes, and an appropriate SemVer release.

## Runtime Files And Native Tools

Runtime expectations:

- The declared consumer Node floor is `node >=14.17.0`.
- Exact `typescript@5.9.3` is an eager runtime dependency of the shipped TypeScript compiler and declares Node `>=14.17`; the package floor must not contradict it.
- The executable floor probe uses Node `14.17.1`, the first available npm-distributed patch in that line, and performs an installed-package root import plus JS-to-Lua smoke.
- `src/runtime.js`, `src/runtime_system.js`, and `src/runtime/` helpers are included by the current `src/` package file entry.
- Root-level `runtime/runtime.lua` and `runtime/core/enhanced_runtime.lua` remain outside the package. They are referenced by non-public `src/transpiler.js` and `src/luascript_compiler.py`, not by the candidate root JavaScript import graph.
- Stable Denali runtime stance: root-level `runtime/` is explicitly excluded. The two deep tools that expect it are repository-local/non-public until a future package contract deliberately promotes and packages them.

`npm run test:package-contract` writes `artifacts/conformance/public-api-runtime-package-report.json`. It must pack the live source, inspect the actual tarball, install it in a clean temporary consumer, import `luascript`, check the exact six root exports and method inventory, run a CoreTranspiler smoke, execute every shipped public-root example, verify version and `enableAll` behavior, prove the root-runtime exclusion, and exercise the installed package at the declared Node line. The test cleans only its unique temporary directory.

Native language runtime claims require real runtime commands and passing `language:<name>:bidirectional` gates. Target-runtime IR lanes prove emitted behavior for named slices only; they do not substitute for native runtime qualification.

## Npm Scripts

The real `1.0` contract must classify npm scripts into three groups:

- Public local workflow: `npm install`, `npm ci`, `npm run build`, `npm start`, `npm run dev`, and documented verification commands.
- Evidence gates: beta, clarity, language, conformance, round-trip, edge-matrix, unsupported-diagnostic, status, claims, stubs, archive, and verify scripts.
- Release-action scripts: version bump, release preparation, tag, publish, or release artifact commands.

Script names and behavior that are advertised as public workflow must follow the compatibility policy below. Evidence-gate script names can evolve only with docs, claims checks, and migration notes when users would reasonably rely on them. Release-action scripts must not run as part of ordinary docs or readiness passes. The current release-action scripts include `release`, `release:patch`, `release:minor`, `release:major`, `release:preview`, `release:status`, `release:verify`, `version:bump`, `release:build:denali`, `release:verify:denali`, `changelog:generate`, `artifacts:sign`, `artifacts:verify`, and `artifacts:list`.

## Package Files

The current package `files` surface is beta-scoped:

- `src/`
- `test/`
- `examples/package/`
- `README.md`
- `LICENSE`

This list is the tested Denali publish promise. The package contract confirms:

- `package.json`, `README.md`, `LICENSE`, the required `src/` root, and the exact `examples/package/` public-example set are present;
- root-level `runtime/` is intentionally absent from the candidate package;
- generated reports, docs, archives, Python bytecode/cache files, backups, nested source tests, and source-local prompt files are absent;
- an actual tarball installs, its root import/transpile smoke succeeds, and its two public-root examples execute.

The additive `examples/package/` entry is deliberately narrow. `examples/package/transpile-js-to-lua.cjs` and `examples/package/minimal-system.cjs` use only the six-name root API. The wider `examples/` tree and all `tests/actual_programs/` fixtures remain repository-local compiler evidence; they are not shipped package examples and do not define consumer compatibility.

Root `.npmignore` records repository-wide exclusions; `src/.npmignore` is the effective nested filter for the explicitly included `src/` tree.

## Migration And Changelog Policy

The Denali package-bearing changes are documented in [LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md](LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md) and the `1.0.1` section of [CHANGELOG.md](../CHANGELOG.md):

- consumers must use Node `>=14.17.0` rather than the previously declared `>=14.0.0`;
- TypeScript is now an exact runtime dependency, so a clean tarball import has every eager dependency it needs;
- YAML and `@types/esprima` are development-only because the candidate root runtime does not load them;
- `enableAll: false` now actually disables all five components;
- status version reporting now matches `package.json`;
- repository, bugs, and homepage metadata point to `ssdajoker/LUASCRIPT`.
- two installed-package examples now exercise only the public root import, while repository-local `.ls` and actual-program suites remain explicitly outside the package contract.

For `1.0.1` and later, every protected-surface change must add a changelog entry. If a consumer must change code, configuration, runtime version, import path, or deployment packaging, the same bearing must add or update a migration note with old behavior, new behavior, required action, fallback, and verification command. Changelog generation or sealing remains a release action and is not run by readiness gates.

## Semver Policy

Pre-`1.0` releases may change public API, CLI, package file layout, language slices, and runtime expectations when the change is documented and claims checks are updated.

For `1.0` and later:

- `MAJOR` changes break documented public API, CLI behavior, package entrypoints, package files, Node floor, runtime expectations, or supported language/profile contracts.
- `MINOR` changes add backward-compatible public API, CLI options, supported language slices, examples, diagnostics, or runtime support.
- `PATCH` changes fix bugs, docs, diagnostics, packaging mistakes, or internal behavior without breaking documented public behavior.

IR schema versioning remains separate and is governed by [VERSIONING.md](VERSIONING.md). Package semver, IR schema versioning, and language-slice support levels are related evidence streams, not the same version number.

The chosen internal release-IR transition is [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md). It keeps operational Program IR and its one-way canonical artifact projection internal for this bearing. `legacyProgramToSchemaArtifact`, `RELEASE_IR_SURFACE_CONTRACT`, and `src/ir` deep imports are not added to the six-name root export candidate, and existing transpilation result `.ir` behavior is not redefined. Any future package-root `IR` namespace is a separate public API decision requiring API-specific tests, package review, migration notes, and an explicit contract update.

Release-script caveat: `version:bump` and `release:*` are release-action tools, not readiness checks. The reviewed tooling accepts SemVer, computes increments deliberately, invokes readiness commands without Unix-only pipelines, and refuses to create a tag unless the intended package version is already committed at `HEAD`. `release:build:denali` additionally requires a clean worktree and a matching tag at `HEAD`.

## Compatibility Policy

Compatibility applies only to documented public surfaces and named supported slices:

- root package import through `src/unified_luascript.js` or a future `exports` map;
- documented root exports;
- documented npm-script workflow commands;
- documented package file surface;
- documented Node floor and runtime setup expectations;
- manifest-backed language/profile slices in the support matrix;
- named unsupported diagnostics that users may rely on for fail-closed behavior.

Compatibility does not apply to:

- archived docs;
- deep source imports not promoted by this contract;
- generated artifacts and local reports;
- broad language behavior beyond named fixtures;
- target-runtime lanes when native support is the claim being evaluated;
- repository-local or experimental examples unless a current manifest and support doc promote them.

The two executable programs under `examples/package/`, alongside their local README, are the only installed-package examples in this candidate. Their successful execution proves those exact public-root workflows only; it does not promote the legacy Python compiler, root `runtime/`, the 55-entry actual-program suite, or the wider mathematical/example tree into the package surface.

Any compatibility-impacting change must update this contract, [PROJECT_STATUS.md](../PROJECT_STATUS.md), [README.md](../README.md), the support matrix or active docs as needed, and `claims:check`.

## Stable Denali Release Audit

Original audit date: 2026-07-16. Current package proof: 2026-07-29.

| Surface | Current repo truth | Candidate boundary |
| --- | --- | --- |
| Package identity | `package.json` name is `luascript`; version is `1.0.1`; `package.json#luascript.version` also says `1.0.1` | Stable Denali identity is frozen |
| Root entrypoint | `package.json#main` is `src/unified_luascript.js` | Candidate public import surface remains root package import only |
| Exports map | No `exports` map is declared | No subpath imports are frozen; deep imports stay internal |
| Root exports | `UnifiedLuaScript`, `CoreTranspiler`, `RuntimeSystem`, `AdvancedFeatures`, `PerformanceTools`, `AgenticIDE` | Exact six-name surface, method inventory, no-IR-internal boundary, version alignment, and `enableAll` behavior are package-tested |
| CLI/API surface | No package `bin`; `npm start` and `npm run dev` execute `src/unified_luascript.js`; `src/index.js` has direct CLI-like handling but is not package main or bin | No global CLI in the public contract; `src/index.js` remains non-public unless promoted later |
| Node floor | `engines.node` is `>=14.17.0`; exact TypeScript declares `>=14.17` | Clean installed-package smoke is required on Node `14.17.1` and the current verification Node |
| Runtime helpers | `src/runtime*` and `src/runtime/` are package-included through `src/`; root `runtime/` is absent | Exclusion is deliberate; deep Python/legacy helpers that expect root runtime remain non-public |
| Npm scripts | Local workflow, evidence gates, language gates, and release-action scripts coexist in `package.json` | Only documented local workflow and evidence gates are readiness surfaces; release scripts require explicit release request |
| Package files | `src/`, `test/`, `examples/package/`, `README.md`, `LICENSE`; nested package hygiene filters active | Actual tarball contents, clean install, and exact public-example execution are release-blocking |
| Semver policy | Stable MAJOR/MINOR/PATCH policy is documented here | Adopted for Denali; version parsing and commit-before-tag invariants are tested |
| Compatibility policy | Applies only to documented public surfaces and named supported slices | Candidate protects root import, root exports, no-bin stance, Node floor, package files, named slices, and named diagnostics |
| Changelog expectations | `CHANGELOG.md` has a sealed Denali `1.0.1` section and a migration-note link | Compatibility-impacting changes must stay visible in future releases |
| Release-action boundaries | Release, version bump, changelog generation, artifact signing, tags, publish, and GitHub release are deliberate operations | Denali was explicitly authorized; future releases require their own exact authorization |

## Release Actions

Release actions are deliberate operations, not documentation side effects. These actions require an explicit release request:

- package version bump;
- npm publish;
- Git tag;
- GitHub release;
- release artifact signing or upload;
- changelog seal for a release.

Before any `1.0` release action, rerun the minimum gate set in [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md), confirm the evidence structure in [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md), confirm this contract matches `package.json`, and confirm release notes name all compatibility-impacting changes.

## 1.0 Exit Checklist For This Contract

- Root package import strategy is frozen or deliberately changed with migration notes.
- Public root exports and candidate method inventory are documented and package-tested.
- CLI position is chosen: no global `bin`, or a tested/documented `bin`.
- Node floor is chosen and exercised at Node `14.17.1`; `npm run test:compatibility-matrix` binds that package proof to the current-host native/runtime/schema/doc matrix, while other operating systems and architectures remain unclaimed.
- Runtime helper inclusion/exclusion is proven by actual tarball review and clean consumer import.
- Public npm workflow scripts are named.
- Evidence-gate scripts required for release are named.
- Semver and compatibility policies are adopted by active docs.
- Release-action commands are separated from readiness and verification workflows.
- `npm run claims:check`, `npm run status:check`, `npm run stubs:check`, and `npm run archive:audit` pass after this contract is updated.
