# LUASCRIPT Mega Plan

Last updated: 2026-07-14

This is the canonical implementation plan and reality snapshot for LUASCRIPT. Older phase plans, completion reports, championship reports, work queues, duplicate status documents, and superseded reference material are historical evidence only after they are moved under `docs/OLD LUASCRIPT DOCS/`.

## 1. Current Reality

LUASCRIPT is currently best described as a JavaScript to Lua transpiler with a working core path, an active IR/runtime test surface, and several experimental multi-language branches.

Verified baseline:

- `npm test` passes for the current quick/core/runtime baseline.
- `npm run status:check` passes and protects the status-doc contract.
- `npm run verify` passes after baseline hardening.
- `npm run test:actual-programs` passes and verifies small programs by compile/run output.
- `npm run clarity:dogfood` passes and verifies live `.ls` fixtures, mirror samples, and the experimental mathematical showcase.
- `npm run clarity:canon` passes and is the strict local authority for remaining valid Clarity/Super Canon gates; `npm run clarity:canon:super` isolates the scoped governed Super Canon parser/memory/JSON probes.
- `npm run clarity:languages` passes and enforces that experimental language claims stay tied to explicit parser/lowering/emitter/runtime/integration evidence.
- `npm run stubs:check` passes with zero `must-fix` active stub findings.
- `npm run language:javascript:bidirectional`, `npm run language:typescript:bidirectional`, `npm run language:luascript:bidirectional`, `npm run language:lua:bidirectional`, `npm run language:python:bidirectional`, `npm run language:csharp:bidirectional`, `npm run language:c:bidirectional`, `npm run language:cpp:bidirectional`, `npm run language:java:bidirectional`, `npm run language:rust:bidirectional`, `npm run language:ruby:bidirectional`, `npm run language:php:bidirectional`, `npm run language:dart:bidirectional`, `npm run language:go:bidirectional`, `npm run language:kotlin:bidirectional`, `npm run language:elm:bidirectional`, and `npm run language:gleam:bidirectional` pass the current verified native slice completion gates. JavaScript and `.ls` are verified through V1 Ring 2 medium-program fixtures; TypeScript is verified for a V0.25 typed-JS small-program slice; C#, C, C++, Java, Rust, Ruby, PHP, Dart, Go, Kotlin, Elm, and Gleam are verified only for their named small-program slices.
- `npm run language:implemented:bidirectional` regenerates the implemented-language report set for JavaScript, TypeScript, `.ls`, Lua, Python, C#, C, C++, Java, Rust, Ruby, PHP, Dart, Go, Kotlin, Elm, and Gleam, plus their target-runtime IR lanes where split manifests exist. `npm run beta:readiness` enforces the pre-production beta v0.1 threshold by requiring every implemented lane to have a fresh passing report above 90%. `npm run beta:readiness:strict` additionally checks that the current strict-native blocker set remains closed. This readiness audit is now part of the strict Clarity canon.
- `npm run test:luascript-meta` passes the `.ls` V0.16 meta-language slice for top-level Lua/JavaScript/Python target policy, Lua `continue` resolution, capability-constrained `goto` lowering, semantic adapters, canonical repair blocks, packed multiple returns, Python target JS-truthiness plus indexing/length/slicing/string-coercion/packed-multiple-return execution, embedded Lua/JavaScript/Python/`.ls` emission assertions, target-specific runtime stdout assertions, target-specific runtime-failure assertions, Lua/JavaScript/Python policy presence/absence assertions, configured diagnostics, cross-target `.ls` policy re-emission, and compile-time stripping from emitted Lua.
- `npm run test:parser-ownership` passes and protects the active `.ls` parser contract: `enhanced_parser.py` owns parse artifacts and helper-level syntax parsing, while `enhanced_transpiler.py` consumes those parser APIs instead of carrying a parallel mini-parser.
- `npm run test:lua-input` passes the Lua input V2 qualification gate through canonical IR to Lua, JavaScript, and supported `.ls` outputs.
- `npm run claims:check` passes and verifies active mathematical notation and `.ls` claims against current docs, package metadata, manifests, fixtures, runtime hooks, transpiler mappings, and conservative unsupported-feature boundaries.
- `examples/mathematical_notation_core.ls` and `examples/mathematical_notation_rehab_v1.ls` through `examples/mathematical_notation_rehab_v18.ls` compile and run as the recovered mathematical-notation V0 through V18 slices.
- Small JavaScript examples can lower through the unified/core path and emit Lua.
- The root `npm run build` command is a readiness smoke, not a real production build.

Known blockers:

- Lint/refactor quality output is enforced by the current verify/lint gate configuration; support claims should describe the active passing policy, not stale historical warning totals.
- Examples integration requires UTF-8 console output on Windows.
- Mathematical notation core/rehab V18 is practical for a narrow executable slice. V14 adds a symbolic physics formula/equation seed; V15 adds dimension-aware symbolic variables, symbolic dimension assertions, and small linear equation-system solving. V16 covers symbolic derivatives, symbolic substitution, dimension-aware RC/RL transfer functions, symbolic impedances, and symbolic voltage-divider helpers. V17 covers frequency-response evaluation, RC/RL cutoff and time constants, RLC resonance/Q/bandwidth helpers, and symbolic series-RLC impedance. V18 covers swept frequency-response arrays, Bode column extraction, peak/trough/nearest lookup, monotonic checks, and dB crossing estimation. The full Unicode mathematical DSL remains experimental; `examples/experimental/mathematical_showcase.ls` now executes end to end as an experimental dogfood fixture, but it is not a broad full-DSL production claim.
- `src/transpiler_universal.js` is now a bridge-based advisory facade. It is useful only as an honest view over active core routing, not as proof of broad all-pairs language support.
- Some IR/codegen paths still need requalification; class-like IR emission now fails explicitly instead of emitting placeholder Lua.

First canonical `1.0` package/runtime expectations:

- The active public API/runtime contract draft is `docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md`; it owns package entrypoints, root exports, CLI/API surface, Node/runtime expectations, package files, semver policy, compatibility policy, and release-action boundaries for real `1.0`.
- Current package identity is `luascript` at `0.1.0-beta.0` on the pre-production beta track; this is not a `1.0` package version.
- `src/unified_luascript.js` is the current package entrypoint, and the present package file list is `src/`, `test/`, `README.md`, and `LICENSE`. Treat that as the beta surface until a deliberate publish-surface review changes it.
- Setup starts with `npm install`; `npm ci` is the lockfile-exact automation path.
- The package currently declares `node >=14.0.0`. Canonical `1.0` must either keep that floor with passing evidence or raise it with an explicit compatibility note.
- `npm run build` is a readiness smoke, not a production bundle.
- Native-runtime support requires the corresponding runtime command on PATH and a passing `language:<name>:bidirectional` gate. Target-runtime IR lanes prove emitted behavior for named slices, but they do not count as native runtime qualification.
- Tagging, publishing, GitHub releases, or version bumps are release actions and stay out of this route unless explicitly requested.

## 2. Language Support Tiers

### Tier A: Practical Experimentation

- JavaScript input to Lua/JavaScript/`.ls` output for the V1 Ring 2 medium-program slice.
- TypeScript input to Lua/JavaScript/`.ls`/Python output for the V0.25 typed-JS small-program slice.
- LUASCRIPT `.ls` JS-like input to Lua/JavaScript/Python/`.ls` output for the V1 Ring 2 medium-program slice, plus the V0.16 keyword-block meta layer documented in `docs/LUASCRIPT_META_LANGUAGE_V0.md`.
- Lua input V2 for the documented small-program slice in `tests/lua_input/manifest.json`.
- Python input V1.2 for the documented small-program slice in `tests/language_completion/manifests/python.json`.
- C# input V0.5, C input V0.3, and C++ input V0.4 for the documented small-program slices in `tests/language_completion/manifests/`.
- Java V0.6 target-runtime canonical-IR lane for single-class static-method fixtures, primitive arrays, indexed reads/writes, enhanced `for`, boolean flow, `break`/`continue`, `.length`, `String.length()`, `String.charAt`, `Math.*`, and `System.out`, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Java execution is verified by `npm run language:java:bidirectional`.
- Go V0.25 target-runtime canonical-IR lane for package-level functions, typed parameters/returns, `var` and `:=` locals, primitive arrays, `range` over arrays, conditionals, while-style `for`, numeric `for`, `break`/`continue`, simple structs, field access/mutation, `fmt.Println`, `len`, and `math.Sqrt`, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Go execution is verified by `npm run language:go:bidirectional`.
- Rust V0.25 target-runtime canonical-IR lane for free functions, typed parameters/returns, `let`/`mut` locals, primitive arrays, array iteration, numeric ranges, conditionals, `while`, `break`/`continue`, simple structs, field access/mutation, `println!`, `.len()`, and float `.sqrt()`, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Rust execution is verified by `npm run language:rust:bidirectional`.
- Kotlin V0.25 target-runtime canonical-IR lane for free functions, typed parameters/returns, `val`/`var` locals, primitive arrays, array iteration, numeric ranges, conditionals, `while`, `break`/`continue`, data-class record fields, field access/mutation, `println`, `.size`/`.length`, and `Math.*`, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Kotlin execution is verified by `npm run language:kotlin:bidirectional`.
- PHP V0.6 target-runtime canonical-IR lane for function-oriented fixtures, numeric arrays, simple associative arrays with string identifier keys, indexed reads/writes, boolean flow, `break`/`continue`, `strlen`, `for`, variable-backed `foreach`, `count`, math calls, and output, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native PHP execution is verified by `npm run language:php:bidirectional`.
- Ruby V0.6 target-runtime canonical-IR lane for method-oriented fixtures, simple arrays/hashes, hash mutation, inclusive numeric ranges, boolean flow, `break`/`next`, string indexing/length, indexed reads/writes, `length`/`size`, math calls, and output, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Ruby execution is verified by `npm run language:ruby:bidirectional`.
- Dart V0.6 target-runtime canonical-IR lane for top-level function/list/loop fixtures, typed lists, indexed reads/writes, `for`, simple `for ... in`, boolean flow, `break`/`continue`, string length/indexing, math calls, and output, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Dart execution is verified by `npm run language:dart:bidirectional`.
- Elm V0.6 target-runtime canonical-IR lane for expression-oriented top-level definition fixtures, boolean/comparison expressions including `||` and `&&`, unary `not`, nested calls, single-line `let ... in`, literal list access, literal/top-level-constant `length`, string concatenation with `++`, and output, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Elm execution is verified by `npm run language:elm:bidirectional`.
- Gleam V0.6 target-runtime canonical-IR lane for top-level `fn`/`let`/`if` fixtures, boolean/comparison expressions including `||` and `&&`, nested calls, list helper calls, local-constant `list_length`/`string_length`, and output, executing emitted Lua/JavaScript/`.ls`/Python/C#; narrow native Gleam execution is verified by `npm run language:gleam:bidirectional`.
- Pre-production beta v0.1 candidate lanes are considered ready only for their named slices when `npm run beta:readiness` passes. This is a 90%+ implemented-lane evidence threshold, not a full-language or production-readiness claim. `npm run beta:preflight` is the focused beta gate; `npm run beta:full` is the full local acceptance sweep before tagging or publishing a beta.
- Core declarations, expressions, simple functions, and basic runtime usage are the safest test area.
- Actual-program fixtures currently cover arithmetic, functions, conditionals, `while`, `for...of`, array runtime methods, class smoke, the supported JS-like math showcase, mathematical notation core V0, and mathematical notation rehab V1 through V18.
- First-pass example boundaries for canonical `1.0` should stay inside named evidence: small JavaScript V1 Ring 2 programs, small `.ls` V0.16 executable/meta programs, actual-program fixtures, `examples/supported_math_showcase.ls`, and mathematical notation core/rehab V1 through V18. Broad multi-language demos, unsupported profile names, and full Unicode DSL material stay out until a manifest, runtime gate, docs boundary, and claim check name the slice.
- Bidirectional Ring 2 fixtures currently cover lexical closure state, nested object state, nested loops, loop `break`/`continue`, and short-circuit side-effect behavior across native and emitted targets.
- `.ls` V0.16 meta fixtures currently cover no-meta compatibility, top-level `verify` blocks for stdout, diagnostics, Lua/JavaScript/Python/`.ls` emitted-output contains/not-contains assertions, Lua/JavaScript/Python/`.ls` target-specific runtime stdout assertions, Lua/JavaScript/`.ls` target-specific runtime-failure assertions, and Lua/JavaScript/Python policy presence/absence assertions, `meta { target lua/javascript/python { ... } }` policy extraction, `repair { target lua/javascript/python { ... } }` canonical lowering repairs, `requires lua.goto`, `requires js.console`, `requires python.print`, `forbid lua.goto`, `forbid js.prototype`, `forbid python.imports`, `resolve continue using label_goto`, JavaScript/Python `native_continue` policy metadata, Python target runtime behavior for JS truthiness, zero-based indexing, `.length`, `.slice`, mixed scalar string coercion, and packed multiple returns, semantic adapters for zero-based indexing, `.length`, `.slice`, JS truthiness, string coercion, and packed multiple returns, configured `async` diagnostics, unknown-policy diagnostics, cross-target `.ls` policy re-emission, and no compile-time syntax in emitted Lua.
- Current `.ls` identity is deliberately narrow: a verified JS-like executable slice plus the top-level `meta`, `repair`, and `verify` contract layer. Current supported `.ls` profile set is `portable_semantics_v1` as the implicit executable baseline, `portable_semantics_v1` as an explicit semantic-adapter profile, and `portable_v1` as an explicit cross-target policy profile. Additional profiles should not be introduced until they remove real duplication that those profiles cannot remove cleanly.

### Tier B: Partial or Experimental

- Lua input beyond the verified V1 slice.
- C# beyond the verified V0.5 Program/static-method small-program slice.
- C beyond the verified V0.3 record small-program slice.
- C++ beyond the verified V0.4 class-method small-program slice.
- Ruby beyond the V0.6 target-runtime lane and narrow native gate.
- PHP beyond the V0.6 target-runtime lane and narrow native gate.
- Dart beyond the V0.6 target-runtime lane and narrow native gate.
- Java beyond the V0.6 target-runtime lane and narrow native V1 gate.
- Go beyond the V0.25 target-runtime lane and narrow native gate.
- Rust beyond the V0.25 target-runtime lane and narrow native gate.
- Kotlin beyond the V0.25 target-runtime and narrow native lane.
- Elm beyond the V0.6 target-runtime and narrow native lane.
- Gleam beyond the V0.6 target-runtime and narrow native lane.

These paths may have tokenizers, parsers, partial backends, phase tests, or generated code, but they are not production-ready until each path has end-to-end parser, IR/lowering, emitter, runtime, and integration coverage.

### Tier C: Historical or Unverified Claims

Any language or feature described as complete only by old phase reports, victory reports, championship dashboards, shallow parser tests, or standalone codegen tests is not considered supported until reverified against the current test gates.

## 3. Consolidated Roadmap

### Phase 1: Make JavaScript to Lua Trustworthy

- Keep the canonical JavaScript to Lua path green under `npm test`.
- Keep recovering the mathematical showcase by tested slices: V0 covers executable function notation/operators/constants/subscripts; V1 covers arrow lambdas, pipelines, ranges, `let ... in`, implicit multiplication, exponentiation, `mod`, and simple pattern branches; V2/V3 cover composition, operator sections, multiline math blocks, tuple callbacks, tuple-object returns, set operators, default parameters, and bound symbolic identifiers; V4 covers the tested complex-number/FFT helper slice; V5 covers deterministic series/calculus helper checks; V6 covers bracketed native symbolic binder forms; V7 covers braced math-native lower/upper binder notation integrated with pipelines and pattern branches; V8 covers native derivative and limit binder notation integrated with pipelines and pattern branches; V9 covers definite integral differential shorthand; V10 covers bare definite-integral bodies such as `∫_{0}^{π} sin(x) dx`; V11 covers executable physics/EE vector-calculus notation for `·`, `⨯`, `⊗`, `∇`, `gradient`, `divergence`, `curl`, `norm`, and `unit`; V12 covers dimension-aware unit helpers plus phasor and impedance helpers for executable EE calculations; V13 covers operator-level unit arithmetic plus matrix/linear physics helpers; V14 covers symbolic variables, expression rendering/simplification/evaluation, named physics/EE formulas, and single-variable linear symbolic solving; V15 covers dimension-aware symbolic variables, symbolic dimension formatting/assertions, and small linear symbolic equation-system solving for circuit-style laws; V16 covers symbolic derivatives, symbolic substitution, dimension-aware RC/RL transfer functions, symbolic impedances, and symbolic voltage-divider helpers; V17 covers frequency-response evaluation, RC/RL cutoff and time constants, RLC resonance/Q/bandwidth helpers, and symbolic series-RLC impedance; V18 covers swept frequency-response arrays, Bode column extraction, peak/trough/nearest lookup, monotonic checks, and dB crossing estimation. Compact glyph-only placement, multi-variable binders, PDE notation, tensor calculus beyond the outer-product slice, broad symbolic vector calculus, full Maxwell-equation manipulation, eigen systems, broad symbolic circuit systems, plotted Bode reports, and arbitrary topology solving remain future slices.
- Replace placeholder IR emission with explicit supported/unsupported diagnostics.
- Preserve deterministic IR output and schema validation.

### Phase 2: Repair Quality Gates

- Burn down `npm run verify` failures until the full verification command is trustworthy.
- Reduce lint/refactor errors before expanding the supported-language surface.
- Keep `npm run status:check` green after every documentation or status change.
- Treat warnings budgets as gates, not decorative reports.

### Phase 3: Validate Actual Programs

- Build a small suite of real JavaScript programs that compile to Lua and execute under the expected Lua runtime.
- Keep `npm run clarity:dogfood` strict and live-program based; do not promote report-only scripts into this gate.
- Use `CLARITY_DOGFOOD_FILTER`, `CLARITY_DOGFOOD_TAGS`, and `CLARITY_DOGFOOD_SHARD=INDEX/TOTAL` for focused local runs without weakening full-gate strictness.
- Keep `npm run stubs:check` green as the operational-stub gate: fake bodies, synthetic pass counts, and report-only completion claims are blockers; intentional unsupported-feature diagnostics must stay explicit and tested.
- Track each accepted program with input source, emitted Lua, runtime result, and failure mode.
- Promote a feature only when it is covered by unit, integration, and runtime behavior checks.

### Phase 4: Requalify Multi-Language Paths

- For each candidate language, verify the complete path: parse source, lower or translate through the intended IR, emit target code, and run meaningful behavior tests.
- Use `docs/LANGUAGE_COMPLETION_RULES.md` and `tests/language_completion/` as the promotion contract.
- Demote any language that only has parser smoke tests, tokenizers, or generated-code snapshots.
- Publish support claims by tier instead of using broad "production ready" labels.

### Phase 5: Tooling and Docs Hygiene

- Keep docs centered on the Denali ledger, this mega plan, `PROJECT_STATUS.md`, and the live support matrix.
- Move superseded plans, reports, stale dashboards, debug traces, and deprecated docs to `docs/OLD LUASCRIPT DOCS/`.
- Maintain `docs/OLD LUASCRIPT DOCS/OLD&Deprecated/ARCHIVE_MANIFEST.md` with original path, archive path, and reason for the legacy archive set.
- Keep active docs focused on how to run, test, extend, and verify LUASCRIPT.

## 4. Ready-To-Test Answer

LUASCRIPT is ready to test by building small actual JavaScript-to-Lua programs. It is not ready to market as a broad production multi-language transpiler.

Good first test programs:

- Variables, arithmetic, and local bindings.
- Simple functions.
- Console/runtime smoke.
- Small object/table usage that already matches emitted Lua behavior.

Avoid as first validation targets:

- Broad multi-language demos.
- Large applications.
- Feature claims based on archived phase reports.
- Programs that require unsupported parser features, class lowering, module systems, or complex example syntax.

## 5. Deprecated Plan Summary

The old planning documents contain useful historical context, but many conflict with current test reality. Their durable content has been consolidated here as:

- Keep JavaScript to Lua green first.
- Treat full verification as a blocker until it passes.
- Requalify each language by end-to-end behavior, not by phase-completion claims.
- Keep Clarity Canon and Super Canon material as reference methodology, not implementation proof.
- Archive stale planning material instead of letting it compete with current status.

## 6. Nested Next Best Steps

Execute work in this order. Do not promote later phases until the earlier exit criteria are met.

### Step 0: Protect the Current Baseline

- Run `npm test` and `npm run status:check` before changing implementation behavior.
- Keep `PROJECT_STATUS.md`, `README.md`, and this mega plan aligned after every status-changing fix.
- Treat any new failure in the current green baseline as a regression.

Exit criteria:

- `npm test` passes.
- `npm run status:check` passes.
- Current known failures remain documented instead of hidden.

### Step 1: Fix the First Real Program Blocker

- Reproduce `tests/examples_integration.test.js` with UTF-8 console output enabled on Windows.
- Keep the aspirational Unicode DSL showcase marked experimental under `examples/experimental/`.
- Keep `examples/supported_math_showcase.ls` in the baseline integration suite.
- Treat the old `mathematical_showcase` as an experimental dogfood demonstration, not current broad JavaScript-to-Lua support.

Exit criteria:

- `hello`, `simple`, `simple_class`, `vector`, and `supported_math_showcase` all compile.
- Any emitted Lua for those examples is syntactically valid.
- The experimental showcase is documented as non-baseline.

### Step 2: Repair `npm run verify`

- Break `npm run verify` into its component gates and fix failures in this priority:
  - `refactor:validate`
  - `format:check`
  - `refactor:lint`
  - `static:warnings`
  - `refactor:phase3`
  - `verify:core`
- Fix the reported errors before spending time on warning volume.
- Avoid broad auto-fix churn unless the changed files are already part of the focused repair.

Exit criteria:

- `npm run verify` passes without reducing gate strictness.
- Any remaining non-blocking warning policy is explicitly documented and kept consistent across active status docs.

### Step 3: Build the Actual Program Test Set

- Add a small accepted-program suite for JavaScript to Lua only.
- Start with programs that use variables, arithmetic, functions, conditionals, loops, arrays/tables, and console/runtime behavior.
- For every accepted program, track source input, emitted Lua, runtime output, and expected result.
- Keep unsupported features out of this suite until they are deliberately implemented.

Exit criteria:

- The accepted-program suite runs through `npm run test:actual-programs`.
- Each passing program proves runtime behavior, not just parsing or code generation.

### Step 4: Replace Silent Stubs With Honest Behavior

- Inventory placeholder emitters, TODO method bodies, and code paths that emit comments instead of real target code.
- Convert unsupported implemented-looking behavior into explicit diagnostics.
- Promote only the smallest safe implementation slices after tests exist.

Exit criteria:

- Unsupported syntax fails clearly.
- Supported syntax emits real Lua without placeholder comments.
- Stub inventory is tracked in this plan or a linked active issue list.

### Step 5: Requalify Experimental Languages

- Reassess Lua input, Python, Ruby, PHP, Dart, C#, Java, Go, Rust, Kotlin, Elm, and Gleam one language at a time.
- Lua input V2, Python V1.2, C# V0.5, C V0.3, C++ V0.4, Java native V1, Rust native V0.25, Ruby native V0.6, PHP native V0.6, Dart native V0.6, Go native V0.25, Kotlin native V0.25, Elm native V0.6, and Gleam native V0.6 now have verified slices, plus target-runtime Java/PHP/Ruby/Dart/Elm/Gleam V0.6 and Go/Rust/Kotlin V0.25. C remains record-slice support only, while C++ adds simple constructor/method lowering. Those manifests must expand before promoting broader claims.
- For each language, require parser, lowering/translation, emitter, and runtime/integration proof before raising its support tier.
- Demote any language whose evidence is only tokenizer, parser smoke, generated snapshots, or old phase reports.
- Track the current evidence in [LANGUAGE_SUPPORT_MATRIX.md](LANGUAGE_SUPPORT_MATRIX.md).

Exit criteria:

- Each language has a current support tier with evidence.
- No language is called production-ready without end-to-end tests.

### Step 6: Keep Docs and Archive Clean

- Keep `docs/OLD LUASCRIPT DOCS/OLD&Deprecated/ARCHIVE_MANIFEST.md` as the record of archived historical material.
- Keep standalone Clarity Canon and Super Canon material as reference methodology unless it is wired through `tests/clarity_canon/manifest.json` with scoped claim language and truthful exit codes. The active executable authority is `tests/clarity_canon/` through `npm run clarity:dogfood`, `npm run clarity:canon`, and focused shards such as `npm run clarity:canon:super`.
- Do not create new completion reports unless they link back to this mega plan and include current verification output.

Exit criteria:

- New docs do not contradict `PROJECT_STATUS.md` or this file.
- Historical claims stay in the archive unless reverified.

## 7. Acceptance Criteria

LUASCRIPT can claim a feature or language as supported only when:

- The source syntax parses through the intended current entrypoint.
- The implementation lowers/translates without placeholders or silent stubs.
- The emitted output is syntactically valid for the target.
- Runtime behavior is tested against expected output.
- The relevant npm verification command is documented and passing.

Until those conditions are met, call the feature experimental.
