# LUASCRIPT Canonical IR Semantics Inventory

Status: active inventory
Last updated: 2026-07-14
Track: Denali canonical `1.0`, criterion `1.0-IR-SEMANTICS`

This document inventories the current canonical IR surfaces as they exist in the repo. It is descriptive, not a release promotion and not a refactor plan. It records what the schema, lowerers, emitters, golden tests, and language-completion harness prove today, then names the semantics gaps that must be closed before canonical `1.0`.

## Evidence Read

| Surface | Files read | Current role |
| --- | --- | --- |
| Published latest schema | `docs/canonical_ir.schema.json` | AJV-validated schema used by golden checks and the default schema smoke |
| Frozen schema copy | `docs/schema/1.0.0/canonical_ir.schema.json`, `docs/schema/1.x/canonical_ir.schema.json` | Versioned compatibility copy; `1.x` aliases `1.0.0` |
| Node classes and builders | `src/ir/nodes.js`, `src/ir/builder.js`, `src/ir/canonical_ir_schema.js` | Implementation vocabularies and convenience constructors |
| Parser/lowerer pipeline | `src/ir/pipeline.js`, `src/ir/lowerer.js`, `src/ir/lowerer-enhanced.js`, `src/ir/normalizer.js` | JavaScript parser to consolidated IR route used by IR tests and goldens |
| Emitters and generators | `src/ir/emitter.js`, `src/ir/emitter-enhanced.js`, `src/compilers/ir-to-*.js` | Lua and target-specific code generation from mixed IR shapes |
| Validators | `src/ir/validator.js`, `src/ir/validators/validator.js`, `scripts/validate_ir_schema.js` | Lightweight invariants plus AJV schema smoke, not one unified conformance gate |
| Golden IR tests | `tests/golden_ir/*.json`, `tests/golden_ir/check_golden_ir.js`, `tests/golden_ir/compare_pipeline_to_goldens.js` | 16 committed IR snapshots and coarse shape parity seeds |
| Language completion harness | `tests/language_completion/bidirectional_harness.js`, `tests/language_completion/manifests/*.json` | 26 manifests, 413 fixtures, 159 expected-failure fixtures, 62 skip-native fixtures |

## Current IR Surfaces

LUASCRIPT currently has more than one live IR shape. That is the central `1.0` semantics finding.

| Surface | Shape | Primary users | Status |
| --- | --- | --- | --- |
| Consolidated schema artifact | `{ schemaVersion, module: { body: [nodeId] }, nodes: { nodeId: node }, controlFlowGraphs }` | `parseAndLower`, `tests/golden_ir`, `src/ir/emitter.js`, schema docs | Active, but schema and live lowerer output do not fully agree |
| Legacy object-tree IR | `{ kind: "Program", body: [node] }` with nested child nodes | `CoreLanguageBridge`, `src/compilers/*-to-ir.js`, `src/compilers/ir-to-*.js`, language completion harness | Active for language qualification |
| Node class vocabulary | `src/ir/nodes.js` classes and `NodeCategory` strings | `IRBuilder`, old validators, enhanced lowerer/emitter | Active implementation vocabulary, broader than schema enum |
| Conceptual type vocabulary | `src/ir/canonical_ir_schema.js` with `Module`, `Function`, `Class`, `Struct`, etc. | Phase B/type-system reference code | Legacy/conceptual, not the enforced schema enum |

The current language-completion bridge uses the legacy object-tree IR surface, not only the consolidated schema artifact. Therefore current "bidirectional" language gates prove named fixture behavior through `compileToIR -> emitFromIR -> runtime`, but they are not yet a formal proof that every supported language traverses one schema-valid canonical IR artifact with source-preserving reverse semantics.

## Schema Enum Inventory

The latest published schema enum in `docs/canonical_ir.schema.json` contains 40 node kinds.

| Kind | Current semantics inventory | Notes |
| --- | --- | --- |
| `Identifier` | Names a binding or property-like symbol. | Live in schema, node classes, lowerers, emitters, and goldens. Binding identity is not yet formalized beyond names and optional `binding`. |
| `Literal` | Represents primitive values and raw/literal metadata. | Target emitters map strings, numbers, booleans, null/nil/None differently. Value model needs formalization. |
| `BinaryExpression` | Represents binary operators and many normalized logical/math forms. | Operators include arithmetic, comparison, logical, nullish, bitwise, `concat`, and target helper-triggering metadata. Operator set is split across validators and emitters. |
| `LogicalExpression` | Intended short-circuit logical expression. | In current lowerers, logical expressions are often lowered through `BinaryExpression`, so the kind is schema-visible but not consistently emitted by the builder path. |
| `AssignmentExpression` | Assigns or compound-assigns a target. | Used for normal assignments and, in some paths, update-expression lowering. Index assignment can trigger target helpers. |
| `UpdateExpression` | Prefix/postfix `++` and `--`. | Schema, validators, emitters, and golden evidence exist, but `IRBuilder.updateExpression` currently stores an `AssignmentExpression` with update metadata. |
| `ConditionalExpression` | Ternary expression with test/consequent/alternate semantics. | Lua emission has false/nil preservation concerns and different emitters use `condition` versus `test`. |
| `CallExpression` | Calls a callee with ordered arguments. | Fields are split between `args` and `arguments`. Metadata carries target-specific builtins such as Python, C-like, and LUASCRIPT helper calls. |
| `MemberExpression` | Property or computed access. | Index base, `.length`, optional access, and string/list behavior are target-specific and often mediated by helpers. |
| `NewExpression` | Constructor call semantics. | Present in schema, emitters, and one golden, but builder/compiler paths commonly model `new` as `CallExpression` with `metadata.isNew`. |
| `ArrayExpression` | Ordered list literal with nullable holes. | Lua target maps to tables and interacts with zero-based versus one-based indexing adapters. |
| `ObjectExpression` | Key/value object literal. | Object shape is target-specific: Lua tables, JavaScript objects, Python dictionaries, C/C++ records when typed. |
| `TemplateLiteral` | String interpolation over quasis and expressions. | Current routes include direct template handling and alternate lowering to binary concat. `TemplateElement` is implementation-resident but not in the schema enum. |
| `ArrowFunctionExpression` | Arrow function expression. | Schema and golden evidence exist, but current lowerers frequently lower to `FunctionDeclaration` with `arrow`/`isExpression` flags. Lexical `this` semantics are not formalized. |
| `FunctionDeclaration` | Named or anonymous function with params/body plus async/generator/arrow flags. | Core function node for both declarations and some expression forms. CFG metadata exists for the parser/lowerer path. |
| `VariableDeclaration` | Declaration group with `declarationKind` and declarations. | Current live parser/lowerer output embeds `VariableDeclarator` objects; published schema expects declaration items with `id`. This is a schema/live-output mismatch. |
| `BlockStatement` | Ordered statement list. | Consolidated artifacts use statement node ids; legacy object trees use nested statement nodes. |
| `ExpressionStatement` | Statement wrapper around an expression. | Fields use `expression`; statement/expression boundary is target-sensitive for assignment and update expressions. |
| `ReturnStatement` | Returns an optional expression. | Field alias drift exists: `value` in node classes and many emitters, `argument` in schema examples and some support code. |
| `IfStatement` | Branches on a condition/test, with consequent and optional alternate. | Field alias drift exists: `condition` in node classes, `test` in schema/golden style. Truthiness adapters alter target obligations. |
| `SwitchStatement` | Switch/case control flow. | Schema names the node, but `SwitchCase` is implementation-resident. Some target paths lower/fallback to if/elseif chains. |
| `ForStatement` | Init/test/update/body loop. | Field alias drift exists: `condition` versus `test`. Some targets lower to `while` with update insertion. |
| `ForOfStatement` | Iterates values from an iterable/source. | Lua emission commonly uses `pairs`, and async `await` variants require helpers. Iteration ordering is not yet formalized. |
| `WhileStatement` | Pre-test loop. | Continue behavior can require Lua labels/goto or target-specific update insertion. |
| `DoWhileStatement` | Post-test loop. | Lua emission uses `repeat ... until not(condition)`. Exact continue semantics need formal tests. |
| `BreakStatement` | Exits nearest loop/switch. | Label semantics are not currently formalized. |
| `ContinueStatement` | Continues nearest loop. | Lua target may require `goto`; policies can require or forbid `lua.goto`. |
| `ThrowStatement` | Raises an error/exception. | Lua maps to `error(...)`; other targets differ. Exception value model is open. |
| `TryStatement` | Protected block with optional handler/finalizer. | `CatchClause` and `FinallyClause` are implementation-resident. Lua lowering/emission uses protected calls. |
| `ImportDeclaration` | Module import. | Node class exists, but current language-completion support is narrow and not a broad module-system contract. |
| `ExportDeclaration` | Module export. | Node class exists, but package/runtime export semantics are not formalized for `1.0`. |
| `ClassDeclaration` | Class declaration. | Class support is uneven; core Lua emitter can explicitly reject class-like functions unless class lowering has run. |
| `ClassBody` | Ordered class element list. | Works only where class lowering/emitter support agrees. |
| `MethodDefinition` | Class method/getter/setter/constructor slot. | Method dispatch, `this`/`self`, static behavior, and inheritance need target obligations. |
| `Property` | Object or pattern property. | Used for object literals and destructuring; shorthand/computed flags are implementation details not fully schema-constrained. |
| `ObjectPattern` | Destructuring object pattern. | Supported in lowerer/emitter slices, with rest/default behavior only partially covered. |
| `ArrayPattern` | Destructuring array pattern. | Supported in lowerer/emitter slices, with holes/rest/default/nesting behavior partially covered. |
| `RestElement` | Rest binding or spread-like capture in patterns/params. | Rest element is schema-visible; `SpreadElement` is implementation-resident. |
| `AssignmentPattern` | Pattern default value. | Used in params and destructuring; default evaluation semantics need formal ordering rules. |
| `ProgramComment` | Comment-retention node. | Schema-only in the current inventory; no matching `NodeCategory` class was found. |

## Implementation-Resident Node Kinds Outside The Latest Schema Enum

These node kinds appear in node classes, validators, lowerers, emitters, or tests but are not in the latest schema enum.

| Kind | Current role | 1.0 concern |
| --- | --- | --- |
| `Program` | Legacy object-tree root for source compilers and target visitors. | Need either formal legacy-surface boundary or migration into consolidated artifacts. |
| `Parameter` | Function parameter node in builder and legacy IR. | Live parser/lowerer output can fail the published schema enum because `Parameter` is not schema-listed. |
| `VariableDeclarator` | Per-binding declaration object/node; marked deprecated alias in `nodes.js` but still live. | Schema and builder disagree on declaration representation. |
| `UnaryExpression` | Unary operators such as `!`, `-`, `typeof`, `void`, `delete`, `await`. | Live validators/emitters support it, but latest schema enum omits it. |
| `FunctionExpression` | Anonymous/named function expression. | Current lowerers/emitters support it, but schema omits it and sometimes collapses it into `FunctionDeclaration`. |
| `SwitchCase` | Individual switch case. | Needed for `SwitchStatement`, but omitted from schema enum. |
| `CatchClause` | Try-handler node. | Needed for `TryStatement`, but omitted from schema enum. |
| `FinallyClause` | Try-finalizer node in node classes/emitter. | Needed for full try/finally semantics, but omitted from schema enum. |
| `ForInStatement` | Key iteration statement. | Live in enhanced lowerer/emitter and validators, omitted from schema enum. |
| `AwaitExpression` | Await expression. | Live in async tests/lowerers/emitters, omitted from schema enum. |
| `YieldExpression` | Generator yield expression. | Live in lowerers/emitters, omitted from schema enum. |
| `AsyncFunctionDeclaration` | Async function node class. | Live in node classes/emitters, but sometimes represented by `FunctionDeclaration.async`. |
| `GeneratorDeclaration` | Generator function node class. | Live in node classes/emitters, but sometimes represented by `FunctionDeclaration.generator`. |
| `ClassExpression` | Class as expression. | Live in lowerer/node classes, omitted from schema enum. |
| `ThisExpression` | Receiver/self expression. | Live in lowerers/emitters, omitted from schema enum. |
| `Super` | Super receiver. | Live in lowerers/node classes, omitted from schema enum. |
| `SpreadElement` | Spread element in calls/arrays. | Live in lowerers/emitters, omitted from schema enum. |
| `TemplateElement` | Template quasi segment. | Live in node classes/lowerers/validators, omitted from schema enum. |
| `TaggedTemplateExpression` | Tagged template expression. | Node class exists, while core compiler currently rejects tagged templates. |
| `ImportSpecifier` | Import binding detail. | Node class exists, omitted from schema enum. |
| `ExportSpecifier` | Export binding detail. | Node class exists, omitted from schema enum. |

## Ambiguous Or Duplicate Behavior

- Current 1.0 semantics blocker: the live parser/lowerer path can pass lightweight invariants while failing the published JSON Schema enum for common nodes such as `Parameter` and `VariableDeclarator`.
- `docs/schema/1.0.0/canonical_ir.schema.json` does not match `docs/canonical_ir.schema.json`: the frozen copy's `kind` field is a self-reference and does not carry the latest 40-kind enum.
- The language-completion bridge uses a legacy object-tree IR surface, not only the consolidated schema artifact.
- `src/ir/canonical_ir_schema.js` defines a separate conceptual vocabulary (`Module`, `Function`, `Class`, `Struct`, `Enum`, `Interface`, etc.) that is not the same as the current schema enum.
- Field aliases are widespread: `parameters`/`params`, `args`/`arguments`, `value`/`argument`, `condition`/`test`, `loc`/`span`, `metadata`/`meta`, and `varKind`/`declarationKind`.
- `LogicalExpression`, `UpdateExpression`, `NewExpression`, and `ArrowFunctionExpression` are schema-visible but often lowered through other node kinds or flags.
- `VariableDeclaration.declarations` is not settled: schema describes declaration entries with an `id`, while live output often embeds a `VariableDeclarator` object directly.
- Golden parity is shape-oriented and intentionally coarse; it ignores several counts and compares only projected kind presence for selected seeds.
- CFG `entry`/`exit` block kinds and declaration `const`/`let` values are not node kinds, but naive `kind` scans pick them up.
- Target helpers encode semantic repairs for zero-based indexing, `.length`, `.slice`, JS truthiness, string coercion, Python/C-like helper behavior, and packed multiple returns. These are behavior-critical but not yet formalized as IR semantics.

## Target-Specific Behavior Inventory

| Behavior | Current target reality | 1.0 documentation need |
| --- | --- | --- |
| Truthiness | Lua/Python LUASCRIPT meta profiles can request JS-like truthiness helpers. | Define value model per profile and target obligation. |
| Indexing | Lua, `.ls`, Python, JavaScript, C-like slices use a mix of native indexes and helper-based zero-based repairs. | Define index-base semantics and required helpers by source/target/profile. |
| Length | `.length`, `len`, `#`, `.size`, and helper calls are source/target-specific. | Define collection/string length semantics and unsupported cases. |
| String concatenation | `+`, `concat`, `..`, and explicit string coercion helpers differ by route. | Define operator typing/coercion and when helpers are mandatory. |
| Continue | Lua may need `goto` labels; Python for-loop lowering may inject pending updates before `continue`. | Define loop-control obligations and policy errors. |
| Try/catch/finally | Lua uses protected calls; handler/finalizer representation varies by emitter. | Define error value, finalizer ordering, and target limits. |
| Classes | Some class slices lower to functions/records; core Lua emission can reject class-like nodes without lowering. | Define class support boundary or exclude classes from first `1.0` IR support. |
| Async/generator | Node classes and emitters have async/generator support, but schema enum omits those nodes. | Decide whether async/generator are `1.0` nodes or excluded/experimental. |
| Modules | Import/export node classes exist, but current package/runtime module semantics are not release-bound. | Define module contract or exclude from `1.0` support. |
| C/C++/C# records | Object literals can require known record types and target-specific helper metadata. | Define typed record obligation and unsupported dynamic object cases. |

## Current Evidence Boundary

- Schema smoke: `npm run ir:validate:schema` passes for a small builder-produced schema-friendly artifact.
- Lightweight invariant smoke: `npm run ir:validate` passes and reports a CFG count.
- Golden validation: `tests/golden_ir/check_golden_ir.js` validates committed goldens against AJV schema plus lightweight invariants.
- Golden parity: `tests/golden_ir/compare_pipeline_to_goldens.js` compares selected pipeline outputs to projected golden shapes, not exhaustive semantics.
- Language completion: the 26 manifest files exercise native runtime behavior plus emitted target runtime behavior for named slices, but through the legacy object-tree bridge rather than a single schema-valid artifact.
- Conformance skeleton: `npm run test:ir-conformance` uses `tests/conformance/manifest.json` to run tiny emitted-output, runtime-check, value-semantics, control-flow, function/scope, data-structure, and unsupported-diagnostic checks over the current stable bridge emitters. The current value matrix covers numbers, strings, booleans, null/nil/None equivalents, arrays, objects/records, truthiness, equality, coercion, indexing, `.ls` portable-profile repairs, and fail-closed diagnostics for `undefined`, `NaN`, and `Infinity`. The current control-flow matrix covers if/else, while, numeric for, Python range lowering, break, continue, nested loops, short-circuiting, early returns, switch, conditional expressions, target-specific lowering, JavaScript/Python native and emitted runtime checks, and fail-closed diagnostics for JavaScript `for-of`, JavaScript `try/catch`, JavaScript tagged template literals, and Python source `continue`; the JavaScript switch/conditional slice checks emitted `.ls` shape without runtime promotion and records Python switch emission as a target diagnostic. The current function/scope matrix covers lexical closures, shadowing, mutation through closures, recursion, nested functions, return normalization, JavaScript/Python native and emitted runtime checks, fail-closed diagnostics for JavaScript async/generator functions, and an explicit extra-arity target-native delta. The current data-structure matrix covers array/object mutation, nested reads/writes, length, slicing, membership, Python list iteration, Lua table record fields, object literals, JavaScript/Python runtime checks where those paths pass, fail-closed diagnostics for JavaScript object spread and destructuring, and an explicit Lua-source table-indexing-to-Python target delta. It is not a certification suite, does not prove Lua/`.ls` runtime equivalence in this matrix, and does not resolve the schema/live-output split.

## 1.0 Semantics Work Queue

1. Choose the release canonical IR surface: consolidated schema artifact, legacy object tree, or a documented dual-surface transition.
2. Make `docs/canonical_ir.schema.json`, `docs/schema/1.0.0/canonical_ir.schema.json`, `src/ir/nodes.js`, and `src/ir/validator.js` agree on the supported `1.0` node set.
3. Add schema coverage for every release-supported live kind or explicitly mark it experimental/outside `1.0`.
4. Define field aliases and migrate or document compatibility rules for `parameters`/`params`, `value`/`argument`, `condition`/`test`, and related pairs.
5. Define formal semantics for value model, operator model, control flow, errors, module/class boundaries, target helpers, determinism, and serialization.
6. Convert golden parity into conformance-style evidence with positive, negative, target-runtime, and schema-validity expectations.
7. Decide whether language-completion manifests must emit a schema-valid IR artifact as part of the `1.0` gate.

No runtime, compiler, lowerer, emitter, schema, or package API behavior was changed by this inventory pass.
