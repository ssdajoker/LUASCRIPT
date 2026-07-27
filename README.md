# LUASCRIPT

Status source of truth: see [PROJECT_STATUS.md](PROJECT_STATUS.md). The beta handoff artifact is [docs/BETA_RELEASE_HANDOFF_V0_1.md](docs/BETA_RELEASE_HANDOFF_V0_1.md). Expedition guidance starts in [docs/LUASCRIPT_DENALI_SOLOIST_LEDGER.md](docs/LUASCRIPT_DENALI_SOLOIST_LEDGER.md), the post-beta 1.0 route book is [docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md), and the remaining source-preserving/certification climb now lives in [docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md). Language depth accession rules live in [docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md). Detailed roadmap, language support tiers, known blockers, and archived-plan consolidation live in [docs/LUASCRIPT_MEGA_PLAN.md](docs/LUASCRIPT_MEGA_PLAN.md). Bidirectionality terminology is defined by [docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md). Public API and runtime expectations for real `1.0` are defined by [docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md). Certification-style evidence is organized by [docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md), and the release-shaped bundle map is [docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md).

The active docs surface is intentionally small. [docs/INDEX.md](docs/INDEX.md) is the canonical active-docs map; if a document is not in that map or the support-reference list below, treat it as deprecated historical material under [docs/OLD LUASCRIPT DOCS/README.md](<docs/OLD LUASCRIPT DOCS/README.md>).

## Scoped Beta v0.1 Handoff

LUASCRIPT is in a **scoped, non-strict pre-production beta v0.1** state. On 2026-06-19, `npm run beta:readiness`, `npm run beta:preflight`, and `npm run beta:full` passed for the implemented lanes; the same beta preflight/full evidence was refreshed on 2026-07-14 during the penultimate Denali readiness audit. This is evidence for the named slices only; it is not canonical `1.0`, not full-language completion, and the beta handoff itself did not claim strict-native completion.

The exact beta handoff artifact is [docs/BETA_RELEASE_HANDOFF_V0_1.md](docs/BETA_RELEASE_HANDOFF_V0_1.md). Post-beta strict-native closure for the current named slices was completed on 2026-07-13: Ruby, PHP, Dart, Go, Kotlin, Elm, and Gleam now have narrow native gates alongside the earlier JavaScript, TypeScript, `.ls`, Lua, Python, C#, C, C++, Java, and Rust gates. These remain limited slices, not broad language support. The post-beta Denali route has now sealed its started handoff slices through the 2026-07-16 release-candidate audit in [docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md). Current forward motion lives in [docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md): new proof layers, schema-valid IR surface reconciliation, final API/runtime freeze, compatibility seal, and release-grade evidence generation.

### Compact Beta Quick Start

```bash
npm install
npm run beta:readiness
npm run beta:preflight
npm run beta:full
```

Good first validation targets are small JavaScript or `.ls` programs, `tests/actual_programs/fixtures/`, and `examples/supported_math_showcase.ls`. Avoid treating broad multi-language demos or the full Unicode mathematical DSL as baseline beta proof; those remain experimental unless a current gate names and verifies the slice.

### Known Limitations / Post-Beta Route

Beta v0.1 ships as scoped truth, not as a final summit claim. The former post-beta runtime limitation list has been removed for the current named strict-native slices, and any future setup-blocked lane must stay labeled until its native gate passes. Remaining post-beta work is broader support expansion and canonical `1.0` definition: stable `.ls` identity, supported profiles, package/runtime expectations, examples, docs, and support boundaries.

Language broadening now follows [docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md): manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry must be `MET` or explicitly `EXCLUDED` before a slice can be promoted.

### Current `.ls` Identity And Profiles

Current supported `.ls` identity is a verified JS-like executable slice plus a top-level keyword-block meta layer: `meta`, `repair`, and `verify`. It is not yet a separate full general-purpose language spec.

Current supported `.ls` profile set is limited to:

- `portable_semantics_v1` as the implicit executable baseline for raw `.ls`.
- `portable_semantics_v1` as an explicit reusable semantic-adapter profile.
- `portable_v1` as an explicit cross-target policy profile.

No other profile names are supported in the current V0.16 contract. Explicit profile declarations remain distinct from the implicit baseline, and profile assertion failures are part of the supported boundary.

The identity-contract fixture `meta_identity_contract_portable_slice.ls` now combines existing `portable_v1` plus `portable_semantics_v1` profiles with top-level `meta`, `repair`, and `verify` blocks. It proves target stdout across Lua, JavaScript, Python, and emitted `.ls`, asserts supported parser feature slices, and explicitly excludes broad unsupported syntax such as classes, for-of, try/catch, and template literals.

### Canonical `1.0` Package And Runtime Expectations

The active public API/runtime contract draft is [docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md). It names package entrypoints, root exports, CLI/API surface, Node/runtime expectations, package files, semver policy, compatibility policy, and release-action boundaries for real `1.0`.

The current package identity is `luascript` at `0.1.0-beta.0` on the pre-production beta track. `src/unified_luascript.js` remains the package entrypoint, and the current publish file list is limited to `src/`, `test/`, `README.md`, and `LICENSE`. That is a beta package surface, not a canonical `1.0` publish promise.

The 2026-07-16 no-release Denali freeze candidate records current truth only. The package has no declared `exports` map, no npm `bin`, and no global CLI contract; root package import resolves through `package.json#main`, while direct `node src/index.js` command handling remains non-public unless a future release promotes it. Root-level `runtime/` helpers exist for local Lua examples/tests but are outside the current package `files` promise. Release, changelog, artifact-signing, tag, publish, and version-bump scripts remain explicit release actions, not readiness gates; the package version stays `0.1.0-beta.0`.

Local validation starts with `npm install`; `npm ci` is the lockfile-exact automation path. `npm run build` is a readiness smoke, not a production bundle. The package currently declares `node >=14.0.0`; canonical `1.0` must either keep that runtime floor with passing evidence or raise it with an explicit compatibility note.

Native-runtime support is claimed only when the corresponding `npm run language:<name>:bidirectional` gate invokes the real runtime command and passes. Target-runtime IR lanes are useful evidence for emitted behavior, but they do not replace native runtime qualification.

### Bidirectionality Contract

`Bidirectional` is a named-slice verification term, not a blanket claim of universal translation, lossless source recovery, round-trip source identity, or complete semantic equivalence. The current contract separates native execution, source-to-IR lowering, IR-to-target emission, target-runtime behavior, emitted `.ls`, round-trip source identity, and semantic equivalence. A `language:<name>:bidirectional` gate may prove several of those layers for a manifest slice, but only [docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md) defines which layer may be claimed and what proof it needs.

The first narrow round-trip probe is `npm run test:roundtrip-probe`. It starts with tiny JavaScript, `.ls`, and Python slices and separates structural IR reparse checks from runtime-output equivalence checks. Structural IR reparse is stronger evidence than stdout matching, but it is still not source text identity or broad semantic equivalence. The source-preserving `.ls` suite is `npm run test:source-identity-probe`: it now covers 15 fixtures, with 12 positive normalized `.ls` source identity, normalized parser-owned AST identity, and normalized IR identity checks plus 3 separate expected unsupported diagnostics. It writes `artifacts/conformance/source-identity-probe-report.json` and keeps token-level identity, runtime-output equivalence, broad lossless recovery, and semantic equivalence separate from the normalized identity count.

No tag, publish, GitHub release, or package version bump is part of this route unless a release action is explicitly requested.

### Example Boundary Map

First examples for the current beta and early `1.0` route should stay inside named evidence:

- Small JavaScript programs that fit the V1 Ring 2 slice.
- Small `.ls` programs that fit the JS-like executable slice and V0.16 meta layer.
- `tests/actual_programs/fixtures/`.
- `examples/supported_math_showcase.ls`.
- `examples/mathematical_notation_core.ls` and `examples/mathematical_notation_rehab_v1.ls` through `examples/mathematical_notation_rehab_v18.ls`.

Do not use broad multi-language demos, full Unicode mathematical DSL claims, or unsupported `.ls` profile names as first validation targets. They can become examples only after a current manifest, runtime gate, docs boundary, and claim check name the slice.

## Current Snapshot

- Core JavaScript to Lua transpilation works for focused small-to-medium programs through the unified/core IR path.
- `npm test` and `npm run status:check` are expected to pass in the current baseline.
- `npm run verify` passes after baseline hardening; `refactor:lint` still reports non-blocking warnings below the current budget.
- `npm run clarity:dogfood` is the live LUASCRIPT dogfood gate; `npm run clarity:canon` is the strict local canon gate; `npm run clarity:canon:super` isolates the scoped governed Super Canon probes; `npm run clarity:languages` guards experimental-language claims.
- `npm run language:javascript:bidirectional`, `npm run language:typescript:bidirectional`, `npm run language:luascript:bidirectional`, `npm run language:lua:bidirectional`, `npm run language:python:bidirectional`, `npm run language:csharp:bidirectional`, `npm run language:c:bidirectional`, `npm run language:cpp:bidirectional`, `npm run language:java:bidirectional`, `npm run language:rust:bidirectional`, `npm run language:ruby:bidirectional`, `npm run language:php:bidirectional`, `npm run language:dart:bidirectional`, `npm run language:go:bidirectional`, `npm run language:kotlin:bidirectional`, `npm run language:elm:bidirectional`, and `npm run language:gleam:bidirectional` are the current strict native language-completion gates for named slices.
- `npm run language:implemented:bidirectional` regenerates the implemented-language reports, and `npm run beta:readiness` verifies the scoped non-strict pre-production beta v0.1 threshold: every implemented lane must have a fresh passing report above 90%. `npm run beta:readiness:strict` additionally requires the current strict-native blocker set to stay closed. `npm run beta:preflight` and `npm run beta:full` are the focused and full local beta acceptance sweeps; both passed on 2026-06-19 and were refreshed green on 2026-07-14.
- Durable conformance reports are written under `artifacts/conformance/`: `canonical-ir-conformance-report.json`, `roundtrip-probe-report.json`, `source-identity-probe-report.json`, and `unsupported-diagnostics-report.json`.
- `npm run test:luascript-meta` verifies the `.ls` V0.16 meta-language slice for top-level Lua/JavaScript/Python target policy, embedded stdout/diagnostic/target-emission/target-runtime-success/target-runtime-failure/policy verification blocks, Lua `continue` resolution, target capability negotiation, semantic adapters, canonical repair blocks, packed multiple returns, Python target JS-truthiness plus indexing/length/slicing/string-coercion/packed-multiple-return execution, identity-contract feature/profile assertions, diagnostics, and runtime stripping.
- `npm run test:parser-ownership` verifies that active `.ls` parsing is owned by `src/parser/enhanced_parser.py`, with the transpiler consuming parser artifacts and helper APIs instead of duplicating syntax parsing.
- `npm run test:lua-input` verifies the current Lua input V2.1 slice through canonical IR to Lua, JavaScript, supported `.ls`, and Python outputs.
- Python source now has a V1.3 bounded sequence-slice foothold: `sequence_slice_access.py` proves string/list slices across native Python and emitted Lua/JavaScript/`.ls`/Python, while slice steps and slice assignment remain explicit unsupported diagnostics.
- Lua input now has a V2.1 table-index Python-target foothold: the Lua manifest targets Python for the current named slice, one-based table indexing is repaired in emitted Python, `table_index_read_write.lua` proves read/write table index behavior, and `test:lua-input` executes emitted Python alongside Lua/JavaScript/`.ls`.
- JavaScript source now has targeted Ring 3 footholds beyond V1 Ring 2: plain template literals, zero-based index/length, and a narrow branch-depth slice for return-only `switch` statements plus conditional expressions. `ring3_switch_conditional` is runtime-backed through native JavaScript and emitted Lua/JavaScript; emitted `.ls` shape is conformance-checked without runtime promotion, Python switch emission is a target diagnostic, and JavaScript `try/catch` remains an explicit unsupported diagnostic.
- `examples/mathematical_notation_core.ls` plus `examples/mathematical_notation_rehab_v1.ls` through `examples/mathematical_notation_rehab_v18.ls` are the current executable mathematical-notation slices recovered from the experimental showcase: V0/V1 cover core Unicode math, arrows, pipelines, ranges, let-in expressions, implicit multiplication, exponentiation, `mod`, and pattern branches; V2/V3 add composition, operator sections, tuple callbacks, tuple-object returns, set operators, default parameters, and multiline math blocks; V4 adds the tested complex-number/FFT helper slice; V5 adds deterministic series/calculus helper checks; V6 adds bracketed native symbolic binder forms; V7 adds braced math-native lower/upper binder notation integrated with pipelines and pattern branches; V8 adds native derivative and limit binder notation; V9 adds definite integral differential shorthand; V10 adds bare definite-integral bodies such as `∫_{0}^{π} sin(x) dx`; V11 adds executable physics/EE vector-calculus symbols and helpers: `·`, `⨯`, `⊗`, `∇`, `gradient`, `divergence`, `curl`, `norm`, and `unit`; V12 adds executable dimension-aware unit helpers plus electrical phasor/impedance helpers such as `volts`, `amps`, `ohms`, `unit_add`, `unit_div`, `phasor`, `phase`, `impedance_L`, `impedance_C`, `series_impedance`, and `parallel_impedance`; V13 adds operator-level unit arithmetic and matrix/linear physics helpers such as `matrix`, `transpose`, `matmul`, `matrix_vector`, `determinant2`, `solve2`, `identity`, `trace`, and `lorentz_force`; V14 adds the first symbolic physics seed with `sym`, `equation`, `symbolic_simplify`, `symbolic_evaluate`, `solve_linear`, symbolic vector operators, and named physics/EE formula rendering; V15 adds dimension-aware symbolic variables, symbolic dimension assertions, and small linear equation-system solving for circuit-style laws; V16 adds symbolic derivatives, symbolic substitution, dimension-aware RC/RL transfer functions, symbolic impedances, and voltage-divider helpers; V17 adds executable frequency-response evaluation, cutoff/time-constant helpers, RLC resonance/Q/bandwidth helpers, and symbolic series-RLC impedance; V18 adds swept frequency-response arrays, Bode column extraction, peak/trough/nearest lookup, monotonic checks, and dB crossing estimation.
- `npm run claims:check` verifies active mathematical and `.ls` claims against current docs, fixtures, manifests, runtime hooks, and package metadata.
- `npm run stubs:check` is the active operational-stub gate. It fails on active implementation stubs and reports intentional diagnostics/archive candidates separately.
- Multi-language support beyond JavaScript to Lua is experimental unless backed by parser, transpiler, runtime, and integration tests.

## Supported Language Reality

- Practical V0.16/V1 Ring 2 verified: limited JavaScript input and LUASCRIPT `.ls` JS-like input plus the `.ls` V0.16 meta layer. JavaScript also has targeted Ring 3 template, index/length, and switch/conditional-expression footholds. TypeScript now has a partial V0.25 typed-JS small-program slice.
- Partial verified: Lua input V2.1, Python V1.3, C# V0.5, C V0.3, and C++ V0.4 for their documented small-program slices. Lua V2.1 adds emitted-Python target runtime coverage for the named table/index/math/length/ipairs slice; Python V1.3 adds bounded sequence slices while slice steps and slice assignment stay unsupported. C V0.3 includes narrow record support; C++ V0.4 extends that slice with simple public constructors and instance methods lowered through canonical IR, not broad C/C++ object systems.
- Experimental: PHP, Dart, Go, Kotlin, Elm, and Gleam paths, plus broader Ruby/Java/Rust/C#/C/C++ beyond the verified slices. PHP, Dart, Go, Ruby, Java, Rust, Kotlin, Elm, and Gleam now have narrow native bidirectional gates, not broad full-language support.
- Pre-production beta v0.1 is scoped and non-strict: the implemented lanes pass their named slices above the 90% readiness threshold, and the focused/full beta gates pass. It does not mean full-language completion, production readiness, or canonical `1.0`.
- Not production-ready: broad multi-language claims based only on tokenizer, parser smoke, shallow codegen, or isolated phase reports.

## Local Commands

- Install for local beta validation: `npm install` (`npm ci` is fine for lockfile-exact automation)
- Core tests: `npm test`
- Status consistency: `npm run status:check`
- Full verification gate: `npm run verify`
- Canonical IR conformance, value-semantics matrix, control-flow matrix, function/scope matrix, and data-structure matrix: `npm run test:ir-conformance`
- Scoped 25-case edge-case matrix generator for value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics: `npm run test:edge-matrix`
- Unsupported diagnostics certification for named unsupported JavaScript, `.ls`, Python, Lua, core-fallback, and target-emitter failures: `npm run test:unsupported-diagnostics`
- Release-shaped `.ls` source identity suite with 12 normalized source/AST/IR identity checks and 3 expected diagnostics: `npm run test:source-identity-probe`
- Round-trip probe harness for tiny structural IR reparse and runtime-output equivalence cases: `npm run test:roundtrip-probe`
- Actual program suite: `npm run test:actual-programs`
- Lua input V2.1 qualification: `npm run test:lua-input`
- JavaScript V1 Ring 2 plus targeted Ring 3 footholds bidirectional gate: `npm run language:javascript:bidirectional`
- TypeScript V0.25 typed-JS bidirectional gate: `npm run language:typescript:bidirectional`
- LUASCRIPT `.ls` V1 Ring 2 bidirectional gate: `npm run language:luascript:bidirectional`
- C V0.3 record bidirectional gate: `npm run language:c:bidirectional`
- C++ V0.4 class-method bidirectional gate: `npm run language:cpp:bidirectional`
- Go V0.25 target-runtime canonical-IR lane: `npm run language:go:ir-targets`; native Go bidirectional gate: `npm run language:go:bidirectional`
- Rust V0.25 target-runtime canonical-IR lane: `npm run language:rust:ir-targets`; native Rust bidirectional gate: `npm run language:rust:bidirectional`
- Kotlin V0.25 target-runtime canonical-IR lane: `npm run language:kotlin:ir-targets`; native Kotlin bidirectional gate: `npm run language:kotlin:bidirectional`
- Java V0.6 target-runtime canonical-IR lane: `npm run language:java:ir-targets`; native Java bidirectional gate: `npm run language:java:bidirectional`
- PHP V0.6 target-runtime canonical-IR lane: `npm run language:php:ir-targets`; native PHP bidirectional gate: `npm run language:php:bidirectional`
- Ruby V0.6 target-runtime canonical-IR lane: `npm run language:ruby:ir-targets`; native Ruby bidirectional gate: `npm run language:ruby:bidirectional`
- Dart V0.6 target-runtime canonical-IR lane: `npm run language:dart:ir-targets`; native Dart bidirectional gate: `npm run language:dart:bidirectional`
- Elm V0.6 target-runtime canonical-IR lane: `npm run language:elm:ir-targets`; native Elm bidirectional gate: `npm run language:elm:bidirectional`
- Gleam V0.6 target-runtime canonical-IR lane: `npm run language:gleam:ir-targets`; native Gleam bidirectional gate: `npm run language:gleam:bidirectional`
- Implemented-language beta report refresh: `npm run language:implemented:bidirectional`
- Pre-production beta v0.1 readiness audit: `npm run beta:readiness`
- Pre-production beta v0.1 preflight: `npm run beta:preflight`
- Full pre-production beta v0.1 acceptance sweep: `npm run beta:full`
- LUASCRIPT `.ls` V0.16 meta-language gate: `npm run test:luascript-meta`
- Active `.ls` parser ownership gate: `npm run test:parser-ownership`
- Mathematical notation core/rehab V18: `examples/mathematical_notation_core.ls`, `examples/mathematical_notation_rehab_v1.ls`, `examples/mathematical_notation_rehab_v2.ls`, `examples/mathematical_notation_rehab_v3.ls`, `examples/mathematical_notation_rehab_v4.ls`, `examples/mathematical_notation_rehab_v5.ls`, `examples/mathematical_notation_rehab_v6.ls`, `examples/mathematical_notation_rehab_v7.ls`, `examples/mathematical_notation_rehab_v8.ls`, `examples/mathematical_notation_rehab_v9.ls`, `examples/mathematical_notation_rehab_v10.ls`, `examples/mathematical_notation_rehab_v11.ls`, `examples/mathematical_notation_rehab_v12.ls`, `examples/mathematical_notation_rehab_v13.ls`, `examples/mathematical_notation_rehab_v14.ls`, `examples/mathematical_notation_rehab_v15.ls`, `examples/mathematical_notation_rehab_v16.ls`, `examples/mathematical_notation_rehab_v17.ls`, `examples/mathematical_notation_rehab_v18.ls`
- Mathematical and `.ls` claim audit: `npm run claims:check`
- Lua input V2.1 bidirectional gate: `npm run language:lua:bidirectional`
- Python V1.3 bidirectional gate: `npm run language:python:bidirectional`
- Archive/reference audit: `npm run archive:audit`
- Live Clarity dogfood: `npm run clarity:dogfood`
- Strict Clarity canon: `npm run clarity:canon`
- Scoped governed Super Canon shard: `npm run clarity:canon:super`
- Language qualification gate: `npm run clarity:languages`
- Active stub inventory: `npm run stubs:scan`
- Active stub gate: `npm run stubs:check`
- Static warning gate: `npm run static:warnings`

`clarity:dogfood` writes `artifacts/clarity_canon/dogfood-report.json` and supports `CLARITY_DOGFOOD_FILTER`, `CLARITY_DOGFOOD_TAGS`, and `CLARITY_DOGFOOD_SHARD=INDEX/TOTAL`.

## Documentation Map

- Beta release handoff: [docs/BETA_RELEASE_HANDOFF_V0_1.md](docs/BETA_RELEASE_HANDOFF_V0_1.md)
- Denali 1.0 summit ledger: [docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md)
- Big Remaining Climb master ledger: [docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md)
- Canonical 1.0 exit criteria charter: [docs/LUASCRIPT_1_0_EXIT_CRITERIA.md](docs/LUASCRIPT_1_0_EXIT_CRITERIA.md)
- Bidirectionality contract: [docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md)
- Canonical IR semantics inventory: [docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md](docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md)
- Canonical IR semantics spec v0: [docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md](docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md)
- Language depth accession rules: [docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](docs/LUASCRIPT_LANGUAGE_ACCESSION_RULES.md)
- Public API/runtime contract: [docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)
- Conformance evidence binder: [docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md)
- Conformance evidence bundle index: [docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md)
- Mega plan: [docs/LUASCRIPT_MEGA_PLAN.md](docs/LUASCRIPT_MEGA_PLAN.md)
- Denali expedition ledger: [docs/LUASCRIPT_DENALI_SOLOIST_LEDGER.md](docs/LUASCRIPT_DENALI_SOLOIST_LEDGER.md)
- Documentation index: [docs/INDEX.md](docs/INDEX.md)
- Language support matrix: [docs/LANGUAGE_SUPPORT_MATRIX.md](docs/LANGUAGE_SUPPORT_MATRIX.md)
- Language completion rules: [docs/LANGUAGE_COMPLETION_RULES.md](docs/LANGUAGE_COMPLETION_RULES.md)
- LuaScript living meta-language: [docs/LUASCRIPT_LIVING_META_LANGUAGE.md](docs/LUASCRIPT_LIVING_META_LANGUAGE.md)
- LuaScript meta-language V0.16: [docs/LUASCRIPT_META_LANGUAGE_V0.md](docs/LUASCRIPT_META_LANGUAGE_V0.md)
- Mathematical notation core/rehab V18: [docs/LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md](docs/LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md)
- Quick start: [docs/quick-start/README.md](docs/quick-start/README.md)
- Architecture: [docs/architecture/README.md](docs/architecture/README.md)
- Reference boundary: [docs/reference/README.md](docs/reference/README.md)
- Canonical IR spec: [docs/canonical_ir_spec.md](docs/canonical_ir_spec.md)
- Canonical IR versioning: [docs/VERSIONING.md](docs/VERSIONING.md)
- IR architecture: [docs/ir/ARCHITECTURE.md](docs/ir/ARCHITECTURE.md)
- IR usage guide: [docs/ir/USAGE_GUIDE.md](docs/ir/USAGE_GUIDE.md)
- Archive root: [docs/OLD LUASCRIPT DOCS/README.md](<docs/OLD LUASCRIPT DOCS/README.md>)

Avoid using old phase-completion or championship reports as implementation truth. Those documents are historical artifacts once moved under `docs/OLD LUASCRIPT DOCS/`.
