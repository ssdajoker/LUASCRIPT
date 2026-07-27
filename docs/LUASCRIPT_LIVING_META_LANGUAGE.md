# LUASCRIPT Living Meta-Language

Status: active design note plus first implementation slice

`.ls` should become the language surface where LUASCRIPT declares how it wants to compile, repair, verify, and evolve. The goal is not novelty for its own sake. The goal is to put the current weak spots under source-level contracts so each `.ls` file can carry enough intent to keep Lua output, canonical IR output, and cross-target behavior honest.

## Current Weak Spots

- Target semantic drift: JavaScript-like `.ls`, Lua, Python, and emitted `.ls` do not share indexing, truthiness, string coercion, slicing, or multiple-return semantics by default.
- Unsupported features can look accepted until a lower compiler stage fails or emits a placeholder.
- Parser, transpiler, IR, and runtime support can drift unless the feature slice is named and tested.
- Examples can accidentally depend on classes, try/catch, or other experimental syntax while claiming to prove a smaller slice.
- Multi-language support is only useful when every promotion is tied to parser, lowering, emitter, runtime, and documentation evidence.

## Meta Kernel

The living `.ls` layer should stay small and declarative:

- `meta`: target capability and semantic policy.
- `repair`: canonical lowering strategy for known semantic gaps.
- `verify`: local proof obligations for output, runtime behavior, diagnostics, policy, and parser feature slices.
- Future `evolve`: source-to-source migration hints once the parser and harness can prove them.

This makes `.ls` a source file plus a compile-time contract. Runtime output stays clean; compile-time blocks are stripped.

## Landed Slice

`verify` now supports parser feature contracts:

```ls
verify {
  stdout "meta_features 6";
  feature "for-of";
  feature "verify-blocks";
  no_feature "classes";
  no_feature "try-catch";
}
```

The parser validates these assertions before transpilation:

- `feature "name"` fails if the parser artifact does not contain the named feature slice.
- `no_feature "name"` fails if the parser artifact contains a forbidden slice.
- This is intentionally source-level. A fixture now states not only what it prints, but what language surface it is allowed to use.

Covered fixture files:

- `tests/language_completion/fixtures/luascript/meta_feature_contract.ls`
- `tests/language_completion/fixtures/luascript/meta_feature_contract_ir.ls`
- `tests/language_completion/fixtures/luascript/meta_feature_contract_missing.ls`
- `tests/language_completion/fixtures/luascript/meta_feature_contract_forbidden.ls`

The next contract slice is now implemented in the local harness:

- `meta profile portable_v1;` expands a named target contract for Lua, JavaScript, Python, and emitted `.ls`.
- `meta profile portable_semantics_v1;` expands the shared semantic-adapter contract for indexing, length, slicing, truthiness, string coercion, and packed multiple returns across Lua, JavaScript, Python, and emitted `.ls`.
- `verify { diagnostic "async_unsupported"; }` resolves named diagnostics into stable failure contracts.
- `continue` now negotiates the lowest-power target lowering: native where possible, `label_goto` for Lua, and an explicit failure when `lua.goto` is forbidden.
- `verify { lua_repair "..."; python_repair "..."; }` can require emitted helper evidence for repair-backed semantics instead of trusting declarations alone.

Profile composition is now part of the active lane:

- `meta profile portable_v1;` can be followed by a local `meta { ... }` block.
- Merge rule is deterministic: profile first, local override second.
- Policy contradictions fail explicitly. Example: a profile requiring `lua.goto` plus a local `forbid lua.goto` now fails as a capability conflict instead of degrading later.

Representative fixtures:

- `tests/language_completion/fixtures/luascript/meta_profile_portable_v1.ls`
- `tests/language_completion/fixtures/luascript/meta_python_truthiness_adapter.ls`
- `tests/language_completion/fixtures/luascript/meta_python_index_length_slice_adapter.ls`
- `tests/language_completion/fixtures/luascript/meta_string_coercion_adapter.ls`
- `tests/language_completion/fixtures/luascript/meta_multiple_returns_adapter.ls`
- `tests/language_completion/fixtures/luascript/meta_repair_stateful_parity.ls`
- `tests/language_completion/fixtures/luascript/meta_profile_portable_semantics_matrix.ls`
- `tests/language_completion/fixtures/luascript/meta_profile_composition_pressure.ls`
- `tests/language_completion/fixtures/luascript/meta_capability_auto_continue.ls`
- `tests/language_completion/fixtures/luascript/meta_capability_no_compatible_continue.ls`
- `tests/language_completion/fixtures/luascript/meta_repair_contract_indexing.ls`
- `tests/language_completion/fixtures/luascript/meta_python_closure_rebinding.ls`
- `tests/language_completion/fixtures/luascript/meta_closure_profile_stateful_repair.ls`
- `tests/language_completion/fixtures/luascript/meta_identity_contract_portable_slice.ls`
- `tests/language_completion/fixtures/luascript/meta_profile_override_policy_missing.ls`
- `tests/language_completion/fixtures/luascript/meta_profile_assertion_missing.ls`
- `tests/language_completion/fixtures/luascript/meta_profile_forbidden_present.ls`
- `tests/language_completion/fixtures/luascript/meta_implicit_profile_forbidden_present.ls`
- `tests/language_completion/fixtures/luascript/meta_repair_contract_missing_evidence.ls`
- `tests/language_completion/fixtures/luascript/meta_repair_contract_missing_runtime_proof.ls`
- `tests/language_completion/fixtures/luascript/meta_repair_contract_missing_python_runtime_proof.ls`
- `tests/language_completion/fixtures/luascript/meta_repair_contract_missing_js_runtime_proof.ls`
- `tests/language_completion/fixtures/luascript/meta_repair_contract_missing_ls_runtime_proof.ls`
- `tests/language_completion/fixtures/luascript/meta_named_diagnostic_async.ls`

## Next Slices

1. Repair parity expansion:
   - The `portable_semantics_v1` profile now covers the active truthiness, indexing, length, slicing, string coercion, and packed-multiple-return fixtures.
   - First runtime-proof guard landed on 2026-07-13: every `lua_repair`, `python_repair`, `js_repair`, or `ls_repair` assertion now requires target-specific `*_stdout` proof, then the harness checks emitted helper evidence and executes the target runtime.
   - The current failure set includes `meta_repair_contract_missing_evidence.ls` for missing emitted evidence, `meta_repair_contract_missing_runtime_proof.ls` for missing Lua runtime proof, `meta_repair_contract_missing_python_runtime_proof.ls` for missing Python runtime proof, `meta_repair_contract_missing_js_runtime_proof.ls` for missing JavaScript runtime proof, and `meta_repair_contract_missing_ls_runtime_proof.ls` for missing emitted `.ls` runtime proof.
   - A deeper stateful parity fixture now combines computed index assignment, slice copy behavior, truthiness side effects, string coercion, and packed multiple returns across Lua, Python, JavaScript, and emitted `.ls`.
   - Closure-rebinding edge closed on 2026-07-13: `meta_python_closure_rebinding.ls` locks Python `nonlocal current` emission and runtime parity, and `ring2_lexical_scope_closure.ls` now runs against Python.
   - A stricter `portable_semantics_v1` matrix fixture now asserts every adapter across Lua, Python, JavaScript, and emitted `.ls`, requires target-specific stdout for all four, and executes the shared semantic path.
   - Closure/profile stateful repair variant landed on 2026-07-13: `meta_closure_profile_stateful_repair.ls` combines nested closure rebinding, indexed state mutation, slicing, truthiness, string coercion, packed returns, Python `nonlocal` emission, and cross-target runtime parity.
   - Profile override failure variant landed on 2026-07-13: `meta_profile_override_policy_missing.ls` proves local target overrides are visible to `verify` policy assertions by intentionally asserting the pre-override Lua async diagnostic.
   - Python repair runtime-proof negative variant landed on 2026-07-13: `meta_repair_contract_missing_python_runtime_proof.ls` proves `python_repair` assertions require `python_stdout`, matching the Lua runtime-proof guard.
   - JavaScript and emitted `.ls` repair runtime-proof negative variants landed on 2026-07-13: `meta_repair_contract_missing_js_runtime_proof.ls` and `meta_repair_contract_missing_ls_runtime_proof.ls` complete the four-target guard family for `lua_repair`, `python_repair`, `js_repair`, and `ls_repair`.
   - Profile assertion pressure test landed on 2026-07-13: `verify { profile ...; no_profile ...; implicit_profile ...; no_implicit_profile ...; }` now lets fixtures distinguish explicit profiles from the implicit `portable_semantics_v1` baseline.
   - `meta_profile_composition_pressure.ls` proves explicit `portable_v1` plus `portable_semantics_v1` composition across Lua, Python, JavaScript, and emitted `.ls`; `meta_profile_assertion_missing.ls` proves implicit profiles do not satisfy explicit profile assertions.
   - Profile absence negative variants landed on 2026-07-13: `meta_profile_forbidden_present.ls` proves declared `portable_v1` cannot be asserted absent, and `meta_implicit_profile_forbidden_present.ls` proves the default implicit `portable_semantics_v1` baseline cannot be asserted absent.
   - `.ls` identity-contract slice landed on 2026-07-14: `meta_identity_contract_portable_slice.ls` composes only `portable_v1` plus `portable_semantics_v1`, requires `meta`/`repair`/`verify`/profile feature slices, forbids classes, for-of, try/catch, and template literals for that fixture, and dogfoods Lua/JavaScript/Python/emitted-`.ls` stdout.
   - Next work is either another real repair/profile edge or the first evolution-block proof. Do not add a new named profile until it removes duplication that `portable_v1` and `portable_semantics_v1` cannot remove cleanly.

2. Evolution blocks:
   - Add only after contracts are stable.
   - Purpose: source migrations that are proven by before/after parser artifacts and runtime behavior, not broad automatic rewrites.

3. Profile families:
   - `verify` now supports explicit profile-family assertions: `profile`, `no_profile`, `implicit_profile`, and `no_implicit_profile`.
   - Current supported `.ls` profile set is `portable_semantics_v1` as the implicit executable baseline, `portable_semantics_v1` as an explicit semantic-adapter profile, and `portable_v1` as an explicit cross-target policy profile.
   - Additional named profiles should only land when they remove real fixture duplication and have a distinct semantic purpose beyond `portable_v1` and `portable_semantics_v1`.
   - Explicit profiles and implicit baseline profiles must stay distinguishable in parser artifacts and harness checks.

4. Canonical `1.0` package/runtime and example boundaries:
   - Package identity remains `luascript` at `0.1.0-beta.0` until a deliberate release action changes it; `src/unified_luascript.js` is the current entrypoint.
   - Runtime claims stay gate-bound: target-runtime IR lanes prove emitted behavior, while native support requires a real runtime command and a passing `language:<name>:bidirectional` gate.
   - First-pass examples should stay inside named evidence: small JavaScript programs, small `.ls` executable/meta programs, actual-program fixtures, `examples/supported_math_showcase.ls`, and mathematical notation core/rehab V1 through V18.
   - A new example family should not enter the supported set until it has manifest registration, runtime proof, docs boundary text, and a claims-check assertion.

5. Diagnostic catalog growth:
   - Promote more unsupported boundaries into named diagnostics only when the failure semantics are stable across parser, IR, and target emitters.

## Rule

Every new meta feature must satisfy this contract:

- It must reduce a real LUASCRIPT weakness.
- It must be stripped from runtime output.
- It must fail explicitly when unsupported.
- It must have at least one success fixture and one failure fixture.
- It must be documented as a slice, not as broad language completion.
