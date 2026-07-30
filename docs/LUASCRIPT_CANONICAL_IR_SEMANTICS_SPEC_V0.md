# LUASCRIPT Canonical IR Semantics Spec v0

Status: active v0 draft
Last updated: 2026-07-29
Track: Denali canonical `1.0`, criterion `1.0-IR-SEMANTICS`

This is the first formal semantics draft for the LUASCRIPT canonical IR. It is not canonical `1.0`, not a release promotion, and not a claim that every clause below is fully implemented or proven. It turns the current inventory into a contract shape: each section states the intended `1.0` semantics, then ties the clause to existing evidence or marks it `MISSING EVIDENCE`.

The 2026-07-15 evidence-map pass advances this draft toward v1 by mapping every current `npm run test:ir-conformance` fixture to named semantic rules or documented gaps. The mapping is evidence accounting only: it does not choose the release IR surface, reconcile the schema/live-output split, or promote any target, feature, or fixture beyond the current scoped conformance surface.

The 2026-07-27 schema-artifact mapping pass adds `npm run test:schema-artifact-map`. That harness compiles the current conformance fixtures through the active `CoreLanguageBridge`, derives schema-valid `docs/canonical_ir.schema.json` v1 artifacts for the positive fixtures, validates them with AJV, records field/kind alias gaps, and writes `artifacts/conformance/schema-artifact-mapping-report.json`. This is a dual-surface transition evidence route, not a compiler-output change or final release IR surface choice.

The 2026-07-27 dual-surface compatibility bridge pass adds `src/ir/schema_artifact_bridge.js` and `npm run test:ir-compatibility-bridge`. That historical pass validated the internal bridge candidate for the same positive conformance fixtures, recorded 168/168 invariant checks, and wrote `artifacts/conformance/dual-surface-compatibility-bridge-report.json`.

The 2026-07-29 release-IR bearing chooses [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md), contract `1.0.0-rc.1`: legacy object-tree Program IR `v0` remains the operational compiler/emitter surface, and canonical schema artifact `1.0.0` is a one-way evidence/serialization projection. The gate now checks latest/pinned/`1.x` schema routes, exact alias policies, original-kind-aware required shapes, deterministic artifacts, migration/deprecation rules, unchanged root exports, and malformed-shape negatives. Reverse conversion, semantic equivalence, source preservation, and public package IR API remain unclaimed.

Every semantics section below is tied to current evidence or marked `MISSING EVIDENCE`. No runtime, compiler, lowerer, emitter, schema, or package API behavior is changed by this spec draft.

## Evidence Status Vocabulary

| Status | Meaning |
| --- | --- |
| `EVIDENCED` | A current named gate or fixture family proves at least the stated slice. |
| `PARTIAL` | Current evidence exists, but it is narrow, shape-oriented, target-specific, or split across IR surfaces. |
| `MISSING EVIDENCE` | No sufficient current test, fixture, or report proves the clause. |
| `OUT OF V0` | The behavior is intentionally excluded from this draft until a later accession route names it. |

## Governing Boundary

| Rule | Draft contract | Evidence |
| --- | --- | --- |
| IR surface | A `1.0` IR artifact must have one documented release surface, or an explicitly documented dual-surface bridge with compatibility rules. | `EVIDENCED` for the internal Denali RC choice: [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md) and `npm run test:ir-compatibility-bridge` choose and enforce the versioned one-way dual-surface transition without changing compiler output or package API. |
| Schema validity | Every release-supported node emitted by the release lowerer must be valid against the release schema and pass invariant checks. | `PARTIAL`: `npm run test:schema-artifact-map` proves schema-valid derived artifacts for 21/21 positive conformance fixtures and preserves 11 expected diagnostics; `npm run test:ir-compatibility-bridge` validates latest, pinned `1.0.0`, and resolved `1.x` schema routes plus bridge and original-kind-aware shape rules. Broader authoring-schema semantics and node families remain open. |
| Runtime claim boundary | A semantic clause is supported only for named source/target/profile slices backed by current gates. | `EVIDENCED`: `npm run claims:check`, `npm run status:check`, language manifests, and support matrix boundaries. |
| Bidirectionality boundary | Bidirectional claims must identify the proven layer: native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, round-trip source identity, or semantic equivalence. | `EVIDENCED`: [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md) defines the current claim levels; `npm run test:roundtrip-probe` adds tiny structural IR reparse and runtime-output equivalence probes; broad round-trip source identity and broad semantic equivalence remain open unless fixtures prove them. |
| Unsupported behavior | Unsupported nodes or unsupported semantic combinations must fail with deterministic diagnostics, not silent best-effort emission. | `PARTIAL`: `tests/ir/unsupported_diagnostics.test.js`, language manifest expected failures, and `npm run stubs:check`. |

## Values

The canonical IR value model must distinguish these release value families:

- `number`: finite numeric values used by current JavaScript, `.ls`, Lua, Python, C-family, and math slices.
- `string`: ordered text values as carried by source fixtures and emitted runtimes.
- `boolean`: `true` and `false`.
- `nullish`: a normalized absence value that target emitters map to their supported representation.
- `array`: ordered indexed collection.
- `object`: key/value aggregate with string-like or identifier-like keys unless a target-specific typed record contract says otherwise.
- `function`: callable closure or named function value.
- `error`: thrown/raised diagnostic value where supported.

Normative draft clauses:

1. A `1.0` profile must define truthiness for each value family.
2. A `1.0` profile must define equality and comparison behavior for every supported operator and operand family.
3. Target emitters must either preserve the profile value model or emit a deterministic unsupported diagnostic.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Numbers, strings, booleans, arrays, objects in small programs | `EVIDENCED` | `npm run test:actual-programs`, `npm run language:javascript:bidirectional`, `npm run language:luascript:bidirectional`, and current language-completion fixtures. |
| JS-like truthiness repair for `.ls` portable semantics | `EVIDENCED` | `npm run test:luascript-meta`, `meta_python_truthiness_adapter`, `ring3_portable_semantics_truthiness_string_many`, and dogfood fixtures. |
| Full numeric edge model such as `NaN`, infinities, `-0`, integer width, overflow, BigInt, decimal precision | `MISSING EVIDENCE` | No current conformance matrix proves these cases across the canonical IR and targets. |
| Object identity, reference equality, deep equality, mutation aliasing | `PARTIAL` | Object mutation and nested state fixtures exist; broad identity/aliasing semantics are not formalized. |

## Literals

`Literal` represents primitive source literals and their normalized IR values. A release-supported literal must carry enough data to preserve the value semantics and, when needed by tools, source-facing raw spelling.

Normative draft clauses:

1. `Literal.value` is the semantic value consumed by emitters and validators.
2. `Literal.raw` and `Literal.literalKind`, when present, are source/tooling metadata and must not override `value`.
3. Unsupported literal families must be rejected before target emission.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| String, number, boolean, and null-like literal emission | `EVIDENCED` | Golden IR files, `npm run ir:golden:check`, actual-program fixtures, and language-completion fixtures. |
| Regex, bigint, symbol, date/time, byte/string encoding edge cases | `MISSING EVIDENCE` | Not covered by current supported slices. |
| Raw spelling preservation as a release contract | `MISSING EVIDENCE` | Current schema/docs mention raw metadata, but no release conformance gate requires round-trip raw spelling. |

## Bindings And Scope

`Identifier`, function parameters, variable declarations, object patterns, array patterns, rest elements, and assignment patterns participate in binding semantics.

Normative draft clauses:

1. A binding must have a stable declared name and a scope owner.
2. A reference must resolve to the nearest visible binding according to the profile's scope rules.
3. `var`, `let`, `const`, function parameter, and pattern binding behavior must be explicitly defined or excluded.
4. Closures must preserve state according to the profile's binding model.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Local declarations and basic references | `EVIDENCED` | `arithmetic_locals`, `functions_conditionals`, actual-program fixtures, and golden IR files. |
| Closure state, shadowing, and captured mutation in current JavaScript-source conformance slices | `EVIDENCED` | `ring2_lexical_scope_closure` fixtures, language bidirectional gates, and `npm run test:ir-conformance` function/scope matrix runtime checks for emitted JavaScript and Python. |
| `Parameter` and `VariableDeclarator` schema alignment | `PARTIAL` | `npm run test:schema-artifact-map` records derived schema aliases for `Parameter->Identifier` and `VariableDeclarator->VariableDeclaration`; the live bridge still emits implementation-resident kinds, so final release compatibility rules remain open. |
| Hoisting, temporal dead zone, module/global scope, and captured mutation across every target runtime | `MISSING EVIDENCE` | The current function/scope matrix is scoped evidence only; it does not prove release-wide scope behavior or Lua/`.ls` runtime equivalence. |

## Control Flow

Control-flow nodes include blocks, expression statements, return, if, switch, loops, break, continue, throw, and try/catch/finally.

Normative draft clauses:

1. Statement order inside a block is deterministic and sequential unless a control-flow statement transfers control.
2. `IfStatement` evaluates exactly one branch after evaluating its condition under the active truthiness profile.
3. Loop nodes must define initialization, test, body, update, break, and continue order.
4. `ReturnStatement` exits the current function with a value or nullish absence.
5. `ThrowStatement` and `TryStatement` must define error value propagation and finalizer ordering before `1.0` support.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Blocks, if, while, numeric for, Python range lowering, break, continue, nested loops, short-circuiting, early returns, JavaScript switch, and conditional expressions in named slices | `EVIDENCED` | `npm run test:ir-conformance` now includes a scoped control-flow matrix with emitted JavaScript/Lua/Python/`.ls` snippets plus JavaScript/Python native and emitted runtime checks; `ring3_switch_conditional` also provides language-completion runtime evidence for native JavaScript and emitted Lua/JavaScript. |
| JavaScript `for-of`, JavaScript `try/catch`, JavaScript tagged template literals, and Python source `continue` in this conformance surface | `PARTIAL` | They are intentionally fail-closed diagnostics in the current control-flow matrix rather than promoted canonical semantics. Other language-specific for-of/range fixtures remain named language-slice evidence only. |
| Lua continue lowering policy through `.ls` meta | `EVIDENCED` | `npm run test:luascript-meta`, `meta_resolve_continue`, and capability-policy fixtures. |
| Switch and try/catch/finally shape validation | `PARTIAL` | `control_javascript_switch_conditional` now evidences return-only JavaScript switch plus conditional-expression lowering for emitted Lua/JavaScript/`.ls` shape and JavaScript runtime; Python switch emission and JavaScript `try/catch` remain diagnostics, and exhaustive fallthrough/error semantics are not proven. |
| Labelled break/continue, fallthrough semantics, do-while continue order, finalizer ordering under nested errors | `MISSING EVIDENCE` | No current release conformance cases. |

## Functions

Functions include `FunctionDeclaration`, implementation-resident `FunctionExpression`, schema-visible `ArrowFunctionExpression`, parameters, return values, closures, and callability metadata.

Normative draft clauses:

1. Function parameters are bound in source order.
2. Function bodies execute in their lexical or profile-defined scope.
3. Return without an argument produces the profile's nullish absence value.
4. Arrow, async, generator, method, and constructor behavior must either be specified for a profile or excluded.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Named functions, parameters, returns, recursion, nested functions, and simple nested calls | `EVIDENCED` | `functions_conditionals`, `add_function.json`, `nested_calls.json`, language-completion gates, and the `npm run test:ir-conformance` function/scope matrix. |
| Closure state, lexical shadowing, and mutation through closures in the scoped JavaScript-source surface | `EVIDENCED` | `ring2_lexical_scope_closure` fixtures plus conformance runtime checks for native JavaScript, emitted JavaScript, and emitted Python. |
| Arrow function shape | `PARTIAL` | `arrow_implicit_return.json` exists, but lexical `this`, expression-vs-declaration identity, and schema/lowerer representation need formalization. |
| JavaScript async and generator functions in this conformance surface | `PARTIAL` | They now fail closed with deterministic unsupported diagnostics instead of silently lowering to ordinary functions. |
| `this` binding, method dispatch, constructor semantics, rest/default/destructured parameter evaluation order, and cross-target arity normalization | `MISSING EVIDENCE` | These are not conformance-proven for `1.0`; extra-arity behavior is recorded as a target-native delta in the function/scope matrix. |

## Calls

`CallExpression` invokes a callable value with ordered arguments. Target helper calls are still calls and must obey the same evidence boundary unless a helper contract says otherwise.

Normative draft clauses:

1. The callee and arguments must have a defined evaluation order before `1.0`.
2. Arguments are passed in source order.
3. Target helpers must be versioned or named as part of the target obligation when semantic repair is required.
4. Unsupported call forms must produce deterministic diagnostics.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Simple calls, nested calls, math helper calls, print/stdout calls | `EVIDENCED` | `nested_calls.json`, actual-program tests, math rehab examples, and language-completion fixtures. |
| Target helper calls for truthiness, indexing, length, slicing, string coercion, packed returns | `EVIDENCED` | `.ls` meta repair/runtime fixtures and `npm run test:luascript-meta`. |
| Side-effect evaluation order for callee/arguments across every target | `MISSING EVIDENCE` | Short-circuit state is tested, but general call-order conformance is absent. |
| Optional calls, spread calls, keyword/named arguments, variadic interop | `MISSING EVIDENCE` | Not release-proven. |

## Objects And Arrays

Arrays are ordered indexed collections. Objects are key/value aggregates. Typed target records are a target-specific obligation, not a broad dynamic object guarantee.

Normative draft clauses:

1. The abstract array index model for a profile must be explicit, including zero-based or target-native indexing.
2. Array length, slicing, mutation, and iteration must be specified per supported profile.
3. Object property read/write, computed keys, shorthand properties, and record lowering must be specified or excluded.
4. Emitters must use helpers when native target semantics differ from the active profile.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Arrays, object literals, object mutation, nested reads/writes, and record fields in named slices | `EVIDENCED` | Actual-program fixtures, `array_only.json`, `array_nested.json`, `object_only.json`, ring2 object fixtures, and the `npm run test:ir-conformance` data-structure matrix. |
| Zero-based indexing, `.length`, `.slice`, and mutation repair in `.ls` portable semantics | `EVIDENCED` | Ring 3 `.ls` portable semantics fixtures, actual-program fixtures, meta repair tests, and the data-structure matrix portable `.ls` runtime checks for emitted JavaScript/Python. |
| Python list/dict mutation, membership, nested reads/writes, iteration, and length in named slices | `EVIDENCED` | Python V1.2 language fixtures plus the data-structure matrix native/emitted JavaScript/Python runtime checks. |
| Lua table record fields in the current Lua-source slice | `PARTIAL` | The data-structure matrix proves emitted JavaScript runtime behavior and emitted Lua/`.ls` snippets; Lua-source table indexing to Python remains a named target delta. |
| C/C++/C# typed record obligations | `PARTIAL` | Narrow C/C++/C# language slices support selected record/class-method cases. Broad typed record semantics remain open. |
| JavaScript object spread and destructuring patterns in this conformance surface | `PARTIAL` | They fail closed with deterministic unsupported diagnostics instead of emitting malformed aggregate code. |
| Sparse arrays, holes, property enumeration order, prototypes, getters/setters, symbols, deep object spread/destructuring semantics, identity/aliasing matrix | `MISSING EVIDENCE` | Not covered by current release gates. |

## Errors And Diagnostics

Errors include source-level throw/try behavior and compiler/runtime unsupported-feature diagnostics.

Normative draft clauses:

1. Unsupported syntax, unsupported IR node kinds, unsupported target operations, and unsupported semantic repairs must fail deterministically.
2. Diagnostics must name the unsupported feature enough for users and gates to distinguish it from an implementation stub.
3. `ThrowStatement` and `TryStatement` support requires defined error values, catch binding, rethrow behavior, finalizer order, and target limits.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Unsupported-feature diagnostics as honest boundaries | `EVIDENCED` | `npm run test:unsupported-diagnostics`, `npm run stubs:check`, language expected-failure manifests, and actual-program expected failures. Current certification covers named JavaScript source diagnostics for `for-of`, `throw`, `try/catch/finally`, tagged template literals, rest parameters, and target-specific unsupported IR diagnostics for JavaScript/Lua emitters. |
| `.ls` verify diagnostic blocks and runtime failure assertions | `EVIDENCED` | `npm run test:luascript-meta`. |
| Throw/try schema and golden shape | `PARTIAL` | `try_catch_finally.json` and unsupported throw fixtures exist; full runtime error semantics are not proven. |
| Error object identity, stack traces, catch scope, finalizer order, target-specific exception interop | `MISSING EVIDENCE` | No release conformance suite yet. |

## Unsupported Nodes

Unsupported nodes must fail closed.

Normative draft clauses:

1. A node kind outside the release-supported set must not be silently emitted.
2. A schema-visible node without release semantics must be marked experimental, unsupported, or out of profile.
3. An implementation-resident node outside the release schema must be reconciled before it can be promoted to `1.0`.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Unsupported target/source diagnostics in current narrow slices | `EVIDENCED` | Source compiler diagnostics, `tests/ir/unsupported_diagnostics.test.js`, and manifest expected failures. |
| Complete node-kind support/exclusion matrix | `PARTIAL` | `npm run test:schema-artifact-map` records current positive-fixture mapped node kinds and aliases, including `VariableDeclarator->VariableDeclaration`, `Parameter->Identifier`, `UnaryExpression->BinaryExpression`, and `SwitchCase->BlockStatement`. The final release support/exclusion matrix remains open. |
| Schema enum / pinned schema / `NodeCategory` reconciliation | `PARTIAL` | Latest and pinned Denali RC schemas now have semantic parity except `$id`, and the `1.x` alias resolves in the compatibility gate. `NodeCategory`, broader validators, and node families still need reconciliation; active bridge output intentionally remains legacy Program IR. |

## Determinism And Serialization

The release IR must be deterministic enough for repeatable validation, golden comparison, reports, and compatibility review.

Normative draft clauses:

1. Equivalent source under the same profile and toolchain version must lower to a deterministic artifact, ignoring explicitly volatile metadata if any.
2. Node ids, module body ordering, control-flow graph references, and serialized object key order must be stable or formally excluded from deterministic comparison.
3. A release schema version must define compatibility and migration rules.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Golden IR validation and selected parity | `EVIDENCED` | `npm run ir:golden:check` and `npm run ir:golden:parity`. |
| Basic IR validation smoke | `EVIDENCED` | `npm run ir:validate` and `npm run ir:validate:schema`. |
| Broader determinism stress | `PARTIAL` | Existing IR determinism tests are part of the broader verification surface, but release serialization rules are not yet a standalone conformance contract. |
| Stable release artifact format, volatile metadata policy, migration compatibility matrix | `PARTIAL` | Contract `1.0.0-rc.1` fixes the internal surface versions, exact aliases, one-way direction, deterministic projection rule, migration path, and package-`2.0.0`-or-later deprecation horizon. Broader metadata semantics, consumer APIs, and cross-version artifact matrices remain open. |

## Target Obligations

Each target emitter must preserve the active profile semantics or reject the program with a deterministic diagnostic.

Normative draft clauses:

1. A target must name every semantic helper it requires for truthiness, indexing, length, slicing, string coercion, records, packed returns, continue handling, or error handling.
2. Native runtime claims require a real runtime command and a passing native gate.
3. Target-runtime IR lanes prove emitted behavior for named slices only; they do not substitute for native qualification.
4. Target helper semantics must become part of the release compatibility surface before `1.0`.

Evidence:

| Clause | Status | Current evidence or gap |
| --- | --- | --- |
| Native runtime qualification boundary | `EVIDENCED` | `npm run language:implemented:native`, `npm run beta:readiness:strict`, README, status docs, and language support matrix. |
| Target-runtime IR lane boundary | `EVIDENCED` | `npm run language:implemented:targets`, language manifests, and claims checks. |
| `.ls` semantic repair helpers with runtime proof | `EVIDENCED` | `npm run test:luascript-meta`, `meta_repair_stateful_parity`, and target-specific stdout assertions. |
| Helper versioning, per-target compatibility tables, complete source/target semantic deltas | `MISSING EVIDENCE` | Needs a conformance-style target obligation suite and compatibility docs. |

## Conformance Skeleton

The current conformance skeleton is `tests/conformance/manifest.json` plus `tests/conformance/canonical_ir_conformance.test.js`, exposed as `npm run test:ir-conformance`.

Scope:

- It compiles small JavaScript fixtures to the current legacy object-tree `Program` IR through `CoreLanguageBridge`.
- It emits cloned IR artifacts to the current stable bridge emitters: `lua`, `javascript`, `luascript`, and `python`.
- It asserts representative emitted-output snippets for values, bindings, control flow, functions, calls, arrays, and objects.
- It compares scoped value semantics across JavaScript, Lua, Python, and `.ls` emitted behavior: numbers, strings, booleans, null/nil/None equivalents, arrays, objects/records, truthiness, equality, coercion, and indexing.
- It records raw JavaScript truthiness/equality/coercion as target-native deltas, while `.ls` `portable_semantics_v1` records the current profile-repaired path for truthiness, string coercion, null text, length, slicing, and zero-based indexing.
- It compares scoped control-flow lowering across JavaScript, Lua, Python, and `.ls` emitted behavior: if/else, while, numeric for, Python range lowering, break, continue, nested loops, short-circuiting, early returns, switch, conditional expressions, and target-specific lowering.
- It executes native and emitted JavaScript/Python runtime checks for the scoped control-flow fixtures where local runtimes are available.
- It compares scoped function/scope behavior across JavaScript, Lua, Python, and `.ls` emitted behavior: lexical closures, shadowing, mutation through closures, recursion, nested functions, return normalization, and extra-arity target deltas.
- It executes native and emitted JavaScript/Python runtime checks for the scoped function/scope fixtures where local runtimes are available.
- It compares scoped data-structure behavior across JavaScript, Lua, Python, and `.ls` emitted behavior: array/object mutation, nested reads/writes, length, slicing, membership, Python list iteration, Lua table record fields, object literals, and unsupported deep-structure diagnostics.
- It executes native and emitted JavaScript/Python runtime checks for the scoped data-structure fixtures where local runtimes are available and where the current target path actually passes.
- It asserts deterministic unsupported-target diagnostics through an explicit `sql` negative case.
- It asserts fail-closed unsupported diagnostics for `undefined`, `NaN`, and `Infinity`, because those JavaScript special values are not yet canonicalized for cross-target emission.
- It asserts fail-closed unsupported diagnostics for JavaScript `for-of`, JavaScript `try/catch`, JavaScript tagged template literals, and Python source `continue` in the current canonical conformance surface.
- It asserts fail-closed unsupported diagnostics for JavaScript async and generator functions in the current canonical conformance surface.
- It asserts fail-closed unsupported diagnostics for JavaScript object spread and destructuring patterns in the current canonical conformance surface.

Boundary:

- It is a scoped skeleton, not a certification suite.
- It does not claim canonical `1.0`, broad language-depth coverage, Lua/`.ls` runtime equivalence in this matrix, schema reconciliation, broad JavaScript special-number semantics, or exhaustive edge-case coverage.
- It gives future positive, negative, schema-validity, runtime, compatibility, and edge-matrix cases a manifest-driven home.

## V1 Evidence Mapping Draft

Status: active evidence map, still below canonical `1.0`

This section maps every current `tests/conformance/manifest.json` fixture to a named semantic rule or a documented gap. "Supported" here means "supported by the scoped conformance harness as a positive, target-native-delta, profile-repaired, unsupported-diagnostic, or unsupported-target fixture." It does not mean full-language support.

Shared evidence rules that apply across the table:

- `IR-DET-001`: deterministic local evidence is provided by `artifacts/conformance/canonical-ir-conformance-report.json`, including manifest hash, per-fixture hashes, pass/fail summary, runtime command evidence, and support-matrix traceability. This is report determinism, not final release serialization determinism.
- `IR-GOV-001`: all current positive fixtures compile through legacy object-tree Program IR and derive the chosen versioned canonical artifact projection; this resolves the internal surface choice without claiming lossless replacement or public API.
- `IR-TGT-001`: target obligations are evidenced only where a fixture declares emitted-output snippets, runtime checks, or deterministic unsupported-target diagnostics for the current stable bridge emitters.

### V1 Rule Catalog

| Rule | Category | Current meaning |
| --- | --- | --- |
| `IR-VAL-001` | values/literals | Number, string, boolean, nullish, array, and object value families are evidenced for named small-program slices. |
| `IR-VAL-002` | values/target obligations | `.ls` `portable_semantics_v1` repairs truthiness, string coercion, null text, zero-based indexing, length, and slicing for named fixtures. |
| `IR-VAL-GAP-003` | values | Raw JavaScript truthiness, loose equality, and string-number coercion remain target-native deltas unless a profile repair fixture proves the path. |
| `IR-VAL-GAP-004` | values/unsupported nodes | JavaScript `undefined`, `NaN`, and `Infinity` fail closed because cross-target special-number/nullish semantics are not yet canonicalized. |
| `IR-LIT-001` | literals | Number, string, boolean, and null-like literal emission is evidenced for named emitted-output slices. |
| `IR-LIT-GAP-002` | literals/unsupported nodes | Tagged template literals are a deterministic unsupported diagnostic; raw spelling preservation is still not a release contract. |
| `IR-BIND-001` | bindings | Local declarations and references preserve names and statement order in named fixtures. |
| `IR-SCOPE-001` | scope | Lexical closures, shadowing, nested functions, and mutation through closures are evidenced for the named JavaScript-source fixture with JavaScript/Python runtime checks. |
| `IR-CF-001` | control flow | Sequential blocks, expression statements, if/else, and return-only branch behavior are evidenced for named fixtures. |
| `IR-CF-002` | control flow | While loops, numeric loops, Python range lowering, nested loops, break, continue, and early returns are evidenced for named fixtures. |
| `IR-CF-003` | control flow | Short-circuit `&&`/`||` preserves the scoped side-effect behavior in native JavaScript and emitted JavaScript/Python runtime checks. |
| `IR-CF-004` | control flow | JavaScript switch plus conditional-expression lowering is evidenced for native JavaScript and emitted JavaScript runtime, with emitted Lua/`.ls` shape checks. |
| `IR-CF-GAP-005` | control flow/target obligations | Python switch emission, JavaScript `for-of`, JavaScript `try/catch`, JavaScript tagged templates, and Python source `continue` remain documented gaps or diagnostics in this conformance surface. |
| `IR-FN-001` | functions/calls | Named functions, ordered parameters, simple calls, nested calls, recursion, nested functions, and return normalization are evidenced for named fixtures. |
| `IR-FN-GAP-002` | functions/calls | Extra-arity behavior is a target-native delta, not a canonical arity rule. |
| `IR-FN-GAP-003` | functions/unsupported nodes | JavaScript async and generator functions fail closed with named diagnostics. |
| `IR-CALL-001` | calls | Simple calls, print/stdout calls, nested calls, and profile helper calls are evidenced where emitted snippets and runtime checks pass. |
| `IR-ARR-OBJ-001` | arrays/objects | Array literals, object literals, record fields, member reads/writes, nested reads/writes, and mutation are evidenced for named fixtures. |
| `IR-ARR-OBJ-002` | arrays/objects/target obligations | Profile-repaired zero-based indexing, length, slicing, and aggregate mutation are evidenced for named `.ls` portable fixtures. |
| `IR-ARR-OBJ-GAP-003` | arrays/objects | Lua-source table record fields are evidenced for emitted JavaScript in this matrix; Lua-source table indexing to emitted Python is a named target delta. |
| `IR-ARR-OBJ-GAP-004` | arrays/objects/unsupported nodes | JavaScript object spread and destructuring patterns fail closed with named diagnostics. |
| `IR-ERR-001` | errors/unsupported nodes | Unsupported source semantics, unsupported target operations, and unsupported node families must fail with deterministic diagnostics in the named fixtures. |
| `IR-UNSUP-001` | unsupported nodes | Unsupported target languages and unsupported syntax forms are treated as intentional diagnostics, not fake implementation stubs. |
| `IR-TGT-GAP-002` | target obligations | Lua and `.ls` runtime equivalence, helper versioning, and complete per-target semantic delta tables remain outside this conformance pass. |

### Fixture-To-Rule Map

| Fixture | Status | Rule or documented gap mapping | Evidence boundary |
| --- | --- | --- | --- |
| `values_bindings_control_flow` | aligned current slice | `IR-VAL-001`, `IR-LIT-001`, `IR-BIND-001`, `IR-CF-001`, `IR-CF-002`, `IR-TGT-001` | Emitted snippets for Lua, JavaScript, `.ls`, and Python; no runtime check for this fixture. |
| `functions_calls_arrays_objects` | aligned current slice | `IR-FN-001`, `IR-CALL-001`, `IR-ARR-OBJ-001`, `IR-TGT-001` | Function/call/array/object shape checks across current emitters only. |
| `primitive_values_null_equivalents` | aligned current slice | `IR-VAL-001`, `IR-LIT-001`, `IR-TGT-001` | Nullish maps to Lua `nil`, JavaScript `.ls` `null`, and Python `None` in emitted snippets. |
| `arrays_objects_records_indexing` | aligned current slice | `IR-ARR-OBJ-001`, `IR-BIND-001`, `IR-TGT-001` | Zero-based helper obligations are shape-checked; no broad aliasing or identity rule. |
| `truthiness_target_native_delta` | target-native delta | `IR-VAL-GAP-003`, `IR-TGT-GAP-002` | Raw JavaScript truthiness is recorded as target-native Lua/Python behavior, not canonical truthiness. |
| `equality_and_coercion_target_delta` | target-native delta | `IR-VAL-GAP-003`, `IR-CALL-001`, `IR-TGT-GAP-002` | Loose equality and string-number coercion are not promoted beyond target-native emitted shape. |
| `portable_value_semantics_profile` | profile repaired | `IR-VAL-002`, `IR-ARR-OBJ-002`, `IR-CALL-001`, `IR-TGT-001` | `.ls` portable-profile helpers are evidenced by emitted helper snippets; broader profile semantics remain open. |
| `control_flow_nested_break_continue_early_return` | aligned current slice | `IR-CF-001`, `IR-CF-002`, `IR-FN-001`, `IR-TGT-001` | Native JavaScript plus emitted JavaScript/Python runtime checks pass; Lua/`.ls` runtime equivalence is not claimed. |
| `short_circuit_side_effects` | aligned current slice | `IR-CF-003`, `IR-SCOPE-001`, `IR-TGT-001` | Short-circuit side effects are runtime-backed for native JavaScript and emitted JavaScript/Python. |
| `control_javascript_switch_conditional` | aligned current slice | `IR-CF-004`, `IR-CF-GAP-005`, `IR-TGT-001` | Python switch emission remains a deterministic target diagnostic; `.ls` is shape-checked only. |
| `python_range_forward_control_flow` | aligned current slice | `IR-CF-002`, `IR-TGT-001` | Python native plus emitted JavaScript/Python runtime checks pass for forward range lowering. |
| `python_range_negative_step_control_flow` | aligned current slice | `IR-CF-002`, `IR-TGT-001` | Python native plus emitted JavaScript/Python runtime checks pass for negative-step range lowering. |
| `function_scope_closure_shadow_mutation` | aligned current slice | `IR-BIND-001`, `IR-SCOPE-001`, `IR-FN-001`, `IR-TGT-001` | Lexical closure mutation and shadowing are runtime-backed for native JavaScript and emitted JavaScript/Python. |
| `function_recursion_return_normalization` | aligned current slice | `IR-FN-001`, `IR-CF-001`, `IR-TGT-001` | Return normalization is scoped to named JavaScript/Python runtime paths and target text checks. |
| `function_extra_arity_target_delta` | target-native delta | `IR-FN-GAP-002`, `IR-CALL-001`, `IR-TGT-GAP-002` | Extra arguments are documented as target-native behavior, not canonical cross-target arity. |
| `unsupported_js_async_function_scope` | unsupported diagnostic | `IR-FN-GAP-003`, `IR-ERR-001`, `IR-UNSUP-001` | Async functions fail closed during compilation. |
| `unsupported_js_generator_function_scope` | unsupported diagnostic | `IR-FN-GAP-003`, `IR-ERR-001`, `IR-UNSUP-001` | Generator functions fail closed during compilation. |
| `data_nested_js_arrays_objects_records` | aligned current slice | `IR-ARR-OBJ-001`, `IR-CALL-001`, `IR-TGT-001` | Nested aggregate mutation is runtime-backed for native JavaScript and emitted JavaScript/Python. |
| `data_luascript_portable_length_slice_mutation` | profile repaired | `IR-ARR-OBJ-002`, `IR-VAL-002`, `IR-TGT-001` | Portable `.ls` aggregate helpers have emitted JavaScript/Python runtime checks. |
| `data_python_list_dict_membership_mutation` | aligned current slice | `IR-ARR-OBJ-001`, `IR-CALL-001`, `IR-TGT-001` | Python list/dict mutation and membership are runtime-backed for native Python and emitted JavaScript/Python. |
| `data_python_list_iteration_length` | aligned current slice | `IR-ARR-OBJ-001`, `IR-CALL-001`, `IR-TGT-001` | Python list iteration and length are runtime-backed for native Python and emitted JavaScript/Python. |
| `data_lua_table_record_fields` | target-native delta | `IR-ARR-OBJ-GAP-003`, `IR-TGT-GAP-002` | Lua-source table record fields are proven for emitted JavaScript only in this matrix. |
| `unsupported_js_object_spread_structure` | unsupported diagnostic | `IR-ARR-OBJ-GAP-004`, `IR-ERR-001`, `IR-UNSUP-001` | Object spread fails closed during compilation. |
| `unsupported_js_destructuring_structure` | unsupported diagnostic | `IR-ARR-OBJ-GAP-004`, `IR-ERR-001`, `IR-UNSUP-001` | Object-pattern destructuring fails closed during compilation. |
| `unsupported_target_diagnostic` | unsupported diagnostic | `IR-ERR-001`, `IR-UNSUP-001`, `IR-TGT-001` | Unsupported `sql` target fails closed at emission. |
| `unsupported_js_for_of_control_flow` | unsupported diagnostic | `IR-CF-GAP-005`, `IR-ERR-001`, `IR-UNSUP-001` | JavaScript `for-of` fails closed in this conformance surface. |
| `unsupported_python_continue_control_flow` | unsupported diagnostic | `IR-CF-GAP-005`, `IR-ERR-001`, `IR-UNSUP-001` | Python source `continue` fails closed in this conformance surface. |
| `unsupported_js_try_catch_control_flow` | unsupported diagnostic | `IR-CF-GAP-005`, `IR-ERR-001`, `IR-UNSUP-001` | Try/catch/finally remains an unsupported control-flow gap. |
| `unsupported_js_tagged_template_control_flow` | unsupported diagnostic | `IR-LIT-GAP-002`, `IR-CF-GAP-005`, `IR-ERR-001`, `IR-UNSUP-001` | Tagged template literals fail closed; plain template literal support remains separate and narrow. |
| `unsupported_undefined_value_semantic` | unsupported diagnostic | `IR-VAL-GAP-004`, `IR-ERR-001`, `IR-UNSUP-001` | JavaScript `undefined` fails closed until a canonical nullish model includes it. |
| `unsupported_nan_value_semantic` | unsupported diagnostic | `IR-VAL-GAP-004`, `IR-ERR-001`, `IR-UNSUP-001` | JavaScript `NaN` fails closed until the numeric edge model is specified. |
| `unsupported_infinity_value_semantic` | unsupported diagnostic | `IR-VAL-GAP-004`, `IR-ERR-001`, `IR-UNSUP-001` | JavaScript `Infinity` fails closed until the numeric edge model is specified. |

### Remaining V1 Evidence Gaps

- The release canonical IR transition is chosen, but original-kind-aware shape and semantic policies must expand with every promoted node family.
- Schema-valid derived artifacts and internal bridge invariants are proven for current positive conformance fixtures; general authoring validation, broader semantic fidelity, and release-blocking policy remain open.
- Artifact determinism is now checked for identical current inputs/options; canonical serialization across platforms, volatile metadata, and cross-version compatibility matrices remain open.
- Lua and `.ls` runtime equivalence are outside this conformance matrix unless a separate gate proves a named slice.
- Full value edge semantics remain open for `NaN`, infinities, `-0`, integer width, overflow, BigInt, decimal precision, object identity, aliasing, and deep equality.
- Full error semantics remain open for throw values, catch scope, stack behavior, rethrow, finalizer order, and target exception interop.
- Transition migration/deprecation rules are sealed by contract `1.0.0-rc.1`; helper versioning, per-target semantic delta tables, cross-version matrices, and wider release compatibility rules remain outside this v1 evidence map.

## Round-Trip Probe Harness

The current round-trip probe harness is `tests/roundtrip/manifest.json` plus `tests/roundtrip/roundtrip_probe.test.js`, exposed as `npm run test:roundtrip-probe`.

Scope:

- It uses `structural-ir-reparse` for tiny cases where source -> current bridge IR -> emitted target -> current bridge IR preserves normalized IR. Same-language probes preserve semantic metadata and exclude only `loc`, `range`, `raw`, and generated `id`; cross-language probes explicitly exclude source-specific metadata.
- It uses `runtime-output-equivalence` for tiny cases where source runtime and emitted target runtime agree on stdout, but emitted target helpers or idioms do not yet support honest IR identity.
- It currently covers JavaScript -> JavaScript, JavaScript -> `.ls`, `.ls` -> JavaScript, Python -> Python, and Lua -> Lua structural IR reparse; JavaScript -> Python and Python -> JavaScript runtime-output equivalence.

Boundary:

- Structural IR reparse is not source text identity.
- Runtime-output equivalence is not full semantic equivalence.
- The harness is a probe for future Denali evidence shape, not a certification suite.

## V0 Release-Blocking Gaps

These gaps block this draft from becoming a canonical `1.0` IR semantics contract:

1. Expand the chosen release-shape validator and compatibility evidence with every promoted original node kind.
2. Reconcile the schema enum, `NodeCategory`, broader validators, and live parser/lowerer vocabularies beyond the current derived-fixture surface.
3. Add migration rules before changing the exact kind/field alias registries or transition contract.
4. Add value/operator/control-flow/function/call/object/error edge matrices with positive, negative, and target-runtime expectations.
5. Decide whether every language-completion gate must emit and preserve a schema-valid canonical artifact as part of `1.0` bidirectionality.
6. Expand `npm run test:roundtrip-probe` from tiny structural IR reparse probes into broader declared-equivalence coverage.
7. Broaden explicit round-trip source identity beyond the current 12 positive normalized `.ls` source/parser-owned-AST/IR fixtures before claiming broad source-preserving bidirectionality.
8. Add semantic-equivalence matrices with target deltas before claiming behavior beyond stdout/diagnostic fixture agreement.

## Minimum Evidence Before Promotion

This draft can move toward `1.0` only after all relevant clauses are either `EVIDENCED` or explicitly `OUT OF V0`, and after at least these gates pass on the final text and final code:

```bash
npm run status:check
npm run claims:check
npm run stubs:check
npm run test:ir-conformance
npm run test:schema-artifact-map
npm run test:ir-compatibility-bridge
npm run archive:audit
npm run ir:validate:schema
npm run ir:validate
npm run ir:golden:check
npm run ir:golden:parity
```
