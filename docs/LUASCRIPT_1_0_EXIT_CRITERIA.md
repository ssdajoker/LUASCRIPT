# LUASCRIPT Canonical 1.0 Exit Criteria Charter

Status: active charter
Last updated: 2026-07-16
Track: Denali canonical `1.0`

This charter defines the measurable exit criteria for canonical LUASCRIPT `1.0`. It separates three different summits:

- Scoped beta v0.1: a useful, non-strict pre-production beta handoff for named slices.
- Denali canonical `1.0`: a stable language/toolchain release where named support claims, runtime behavior, examples, docs, package expectations, and gates agree.
- True omni-language 100%: the larger universal-IR, bidirectional, edge-case-exhaustive, certification-grade vision. This is not the Denali `1.0` release target.

No criterion here promotes broad language support by implication. A feature, language, runtime, profile, or example is supported only when the support matrix, manifests, docs, runtime behavior, and current gates agree.

## Exit Status Vocabulary

- `MET`: current live evidence satisfies the criterion.
- `OPEN`: current live evidence is incomplete, too narrow, or not yet formalized enough.
- `BLOCKED`: required runtime, fixture family, spec section, or compatibility decision is absent.
- `EXCLUDED`: intentionally outside Denali `1.0`; it can become a later accession route.

Status must be updated only from current repo evidence, not archived reports.

## Summit Separation

| Summit | What it means | Required evidence | Current charter status |
| --- | --- | --- | --- |
| Scoped beta v0.1 | Named implemented lanes pass scoped beta gates above the beta threshold | `npm run beta:readiness`, `npm run beta:preflight`, `npm run beta:full`, beta handoff docs | `MET` for the documented beta handoff |
| Denali canonical `1.0` | Stable `.ls` identity, formalized IR contract, named support boundaries, conformance evidence, package/runtime expectations, compatibility rules, and active docs agree | This charter plus language gates, IR validation, conformance reports, [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md), compatibility docs, claims checks, and release notes | `OPEN` |
| True omni-language 100% | Universal bidirectional IR across arbitrary languages, exhaustive edge cases, certification-grade evidence, and external-quality conformance expectations | Formal semantics, massive language-depth matrices, broad bidirectionality proofs, compatibility suites, and independent certification-grade evidence | `EXCLUDED` from Denali `1.0` |

## Denali 1.0 Required Criteria

| ID | Criterion | Measurable exit condition | Required gates/evidence | Current status |
| --- | --- | --- | --- | --- |
| `1.0-IDENTITY` | Stable `.ls` language identity | The `.ls` spec names supported syntax, profile names, default profile behavior, repair blocks, verify blocks, unsupported diagnostics, and examples; no doc claims unsupported profiles | `docs/LUASCRIPT_META_LANGUAGE_V0.md`, `docs/LUASCRIPT_LIVING_META_LANGUAGE.md`, `docs/LANGUAGE_SUPPORT_MATRIX.md`, `meta_identity_contract_portable_slice.ls`, `npm run language:luascript:bidirectional`, `npm run test:luascript-meta`, `npm run clarity:dogfood`, `npm run claims:check` | `OPEN` until identity is frozen for release |
| `1.0-IR-SEMANTICS` | Canonical IR semantics contract | IR spec defines node semantics, value model, control flow, errors/diagnostics, determinism, serialization, and target obligations for every `1.0` supported node | `docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md`, `docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md` v1 evidence map for all 32 current conformance fixtures, `docs/canonical_ir_spec.md`, `docs/VERSIONING.md`, schema files, IR validation gates, golden IR checks, conformance fixtures | `OPEN` |
| `1.0-BIDIRECTIONALITY` | Layered bidirectionality without overclaim | Every `1.0` supported language/profile has manifest-backed evidence for the layers named in [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md): native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls` if claimed, structural IR reparse status, normalized source identity status, token identity status, semantic equivalence status, and negative diagnostics | `npm run language:implemented:bidirectional`, per-language `language:<name>:bidirectional`, `npm run test:roundtrip-probe`, `npm run test:source-identity-probe`, manifest report totals matching fixture counts, [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md), `npm run beta:readiness:strict` | `OPEN` |
| `1.0-RUNTIME-GATES` | Runtime support is real, not assumed | Every native runtime claim has a real command, a passing native gate, timeout policy, report artifact, and setup note; setup-blocked lanes are excluded from `1.0` support | `npm run language:implemented:native`, `npm run language:all:bidirectional`, `npm run beta:readiness:strict`, language reports under `artifacts/language_completion/` | `OPEN` |
| `1.0-LANGUAGE-ACCESSION` | Language slice broadening follows a formal gate | Every promoted language-depth expansion has manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry marked `MET` or explicitly `EXCLUDED` with rationale | [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md), `docs/LANGUAGE_SUPPORT_MATRIX.md`, `docs/LANGUAGE_COMPLETION_RULES.md`, per-language manifests, `npm run claims:check`, `npm run archive:audit` | `MET` for the accession contract, `OPEN` for future language-depth promotions |
| `1.0-EXAMPLES` | Examples stay inside named support | Every first-party `1.0` example is listed in docs or manifests, has expected output/diagnostic evidence, and is not a broad demo masquerading as support | `npm run test:actual-programs`, examples integration, clarity dogfood, `npm run claims:check` | `OPEN` |
| `1.0-DOCS` | Active docs and archive boundary are sealed | README, `PROJECT_STATUS.md`, docs index, support matrix, completion rules, reference, architecture, and this charter agree; archive docs remain evidence only | `npm run status:check`, `npm run claims:check`, `npm run stubs:check`, `npm run archive:audit` | `MET` for the active-docs map, `OPEN` for final release docs |
| `1.0-PUBLIC-API-RUNTIME` | Public API and runtime contract is explicit | Package entrypoints, root exports, CLI/API surface, Node floor, runtime files, npm scripts, package files, semver policy, compatibility policy, and release-action boundaries are written and checked | [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md), `package.json`, `README.md`, `PROJECT_STATUS.md`, `npm run claims:check`, `npm run status:check` | `OPEN` until the contract is frozen for release |
| `1.0-COMPATIBILITY` | Package/runtime compatibility is explicit | Node floor, package entrypoint, package file surface, CLI/runtime expectations, native tool expectations, semver policy, changelog, and migration notes are written and checked | [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md), `package.json`, `docs/reference/README.md`, `docs/VERSIONING.md`, release notes/changelog, `npm run claims:check` | `OPEN` |
| `1.0-CONFORMANCE` | Conformance evidence exists as a release artifact | A conformance-style suite names required positive, negative, edge-case, runtime, and compatibility cases for each supported slice, writes reports, and blocks release on drift | [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md), `npm run test:ir-conformance`, `artifacts/conformance/canonical-ir-conformance-report.json`, `npm run test:roundtrip-probe`, `artifacts/conformance/roundtrip-probe-report.json`, `npm run test:source-identity-probe`, `artifacts/conformance/source-identity-probe-report.json`, `npm run test:unsupported-diagnostics`, `artifacts/conformance/unsupported-diagnostics-report.json`, value-semantics matrix, control-flow matrix including the JavaScript switch/conditional-expression branch-depth fixture and `try/catch` diagnostic, function/scope matrix, data-structure matrix, language manifests, actual-program fixtures, edge matrices, `npm run claims:check` | `OPEN` |
| `1.0-RELEASE-SEAL` | Release action is deliberate and gated | A tag, publish, GitHub release, or version bump occurs only after the above criteria are `MET` or explicitly `EXCLUDED` with rationale | Release checklist, changelog, package metadata, rerun beta/full/conformance gates | `OPEN`; no release action is part of this charter creation |

## 2026-07-16 Release-Candidate Audit

Release-candidate audit verdict: Denali canonical `1.0` is **78% done / 22% remaining**. The user's true omni-language 100% summit is **7% done / 93% remaining**. The Denali ledger cannot close as a canonical `1.0` release ledger yet; it must hand off to the Big Remaining Climb route for source-preserving proof layers, schema-valid IR surface reconciliation, final public API/runtime freeze, compatibility seal, and release-grade conformance expansion.

The audit marks a criterion `MET` only when current passing gates and stable active docs satisfy the criterion. Scoped local proof, partial evidence, and no-release candidates remain `OPEN` for `1.0` release closure.

| Criterion | RC status | Current proven evidence | Exact blocker before Denali `1.0` closure |
| --- | --- | --- | --- |
| `1.0-IDENTITY` | `OPEN` | `.ls` V0.16 identity docs, supported profile map, meta/repair/verify boundaries, and source-identity fixtures exist | Final release identity freeze still needs the full identity gate set, example classification, and no drift across README, support matrix, meta docs, and claims |
| `1.0-IR-SEMANTICS` | `OPEN` | `npm run test:ir-conformance` covers 32 fixtures and the v1 evidence map ties every fixture to a named rule or documented gap | Release IR surface remains undecided: schema-valid artifacts for every conformance fixture, dual-surface transition policy, helper versioning, and target delta tables remain open |
| `1.0-BIDIRECTIONALITY` | `OPEN` | `npm run test:roundtrip-probe` records 6 probes and JS/.ls/Python/Lua layer evidence; `npm run test:source-identity-probe` proves 12 positive normalized `.ls` source/parser-owned-AST/IR identity fixtures plus 3 expected diagnostics | Source-preserving round-trip count is still 0 for the round-trip probe, Lua structural IR reparse is unclaimed, token identity is non-gating, and broad semantic equivalence is unclaimed |
| `1.0-RUNTIME-GATES` | `OPEN` | Prior strict-native evidence closed the seven runtime-command blockers for named slices, and current package scripts expose strict runtime gates | A final release candidate must rerun `npm run beta:readiness:strict`, `npm run language:implemented:bidirectional`, and `npm run language:all:bidirectional` with runtime version capture and setup notes |
| `1.0-LANGUAGE-ACCESSION` | `MET` for accession contract, `OPEN` for future promotions | Accession rules, support matrix wording, language manifests, claims checks, and Denali route entries define the promotion gate | Future language-depth promotions remain route-by-route; no broad language support is promoted by the contract |
| `1.0-EXAMPLES` | `OPEN` | Actual-program, `.ls` meta, Lua input, parser ownership, and dogfood lanes are indexed by the evidence binder and bundle index | Final `1.0` needs first-class example classification, report hashes for actual-program/parser-ownership lanes, and release example support declarations |
| `1.0-DOCS` | `MET` for current active-doc integrity, `OPEN` for release docs | `status:check`, `claims:check`, `stubs:check`, and `archive:audit` are the active docs guardrails | Final release docs still need release notes, changelog seal, migration notes if any compatibility surface changes, and a final no-drift pass after all release freezes |
| `1.0-PUBLIC-API-RUNTIME` | `OPEN` | The no-release public API/runtime freeze candidate documents root entrypoint, no `bin`, no `exports`, Node floor, package files, semver, compatibility, and release-action boundaries | Final `1.0` API compatibility tests, package-file/runtime-helper inclusion decision, and explicit release freeze remain open |
| `1.0-COMPATIBILITY` | `OPEN` | Public API/runtime contract and versioning docs exist and are claim-checked | Compatibility matrix, migration-note/changelog policy, runtime-helper release surface, and release-package review are not sealed |
| `1.0-CONFORMANCE` | `OPEN` | Current report-producing gates cover IR conformance, 25 edge cases, 6 round-trip probes, 15 source-identity fixtures, and 21 unsupported diagnostics with report/hash expectations | One-command release bundle, cross-platform/runtime metadata, language/clarity/actual-program first-class hashes, compatibility reports, schema-valid IR artifacts, and release-blocking policy remain open |
| `1.0-RELEASE-SEAL` | `OPEN` | No version bump, tag, publish, package `bin`, package `exports`, compiler API change, or runtime API change occurred | Release action requires all in-scope criteria to become `MET` or explicitly `EXCLUDED`, then a deliberate version/tag/publish decision |

## Measurement Rules

1. Every `1.0` support claim must name a slice, profile, fixture set, gate, and doc location.
2. Every supported language must have a current support-matrix row and a current manifest-backed report.
3. Every native-runtime claim must use the actual runtime command through `language:<name>:bidirectional`.
4. Target-runtime IR lanes can prove emitted behavior for named slices, but they do not substitute for native qualification.
5. Every bidirectional claim must name which layer is proven: native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, structural IR reparse, normalized source identity, token identity, round-trip source identity, or semantic equivalence.
6. Every language slice broadening must pass [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md): manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry.
7. The first round-trip probe harness, `npm run test:roundtrip-probe`, can provide tiny structural IR reparse evidence, runtime-output equivalence evidence, and JS/.ls/Python/Lua layer accounting, but it does not by itself promote broad round-trip source identity.
8. The source identity harness, `npm run test:source-identity-probe`, currently proves normalized `.ls` source identity, normalized parser-owned AST identity, and normalized current bridge IR identity for 12 positive named fixtures and separately verifies 3 expected unsupported diagnostics. It does not prove token-level text identity, runtime-output equivalence, broad lossless source recovery, or broad semantic equivalence.
9. Round-trip source identity and semantic equivalence remain `OPEN` unless a current fixture explicitly proves the named slice.
10. Every unsupported feature that appears in a `1.0` boundary must have an explicit diagnostic fixture or a documented exclusion.
11. Every first-party example must be tied to a manifest, runtime gate, dogfood fixture, or actual-program test.
12. Every compatibility decision must name the package/runtime surface it protects: Node floor, package files, entrypoint, CLI behavior, runtime helpers, or native tool expectations.
13. Every public API/runtime decision must update [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md) and stay aligned with `package.json`.
14. Every conformance or certification-style claim must route through [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md) and remain explicit about current evidence gaps.
15. Every release-facing doc change must pass `status:check`, `claims:check`, `stubs:check`, and `archive:audit`.

## Blocking Conditions

Canonical `1.0` is blocked if any of these are true:

- A supported language lacks a current native or explicitly scoped runtime gate.
- A support-matrix claim is broader than its manifest fixtures.
- A doc claims broad multi-language support, full Unicode DSL support, full symbolic algebra, or omni-language conformance without current conformance evidence.
- A doc claims ISO certification, third-party certification, or certification-grade completeness while the evidence binder still marks current conformance as scoped.
- A release action is proposed while `claims:check`, `status:check`, `stubs:check`, `archive:audit`, beta gates, or required conformance gates are failing.
- A compatibility-impacting change lacks migration notes or package/runtime expectation updates.
- Public API, CLI, package file, or runtime claims broaden beyond [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md).
- Archived docs are used as current implementation truth.

## True Omni-Language 100% Horizon

The user's true 100% vision means a canonical IR universal bidirectional new-paradigm programming language with exhaustive edge-case representation, world-class compatibility, and certification-grade evidence. That requires work beyond Denali `1.0`:

- formal semantics for source languages, `.ls`, IR, target runtimes, and error behavior
- broad language-depth coverage, not only named narrow slices
- massive positive and negative edge-case matrices
- bidirectionality proofs across the contract layers, including round-trip source identity and semantic equivalence beyond curated fixtures
- compatibility rules across versions, runtimes, packages, and target ecosystems
- conformance-style tests and evidence durable enough for external certification review

Denali `1.0` should point toward that horizon, but it must not claim to have reached it.

## Minimum Gate Set Before Any 1.0 Release Decision

```bash
npm run beta:full
npm run beta:readiness:strict
npm run language:implemented:bidirectional
npm run language:all:bidirectional
npm run test:actual-programs
npm run test:luascript-meta
npm run clarity:dogfood
npm run clarity:canon
npm run clarity:languages
npm run test:ir-conformance
npm run test:edge-matrix
npm run test:unsupported-diagnostics
npm run test:roundtrip-probe
npm run test:source-identity-probe
npm run status:check
npm run claims:check
npm run stubs:check
npm run archive:audit
npm run verify
npm test
```

The current conformance and edge-case gates are scoped skeletons only. Future broader conformance gates must join this minimum set before any `1.0` release decision.
