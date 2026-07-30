# LUASCRIPT Conformance Evidence Bundle Index

Status: active evidence bundle index
Last updated: 2026-07-29
Track: Denali canonical `1.0` release-candidate evidence

This is a release-shaped conformance evidence bundle index for LUASCRIPT. It is certification-style evidence, not certification: it is not ISO certification, third-party certification, production certification, a release artifact, a package publish, canonical `1.0`, or the user's true omni-language 100% summit.

The package remains `luascript@0.1.0-beta.0`. This index describes the
evidence bundle; it does not authorize an external release action.

Coverage lanes include beta gates, language gates, Clarity dogfood/canon/super-canon evidence, IR conformance, schema artifact mapping, dual-surface compatibility bridge, public package contract, edge matrix, round-trip probe, source identity probe, unsupported diagnostics, actual programs, support matrix, compatibility policy, parser ownership, current-host compatibility, release-blocking policy, and deterministic bundle identity.

## One Authoritative Reproduction Command

Run from the repository root:

```bash
npm run denali:rc:preflight
```

Inspect the exact ordered policy without executing it:

```bash
npm run denali:rc:preflight:list
```

The fail-closed orchestrator runs 26 ordered steps. It regenerates each
required report before dependent validation, runs compatibility after every
report producer it hash-binds, and runs the evidence generator last. Its
stdout receipt is transient. The generator owns the durable path:

`artifacts/release_evidence/denali-release-evidence-bundle.json`

The authoritative order and no-release boundary are defined in
[LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md](LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md).

## Evidence Boundary

- Scoped beta, Denali RC readiness, an authorized `1.0` release, and true
  omni-language 100% remain separate.
- A support claim is current only while its support-matrix row, manifest,
  report, source hashes, runtime evidence, docs, and claims checks agree.
- Report evidence applies only to named fixtures and cases.
- Fixture/hash expectations mean report-level manifest hashes, fixture or case hashes, pass/fail summaries, environment metadata, and support-matrix traceability, plus implementation/runtime evidence where the owning schema requires them.
- A prior passing count does not survive a live hash mismatch.
- No version bump, tag, publish, GitHub release, changelog seal, artifact signing, commit, push, pull request, package `bin`, package `exports`, public API mutation, or language promotion is implied by this index.

## Deterministic Bundle Contract

`npm run evidence:release` runs
`scripts/generate_release_evidence_bundle.js --require-ready`. It writes only
the default bundle path above and exits nonzero when required evidence has any
blocker. It inventories evidence; it does not rerun an owning gate or repair a
stale report.

The normal inventory contains 46 entries:

- 42 required entries: bundle implementation sources, 4 required Clarity
  reports, 26 language report/manifest pairs, actual programs, parser
  ownership, and 9 conformance report lanes;
- 4 informational entries: Clarity fast, heavy, legacy, and setup-blocked
  variants.

Release-ready requires every required entry to exist, parse, report no
failures, and validate every required live path/SHA-256 reference. Required
legacy Clarity reports without embedded hashes must instead pass the explicit
`generatedAt` versus declared-input-mtime freshness fallback. Missing,
malformed, failing, stale, or unbound required evidence is release-blocking.

Informational entries never counterfeit readiness. Their missing, failing,
stale, or unbound state is retained as an informational warning.

Evidence entries are sorted by ID; blockers and warnings are sorted by
severity, code, evidence ID, path, and message; references are sorted by path
and expected SHA-256. Bundle identity uses SHA-256 over UTF-8 JSON after
recursively sorting object keys while preserving defined array order. Only
top-level `generatedAt` and `contentIdentity` are excluded from identity
inputs; timestamps inside inventoried reports remain bound evidence.

## Current Bundle Inventory

| Evidence lane | Command or source | Report path | Current evidence and boundary |
| --- | --- | --- | --- |
| Bundle implementation | `scripts/generate_release_evidence_bundle.js`; focused bundle tests | Final bundle path | Required source-set integrity; generator is evidence code, not a release command |
| Language completion | `npm run language:implemented:bidirectional` | `artifacts/language_completion/*-report.json` | 26 schema-v2 report/manifest pairs and 424/424 fixtures; 17 native reports and 317/317 fixtures, plus 9 target-runtime reports and 107 fixtures; named slices only |
| Required Clarity | `clarity:dogfood`, `clarity:canon`, `clarity:canon:super`, `clarity:canon:languages` | `artifacts/clarity_canon/dogfood-report.json`, `canon-report.json`, `canon-super-report.json`, `canon-languages-report.json` | Four required legacy-format reports; passing result plus fail-closed input freshness required |
| Informational Clarity | `clarity:canon:fast`, `:heavy`, `:legacy`, `:setup-blocked` | Corresponding `artifacts/clarity_canon/*.json` reports | Diagnostic/shard evidence; inventoried as warnings, not blockers |
| Clarity language validation | `npm run clarity:languages:reports` | No Clarity report is written | Validates schema-v2 language JSON after `canon-languages` produces the required language-canon report |
| Public package | `npm run test:package-contract` | `artifacts/conformance/public-api-runtime-package-report.json` | 32/32 actual-tarball checks, clean install/import/transpile, six exact root exports, 3-file installed example surface, current Node and Node `14.17.1`; no release/registry/platform promotion |
| Actual programs | `npm run test:actual-programs` | `artifacts/conformance/actual-programs-report.json` | 55/55 source-hash-bound results: 37 positive runtime, 6 expected compile diagnostics, 12 expected runtime diagnostics; repository-local legacy route, `packageCompatibilityClaimed: false` |
| Parser ownership | `npm run test:parser-ownership` | `artifacts/conformance/parser-ownership-report.json` | 35/35: 21 static, 13 runtime, 1 completion assertion; repository parser-ownership evidence |
| Current-host compatibility | `npm run test:compatibility-matrix` | `artifacts/conformance/denali-compatibility-matrix-report.json` | 88/88 checks when live-bound: Windows x64 tools, package/dependencies/Node floor, 17 native lanes, release IR, reports, manifests, and docs; not cross-platform certification |
| Canonical IR conformance | `npm run test:ir-conformance` | `artifacts/conformance/canonical-ir-conformance-report.json` | 32 fixtures mapped to named v1 semantic rules or documented gaps |
| Schema artifact mapping | `npm run test:schema-artifact-map` | `artifacts/conformance/schema-artifact-mapping-report.json` | 21 positive mappings, 11 expected diagnostics, 168 base invariants, 147 release-contract checks. Chosen one-way current-fixture projection; not compiler-output change, reverse conversion, or semantic equivalence |
| Dual-surface compatibility bridge | `npm run test:ir-compatibility-bridge` | `artifacts/conformance/dual-surface-compatibility-bridge-report.json` | Contract `1.0.0-rc.1`; positive, static, mapping, determinism, supplemental, and negative checks pass. Chosen internal one-way release-IR transition; not public API, compiler-output change, reverse conversion, or broad semantics |
| Edge-case matrix | `npm run test:edge-matrix` | `artifacts/edge_matrix/edge-case-matrix-report.json` | 25 scoped cases with manifest/case hashes and category counts; not exhaustive |
| Round-trip probe | `npm run test:roundtrip-probe` | `artifacts/conformance/roundtrip-probe-report.json` | Report carries environment metadata, manifest hash, 7 fixture hashes, pass/fail summaries, layer evidence, and support-matrix traceability; 5 structural plus 2 runtime-output checks, source-preserving count 0 |
| Source identity | `npm run test:source-identity-probe` | `artifacts/conformance/source-identity-probe-report.json` | 12 positive normalized `.ls` source/parser-owned-AST/IR checks plus 3 expected diagnostics; token identity observed but non-gating |
| Unsupported diagnostics | `npm run test:unsupported-diagnostics` | `artifacts/conformance/unsupported-diagnostics-report.json` | 21 named fail-closed cases; not a complete unsupported-feature catalog |
| Status and quality | `status:check`, `stubs:check`, `archive:audit`, `claims:check`, `verify`, `npm test`, `test:performance`, `ci:gates` | Preflight stdout receipt and owning outputs | Release-blocking validation after report production; no support broadening |
| Final bundle | `npm run evidence:release` | `artifacts/release_evidence/denali-release-evidence-bundle.json` | Runs last and requires zero blockers; deterministic identity and exact evidence inventory |

Supplemental scoped-beta artifacts remain available:

- `artifacts/beta_readiness.json`
- `artifacts/beta_gates/preflight-report.json`
- `artifacts/beta_gates/full-report.json`

They describe the scoped beta route. They do not replace the Denali RC
preflight or its final deterministic bundle.

## Language Schema-v2 Evidence

Every accepted language report records:

- schema version 2 and `kind: language:bidirectional`;
- language/support-slice identity and generated time;
- manifest path, SHA-256, status, version, support slice, fixture count, and
  ordered fixture records;
- manifest-entry SHA-256, source SHA-256, and byte size for every fixture;
- per-result source identity and status;
- loaded implementation file paths and SHA-256 values;
- resolved runtime commands and successful bounded version probes;
- Node, OS, platform, architecture, cwd, and timeout environment metadata;
- hashes for governing support/completion/package documents.

The full implemented aggregate is 26 reports and 424 passing fixtures. The
native aggregate is 17 reports and 317 passing fixtures. The release bundle
inventories all 26; the compatibility matrix binds the 17 native lanes because
those are the named native support claims.

A count without matching live manifest, fixture, result, implementation,
runtime, environment, and governing-document provenance is `OPEN` or stale,
not a qualified pass.

## Package Tarball And Installed Examples

The current package report proves the real `npm pack` output:

| Field | Current contract |
| --- | --- |
| Package | `luascript@0.1.0-beta.0` |
| Tarball | `luascript-0.1.0-beta.0.tgz` |
| Tarball SHA-256 | `92947fab9eabdaf79efed47b114b787cc6d7a5195e0320d28d407f558b2c7461` |
| Packed / unpacked bytes | 1,010,433 / 5,189,594 |
| Entry count | 398 |
| File-list SHA-256 | `cc16e4bce689b57ae8f6c5334ae43935fd2493f09dd98befa5395929f7028977` |
| Installed package examples | README plus two executable root-API programs: `examples/package/README.md`, `examples/package/minimal-system.cjs`, `examples/package/transpile-js-to-lua.cjs` |
| Root exports | exactly 6 protected names |
| Declared Node floor | `>=14.17.0`; installed-consumer probe on `14.17.1` |
| Package report result | 32/32 |

The harness clean-installs the tarball, imports the package root, transpiles a
consumer program, checks exact TypeScript `5.9.3`, confirms the forbidden
internal IR names are absent from the root API, executes both packaged
examples, verifies root-level `runtime/` is absent, and removes the temporary
consumer exactly.

Only `examples/package/` is installed-package example evidence. The 55-entry
actual-program suite and wider `examples/` tree are repository-local. Their
passing behavior cannot be averaged into package compatibility.

## Actual Programs And Parser Ownership

The actual-program report is no longer an inferred dogfood result. It is a
first-class release-binding report with:

- 55 manifest programs and 55 unique results;
- 55 present source files and 55 matching source SHA-256 bindings;
- 55 passing classifications;
- environment and runtime evidence;
- the explicit boundary
  `repository-local legacy compiler and runtime behavior`;
- `packageCompatibilityClaimed: false`.

Dogfood remains supplemental traceability; the first-class report is the
release-binding source.

The parser-ownership report is also first-class. Its 35/35 checks bind the
active parser/transpiler/harness sources and separate 21 static, 13 runtime,
and 1 completion assertion. The source-identity report is related evidence,
but it does not substitute for execution of `tests/parser_ownership.test.js`.

## Current-Host Compatibility

The current matrix reports 88/88 when all live hashes agree. It records:

- Windows x64, Node `v24.14.0`, npm `11.9.0`, and exact bounded tool probes;
- declared, locked, and installed identities for `acorn@8.15.0`,
  `esprima@4.0.1`, `luaparse@0.3.1`, and exact
  `typescript@5.9.3`;
- the separate Node `14.17.1` installed-package floor smoke;
- 17 native reports and 317 fixtures;
- latest, pinned `1.0.0`, and `1.x` release-IR schemas and reports;
- bound manifests, package/runtime documents, migration notes, support matrix,
  and completion rules.

A version probe proves command availability, not compilation, linking, SDK
targeting, package-cache health, or runtime semantics. Those behaviors belong
to the owning package and language gates.

The matrix runs after package, language, Clarity, actual-program, parser, IR,
edge, round-trip, source-identity, and diagnostic producers. This ordering
prevents a later producer from silently making a green compatibility artifact
stale before bundle generation.

## Required Versus Informational Clarity

Required:

- `artifacts/clarity_canon/dogfood-report.json`
- `artifacts/clarity_canon/canon-report.json`
- `artifacts/clarity_canon/canon-super-report.json`
- `artifacts/clarity_canon/canon-languages-report.json`

Informational:

- `canon-fast-report.json`
- `canon-heavy-report.json`
- `canon-legacy-report.json`
- `canon-setup-blocked-report.json`

The required reports block on missing, failing, stale, or unverifiable
freshness. Informational variants produce warnings under the same inventory
logic but do not block the active release contract.

Because these legacy reports do not embed the current path/hash shape, the
bundle:

1. discovers declared inputs and freshness roots;
2. hash-binds the current input content set into the bundle;
3. requires report `generatedAt` to be at or after the newest input mtime;
4. rejects missing inputs, future/untrustworthy report timestamps, stale
   inputs, and unverifiable state;
5. uses no arbitrary age threshold.

`clarity:languages:reports` validates language reports but writes no Clarity
report. The preflight therefore runs `clarity:canon:languages` first to create
the required language-canon artifact.

## Required Report Fields

Hash-bearing release reports now carry, as applicable:

- environment and generating-harness metadata;
- manifest and governing-source hashes;
- fixture/case/result source hashes and exact counts;
- pass/fail summaries and failure arrays;
- implementation-source hashes;
- runtime command/probe evidence;
- support-matrix and contract traceability;
- explicit package, legacy-route, source-identity, compatibility, or
  no-release boundaries.

The schema-v2 language reports, actual-program report, parser-ownership report,
public-package report, current-host compatibility report, IR reports, edge
report, round-trip report, source-identity report, and unsupported-diagnostic
report are first-class bundle inputs now. They are not future placeholders.

The Clarity reports are the explicit legacy-format exception and use the
fail-closed freshness mechanism above.

## Release-Blocking Interpretation

A generated bundle may be read as release-ready only when:

- `summary.releaseReady` is `true`;
- `summary.releaseBlockingIssues` is `0`;
- every required entry is passing;
- every required embedded binding is verified or an allowed Clarity freshness
  fallback is verified;
- the bundle was generated last by the current preflight against the source
  state under review.

A passing report summary with a stale hash remains a blocker. An
informational-warning count does not make required evidence fail, but warnings
must remain visible. A release-ready bundle is necessary for a local Denali RC
handoff and still does not authorize release.

## Known Unsupported Areas

Known unsupported or explicitly excluded areas include:

- broad full-language support beyond named schema-v2 manifest slices;
- true omni-language universal IR coverage;
- ISO, third-party, production, security, or standards certification;
- universal/lossless bidirectional translation;
- token/comment/format-preserving source identity;
- broad lossless recovery and broad semantic equivalence;
- exhaustive edge cases and a complete unsupported-feature catalog;
- Linux, macOS, other architectures, alternative toolchains, and untested
  runtime versions;
- npm ownership, registry authentication, signing keys, package-name
  availability, and network release access;
- permission to version, tag, publish, or release.

Unsupported behavior must remain an expected named diagnostic or documented
exclusion. It cannot count as implementation support or disappear as an
implicit skip.

## Bundle Reproduction

The complete release-shaped local reproduction is:

```bash
npm run denali:rc:preflight
```

Do not manually move compatibility earlier or evidence generation earlier.
Use the list command to audit the contract:

```bash
npm run denali:rc:preflight:list
```

After a run, compare this index with
[LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md),
[LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md),
[LANGUAGE_SUPPORT_MATRIX.md](LANGUAGE_SUPPORT_MATRIX.md),
[LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md](LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md),
[LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md](LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md),
and the current Denali ledger. Any disagreement is evidence drift.

The Lua structural IR reparse seed and versioned one-way release-IR surface choice are sealed foundations. The current route is no longer “add first-class language, actual-program, parser-ownership, compatibility, or bundle reports”: those reports and policies now exist. The remaining work is to keep their live bindings green, expand only named supported depth, collect equivalent cross-platform receipts before making cross-platform claims, and stop before release without explicit authorization.
