# LUASCRIPT Conformance Evidence Binder

Status: active evidence binder
Last updated: 2026-07-27
Track: Denali canonical `1.0` evidence structure

This binder is a certification-style evidence structure for LUASCRIPT. It is not ISO certification, third-party certification, production certification, or a claim that LUASCRIPT has reached the user's true omni-language 100% summit. It organizes the gates, reports, conformance suites, support boundaries, compatibility policy, release checklist, and reproducibility steps that could grow toward certification-grade evidence.

## Scope

- The binder indexes current evidence; it does not promote support by itself.
- Scoped beta, Denali canonical `1.0`, and true omni-language 100% remain separate.
- Current conformance, edge-case, and round-trip suites are scoped skeletons.
- A language, feature, profile, runtime, example, or package behavior is supported only when the support matrix, manifests, docs, runtime evidence, and current gates agree.
- Archived docs are historical evidence only.

## Evidence Stack

Primary truth sources:

- [../PROJECT_STATUS.md](../PROJECT_STATUS.md): root status entrypoint.
- [INDEX.md](INDEX.md): active-docs map and archive boundary.
- [LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md): route ledger and latest verification seals.
- [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md): measurable Denali `1.0` criteria.
- [LANGUAGE_SUPPORT_MATRIX.md](LANGUAGE_SUPPORT_MATRIX.md): current support claims and promotion boundaries.
- [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md): release-shaped conformance evidence bundle index that cross-links beta gates, language gates, Clarity evidence, conformance reports, actual programs, support matrix, compatibility policy, fixture/hash expectations, known unsupported areas, and reproducibility steps.

Active contracts and support references:

- [LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md](LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md): current IR semantics inventory.
- [LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md](LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md): first formal IR semantics draft plus the 2026-07-15 v1 evidence mapping draft for every current `npm run test:ir-conformance` fixture.
- [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md): bidirectional claim layers.
- [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md): promotion rules for language-depth slices.
- [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md): package entrypoints, CLI/API surface, Node/runtime expectations, package files, semver, compatibility, and release actions.
- [VERSIONING.md](VERSIONING.md): IR schema versioning policy.

## Gate Families

| Gate family | Commands | Evidence role | Current boundary |
| --- | --- | --- | --- |
| Documentation and claim integrity | `npm run status:check`, `npm run claims:check`, `npm run stubs:check`, `npm run archive:audit` | Proves active docs are linked, claims are guarded, stubs are classified, and archive material does not re-enter as active truth | Text and inventory guardrails, not runtime semantics |
| Beta evidence | `npm run beta:readiness`, `npm run beta:readiness:strict`, `npm run beta:preflight`, `npm run beta:full` | Proves the scoped beta readiness and local acceptance gates | Scoped beta evidence, not canonical `1.0` or full language support |
| Clarity evidence | `npm run clarity:dogfood`, `npm run clarity:canon`, `npm run clarity:canon:super`, `npm run clarity:languages` | Proves dogfood fixtures, strict local canon shards, governed Super Canon shards, and language qualification reports | Report-driven and scoped to current manifests |
| Language completion | `npm run language:implemented:bidirectional`, `npm run language:all:bidirectional`, per-language `language:<name>:bidirectional` and `language:<name>:ir-targets` | Proves named native/runtime/target slices through manifests and reports | Named slices only; no blanket bidirectionality or source identity |
| Canonical IR conformance | `npm run test:ir-conformance` | Proves the scoped conformance skeleton for current stable bridge emitters and feeds the v1 evidence map in `LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md` | 32 manifest fixtures mapped to named IR semantic rules or documented gaps; not a certification suite, schema-valid release contract, or canonical `1.0` promotion |
| Schema artifact mapping | `npm run test:schema-artifact-map` | Derives schema-valid canonical IR v1 artifacts from the current positive conformance fixtures, validates them with AJV, and records kind/field alias gaps | 21/21 positive fixture mappings plus 11 expected diagnostics; dual-surface transition evidence only, not release IR surface selection or compiler-output change |
| Dual-surface compatibility bridge | `npm run test:ir-compatibility-bridge` | Validates the internal bridge from current legacy object-tree IR to derived schema-valid canonical IR v1 artifacts with invariant checks | 21/21 positive fixture mappings, 168/168 invariant checks, and 11 expected diagnostics; internal-only bridge candidate, not public API or release IR surface selection |
| Edge-case matrix | `npm run test:edge-matrix` | Proves scoped edge cases by value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics | 25 scoped cases with category counts and case hashes; not exhaustive edge coverage |
| Unsupported diagnostics | `npm run test:unsupported-diagnostics` | Proves stable named unsupported diagnostics for JavaScript source, `.ls` source/meta repair, Python source, Lua source, core fallback, and target emitters | 21-case current diagnostic catalog only; not a full unsupported-feature catalog |
| Round-trip probes | `npm run test:roundtrip-probe` | Separates structural IR reparse checks from runtime-output equivalence checks and records the JS/.ls/Python/Lua bidirectionality layer map | 6 tiny probes plus layer accounting; not source identity or broad semantic equivalence |
| Source identity probes | `npm run test:source-identity-probe` | Proves normalized `.ls` source identity, normalized parser-owned AST identity, and normalized current bridge IR identity for positive named fixtures, while expected unsupported diagnostics stay separate | 15 fixtures: 12 normalized source/AST/IR identity checks plus 3 expected diagnostics; token identity is measured but non-gating; not runtime-output equivalence, broad lossless recovery, or broad semantic equivalence |
| Actual examples | `npm run test:actual-programs`, `npm run test:luascript-meta`, `npm run test:lua-input`, `npm run test:parser-ownership` | Proves executable `.ls`, Lua input, parser ownership, and actual-program surfaces | Current fixture families only |
| General verification | `npm run verify`, `npm test` | Proves broader local verification and core/runtime baseline | Depends on current local runtime/tool availability |

## Report And Artifact Index

Current generated evidence artifacts:

- `artifacts/beta_readiness.json`
- `artifacts/beta_gates/preflight-report.json`
- `artifacts/beta_gates/full-report.json`
- `artifacts/language_completion/*-report.json`
- `artifacts/clarity_canon/dogfood-report.json`
- `artifacts/clarity_canon/canon-report.json`
- `artifacts/clarity_canon/canon-languages-report.json`
- `artifacts/clarity_canon/canon-super-report.json`
- `artifacts/conformance/canonical-ir-conformance-report.json`
- `artifacts/conformance/schema-artifact-mapping-report.json`
- `artifacts/conformance/dual-surface-compatibility-bridge-report.json`
- `artifacts/conformance/roundtrip-probe-report.json`
- `artifacts/conformance/source-identity-probe-report.json`
- `artifacts/conformance/unsupported-diagnostics-report.json`
- `artifacts/edge_matrix/edge-case-matrix-report.json`

The release-shaped bundle map is [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md). It is certification-style evidence, not certification, and it does not create a release artifact, version bump, tag, publish action, package `bin`, package `exports` map, canonical `1.0`, or true omni-language 100% claim.

Current non-report manifest evidence:

- `tests/conformance/manifest.json`
- `tests/edge_matrix/manifest.json`
- `tests/roundtrip/manifest.json`
- `tests/roundtrip/source_identity_manifest.json`
- `tests/language_completion/manifests/*.json`
- `tests/actual_programs/manifest.json`
- `tests/lua_input/manifest.json`
- `tests/clarity_canon/manifest.json`
- `tests/clarity_canon/language_qualification_manifest.json`

Durable local report closure: `npm run test:ir-conformance`, `npm run test:schema-artifact-map`, `npm run test:ir-compatibility-bridge`, `npm run test:roundtrip-probe`, `npm run test:source-identity-probe`, and `npm run test:unsupported-diagnostics` now write standalone JSON reports under `artifacts/conformance/` with environment metadata, fixture or case hashes, pass/fail summaries, and support-matrix traceability. The schema-artifact mapping report proves schema-valid derived artifacts for 21/21 positive conformance fixtures, preserves 11 expected diagnostics, and records dual-surface alias gaps including `VariableDeclarator->VariableDeclaration`, `Parameter->Identifier`, `UnaryExpression->BinaryExpression`, and `SwitchCase->BlockStatement`. The dual-surface compatibility bridge report proves the internal bridge candidate in `src/ir/schema_artifact_bridge.js` for 21/21 positive conformance fixtures, 168/168 invariant checks, 11 expected diagnostics, and internal-only public API status. The round-trip report now also records a JS/.ls/Python/Lua layer map for native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, structural IR reparse, normalized source identity, token identity, and semantic equivalence. The source-identity report now records the release-shaped 15-fixture `.ls` suite, coverage counts, tier counts, manifest hash, fixture hashes, 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, 3 expected unsupported diagnostics, and its `.ls` source-identity layer contribution. `npm run test:edge-matrix` now writes a scoped 25-case edge report with environment metadata, manifest hash, per-case hashes, category counts, pass/fail summaries, runtime/error/diagnostic check counts, and support-matrix traceability. `npm run test:unsupported-diagnostics` now writes a 21-case report across JavaScript, `.ls`, Python, Lua, core fallback, and target-emitter diagnostics. Remaining evidence gap: these reports are scoped local artifacts, not cross-platform release conformance bundles, third-party certification evidence, token-level source preservation, broad parser-owned AST identity beyond the current 12 positive fixtures, broad lossless source recovery, exhaustive edge coverage, a full unsupported-feature catalog, final release IR surface selection, or broad semantic equivalence.

## Conformance Suites

| Suite | Manifest/test | Current scope | Certification gap |
| --- | --- | --- | --- |
| Canonical IR conformance | `tests/conformance/manifest.json`, `tests/conformance/canonical_ir_conformance.test.js`, `artifacts/conformance/canonical-ir-conformance-report.json` | 32 fixtures across value semantics, literals, bindings, scope, control flow, functions, calls, arrays/objects, errors, unsupported nodes, determinism, and target obligations, now mapped to named v1 evidence rules or documented gaps | Durable local report, v1 evidence map, and derived schema artifact mapping exist; still needs release IR surface selection, a larger matrix, cross-platform runs, and release-blocking policy |
| Schema artifact mapping | `tests/conformance/manifest.json`, `tests/conformance/schema_artifact_mapping.test.js`, `artifacts/conformance/schema-artifact-mapping-report.json` | 21 positive conformance fixtures produce derived schema-valid canonical IR v1 artifacts; 11 expected diagnostics remain separate; report records `VariableDeclarator->VariableDeclaration`, `Parameter->Identifier`, `UnaryExpression->BinaryExpression`, and `SwitchCase->BlockStatement` aliases | Dual-surface transition evidence only; final release must choose the schema artifact as compiler output or define a formal compatibility bridge |
| Dual-surface compatibility bridge | `src/ir/schema_artifact_bridge.js`, `tests/conformance/dual_surface_compatibility_bridge.test.js`, `artifacts/conformance/dual-surface-compatibility-bridge-report.json` | 21 positive conformance fixtures pass the internal legacy object-tree to schema artifact bridge; 168/168 invariant checks pass; 11 expected diagnostics remain separate | Internal bridge candidate only; final release still needs surface adoption, compatibility versioning, migration policy, and release-blocking policy |
| Edge-case matrix | `tests/edge_matrix/manifest.json`, `tests/edge_matrix/edge_case_matrix.test.js`, `artifacts/edge_matrix/edge-case-matrix-report.json` | 25 scoped cases across value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics; category counts are value 4, control 4, scope 3, data 4, errors 3, target-specific 3, unsupported diagnostics 4 | Needs massive edge expansion beyond 25 cases and feature-by-feature coverage accounting |
| Round-trip probe | `tests/roundtrip/manifest.json`, `tests/roundtrip/roundtrip_probe.test.js`, `artifacts/conformance/roundtrip-probe-report.json` | 6 probes separating structural IR reparse and runtime-output equivalence; JS/.ls/Python/Lua layer map recorded; source-preserving round-trip count is 0 | Needs source-preserving identity probes beyond `.ls`, broader source-to-IR-to-target-to-IR proof, Lua structural IR reparse, and semantic-equivalence tiers |
| Source identity probe | `tests/roundtrip/source_identity_manifest.json`, `tests/roundtrip/source_identity_probe.test.js`, `artifacts/conformance/source-identity-probe-report.json` | 15 `.ls` fixtures: 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, and 3 expected unsupported diagnostics across bindings, expressions, functions, conditionals, loops, arrays, objects, indexing, slicing, profile blocks, repair blocks, verify blocks, and diagnostics; token identity is measured but non-gating | Needs token-level identity promotion route, broader parser-owned AST fixture families, cross-target source identity where applicable, runtime-output/semantic-equivalence tiers, and broader fixture families |
| Unsupported diagnostics | `tests/ir/unsupported_diagnostics.test.js`, `artifacts/conformance/unsupported-diagnostics-report.json` | 21 named unsupported diagnostics for stable current JavaScript, `.ls`, Python, Lua, core fallback, and target-emitter failures | Needs a full unsupported-feature catalog tied to support matrix rows |
| Language completion | `tests/language_completion/manifests/*.json`, `tests/language_completion/bidirectional_harness.js` | 26 language/target manifests for named native and target-runtime slices | Needs per-language depth coverage, fixture hashing, external runtime matrix, and accession records |
| Actual programs | `tests/actual_programs/manifest.json`, `tests/actual_programs.test.js` | Executable representative `.ls` and math/example programs | Needs release example classification and example-by-example support declarations |

## Support Matrix Traceability

The support matrix is the active claim table. A support row may broaden only after the accession rules are satisfied:

- manifest coverage exists;
- parser coverage exists;
- lowering exists;
- emitter coverage exists;
- native runtime evidence exists or is explicitly excluded for the claim;
- target runtime evidence exists where claimed;
- docs and support matrix are updated;
- `claims:check` guards the wording;
- the Denali ledger records the route and verification.

The binder should never be used to promote a row by implication. It records where proof lives.

## Known Unsupported Areas

Current unsupported or not-yet-certification-grade areas include:

- broad full-language support beyond named manifest slices;
- release canonical IR surface selection beyond the current internal dual-surface compatibility bridge candidate;
- full Unicode mathematical DSL and full symbolic physics/EE algebra;
- round-trip source identity beyond the 12 positive normalized `.ls` source/parser-owned-AST/IR identity fixtures;
- broad semantic equivalence beyond named runtime-output equivalence fixtures;
- exhaustive edge-case coverage across values, control flow, scope, data structures, errors, target-specific behavior, and diagnostics;
- external conformance suite format and third-party audit process;
- durable environment lock for every native runtime command;
- package `bin` contract and final public API freeze;
- package file surface freeze for `1.0`;
- cross-platform release conformance bundles with fixture hashes, environment metadata, and release-blocking policy.

Unsupported features should fail closed through named diagnostics or remain documented exclusions. They should not appear as fake implementation stubs or silent passes.

## Compatibility Policy

Compatibility evidence follows [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md):

- package name and version track remain explicit;
- root entrypoint and exported names must be frozen or changed with migration notes before `1.0`;
- no package `exports` map is currently declared, so no subpath import is frozen by the no-release candidate;
- no global CLI is currently declared through npm `bin`;
- Node floor is currently `>=14.0.0`;
- current package file list is beta-scoped, not a final `1.0` publish promise;
- root-level `runtime/` helpers are repo-local under the current package `files` surface until release review includes or explicitly excludes them;
- release actions require an explicit release request;
- semver applies to documented public surfaces and named supported slices.

IR schema compatibility follows [VERSIONING.md](VERSIONING.md), not package semver alone.

## Release Evidence Checklist

Before any `1.0` release action:

1. Confirm [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md) has no blocking open item for the release scope.
2. Confirm this binder, the support matrix, public API/runtime contract, bidirectionality contract, and Denali ledger agree.
3. Capture environment metadata: `node -v`, `npm -v`, operating system, and every native runtime command used by language gates.
4. Run the minimum release gate set from the exit criteria.
5. Confirm `npm run status:check`, `npm run claims:check`, `npm run stubs:check`, and `npm run archive:audit` pass after all docs are updated.
6. Refresh generated reports under `artifacts/`.
7. Record report paths, timestamps, fixture counts, and known exclusions in the Denali ledger.
8. Confirm no package version bump, tag, publish, or GitHub release occurs unless explicitly requested.
9. Prepare release notes/changelog only after the evidence binder and ledger are sealed.
10. Preserve the exact source state used for any release artifact.

## Reproducibility Steps

Baseline local reproduction:

```bash
npm install
npm run status:check
npm run claims:check
npm run stubs:check
npm run archive:audit
npm run test:ir-conformance
npm run test:schema-artifact-map
npm run test:ir-compatibility-bridge
npm run test:edge-matrix
npm run test:unsupported-diagnostics
npm run test:roundtrip-probe
npm run language:implemented:bidirectional
npm run beta:readiness
npm run beta:preflight
npm run beta:full
```

For a release-candidate reproduction, add:

```bash
npm run beta:readiness:strict
npm run language:all:bidirectional
npm run test:actual-programs
npm run test:luascript-meta
npm run test:lua-input
npm run test:parser-ownership
npm run clarity:dogfood
npm run clarity:canon
npm run clarity:languages
npm run verify
npm test
```

After running, inspect the artifact index above and compare the support matrix, claims checks, and Denali ledger. A passing local run is evidence for the current named slices only; it is not ISO certification or true omni-language completion.

## Growth Path Toward Certification-Grade Evidence

The binder becomes certification-grade only after these gaps close:

- formal release conformance report format;
- fixture hashing and manifest versioning for every evidence suite;
- deterministic report generation for every conformance, round-trip, unsupported-diagnostic, language-depth, and compatibility gate;
- cross-platform CI matrix with native runtime version capture;
- full traceability from support matrix row to fixtures, reports, diagnostics, docs, and release notes;
- broader language-depth coverage beyond narrow slices;
- massive edge-case matrices;
- external review process and certification criteria;
- explicit pass/fail policy for every `1.0` criterion.
