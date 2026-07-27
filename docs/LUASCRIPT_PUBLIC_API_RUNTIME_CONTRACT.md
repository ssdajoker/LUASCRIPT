# LUASCRIPT Public API And Runtime Contract

Status: active contract draft; no-release freeze candidate prepared
Last updated: 2026-07-16
Track: Denali canonical `1.0`

This document defines the public API and runtime expectations for real LUASCRIPT `1.0`. It is a contract draft for the Denali `1.0` route, not a version bump, release tag, npm publish, GitHub release, or broad support promotion.

## Scope

- The current package remains `luascript` at `0.1.0-beta.0`.
- The current release track remains pre-production beta.
- No package version, source API, compiler behavior, language syntax, or runtime behavior changes by this document alone.
- The 2026-07-16 no-release freeze candidate audits current truth only; it is not a release seal, `1.0` promotion, tag, publish, or version bump.
- Canonical `1.0` can ship only after the exit criteria in [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md) are met or explicitly excluded with rationale.

## Package Identity And Entry Points

Current package metadata:

- Package name: `luascript`.
- Current package version: `0.1.0-beta.0`.
- Root module entrypoint: `src/unified_luascript.js`.
- Declared package `exports` map: none.
- Declared npm `bin`: none.
- Node engine floor: `>=14.0.0`.
- Current package file list: `src/`, `test/`, `README.md`, and `LICENSE`.

The no-release Denali freeze candidate preserves the current root-package import surface: `require("luascript")` resolves through `package.json#main` to `src/unified_luascript.js`. There is no package `exports` map, so no subpath import is frozen by this candidate. The current root module exports these names:

- `UnifiedLuaScript`
- `CoreTranspiler`
- `RuntimeSystem`
- `AdvancedFeatures`
- `PerformanceTools`
- `AgenticIDE`

For this no-release candidate, those six root export names are the only candidate public exports. `UnifiedLuaScript` currently exposes constructor options plus instance methods `initializeComponents`, `transpile`, `transpileSource`, `execute`, `transpileAndExecute`, `profile`, `benchmark`, `optimize`, `createProject`, `openFile`, `getCodeCompletion`, `startDebugging`, `transformWithOOP`, `transformWithPatterns`, `transformWithTypes`, `getSystemStatus`, `getPerformanceReport`, `validateEvidence`, `clearCaches`, and `shutdown`, plus static helpers `createDevelopment`, `createProduction`, `createEnterprise`, and `validateEvidenceStatic`. Those method names are candidate API inventory, not a behavior-complete `1.0` compatibility guarantee until API-specific tests and migration notes are sealed. Deep imports from `src/`, `src/index.js`, compiler internals, test helpers, and generated artifacts are not public API unless a future contract names them.

## CLI Surface

LUASCRIPT does not currently declare a package `bin`. The current command surface is npm-script based:

- `npm start` and `npm run dev` execute `node src/unified_luascript.js`.
- `npm run build` is a readiness smoke, not a production bundle.
- `npm run verify`, `npm run status:check`, `npm run claims:check`, `npm run stubs:check`, and `npm run archive:audit` are operational evidence gates.
- `npm run beta:*`, `npm run clarity:*`, `npm run test:*`, and `npm run language:*` are verification surfaces for named slices and reports.
- `src/index.js` has a direct `node src/index.js` command interface, but it is not the package root entrypoint and is not declared as an npm `bin`; this candidate does not freeze it as the public CLI.

No-release freeze candidate CLI stance: no global CLI binary is part of the public contract, and npm scripts remain the supported local workflow. Adding a package `bin`, promoting `src/index.js`, or adding command semantics is a compatibility-impacting release decision requiring tests, docs, migration notes, and an explicit release action.

## Runtime Files And Native Tools

Runtime expectations:

- The declared Node floor is `node >=14.0.0` until a future compatibility decision changes it with evidence.
- A `1.0` Node floor must be paired with install, smoke, verification, and compatibility notes.
- `src/runtime.js`, `src/runtime_system.js`, and `src/runtime/` helpers are included by the current `src/` package file entry.
- Root-level `runtime/runtime.lua` and `runtime/core/enhanced_runtime.lua` exist in the repository and are used by local Lua execution tests and examples through `LUA_PATH`, but the current package file list does not include root-level `runtime/`.
- No-release freeze candidate runtime stance: root-level `runtime/` remains outside the current publish file promise unless a later release review explicitly includes it. Before `1.0`, package review must either include root-level `runtime/` or prove that those helpers are development/example/test material only.

Native language runtime claims require real runtime commands and passing `language:<name>:bidirectional` gates. Target-runtime IR lanes prove emitted behavior for named slices only; they do not substitute for native runtime qualification.

## Npm Scripts

The real `1.0` contract must classify npm scripts into three groups:

- Public local workflow: `npm install`, `npm ci`, `npm run build`, `npm start`, `npm run dev`, and documented verification commands.
- Evidence gates: beta, clarity, language, conformance, round-trip, edge-matrix, unsupported-diagnostic, status, claims, stubs, archive, and verify scripts.
- Release-action scripts: version bump, release preparation, tag, publish, or release artifact commands.

Script names and behavior that are advertised as public workflow must follow the compatibility policy below. Evidence-gate script names can evolve only with docs, claims checks, and migration notes when users would reasonably rely on them. Release-action scripts must not run as part of ordinary docs or readiness passes. The current release-action scripts include `release`, `release:patch`, `release:minor`, `release:major`, `release:preview`, `release:status`, `release:verify`, `version:bump`, `changelog:generate`, `artifacts:sign`, `artifacts:verify`, and `artifacts:list`; this freeze candidate does not execute them.

## Package Files

The current package `files` surface is beta-scoped:

- `src/`
- `test/`
- `README.md`
- `LICENSE`

This list is not yet a canonical `1.0` publish promise. Before `1.0`, the release review must confirm:

- required runtime helpers are included or intentionally excluded;
- public docs needed by package users are included or linked from README;
- test files included in the package are deliberate;
- generated reports, archive material, local artifacts, and development-only caches are excluded;
- the chosen package file list is reflected in docs and `claims:check`.

No-release freeze candidate package-file stance: keep the current `files` list unchanged and do not add `runtime/`, `docs/`, generated reports, archives, or local artifacts as part of this pass. That stance is a candidate boundary only, not a final `1.0` publish seal.

## Semver Policy

Pre-`1.0` releases may change public API, CLI, package file layout, language slices, and runtime expectations when the change is documented and claims checks are updated.

For `1.0` and later:

- `MAJOR` changes break documented public API, CLI behavior, package entrypoints, package files, Node floor, runtime expectations, or supported language/profile contracts.
- `MINOR` changes add backward-compatible public API, CLI options, supported language slices, examples, diagnostics, or runtime support.
- `PATCH` changes fix bugs, docs, diagnostics, packaging mistakes, or internal behavior without breaking documented public behavior.

IR schema versioning remains separate and is governed by [VERSIONING.md](VERSIONING.md). Package semver, IR schema versioning, and language-slice support levels are related evidence streams, not the same version number.

Release-script caveat: `version:bump` and `release:*` are release-action tools, not readiness checks. The current `scripts/version-bump.js` parser accepts stable `x.y.z` versions, while the live package is `0.1.0-beta.0`; before any real release, release tooling must be reviewed or updated so pre-release-to-`1.0` transitions are deliberate and reproducible.

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
- experimental examples unless a current manifest and support doc promote them.

Any compatibility-impacting change must update this contract, [PROJECT_STATUS.md](../PROJECT_STATUS.md), [README.md](../README.md), the support matrix or active docs as needed, and `claims:check`.

## No-Release Freeze Candidate Audit

Audit date: 2026-07-16.

| Surface | Current repo truth | Candidate boundary |
| --- | --- | --- |
| Package identity | `package.json` name is `luascript`; version is `0.1.0-beta.0`; `package.json#luascript.version` also says `0.1.0-beta.0` | No bump; no `1.0` package identity until explicit release action |
| Root entrypoint | `package.json#main` is `src/unified_luascript.js` | Candidate public import surface remains root package import only |
| Exports map | No `exports` map is declared | No subpath imports are frozen; deep imports stay internal |
| Root exports | `UnifiedLuaScript`, `CoreTranspiler`, `RuntimeSystem`, `AdvancedFeatures`, `PerformanceTools`, `AgenticIDE` | Six root export names are candidate public exports; method behavior still needs API-specific compatibility tests before final release |
| CLI/API surface | No package `bin`; `npm start` and `npm run dev` execute `src/unified_luascript.js`; `src/index.js` has direct CLI-like handling but is not package main or bin | No global CLI in the public contract; `src/index.js` remains non-public unless promoted later |
| Node floor | `engines.node` is `>=14.0.0` | Keep candidate floor until a compatibility decision changes it with evidence |
| Runtime helpers | `src/runtime*` and `src/runtime/` are package-included through `src/`; root `runtime/` helpers are repo-local and outside `files` | Do not silently promise root `runtime/` in published packages; include or exclude explicitly before `1.0` |
| Npm scripts | Local workflow, evidence gates, language gates, and release-action scripts coexist in `package.json` | Only documented local workflow and evidence gates are readiness surfaces; release scripts require explicit release request |
| Package files | `src/`, `test/`, `README.md`, `LICENSE` | Keep unchanged for this no-release candidate; final `1.0` must review docs/runtime inclusion |
| Semver policy | Pre-`1.0` mutability plus post-`1.0` MAJOR/MINOR/PATCH policy is documented here | Adopted as candidate policy; release tooling still needs pre-release transition review |
| Compatibility policy | Applies only to documented public surfaces and named supported slices | Candidate protects root import, root exports, no-bin stance, Node floor, package files, named slices, and named diagnostics |
| Changelog expectations | `CHANGELOG.md` current active top entry is `0.1.0-beta.0`; `changelog:generate` exists but writes release notes only when invoked | No changelog seal in this pass; release notes must name compatibility-impacting changes before release |
| Release-action boundaries | Release, version bump, changelog generation, artifact signing, tags, publish, and GitHub release are scriptable but not run | No tag, publish, version bump, GitHub release, artifact signing, or changelog seal without explicit release request |

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
- Public root exports are documented and tested, or narrowed before release.
- CLI position is chosen: no global `bin`, or a tested/documented `bin`.
- Node floor is chosen and verified.
- Runtime helper inclusion/exclusion is proven by package file review.
- Public npm workflow scripts are named.
- Evidence-gate scripts required for release are named.
- Semver and compatibility policies are adopted by active docs.
- Release-action commands are separated from readiness and verification workflows.
- `npm run claims:check`, `npm run status:check`, `npm run stubs:check`, and `npm run archive:audit` pass after this contract is updated.
