# LUASCRIPT Conformance Evidence Binder

Status: active evidence binder
Last updated: 2026-07-29
Track: Denali canonical `1.0` release-candidate evidence

This binder is a certification-style evidence structure for LUASCRIPT.
It is not ISO certification, third-party certification, production certification, or a claim that LUASCRIPT has reached the user's true omni-language 100% summit.
It names the evidence that exists, the command that must refresh it, and the
boundaries that a passing local result does not cross.

The released package is `luascript@1.0.1`. Nothing in this binder by itself authorizes
a version bump, commit, tag, push, publish, GitHub release, or package-surface
change.

## Authoritative Bearing

From the repository root, the authoritative Denali RC reproduction command is:

```bash
npm run denali:rc:preflight
```

Inspect its ordered policy without running a gate:

```bash
npm run denali:rc:preflight:list
```

The 26-step orchestrator uses argument arrays with `shell: false`, runs every
command from the repository root, stops on the first exception, signal,
missing process status, or nonzero exit, and emits an in-memory receipt to
stdout. It regenerates report producers before validators, runs the
compatibility matrix after every report it hash-binds, and runs
`npm run evidence:release` last. The durable output belongs to the evidence
generator, not the preflight runner:

`artifacts/release_evidence/denali-release-evidence-bundle.json`

The detailed policy is
[LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md](LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md).

## Scope

- The binder indexes current evidence; it does not promote support by itself.
- Scoped beta, a Denali `1.0` release candidate, an authorized `1.0` release,
  and true omni-language 100% remain separate states.
- Current conformance, edge-case, and round-trip suites are scoped skeletons.
  Their durable reports are real release inputs, but their named fixtures are
  not exhaustive language or semantic certification.
- A language, feature, profile, runtime, example, or package behavior is
  supported only when the support matrix, manifests, reports, runtime
  evidence, documentation, and current gates agree.
- Passing counts describe named evidence sets. They do not override a stale
  hash, missing runtime, failed freshness check, or explicit exclusion.
- Archived documents are historical evidence only.

## Current Denali Evidence Snapshot

These counts are the results recorded by the current report-producing
harnesses. A release-readiness decision still requires a fresh successful
preflight and a zero-blocker final bundle.

| Evidence surface | Current recorded result | Binding and boundary |
| --- | ---: | --- |
| Language completion, all implemented lanes | 26 schema-v2 report/manifest pairs; 424/424 fixtures passing | Every report binds manifest metadata and SHA-256, ordered fixture source hashes and byte sizes, per-result source identity, loaded implementation hashes, successful runtime probes, environment metadata, and governing-document hashes |
| Implemented native language subset | 17 reports; 317/317 fixtures passing | These are the native support lanes bound by the current-host compatibility matrix; the other 9 reports and 107 fixtures are target-runtime lanes |
| Public package contract | 32/32 checks passing | Actual `npm pack`, exact file inventory, clean install, root import/transpile, public examples, dependency closure, Node-floor smoke, and exact cleanup; still a no-release beta candidate |
| Installed-package examples | 3/3 exact files present; both program files executable | `examples/package/README.md`, `examples/package/minimal-system.cjs`, and `examples/package/transpile-js-to-lua.cjs` are the only installed-package example surface |
| Repository-local actual programs | 55/55 passing | 37 positive-runtime cases, 6 expected compile diagnostics, and 12 expected runtime diagnostics; report declares `packageCompatibilityClaimed: false` |
| Parser ownership | 35/35 passing | 21 static assertions, 13 runtime assertions, and 1 completion assertion; repository parser-ownership evidence, not package compatibility |
| Current-host compatibility | 88/88 checks passing when generated against its bound inputs | Current Windows x64 runtime/tool availability, native lanes, package/dependencies/Node floor, release IR, manifests, and docs; other hosts remain unclaimed |
| Canonical IR conformance | 32 manifest fixtures | Positive and expected-diagnostic evidence mapped to named v1 semantic rules or documented gaps |
| Schema artifact mapping | 21/21 positive mappings plus 11 expected diagnostics | 168/168 base invariants and 147/147 release-contract checks |
| Dual-surface release IR | All current positive, static, mapping, determinism, supplemental, and negative checks passing | Contract `1.0.0`; internal one-way Program IR v0 to canonical artifact `1.0.0` transition only |
| Edge matrix | 25/25 scoped cases | Value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics |
| Round-trip probes | 7/7 | 5 structural IR reparse checks and 2 runtime-output equivalence checks; source-preserving count remains 0 |
| Source identity | 15/15 | 12 positive normalized `.ls` source/parser-owned-AST/IR checks and 3 expected diagnostics; token identity is measured but non-gating |
| Unsupported diagnostics | 21/21 | Named fail-closed JavaScript, `.ls`, Python, Lua, core-fallback, and target-emitter diagnostics |

The current package tarball contract records:

- filename `luascript-1.0.1.tgz`;
- SHA-256
  `92947fab9eabdaf79efed47b114b787cc6d7a5195e0320d28d407f558b2c7461`;
- 398 entries;
- packed size 1,010,433 bytes;
- unpacked size 5,189,594 bytes;
- sorted file-list SHA-256
  `cc16e4bce689b57ae8f6c5334ae43935fd2493f09dd98befa5395929f7028977`.

The tarball identity is evidence for the source/package state that generated
it. Any bound package or source change requires `npm run test:package-contract`
again; an old green summary is not reusable as current evidence.

## Evidence Stack

Primary truth sources:

- [../PROJECT_STATUS.md](../PROJECT_STATUS.md): root status entrypoint.
- [INDEX.md](INDEX.md): active-docs map and archive boundary.
- [LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md):
  route ledger and verification seals.
- [LUASCRIPT_1_0_EXIT_CRITERIA.md](LUASCRIPT_1_0_EXIT_CRITERIA.md):
  measurable Denali `1.0` criteria.
- [LANGUAGE_SUPPORT_MATRIX.md](LANGUAGE_SUPPORT_MATRIX.md): current support
  claims and promotion boundaries.
- [LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md](LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md):
  current-host compatibility scope, tool versions, lane bindings, and setup
  notes.
- [LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md](LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md):
  authoritative preflight order and release-blocking policy.
- [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md): release-shaped conformance evidence bundle index.

Active contracts:

- [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md):
  versioned one-way operational-to-canonical transition.
- [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md):
  bidirectional claim layers.
- [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md):
  promotion rules for language-depth slices.
- [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md):
  package entrypoint, API, runtime, files, semver, and release boundaries.
- [LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md](LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md):
  unreleased consumer changes.
- [VERSIONING.md](VERSIONING.md): IR schema versioning policy.

## Gate Families

| Gate family | Commands | Current evidence role | Boundary |
| --- | --- | --- | --- |
| Authoritative RC preflight | `npm run denali:rc:preflight`; list with `npm run denali:rc:preflight:list` | Regenerates and validates the complete ordered local RC evidence chain and generates the bundle last | No release action; fail-closed local readiness only |
| Language completion | `npm run language:implemented:bidirectional`; per-lane commands | Writes 26 schema-v2 reports covering 424 fixtures; native subset is 17 reports and 317 fixtures | Named support slices only; no blanket full-language claim |
| Public package contract | `npm run test:package-contract` | Packs and clean-installs the real tarball, freezes six root exports, executes installed examples, checks exact dependencies and Node `14.17.1` | No version bump, `bin`, `exports`, registry, or cross-platform claim |
| Clarity evidence | `npm run clarity:dogfood`, `npm run clarity:canon`, `npm run clarity:canon:super`, `npm run clarity:canon:languages`, `npm run clarity:languages:reports` | Refreshes four required Clarity reports, then validates schema-v2 language receipts | Hashless legacy reports are accepted only through fail-closed input-mtime freshness |
| Actual programs | `npm run test:actual-programs` | Writes a first-class 55/55 report with manifest/source hashes and explicit legacy boundary | Repository-local legacy compiler/runtime evidence, not installed-package evidence |
| Parser ownership | `npm run test:parser-ownership` | Writes a first-class 35/35 static/runtime/completion report | Repository parser delegation and ownership only |
| Current-host compatibility | `npm run test:compatibility-matrix` | Hash-binds current tools, package, 17 native lanes, release IR, reports, manifests, and docs after all producers | One Windows x64 host plus separate Node-floor package smoke; not universal certification |
| Canonical IR conformance | `npm run test:ir-conformance` | Writes a 32-fixture durable report | Scoped v1 semantic evidence map |
| Schema artifact mapping | `npm run test:schema-artifact-map` | Writes canonical artifact `1.0.0` mappings and expected diagnostics | Chosen one-way internal projection |
| Dual-surface compatibility bridge | `npm run test:ir-compatibility-bridge` | Enforces release contract `1.0.0` across live/pinned/`1.x` schemas | Internal bridge only; no public API or reverse conversion |
| Edge, round-trip, identity, diagnostics | `npm run test:edge-matrix`, `test:roundtrip-probe`, `test:source-identity-probe`, `test:unsupported-diagnostics` | Writes durable scoped reports with hashes and traceability | Named cases only |
| Documentation and inventory integrity | `npm run status:check`, `claims:check`, `stubs:check`, `archive:audit` | Enforces active truth, protected claims, real implementations, and archive separation | Text/inventory governance, not semantic proof |
| General readiness | `npm run verify`, `npm test`, `npm run test:performance`, `npm run ci:gates` | Runs broader verification, core/runtime, performance, and CI-completeness checks | Current local environment |
| Deterministic bundle | `npm run evidence:release` | Inventories required and informational evidence, validates bindings, and writes the final deterministic bundle | Runs last; does not repair or rerun an owning gate |

## Language Schema-v2 Binding

`artifacts/language_completion/*-report.json` contains 26 current schema-v2
language/target reports. The accepted report shape includes:

- manifest path, schema/status/version/support slice, SHA-256, and fixture count;
- ordered fixtures with name, source, manifest-entry SHA-256, source SHA-256,
  and byte size;
- per-result source SHA-256 and pass/fail status;
- hashes for the loaded compiler/harness implementation files;
- resolved runtime commands and bounded successful version probes;
- Node, platform, architecture, OS, cwd, and runtime timeout metadata;
- hashes for support-matrix and completion-policy documents.

The implemented aggregate records 26 report pairs and 424/424 fixtures. The 17
native lanes record 317/317 fixtures; nine target-runtime lanes account for the
remaining 107. A report is release-acceptable only while all embedded live
paths and hashes still match. Counts alone cannot convert a stale report into a
pass.

## Package, Examples, And Legacy Program Boundary

The package report at
`artifacts/conformance/public-api-runtime-package-report.json` proves the
actual-tarball surface rather than a source-tree approximation:

- package identity is `luascript@1.0.1`;
- root entrypoint remains `src/unified_luascript.js`;
- the exact root API remains `UnifiedLuaScript`, `CoreTranspiler`,
  `RuntimeSystem`, `AdvancedFeatures`, `PerformanceTools`, and `AgenticIDE`;
- runtime dependencies are `acorn`, `esprima`, `luaparse`, and exact
  `typescript@5.9.3`;
- the declared Node floor is `>=14.17.0`, with a clean installed-consumer
  probe on Node `14.17.1`;
- `examples/package/` is packed and both executable examples run from the
  installed package;
- root-level `runtime/` is deliberately excluded; deep legacy/Python tools that expect it are non-public;
- no package `exports` map is currently declared, so no subpath import is public in Denali;
- no npm `bin` or global CLI contract exists.

The wider `examples/` tree and
`artifacts/conformance/actual-programs-report.json` prove repository behavior,
not package behavior. The actual-program report is first-class and complete:
55 manifest entries, 55 source-hash-bound results, and 55 passes. Its boundary
states that it exercises `src/luascript_compiler.py` plus the repository
runtime and sets `packageCompatibilityClaimed: false`. No compatibility score
may average that legacy route into the public JavaScript package route.

`artifacts/conformance/parser-ownership-report.json` is likewise first-class:
35/35 checks with governing source hashes and environment/runtime evidence.
It proves parser ownership and delegated helper behavior; it does not promote
package compatibility.

## Current-Host Compatibility

`artifacts/conformance/denali-compatibility-matrix-report.json` records 88
current-host checks. A passing run establishes:

- Windows x64 host identity, Node/npm identity, and bounded runtime/tool
  version probes;
- package metadata, lock/install agreement, exact production dependencies,
  Node floor, and current package report identity;
- 17 native lanes, 317 fixtures, schema-v2 language provenance, and runtime
  availability;
- release-IR contract/schema/report identity;
- manifest, source, package-contract, migration-note, support-matrix, and
  completion-rule hashes.

It does not rerun language behavior and does not prove compile/link/cache/SDK
behavior merely because a version probe succeeds. Compatibility runs after all
report producers in the authoritative preflight because any later package,
language, IR, manifest, or documentation change can stale its hashes.

The current host is Windows x64 with Node `v24.14.0` and npm `11.9.0`; the
separate installed-package floor probe uses Node `v14.17.1`. Linux, macOS,
other architectures, alternative toolchains, and other runtime versions
require their own equivalent receipts.

## Clarity Required Versus Informational Freshness

The Clarity JSON format predates the schema-v2 hash-bearing reports, so the
bundle applies an explicit fail-closed freshness rule instead of treating a
green summary as current.

| Clarity report | Command | Policy |
| --- | --- | --- |
| `dogfood-report.json` | `npm run clarity:dogfood` | Required; stale, missing, failing, or unverifiable freshness blocks |
| `canon-report.json` | `npm run clarity:canon` | Required; stale, missing, failing, or unverifiable freshness blocks |
| `canon-super-report.json` | `npm run clarity:canon:super` | Required; stale, missing, failing, or unverifiable freshness blocks |
| `canon-languages-report.json` | `npm run clarity:canon:languages` | Required; refreshed after language reports; stale, missing, failing, or unverifiable freshness blocks |
| `canon-fast-report.json` | `npm run clarity:canon:fast` | Informational; problems are warnings, not release blockers |
| `canon-heavy-report.json` | `npm run clarity:canon:heavy` | Informational; problems are warnings, not release blockers |
| `canon-legacy-report.json` | `npm run clarity:canon:legacy` | Informational; problems are warnings, not release blockers |
| `canon-setup-blocked-report.json` | `npm run clarity:canon:setup-blocked` | Informational; problems are warnings, not release blockers |

For a hashless Clarity report, `generatedAt` must be at or after every declared
input file modification time. The bundle inventories and hash-binds the
current input content set, rejects an untrustworthy future timestamp, uses no
arbitrary age threshold, and blocks required evidence when the fallback is
stale or unverifiable.

`npm run clarity:languages:reports` validates language JSON but writes no
Clarity canon report. That is why the preflight separately runs
`clarity:canon:languages` before the reports-only validator.

## Report And Artifact Index

Current generated report paths:

- `artifacts/beta_readiness.json`
- `artifacts/beta_gates/preflight-report.json`
- `artifacts/beta_gates/full-report.json`
- `artifacts/language_completion/*-report.json`
- `artifacts/clarity_canon/dogfood-report.json`
- `artifacts/clarity_canon/canon-report.json`
- `artifacts/clarity_canon/canon-super-report.json`
- `artifacts/clarity_canon/canon-languages-report.json`
- `artifacts/conformance/actual-programs-report.json`
- `artifacts/conformance/parser-ownership-report.json`
- `artifacts/conformance/canonical-ir-conformance-report.json`
- `artifacts/conformance/schema-artifact-mapping-report.json`
- `artifacts/conformance/dual-surface-compatibility-bridge-report.json`
- `artifacts/conformance/public-api-runtime-package-report.json`
- `artifacts/conformance/denali-compatibility-matrix-report.json`
- `artifacts/conformance/roundtrip-probe-report.json`
- `artifacts/conformance/source-identity-probe-report.json`
- `artifacts/conformance/unsupported-diagnostics-report.json`
- `artifacts/edge_matrix/edge-case-matrix-report.json`
- `artifacts/release_evidence/denali-release-evidence-bundle.json`

The release-shaped bundle map is [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md). It is certification-style evidence, not certification. The release builder copies the exact bundle into the versioned build without changing package `bin`, package `exports`, or support claims.

Durable local report closure: `npm run test:ir-conformance`, `npm run test:schema-artifact-map`, `npm run test:ir-compatibility-bridge`, `npm run test:package-contract`, `npm run test:roundtrip-probe`, `npm run test:source-identity-probe`, and `npm run test:unsupported-diagnostics` write standalone JSON reports under `artifacts/conformance/` with environment, source/fixture/case hashes, pass/fail summaries, and scoped traceability. The same release inventory now also includes first-class actual-program, parser-ownership, current-host compatibility, and schema-v2 language reports.

## Conformance Suites

| Suite | Manifest/test/report | Current scope | Truthful exclusion |
| --- | --- | --- | --- |
| Canonical IR conformance | `tests/conformance/manifest.json`; `tests/conformance/canonical_ir_conformance.test.js`; `artifacts/conformance/canonical-ir-conformance-report.json` | 32 fixtures across value semantics, literals, bindings, scope, control flow, functions, calls, arrays/objects, errors, unsupported nodes, determinism, and target obligations, now mapped to named v1 evidence rules or documented gaps; 32 manifest fixtures mapped to named IR semantic rules or documented gaps | Not exhaustive semantics or external certification |
| Schema artifact mapping | `tests/conformance/manifest.json`; `tests/conformance/schema_artifact_mapping.test.js`; `artifacts/conformance/schema-artifact-mapping-report.json` | 21 positive fixtures produce canonical artifact `1.0.0` under the one-way contract; 147/147 contract checks pass; 11 expected diagnostics remain separate | No reverse conversion, arbitrary-artifact validation, or broad semantic equivalence |
| Dual-surface compatibility bridge | `src/ir/release_ir_surface_contract.js`; `src/ir/schema_artifact_bridge.js`; report | Contract `1.0.0`; 21 positive mappings; 168/168 base invariants; 10/10 static rules; 147/147 mapping rules; 21/21 deterministic artifacts; 1/1 supplemental DoWhile shape proof; 12/12 malformed-shape negatives; 5/5 malformed-source rejections; 11 expected diagnostics | Internal transition, not public API or compiler-output promotion |
| Edge-case matrix | `tests/edge_matrix/manifest.json`; report | 25 scoped cases across value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics | Not exhaustive edge coverage |
| Round-trip probe | `tests/roundtrip/manifest.json`; report | 7 probes separating 5 structural IR reparse checks from 2 runtime-output equivalence checks; JS/.ls/Python/Lua layer map recorded | Source-preserving count 0 |
| Source identity probe | `tests/roundtrip/source_identity_manifest.json`; report | 15 `.ls` fixtures: 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized IR identity checks, and 3 expected unsupported diagnostics; token identity is measured but non-gating | Named identity evidence only; not runtime-output equivalence, broad lossless recovery, or broad semantic equivalence |
| Unsupported diagnostics | `tests/ir/unsupported_diagnostics.test.js`; report | 21 named unsupported diagnostics for stable current JavaScript, `.ls`, Python, Lua, core fallback, and target-emitter failures | Not a complete unsupported-feature catalog |
| Language completion | 26 language/target manifests for named native and target-runtime slices; schema-v2 reports | 26/424 aggregate and 17/317 native subset with live provenance | Named slices, not full language implementations |
| Public package | Package harness and report | 32/32 actual-tarball checks plus 3-file installed example surface | No registry, release, or broad platform claim |
| Actual programs | 55-entry manifest, harness, and report | 55/55 repository-local legacy behavior results | Explicitly not installed-package compatibility |
| Parser ownership | Harness and report | 35/35 ownership/delegation assertions | Repository route only |

## Deterministic Bundle And Release-Blocking Policy

`npm run evidence:release` invokes the bundle generator with
`--require-ready`. It writes exactly
`artifacts/release_evidence/denali-release-evidence-bundle.json` and exits
nonzero when any required blocker exists.

Release-ready requires every required report to:

1. exist and parse;
2. declare a passing/zero-failure result;
3. match every embedded repository path and SHA-256 reference;
4. carry its required manifest, fixture/result, implementation, environment,
   runtime, and traceability evidence;
5. pass the special Clarity freshness fallback when it has no embedded hashes.

The four required Clarity reports, all 26 language pairs, actual-program
report, parser-ownership report, package/compatibility/IR/edge/round-trip/
identity/diagnostic reports, and bundle implementation sources are
release-blocking. The four diagnostic/shard-only Clarity variants are
informational; their issues remain visible as warnings but cannot counterfeit
a required failure or pass.

Evidence entries and issues are sorted deterministically. Identity is SHA-256
over recursively key-sorted UTF-8 JSON while preserving defined array order.
Only the bundle's top-level `generatedAt` and `contentIdentity` fields are
excluded from identity input; timestamps inside inventoried reports remain
bound evidence.

## Support Matrix Traceability

A support row may broaden only after:

- a named manifest and fixture set exist;
- parser, lowering, and emitter coverage exist;
- native and target runtime evidence exists where claimed;
- docs, support matrix, and accession rules agree;
- `npm run claims:check` protects the wording;
- the Denali ledger records the evidence route.

The binder never promotes a row by implication. A fixture count, visible
runtime command, package example, or passing target lane cannot substitute for
the missing part of an accession record.

## Known Unsupported Areas

Current explicit exclusions include:

- broad full-language support beyond named manifest slices;
- true omni-language universal IR coverage;
- ISO, third-party, production, security, or standards certification;
- general canonical-artifact authoring and semantic fidelity beyond the chosen
  internal one-way current-fixture transition;
- token/comment/format-preserving source identity;
- broad lossless source recovery;
- broad semantic equivalence beyond named runtime-output fixtures;
- exhaustive edge and unsupported-feature coverage;
- Linux, macOS, other architectures, and alternative runtime/toolchain
  certification;
- npm ownership, package-name availability, registry authentication, signing
  keys, or external release access;
- explicit authorization for any future release.

Unsupported features should fail closed through named diagnostics or remain documented exclusions. They should not appear as fake implementation stubs, silent skips, inferred support, or averaged compatibility.

## Release Evidence Checklist

Before calling a source state release-ready:

1. Confirm package identity is the intended stable version and the release
   action has explicit authorization.
2. Run `npm run denali:rc:preflight` from the repository root.
3. Require the stdout receipt to report all 26 steps passed.
4. Require
   `artifacts/release_evidence/denali-release-evidence-bundle.json` to report
   zero release blockers.
5. Treat informational Clarity warnings as diagnostics without allowing them
   to hide a required failure.
6. Confirm the support matrix, compatibility policy, release-IR contract,
   package migration notes, exit criteria, binder, and Denali ledger agree.
7. Preserve the exact source state and environment associated with the bundle.
8. Stop before versioning, committing, tagging, publishing, or releasing until
   explicit operator authorization exists.

## Reproducibility Steps

The complete local RC evidence chain is one command:

```bash
npm run denali:rc:preflight
```

The command covers language regeneration, the real package tarball, required
Clarity reports, language-report validation, actual programs, parser
ownership, IR/edge/round-trip/source-identity/diagnostic reports,
current-host compatibility, status/stub/archive/claim checks, verification,
core/runtime tests, performance readiness, CI completeness, and deterministic
bundle generation.

Use `npm run denali:rc:preflight:list` to audit the exact order. Do not replace
the orchestrator with a hand-reordered command list: compatibility must follow
its bound producers, and the evidence bundle must remain last.

A passing local run is evidence for the current named slices only; it is not ISO certification or true omni-language completion.
