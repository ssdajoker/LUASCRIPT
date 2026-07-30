# LUASCRIPT Canonical 1.0 Exit Criteria Charter

Status: active charter
Last updated: 2026-07-29
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
| Denali canonical `1.0` | Stable `.ls` identity, formalized IR contract, named support boundaries, conformance evidence, package/runtime expectations, compatibility rules, and active docs agree | This charter plus `npm run denali:rc:preflight`, the deterministic release evidence bundle, release-IR/package/compatibility reports, active docs, and claims checks | `MET` for the scoped no-release candidate; release authorization remains `OPEN` |
| True omni-language 100% | Universal bidirectional IR across arbitrary languages, exhaustive edge cases, certification-grade evidence, and external-quality conformance expectations | Formal semantics, massive language-depth matrices, broad bidirectionality proofs, compatibility suites, and independent certification-grade evidence | `EXCLUDED` from Denali `1.0` |

## Denali 1.0 Required Criteria

| ID | Criterion | Measurable exit condition | Required gates/evidence | Current status |
| --- | --- | --- | --- | --- |
| `1.0-IDENTITY` | Stable `.ls` language identity | The `.ls` spec names supported syntax, profile names, default profile behavior, repair blocks, verify blocks, unsupported diagnostics, and examples; no doc claims unsupported profiles | `docs/LUASCRIPT_META_LANGUAGE_V0.md`, `docs/LUASCRIPT_LIVING_META_LANGUAGE.md`, `docs/LANGUAGE_SUPPORT_MATRIX.md`, `meta_identity_contract_portable_slice.ls`, schema-v2 LUASCRIPT reports, meta tests, dogfood, and claims | `MET` for the named V0.16/profile slices; broader identity is `EXCLUDED` |
| `1.0-IR-SEMANTICS` | Canonical IR semantics contract | IR spec defines node semantics, value model, control flow, errors/diagnostics, determinism, serialization, and target obligations for every `1.0` supported node | Semantics inventory/spec, [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md), 32-fixture IR conformance, 21-fixture schema mapping/compatibility reports, pinned schemas, golden IR, diagnostics | `MET` for the versioned named release surface; broader semantics and reverse conversion are `EXCLUDED` |
| `1.0-BIDIRECTIONALITY` | Layered bidirectionality without overclaim | Every supported language/profile has manifest-backed evidence for only the layers named in [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md) | 26 schema-v2 language reports/424 fixtures, 7 round-trip probes, 15 source-identity fixtures, compatibility binding, and claims | `MET` for the declared layers; lossless/broad identity and semantic equivalence are `EXCLUDED` |
| `1.0-RUNTIME-GATES` | Runtime support is real, not assumed | Every native runtime claim has a real command, a passing native gate, timeout policy, report artifact, and setup note; setup-blocked lanes are excluded | 17 native schema-v2 reports/317 fixtures, captured runtime probes/tool versions, compatibility report, and aggregate report validation | `MET` for the current-host named native slices; untested platforms/toolchains are `EXCLUDED` |
| `1.0-LANGUAGE-ACCESSION` | Language slice broadening follows a formal gate | Every promoted language-depth expansion has manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry | [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md), support matrix/rules, manifests, claims, and archive guard | `MET`; future promotions remain separate accession work |
| `1.0-EXAMPLES` | Examples stay inside named support | Every first-party installed example is package-root-only and tested after clean install; repository examples remain classified as evidence | Two `examples/package/` programs through `test:package-contract`; 55/55 actual-program report; dogfood/meta/parser reports and docs | `MET` for the classified package and repository evidence surfaces |
| `1.0-DOCS` | Active docs and archive boundary are sealed | README, status, docs index, support matrix, completion rules, reference, architecture, contracts, policy, and charter agree; archive docs remain evidence only | `status:check`, `claims:check`, `stubs:check`, `archive:audit`, deterministic bundle | `MET` for the no-release candidate |
| `1.0-PUBLIC-API-RUNTIME` | Public API and runtime contract is explicit | Entry, six root exports/facade, no CLI, Node floor, dependencies, package files, semver, compatibility, and release-action boundaries are written and packed-tarball tested | [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md), 32-check package report, installed examples, current Node and Node `14.17.1`, migration/changelog docs | `MET` for the no-release candidate; public release remains unauthorized |
| `1.0-COMPATIBILITY` | Package/runtime compatibility is explicit | Package, Node floor, release IR/schema, native tools, examples, docs, manifests, changelog, and migration notes agree on the current host | [LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md](LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md), compatibility report with zero `OPEN`/`FAIL`, package report, versioning/migration docs, release-tooling contracts | `MET` for current-host RC compatibility; cross-platform certification is `EXCLUDED` |
| `1.0-CONFORMANCE` | Conformance evidence exists as a release artifact | Required positive, negative, edge, runtime, ownership, package, and compatibility reports are hash-bound and release-block on drift | [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md), deterministic release evidence bundle, [LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md](LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md), and `npm run denali:rc:preflight` | `MET` for the scoped local release candidate |
| `1.0-RELEASE-SEAL` | Release action is deliberate and gated | A version bump, tag, publish, or GitHub release occurs only after RC evidence and explicit authorization | Authoritative preflight, release CLI safeguards, changelog/package metadata, operator decision | `OPEN`; deliberately stopped before every release action |

## 2026-07-16 Release-Candidate Audit (Historical Verdict)

Release-candidate audit verdict: Denali canonical `1.0` is **78% done / 22% remaining**. The user's true omni-language 100% summit is **7% done / 93% remaining**. The Denali ledger cannot close as a canonical `1.0` release ledger yet; it must hand off to the Big Remaining Climb route for source-preserving proof layers, schema-valid IR surface reconciliation, final public API/runtime freeze, compatibility seal, and release-grade conformance expansion.

The audit marks a criterion `MET` only when current passing gates and stable active docs satisfy the criterion. Scoped local proof, partial evidence, and no-release candidates remain `OPEN` for `1.0` release closure.

## 2026-07-29 Denali Local Release-Candidate Closure Audit

This audit supersedes the historical completion percentage for current-route decisions without rewriting that history. The scoped Denali no-release candidate is closed by the authoritative 26-step preflight and a zero-blocker deterministic evidence bundle. `0.1.0-beta.0` remains the package identity until a separate authorized release action.

| Criterion | RC status | Current proven evidence | Deliberate exclusion or post-RC boundary |
| --- | --- | --- | --- |
| `1.0-IDENTITY` | `MET` | `.ls` V0.16 identity/profile docs and manifests, meta/repair/verify behavior, LUASCRIPT language reports, source-identity fixtures, dogfood, and claims agree | New profiles or broader syntax require accession evidence |
| `1.0-IR-SEMANTICS` | `MET` for named surface | Contract `1.0.0-rc.1` keeps Program IR `v0` operational and canonical artifact `1.0.0` as a one-way projection; IR/mapping/compatibility reports bind the surface | Reverse conversion and broader semantics are excluded |
| `1.0-BIDIRECTIONALITY` | `MET` for declared layers | Schema-v2 reports cover 26 report pairs/424 fixtures; round-trip is 7/7 and source identity is 15/15 | Broad lossless/token/comment/format identity and broad semantic equivalence are excluded |
| `1.0-RUNTIME-GATES` | `MET` for current host | Compatibility binds 17 native lanes/317 fixtures to successful probes and exact tool versions | Untested hosts and toolchains are excluded |
| `1.0-LANGUAGE-ACCESSION` | `MET` | Promotion rules and evidence boundaries are claim-checked | Future depth is route-by-route |
| `1.0-EXAMPLES` | `MET` | Two installed examples run from a clean package; actual programs report 55/55; parser ownership reports 35/35 | Wider examples remain repository-local |
| `1.0-DOCS` | `MET` | Active-doc, claims, stub, archive, and deterministic evidence policies agree | Changelog seal belongs to the authorized release action |
| `1.0-PUBLIC-API-RUNTIME` | `MET` for no-release candidate | Packed package protects six root exports, no `bin`, no `exports`, Node `>=14.17.0`, runtime dependencies, exact files, and examples | Version/publication remains unauthorized |
| `1.0-COMPATIBILITY` | `MET` for current host | Compatibility matrix has zero `OPEN`/`FAIL` and binds package, schemas, 17 native lanes, docs, manifests, examples, and setup notes | Linux/macOS/other architectures remain unclaimed |
| `1.0-CONFORMANCE` | `MET` for scoped local RC | The fail-closed preflight regenerates all owning reports and produces a zero-blocker release evidence bundle last | Independent/third-party certification remains excluded |
| `1.0-RELEASE-SEAL` | `OPEN` | No version bump, tag, publish, package `bin`, package `exports`, compiler API change, or runtime API change occurred | Release action requires all in-scope criteria to become `MET` or explicitly `EXCLUDED`, then a deliberate version/tag/publish decision |

Denali 1.0 release candidate ready; awaiting explicit operator authorization to version, tag, publish, or release.

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
npm run denali:rc:preflight
```

Use `npm run denali:rc:preflight:list` to inspect the exact 26-step policy. The
preflight regenerates owning reports in dependency order and ends with
`npm run evidence:release`, whose `--require-ready` generator exits nonzero
unless the deterministic bundle has zero release blockers. Future support
broadening must join the owning reports and this policy before it can enter a
later release decision.
