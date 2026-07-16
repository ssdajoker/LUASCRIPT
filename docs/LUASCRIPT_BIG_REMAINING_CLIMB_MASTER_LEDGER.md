# LUASCRIPT Big Remaining Climb Master Ledger

Status: active master ledger
Last updated: 2026-07-16
Track: post-Denali climb toward source-preserving round-trip proof and certification-grade evidence

This ledger takes over after the penultimate Denali readiness audit and the 2026-07-16 Denali release-candidate audit. Denali canonical `1.0` is estimated at 78% done, while the user's true omni-language 100% summit is estimated at 7% done. This ledger is for the remaining climb: language-depth coverage, formal IR semantics, edge-case expansion, bidirectionality proof, public API/runtime stabilization, conformance tests, compatibility rules, and certification-grade evidence.

This is not a release tag, package bump, ISO certification, or claim that LUASCRIPT already has broad lossless source recovery. It is the execution ledger for getting there.

## Current Seed State

Current evidence inherited from Denali:

- Scoped beta and strict-native named slices are green for current implemented lanes.
- `npm run beta:readiness:strict` reports 17/17 implemented lanes beta-ready and 0 native setup blockers.
- `npm run test:ir-conformance` passes 32 fixtures, writes `artifacts/conformance/canonical-ir-conformance-report.json`, and is now mapped fixture-by-fixture to named IR semantic rules or documented gaps in `docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md`.
- `npm run test:roundtrip-probe` passes 6 probes and now writes `artifacts/conformance/roundtrip-probe-report.json` with JS/.ls/Python/Lua bidirectionality layer evidence.
- `npm run test:source-identity-probe` passes 15 `.ls` fixtures: 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, and 3 expected unsupported diagnostics; it writes `artifacts/conformance/source-identity-probe-report.json`.
- `npm run test:unsupported-diagnostics` passes 21 named diagnostics and writes `artifacts/conformance/unsupported-diagnostics-report.json`.
- `npm run test:edge-matrix` passes 25 scoped edge cases and writes `artifacts/edge_matrix/edge-case-matrix-report.json` with category counts, manifest hash, per-case hashes, pass/fail summaries, runtime/error/diagnostic check counts, and support-matrix traceability.
- `docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md` is now the release-shaped conformance evidence bundle index. It cross-links beta gates, language gates, Clarity dogfood/canon/super-canon evidence, IR conformance, edge matrix, round-trip probe, source identity probe, unsupported diagnostics, actual programs, support matrix, compatibility policy, report paths, fixture/hash expectations, known unsupported areas, and reproducibility steps as certification-style evidence, not certification.
- Current round-trip evidence now includes structural IR reparse, runtime-output equivalence, and a release-shaped 15-fixture `.ls` source identity suite with 12 positive normalized source/parser-owned-AST/IR identity checks and 3 diagnostic fixtures. The JS/.ls/Python/Lua layer map now records native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, structural IR reparse, normalized source identity, token identity, and semantic-equivalence status without broad promotion. Token-level text identity, broad parser-owned AST coverage beyond the current fixtures, broad lossless source recovery, and broad semantic equivalence remain open.
- The 2026-07-16 release-candidate audit marks Denali canonical `1.0` as 78% done / 22% remaining and true omni-language 100% as 7% done / 93% remaining. The Denali summit ledger cannot close as a canonical `1.0` release ledger yet; it hands off here for schema-valid IR surface reconciliation, source-preserving proof layers, final API/runtime freeze, compatibility seal, one-command evidence bundle generation, and release-blocking conformance policy.

## Summit Definitions

| Summit | Current estimate | Meaning |
| --- | --- | --- |
| Denali canonical `1.0` | 78% done / 22% remaining | Stable named support claims, release-facing docs, runtime gates, package/runtime contract, compatibility rules, and conformance evidence agree for a scoped `1.0`. |
| True omni-language 100% | 7% done / 93% remaining | Universal bidirectional IR, source-preserving round trips, broad semantic equivalence, massive edge-case coverage, and certification-grade evidence across deep language slices. |

## Remaining Climb Tracks

| Track | Current state | Next executable slice | Exit signal |
| --- | --- | --- | --- |
| Language-depth coverage | 17 named lanes have narrow native or target-runtime evidence; broad language support is not claimed | Expand Python V1.3 and `.ls` V0.16 first, then JavaScript Ring 3, using accession checklists | Each promoted slice has parser, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and ledger proof |
| Formal IR semantics | Inventory and spec v0 exist; the 32-fixture conformance surface is now mapped to v1 evidence rules and documented gaps | Reconcile schema-valid conformance artifacts with the release IR surface or document a dual-surface transition | Every supported IR node has value/control/error semantics, target obligations, schema-valid evidence, and conformance fixtures |
| Edge-case matrix | Scoped 25-case matrix exists with category counts and report hashes | Grow beyond 25 only after the schema/release-surface IR route, or add release-shaped edge families tied to mapped IR semantics | Matrix has release-shaped feature coverage accounting and report hashes |
| Bidirectionality proof | Named-slice gates plus 6 round-trip probes plus 15 `.ls` source identity probes including 12 normalized parser-owned AST identity checks; JS/.ls/Python/Lua layer map is report-backed | Add the next real proof layer: Lua structural IR reparse or a second normalized source-identity lane, without broad language claims | Source -> IR -> emitted source -> parser identity proof exists for named fixtures and broad identity claims stay tiered |
| Public API/runtime stabilization | No-release freeze candidate is prepared; package remains `0.1.0-beta.0`; no npm `bin`; no `exports` map; root `runtime/` is outside package `files` | Add API-specific compatibility tests and final release-package review before any `1.0` action | Package entrypoint, exports, files, Node floor, CLI stance, runtime files, semver, and release actions are final for `1.0` |
| Conformance tests | Durable local reports exist for IR conformance, round-trip probes, source identity, unsupported diagnostics, and the 25-case edge matrix; the release-shaped bundle index is now active | Add first-class report hashes for clarity, language, actual-program, parser-ownership, and compatibility gates | One command can produce a complete local conformance evidence bundle |
| Compatibility rules | Versioning and public API/runtime contract exist | Add compatibility matrix for Node, package files, runtime helpers, IR schema, examples, and native runtimes | Compatibility-impacting changes require migration notes and release checklist updates |
| Certification-grade evidence | Binder exists; local reports are scoped | Add cross-platform metadata and CI-style reproducibility policy | Evidence can be replayed from a preserved source state with environment/runtime versions |

## Exact Next Executable Slices

1. Source-preserving round-trip suite: SEALED
   - `tests/roundtrip/source_identity_manifest.json` is active.
   - `tests/roundtrip/source_identity_probe.test.js` is active.
   - `npm run test:source-identity-probe` is exposed.
   - The suite covers 15 `.ls` fixtures: 12 positive normalized source/parser-owned-AST/IR identity fixtures and 3 expected unsupported diagnostics.
   - Positive coverage includes bindings, expressions, functions, conditionals, loops, arrays, objects, indexing, slicing, profile blocks, repair blocks, and verify blocks.
   - Diagnostic coverage includes unsupported `throw`, forbidden profile assertion, and unsupported repair strategy fixtures.
   - Report path: `artifacts/conformance/source-identity-probe-report.json`.
   - Current result: 15/15 fixtures pass; 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, and 3 expected unsupported diagnostics pass.
   - Boundary: this proves normalized source/parser-owned-AST/IR identity for named positive `.ls` fixtures only; token-level identity is reported but not required, and runtime-output equivalence, broad parser-owned AST coverage, broad lossless source recovery, and broad semantic equivalence remain open.

2. Edge-case matrix expansion: SEALED
   - `tests/edge_matrix/manifest.json` now has `status: "scoped-25"`.
   - `npm run test:edge-matrix` passes 25/25 scoped cases.
   - Category counts are value 4, control 4, scope 3, data 4, errors 3, target-specific 3, unsupported diagnostics 4.
   - The report path remains `artifacts/edge_matrix/edge-case-matrix-report.json`.
   - The report now records environment metadata, manifest hash, per-case hashes, pass/fail summaries, runtime/error/diagnostic check counts, and support-matrix traceability.
   - Boundary: this is broader edge evidence, not exhaustive edge coverage, release conformance, ISO certification, or true omni-language 100%.

3. Source identity suite expansion: SEALED
   - `tests/roundtrip/source_identity_manifest.json` now has `status: "release-shaped-source-identity-suite"`.
   - The manifest keeps normalized source identity, normalized AST identity, normalized IR identity, token-level identity, runtime-output equivalence, expected diagnostics, and semantic equivalence as separate claim tiers.
   - The IR semantics v1 evidence route is now sealed; broad lossless recovery remains a later climb.

4. IR semantics v1 evidence pass: SEALED
   - `docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md` now includes a v1 evidence mapping draft.
   - All 32 current `tests/conformance/manifest.json` fixtures are mapped to named IR semantic rules or documented gaps.
   - Covered rule families include values, literals, bindings, scope, control flow, functions, calls, arrays/objects, errors, unsupported nodes, determinism, and target obligations.
   - Claims checks guard the v1 evidence-map section, rule boundaries, and fixture-to-rule coverage.
   - Boundary: this is evidence accounting for the current scoped conformance surface; it is not schema-valid conformance for every fixture, release IR surface selection, canonical `1.0`, exhaustive edge coverage, or true omni-language 100%.

5. Bidirectionality layer map: SEALED
   - `tests/roundtrip/manifest.json` now records JS/.ls/Python/Lua layers for native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, structural IR reparse, normalized source identity, token identity, and semantic equivalence.
   - `tests/roundtrip/roundtrip_probe.test.js` validates that every mapped language names each layer, evidence, and boundaries.
   - `artifacts/conformance/roundtrip-probe-report.json` writes the layer map; current manifest hash is `c7f9b561e5e891773e4d32e2900204c568d4c764b399f6d6f4841d7184dbe096`.
   - `tests/roundtrip/source_identity_manifest.json` records the `.ls` source-identity contribution separately: normalized source/AST/IR identity proven for 12 positives, token identity measured but non-gating, runtime-output and semantic equivalence not claimed by that harness.
   - `artifacts/conformance/source-identity-probe-report.json` current manifest hash is `0280f940b1004e9e2602217ddd6135e5dd3a28a27152c8eb547c1666498c9272`.
   - `tests/language_completion/bidirectional_harness.js` now strips only preserved top-level `.ls` `verify { ... }` blocks before embedded `ls_contains` / `ls_not_contains` self-verification assertions, so verify-block source identity and emitted policy checks can coexist.
   - Boundary: JavaScript and Python source identity remain unclaimed; Lua structural IR reparse remains unclaimed; semantic equivalence remains partial fixture stdout/diagnostic evidence only.

6. Schema-valid conformance artifact mapping: NOT STARTED / NEXT ROUTE
   - Decide whether current conformance fixtures must emit a consolidated schema artifact, stay on the legacy object-tree bridge, or move through a documented dual-surface transition.
   - Map fixture behavior to schema-valid artifacts where possible and document field alias gaps where not.
   - Keep this scoped to evidence and compatibility; do not refactor the compiler path unless a tiny, proven fix is required.

7. Public API/runtime freeze candidate: SEALED for no-release candidate; OPEN for final `1.0` release freeze.
   - Current candidate explicitly preserves no npm `bin`, no package `exports` map, root package import through `src/unified_luascript.js`, Node floor `>=14.0.0`, and package files `src/`, `test/`, `README.md`, and `LICENSE`.
   - Root-level `runtime/` helpers are repo-local under the current package `files` surface until release review includes or explicitly excludes them.
   - Release, changelog, artifact-signing, tag, publish, and version-bump scripts remain explicit release actions.
   - Package version remains `0.1.0-beta.0` until explicit release action.

8. Conformance evidence bundle index: SEALED for document index; OPEN for one-command generated bundle.
   - `docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md` is active.
   - It references beta reports, language reports, Clarity reports, IR conformance, round-trip, source identity, unsupported diagnostics, edge matrix, actual programs, support matrix, compatibility policy, and exact reproduction steps.
   - It includes report paths, fixture/hash expectations, support-matrix traceability requirements, known unsupported areas, and no-release boundaries.
   - Boundary: this is certification-style evidence navigation, not ISO certification, third-party certification, production certification, canonical `1.0`, a package release, or true omni-language 100%.

## Loose-End Closure Pass

2026-07-16 status: 100% of started post-beta/Denali/Big Remaining Climb routes in this ledger are sealed at their scoped route level. The unsealed items below are explicitly future routes, not abandoned started work.

Started routes sealed so far:

- scoped beta handoff and strict-native closure for named slices;
- durable conformance reports;
- 25-case edge matrix;
- 15-fixture `.ls` source identity suite;
- normalized parser-owned AST identity for the 12 positive `.ls` source identity fixtures;
- canonical IR semantics v1 evidence mapping for the current 32 conformance fixtures;
- JS/.ls/Python/Lua bidirectionality layer map;
- unsupported diagnostics catalog at 21 named diagnostics;
- no-release public API/runtime freeze candidate;
- release-shaped conformance evidence bundle index;
- Denali release-candidate audit and handoff verdict.

Future routes not yet started:

- Lua structural IR reparse or a second normalized source-identity lane;
- schema-valid conformance artifact mapping and release IR surface reconciliation;
- one-command generated evidence bundle;
- first-class clarity/language/actual-program/parser-ownership/compatibility report hashes;
- final `1.0` public API/runtime freeze;
- compatibility matrix and release-package review;
- cross-platform/runtime metadata capture and release-blocking conformance policy.

## Source-Preserving Round Trip Target

The first source-preserving proof should be deliberately narrow:

```text
stable .ls source
  -> parser-owned AST / current bridge IR
  -> emitted .ls source
  -> parser-owned AST / current bridge IR
  -> normalized source identity, normalized parser-owned AST identity, and normalized IR identity
```

The proof must record what was preserved:

- token-level text identity: `OPEN`;
- normalized source identity: SEALED for 12 positive named `.ls` fixtures;
- normalized AST identity: SEALED for 12 positive named `.ls` fixtures through `src/parser/enhanced_parser.py::parse_artifact`, excluding token stream and trivia;
- normalized IR identity: SEALED for 12 positive named `.ls` fixtures in the source-identity suite and seeded in the round-trip probe;
- runtime-output equivalence: already seeded for tiny JS/Python cases;
- broad semantic equivalence: `OPEN`.

## Summit Closure Path

To close Denali canonical `1.0`, do these in order:

1. Source identity release-shaped suite: SEALED.
   - `npm run test:source-identity-probe` now covers 15 fixtures: 12 positive `.ls` source identity fixtures and 3 expected unsupported diagnostics.
   - Claim tiers remain explicit: normalized source identity, normalized AST identity, normalized IR identity, token-level text identity, runtime-output equivalence, expected diagnostics, and semantic equivalence.

2. Keep the 25-case edge matrix green while broader routes advance.
   - Values, control, scope, data, errors, target-specific behavior, and unsupported diagnostics now have category counts and report hashes.
   - Future expansion beyond 25 should be tied to release-shaped feature families, not broad edge coverage claims.

3. IR semantics v1 evidence pass: SEALED.
   - Every current conformance fixture now maps to a named IR semantic rule or documented gap.
   - Remaining IR blockers are schema-valid conformance artifacts, release IR surface choice, helper versioning, complete target deltas, and broader value/error edge semantics.

4. Add the next bidirectionality proof layer.
   - Candidate A: add a tiny Lua structural IR reparse fixture.
   - Candidate B: start a second normalized source-identity lane only if parser-owned artifacts are stable.
   - Do not promote semantic equivalence or token identity from accounting alone.

5. Reconcile schema-valid conformance artifacts with the release IR surface.
   - The next IR route must decide consolidated schema artifact, legacy object tree, or dual-surface transition before promotion.

6. Freeze the public API/runtime candidate: SEALED for no-release candidate; OPEN for final release.
   - Current candidate chooses no-bin/no-exports, root package import only, Node floor `>=14.0.0`, current package `files`, repo-local root `runtime/` boundary, semver/compatibility policy, and explicit release-action separation.
   - Final `1.0` still needs API-specific compatibility tests, migration-note review, and package-file/runtime-helper release review before a tag, publish, changelog seal, or version bump.

7. Build the conformance evidence bundle index: SEALED for document index; OPEN for one-command generated bundle.
   - [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) cross-links beta reports, language reports, Clarity reports, IR conformance, round-trip, source identity, unsupported diagnostics, edge matrix, actual programs, support matrix, package/runtime contract, known unsupported areas, and exact reproduction steps.

8. Denali release-candidate audit: SEALED for verdict; OPEN for release closure.
   - [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md) now records the 2026-07-16 RC audit table.
   - Current verdict: Denali canonical `1.0` is 78% done / 22% remaining; true omni-language 100% is 7% done / 93% remaining.
   - Closure decision: the current Denali ledger cannot close as a canonical `1.0` release ledger and hands off to this Big Remaining Climb ledger.
   - Remaining blockers: source-preserving proof layers beyond the current `.ls` normalized suite, schema-valid release IR surface, final API/runtime freeze, compatibility seal, first-class clarity/language/actual-program report hashes, cross-platform/runtime metadata, one-command evidence bundle generation, and release-blocking conformance policy.

## Guardrails

- Do not call any result source-preserving unless it records source identity, not only stdout or IR shape.
- Do not broaden a language row without the accession checklist.
- Do not use archived reports as current truth.
- Do not tag, publish, bump version, or treat the no-release freeze candidate as a final release API without explicit release action.
- Keep Denali `1.0` and true omni-language 100% percentages separate.

## First Route Seal

The first Big Remaining Climb route starts with durable conformance reports:

| Gate | Durable report |
| --- | --- |
| `npm run test:ir-conformance` | `artifacts/conformance/canonical-ir-conformance-report.json` |
| `npm run test:roundtrip-probe` | `artifacts/conformance/roundtrip-probe-report.json` |
| `npm run test:source-identity-probe` | `artifacts/conformance/source-identity-probe-report.json` |
| `npm run test:unsupported-diagnostics` | `artifacts/conformance/unsupported-diagnostics-report.json` |

Second route seal: [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) is now the release-shaped evidence navigation layer. It is certification-style evidence, not certification, and it leaves a one-command generated bundle, first-class clarity/language/actual-program report hashes, and compatibility-report hashing open for later.

RC route seal: the 2026-07-16 Denali release-candidate audit is SEALED for verdict and OPEN for release closure. It updates the estimates to Denali canonical `1.0` 78% done / 22% remaining and true omni-language 100% 7% done / 93% remaining, and it keeps scoped beta, Denali `1.0`, and the true omni-language summit separate.

Next route after this ledger: add a real new proof layer, preferably a tiny Lua structural IR reparse probe or a second normalized source-identity lane, then reconcile schema-valid conformance artifacts with the release IR surface. Public API/runtime next work is final-release review only: API compatibility tests, package-file/runtime-helper inclusion, and release-tooling pre-release transition checks.
