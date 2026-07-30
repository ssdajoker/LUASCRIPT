# LUASCRIPT Bidirectionality Contract

Status: active contract
Last updated: 2026-07-29
Track: Denali canonical `1.0`, criterion `1.0-BIDIRECTIONALITY`

This document defines what LUASCRIPT means by `bidirectional`. The term is slice-based and evidence-based. It does not mean universal language-to-language translation, lossless source recovery, full round-trip identity, or complete semantic equivalence unless a specific slice, fixture set, gate, and doc explicitly prove that narrower claim.

Current `language:<name>:bidirectional` scripts are language-completion harness gates. They verify a named source slice through native execution, source-to-IR lowering, IR-to-target emission, target-runtime execution, same-language or declared target emission, expected diagnostics, and report generation where the manifest requires those checks. They do not, by their script name alone, certify all syntax, all runtimes, all language pairs, source formatting preservation, or certification-grade semantics.

## Evidence Layers

| Layer | What it proves | Current evidence shape | What it does not prove |
| --- | --- | --- | --- |
| Native execution | The original fixture source runs under the real source runtime and matches expected stdout or expected runtime failure. | `language:<name>:bidirectional` fixtures without `skipNative`, native compiler/runtime commands, and `artifacts/language_completion/*-report.json`. | It does not prove IR correctness, emitted target behavior, or full native-language support outside the fixture slice. |
| Source-to-IR | The parser/lowerer accepts the source slice and produces the current bridge or canonical IR shape without unsupported-feature drift. | `CoreLanguageBridge.compileToIR`, language lowerers, manifest expected failures, IR validation where available. | It does not prove that every emitted target compiles or runs. |
| IR-to-target | A supported emitter produces non-empty target source for the manifest target and required emitted-output snippets. | `CoreLanguageBridge.emitFromIR`, per-target emitter checks, embedded `verify <target>_contains` and `<target>_not_contains` assertions. | It does not prove runtime behavior unless the emitted target is executed. |
| Target-runtime | Emitted target source compiles/runs through the target runtime and matches expected stdout or expected runtime failure. | Harness target execution for Lua, JavaScript, `.ls`, Python, C#, C, C++, and other wired target runtimes where manifests name them. | It does not qualify the target language's native source slice; that requires that target's own native gate. |
| Emitted `.ls` | The `.ls` target output exists, preserves required policy/repair/verification text where claimed, and runs when the harness executes the `.ls` target. | `.ls` target fixtures, meta verification blocks, `npm run test:luascript-meta`, and target-runtime `.ls` checks in language manifests. | It does not make emitted `.ls` a final full `.ls` language spec or a lossless source representation. |
| Round-trip source identity | Source can be lowered, re-emitted to the same source language, parsed again, and compared for stable source identity or declared AST/IR identity. | `npm run test:source-identity-probe` now proves normalized `.ls` source identity, normalized parser-owned AST identity, and normalized current bridge IR identity for 12 positive `.ls` fixtures, plus 3 expected unsupported diagnostics. Other same-language emission remains behavior evidence unless a fixture declares an identity check. | Current bidirectional gates do not guarantee token-level formatting, comments, exact spelling, runtime behavior, broad syntax coverage, or lossless reconstruction. |
| Token identity | Source can be re-emitted with exact token-level text identity under a documented policy. | `npm run test:source-identity-probe` records token-level text identity as measured, non-gating fixture metadata for `.ls`; the token policy keeps this separate from normalized source identity. | It does not prove broad lossless recovery, comment preservation, whitespace preservation, or source identity unless a route promotes it with explicit fixtures. |
| Semantic equivalence | Native source behavior and emitted target behavior agree for the declared semantics, including edge cases and target deltas. | `PARTIAL`: current gates compare expected stdout/diagnostics for named fixtures; conformance matrices add scoped value/control/function/data evidence. | It is not exhaustive semantic equivalence, not all edge cases, not all side effects, and not all language-defined behavior. |

## Claim Levels

Use these levels when writing docs, reports, or release notes:

| Claim level | Allowed wording | Required proof |
| --- | --- | --- |
| `native-runtime-qualified` | "The named native slice passes `npm run language:<name>:bidirectional`." | Native source execution or compile/run evidence in the current harness report. |
| `source-to-ir-qualified` | "The named source slice lowers to the current IR path." | Parser/lowerer evidence plus expected diagnostics for unsupported features. |
| `ir-to-target-qualified` | "The named IR/source slice emits target source for listed targets." | Non-empty emitted output plus required contains/not-contains assertions. |
| `target-runtime-qualified` | "The emitted target runtime behavior matches the fixture expectation for this slice." | Target compile/run or expected runtime-failure evidence. |
| `emitted-ls-qualified` | "The `.ls` target is verified for this fixture/profile." | `.ls` emitted-output assertions and `.ls` runtime checks where claimed. |
| `round-trip-identity-qualified` | "Round-trip source identity is verified for this slice." | A current fixture that explicitly checks source -> IR -> same-source emission -> parse/lower -> identity or declared equivalence. |
| `semantic-equivalence-qualified` | "Semantic equivalence is verified for this bounded behavior matrix." | A conformance or language fixture matrix that names the behavior, target deltas, positive cases, negative cases, and runtime evidence. |

If a claim cannot name one of these levels and its proof, it must stay as future work or be rewritten as a narrower evidence statement.

## Current Round-Trip Probe Harness

The first narrow probe is `npm run test:roundtrip-probe`, backed by `tests/roundtrip/manifest.json` and `tests/roundtrip/roundtrip_probe.test.js`.

It has two modes:

- `structural-ir-reparse`: source -> current bridge IR -> emitted target -> current bridge IR must preserve normalized IR after generated IDs, source locations, and raw literal fields are removed. Same-language probes preserve and compare metadata; cross-language probes exclude source-specific metadata and report that weaker normalization policy. This is real IR reparse evidence for the tiny fixture, but it is not source text identity, formatting preservation, comment preservation, raw-literal preservation, or a full language semantic proof.
- `runtime-output-equivalence`: source runtime and emitted target runtime must produce the same stdout for the fixture. This is useful behavioral evidence, but it is weaker than structural IR reparse because the emitted target may use helpers or target idioms that are not yet reparsed by the target input slice.

Current tiny structural IR reparse probes cover JavaScript -> JavaScript, JavaScript -> emitted `.ls`, `.ls` -> JavaScript, Python -> Python, and Lua -> Lua. The same-language probes compare metadata; the Lua probe preserves `sourceLanguage` and `luaLocal` metadata while excluding only `loc`, `range`, `raw`, and generated `id` fields. It does not prove source-text, token, comment, or formatting identity. Current runtime-output equivalence probes cover JavaScript -> Python and Python -> JavaScript. The harness intentionally does not claim broad round-trip source identity or complete semantic equivalence.

`tests/roundtrip/manifest.json` now also records a per-language layer-evidence map for JavaScript, `.ls`, Python, and Lua, and `artifacts/conformance/roundtrip-probe-report.json` writes that map alongside the probe results. This map is accounting, not promotion: it records which layers are proven, seeded, partial, measured, or not claimed.

## Current JS/.ls/Python/Lua Layer Map

| Language | Native execution | Source-to-IR | IR-to-target | Target-runtime | Emitted `.ls` | Structural IR reparse | Normalized source identity | Token identity | Semantic equivalence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| JavaScript | `PROVEN` named slice via `npm run language:javascript:bidirectional` | `PROVEN` named slice | `PROVEN` named targets | `PROVEN` named targets plus tiny JS -> Python runtime-output probe | `PROVEN` emitted target for named fixtures | `SEEDED` by JS -> JS and JS -> `.ls` probes | `NOT CLAIMED` | `NOT CLAIMED` | `PARTIAL`: fixture stdout/diagnostics only |
| `.ls` | `PROVEN` named slice via `npm run language:luascript:bidirectional` | `PROVEN` named slice | `PROVEN` named targets | `PROVEN` named targets where the manifest/profile requires execution | `PROVEN` emitted target and identity fixtures | `SEEDED` by `.ls` -> JS plus `.ls` -> `.ls` source-identity IR checks | `PROVEN` for 12 positive source-identity fixtures | `MEASURED`, non-gating | `PARTIAL`: language/runtime fixture behavior only |
| Python | `PROVEN` named slice via `npm run language:python:bidirectional` | `PROVEN` named slice | `PROVEN` named targets | `PROVEN` named targets plus tiny Python -> JS runtime-output probe | `PROVEN` emitted target for named fixtures | `SEEDED` by Python -> Python probe | `NOT CLAIMED` | `NOT CLAIMED` | `PARTIAL`: fixture stdout/diagnostics only |
| Lua | `PROVEN` named slice via `npm run language:lua:bidirectional` | `PROVEN` named slice | `PROVEN` named targets | `PROVEN` named targets | `PROVEN` emitted target for named fixtures | `SEEDED` by one Lua -> Lua normalized Program-IR reparse probe | `NOT CLAIMED` | `NOT CLAIMED` | `PARTIAL`: fixture stdout/diagnostics only |

## Current `.ls` Source Identity Probe

The current `.ls` source-preserving probe is `npm run test:source-identity-probe`, backed by `tests/roundtrip/source_identity_manifest.json` and `tests/roundtrip/source_identity_probe.test.js`.

It compares source -> parser-owned AST -> current bridge IR -> emitted `.ls` -> parser-owned AST -> current bridge IR for the 12 positive `.ls` source-identity fixtures. The parser-owned AST artifact is `src/parser/enhanced_parser.py::parse_artifact`; the comparator normalizes dataclass AST JSON and excludes the token stream and trivia. The current report records 12 normalized source identity checks, 12 normalized parser-owned AST identity checks, 12 normalized current bridge IR identity checks, and 3 expected unsupported diagnostics.

This is a bounded `.ls` identity tier. It does not prove token-level text identity, comment preservation, formatter identity, runtime-output equivalence, broad lossless source recovery, broad `.ls` syntax coverage, or broad semantic equivalence.

## Current Gate Meaning

A passing `language:<name>:bidirectional` gate currently means all of the following for that language manifest's named slice:

1. The manifest is `qualified` and all listed fixture sources exist.
2. Runnable fixtures lower from source to IR.
3. Native source execution passes unless the fixture explicitly opts out with `skipNative`.
4. Each declared target emits non-empty source.
5. Each emitted target compiles/runs or fails with the declared diagnostic.
6. Expected stdout, runtime-failure, emitted-output, policy, and repair assertions are honored.
7. A report is written under `artifacts/language_completion/`.

It does not mean:

1. every syntax feature in the source language is supported
2. arbitrary source can be translated to arbitrary target language pairs
3. emitted code can be losslessly converted back to the original source spelling
4. comments, formatting, raw literals, import layout, or source identity are preserved
5. all target runtime semantics are equivalent outside the named fixtures
6. target-runtime IR lanes replace native runtime qualification
7. Denali canonical `1.0` or true omni-language 100% has been reached

## Documentation Rules

- Say `bidirectional gate` only with the language name, support slice, and command.
- Say `native runtime` only when the real runtime command passes through the named gate.
- Say `target-runtime` when emitted target code runs but the target's own native source gate is not being qualified.
- Say `emitted .ls` only for generated `.ls` output or `.ls` target-runtime checks; do not treat it as source identity.
- Say `round-trip source identity` only when an explicit round-trip identity fixture exists.
- Say `normalized parser-owned AST identity` only for the positive `.ls` fixtures covered by `npm run test:source-identity-probe`; do not imply token/trivia preservation or broad lossless recovery.
- Say `semantic equivalence` only when the behavior matrix, target deltas, and evidence are named.
- Treat archived "full round-trip" or old "all translation pairs" language as historical evidence only, never current status.

## Denali 1.0 Exit Rule

Canonical `1.0` cannot use an unqualified `bidirectional` claim. Each `1.0` language/profile must have a row that names:

1. native execution status
2. source-to-IR status
3. IR-to-target targets
4. target-runtime status
5. emitted `.ls` status, if claimed
6. round-trip source identity status
7. semantic equivalence status

Any row with missing proof must say `OPEN`, `PARTIAL`, `MISSING EVIDENCE`, or `EXCLUDED`, not imply completion through the word `bidirectional`.
