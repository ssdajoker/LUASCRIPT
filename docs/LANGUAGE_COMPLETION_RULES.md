# Language Completion Rules

Last updated: 2026-07-14

Language completion is slice-based and evidence-driven. A language is complete only for a named slice and completion ring when its strict bidirectional gate proves parser, canonical IR lowering, target emission, runtime execution, same-language emission, unsupported diagnostics, and docs alignment.

## Package/Runtime Boundary

Package identity and runtime claims follow the active stable contract:
`luascript@1.0.1`, entrypoint `src/unified_luascript.js`, default
`npm install`, lockfile-exact `npm ci`, consumer Node floor
`node >=14.17.0`, exact runtime TypeScript `5.9.3`, and `npm run build` as a
readiness smoke only. `npm run test:package-contract` is the installed-package
boundary gate. Native-runtime claims require the real runtime command plus a
passing `language:<name>:bidirectional` gate. Target-runtime IR lanes prove
emitted behavior for named slices, but they do not substitute for native
qualification.

The active-docs map is [INDEX.md](INDEX.md). Archived reports, phase documents, generated snapshots, and old completion summaries cannot promote a language claim unless the current support matrix, manifests, runtime gates, and claims checks agree.

## Bidirectionality Contract

The word `bidirectional` follows [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md). Current `language:<name>:bidirectional` gates are manifest-backed slice gates; they may prove native execution, source-to-IR, IR-to-target, target-runtime behavior, emitted `.ls`, expected diagnostics, and report generation for the named slice. They do not automatically prove universal translation, lossless source recovery, round-trip source identity, or complete semantic equivalence.

Round-trip source identity requires explicit source -> IR -> same-source emission -> parse/lower -> identity or declared-equivalence fixtures. Semantic equivalence requires a named behavior matrix with target deltas, positive cases, negative cases, and runtime evidence. Until those exist for a slice, docs must say `OPEN`, `PARTIAL`, `MISSING EVIDENCE`, or `EXCLUDED`.

`npm run test:roundtrip-probe` is the first tiny harness for this boundary. Its `structural-ir-reparse` mode proves normalized current bridge IR survives source -> IR -> emitted target -> IR for that fixture. Its `runtime-output-equivalence` mode proves only stdout agreement between source runtime and emitted target runtime. Runtime-output equivalence is not a source identity claim.

## Language Depth Accession

Any broadening of a language slice follows [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md). Accession requires manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry before a support row, completion ring, emitted-target claim, or native-runtime claim can be promoted.

`PARTIAL` accession evidence can identify a foothold, but it cannot raise a language tier. A language row broadens only when every required accession gate is `MET` or explicitly `EXCLUDED` with rationale, and `npm run claims:check` guards the wording.

## Completion Rings

- Ring 1: small programs with literals, variables, arithmetic, functions, conditionals, simple loops, output, and explicit unsupported diagnostics.
- Ring 2: medium programs that combine features, including lexical closure state, nested object state, nested loops, loop `break`/`continue`, and short-circuit side effects.
- Ring 3: edge cases for scoping, coercion, indexing, loop boundaries, runtime errors, and target-language semantic mismatches.
- Ring 4: unsupported-feature diagnostics for every known parser/lowering/emitter boundary.
- Ring 5: docs/spec alignment, including a clear language identity, support matrix entry, and current verification command.

Ring promotion is cumulative. Ring 2 does not erase Ring 1; it extends it with larger executable fixtures. Full language completion remains pending until all declared rings for that language pass live gates.

Current strict gates:

- `npm run language:javascript:bidirectional`
- `npm run language:typescript:bidirectional`
- `npm run language:luascript:bidirectional`
- `npm run language:lua:bidirectional`
- `npm run language:python:bidirectional`
- `npm run language:csharp:bidirectional`
- `npm run language:c:bidirectional`
- `npm run language:cpp:bidirectional`
- `npm run language:ruby:ir-targets`
- `npm run language:php:ir-targets`
- `npm run language:dart:ir-targets`
- `npm run language:java:ir-targets`
- `npm run language:go:ir-targets`
- `npm run language:rust:ir-targets`
- `npm run language:kotlin:ir-targets`
- `npm run language:elm:ir-targets`
- `npm run language:gleam:ir-targets`
- `npm run language:ruby:bidirectional`
- `npm run language:php:bidirectional`
- `npm run language:dart:bidirectional`
- `npm run language:java:bidirectional`
- `npm run language:go:bidirectional`
- `npm run language:rust:bidirectional`
- `npm run language:kotlin:bidirectional`
- `npm run language:elm:bidirectional`
- `npm run language:gleam:bidirectional`
- `npm run language:all:bidirectional`
- `npm run language:implemented:bidirectional`
- `npm run beta:readiness`
- `npm run beta:preflight`
- `npm run beta:full`

## Pre-Production Beta V0.1 Readiness

Pre-production beta readiness is not a full-language claim. It means every implemented lane has a fresh strict harness report with at least 90% fixture pass rate, and any native runtime gap is recorded as setup-blocked rather than silently skipped.

`npm run beta:readiness` reads the current language completion manifests plus `artifacts/language_completion/*-report.json`, verifies each implemented lane is still qualified, verifies report totals match manifest fixture counts, fails if any implemented lane is below the `BETA_MIN_PASS_PERCENT` threshold, and writes `artifacts/beta_readiness.json`.

`npm run language:implemented:bidirectional` regenerates the implemented-lane reports for JavaScript, TypeScript, LUASCRIPT `.ls`, Lua, Python, C#, C, C++, Java, Rust, Ruby, PHP, Dart, Go, Kotlin, Elm, and Gleam, plus their target-runtime IR lanes where split manifests exist. `npm run beta:preflight` runs those language gates, then `beta:readiness`, `status:check`, `stubs:check`, `claims:check`, and `verify`.

Every regenerated language report uses schema version 2. A release-facing report
must bind the live manifest and each fixture by SHA-256, retain the fixture
source hash on its result, record the loaded compiler/harness implementation
hashes, record successful bounded version probes for every resolved runtime,
capture Node/OS/architecture/cwd/timeout metadata, and hash the support matrix,
these completion rules, the public package contract, and the package migration
notes. A passing fixture count without that live provenance is historical
evidence only and remains `OPEN` for Denali compatibility.

`npm run test:compatibility-matrix` is the read-only Denali compatibility
binding gate. It checks the 17 implemented-native manifests and 317 fixtures,
replays recorded runtime probes, verifies exact package/dependency/Node-floor
evidence, binds release-IR schemas/reports and active manifests, and writes
`artifacts/conformance/denali-compatibility-matrix-report.json`. It does not
rerun language behavior, certify another operating system, or broaden a
language slice; run the language aggregate first.

`npm run clarity:canon` includes the beta readiness audit as a strict gate, so stale reports, manifest drift, or a sub-90% implemented lane will fail the local canon. `npm run beta:full` is the full local acceptance sweep: implemented language gates, beta readiness, dogfood, canon, language qualification, actual programs, status, stubs, claims, verify, and `npm test`.

Kotlin, Elm, and Gleam joined the strict-native named-slice set on 2026-07-13. Java, Rust, Ruby, PHP, Dart, Go, Kotlin, Elm, and Gleam now have narrow native gates with live reports, but target-runtime IR lanes and narrow native slices are still not the same as broad native bidirectional support.

Promotion rules:

- Do not promote a language from parser-only, tokenizer-only, generated snapshots, phase reports, or archived docs.
- Missing runtimes are blockers, not skips.
- Unsupported language features must fail with explicit diagnostics.
- PHP, Dart, Go, Kotlin, Elm, and Gleam stay experimental beyond their named slices. They now execute real programs through native and emitted targets for those slices, but broader behavior still requires broader fixtures.
- JavaScript and `.ls` are verified for their current V1 Ring 2 medium-program slices, not for full language coverage. JavaScript has targeted Ring 3 template-literal, index/length, and switch/conditional-expression footholds; those do not promote full JavaScript control-flow or exception semantics. `.ls` also has a V0.16 identity-contract fixture, `meta_identity_contract_portable_slice.ls`, that composes only supported profiles, asserts feature/no-feature boundaries, and proves Lua/JavaScript/Python/emitted-`.ls` stdout. TypeScript is verified only for the V0.25 typed-JS small-program slice.
- Lua input is verified for its current V2.1 small-program slice: Lua source runs natively and through emitted Lua, JavaScript, supported `.ls`, and Python for the named table/index/length/ipairs/math slice.
- Python is verified for its current V1.3 small-program slice: bounded sequence slices are supported, while slice steps and slice assignment remain explicit unsupported diagnostics.
- Go is verified for a V0.25 target-runtime canonical-IR lane plus a narrow native V0.25 bidirectional slice.
- Java is verified for a V0.6 target-runtime canonical-IR lane plus a narrow native V1 bidirectional slice.
- Rust is verified for a V0.25 target-runtime canonical-IR lane plus a narrow native V0.25 bidirectional slice.
- Ruby is verified for a V0.6 target-runtime canonical-IR lane plus a narrow native V0.6 bidirectional slice.
- PHP is verified for a V0.6 target-runtime canonical-IR lane plus a narrow native V0.6 bidirectional slice.
- Dart is verified for a V0.6 target-runtime canonical-IR lane plus a narrow native V0.6 bidirectional slice.
- Kotlin is verified for a V0.25 target-runtime canonical-IR lane plus a narrow native V0.25 bidirectional slice.
- Elm is verified for a V0.6 target-runtime canonical-IR lane plus a narrow native V0.6 bidirectional slice.
- Gleam is verified for a V0.6 target-runtime canonical-IR lane plus a narrow native V0.6 bidirectional slice.

Runtime harness notes:

- Bidirectional gates execute emitted programs with a strict runtime timeout. The default is 15000 ms and can be overridden with `LANGUAGE_RUNTIME_TIMEOUT_MS` for slower local environments.
- Timeout changes are harness ergonomics only; they do not change expected stdout, runtime-failure, or unsupported-diagnostic assertions.
- `--version` availability in the compatibility matrix is setup evidence, not a substitute for the behavior proven by the matching fresh language report.
- `examples/package/` is the installed-package example surface. The wider `examples/` tree and `tests/actual_programs/` are repository-local evidence unless a future package contract deliberately promotes them.
