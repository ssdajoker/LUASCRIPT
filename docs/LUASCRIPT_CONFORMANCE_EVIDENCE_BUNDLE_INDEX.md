# LUASCRIPT Conformance Evidence Bundle Index

Status: active evidence bundle index
Last updated: 2026-07-27
Track: Denali canonical `1.0` evidence structure

This is a release-shaped conformance evidence bundle index for LUASCRIPT. It is certification-style evidence, not certification: it is not ISO certification, third-party certification, production certification, a release artifact, a package publish, canonical `1.0`, or the user's true omni-language 100% summit.

The index cross-links the current report-producing gates, manifest evidence, support boundaries, compatibility policy, and reproducibility steps. It does not promote any language, runtime, profile, package surface, or source-preservation claim by itself.

Coverage lanes: beta gates, language gates, Clarity dogfood/canon/super-canon evidence, IR conformance, schema artifact mapping, edge matrix, round-trip probe, source identity probe, unsupported diagnostics, actual programs, support matrix, compatibility policy, report paths, fixture/hash expectations, known unsupported areas, and reproducibility steps.

## Evidence Boundary

- Scoped beta, Denali canonical `1.0`, and true omni-language 100% remain separate.
- A support claim is current only when the support matrix, manifest, report, docs, and claims checks agree.
- Report evidence applies only to named fixtures or cases in the current manifests.
- Fixture/hash expectations mean report-level manifest hashes, fixture or case hashes, pass/fail summaries, environment metadata, and support-matrix traceability where the harness currently writes them.
- Report paths under `artifacts/` are generated local evidence and must be refreshed before any release decision.
- No version bump, tag, publish, GitHub release, changelog seal, artifact signing, compiler API change, runtime API change, package `bin`, or package `exports` map change is implied by this index.

## Bundle Inventory

| Evidence lane | Command or source | Report path | Manifest / fixture source | Fixture/hash expectation | Support traceability and boundary |
| --- | --- | --- | --- | --- | --- |
| Scoped beta gates | `npm run beta:readiness`, `npm run beta:readiness:strict`, `npm run beta:preflight`, `npm run beta:full` | `artifacts/beta_readiness.json`, `artifacts/beta_gates/preflight-report.json`, `artifacts/beta_gates/full-report.json` | `scripts/beta_readiness.js`, `scripts/beta_gate_runner.js`, language manifests | Reports capture generated time and gate summaries; beta readiness links per-lane language reports | Scoped beta evidence only; not canonical `1.0`, not broad production readiness |
| Language gates | `npm run language:implemented:bidirectional`, `npm run language:all:bidirectional`, `npm run language:<name>:bidirectional`, `npm run language:<name>:ir-targets` | `artifacts/language_completion/*-report.json` | `tests/language_completion/manifests/*.json`, `tests/language_completion/fixtures/**`, `tests/language_completion/bidirectional_harness.js` | Current reports are per-manifest gate evidence; release bundle should preserve manifest and fixture hashes before promotion | Trace through `docs/LANGUAGE_SUPPORT_MATRIX.md` and `docs/LANGUAGE_COMPLETION_RULES.md`; named slices only |
| Clarity dogfood and canon | `npm run clarity:dogfood`, `npm run clarity:canon`, `npm run clarity:canon:super`, `npm run clarity:languages` | `artifacts/clarity_canon/dogfood-report.json`, `artifacts/clarity_canon/canon-report.json`, `artifacts/clarity_canon/canon-super-report.json`, `artifacts/clarity_canon/canon-languages-report.json` | `tests/clarity_canon/manifest.json`, `tests/clarity_canon/language_qualification_manifest.json`, dogfood fixtures, actual programs, canon shards | Reports capture generated time and pass/fail summaries; future release bundle should add manifest hash coverage for every clarity shard | Dogfood/canon evidence is scoped to active manifests and reports; archived canon docs remain historical only |
| Canonical IR conformance | `npm run test:ir-conformance` | `artifacts/conformance/canonical-ir-conformance-report.json` | `tests/conformance/manifest.json`, `tests/conformance/canonical_ir_conformance.test.js` | Current report writes environment metadata, manifest hash, 32 fixture hashes, pass/fail summaries, and support-matrix traceability | 32 fixtures mapped to named IR semantic rules or documented gaps; not a schema-valid release IR surface by itself |
| Schema artifact mapping | `npm run test:schema-artifact-map` | `artifacts/conformance/schema-artifact-mapping-report.json` | `tests/conformance/manifest.json`, `tests/conformance/schema_artifact_mapping.test.js`, `docs/canonical_ir.schema.json` | Current report writes environment metadata, manifest hash, schema hash, 32 fixture hashes, 21 derived artifact hashes, pass/fail summaries, and alias gap counts | Dual-surface transition evidence; not release IR surface selection, not compiler-output change |
| Edge-case matrix | `npm run test:edge-matrix` | `artifacts/edge_matrix/edge-case-matrix-report.json` | `tests/edge_matrix/manifest.json`, `tests/edge_matrix/edge_case_matrix.test.js` | Current report writes environment metadata, manifest hash, 25 case hashes, category counts, pass/fail summaries, and support-matrix traceability | Scoped value/control/scope/data/errors/target-specific/unsupported-diagnostic matrix; not exhaustive edge coverage |
| Round-trip probe | `npm run test:roundtrip-probe` | `artifacts/conformance/roundtrip-probe-report.json` | `tests/roundtrip/manifest.json`, `tests/roundtrip/roundtrip_probe.test.js` | Current report writes environment metadata, manifest hash, 6 fixture hashes, pass/fail summaries, layer evidence, and support-matrix traceability | Structural IR reparse and runtime-output equivalence only; source-preserving round-trip count remains 0 |
| Source identity probe | `npm run test:source-identity-probe` | `artifacts/conformance/source-identity-probe-report.json` | `tests/roundtrip/source_identity_manifest.json`, `tests/roundtrip/source_identity_probe.test.js`, `tests/roundtrip/fixtures/**` | Current report writes environment metadata, manifest hash, 15 fixture hashes, tier counts, pass/fail summaries, token observations, and support-matrix traceability | 12 positive `.ls` normalized source/parser-owned-AST/IR identity checks plus 3 expected diagnostics; token identity is measured but non-gating |
| Unsupported diagnostics | `npm run test:unsupported-diagnostics` | `artifacts/conformance/unsupported-diagnostics-report.json` | `tests/ir/unsupported_diagnostics.test.js`, stable active compiler diagnostics | Current report writes environment metadata, 21 case hashes, pass/fail summaries, diagnostic categories, and support-matrix traceability | Named current unsupported catalog only; unsupported behavior is fail-closed evidence, not implementation support |
| Actual programs and active examples | `npm run test:actual-programs`, `npm run test:luascript-meta`, `npm run test:lua-input`, `npm run test:parser-ownership` | No single durable bundle report yet; dogfood report includes actual-program evidence | `tests/actual_programs/manifest.json`, `tests/lua_input/manifest.json`, `tests/language_completion/fixtures/luascript/**`, `examples/**` | Current evidence is manifest/test output plus dogfood report; future release bundle should add first-class report hashes for actual-program and parser-ownership gates | Current executable examples only; broad demos and unsupported profiles cannot promote support |
| Support matrix | `docs/LANGUAGE_SUPPORT_MATRIX.md`, `docs/LANGUAGE_COMPLETION_RULES.md`, `npm run claims:check` | No JSON report; guarded by `claims:check` output | Active docs, language manifests, report paths, accession rules | Claims check guards exact wording and report references; release bundle should snapshot the exact source state | Support rows broaden only through accession rules and Denali ledger evidence |
| Compatibility policy | `docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md`, `docs/VERSIONING.md`, `package.json`, `README.md`, `PROJECT_STATUS.md` | No JSON report; guarded by `status:check` and `claims:check` | Package metadata, root exports, Node floor, package files, semver/versioning docs | Package version no-bump check confirms `0.1.0-beta.0`; release bundle should capture `node -v`, `npm -v`, OS, native runtime versions, and package metadata | No-release freeze candidate only; final `1.0` public API/runtime freeze remains open |
| Reproducibility | Commands in this document and `docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md` | Durable reports above | Preserved source state, package lock, manifests, docs, and generated reports | Minimum current bundle needs environment metadata, manifest hashes, fixture/case hashes, pass/fail summaries, and support-matrix traceability for report-producing gates | A passing local reproduction proves named slices only; not certification or true omni-language completion |

## Required Report Fields

Durable report-producing conformance lanes should carry:

- environment metadata: Node, npm, OS/platform/arch, cwd, and generating harness;
- manifest hash when a manifest owns the fixture list;
- fixture hashes or case hashes for every executed item;
- pass/fail summaries with total, passed, and failed counts;
- diagnostic or tier summaries where the suite distinguishes positive, expected-unsupported, token-observation, or runtime-error checks;
- support-matrix traceability naming the support matrix, evidence binder, exit criteria, bidirectionality contract, Denali ledger, support rows, evidence role, and boundary.

Current lanes already satisfying this shape:

- `artifacts/conformance/canonical-ir-conformance-report.json`;
- `artifacts/conformance/schema-artifact-mapping-report.json`;
- `artifacts/edge_matrix/edge-case-matrix-report.json`;
- `artifacts/conformance/roundtrip-probe-report.json`;
- `artifacts/conformance/source-identity-probe-report.json`;
- `artifacts/conformance/unsupported-diagnostics-report.json`.

Current lanes still needing first-class bundle hash/report expansion before a release-candidate evidence seal:

- clarity dogfood/canon/super-canon/languages reports;
- per-language completion reports;
- actual-program, `.ls` meta, Lua input, and parser-ownership gates;
- compatibility and package-surface checks;
- native runtime version capture for every strict-native language gate.

## Known Unsupported Areas

Known unsupported or not-yet-release-sealed areas include:

- broad full-language support beyond named manifest slices;
- true omni-language universal IR coverage;
- ISO, third-party, or production certification;
- release IR surface selection beyond the current derived schema-valid conformance artifact mapping;
- token-level source identity as a gating claim;
- broad parser-owned AST identity beyond the 12 positive `.ls` fixtures;
- broad lossless source recovery;
- broad semantic equivalence beyond named runtime-output fixtures;
- exhaustive edge-case coverage beyond the 25-case matrix;
- full unsupported-feature catalog beyond the 21 named diagnostics;
- cross-platform CI evidence with preserved native runtime versions;
- final package `bin`, package `exports`, package file surface, and runtime-helper release decisions.

Unsupported features must remain explicit expected diagnostics or documented exclusions. They must not be counted as implementation support, semantic equivalence, source identity, or canonical `1.0` completion.

## Bundle Reproduction Steps

Baseline release-shaped evidence reproduction:

```bash
npm install
npm run test:ir-conformance
npm run test:schema-artifact-map
npm run test:edge-matrix
npm run test:roundtrip-probe
npm run test:source-identity-probe
npm run test:unsupported-diagnostics
npm run test:actual-programs
npm run test:luascript-meta
npm run test:lua-input
npm run test:parser-ownership
npm run status:check
npm run claims:check
npm run stubs:check
npm run archive:audit
node -e "const pkg=require('./package.json'); if (pkg.version !== '0.1.0-beta.0') process.exit(1); console.log(pkg.version)"
```

Release-candidate expansion, only when a release decision is explicitly requested:

```bash
npm run beta:readiness
npm run beta:readiness:strict
npm run beta:preflight
npm run beta:full
npm run language:implemented:bidirectional
npm run language:all:bidirectional
npm run clarity:dogfood
npm run clarity:canon
npm run clarity:canon:super
npm run clarity:languages
npm run verify
npm test
```

After reproduction, compare this index, [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md), [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md), [LANGUAGE_SUPPORT_MATRIX.md](LANGUAGE_SUPPORT_MATRIX.md), [LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md), and [LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md). Any disagreement is evidence drift.

## Next Evidence Route

The bundle index is now the evidence navigation layer. The next executable climb remains one of:

- add a real new bidirectionality proof layer, preferably Lua structural IR reparse;
- choose the final release IR surface or formalize the dual-surface compatibility bridge;
- add first-class report hashes for clarity, language, actual-program, parser-ownership, and compatibility gates.

Do not broaden claims while doing those routes. The index should become denser, not louder.
