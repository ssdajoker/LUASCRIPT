# LUASCRIPT Big Remaining Climb Master Ledger

Status: active master ledger
Last updated: 2026-07-29
Track: post-Denali climb toward source-preserving round-trip proof and certification-grade evidence

This ledger took over after the penultimate Denali readiness audit and the 2026-07-16 release-candidate audit, whose historical estimates were 78% for Denali and 7% for the true omni-language horizon. The scoped local/current-host Denali release candidate is now sealed at the end of this ledger; the package release and the far larger omni-language climb remain separate.

This is not a release tag, package bump, ISO certification, or claim that LUASCRIPT already has broad lossless source recovery. It is the execution ledger for getting there.

## Current Seed State

Current evidence inherited from Denali:

- Scoped beta and strict-native named slices are green for current implemented lanes.
- `npm run beta:readiness:strict` reports 17/17 implemented lanes beta-ready and 0 native setup blockers.
- `npm run test:ir-conformance` passes 32 fixtures, writes `artifacts/conformance/canonical-ir-conformance-report.json`, and is now mapped fixture-by-fixture to named IR semantic rules or documented gaps in `docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md`.
- `npm run test:schema-artifact-map` passes 21/21 positive derived schema-artifact mappings, 168/168 base invariants, and 147/147 release-contract checks while preserving 11 expected diagnostics.
- `npm run test:ir-compatibility-bridge` enforces chosen contract `1.0.0-rc.1`: 21/21 internal mappings, 168/168 base invariants, 10/10 static contract rules, 147/147 mapping-contract rules, 21/21 deterministic artifacts, 1/1 supplemental DoWhile shape proof, 12/12 malformed-shape negatives, 5/5 malformed-source rejections, and 11 expected diagnostics.
- `npm run test:roundtrip-probe` passes 7 probes: 5 structural IR reparse checks and 2 runtime-output equivalence checks; it writes `artifacts/conformance/roundtrip-probe-report.json` with JS/.ls/Python/Lua bidirectionality layer evidence.
- `npm run test:source-identity-probe` passes 15 `.ls` fixtures: 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, and 3 expected unsupported diagnostics; it writes `artifacts/conformance/source-identity-probe-report.json`.
- `npm run test:unsupported-diagnostics` passes 21 named diagnostics and writes `artifacts/conformance/unsupported-diagnostics-report.json`.
- `npm run test:edge-matrix` passes 25 scoped edge cases and writes `artifacts/edge_matrix/edge-case-matrix-report.json` with category counts, manifest hash, per-case hashes, pass/fail summaries, runtime/error/diagnostic check counts, and support-matrix traceability.
- `docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md` is the release-shaped evidence map and now points to the deterministic `artifacts/release_evidence/denali-release-evidence-bundle.json` artifact, the required/informational split, and the authoritative 26-step preflight.
- Current round-trip evidence now includes structural IR reparse, runtime-output equivalence, and a release-shaped 15-fixture `.ls` source identity suite with 12 positive normalized source/parser-owned-AST/IR identity checks and 3 diagnostic fixtures. The JS/.ls/Python/Lua layer map now records native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, structural IR reparse, normalized source identity, token identity, and semantic-equivalence status without broad promotion. Token-level text identity, broad parser-owned AST coverage beyond the current fixtures, broad lossless source recovery, and broad semantic equivalence remain open.
- The 2026-07-16 78%/22% Denali and 7%/93% omni-language estimates remain historical audit evidence. The 2026-07-29 seal closes the scoped no-release Denali RC route after the named IR, package, compatibility, provenance, evidence-bundle, release-policy, and tooling gaps were implemented. It does not close the release seal or true omni-language horizon.

## Summit Definitions

| Summit | Current estimate | Meaning |
| --- | --- | --- |
| Denali canonical `1.0` | Scoped local RC sealed; release action open | Stable named support claims, release-facing docs, runtime gates, package/runtime contract, current-host compatibility rules, and conformance evidence agree for the no-release candidate. |
| True omni-language 100% | Historical estimate 7%; still far beyond Denali | Universal bidirectional IR, source-preserving round trips, broad semantic equivalence, massive edge-case coverage, cross-platform qualification, and independent certification-grade evidence across deep language slices. |

## Remaining Climb Tracks

| Track | Current state | Next executable slice | Exit signal |
| --- | --- | --- | --- |
| Language-depth coverage | 17 named lanes have narrow native or target-runtime evidence; broad language support is not claimed | Expand Python V1.3 and `.ls` V0.16 first, then JavaScript Ring 3, using accession checklists | Each promoted slice has parser, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and ledger proof |
| Formal IR semantics | Contract `1.0.0-rc.1` chooses legacy Program IR `v0` as operational and canonical artifact `1.0.0` as a one-way evidence/serialization projection; current conformance mappings, schema parity, aliases, shapes, determinism, migration, and deprecation are checked | Expand original-kind semantics, helper versioning, target deltas, and release invariant policy | Every supported IR node has value/control/error semantics, target obligations, schema-valid evidence, and conformance fixtures |
| Edge-case matrix | Scoped 25-case matrix exists with category counts and report hashes | Grow beyond 25 only after the schema/release-surface IR route, or add release-shaped edge families tied to mapped IR semantics | Matrix has release-shaped feature coverage accounting and report hashes |
| Bidirectionality proof | Named-slice gates plus 7 round-trip probes, including one Lua -> Lua normalized Program-IR reparse seed, plus 15 `.ls` source identity probes including 12 normalized parser-owned AST identity checks; JS/.ls/Python/Lua layer map is report-backed | Keep claims tiered while compatibility, evidence-bundle, and release-policy bearings advance | Source -> IR -> emitted source -> parser identity proof exists for named fixtures and broad identity claims stay tiered |
| Public API/runtime stabilization | Scoped no-release package boundary sealed: package remains `0.1.0-beta.0`; six root exports; no npm `bin`; no `exports` map; root `runtime/` excluded; two installed examples; clean current/Node-floor consumers | Preserve the contract until an explicitly authorized release decision | Any compatibility-impacting change reruns package, compatibility, claims, and preflight evidence |
| Conformance tests | Durable first-class IR, edge, round-trip, source-identity, diagnostic, actual-program, parser-ownership, package, compatibility, language, and Clarity evidence is indexed and bundled | Expand only through accession/evidence policy | `npm run denali:rc:preflight` reproduces the complete local RC bundle |
| Compatibility rules | Current-host compatibility matrix binds package, Node floor, release IR/schema, 17 native lanes/317 fixtures, examples, manifests, docs, and setup notes with zero `OPEN`/`FAIL` required | Add other hosts only as separately evidenced accession routes | Compatibility-impacting changes require migration notes and release checklist updates |
| Certification-grade evidence | Deterministic local bundle and fail-closed release policy exist | Cross-platform and independent certification remain later horizons | Evidence can be replayed from a preserved source state with environment/runtime versions; external certification remains unclaimed |

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

5. Bidirectionality layer map and Lua structural reparse seed: SEALED
   - `tests/roundtrip/manifest.json` now records JS/.ls/Python/Lua layers for native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, structural IR reparse, normalized source identity, token identity, and semantic equivalence.
   - `tests/roundtrip/roundtrip_probe.test.js` validates that every mapped language names each layer, evidence, and boundaries.
   - `artifacts/conformance/roundtrip-probe-report.json` writes the layer map and 7-fixture result; current manifest hash is `1b4aca945d2b4fd7daccdc34aea4d6a7e53fe9bf5c7d24159c6253001531cff1`.
   - `lua_to_lua_structural_ir` proves normalized current-bridge Program-IR parity for one tiny Lua fixture; its fixture hash is `15ca8a23dc6c505b1d79f098a4bc727b71b74368e0b42a5d84d7dc09d5aa3649`.
   - `tests/roundtrip/source_identity_manifest.json` records the `.ls` source-identity contribution separately: normalized source/AST/IR identity proven for 12 positives, token identity measured but non-gating, runtime-output and semantic equivalence not claimed by that harness.
   - `artifacts/conformance/source-identity-probe-report.json` current manifest hash is `0280f940b1004e9e2602217ddd6135e5dd3a28a27152c8eb547c1666498c9272`.
   - `tests/language_completion/bidirectional_harness.js` now strips only preserved top-level `.ls` `verify { ... }` blocks before embedded `ls_contains` / `ls_not_contains` self-verification assertions, so verify-block source identity and emitted policy checks can coexist.
   - Boundary: JavaScript, Python, and Lua source identity remain unclaimed; Lua token/comment/format identity remains unclaimed; semantic equivalence remains partial fixture stdout/diagnostic evidence only.

6. Versioned one-way release-IR transition: SEALED for the internal Denali RC surface choice; OPEN for wider semantics.
   - [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md) chooses legacy Program IR `v0`, canonical artifact `1.0.0`, and transition contract `1.0.0-rc.1`.
   - `npm run test:schema-artifact-map` derives schema-valid canonical artifacts for 21/21 positive conformance fixtures, passes 168/168 base invariants and 147/147 release-contract checks, and keeps 11 expected diagnostics separate.
   - Report path: `artifacts/conformance/schema-artifact-mapping-report.json`.
   - `npm run test:ir-compatibility-bridge` validates latest/pinned/`1.x` schemas, 21/21 mappings, 168/168 base invariants, 10/10 static contract rules, 147/147 mapping-contract rules, 21/21 deterministic artifacts, 1/1 supplemental DoWhile shape proof, 12/12 malformed-shape negatives, and 5/5 malformed-source rejections.
   - Bridge report path: `artifacts/conformance/dual-surface-compatibility-bridge-report.json`.
   - Current manifest SHA-256: `0f551a2076df5e6a6319dcab93600bff73213476351a3fd63ea732a5a597b780`.
   - Current schema SHA-256: `78f8cb23636bd10d807168dbb06a26da26cf8908a62a66873d91474d843703ff`.
   - Declared compatibility encodings include `VariableDeclarator->VariableDeclaration`, `Parameter->Identifier`, `UnaryExpression->BinaryExpression`, and `SwitchCase->BlockStatement`.
   - Boundary: the surface choice is internal and one-way; it does not make the bridge public API, change compiler output, provide reverse conversion, prove broad semantics/source preservation, promote canonical `1.0`, or claim true omni-language 100%.

7. Public API/runtime freeze candidate: SEALED for the no-release candidate; release authorization remains OPEN.
   - Current candidate explicitly preserves no npm `bin`, no package `exports` map, root package import through `src/unified_luascript.js`, and package files `src/`, `test/`, `examples/package/`, `README.md`, and `LICENSE`.
   - Consumer Node floor is `>=14.17.0`, aligned with exact runtime `typescript@5.9.3`; installed-package import/transpile proof includes Node `14.17.1`.
   - `npm run test:package-contract` packs and clean-installs the actual tarball, freezes the exact six root exports and facade inventory, proves version/`enableAll` behavior, rejects package debris, and writes `artifacts/conformance/public-api-runtime-package-report.json`.
   - Root-level `runtime/` is explicitly excluded; the deep legacy/Python tools that expect it remain non-public.
   - [LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md](LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md) and the unreleased changelog section record consumer impact without sealing a release.
   - Release, changelog, artifact-signing, tag, publish, and version-bump scripts remain explicit release actions.
   - Package version remains `0.1.0-beta.0` until explicit release action.

8. Conformance evidence bundle and release policy: SEALED for the scoped local RC.
   - `docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md` is active.
   - It references language, required/informational Clarity, IR conformance, round-trip, source identity, unsupported diagnostics, edge matrix, actual programs, parser ownership, package, compatibility, support matrix, and exact reproduction evidence.
   - `npm run denali:rc:preflight` runs 26 fail-closed steps and writes the deterministic bundle last through `--require-ready`.
   - Boundary: this is certification-style evidence navigation, not ISO certification, third-party certification, production certification, canonical `1.0`, a package release, or true omni-language 100%.

## Loose-End Closure Pass

2026-07-29 status: 100% of started post-beta/Denali/Big Remaining Climb routes in this ledger are sealed at their scoped route level. The unsealed items below are explicitly future routes, not abandoned started work.

Started routes sealed so far:

- scoped beta handoff and strict-native closure for named slices;
- durable conformance reports;
- 25-case edge matrix;
- 15-fixture `.ls` source identity suite;
- normalized parser-owned AST identity for the 12 positive `.ls` source identity fixtures;
- canonical IR semantics v1 evidence mapping for the current 32 conformance fixtures;
- JS/.ls/Python/Lua bidirectionality layer map;
- one tiny Lua -> Lua normalized Program-IR structural reparse fixture;
- versioned one-way release-IR surface contract with pinned-schema parity and fail-closed compatibility evidence;
- unsupported diagnostics catalog at 21 named diagnostics;
- no-release public API/runtime freeze candidate;
- release-shaped conformance evidence bundle index;
- schema-v2 provenance for 26 language report pairs/424 fixtures;
- first-class actual-program and parser-ownership reports;
- current-host compatibility matrix for 17 native lanes/317 fixtures;
- deterministic 46-entry release evidence bundle with required/informational policy;
- authoritative 26-step fail-closed RC preflight;
- repaired release readiness, SemVer prerelease, and commit-before-tag safeguards;
- Denali release-candidate audit and handoff verdict.

Post-RC routes intentionally not promoted:

- explicit operator-authorized version, changelog, commit, tag, publish, GitHub release, push, pull request, signing, or artifact-upload actions;
- Linux, macOS, other-architecture, and additional toolchain compatibility accession;
- broader language depth, reverse canonical-artifact conversion, lossless all-language recovery, and broad semantic-equivalence evidence;
- independent/third-party certification and the true omni-language horizon.

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
   - Derived schema-valid artifacts and internal bridge invariants are now proven for the current positive conformance fixtures.
   - Remaining IR blockers are helper versioning, complete target deltas, wider original-kind policies, release invariant policy, and broader value/error edge semantics.

4. Lua structural IR reparse seed: SEALED.
   - `lua_to_lua_structural_ir` proves one tiny Lua source -> current bridge Program IR -> emitted Lua -> reparsed Program IR path.
   - Same-language normalization preserves and compares metadata, removing only source locations, raw literal fields, and generated IDs before equality.
   - Source-text identity, token/comment/format preservation, broad Lua coverage, and broad semantic equivalence remain unclaimed.

5. Versioned one-way release IR surface contract: SEALED for the internal Denali RC choice.
   - Legacy Program IR `v0` remains operational; canonical artifact `1.0.0` is the evidence/serialization projection; removal cannot precede package `2.0.0` plus migration evidence and operator authorization.

6. Freeze the public API/runtime candidate: SEALED for no-release candidate; release authorization OPEN.
   - Current candidate chooses no-bin/no-exports, root package import only, Node floor `>=14.17.0`, exact runtime TypeScript `5.9.3`, `src/`, `test/`, `examples/package/`, `README.md`, and `LICENSE`, explicit root `runtime/` exclusion, semver/compatibility/migration policy, and release-action separation.
   - The real tarball, clean install, exact root surface, both executable package examples, current Node, and Node `14.17.1` are tested. A tag, publish, changelog seal, or version bump remains a separate authorized action.

7. Build the conformance evidence bundle and policy: SEALED for scoped local RC.
   - [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) cross-links the live deterministic artifact, 42 required entries, 4 informational entries, language/Clarity/IR/edge/identity/diagnostic/actual/parser/package/compatibility reports, boundaries, and reproduction.
   - `npm run denali:rc:preflight` is authoritative; its last step runs the evidence generator with `--require-ready`.

8. Denali release-candidate audit: SEALED for the scoped local RC; release action OPEN.
   - [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md) preserves the historical 2026-07-16 audit and adds the 2026-07-29 closure audit.
   - Current verdict: the scoped local/current-host Denali candidate is reproducible and ready for operator review; true omni-language completion remains far beyond this route.
   - The exact remaining boundary is authorization plus explicitly excluded platform/semantic horizons, not an unfinished compatibility/evidence implementation bearing.

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
| `npm run test:schema-artifact-map` | `artifacts/conformance/schema-artifact-mapping-report.json` |
| `npm run test:ir-compatibility-bridge` | `artifacts/conformance/dual-surface-compatibility-bridge-report.json` |
| `npm run test:package-contract` | `artifacts/conformance/public-api-runtime-package-report.json` |
| `npm run test:roundtrip-probe` | `artifacts/conformance/roundtrip-probe-report.json` |
| `npm run test:source-identity-probe` | `artifacts/conformance/source-identity-probe-report.json` |
| `npm run test:unsupported-diagnostics` | `artifacts/conformance/unsupported-diagnostics-report.json` |

Second route seal (historical state at that point): [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) became the release-shaped navigation layer before the later generated bundle/report work closed those gaps.

RC route seal: the 2026-07-16 Denali release-candidate audit is SEALED for verdict and OPEN for release closure. It updates the estimates to Denali canonical `1.0` 78% done / 22% remaining and true omni-language 100% 7% done / 93% remaining, and it keeps scoped beta, Denali `1.0`, and the true omni-language summit separate.

That historical next route is superseded by the 2026-07-29 Denali Local Release Candidate Evidence Seal below.

## 2026-07-29 Lua Structural IR Reparse Route Seal

Intent:

- Add the smallest honest new Lua bidirectionality proof without changing compiler behavior.
- Keep structural IR parity separate from source identity, token/comment/format preservation, runtime equivalence, and broad semantics.

Evidence:

- `tests/roundtrip/manifest.json` adds `lua_to_lua_structural_ir`.
- Exact source: `local total = 2 + 3` followed by `print("rt_lua", total)`.
- Emitted Lua reparses to normalized current-bridge Program IR equal to the original normalized Program IR.
- `npm run test:roundtrip-probe` advances from 6/6 with 4 structural and 2 runtime checks to 7/7 with 5 structural and 2 runtime checks.
- Source-preserving round-trip count remains 0.
- Manifest SHA-256 advances from `c7f9b561e5e891773e4d32e2900204c568d4c764b399f6d6f4841d7184dbe096` to `1b4aca945d2b4fd7daccdc34aea4d6a7e53fe9bf5c7d24159c6253001531cff1`.
- New Lua fixture SHA-256: `15ca8a23dc6c505b1d79f098a4bc727b71b74368e0b42a5d84d7dc09d5aa3649`.

Boundary:

- No compiler or runtime implementation changed.
- Lua normalized source identity, token identity, comment/format preservation, broad round-trip coverage, and broad semantic equivalence remain unclaimed.
- Package version remains `0.1.0-beta.0`; no tag, publish, release, package `bin`/`exports`, or public API change occurred.

Next route:

- Formalize and version the release IR surface and its compatibility/migration contract.

## 2026-07-29 Versioned One-Way Release IR Surface Route Seal

Intent:

- Choose the safest Denali release-IR transition from live compiler, emitter, schema, package, and conformance evidence.
- Preserve the working operational Program IR while making the canonical schema projection versioned, validated, deterministic, and auditable.

Sealed contract:

- Contract `1.0.0-rc.1` defines legacy Program IR `v0` as operational/emission authority and canonical artifact `1.0.0` as the derived evidence/serialization projection.
- The route is one-way legacy -> canonical; there is no canonical -> legacy conversion or lossless/semantic-equivalence claim.
- Kind aliases are `Parameter -> Identifier`, `VariableDeclarator -> VariableDeclaration`, `SwitchCase -> BlockStatement`, and `UnaryExpression -> BinaryExpression`.
- Field aliases are `varKind -> declarationKind`, `parameters -> params`, `value -> argument`, `condition -> test`, `operand -> argument`, and `args -> arguments`.
- Legacy Program IR remains supported through package `1.x`; removal cannot precede package `2.0.0`, equivalent canonical-emitter evidence, migration notice, and explicit operator authorization.

Implementation and evidence:

- Added a deep-frozen machine contract and original-kind-aware fail-closed validation.
- Corrected `ConditionalExpression.condition -> test`, closing a real dropped-field defect in the derived projection.
- The pinned `1.0.0` schema received a pre-release RC correction and is semantically equal to the current schema except for `$id`; the `1.x` resolver still targets that pinned snapshot.
- Conformance manifest SHA-256: `0f551a2076df5e6a6319dcab93600bff73213476351a3fd63ea732a5a597b780`.
- Current/pinned/resolver schema SHA-256 values are `78f8cb23636bd10d807168dbb06a26da26cf8908a62a66873d91474d843703ff`, `55777393b5adb3902605f5f5f1fefc02a3553e5ae43c3dcd7688d177e925a740`, and `e9579c2b1cd4da6a8f3d35fa40b8c27c2df2b43cedf35b89abfc1d4cdb58b73c`.
- Schema mapping proof: 21/21 positives, 11 expected diagnostics, 168/168 base invariants, and 147/147 release-contract checks.
- Dual-surface proof: 21/21 positives, 11 expected diagnostics, 168/168 base invariants, 10/10 static contract checks, 147/147 mapping-contract checks, 21/21 deterministic artifacts, 1/1 supplemental DoWhile shape proof, 12/12 malformed-shape negatives, and 5/5 malformed-source rejections.
- `npm run claims:check` passes 2902 checks; `npm run status:check` passes with 0 errors and 0 warnings; `npm run verify` passes all requested suites.

Boundary:

- The contract remains internal-only; package-root exports, compiler/emitter inputs, transpilation result shapes, package `bin`, and package `exports` are unchanged.
- The alias map is a versioned compatibility encoding, not broad semantic equivalence.
- Current fixture-shape proof is not a general canonical-IR authoring validator.
- Package version remains `0.1.0-beta.0`; no version bump, tag, publish, release, commit, push, or PR occurred.

Next route:

- Freeze and test the public API/runtime/package boundary while keeping the chosen internal IR bridge out of root exports.
- Prove root import compatibility, Node-floor behavior, package contents/runtime helpers, installed-package behavior, migration/changelog policy, and explicit no-release separation.

## 2026-07-29 Tested Public API Runtime Package Route Seal

Intent:

- Replace the documentation-only package candidate with a real tarball, clean consumer, exact root API, and Node-floor proof.
- Preserve the package version and avoid every release action.

Sealed candidate:

- Package remains `luascript@0.1.0-beta.0`, main `src/unified_luascript.js`, with exactly six root exports, no npm `bin`, and no package `exports`.
- Consumer floor is `>=14.17.0`, aligned with exact runtime `typescript@5.9.3`; the executable installed-package floor probe is Node `14.17.1`.
- Root-level `runtime/` is deliberately excluded. Deep legacy/Python tools that expect it remain non-public.
- Existing package `files` stay `src/`, `test/`, `README.md`, and `LICENSE`; nested npm hygiene removes Python bytecode/cache, backups, nested source tests, and prompt debris.
- `enableAll: false` disables every component, and status version equals the installed package version.
- Migration impact is recorded in [LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md](LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md) and the unreleased changelog section.

Evidence:

- Package report: PASS: 30/30 checks, 0 failures, actual tarball plus clean consumer.
- Tarball: 395 files, SHA-256 `fa7ed04d15a97079346068f239aee16c0d433d4fcd2ceabd24cc17edd5ade827`, sorted-path SHA-256 `9810e6a48ce7d4f2c7435e73ee1227ab2763d9654bae3c4f257468e22866e010`.
- Installed consumer: exact six exports, TypeScript `5.9.3`, and JS-to-Lua `local answer = (6 * 7)`.
- Node floor: Node `v14.17.1` repeats the exact root export and transpile smoke.
- Focused build, core bridge, TypeScript 11/11, status, archive, release-IR bridge, and package gates pass.
- `npm run claims:check` passes 2939 checks.

Boundary:

- Tested no-release package candidate only; final `1.0` authorization remains open.
- Node-floor consumer proof is not a Node 14 development-suite claim.
- No version bump, tag, publish, GitHub release, changelog seal, commit, push, PR, package `bin`, package `exports`, release-IR promotion, or broad support promotion occurred.

Next route:

- Seal the compatibility matrix and deterministic release evidence bundle.
- Repair release-tooling preflight defects without performing a release action.

### 2026-07-29 - Denali Local Release Candidate Evidence Seal

Intent:

- Close the scoped Big Remaining Climb route without converting narrow evidence into universal claims.
- Make the candidate reproducible through one fail-closed command and one deterministic, hash-bound release evidence artifact.
- Stop before every versioning, source-control, registry, and public-release action.

Sealed route:

- Language evidence schema v2 binds all 26 report pairs and 424 manifest fixtures to live manifest/fixture/source hashes, loaded implementation hashes, successful runtime probes, environment metadata, and governing-document hashes.
- The current-host compatibility surface binds 17 native lanes and 317 fixtures to exact tool versions, package/dependency truth, release-IR reports, manifests, docs, setup notes, and explicit platform exclusions.
- The package contract clean-installs the real tarball, protects the six-name root API, no-`bin`/no-`exports` stance, Node `>=14.17.0`, exact runtime dependencies, and exactly two shipped `examples/package/` programs.
- Repository-local behavior is first-class but not promoted to package compatibility: actual programs report 55/55 with 37 positive runtime, 6 expected compile diagnostics, and 12 expected runtime diagnostics; parser ownership reports 35/35 with 21 static, 13 runtime, and 1 completion assertion.
- The release-IR surface remains contract `1.0.0-rc.1`: operational Program IR `v0` plus one-way canonical artifact `1.0.0`, internal-only, with no reverse-conversion or lossless-equivalence claim.
- Required Clarity reports are release-blocking and freshness-checked; fast, heavy, legacy, and setup-blocked variants remain inventoried informational evidence.
- `npm run denali:rc:preflight` owns the exact 26-step order. It regenerates producers before consumers, runs compatibility after its inputs, and ends with `npm run evidence:release`.
- `npm run evidence:release` invokes the bundle generator with `--require-ready`; missing, stale, failing, malformed, or unbound required evidence exits nonzero.
- Release tooling delegates readiness only to the authoritative preflight, rejects `--force`, supports the live SemVer prerelease shape, and cannot tag before the exact intended package version exists at `HEAD`.

Release-candidate boundary:

- Scoped local/current-host Denali evidence only; not universal semantics, lossless all-language recovery, cross-platform certification, ISO certification, third-party certification, or true omni-language completion.
- Package identity remains `luascript@0.1.0-beta.0`.
- No version bump, changelog seal, commit, tag, publish, GitHub release, push, pull request, artifact upload, package `bin`, or package `exports` action occurred.

Authoritative verification:

- `npm run denali:rc:preflight` is the complete release-candidate gate.
- Its final artifact is `artifacts/release_evidence/denali-release-evidence-bundle.json`; readiness requires `releaseReady: true` and zero release blockers.
- `npm run denali:rc:preflight:list` is the non-mutating policy inspection command.

Denali 1.0 release candidate ready; awaiting explicit operator authorization to version, tag, publish, or release.
